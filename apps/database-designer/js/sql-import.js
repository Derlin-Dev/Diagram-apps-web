/*
 * sql-import.js — Importación acotada de DDL CREATE TABLE al modelo del editor.
 * Se carga como script clásico en el navegador y como módulo CommonJS en Node.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DBDSQLImport = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TYPES = ['INT', 'BIGINT', 'VARCHAR(255)', 'TEXT', 'DECIMAL(10,2)', 'DATE', 'DATETIME', 'BOOLEAN', 'UUID'];
  const ACTIONS = ['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL'];

  function stripComments(sql) {
    let out = '';
    let quote = '';
    for (let i = 0; i < sql.length; i++) {
      const c = sql[i], next = sql[i + 1];
      if (quote) {
        out += c;
        if (c === quote) {
          if (sql[i + 1] === quote && quote !== ']') out += sql[++i];
          else quote = '';
        } else if (c === '\\' && next) out += sql[++i];
        continue;
      }
      if (c === "'" || c === '"' || c === '`') { quote = c; out += c; continue; }
      if (c === '[') { quote = ']'; out += c; continue; }
      if (c === '-' && next === '-') {
        while (i < sql.length && sql[i] !== '\n') i++;
        out += '\n';
      } else if (c === '/' && next === '*') {
        i += 2;
        while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
        i++;
        out += ' ';
      } else if (c === '#') {
        while (i < sql.length && sql[i] !== '\n') i++;
        out += '\n';
      } else out += c;
    }
    return out;
  }

  function stripMarkdownFences(sql) {
    return sql.replace(/^[ \t]*```[^\r\n]*$/gm, '');
  }

  function splitStatements(sql) {
    const statements = [];
    let start = 0, depth = 0, quote = '';
    for (let i = 0; i < sql.length; i++) {
      const c = sql[i];
      if (quote) {
        if (c === quote) {
          if (sql[i + 1] === quote && quote !== ']') i++;
          else quote = '';
        } else if (c === '\\') i++;
      } else if (c === "'" || c === '"' || c === '`') quote = c;
      else if (c === '[') quote = ']';
      else if (c === '(') depth++;
      else if (c === ')') depth = Math.max(0, depth - 1);
      else if (c === ';' && depth === 0) {
        if (sql.slice(start, i).trim()) statements.push(sql.slice(start, i).trim());
        start = i + 1;
      }
    }
    if (sql.slice(start).trim()) statements.push(sql.slice(start).trim());
    return statements;
  }

  function splitTopLevel(text) {
    const parts = [];
    let start = 0, depth = 0, quote = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quote) {
        if (c === quote) {
          if (text[i + 1] === quote && quote !== ']') i++;
          else quote = '';
        } else if (c === '\\') i++;
      } else if (c === "'" || c === '"' || c === '`') quote = c;
      else if (c === '[') quote = ']';
      else if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (c === ',' && depth === 0) {
        parts.push(text.slice(start, i).trim());
        start = i + 1;
      }
    }
    parts.push(text.slice(start).trim());
    return parts.filter(Boolean);
  }

  function readIdentifier(text, start = 0) {
    let i = start;
    while (/\s/.test(text[i] || '')) i++;
    const opening = text[i];
    const closing = opening === '[' ? ']' : opening;
    if (opening === '"' || opening === '`' || opening === '[') {
      i++;
      let value = '';
      while (i < text.length) {
        if (text[i] === closing) {
          if (text[i + 1] === closing) { value += closing; i += 2; continue; }
          return { value, end: i + 1 };
        }
        value += text[i++];
      }
      throw new Error('Identificador SQL entrecomillado sin cerrar');
    }
    const match = /^[^\s().,;]+/.exec(text.slice(i));
    if (!match) throw new Error('Se esperaba un identificador SQL');
    return { value: match[0], end: i + match[0].length };
  }

  function readQualifiedIdentifier(text, start = 0) {
    let part = readIdentifier(text, start);
    let value = part.value, end = part.end;
    while (text.slice(end).match(/^\s*\./)) {
      const dot = text.indexOf('.', end);
      part = readIdentifier(text, dot + 1);
      value = part.value;
      end = part.end;
    }
    return { value, end };
  }

  function readParenthesized(text, start) {
    let depth = 0, quote = '';
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (quote) {
        if (c === quote) {
          if (text[i + 1] === quote && quote !== ']') i++;
          else quote = '';
        } else if (c === '\\') i++;
      } else if (c === "'" || c === '"' || c === '`') quote = c;
      else if (c === '[') quote = ']';
      else if (c === '(') depth++;
      else if (c === ')' && --depth === 0) return { value: text.slice(start + 1, i), end: i + 1 };
    }
    throw new Error('Paréntesis sin cerrar en CREATE TABLE');
  }

  function readColumns(text, start) {
    let opening = start;
    while (/\s/.test(text[opening] || '')) opening++;
    if (text[opening] !== '(') throw new Error('CREATE TABLE no contiene una lista de columnas');
    return readParenthesized(text, opening);
  }

  function mapType(raw, warnings, tableName, fieldName) {
    const type = raw.trim().toUpperCase().replace(/\s+/g, ' ');
    if (/^(SERIAL|SMALLSERIAL)$/.test(type)) return { type: 'INT', ai: true };
    if (type === 'BIGSERIAL') return { type: 'BIGINT', ai: true };
    if (/^(INT|INTEGER|INT[0-9]*|SMALLINT|MEDIUMINT|TINYINT)(\s*\(\s*\d+\s*\))?(\s+UNSIGNED)?$/.test(type)) {
      if (/\bUNSIGNED\b/.test(type) || /SMALLINT|MEDIUMINT|TINYINT/.test(type)) {
        warnings.push(`${tableName}.${fieldName}: tipo "${raw}" aproximado a INT`);
      }
      return { type: 'INT', ai: false };
    }
    if (/^BIGINT(\s*\(\s*\d+\s*\))?(\s+UNSIGNED)?$/.test(type)) {
      if (/\bUNSIGNED\b/.test(type)) warnings.push(`${tableName}.${fieldName}: se omitió UNSIGNED de BIGINT`);
      return { type: 'BIGINT', ai: false };
    }
    if (/^(VARCHAR|CHARACTER VARYING)(\s*\(\s*\d+\s*\))?$/.test(type)) {
      if (!/\(/.test(type)) return { type: 'VARCHAR(255)', ai: false };
      if (!/255/.test(type)) warnings.push(`${tableName}.${fieldName}: ${raw} se normalizó a VARCHAR(255)`);
      return { type: 'VARCHAR(255)', ai: false };
    }
    if (/^(CHAR|CHARACTER)\s*\(\s*\d+\s*\)$/.test(type)) {
      warnings.push(`${tableName}.${fieldName}: ${raw} se normalizó a VARCHAR(255)`);
      return { type: 'VARCHAR(255)', ai: false };
    }
    if (/^(VARCHAR|CHARACTER VARYING)$/.test(type)) return { type: 'VARCHAR(255)', ai: false };
    if (/^(TEXT|TINYTEXT|MEDIUMTEXT|LONGTEXT|CLOB)$/.test(type)) return { type: 'TEXT', ai: false };
    if (/^(DECIMAL|NUMERIC|NUMBER)(\s*\(\s*\d+\s*(,\s*\d+\s*)?\))?$/.test(type)) {
      if (!/^DECIMAL\(10,2\)$/.test(type.replace(/\s/g, ''))) warnings.push(`${tableName}.${fieldName}: ${raw} se normalizó a DECIMAL(10,2)`);
      return { type: 'DECIMAL(10,2)', ai: false };
    }
    if (/^DATE$/.test(type)) return { type: 'DATE', ai: false };
    if (/^(DATETIME|TIMESTAMP)(\s*\(\s*\d+\s*\))?(\s+WITH(?:OUT)? TIME ZONE)?$/.test(type)) {
      if (/TIMESTAMP/.test(type)) warnings.push(`${tableName}.${fieldName}: ${raw} se normalizó a DATETIME`);
      return { type: 'DATETIME', ai: false };
    }
    if (/^(BOOLEAN|BOOL)$/.test(type)) return { type: 'BOOLEAN', ai: false };
    if (/^UUID$/.test(type)) return { type: 'UUID', ai: false };
    warnings.push(`${tableName}.${fieldName}: tipo "${raw}" no soportado; se usó VARCHAR(255)`);
    return { type: 'VARCHAR(255)', ai: false };
  }

  function readFieldDefault(rest, warnings, tableName, fieldName) {
    const keyword = /\bDEFAULT\b/i.exec(rest);
    if (!keyword) return null;
    const source = rest.slice(keyword.index + keyword[0].length).trimStart();
    let value, end;
    if (source[0] === "'") {
      let parsed = '';
      let closed = false;
      for (let i = 1; i < source.length; i++) {
        if (source[i] === "'" && source[i + 1] === "'") {
          parsed += "'";
          i++;
        } else if (source[i] === "'") {
          value = parsed;
          end = i + 1;
          closed = true;
          break;
        } else parsed += source[i];
      }
      if (!closed) {
        warnings.push(`${tableName}.${fieldName}: DEFAULT de texto mal formado; se omitió`);
        return null;
      }
    } else {
      const token = /^(CURRENT_TIMESTAMP(?:\s*\(\s*\))?|TRUE|FALSE|NULL|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?)/i.exec(source);
      if (!token) {
        warnings.push(`${tableName}.${fieldName}: DEFAULT con expresión no soportada; se omitió`);
        return null;
      }
      value = token[1].trim();
      end = token[0].length;
      if (/^NULL$/i.test(value)) {
        warnings.push(`${tableName}.${fieldName}: DEFAULT NULL no se representa; se omitió`);
        return null;
      }
      if (/^CURRENT_TIMESTAMP/i.test(value)) value = 'CURRENT_TIMESTAMP';
      else if (/^(?:TRUE|FALSE)$/i.test(value)) value = value.toLowerCase();
    }
    const tail = source.slice(end).trim();
    if (tail && !/^(?:NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|REFERENCES|CHECK|COLLATE|CONSTRAINT|AUTO_INCREMENT|AUTOINCREMENT|IDENTITY|GENERATED)\b/i.test(tail)) {
      warnings.push(`${tableName}.${fieldName}: DEFAULT con expresión no soportada; se omitió`);
      return null;
    }
    return value;
  }

  function parseReference(text) {
    const match = /\bREFERENCES\b/i.exec(text);
    if (!match) return null;
    let table = readQualifiedIdentifier(text, match.index + match[0].length);
    let index = table.end;
    while (/\s/.test(text[index] || '')) index++;
    if (text[index] !== '(') throw new Error('REFERENCES debe indicar la columna referenciada');
    const columns = readParenthesized(text, index);
    const targetColumns = splitTopLevel(columns.value).map((column) => readIdentifier(column).value);
    const tail = text.slice(columns.end);
    const action = (keyword) => {
      const found = new RegExp(`\\bON\\s+${keyword}\\s+(NO\\s+ACTION|RESTRICT|CASCADE|SET\\s+NULL|SET\\s+DEFAULT)`, 'i').exec(tail);
      if (!found) return 'NO ACTION';
      const value = found[1].toUpperCase().replace(/\s+/g, ' ');
      if (ACTIONS.includes(value)) return value;
      return null;
    };
    return {
      table: table.value,
      columns: targetColumns,
      onDelete: action('DELETE'),
      onUpdate: action('UPDATE'),
      unsupportedActions: /\bON\s+(?:DELETE|UPDATE)\s+SET\s+DEFAULT\b/i.test(tail),
    };
  }

  function parseCreateTable(statement, makeId, tableIndex, warnings) {
    let match = /^CREATE\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?/i.exec(statement);
    if (!match) return null;
    const identifier = readQualifiedIdentifier(statement, match[0].length);
    const open = statement.indexOf('(', identifier.end);
    if (open < 0) throw new Error(`CREATE TABLE "${identifier.value}" no contiene columnas`);
    const body = readParenthesized(statement, open).value;
    const table = {
      id: makeId('t'),
      name: identifier.value,
      x: 40 + (tableIndex % 3) * 300,
      y: 40 + Math.floor(tableIndex / 3) * 250,
      color: ['#1684e8', '#07865f', '#8548d9', '#e87917', '#d34672', '#0c9cb5'][tableIndex % 6],
      junction: null,
      fields: [],
    };
    const pendingForeignKeys = [];
    const primaryKeys = [];
    const uniqueKeys = [];

    for (const definition of splitTopLevel(body)) {
      let item = definition.replace(/^\s*CONSTRAINT\s+(?:"(?:[^"]|"")*"|`(?:[^`]|``)*`|\[[^\]]+\]|\S+)\s+/i, '');
      if (/^(?:PRIMARY\s+KEY)\b/i.test(item)) {
        const openKey = item.indexOf('(');
        if (openKey < 0) { warnings.push(`${table.name}: PRIMARY KEY mal formada; se omitió`); continue; }
        primaryKeys.push(...splitTopLevel(readParenthesized(item, openKey).value).map((key) => readIdentifier(key).value));
        continue;
      }
      if (/^(?:UNIQUE\b|UNIQUE\s+(?:KEY|INDEX)\b)/i.test(item)) {
        const openKey = item.indexOf('(');
        if (openKey < 0) { warnings.push(`${table.name}: UNIQUE mal formada; se omitió`); continue; }
        uniqueKeys.push(splitTopLevel(readParenthesized(item, openKey).value).map((key) => readIdentifier(key).value));
        continue;
      }
      if (/^(?:FOREIGN\s+KEY)\b/i.test(item)) {
        const openKey = item.indexOf('(');
        const keyList = openKey >= 0 ? readParenthesized(item, openKey) : null;
        const references = parseReference(item);
        if (!keyList || !references) { warnings.push(`${table.name}: FOREIGN KEY mal formada; se omitió`); continue; }
        pendingForeignKeys.push({ columns: splitTopLevel(keyList.value).map((key) => readIdentifier(key).value), references });
        continue;
      }
      if (/^(?:CHECK|EXCLUDE)\b/i.test(item)) {
        warnings.push(`${table.name}: se omitió una restricción ${item.split(/\s/)[0].toUpperCase()}`);
        continue;
      }

      const fieldIdentifier = readIdentifier(item);
      const rest = item.slice(fieldIdentifier.end).trim();
      const boundary = /\b(?:NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|REFERENCES|DEFAULT|CHECK|COLLATE|CONSTRAINT|AUTO_INCREMENT|AUTOINCREMENT|IDENTITY|GENERATED)\b/i.exec(rest);
      const rawType = boundary ? rest.slice(0, boundary.index).trim() : rest.trim();
      if (!rawType) throw new Error(`${table.name}.${fieldIdentifier.value}: falta el tipo de dato`);
      const mapped = mapType(rawType, warnings, table.name, fieldIdentifier.value);
      const field = {
        id: makeId('f'), name: fieldIdentifier.value, type: mapped.type,
        description: '',
        defaultValue: readFieldDefault(rest, warnings, table.name, fieldIdentifier.value),
        pk: /\bPRIMARY\s+KEY\b/i.test(rest), nn: /\bNOT\s+NULL\b/i.test(rest) || /\bPRIMARY\s+KEY\b/i.test(rest),
        ai: mapped.ai || /\b(?:AUTO_INCREMENT|AUTOINCREMENT|IDENTITY)\b/i.test(rest),
        uq: /\bUNIQUE\b/i.test(rest), fk: false,
      };
      if (/\bCHECK\b|\bCOLLATE\b|\bGENERATED\b/i.test(rest)) {
        const skipped = [...rest.matchAll(/\b(CHECK|COLLATE|GENERATED)\b/gi)].map((found) => found[1].toUpperCase());
        if (skipped.length) warnings.push(`${table.name}.${field.name}: se omitieron propiedades ${[...new Set(skipped)].join(', ')}`);
      }
      table.fields.push(field);
      if (field.pk) primaryKeys.push(field.name);
      if (field.uq) uniqueKeys.push([field.name]);
      const reference = parseReference(rest);
      if (reference) pendingForeignKeys.push({ columns: [field.name], references: reference });
    }

    if (!table.fields.length) throw new Error(`CREATE TABLE "${table.name}" no define columnas`);
    if (table.fields.length > 200) throw new Error(`"${table.name}" supera el límite de 200 campos`);
    const fieldNames = new Set();
    for (const field of table.fields) {
      const key = field.name.toLocaleLowerCase();
      if (fieldNames.has(key)) warnings.push(`${table.name}: nombre de campo duplicado "${field.name}"`);
      fieldNames.add(key);
    }
    for (const name of primaryKeys) {
      const field = table.fields.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
      if (!field) warnings.push(`${table.name}: la clave primaria referencia una columna inexistente "${name}"`);
      else { field.pk = true; field.nn = true; }
    }
    for (const keys of uniqueKeys) {
      if (keys.length !== 1) {
        warnings.push(`${table.name}: se omitió UNIQUE compuesto (${keys.join(', ')})`);
        continue;
      }
      const field = table.fields.find((candidate) => candidate.name.toLowerCase() === keys[0].toLowerCase());
      if (!field) warnings.push(`${table.name}: UNIQUE referencia una columna inexistente "${keys[0]}"`);
      else field.uq = true;
    }
    if (primaryKeys.length > 1 && new Set(primaryKeys.map((key) => key.toLowerCase())).size > 1) {
      warnings.push(`${table.name}: clave primaria compuesta aproximada como varios campos PK`);
    }
    return { table, pendingForeignKeys };
  }

  function parseSQL(source, makeId) {
    if (typeof source !== 'string' || !source.trim()) throw new Error('El contenido SQL está vacío');
    if (source.length > 5 * 1024 * 1024) throw new Error('El archivo SQL supera el límite de 5 MB');
    if (typeof makeId !== 'function') throw new Error('No se pudo generar identificadores para el modelo');
    const warnings = [];
    const statements = splitStatements(stripComments(stripMarkdownFences(source)));
    const parsed = [];
    for (const statement of statements) {
      if (!/^CREATE\s+(?:TEMPORARY\s+)?TABLE\b/i.test(statement)) {
        warnings.push(`Se omitió una sentencia no soportada: ${statement.slice(0, 80).replace(/\s+/g, ' ')}`);
        continue;
      }
      try {
        const result = parseCreateTable(statement, makeId, parsed.length, warnings);
        if (result) parsed.push(result);
      } catch (err) {
        warnings.push(`No se pudo importar una sentencia CREATE TABLE: ${err.message}`);
      }
      if (parsed.length > 300) throw new Error('El esquema tiene demasiadas tablas (máx. 300)');
    }
    if (!parsed.length) throw new Error('No se encontraron sentencias CREATE TABLE válidas');

    const tables = parsed.map((item) => item.table);
    const names = new Set();
    for (const table of tables) {
      const key = table.name.toLocaleLowerCase();
      if (names.has(key)) {
        warnings.push(`Tabla duplicada "${table.name}" omitida`);
        const index = parsed.findIndex((item) => item.table === table);
        parsed.splice(index, 1);
      } else names.add(key);
    }
    const importedTables = parsed.map((item) => item.table);
    const relations = [];
    const findTable = (name) => importedTables.find((table) => table.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    for (const item of parsed) {
      for (const foreignKey of item.pendingForeignKeys) {
        if (foreignKey.columns.length !== 1 || foreignKey.references.columns.length !== 1) {
          warnings.push(`${item.table.name}: se omitió una FOREIGN KEY compuesta`);
          continue;
        }
        const local = item.table.fields.find((field) => field.name.toLocaleLowerCase() === foreignKey.columns[0].toLocaleLowerCase());
        const source = findTable(foreignKey.references.table);
        const sourceField = source && source.fields.find((field) => field.name.toLocaleLowerCase() === foreignKey.references.columns[0].toLocaleLowerCase());
        if (!local || !source || !sourceField) {
          warnings.push(`${item.table.name}: se omitió una FOREIGN KEY con referencia no encontrada`);
          continue;
        }
        if (!(sourceField.pk || sourceField.uq)) warnings.push(`${source.name}.${sourceField.name}: la FOREIGN KEY apunta a un campo que no se reconoce como PK ni UNIQUE`);
        if (local.type !== sourceField.type) warnings.push(`${item.table.name}.${local.name}: tipo ${local.type} distinto al campo referenciado ${source.name}.${sourceField.name} (${sourceField.type})`);
        local.fk = true;
        if (foreignKey.references.unsupportedActions) warnings.push(`${item.table.name}.${local.name}: se omitió SET DEFAULT`);
        if (foreignKey.references.onDelete === 'SET NULL') local.nn = false;
        relations.push({
          id: makeId('r'),
          type: local.uq ? '1:1' : '1:N',
          sourceTable: source.id,
          sourceField: sourceField.id,
          targetTable: item.table.id,
          targetField: local.id,
          onDelete: foreignKey.references.onDelete || 'NO ACTION',
          onUpdate: foreignKey.references.onUpdate || 'NO ACTION',
          created: false,
          uqAdded: false,
          group: null,
        });
      }
    }
    return { tables: importedTables, relations, warnings };
  }

  return { parseSQL };
});
