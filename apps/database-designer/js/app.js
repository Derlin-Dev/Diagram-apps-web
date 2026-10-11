/*
 * app.js — Interfaz de DB Designer (DOM, eventos, render).
 * La lógica del modelo está en model.js y la generación SQL en sql.js.
 */
(function () {
  'use strict';

  const {
    TYPES, INT_TYPES, RELATION_TYPES, ACTIONS, COLORS,
    getTable, getField, uniqueName, suggestFkName,
    sanitizeModel, validateModel, validateFieldDefault, createRelation, updateRelation, dropRelation, removeTable, removeField,
    setFieldType, isReferencedSource, isFkTarget, generateSQL,
  } = window.DBD;

  const $ = (s) => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const STORAGE_KEY = 'dbdesigner:autosave:v2';
  const canvas = $('#canvas');
  const layer = $('#tablesLayer');
  const links = $('#links');

  const state = {
    tables: [], relations: [], selected: null,
    mode: 'select', relationSource: null, searchTarget: null, zoom: 1, tab: 'canvas', dirty: false,
    sqlDraft: null, sqlDraftDirty: false, hasSavedCopy: false, autosaveFailed: false,
  };
  const cardEls = new Map();
  let idCounter = 1;
  let toastTimer;
  let spacePan = false;
  let activePan = null;
  let contextMenu = null;
  let contextMenuReturnFocus = null;
  const makeId = (p) => p + idCounter++;

  /* ---------- Utilidades ---------- */

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function closeContextMenu() {
    if (!contextMenu) return;
    contextMenu.remove();
    contextMenu = null;
    if (contextMenuReturnFocus && contextMenuReturnFocus.isConnected) {
      contextMenuReturnFocus.focus({ preventScroll: true });
    }
    contextMenuReturnFocus = null;
  }

  function openContextMenu(event, items) {
    event.preventDefault();
    closeContextMenu();
    const menu = document.createElement('div');
    menu.className = 'diagram-context-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Acciones del diagrama');
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'menuitem');
      button.textContent = item.label;
      button.disabled = !!item.disabled;
      button.addEventListener('click', () => {
        closeContextMenu();
        if (!item.disabled) item.run();
      });
      menu.appendChild(button);
    });
    menu.addEventListener('keydown', (keyEvent) => {
      const enabled = [...menu.querySelectorAll('button:not(:disabled)')];
      const index = enabled.indexOf(document.activeElement);
      if (keyEvent.key === 'Escape') {
        keyEvent.preventDefault();
        closeContextMenu();
      } else if (keyEvent.key === 'ArrowDown' || keyEvent.key === 'ArrowUp') {
        keyEvent.preventDefault();
        const step = keyEvent.key === 'ArrowDown' ? 1 : -1;
        enabled[(index + step + enabled.length) % enabled.length].focus();
      }
    });
    contextMenuReturnFocus = document.activeElement;
    document.body.appendChild(menu);
    const box = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(event.clientX, innerWidth - box.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(event.clientY, innerHeight - box.height - 8))}px`;
    contextMenu = menu;
    menu.querySelector('button:not(:disabled)')?.focus();
  }

  function showTableContextMenu(tableId, event) {
    if (state.selected !== tableId) select(tableId);
    cardEls.get(tableId)?.focus({ preventScroll: true });
    openContextMenu(event, [
      { label: 'Centrar esta tabla', run: () => centerTable(tableId) },
      { label: 'Duplicar tabla', run: duplicateSelectedTable },
      { label: 'Agregar tabla nueva', run: newTable },
      { label: 'Eliminar tabla…', run: deleteSelectedTable },
    ]);
  }

  function openChoiceDialog({ title, message, actions, initialAction = 'cancel' }) {
    return new Promise((resolve) => {
      const previousFocus = document.activeElement;
      const modal = document.createElement('div');
      modal.className = 'relation-modal confirm-modal';
      modal.setAttribute('role', 'alertdialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'confirmDialogTitle');
      modal.setAttribute('aria-describedby', 'confirmDialogMessage');

      const card = document.createElement('div');
      card.className = 'modal-card confirm-card';
      const icon = document.createElement('div');
      icon.className = 'confirm-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '!';
      const heading = document.createElement('h3');
      heading.id = 'confirmDialogTitle';
      heading.textContent = title;
      const description = document.createElement('p');
      description.id = 'confirmDialogMessage';
      description.textContent = message;
      const buttons = document.createElement('div');
      buttons.className = 'modal-actions';

      let finished = false;
      const finish = (choice) => {
        if (finished) return;
        finished = true;
        modal.remove();
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        resolve(choice);
      };
      actions.forEach((action) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = action.className;
        button.textContent = action.label;
        button.addEventListener('click', () => finish(action.value));
        buttons.appendChild(button);
        if (action.value === initialAction) button.dataset.initialFocus = 'true';
      });
      modal.addEventListener('click', (event) => {
        if (event.target === modal) finish('cancel');
      });
      modal.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          finish('cancel');
          return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...buttons.querySelectorAll('button:not(:disabled)')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      card.append(icon, heading, description, buttons);
      modal.appendChild(card);
      document.body.appendChild(modal);
      (buttons.querySelector('[data-initial-focus]') || buttons.querySelector('button')).focus();
    });
  }

  function confirmAction(title, message, confirmLabel = 'Confirmar', danger = false) {
    return openChoiceDialog({
      title,
      message,
      actions: [
        { value: 'cancel', label: 'Cancelar', className: 'btn' },
        { value: 'confirm', label: confirmLabel, className: danger ? 'btn danger' : 'btn primary' },
      ],
    }).then((choice) => choice === 'confirm');
  }

  const setStatus = (text) => { $('#statusText').textContent = text; };
  const dialect = () => $('#dialectSelect').value;
  const modelData = () => ({ version: 2, dialect: dialect(), tables: state.tables, relations: state.relations });

  /* ---------- Historial (deshacer / rehacer) y autoguardado ---------- */

  const undoStack = [];
  const redoStack = [];
  let lastSnap = '';
  const snap = () => JSON.stringify({ tables: state.tables, relations: state.relations });

  function updateHistoryButtons() {
    $('#undoBtn').disabled = !undoStack.length;
    $('#redoBtn').disabled = !redoStack.length;
  }

  function resetHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
    lastSnap = snap();
    updateHistoryButtons();
  }

  function autosave({ updateStatus = true } = {}) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modelData()));
      state.autosaveFailed = false;
      if (updateStatus && state.dirty) setStatus('Guardado automáticamente en este navegador');
      return true;
    } catch (error) {
      state.autosaveFailed = true;
      setStatus('No se pudo guardar automáticamente');
      toast(`No se pudo guardar automáticamente en este navegador: ${error.message}`);
      return false;
    }
  }

  function track() {
    const cur = snap();
    if (cur === lastSnap) return;
    undoStack.push(lastSnap);
    if (undoStack.length > 100) undoStack.shift();
    redoStack.length = 0;
    lastSnap = cur;
    updateHistoryButtons();
    autosave();
  }

  function restore(s) {
    const d = JSON.parse(s);
    state.tables = d.tables;
    state.relations = d.relations;
    state.relationSource = null;
    if (!getTable(state, state.selected)) state.selected = null;
    state.dirty = true;
    setStatus('Restaurando cambios guardados');
    renderAll();
    autosave();
    updateHistoryButtons();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(lastSnap);
    lastSnap = undoStack.pop();
    restore(lastSnap);
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(lastSnap);
    lastSnap = redoStack.pop();
    restore(lastSnap);
  }

  /* ---------- Cambios de estado ---------- */

  // Cambio que no altera la estructura visible (p. ej. mover una tabla).
  function touch() {
    state.dirty = true;
    setStatus('Cambios sin guardar · autoguardado local');
    track();
    renderOutput();
    renderSearchResults();
  }

  // Cambio estructural: re-dibuja lienzo y relaciones; el panel de propiedades solo si `full`
  // (así no se pierde el foco al editar nombres o tipos).
  function commit(full) {
    touch();
    renderCanvas();
    renderRelations();
    if (full) renderProperties();
  }

  function select(id) {
    state.selected = id;
    renderCanvas();
    renderProperties();
  }

  function findSearchResults(query) {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    const results = [];
    for (const table of state.tables) {
      if (table.name.toLocaleLowerCase().includes(needle)) {
        results.push({ tableId: table.id, fieldId: null, tableName: table.name, label: table.name, kind: 'Tabla' });
      }
      for (const field of table.fields) {
        if (field.name.toLocaleLowerCase().includes(needle)) {
          results.push({
            tableId: table.id, fieldId: field.id, tableName: table.name,
            label: field.name, kind: 'Campo',
          });
        }
      }
    }
    return results;
  }

  function renderSearchResults() {
    const input = $('#diagramSearch');
    const root = $('#searchResults');
    const query = input.value.trim();
    if (!query) {
      root.hidden = true;
      root.innerHTML = '';
      return;
    }
    const results = findSearchResults(query);
    root.hidden = false;
    root.innerHTML = results.length
      ? results.slice(0, 30).map((result) =>
        `<button class="search-result" role="option" data-table-id="${esc(result.tableId)}" data-field-id="${esc(result.fieldId || '')}">` +
        `<span class="search-result-kind">${result.kind}</span><span class="search-result-name">${esc(result.label)}</span>` +
        `<span class="search-result-table">${esc(result.tableName)}</span></button>`
      ).join('') + (results.length > 30 ? '<div class="search-overflow">Mostrando los primeros 30 resultados</div>' : '')
      : '<div class="search-empty">No se encontraron tablas ni campos</div>';
  }

  function focusSearchResult(tableId, fieldId) {
    const table = getTable(state, tableId);
    if (!table) return;
    state.searchTarget = { tableId, fieldId: fieldId || null };
    state.selected = tableId;
    selectWorkspaceTab('canvas');
    renderCanvas();
    renderProperties();
    requestAnimationFrame(() => centerTable(tableId));
  }

  /* ---------- Render ---------- */

  function renderAll() {
    renderCanvas();
    renderProperties();
    renderRelations();
    renderOutput();
    renderSearchResults();
  }

  function renderCanvas() {
    layer.innerHTML = '';
    cardEls.clear();
    $('#emptyState').style.display = state.tables.length ? 'none' : 'block';
    for (const t of state.tables) {
      const card = document.createElement('div');
      card.className =
        'table-card' +
        (t.id === state.selected ? ' selected' : '') +
        (t.junction ? ' junction' : '') +
        (t.id === state.relationSource ? ' rel-source' : '') +
        (state.searchTarget && state.searchTarget.tableId === t.id ? ' search-match' : '');
      card.dataset.id = t.id;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Tabla ${t.name}`);
      card.style.left = t.x + 'px';
      card.style.top = t.y + 'px';
      card.style.setProperty('--table-color', t.color);
      card.innerHTML =
        `<div class="table-head"><span class="table-symbol">${t.junction ? '⇄' : '▦'}</span>` +
        `<span class="table-name">${esc(t.name)}</span><span class="count">${t.fields.length}</span></div>` +
        t.fields
          .map((f) => {
            const key = (f.pk ? '🔑' : '') + (f.fk ? '↳' : '') || '·';
            return (
              `<div class="column-row${state.searchTarget && state.searchTarget.tableId === t.id && state.searchTarget.fieldId === f.id ? ' search-target' : ''}" data-field-id="${esc(f.id)}" title="${esc(f.description || '')}"><span class="column-key">${key}</span>` +
              `<span class="column-name">${esc(f.name)}${f.nn && !f.pk ? ' *' : ''}</span>` +
              `<span class="column-type">${esc(f.type)}${f.uq && !f.pk ? ' · UQ' : ''}</span></div>`
            );
          })
          .join('');
      card.addEventListener('click', (e) => { e.stopPropagation(); onCardClick(t.id, false); });
      card.addEventListener('contextmenu', (event) => {
        event.stopPropagation();
        showTableContextMenu(t.id, event);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick(t.id, true); }
      });
      card.querySelector('.table-head').addEventListener('pointerdown', (e) => startDrag(e, t, card));
      layer.appendChild(card);
      cardEls.set(t.id, card);
    }
    $('#organizeTablesBtn').disabled = !state.tables.length;
    applyZoom();
    drawLinks();
  }

  function onCardClick(id, viaKeyboard) {
    if (state.mode === 'relation') {
      if (!state.relationSource) {
        state.relationSource = id;
        renderCanvas();
        toast('Origen: ' + getTable(state, id).name + '. Elige la tabla destino (la misma para una autorrelación).');
      } else {
        const src = state.relationSource;
        state.relationSource = null;
        renderCanvas();
        openRelationModal(src, id);
      }
    } else {
      select(id);
    }
    if (viaKeyboard && cardEls.has(id)) cardEls.get(id).focus();
  }

  function startDrag(e, t, card) {
    if (e.button !== 0) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox = t.x, oy = t.y;
    let moved = false;
    function move(ev) {
      const dx = (ev.clientX - sx) / state.zoom;
      const dy = (ev.clientY - sy) / state.zoom;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      t.x = Math.max(0, Math.round(ox + dx));
      t.y = Math.max(0, Math.round(oy + dy));
      card.style.left = t.x + 'px';
      card.style.top = t.y + 'px';
      drawLinks();
    }
    function up() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!moved) return;
      touch();
      if (state.mode === 'select' && state.selected !== t.id) select(t.id);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  /* ---------- Líneas de relación ---------- */

  function anchorY(t, fieldId) {
    const card = cardEls.get(t.id);
    const idx = t.fields.findIndex((f) => f.id === fieldId);
    const row = card && card.querySelectorAll('.column-row')[idx];
    return row ? t.y + row.offsetTop + row.offsetHeight / 2 : t.y + 54;
  }

  // Notación pata de gallo: dos barras = "uno", tres puntas = "muchos".
  function glyph(x, y, dir, kind, active, dimmed) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', `relation-mark${active ? ' active' : ''}${dimmed ? ' dimmed' : ''}`);
    p.setAttribute(
      'd',
      kind === 'many'
        ? `M ${x + dir * 14} ${y} L ${x} ${y - 7} M ${x + dir * 14} ${y} L ${x} ${y} M ${x + dir * 14} ${y} L ${x} ${y + 7}`
        : `M ${x + dir * 9} ${y - 6} L ${x + dir * 9} ${y + 6} M ${x + dir * 14} ${y - 6} L ${x + dir * 14} ${y + 6}`
    );
    links.appendChild(p);
  }

  function drawLinks() {
    links.innerHTML = '';
    for (const r of state.relations) {
      const a = getTable(state, r.sourceTable);
      const b = getTable(state, r.targetTable);
      if (!a || !b) continue;
      const aw = (cardEls.get(a.id) || {}).offsetWidth || 230;
      const bw = (cardEls.get(b.id) || {}).offsetWidth || 230;
      const ay = anchorY(a, r.sourceField);
      const by = anchorY(b, r.targetField);
      let sx, ex, sd, ed;
      if (a.x + aw + 30 <= b.x) { sx = a.x + aw; sd = 1; ex = b.x; ed = -1; }
      else if (b.x + bw + 30 <= a.x) { sx = a.x; sd = -1; ex = b.x + bw; ed = 1; }
      else { sx = a.x + aw; sd = 1; ex = b.x + bw; ed = 1; } // misma zona: sale por la derecha (incluye autorrelación)
      const k = sd === ed ? 60 : Math.max(40, Math.abs(ex - sx) / 2);
      const active = state.selected === a.id || state.selected === b.id;
      const dimmed = state.selected && !active;

      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M ${sx} ${ay} C ${sx + sd * k} ${ay}, ${ex + ed * k} ${by}, ${ex} ${by}`);
      path.setAttribute('class', `relation-line${active ? ' active' : ''}${dimmed ? ' dimmed' : ''}`);
      const tip = document.createElementNS(NS, 'title');
      tip.textContent = `${r.group ? 'N:M (vía puente)' : r.type} · ON DELETE ${r.onDelete} · ON UPDATE ${r.onUpdate}`;
      path.appendChild(tip);
      links.appendChild(path);

      glyph(sx, ay, sd, 'one', active, dimmed);
      glyph(ex, by, ed, r.type === '1:1' ? 'one' : 'many', active, dimmed);

      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', (sx + ex) / 2 + (sd === ed ? sd * 40 : 0));
      label.setAttribute('y', (ay + by) / 2 - 6);
      label.setAttribute('class', `relation-label${active ? ' active' : ''}${dimmed ? ' dimmed' : ''}`);
      label.setAttribute('text-anchor', 'middle');
      label.textContent = r.type === '1:1' ? '1 : 1' : '1 : N';
      links.appendChild(label);
    }
  }

  function setZoom(z, anchorX = canvas.clientWidth / 2, anchorY = canvas.clientHeight / 2) {
    const previousZoom = state.zoom;
    state.zoom = Math.round(Math.min(1.6, Math.max(0.3, z)) * 100) / 100;
    applyZoom();
    if (previousZoom !== state.zoom) {
      const scale = state.zoom / previousZoom;
      canvas.scrollTo({
        left: Math.max(0, (canvas.scrollLeft + anchorX) * scale - anchorX),
        top: Math.max(0, (canvas.scrollTop + anchorY) * scale - anchorY),
      });
    }
  }

  function applyZoom() {
    layer.style.transform = `scale(${state.zoom})`;
    links.style.transform = `scale(${state.zoom})`;
    links.style.transformOrigin = 'top left';
    $('#zoomLabel').textContent = Math.round(state.zoom * 100) + '%';
  }

  function fitToScreen() {
    if (!state.tables.length) { setZoom(1); return; }
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (const t of state.tables) {
      const c = cardEls.get(t.id);
      minX = Math.min(minX, t.x);
      minY = Math.min(minY, t.y);
      maxX = Math.max(maxX, t.x + (c ? c.offsetWidth : 230));
      maxY = Math.max(maxY, t.y + (c ? c.offsetHeight : 160));
    }
    const width = Math.max(1, maxX - minX), height = Math.max(1, maxY - minY);
    const zoom = Math.min(1.6, canvas.clientWidth / (width + 40), canvas.clientHeight / (height + 40));
    setZoom(zoom, 0, 0);
    canvas.scrollTo({
      left: Math.max(0, ((minX + maxX) / 2) * state.zoom - canvas.clientWidth / 2),
      top: Math.max(0, ((minY + maxY) / 2) * state.zoom - canvas.clientHeight / 2),
      behavior: 'smooth',
    });
  }

  function organizeTables() {
    if (!state.tables.length) return;
    const widths = state.tables.map((table) => cardEls.get(table.id)?.offsetWidth || 230);
    const heights = state.tables.map((table) => cardEls.get(table.id)?.offsetHeight || 160);
    const cellWidth = Math.max(...widths);
    const cellHeight = Math.max(...heights);
    const columnCount = Math.ceil(Math.sqrt(state.tables.length));
    const gap = 50;
    const margin = 40;
    let changed = false;

    state.tables.forEach((table, index) => {
      const x = margin + (index % columnCount) * (cellWidth + gap);
      const y = margin + Math.floor(index / columnCount) * (cellHeight + gap);
      if (table.x !== x || table.y !== y) changed = true;
      table.x = x;
      table.y = y;
    });

    if (changed) {
      commit(true);
      toast('Tablas organizadas; puedes deshacer el cambio');
    }
    fitToScreen();
  }

  function centerTable(tableId = state.selected) {
    const table = getTable(state, tableId);
    const card = table && cardEls.get(table.id);
    if (!table || !card) {
      toast('Selecciona una tabla para centrarla');
      return;
    }
    canvas.scrollTo({
      left: Math.max(0, (table.x + card.offsetWidth / 2) * state.zoom - canvas.clientWidth / 2),
      top: Math.max(0, (table.y + card.offsetHeight / 2) * state.zoom - canvas.clientHeight / 2),
      behavior: 'smooth',
    });
  }

  /* ---------- Panel de propiedades ---------- */

  const EMPTY_PROPS =
    '<div class="properties-empty"><span>⌖</span><h3>Selecciona una tabla</h3>' +
    '<p>Haz clic en una tabla del diagrama para editar su nombre, campos y claves.</p></div>';

  function renderProperties() {
    const root = $('#properties');
    const t = getTable(state, state.selected);
    if (!t) { root.innerHTML = EMPTY_PROPS; return; }

    root.innerHTML =
      `<div class="prop-group"><label class="prop-label" for="tableName">Nombre de la tabla</label>` +
      `<input class="input" id="tableName" maxlength="64" value="${esc(t.name)}" />` +
      `<small class="field-error table-name-error" id="tableNameError" role="alert" hidden></small>` +
      (t.junction ? '<p class="muted">Tabla puente de una relación N:M. Puedes agregar campos propios (p. ej. fecha).</p>' : '') +
      `</div><div class="prop-group"><label class="prop-label">Campos (${t.fields.length})</label>` +
      `<div id="fieldsEditor"></div><button class="mini-btn" id="addField">＋ Agregar campo</button></div>` +
      `<button class="mini-btn danger" id="deleteTable">Eliminar tabla</button>`;

    const tableNameInput = $('#tableName');
    const tableNameError = $('#tableNameError');
    tableNameInput.addEventListener('change', (e) => {
      const v = e.target.value.trim();
      if (!v) {
        tableNameError.textContent = 'El nombre no puede estar vacío';
        tableNameError.hidden = false;
        tableNameInput.setAttribute('aria-invalid', 'true');
        return;
      }
      if (state.tables.some((x) => x !== t && x.name.toLowerCase() === v.toLowerCase())) {
        tableNameError.textContent = 'Ya existe una tabla con ese nombre';
        tableNameError.hidden = false;
        tableNameInput.setAttribute('aria-invalid', 'true');
        return;
      }
      tableNameError.hidden = true;
      tableNameInput.removeAttribute('aria-invalid');
      if (v === t.name) return;
      t.name = v;
      commit(false);
    });
    tableNameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); tableNameInput.blur(); }
      if (event.key === 'Escape') {
        tableNameInput.value = t.name;
        tableNameError.hidden = true;
        tableNameInput.removeAttribute('aria-invalid');
        tableNameInput.blur();
      }
    });

    const fe = $('#fieldsEditor');
    for (const f of t.fields) {
      const fkTarget = isFkTarget(state, t.id, f.id);
      const block = document.createElement('div');
      block.className = 'field-block';
      block.dataset.fieldId = f.id;
      block.innerHTML =
        `<div class="field-editor"><button class="field-drag" title="Arrastrar para reordenar" aria-label="Arrastrar campo ${esc(f.name)}">⠿</button>` +
        `<input aria-label="Nombre del campo" maxlength="64" value="${esc(f.name)}">` +
        `<select aria-label="Tipo de dato"${fkTarget ? ' disabled title="El tipo lo define el campo referenciado"' : ''}>` +
        TYPES.map((tp) => `<option${tp === f.type ? ' selected' : ''}>${esc(tp)}</option>`).join('') +
        `</select><button class="duplicate-field" title="Duplicar campo" aria-label="Duplicar campo ${esc(f.name)}">⧉</button>` +
        `<button class="delete-field" title="Eliminar campo" aria-label="Eliminar campo">×</button></div>` +
        `<small class="field-error field-name-error" role="alert" hidden></small>` +
        `<div class="field-flags">` +
        `<label class="check"><input type="checkbox"${f.pk ? ' checked' : ''}> PK</label>` +
        `<label class="check"><input type="checkbox"${f.nn ? ' checked' : ''}> NOT NULL</label>` +
        `<label class="check"><input type="checkbox"${f.uq ? ' checked' : ''}> UNIQUE</label>` +
        `<label class="check"><input type="checkbox"${f.ai ? ' checked' : ''}> Autoincr.</label></div>`;
      block.insertAdjacentHTML('beforeend',
        `<details class="field-extra"><summary>Descripción y valor por defecto</summary>` +
        `<label>Descripción<textarea class="field-description" maxlength="500" rows="2" placeholder="Descripción funcional del campo">${esc(f.description || '')}</textarea></label>` +
        `<label>Valor por defecto<input class="field-default" maxlength="256" value="${esc(f.defaultValue ?? '')}" placeholder="Ej.: 0, texto o CURRENT_TIMESTAMP"${f.ai ? ' disabled title="No aplica a un campo autoincremental"' : ''}></label>` +
        `<small class="field-hint">El texto se escapará como literal SQL; CURRENT_TIMESTAMP se admite en campos de fecha/hora.</small>` +
        `<small class="field-error" role="alert" hidden></small></details>`);
      const nameInput = block.querySelector('input');
      const nameError = block.querySelector('.field-name-error');
      const typeSel = block.querySelector('select');
      const descriptionInput = block.querySelector('.field-description');
      const defaultInput = block.querySelector('.field-default');
      const fieldError = block.querySelector('.field-error');
      const fieldExtra = block.querySelector('.field-extra');
      const [cbPk, cbNn, cbUq, cbAi] = block.querySelectorAll('input[type=checkbox]');
      const dragHandle = block.querySelector('.field-drag');
      dragHandle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        block.classList.add('dragging');
        const clearTargets = () => {
          fe.querySelectorAll('.field-block').forEach((item) => item.classList.remove('drop-before', 'drop-after'));
        };
        const findTarget = (event) => {
          const element = document.elementFromPoint(event.clientX, event.clientY);
          return element && element.closest('.field-block');
        };
        const move = (moveEvent) => {
          const target = findTarget(moveEvent);
          clearTargets();
          if (!target || target.dataset.fieldId === f.id) return;
          const after = moveEvent.clientY >= target.getBoundingClientRect().top + target.offsetHeight / 2;
          target.classList.add(after ? 'drop-after' : 'drop-before');
        };
        const stop = (stopEvent) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', stop);
          window.removeEventListener('pointercancel', cancel);
          block.classList.remove('dragging');
          clearTargets();
          const target = stopEvent.type === 'pointerup' ? findTarget(stopEvent) : null;
          let changed = false;
          if (target && target.dataset.fieldId !== f.id) {
            const sourceIndex = t.fields.findIndex((field) => field.id === f.id);
            if (sourceIndex >= 0) {
              const after = stopEvent.clientY >= target.getBoundingClientRect().top + target.offsetHeight / 2;
              const targetIndex = t.fields.findIndex((item) => item.id === target.dataset.fieldId);
              const alreadyInPlace =
                sourceIndex === targetIndex ||
                (sourceIndex + 1 === targetIndex && !after) ||
                (sourceIndex - 1 === targetIndex && after);
              if (targetIndex >= 0 && !alreadyInPlace) {
                const [field] = t.fields.splice(sourceIndex, 1);
                const adjustedTargetIndex = t.fields.findIndex((item) => item.id === target.dataset.fieldId);
                t.fields.splice(adjustedTargetIndex + (after ? 1 : 0), 0, field);
                changed = true;
              }
            }
          }
          if (changed) {
            commit(true);
            toast(`Campo "${f.name}" reordenado`);
          }
        };
        const cancel = () => stop({ type: 'pointercancel' });
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', cancel);
      });

      nameInput.addEventListener('change', (e) => {
        const v = e.target.value.trim();
        if (!v) {
          nameError.textContent = 'El nombre no puede estar vacío';
          nameError.hidden = false;
          nameInput.setAttribute('aria-invalid', 'true');
          return;
        }
        if (t.fields.some((x) => x !== f && x.name.toLowerCase() === v.toLowerCase())) {
          nameError.textContent = 'Ya existe un campo con ese nombre en la tabla';
          nameError.hidden = false;
          nameInput.setAttribute('aria-invalid', 'true');
          return;
        }
        nameError.hidden = true;
        nameInput.removeAttribute('aria-invalid');
        if (v === f.name) return;
        f.name = v;
        commit(false);
      });
      nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); nameInput.blur(); }
        if (event.key === 'Escape') {
          nameInput.value = f.name;
          nameError.hidden = true;
          nameInput.removeAttribute('aria-invalid');
          nameInput.blur();
        }
      });
      descriptionInput.addEventListener('change', () => {
        const description = descriptionInput.value.trim().slice(0, 500);
        if (description === (f.description || '')) return;
        f.description = description;
        commit(false);
      });
      descriptionInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          descriptionInput.value = f.description || '';
          descriptionInput.blur();
        }
      });
      defaultInput.addEventListener('change', () => {
        const value = defaultInput.value === '' ? null : defaultInput.value;
        const error = validateFieldDefault({ ...f, defaultValue: value });
        if (error) {
          fieldError.textContent = error;
          fieldError.hidden = false;
          defaultInput.setAttribute('aria-invalid', 'true');
          defaultInput.focus();
          return;
        }
        if (value === f.defaultValue) return;
        f.defaultValue = value;
        fieldError.hidden = true;
        defaultInput.removeAttribute('aria-invalid');
        commit(false);
      });
      defaultInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); defaultInput.blur(); }
        if (event.key === 'Escape') {
          defaultInput.value = f.defaultValue ?? '';
          fieldError.hidden = true;
          defaultInput.removeAttribute('aria-invalid');
          defaultInput.blur();
        }
      });

      typeSel.addEventListener('change', (e) => {
        const referenced = isReferencedSource(state, t.id, f.id);
        setFieldType(state, t.id, f.id, e.target.value);
        const defaultError = validateFieldDefault(f);
        fieldError.textContent = defaultError || '';
        fieldError.hidden = !defaultError;
        defaultInput.toggleAttribute('aria-invalid', !!defaultError);
        if (defaultError) fieldExtra.open = true;
        commit(referenced);
      });

      block.querySelector('.duplicate-field').addEventListener('click', () => {
        const field = {
          id: makeId('f'),
          name: uniqueName(t.fields.map((x) => x.name), `${f.name}_copia`),
          type: f.type,
          pk: false,
          nn: f.nn,
          ai: false,
          uq: f.uq,
          fk: false,
          description: f.description || '',
          defaultValue: f.defaultValue ?? null,
        };
        t.fields.splice(t.fields.indexOf(f) + 1, 0, field);
        commit(true);
        toast(`Campo duplicado: ${field.name}`);
      });

      block.querySelector('.delete-field').addEventListener('click', async () => {
        const refs = state.relations.some(
          (r) => (r.sourceTable === t.id && r.sourceField === f.id) || (r.targetTable === t.id && r.targetField === f.id)
        );
        if (!await confirmAction(
          '¿Eliminar este campo?',
          `Se eliminará "${f.name}"${refs ? ' y sus relaciones asociadas' : ''}. Esta acción se puede deshacer.`,
          'Eliminar',
          true
        )) return;
        const err = removeField(state, t.id, f.id);
        if (err) { toast(err); return; }
        commit(true);
      });

      cbPk.addEventListener('change', () => {
        if (!cbPk.checked && !f.uq && isReferencedSource(state, t.id, f.id)) {
          cbPk.checked = true;
          toast('Una relación referencia este campo: debe seguir siendo PK o UNIQUE');
          return;
        }
        f.pk = cbPk.checked;
        if (f.pk) { f.nn = true; cbNn.checked = true; }
        commit(false);
      });
      cbNn.addEventListener('change', () => {
        if (f.pk && !cbNn.checked) { cbNn.checked = true; return; }
        f.nn = cbNn.checked;
        commit(false);
      });
      cbUq.addEventListener('change', () => {
        if (!cbUq.checked && !f.pk && isReferencedSource(state, t.id, f.id)) {
          cbUq.checked = true;
          toast('Una relación referencia este campo: debe seguir siendo PK o UNIQUE');
          return;
        }
        f.uq = cbUq.checked;
        commit(false);
      });
      cbAi.addEventListener('change', () => {
        if (cbAi.checked && !INT_TYPES.includes(f.type)) {
          cbAi.checked = false;
          toast('El autoincremento solo aplica a INT o BIGINT');
          return;
        }
        if (cbAi.checked && f.defaultValue !== null && f.defaultValue !== undefined) {
          cbAi.checked = false;
          toast('Quita el valor por defecto antes de activar el autoincremento');
          return;
        }
        f.ai = cbAi.checked;
        defaultInput.disabled = f.ai;
        commit(false);
      });
      fe.appendChild(block);
    }

    $('#addField').addEventListener('click', () => {
      t.fields.push({
        id: makeId('f'), name: uniqueName(t.fields.map((f) => f.name), 'nuevo_campo'),
        type: 'VARCHAR(255)', description: '', defaultValue: null, pk: false, nn: false, ai: false, uq: false, fk: false,
      });
      commit(true);
    });
    $('#deleteTable').addEventListener('click', deleteSelectedTable);
  }

  async function deleteSelectedTable() {
    const t = getTable(state, state.selected);
    if (!t) return;
    const hasRels = state.relations.some((r) => r.sourceTable === t.id || r.targetTable === t.id);
    if (!await confirmAction(
      '¿Eliminar esta tabla?',
      `Se eliminará "${t.name}"${hasRels ? ' y sus relaciones (incluidas las tablas puente N:M asociadas)' : ''}. Esta acción se puede deshacer.`,
      'Eliminar',
      true
    )) return;
    removeTable(state, t.id);
    state.selected = null;
    commit(true);
  }

  /* ---------- Lista de relaciones ---------- */

  function renderRelations() {
    const root = $('#relationsList');
    if (!state.relations.length) { root.innerHTML = '<p class="muted">Aún no hay relaciones.</p>'; return; }
    const items = [];
    const seen = new Set();
    for (const r of state.relations) {
      const a = getTable(state, r.sourceTable);
      const b = getTable(state, r.targetTable);
      const tf = getField(b, r.targetField);
      if (r.group) {
        if (seen.has(r.group)) continue;
        seen.add(r.group);
        const pair = state.relations.filter((x) => x.group === r.group);
        const other = getTable(state, pair[1] && pair[1].sourceTable);
        items.push({
          id: r.id, group: true, left: a ? a.name : '?', mid: 'N ↔ M', right: other ? other.name : '?',
          sub: `tabla puente: ${b ? b.name : '?'}`, onDelete: r.onDelete, onUpdate: r.onUpdate,
        });
      } else {
        items.push({
          id: r.id, left: a ? a.name : '?', mid: r.type === '1:1' ? '1 → 1' : '1 → N', right: b ? b.name : '?',
          sub: `FK ${tf ? tf.name : '?'} · ON DELETE ${r.onDelete} · ON UPDATE ${r.onUpdate}`,
          onDelete: r.onDelete, onUpdate: r.onUpdate, type: r.type, optional: !!(tf && !tf.nn),
        });
      }
    }
    root.innerHTML = items
      .map(
        (i) =>
          `<div class="relation-item"><span>${esc(i.left)}</span><span class="arrow">${i.mid}</span><span>${esc(i.right)}</span>` +
          `<button class="edit-relation" data-id="${esc(i.id)}" title="Editar relación" aria-label="Editar relación">✎</button>` +
          `<button data-id="${esc(i.id)}" data-group="${i.group ? '1' : ''}" title="Eliminar relación" aria-label="Eliminar relación">×</button>` +
          `<span class="sub">${esc(i.sub)}</span></div>`
      )
      .join('');
    root.querySelectorAll('.edit-relation').forEach((btn) => {
      const item = items.find((entry) => entry.id === btn.dataset.id);
      if (item) btn.addEventListener('click', () => openEditRelationModal(item));
    });
    root.querySelectorAll('button').forEach((btn) =>
      btn.addEventListener('click', async () => {
        if (btn.classList.contains('edit-relation')) return;
        if (btn.dataset.group && !await confirmAction(
          '¿Eliminar esta relación?',
          'También se eliminará la tabla puente asociada. Esta acción se puede deshacer.',
          'Eliminar',
          true
        )) return;
        dropRelation(state, btn.dataset.id);
        if (!getTable(state, state.selected)) state.selected = null;
        commit(true);
      })
    );
  }

  /* ---------- Modal de relación ---------- */

  const HELP = {
    '1:1': 'Cada fila del origen se relaciona con, como máximo, una del destino. La FK va en la tabla destino y se marca UNIQUE.',
    '1:N': 'Una fila del origen puede relacionarse con muchas del destino. La FK va en la tabla destino.',
    'N:M': 'Se crea una tabla puente con una FK hacia cada tabla y una clave primaria compuesta.',
  };
  const TYPE_NAMES = { '1:1': 'Uno a uno (1:1)', '1:N': 'Uno a muchos (1:N)', 'N:M': 'Muchos a muchos (N:M)' };

  function openRelationModal(srcId, tgtId) {
    const a = getTable(state, srcId);
    const b = getTable(state, tgtId);
    if (!a || !b) return;
    const keys = (t) => t.fields.filter((f) => f.pk || f.uq);
    if (!keys(a).length) { toast(`"${a.name}" necesita un campo PK o UNIQUE para ser origen`); return; }
    const defKey = (t) => keys(t).find((f) => f.pk) || keys(t)[0];
    const keyOpts = (t) =>
      keys(t).length
        ? keys(t).map((f) => `<option value="${esc(f.id)}"${f === defKey(t) ? ' selected' : ''}>${esc(f.name)} (${esc(f.type)})</option>`).join('')
        : '<option value="">(sin PK ni UNIQUE)</option>';
    const actionOpts = (sel) => ACTIONS.map((x) => `<option${x === sel ? ' selected' : ''}>${x}</option>`).join('');

    const modal = document.createElement('div');
    modal.className = 'relation-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Crear relación');
    modal.innerHTML =
      `<div class="modal-card"><h3>Crear relación</h3>` +
      `<label for="relType">Tipo de relación</label>` +
      `<select class="control" id="relType">${RELATION_TYPES.map((x) => `<option value="${x}"${x === '1:N' ? ' selected' : ''}>${TYPE_NAMES[x]}</option>`).join('')}</select>` +
      `<p class="muted" id="relHelp"></p>` +
      `<label>Tabla origen (lado 1)</label><input class="input" value="${esc(a.name)}" disabled>` +
      `<label for="srcField">Campo clave de origen (PK o UNIQUE)</label><select class="control" id="srcField">${keyOpts(a)}</select>` +
      `<label>Tabla destino</label><input class="input" value="${esc(b.name)}" disabled>` +
      `<div id="tgtRow" hidden><label for="tgtField">Campo clave de destino (PK o UNIQUE)</label><select class="control" id="tgtField">${keyOpts(b)}</select></div>` +
      `<div id="fkRow"><label for="fkName">Nombre del campo FK (en la tabla destino)</label><input class="input" id="fkName" maxlength="64"></div>` +
      `<div id="jRow" hidden><label for="jName">Nombre de la tabla puente</label><input class="input" id="jName" maxlength="64" value="${esc(a.name + '_' + b.name)}"></div>` +
      `<label for="onDelete">ON DELETE</label><select class="control" id="onDelete">${actionOpts('NO ACTION')}</select>` +
      `<label for="onUpdate">ON UPDATE</label><select class="control" id="onUpdate">${actionOpts('NO ACTION')}</select>` +
      `<div id="optRow"><label class="check"><input type="checkbox" id="optional"> FK opcional (permite NULL)</label></div>` +
      `<div class="modal-actions"><button class="btn" id="cancelRel">Cancelar</button><button class="btn primary" id="confirmRel">Crear relación</button></div></div>`;
    document.body.appendChild(modal);

    const m = (s) => modal.querySelector(s);
    let fkTouched = false;
    let actionTouched = false;
    const close = () => modal.remove();

    function sync() {
      const type = m('#relType').value;
      const nm = type === 'N:M';
      m('#relHelp').textContent = HELP[type];
      m('#tgtRow').hidden = !nm;
      m('#fkRow').hidden = nm;
      m('#jRow').hidden = !nm;
      m('#optRow').hidden = nm;
      if (!fkTouched) {
        const sf = getField(a, m('#srcField').value);
        if (sf) m('#fkName').value = suggestFkName(a, sf);
      }
      if (!actionTouched) m('#onDelete').value = nm ? 'CASCADE' : 'NO ACTION';
    }
    m('#relType').addEventListener('change', sync);
    m('#srcField').addEventListener('change', sync);
    m('#fkName').addEventListener('input', () => { fkTouched = true; });
    m('#onDelete').addEventListener('change', () => { actionTouched = true; });
    sync();

    m('#cancelRel').addEventListener('click', close);
    modal.addEventListener('mousedown', (e) => { if (e.target === modal) close(); });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = [...modal.querySelectorAll('select, input:not([disabled]), button')].filter((el) => !el.closest('[hidden]'));
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    m('#confirmRel').addEventListener('click', () => {
      try {
        const res = createRelation(state, {
          type: m('#relType').value,
          sourceTable: a.id, sourceField: m('#srcField').value,
          targetTable: b.id, targetField: m('#tgtField').value,
          fkName: m('#fkName').value, junctionName: m('#jName').value,
          optional: m('#optional').checked,
          onDelete: m('#onDelete').value, onUpdate: m('#onUpdate').value,
        }, makeId);
        close();
        if (res.table) state.selected = res.table.id;
        commit(true);
        toast(res.table ? 'Relación N:M creada con su tabla puente' : 'Relación creada');
      } catch (err) {
        toast(err.message);
      }
    });
    m('#relType').focus();
  }

  function openEditRelationModal(item) {
    const relation = state.relations.find((candidate) => candidate.id === item.id);
    if (!relation) { toast('Relación no encontrada'); return; }
    const source = getTable(state, relation.sourceTable);
    const target = getTable(state, relation.targetTable);
    const targetField = getField(target, relation.targetField);
    if (!source || !target || !targetField) { toast('La relación tiene referencias incompletas'); return; }
    const grouped = !!relation.group;
    const modal = document.createElement('div');
    modal.className = 'relation-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Editar relación');
    modal.innerHTML =
      `<div class="modal-card"><h3>Editar relación</h3>` +
      `<p class="muted">${esc(source.name)} → ${esc(target.name)}${grouped ? ' (tabla puente N:M)' : ` · FK ${esc(targetField.name)}`}</p>` +
      (!grouped
        ? `<label for="editRelType">Tipo de relación</label><select class="control" id="editRelType">` +
          `<option value="1:N"${relation.type === '1:N' ? ' selected' : ''}>${TYPE_NAMES['1:N']}</option>` +
          `<option value="1:1"${relation.type === '1:1' ? ' selected' : ''}>${TYPE_NAMES['1:1']}</option></select>` +
          `<label class="check"><input type="checkbox" id="editRelOptional"${!targetField.nn ? ' checked' : ''}> FK opcional (permite NULL)</label>`
        : '<p class="muted">Se actualizarán las acciones de las dos claves foráneas de la tabla puente.</p>') +
      `<label for="editRelDelete">ON DELETE</label><select class="control" id="editRelDelete">` +
      ACTIONS.filter((action) => !grouped || action !== 'SET NULL').map((action) => `<option${relation.onDelete === action ? ' selected' : ''}>${action}</option>`).join('') +
      `</select><label for="editRelUpdate">ON UPDATE</label><select class="control" id="editRelUpdate">` +
      ACTIONS.filter((action) => !grouped || action !== 'SET NULL').map((action) => `<option${relation.onUpdate === action ? ' selected' : ''}>${action}</option>`).join('') +
      `</select><div class="modal-actions"><button class="btn" id="cancelEditRel">Cancelar</button>` +
      `<button class="btn primary" id="saveEditRel">Guardar cambios</button></div></div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#cancelEditRel').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.querySelector('#saveEditRel').addEventListener('click', () => {
      try {
        updateRelation(state, relation.id, {
          type: grouped ? undefined : modal.querySelector('#editRelType').value,
          optional: grouped ? undefined : modal.querySelector('#editRelOptional').checked,
          onDelete: modal.querySelector('#editRelDelete').value,
          onUpdate: modal.querySelector('#editRelUpdate').value,
        });
        close();
        commit(true);
        toast('Relación actualizada');
      } catch (err) {
        toast(err.message);
      }
    });
    modal.querySelector('#saveEditRel').focus();
  }

  /* ---------- Salida (SQL / JSON / resumen) ---------- */

  function summary(issues) {
    const rel = (r) => {
      const a = getTable(state, r.sourceTable), b = getTable(state, r.targetTable);
      const sf = getField(a, r.sourceField), tf = getField(b, r.targetField);
      const kind = r.group ? 'N:M vía puente' : r.type;
      return `${a && a.name}.${sf && sf.name} → ${b && b.name}.${tf && tf.name}  [${kind}, ON DELETE ${r.onDelete}]`;
    };
    return [
      'RESUMEN DEL MODELO', '==================',
      `Tablas: ${state.tables.length}`,
      `Relaciones: ${state.relations.length}`,
      `Campos: ${state.tables.reduce((n, t) => n + t.fields.length, 0)}`,
      `Motor SQL: ${$('#dialectSelect').selectedOptions[0].text}`,
      '', 'TABLAS',
      state.tables.map((t) =>
        `• ${t.name}${t.junction ? ' (tabla puente)' : ''}\n` +
        t.fields.map((f) => `   - ${f.name}: ${f.type}${f.pk ? ' [PK]' : ''}${f.fk ? ' [FK]' : ''}${f.uq ? ' [UNIQUE]' : ''}${f.nn ? ' [NOT NULL]' : ''}`).join('\n')
      ).join('\n\n') || 'Sin tablas',
      '', 'RELACIONES', state.relations.map(rel).join('\n') || 'Sin relaciones',
      '', 'ADVERTENCIAS', issues.length ? issues.map((i) => '⚠ ' + i).join('\n') : 'Sin advertencias',
    ].join('\n');
  }

  function renderOutput() {
    const issues = validateModel(state);
    $('[data-tab="summary"]').textContent = '☷ Resumen' + (issues.length ? ` (${issues.length} ⚠)` : '');
    const sqlEditor = $('#sqlEditor');
    const output = $('#output');
    const isSql = state.tab === 'sql';
    sqlEditor.hidden = !isSql;
    output.hidden = isSql;
    if (isSql) {
      if (!state.sqlDraftDirty || state.sqlDraft === null) state.sqlDraft = generateSQL(state, dialect());
      sqlEditor.value = state.sqlDraft;
    } else {
      output.textContent =
        state.tab === 'json' ? JSON.stringify(modelData(), null, 2)
        : summary(issues);
    }
    $('#sqlDraftNotice').hidden = !isSql || !state.sqlDraftDirty;
    updateSqlEditorActions();
  }

  function updateSqlEditorActions() {
    const isSql = state.tab === 'sql';
    $('#applySqlChangesBtn').hidden = !isSql || !state.sqlDraftDirty;
    $('#resetSqlBtn').hidden = !isSql || !state.sqlDraftDirty;
  }

  function resetSqlDraft() {
    state.sqlDraft = generateSQL(state, dialect());
    state.sqlDraftDirty = false;
    renderOutput();
    toast('SQL restaurado desde el modelo actual');
  }

  function selectWorkspaceTab(tab) {
    state.tab = tab;
    const diagram = tab === 'canvas';
    $('#canvasView').hidden = !diagram;
    $('#outputView').hidden = diagram;
    $('#outputActions').hidden = diagram;
    document.querySelectorAll('.editor-tabs .tab').forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    renderOutput();
  }

  /* ---------- Modos, carga y ejemplo ---------- */

  function setMode(mode) {
    state.mode = mode;
    state.relationSource = null;
    $('#selectBtn').classList.toggle('active', mode === 'select');
    $('#relationModeBtn').classList.toggle('active', mode === 'relation');
    $('#modeHint').textContent =
      mode === 'relation'
        ? 'Haz clic en la tabla origen y luego en la destino (la misma tabla para una autorrelación). Esc para salir.'
        : 'Arrastra las tablas para organizarlas. Espacio + arrastre desplaza el lienzo; clic derecho abre acciones.';
    renderCanvas();
  }

  function applyModel(m, status) {
    state.tables = m.tables;
    state.relations = m.relations;
    state.sqlDraft = null;
    state.sqlDraftDirty = false;
    state.selected = m.tables[0] ? m.tables[0].id : null;
    state.searchTarget = null;
    $('#diagramSearch').value = '';
    renderSearchResults();
    if (m.dialect) $('#dialectSelect').value = m.dialect;
    state.dirty = false;
    state.hasSavedCopy = false;
    setStatus(status);
    setMode('select');
    renderProperties();
    renderRelations();
    renderOutput();
    resetHistory();
    autosave({ updateStatus: false });
  }

  function loadModel(data, status) {
    const m = sanitizeModel(data, makeId);
    applyModel(m, status);
    return m;
  }

  function openSqlImportModal(initialSql = '', keepHistory = false) {
    const modal = document.createElement('div');
    modal.className = 'relation-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Importar esquema SQL');
    modal.innerHTML =
      `<div class="modal-card sql-import-card"><h3>Importar esquema SQL</h3>` +
      `<p class="muted">Pega DDL o carga un archivo. Se importan sentencias CREATE TABLE y claves simples; otras sentencias se omiten y se reportan.</p>` +
      `<textarea id="sqlImportText" class="control sql-import-text" aria-label="DDL SQL para importar" placeholder="CREATE TABLE ...">${esc(initialSql)}</textarea>` +
      `<input type="file" id="sqlModalFile" accept=".sql,text/plain" hidden>` +
      `<div id="sqlImportReport" class="sql-import-report" aria-live="polite">Analiza el SQL antes de importarlo.</div>` +
      `<div class="modal-actions"><button class="btn" id="chooseSqlFile">Cargar archivo</button>` +
      `<span class="tab-spacer"></span><button class="btn" id="cancelSqlImport">Cancelar</button>` +
      `<button class="btn" id="analyzeSql">Analizar SQL</button><button class="btn primary" id="applySqlImport" disabled>Importar modelo</button></div></div>`;
    document.body.appendChild(modal);
    const text = modal.querySelector('#sqlImportText');
    const report = modal.querySelector('#sqlImportReport');
    const apply = modal.querySelector('#applySqlImport');
    let parsed = null;
    const clearAnalysis = () => {
      parsed = null;
      apply.disabled = true;
      report.textContent = 'El SQL cambió. Analízalo nuevamente antes de importar.';
      report.classList.remove('has-warnings');
    };
    const close = () => modal.remove();
    modal.querySelector('#cancelSqlImport').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    text.addEventListener('input', clearAnalysis);
    modal.querySelector('#chooseSqlFile').addEventListener('click', () => modal.querySelector('#sqlModalFile').click());
    modal.querySelector('#sqlModalFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('El archivo SQL supera el límite de 5 MB');
        text.value = await file.text();
        clearAnalysis();
      } catch (err) {
        report.textContent = err.message;
        report.classList.add('has-warnings');
      }
      e.target.value = '';
    });
    modal.querySelector('#analyzeSql').addEventListener('click', () => {
      try {
        parsed = window.DBDSQLImport.parseSQL(text.value, makeId);
        parsed.warnings.push(...validateModel(parsed));
        apply.disabled = false;
        report.textContent = `Se encontraron ${parsed.tables.length} tabla(s) y ${parsed.relations.length} relación(es).` +
          (parsed.warnings.length ? `\n\nAdvertencias (${parsed.warnings.length}):\n• ${parsed.warnings.join('\n• ')}` : '\nSin advertencias.');
        report.classList.toggle('has-warnings', parsed.warnings.length > 0);
      } catch (err) {
        parsed = null;
        apply.disabled = true;
        report.textContent = `No se pudo analizar el SQL: ${err.message}`;
        report.classList.add('has-warnings');
      }
    });
    apply.addEventListener('click', async () => {
      if (!parsed) return;
      if (state.tables.length && !await confirmAction(
        '¿Reemplazar el modelo actual?',
        'La importación sustituirá las tablas y relaciones del diagrama.',
        'Importar modelo',
        true
      )) return;
      const imported = parsed;
      try {
        let model;
        if (keepHistory) {
          model = sanitizeModel({
            version: 2,
            dialect: dialect(),
            tables: imported.tables,
            relations: imported.relations,
          }, makeId);
          state.tables = model.tables;
          state.relations = model.relations;
          state.selected = model.tables[0] ? model.tables[0].id : null;
          state.searchTarget = null;
          $('#diagramSearch').value = '';
          renderSearchResults();
          state.sqlDraft = null;
          state.sqlDraftDirty = false;
          setMode('select');
          commit(true);
        } else {
          model = loadModel({
            version: 2,
            dialect: dialect(),
            tables: imported.tables,
            relations: imported.relations,
          }, 'Esquema SQL importado');
        }
        close();
        const warningCount = imported.warnings.length + model.warnings.length;
        toast(warningCount ? `Esquema importado con ${warningCount} advertencia(s); revisa el análisis SQL` : 'Esquema SQL importado');
      } catch (err) {
        report.textContent = `No se pudo importar el modelo: ${err.message}`;
        report.classList.add('has-warnings');
      }
    });
    text.focus();
    if (initialSql) modal.querySelector('#analyzeSql').click();
  }

  function loadSample() {
    const F = (id, name, type, o) => Object.assign({ id, name, type, pk: false, nn: false, ai: false, uq: false, fk: false }, o);
    const ID = (id) => F(id, 'id', 'INT', { pk: true, nn: true, ai: true });
    const R = (id, st, sf, tt, tf, o) => Object.assign({ id, type: '1:N', sourceTable: st, sourceField: sf, targetTable: tt, targetField: tf, onDelete: 'NO ACTION', onUpdate: 'NO ACTION', created: false, group: null }, o);
    const tables = [
      { id: 't1', name: 'clientes', x: 70, y: 65, color: COLORS[0], fields: [ID('f1'), F('f2', 'nombre', 'VARCHAR(255)', { nn: true }), F('f3', 'email', 'VARCHAR(255)', { uq: true }), F('f4', 'fecha_registro', 'DATETIME', { nn: true })] },
      { id: 't2', name: 'pedidos', x: 400, y: 90, color: COLORS[1], fields: [ID('f5'), F('f6', 'cliente_id', 'INT', { nn: true, fk: true }), F('f7', 'fecha_pedido', 'DATETIME', { nn: true }), F('f8', 'total', 'DECIMAL(10,2)', { nn: true })] },
      { id: 't3', name: 'productos', x: 75, y: 300, color: COLORS[2], fields: [ID('f9'), F('f10', 'nombre', 'VARCHAR(255)', { nn: true }), F('f11', 'precio', 'DECIMAL(10,2)', { nn: true }), F('f12', 'stock', 'INT', { nn: true })] },
      { id: 't4', name: 'detalle_pedido', x: 400, y: 330, color: COLORS[3], fields: [ID('f13'), F('f14', 'pedido_id', 'INT', { nn: true, fk: true }), F('f15', 'producto_id', 'INT', { nn: true, fk: true }), F('f16', 'cantidad', 'INT', { nn: true }), F('f17', 'precio_unitario', 'DECIMAL(10,2)', { nn: true })] },
      { id: 't5', name: 'perfiles_cliente', x: 730, y: 65, color: COLORS[4], fields: [ID('f18'), F('f19', 'cliente_id', 'INT', { nn: true, uq: true, fk: true }), F('f20', 'biografia', 'TEXT')] },
      { id: 't6', name: 'categorias', x: 760, y: 300, color: COLORS[5], fields: [ID('f21'), F('f22', 'nombre', 'VARCHAR(255)', { nn: true })] },
      { id: 't7', name: 'productos_categorias', x: 410, y: 570, color: '#6b7a90', junction: 'g1', fields: [F('f23', 'producto_id', 'INT', { pk: true, nn: true, fk: true }), F('f24', 'categoria_id', 'INT', { pk: true, nn: true, fk: true })] },
    ];
    const relations = [
      R('r1', 't1', 'f1', 't2', 'f6', { onDelete: 'CASCADE' }),
      R('r2', 't2', 'f5', 't4', 'f14', { onDelete: 'CASCADE' }),
      R('r3', 't3', 'f9', 't4', 'f15'),
      R('r4', 't1', 'f1', 't5', 'f19', { type: '1:1', onDelete: 'CASCADE', created: true, uqAdded: false }),
      R('r5', 't3', 'f9', 't7', 'f23', { onDelete: 'CASCADE', created: true, group: 'g1' }),
      R('r6', 't6', 'f21', 't7', 'f24', { onDelete: 'CASCADE', created: true, group: 'g1' }),
    ];
    loadModel({ tables, relations, dialect: 'mysql' }, 'Ejemplo cargado');
    toast('Ejemplo cargado: incluye relaciones 1:1, 1:N y N:M');
  }

  function openTemplatesModal() {
    const templates = window.DBTemplates.listTemplates();
    const modal = document.createElement('div');
    modal.className = 'relation-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'templatesTitle');
    modal.innerHTML =
      `<div class="modal-card template-card"><h3 id="templatesTitle">Plantillas de modelos</h3>` +
      `<p class="muted">Elige una estructura inicial que podrás editar libremente.</p>` +
      `<label for="templateSelect">Plantilla</label>` +
      `<select id="templateSelect" class="control">${templates.map((template) => `<option value="${esc(template.id)}">${esc(template.name)}</option>`).join('')}</select>` +
      `<p class="template-description" id="templateDescription"></p>` +
      `<div class="modal-actions"><button class="btn" id="cancelTemplates">Cancelar</button><button class="btn primary" id="loadTemplate">Cargar plantilla</button></div></div>`;
    document.body.appendChild(modal);
    const selectTemplate = modal.querySelector('#templateSelect');
    const description = modal.querySelector('#templateDescription');
    const updateDescription = () => {
      description.textContent = templates.find((template) => template.id === selectTemplate.value)?.description || '';
    };
    const close = () => modal.remove();
    selectTemplate.addEventListener('change', updateDescription);
    modal.querySelector('#cancelTemplates').addEventListener('click', close);
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
    modal.querySelector('#loadTemplate').addEventListener('click', async () => {
      const template = templates.find((item) => item.id === selectTemplate.value);
      if (!template) return;
      if (state.tables.length || state.sqlDraftDirty) {
        const choice = await openChoiceDialog({
          title: '¿Reemplazar el modelo actual?',
          message: 'Cargar una plantilla reemplazará las tablas y relaciones actuales, incluida su copia de recuperación automática. Puedes descargar un respaldo JSON antes de continuar.',
          initialAction: 'cancel',
          actions: [
            { value: 'cancel', label: 'Seguir editando', className: 'btn' },
            { value: 'discard', label: 'Reemplazar modelo', className: 'btn danger' },
            { value: 'save', label: 'Descargar copia(s) y reemplazar', className: 'btn primary' },
          ],
        });
        if (choice === 'cancel') return;
        if (choice === 'save') {
          download('modelo-base-datos.json', JSON.stringify(modelData(), null, 2), 'application/json');
          if (state.sqlDraftDirty) download('schema-draft.sql', state.sqlDraft || '', 'text/sql');
        }
      }
      try {
        const data = window.DBTemplates.createTemplate(template.id, makeId);
        const loaded = loadModel(data, `Plantilla "${template.name}" cargada`);
        close();
        toast(loaded.warnings.length
          ? `Plantilla cargada con ${loaded.warnings.length} advertencia(s)`
          : `Plantilla "${template.name}" cargada`);
      } catch (error) {
        toast(`No se pudo cargar la plantilla: ${error.message}`);
      }
    });
    updateDescription();
    selectTemplate.focus();
  }

  async function newProject() {
    if (state.dirty || state.sqlDraftDirty || (state.tables.length && !state.hasSavedCopy)) {
      const choice = await openChoiceDialog({
        title: '¿Crear un proyecto nuevo?',
        message: 'El proyecto tiene cambios y una copia de recuperación automática en este navegador. Descarga una copia JSON antes de reemplazarlo si quieres conservarla fuera de esta sesión.',
        initialAction: 'cancel',
        actions: [
          { value: 'cancel', label: 'Seguir editando', className: 'btn' },
          { value: 'discard', label: 'Descartar y crear', className: 'btn danger' },
          { value: 'save', label: 'Descargar copia(s) y crear', className: 'btn primary' },
        ],
      });
      if (choice === 'cancel') return;
      if (choice === 'save') downloadPendingChanges();
    }
    state.tables = []; state.relations = []; state.selected = null; state.dirty = false;
    state.sqlDraft = null;
    state.sqlDraftDirty = false;
    state.hasSavedCopy = false;
    state.searchTarget = null;
    $('#diagramSearch').value = '';
    renderSearchResults();
    setStatus('Proyecto vacío');
    setMode('select');
    renderProperties(); renderRelations(); renderOutput();
    resetHistory();
    autosave();
  }

  function newTable() {
    if (state.mode !== 'select') setMode('select');
    const n = state.tables.length;
    const t = {
      id: makeId('t'),
      name: uniqueName(state.tables.map((x) => x.name), 'tabla_' + (n + 1)),
      x: 35 + (n % 3) * 270, y: 35 + Math.floor(n / 3) * 230,
      color: COLORS[n % COLORS.length], junction: null,
      fields: [
        { id: makeId('f'), name: 'id', type: 'INT', description: '', defaultValue: null, pk: true, nn: true, ai: true, uq: false, fk: false },
        { id: makeId('f'), name: 'nombre', type: 'VARCHAR(255)', description: '', defaultValue: null, pk: false, nn: true, ai: false, uq: false, fk: false },
      ],
    };
    state.tables.push(t);
    state.selected = t.id;
    commit(true);
    toast('Tabla agregada');
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadPendingChanges() {
    let copies = 0;
    if (state.dirty || (state.tables.length && !state.hasSavedCopy)) {
      download('modelo-base-datos.json', JSON.stringify(modelData(), null, 2), 'application/json');
      copies += 1;
      state.dirty = false;
      state.hasSavedCopy = true;
      setStatus('Modelo guardado');
    }
    if (state.sqlDraftDirty) {
      download('schema-draft.sql', state.sqlDraft || '', 'text/sql');
      copies += 1;
      state.sqlDraftDirty = false;
      state.sqlDraft = null;
    }
    toast(copies === 1 ? 'Copia descargada' : 'Copias descargadas');
  }

  function buildDiagramSvg() {
    if (!state.tables.length) throw new Error('Agrega al menos una tabla al diagrama');
    const margin = 80;
    const metrics = new Map(state.tables.map((table) => {
      const card = cardEls.get(table.id);
      return [table.id, {
        width: card && card.offsetWidth || 230,
        height: card && card.offsetHeight || 160,
        card,
      }];
    }));
    const width = Math.ceil(Math.max(640, ...state.tables.map((table) => table.x + metrics.get(table.id).width)) + margin * 2);
    const height = Math.ceil(Math.max(400, ...state.tables.map((table) => table.y + metrics.get(table.id).height)) + margin * 2);
    const out = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Diagrama de base de datos">`,
      '<defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#dfe9f5" stroke-width="1"/></pattern>',
    ];
    state.tables.forEach((table, index) => {
      out.push(`<clipPath id="table-head-${index}"><rect x="${table.x + margin}" y="${table.y + margin}" width="${metrics.get(table.id).width}" height="36" rx="7"/></clipPath>`);
    });
    out.push('</defs>', `<rect width="${width}" height="${height}" fill="#f4f8fd"/>`, `<rect width="${width}" height="${height}" fill="url(#grid)"/>`);

    for (const relation of state.relations) {
      const source = getTable(state, relation.sourceTable);
      const target = getTable(state, relation.targetTable);
      if (!source || !target) continue;
      const sm = metrics.get(source.id), tm = metrics.get(target.id);
      const sourceRow = sm.card && [...sm.card.querySelectorAll('.column-row')].find((row) => row.dataset.fieldId === relation.sourceField);
      const targetRow = tm.card && [...tm.card.querySelectorAll('.column-row')].find((row) => row.dataset.fieldId === relation.targetField);
      const sy = source.y + margin + (sourceRow ? sourceRow.offsetTop + sourceRow.offsetHeight / 2 : 54);
      const ty = target.y + margin + (targetRow ? targetRow.offsetTop + targetRow.offsetHeight / 2 : 54);
      let sx, ex, sd, ed;
      if (source.x + sm.width + 30 <= target.x) { sx = source.x + margin + sm.width; sd = 1; ex = target.x + margin; ed = -1; }
      else if (target.x + tm.width + 30 <= source.x) { sx = source.x + margin; sd = -1; ex = target.x + margin + tm.width; ed = 1; }
      else { sx = source.x + margin + sm.width; sd = 1; ex = target.x + margin + tm.width; ed = 1; }
      const curve = sd === ed ? 60 : Math.max(40, Math.abs(ex - sx) / 2);
      out.push(`<path d="M ${sx} ${sy} C ${sx + sd * curve} ${sy}, ${ex + ed * curve} ${ty}, ${ex} ${ty}" fill="none" stroke="#537ca8" stroke-width="2.2"/>`);
      for (const [x, y, direction, many] of [[sx, sy, sd, false], [ex, ty, ed, relation.type !== '1:1']]) {
        if (many) {
          out.push(`<path d="M ${x + direction * 14} ${y} L ${x} ${y - 7} M ${x + direction * 14} ${y} L ${x} ${y} M ${x + direction * 14} ${y} L ${x} ${y + 7}" fill="none" stroke="#537ca8" stroke-width="2"/>`);
        } else {
          out.push(`<path d="M ${x + direction * 9} ${y - 6} L ${x + direction * 9} ${y + 6} M ${x + direction * 14} ${y - 6} L ${x + direction * 14} ${y + 6}" fill="none" stroke="#537ca8" stroke-width="2"/>`);
        }
      }
      out.push(`<text x="${(sx + ex) / 2 + (sd === ed ? sd * 40 : 0)}" y="${(sy + ty) / 2 - 6}" fill="#315477" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">${relation.type === '1:1' ? '1 : 1' : '1 : N'}</text>`);
    }

    state.tables.forEach((table, index) => {
      const { width: tableWidth, height: tableHeight } = metrics.get(table.id);
      const x = table.x + margin, y = table.y + margin;
      const color = esc(table.color || '#1684e8');
      out.push(`<rect x="${x}" y="${y}" width="${tableWidth}" height="${tableHeight}" rx="9" fill="#fff" stroke="${color}" stroke-width="2"/>`);
      out.push(`<rect x="${x + 1}" y="${y + 1}" width="${tableWidth - 2}" height="36" fill="${color}" clip-path="url(#table-head-${index})"/>`);
      out.push(`<text x="${x + 12}" y="${y + 23}" fill="#fff" font-family="sans-serif" font-size="13" font-weight="700">${table.junction ? '⇄' : '▦'} ${esc(table.name)}</text>`);
      out.push(`<text x="${x + tableWidth - 10}" y="${y + 22}" fill="#fff" font-family="sans-serif" font-size="10" text-anchor="end">${table.fields.length}</text>`);
      table.fields.forEach((field, fieldIndex) => {
        const rowY = y + 36 + fieldIndex * 27;
        if (fieldIndex) out.push(`<path d="M ${x + 1} ${rowY} H ${x + tableWidth - 1}" stroke="#e8eef5"/>`);
        const key = `${field.pk ? 'PK ' : ''}${field.fk ? 'FK' : ''}` || '·';
        const type = `${field.type}${field.uq && !field.pk ? ' · UQ' : ''}`;
        const fieldLabel = `${field.name}${field.nn && !field.pk ? ' *' : ''}`;
        out.push(`<text x="${x + 9}" y="${rowY + 18}" fill="#d99a19" font-family="sans-serif" font-size="9" font-weight="700">${key}</text>`);
        out.push(`<text x="${x + 43}" y="${rowY + 18}" fill="#12243c" font-family="sans-serif" font-size="11">${esc(fieldLabel)}</text>`);
        out.push(`<text x="${x + tableWidth - 9}" y="${rowY + 18}" fill="#53708f" font-family="sans-serif" font-size="9" text-anchor="end">${esc(type)}</text>`);
      });
    });
    out.push('</svg>');
    return { svg: out.join(''), width, height };
  }

  function exportDiagramSvg() {
    try {
      const { svg } = buildDiagramSvg();
      download('diagrama-db-designer.svg', svg, 'image/svg+xml;charset=utf-8');
      toast('Diagrama SVG descargado');
    } catch (err) {
      toast(`No se pudo exportar el diagrama: ${err.message}`);
    }
  }

  async function exportDiagramPng() {
    let imageUrl;
    try {
      const { svg, width, height } = buildDiagramSvg();
      if (width * height > 48000000) throw new Error('El diagrama es demasiado grande para PNG; exporta como SVG');
      imageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const image = new Image();
      image.src = imageUrl;
      await image.decode();
      const target = document.createElement('canvas');
      target.width = width;
      target.height = height;
      const context = target.getContext('2d');
      if (!context) throw new Error('El navegador no pudo crear el lienzo de exportación');
      context.fillStyle = '#f4f8fd';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0);
      const blob = await new Promise((resolve) => target.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('El navegador no pudo generar el archivo PNG');
      download('diagrama-db-designer.png', blob, 'image/png');
      toast('Diagrama PNG descargado');
    } catch (err) {
      toast(`No se pudo exportar PNG: ${err.message}`);
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    }
  }

  function getCurrentOutput() {
    const content = state.tab === 'sql' ? $('#sqlEditor').value : $('#output').textContent;
    switch (state.tab) {
      case 'json':
        return { content, type: 'application/json', extension: 'json', label: 'JSON' };
      case 'summary':
        return { content, type: 'text/plain', extension: 'txt', label: 'resumen' };
      default:
        return { content, type: 'text/sql', extension: 'sql', label: `SQL (${dialect()})` };
    }
  }

  function downloadCurrentTab() {
    const { content, type, extension, label } = getCurrentOutput();
    const fileName = state.tab === 'sql'
      ? `schema-${dialect()}.${extension}`
      : state.tab === 'json'
        ? 'modelo-db-designer.json'
        : `resumen-db-designer.${extension}`;
    download(fileName, content, type);
    toast(`${label} descargado`);
  }

  function duplicateSelectedTable() {
    const table = getTable(state, state.selected);
    if (!table) {
      toast('Selecciona una tabla para duplicarla');
      return;
    }
    const clone = JSON.parse(JSON.stringify(table));
    clone.id = makeId('t');
    const sourceCard = cardEls.get(table.id);
    const width = sourceCard && sourceCard.offsetWidth || 230;
    const height = sourceCard && sourceCard.offsetHeight || 160;
    const gap = 28;
    const canPlace = (x, y) => state.tables.every((other) => {
      const card = cardEls.get(other.id);
      const otherWidth = card && card.offsetWidth || 230;
      const otherHeight = card && card.offsetHeight || 160;
      return x + width + gap <= other.x || other.x + otherWidth + gap <= x ||
        y + height + gap <= other.y || other.y + otherHeight + gap <= y;
    });
    let position = null;
    for (let step = 1; step <= state.tables.length + 1 && !position; step++) {
      const distanceX = width + gap, distanceY = height + gap;
      const candidates = [
        [table.x + step * distanceX, table.y],
        [table.x, table.y + step * distanceY],
        [Math.max(0, table.x - step * distanceX), table.y],
        [table.x, Math.max(0, table.y - step * distanceY)],
      ];
      position = candidates.find(([x, y]) => x <= 1800 && y <= 1400 && canPlace(x, y));
    }
    if (!position) {
      const farRight = Math.max(...state.tables.map((item) => {
        const card = cardEls.get(item.id);
        return item.x + (card && card.offsetWidth || 230);
      }));
      position = [Math.min(1800, farRight + gap), table.y];
    }
    [clone.x, clone.y] = position;
    clone.name = uniqueName(state.tables.map((t) => t.name), `${table.name}_copia`);
    clone.fields = clone.fields.map((field) => ({ ...field, id: makeId('f') }));
    clone.junction = null;
    state.tables.push(clone);
    state.selected = clone.id;
    commit(true);
    toast(`Tabla duplicada: ${clone.name}`);
  }

  async function copySelectedTableToClipboard() {
    const table = getTable(state, state.selected);
    if (!table) {
      toast('Selecciona una tabla para copiarla');
      return;
    }
    try {
      const payload = JSON.stringify(table, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        throw new Error('Portapapeles no disponible');
      }
      toast(`Tabla "${table.name}" copiada`);
    } catch (err) {
      toast('No se pudo copiar la tabla al portapapeles');
    }
  }

  async function pasteTableFromClipboard() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('El portapapeles no está disponible en este navegador');
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) throw new Error('Portapapeles vacío');
      const data = JSON.parse(text);
      const candidate = Array.isArray(data.tables) ? data.tables[0] : data;
      if (!candidate || !Array.isArray(candidate.fields)) {
        throw new Error('Contenido no válido para pegar una tabla');
      }
      const sanitized = sanitizeModel({ tables: [{ ...candidate, id: 'clipboard_table', x: 80, y: 80 }], relations: [] }, makeId);
      const pasted = sanitized.tables[0];
      pasted.name = uniqueName(state.tables.map((t) => t.name), pasted.name || 'tabla_pasteada');
      pasted.x = Math.min(1800, 80 + state.tables.length * 30);
      pasted.y = Math.min(1400, 80 + state.tables.length * 24);
      state.tables.push(pasted);
      state.selected = pasted.id;
      commit(true);
      toast(`Tabla pegada: ${pasted.name}`);
    } catch (err) {
      toast(err.message || 'No se pudo pegar la tabla');
    }
  }

  function attachResizeHandle(handle, side) {
    if (!handle) return;
    handle.addEventListener('pointerdown', (event) => {
      const startX = event.clientX;
      const property = side === 'left' ? '--sidebar-left-width' : '--sidebar-right-width';
      const current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(property)) || (side === 'left' ? 220 : 290);
      const move = (moveEvent) => {
        const delta = moveEvent.clientX - startX;
        const next = side === 'left'
          ? Math.min(420, Math.max(170, current + delta))
          : Math.min(420, Math.max(220, current - delta));
        document.documentElement.style.setProperty(property, `${next}px`);
      };
      const stop = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
    });
  }

  /* ---------- Eventos ---------- */

  $('#selectBtn').onclick = () => setMode('select');
  $('#addTableBtn').onclick = newTable;
  $('#relationModeBtn').onclick = () => {
    if (state.tables.length < 1) { toast('Crea al menos una tabla'); return; }
    setMode('relation');
    toast('Modo relación: selecciona la tabla origen y luego la destino');
  };
  $('#newBtn').onclick = newProject;
  $('#templatesBtn').onclick = openTemplatesModal;
  $('#importSqlBtn').onclick = openSqlImportModal;
  $('#sampleBtn').onclick = loadSample;
  $('#duplicateTableBtn').onclick = duplicateSelectedTable;
  $('#copyTableBtn').onclick = copySelectedTableToClipboard;
  $('#pasteTableBtn').onclick = pasteTableFromClipboard;
  $('#undoBtn').onclick = undo;
  $('#redoBtn').onclick = redo;
  $('#organizeTablesBtn').onclick = organizeTables;
  $('#openBtn').onclick = () => $('#fileInput').click();
  $('#saveBtn').onclick = () => {
    download('modelo-base-datos.json', JSON.stringify(modelData(), null, 2), 'application/json');
    state.dirty = false;
    state.hasSavedCopy = true;
    setStatus('Modelo guardado');
    toast('JSON descargado');
  };
  $('#exportBtn').onclick = () => {
    const issues = validateModel(state);
    const fileName = `schema-${dialect()}.sql`;
    download(fileName, generateSQL(state, dialect()), 'text/sql');
    toast(issues.length ? `SQL exportado con ${issues.length} advertencia(s): revisa la pestaña Resumen` : 'SQL exportado');
  };
  $('#exportDocsBtn').onclick = () => {
    try {
      const markdown = window.DBDocs.generateMarkdown({ tables: state.tables, relations: state.relations }, dialect());
      download('documentacion-esquema.md', markdown, 'text/markdown;charset=utf-8');
      toast('Documentación Markdown descargada');
    } catch (error) {
      toast(`No se pudo generar la documentación: ${error.message}`);
    }
  };
  $('#downloadBtn').onclick = downloadCurrentTab;
  $('#applySqlChangesBtn').onclick = () => openSqlImportModal($('#sqlEditor').value, true);
  $('#resetSqlBtn').onclick = resetSqlDraft;
  $('#exportSvgBtn').onclick = exportDiagramSvg;
  $('#exportPngBtn').onclick = exportDiagramPng;
  $('#fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('El archivo es demasiado grande (máx. 5 MB)');
      const m = loadModel(JSON.parse(await file.text()), 'Modelo cargado');
      toast(m.warnings.length ? `Modelo importado con ${m.warnings.length} advertencia(s)` : 'Modelo importado correctamente');
    } catch (err) {
      toast('No se pudo importar: ' + err.message);
    }
    e.target.value = '';
  };
  $('#dialectSelect').onchange = () => {
    state.dirty = true;
    setStatus('Cambios sin guardar · autoguardado local');
    autosave();
    renderOutput();
  };
  $('#zoomIn').onclick = () => setZoom(state.zoom + 0.1);
  $('#zoomOut').onclick = () => setZoom(state.zoom - 0.1);
  $('#fitBtn').onclick = fitToScreen;
  $('#centerSelectedBtn').onclick = () => centerTable();
  $('#zoomLabel').onclick = () => setZoom(1);
  $('#diagramSearch').addEventListener('input', () => {
    state.searchTarget = null;
    renderCanvas();
    renderSearchResults();
  });
  $('#diagramSearch').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = findSearchResults(e.currentTarget.value)[0];
    if (!first) return;
    e.preventDefault();
    focusSearchResult(first.tableId, first.fieldId);
  });
  $('#searchResults').addEventListener('click', (e) => {
    const button = e.target.closest('.search-result');
    if (!button) return;
    focusSearchResult(button.dataset.tableId, button.dataset.fieldId);
  });
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    setZoom(
      state.zoom + (e.deltaY < 0 ? 0.1 : -0.1),
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  }, { passive: false });
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 1 && !(event.button === 0 && spacePan)) return;
    if (event.button === 0 && event.target.closest('button, input, select, textarea')) return;
    event.preventDefault();
    event.stopPropagation();
    activePan = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: canvas.scrollLeft, top: canvas.scrollTop };
    canvas.classList.add('panning');
    canvas.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', moveCanvasPan);
    window.addEventListener('pointerup', stopCanvasPan);
    window.addEventListener('pointercancel', stopCanvasPan);
  }, true);
  const moveCanvasPan = (event) => {
    if (!activePan || event.pointerId !== activePan.pointerId) return;
    canvas.scrollLeft = activePan.left - (event.clientX - activePan.x);
    canvas.scrollTop = activePan.top - (event.clientY - activePan.y);
  };
  const stopCanvasPan = () => {
    window.removeEventListener('pointermove', moveCanvasPan);
    window.removeEventListener('pointerup', stopCanvasPan);
    window.removeEventListener('pointercancel', stopCanvasPan);
    activePan = null;
    canvas.classList.remove('panning');
  };
  document.querySelectorAll('.editor-tabs .tab').forEach((button) => {
    button.onclick = () => selectWorkspaceTab(button.dataset.tab);
  });
  $('#copyBtn').onclick = async () => {
    try { await navigator.clipboard.writeText(getCurrentOutput().content); toast('Contenido copiado'); }
    catch (e) { toast('No se pudo copiar automáticamente; selecciona el texto.'); }
  };
  $('#sqlEditor').addEventListener('input', (e) => {
    state.sqlDraft = e.currentTarget.value;
    state.sqlDraftDirty = true;
    updateSqlEditorActions();
    $('#sqlDraftNotice').hidden = false;
  });
  $('#sqlEditor').addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const editor = e.currentTarget;
      const start = editor.selectionStart, end = editor.selectionEnd;
      editor.setRangeText('  ', start, end, 'end');
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && state.sqlDraftDirty) {
      e.preventDefault();
      openSqlImportModal(e.currentTarget.value, true);
    }
  });
  canvas.addEventListener('click', (e) => {
    if (e.target !== canvas && e.target !== layer) return;
    canvas.focus({ preventScroll: true });
    if (state.relationSource) { state.relationSource = null; renderCanvas(); return; }
    if (state.selected) select(null);
  });
  canvas.addEventListener('contextmenu', (event) => {
    if (event.target.closest('.table-card, .diagram-search, .canvas-empty button')) return;
    openContextMenu(event, [
      { label: 'Agregar tabla nueva', run: newTable },
      { label: 'Ajustar diagrama a la pantalla', run: fitToScreen },
      { label: 'Centrar tabla seleccionada', run: () => centerTable(), disabled: !state.selected },
      { label: 'Duplicar tabla seleccionada', run: duplicateSelectedTable, disabled: !state.selected },
    ]);
  });
  document.addEventListener('pointerdown', (event) => {
    if (contextMenu && !contextMenu.contains(event.target)) closeContextMenu();
  });
  window.addEventListener('keydown', (e) => {
    const modalOpen = !!document.querySelector('.relation-modal');
    const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement && document.activeElement.tagName);
    if (modalOpen) return;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    const focusIsButton = document.activeElement && (document.activeElement.tagName === 'BUTTON' || document.activeElement.getAttribute('role') === 'button');
    if (e.code === 'Space' && !typing && !focusIsButton) {
      spacePan = true;
      canvas.classList.add('pan-ready');
      e.preventDefault();
      return;
    }
    if (mod && k === 'f') {
      e.preventDefault();
      selectWorkspaceTab('canvas');
      $('#diagramSearch').focus();
      return;
    }
    if (e.key === 'Escape') {
      if (contextMenu) { closeContextMenu(); return; }
      if (state.mode === 'relation') setMode('select');
      $('#searchResults').hidden = true;
      return;
    }
    if (e.shiftKey && e.key === 'F10' && state.selected && !typing) {
      const selectedCard = cardEls.get(state.selected);
      const rect = selectedCard && selectedCard.getBoundingClientRect();
      if (rect) showTableContextMenu(state.selected, new MouseEvent('contextmenu', {
        clientX: rect.left + 24,
        clientY: rect.top + 24,
        bubbles: true,
        cancelable: true,
      }));
      return;
    }
    if (typing) return;
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redo(); return; }
    if (mod && k === 'd') { e.preventDefault(); duplicateSelectedTable(); return; }
    if (mod && k === 'c') { e.preventDefault(); copySelectedTableToClipboard(); return; }
    if (mod && k === 'v') { e.preventDefault(); pasteTableFromClipboard(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selected) {
      e.preventDefault();
      deleteSelectedTable();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code !== 'Space') return;
    spacePan = false;
    canvas.classList.remove('pan-ready');
    if (activePan) stopCanvasPan();
  });
  window.addEventListener('blur', () => {
    spacePan = false;
    canvas.classList.remove('pan-ready');
    if (activePan) stopCanvasPan();
  });
  window.addEventListener('beforeunload', (e) => {
    if (state.autosaveFailed || state.sqlDraftDirty) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- Inicio ---------- */

  attachResizeHandle(document.querySelector('.resize-handle[data-side="left"]'), 'left');
  attachResizeHandle(document.querySelector('.resize-handle[data-side="right"]'), 'right');

  renderAll();
  resetHistory();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.tables) && Array.isArray(saved.relations)) {
      loadModel(saved, 'Sesión anterior restaurada');
      toast('Se restauró tu sesión anterior');
    }
  } catch (error) {
    setStatus('No se pudo restaurar el autoguardado');
    toast(`No se pudo restaurar el autoguardado: ${error.message}`);
  }
})();
