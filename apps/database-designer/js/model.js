/*
 * model.js — Lógica pura del modelo (sin DOM).
 * Funciona como <script> clásico (expone window.DBD) y como módulo CommonJS en Node (tests).
 *
 * Modelo: { tables: [...], relations: [...] }
 *  table    { id, name, x, y, color, junction?: groupId, fields: [...] }
 *  field    { id, name, type, description, defaultValue, pk, nn, ai, uq, fk }
 *  relation { id, type: '1:1'|'1:N', sourceTable, sourceField, targetTable, targetField,
 *             onDelete, onUpdate, created, uqAdded, group }
 *
 * Convención: el lado "1" es el origen (clave PK/UNIQUE) y la FK vive en la tabla destino.
 * Una relación N:M se guarda como una tabla puente (table.junction = group) y dos
 * relaciones 1:N que comparten el mismo `group`.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DBD = Object.assign(root.DBD || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TYPES = ['INT', 'BIGINT', 'VARCHAR(255)', 'TEXT', 'DECIMAL(10,2)', 'DATE', 'DATETIME', 'BOOLEAN', 'UUID'];
  const INT_TYPES = ['INT', 'BIGINT'];
  const RELATION_TYPES = ['1:1', '1:N', 'N:M'];
  const ACTIONS = ['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL'];
  const DIALECTS = ['mysql', 'postgres', 'sqlite'];
  const COLORS = ['#1684e8', '#07865f', '#8548d9', '#e87917', '#d34672', '#0c9cb5'];
  const JUNCTION_COLOR = '#6b7a90';

  const getTable = (model, id) => model.tables.find((t) => t.id === id);
  const getField = (table, id) => (table ? table.fields.find((f) => f.id === id) : undefined);

  function validateFieldDefault(field) {
    if (field.defaultValue === null || field.defaultValue === undefined) return null;
    const value = String(field.defaultValue);
    if (value.length > 256 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
      return 'El valor por defecto supera el límite o contiene caracteres no permitidos';
    }
    if (field.ai) return 'Un campo autoincremental no puede tener un valor por defecto';
    if (INT_TYPES.includes(field.type)) {
      return /^[-+]?\d+$/.test(value) ? null : 'El valor por defecto debe ser numérico';
    }
    if (field.type.startsWith('DECIMAL')) {
      return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(value)
        ? null
        : 'El valor por defecto debe ser numérico';
    }
    if (field.type === 'BOOLEAN') {
      return /^(?:true|false|0|1)$/i.test(value) ? null : 'El valor por defecto booleano debe ser true, false, 0 o 1';
    }
    if (/^CURRENT_TIMESTAMP(?:\(\))?$/i.test(value) && field.type !== 'DATE' && field.type !== 'DATETIME') {
      return 'CURRENT_TIMESTAMP solo aplica a campos de fecha/hora';
    }
    return null;
  }

  /* ---------- Utilidades de nombres ---------- */

  function uniqueName(existing, base) {
    const used = new Set(existing.map((n) => String(n).toLowerCase()));
    if (!used.has(base.toLowerCase())) return base;
    let i = 2;
    while (used.has((base + '_' + i).toLowerCase())) i++;
    return base + '_' + i;
  }

  // Singular aproximado para sugerir nombres de FK (clientes → cliente, ciudades → ciudad).
  function singular(name) {
    const n = String(name);
    const rules = [
      [/iones$/i, 'ion'],
      [/ores$/i, 'or'],
      [/ades$/i, 'ad'],
      [/ces$/i, 'z'],
      [/([^s])s$/i, '$1'],
    ];
    for (const [re, rep] of rules) if (re.test(n)) return n.replace(re, rep);
    return n;
  }

  function suggestFkName(table, field) {
    const base = singular(table.name);
    return field.name.toLowerCase() === 'id' ? base + '_id' : base + '_' + field.name;
  }

  /* ---------- Consultas ---------- */

  const isReferencedSource = (model, tid, fid) =>
    model.relations.some((r) => r.sourceTable === tid && r.sourceField === fid);
  const isFkTarget = (model, tid, fid) =>
    model.relations.some((r) => r.targetTable === tid && r.targetField === fid);

  /* ---------- Importación segura ---------- */

  // Valida y normaliza datos externos (JSON importado / autoguardado).
  // Regenera todos los ids con makeId, por lo que ningún id externo llega al DOM.
  function sanitizeModel(data, makeId) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.tables) || !Array.isArray(data.relations)) {
      throw new Error('Formato JSON no válido');
    }
    if (data.tables.length > 300) throw new Error('El modelo tiene demasiadas tablas (máx. 300)');

    const warnings = [];
    const str = (v, d) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 64) : d);
    const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
    const tMap = new Map();
    const fMap = new Map();
    const gMap = new Map();
    const group = (old) => {
      const k = String(old);
      if (!gMap.has(k)) gMap.set(k, makeId('g'));
      return gMap.get(k);
    };

    const tables = [];
    data.tables.forEach((t, i) => {
      if (!t || typeof t !== 'object') return;
      const oldT = String(t.id);
      const id = makeId('t');
      tMap.set(oldT, id);
      const fields = (Array.isArray(t.fields) ? t.fields : [])
        .filter((f) => f && typeof f === 'object')
        .slice(0, 200)
        .map((f) => {
          const fid = makeId('f');
          fMap.set(oldT + '\u0000' + String(f.id), fid);
          let type = f.type;
          if (!TYPES.includes(type)) {
            warnings.push(`Tipo no reconocido "${String(type).slice(0, 30)}" reemplazado por VARCHAR(255)`);
            type = 'VARCHAR(255)';
          }
          const description = typeof f.description === 'string' ? f.description.trim() : '';
          if (description.length > 500) warnings.push(`${String(t.name || 'tabla')}.${String(f.name || 'campo')}: descripción truncada a 500 caracteres`);
          const rawDefault = typeof f.defaultValue === 'string'
            ? f.defaultValue
            : typeof f.defaultValue === 'number' || typeof f.defaultValue === 'boolean'
              ? String(f.defaultValue)
              : null;
          if (rawDefault && rawDefault.length > 256) warnings.push(`${String(t.name || 'tabla')}.${String(f.name || 'campo')}: valor por defecto truncado a 256 caracteres`);
          return {
            id: fid,
            name: str(f.name, 'campo'),
            type,
            description: description.slice(0, 500),
            defaultValue: rawDefault === null ? null : rawDefault.slice(0, 256),
            pk: !!f.pk,
            nn: !!f.nn || !!f.pk,
            ai: !!f.ai,
            uq: !!f.uq,
            fk: false,
          };
        });
      if (!fields.length) {
        fields.push({ id: makeId('f'), name: 'id', type: 'INT', description: '', defaultValue: null, pk: true, nn: true, ai: true, uq: false, fk: false });
      }
      tables.push({
        id,
        name: str(t.name, 'tabla'),
        x: num(t.x),
        y: num(t.y),
        color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : COLORS[i % COLORS.length],
        junction: t.junction ? group(t.junction) : null,
        fields,
      });
    });

    const relations = [];
    data.relations.forEach((r) => {
      if (!r || typeof r !== 'object') return;
      const st = tMap.get(String(r.sourceTable));
      const tt = tMap.get(String(r.targetTable));
      const sf = fMap.get(String(r.sourceTable) + '\u0000' + String(r.sourceField));
      const tf = fMap.get(String(r.targetTable) + '\u0000' + String(r.targetField));
      if (!st || !tt || !sf || !tf) {
        warnings.push('Se omitió una relación con referencias rotas');
        return;
      }
      relations.push({
        id: makeId('r'),
        type: r.type === '1:1' ? '1:1' : '1:N',
        sourceTable: st,
        sourceField: sf,
        targetTable: tt,
        targetField: tf,
        onDelete: ACTIONS.includes(r.onDelete) ? r.onDelete : 'NO ACTION',
        onUpdate: ACTIONS.includes(r.onUpdate) ? r.onUpdate : 'NO ACTION',
        created: !!r.created,
        uqAdded: !!r.uqAdded,
        group: r.group ? group(r.group) : null,
      });
    });

    const model = { tables, relations };
    // Consistencia: grupos sin tabla puente (y viceversa) y banderas FK derivadas de las relaciones.
    for (const r of relations) if (r.group && !tables.some((t) => t.junction === r.group)) r.group = null;
    for (const t of tables) if (t.junction && !relations.some((r) => r.group === t.junction)) t.junction = null;
    for (const r of relations) {
      const f = getField(getTable(model, r.targetTable), r.targetField);
      if (f) f.fk = true;
    }

    return { tables, relations, dialect: DIALECTS.includes(data.dialect) ? data.dialect : null, warnings };
  }

  /* ---------- Validación ---------- */

  function validateModel(model) {
    const issues = [];
    const tableNames = new Set();
    for (const t of model.tables) {
      const k = t.name.toLowerCase();
      if (tableNames.has(k)) issues.push(`Nombre de tabla duplicado: "${t.name}"`);
      tableNames.add(k);
      const fieldNames = new Set();
      for (const f of t.fields) {
        const fk = f.name.toLowerCase();
        if (fieldNames.has(fk)) issues.push(`Campo duplicado en "${t.name}": "${f.name}"`);
        fieldNames.add(fk);
        const defaultError = validateFieldDefault(f);
        if (defaultError) issues.push(`${t.name}.${f.name}: ${defaultError}`);
      }
      if (!t.fields.some((f) => f.pk)) issues.push(`La tabla "${t.name}" no tiene clave primaria`);
    }
    for (const r of model.relations) {
      const a = getTable(model, r.sourceTable);
      const b = getTable(model, r.targetTable);
      const sf = getField(a, r.sourceField);
      const tf = getField(b, r.targetField);
      if (!a || !b || !sf || !tf) {
        issues.push('Hay una relación con referencias rotas');
        continue;
      }
      if (!(sf.pk || sf.uq)) issues.push(`${a.name}.${sf.name} es referenciado pero no es PK ni UNIQUE`);
      if (sf.type !== tf.type) {
        issues.push(`Tipos distintos: ${a.name}.${sf.name} (${sf.type}) y ${b.name}.${tf.name} (${tf.type})`);
      }
      if (r.onDelete === 'SET NULL' && tf.nn) {
        issues.push(`${b.name}.${tf.name}: ON DELETE SET NULL requiere que el campo admita NULL`);
      }
    }
    return issues;
  }

  /* ---------- Operaciones sobre relaciones ---------- */

  // Crea una relación 1:1, 1:N o N:M. Lanza Error (mensaje en español) si no es válida.
  // No modifica el modelo hasta haber validado todo.
  function createRelation(model, opts, makeId) {
    const type = opts.type;
    if (!RELATION_TYPES.includes(type)) throw new Error('Tipo de relación no válido');
    const a = getTable(model, opts.sourceTable);
    const b = getTable(model, opts.targetTable);
    if (!a || !b) throw new Error('Tabla no encontrada');
    const sf = getField(a, opts.sourceField);
    if (!sf) throw new Error('Campo origen no encontrado');
    if (!(sf.pk || sf.uq)) throw new Error('El campo origen debe ser PK o UNIQUE');
    const onDelete = ACTIONS.includes(opts.onDelete) ? opts.onDelete : 'NO ACTION';
    const onUpdate = ACTIONS.includes(opts.onUpdate) ? opts.onUpdate : 'NO ACTION';

    if (type === 'N:M') return createManyToMany(model, opts, { a, b, sf, onDelete, onUpdate }, makeId);

    const fkName = String(opts.fkName || '').trim();
    if (!fkName) throw new Error('Indica el nombre del campo FK');
    if (fkName.length > 64) throw new Error('El nombre del campo FK es demasiado largo');

    let tf = b.fields.find((f) => f.name.toLowerCase() === fkName.toLowerCase());
    if (tf) {
      if (tf === sf) throw new Error('El campo FK no puede ser el mismo campo que referencia');
      if (tf.type !== sf.type) {
        throw new Error(`El campo "${tf.name}" ya existe con tipo ${tf.type}; debe ser ${sf.type}`);
      }
      if (isFkTarget(model, b.id, tf.id)) throw new Error(`El campo "${tf.name}" ya es una clave foránea`);
    }

    const optional = !!opts.optional || onDelete === 'SET NULL';
    const rel = {
      id: makeId('r'),
      type,
      sourceTable: a.id,
      sourceField: sf.id,
      targetTable: b.id,
      targetField: null,
      onDelete,
      onUpdate,
      created: false,
      uqAdded: false,
      group: null,
    };
    if (!tf) {
      tf = { id: makeId('f'), name: fkName, type: sf.type, description: '', defaultValue: null, pk: false, nn: !optional, ai: false, uq: false, fk: true };
      b.fields.push(tf);
      rel.created = true;
    } else if (optional && !tf.pk) {
      tf.nn = false;
    }
    tf.fk = true;
    if (type === '1:1' && !tf.pk && !tf.uq) {
      tf.uq = true;
      rel.uqAdded = true;
    }
    rel.targetField = tf.id;
    model.relations.push(rel);
    return { relations: [rel], table: null };
  }

  function createManyToMany(model, opts, ctx, makeId) {
    const { a, b, sf, onDelete, onUpdate } = ctx;
    const tf = getField(b, opts.targetField);
    if (!tf) throw new Error('Campo destino no encontrado');
    if (!(tf.pk || tf.uq)) throw new Error('El campo destino debe ser PK o UNIQUE');
    const jName = String(opts.junctionName || '').trim() || `${a.name}_${b.name}`;
    if (jName.length > 64) throw new Error('El nombre de la tabla puente es demasiado largo');
    if (model.tables.some((t) => t.name.toLowerCase() === jName.toLowerCase())) {
      throw new Error(`Ya existe una tabla llamada "${jName}"`);
    }
    const g = makeId('g');
    const fkA = suggestFkName(a, sf);
    const fkB = uniqueName([fkA], suggestFkName(b, tf));
    const key = (name, type) => ({
      id: makeId('f'), name, type, description: '', defaultValue: null, pk: true, nn: true, ai: false, uq: false, fk: true,
    });
    const j = {
      id: makeId('t'),
      name: jName,
      x: Math.round((a.x + b.x) / 2),
      y: Math.round((a.y + b.y) / 2) + 220,
      color: JUNCTION_COLOR,
      junction: g,
      fields: [key(fkA, sf.type), key(fkB, tf.type)],
    };
    const link = (src, srcField, jf) => ({
      id: makeId('r'),
      type: '1:N',
      sourceTable: src.id,
      sourceField: srcField.id,
      targetTable: j.id,
      targetField: jf.id,
      onDelete,
      onUpdate,
      created: true,
      uqAdded: false,
      group: g,
    });
    const rels = [link(a, sf, j.fields[0]), link(b, tf, j.fields[1])];
    model.tables.push(j);
    model.relations.push(...rels);
    return { relations: rels, table: j };
  }

  // Elimina todo un grupo N:M (relaciones + tabla puente).
  function removeGroup(model, g) {
    model.relations.filter((r) => r.group === g).forEach((r) => dropRelation(model, r.id, true));
    model.tables = model.tables.filter((t) => t.junction !== g);
  }

  // Elimina una relación y limpia la columna FK que había creado (o su marca FK/UNIQUE).
  function dropRelation(model, rid, skipGroup) {
    const r = model.relations.find((x) => x.id === rid);
    if (!r) return;
    if (r.group && !skipGroup) {
      removeGroup(model, r.group);
      return;
    }
    model.relations = model.relations.filter((x) => x.id !== rid);
    const t = getTable(model, r.targetTable);
    const f = getField(t, r.targetField);
    if (!t || !f || isFkTarget(model, t.id, f.id)) return;
    f.fk = false;
    if (r.created && !f.pk && t.fields.length > 1) t.fields = t.fields.filter((x) => x !== f);
    else if (r.uqAdded) f.uq = false;
  }

  function updateRelation(model, rid, changes) {
    const relation = model.relations.find((item) => item.id === rid);
    if (!relation) throw new Error('Relación no encontrada');
    const targets = relation.group
      ? model.relations.filter((item) => item.group === relation.group)
      : [relation];
    const type = changes.type === undefined ? relation.type : changes.type;
    if (!relation.group && !['1:1', '1:N'].includes(type)) throw new Error('Tipo de relación no válido');

    const actions = ['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL'];
    const onDelete = changes.onDelete === undefined ? relation.onDelete : changes.onDelete;
    const onUpdate = changes.onUpdate === undefined ? relation.onUpdate : changes.onUpdate;
    if (!actions.includes(onDelete) || !actions.includes(onUpdate)) throw new Error('Acción referencial no válida');

    const targetFields = targets.map((item) => getField(getTable(model, item.targetTable), item.targetField));
    if (targetFields.some((field) => !field)) throw new Error('Campo destino de relación no encontrado');
    if (onDelete === 'SET NULL' && targetFields.some((field) => field.pk)) {
      throw new Error('ON DELETE SET NULL no se puede aplicar a una clave primaria');
    }

    if (!relation.group) {
      const target = targetFields[0];
      if (type === '1:1' && !target.pk && !target.uq) {
        target.uq = true;
        relation.uqAdded = true;
      } else if (type === '1:N' && relation.uqAdded) {
        target.uq = false;
        relation.uqAdded = false;
      }
      relation.type = type;
      if (changes.optional !== undefined && !target.pk) target.nn = !changes.optional;
    }
    for (const item of targets) {
      item.onDelete = onDelete;
      item.onUpdate = onUpdate;
      const field = getField(getTable(model, item.targetTable), item.targetField);
      if (onDelete === 'SET NULL' && !field.pk) field.nn = false;
    }
    return targets;
  }

  function removeTable(model, tid) {
    if (!getTable(model, tid)) return;
    model.relations
      .filter((r) => r.sourceTable === tid || r.targetTable === tid)
      .forEach((r) => dropRelation(model, r.id));
    model.tables = model.tables.filter((t) => t.id !== tid);
  }

  // Devuelve un mensaje de error (string) si no se puede eliminar, o null si se eliminó.
  function removeField(model, tid, fid) {
    const t = getTable(model, tid);
    const f = getField(t, fid);
    if (!t || !f) return 'Campo no encontrado';
    if (t.junction && f.fk) return 'No puedes eliminar las claves de una tabla puente; elimina la relación N:M.';
    if (t.fields.length <= 1) return 'La tabla debe tener al menos un campo';
    model.relations
      .filter((r) => (r.sourceTable === tid && r.sourceField === fid) || (r.targetTable === tid && r.targetField === fid))
      .forEach((r) => dropRelation(model, r.id));
    t.fields = t.fields.filter((x) => x.id !== fid);
    return null;
  }

  // Cambia el tipo de un campo y lo propaga a las FK que lo referencian.
  function setFieldType(model, tid, fid, type, seen = new Set()) {
    const f = getField(getTable(model, tid), fid);
    if (!f || !TYPES.includes(type) || seen.has(fid)) return;
    seen.add(fid);
    f.type = type;
    for (const r of model.relations) {
      if (r.sourceTable === tid && r.sourceField === fid) setFieldType(model, r.targetTable, r.targetField, type, seen);
    }
  }

  return {
    TYPES, INT_TYPES, RELATION_TYPES, ACTIONS, DIALECTS, COLORS, JUNCTION_COLOR,
    validateFieldDefault,
    getTable, getField, uniqueName, singular, suggestFkName,
    isReferencedSource, isFkTarget,
    sanitizeModel, validateModel,
    createRelation, updateRelation, dropRelation, removeTable, removeField, setFieldType,
  };
});
