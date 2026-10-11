(() => {
  const canvas = document.getElementById('canvas');
  const wrap = document.getElementById('canvasWrap');
  const svg = document.getElementById('connectionsSvg');
  const emptyState = document.getElementById('emptyState');
  const noSelection = document.getElementById('noSelection');
  const propertyForm = document.getElementById('propertyForm');
  const edgePropertyForm = document.getElementById('edgePropertyForm');
  const edgeLabel = document.getElementById('edgeLabel');
  const edgeSummary = document.getElementById('edgeSummary');
  const nodeName = document.getElementById('nodeName');
  const nodeType = document.getElementById('nodeType');
  const nodeIconSearch = document.getElementById('nodeIconSearch');
  const iconPicker = document.getElementById('iconPicker');
  const localIconResults = document.getElementById('localIconResults');
  const remoteIconResults = document.getElementById('remoteIconResults');
  const remoteIconStatus = document.getElementById('remoteIconStatus');
  const selectedIcon = document.getElementById('selectedIcon');
  const nodeDescription = document.getElementById('nodeDescription');
  const componentDetails = document.getElementById('componentDetails');
  const componentDetailsSummary = document.getElementById('componentDetailsSummary');
  const nodeId = document.getElementById('nodeId');
  const elementCount = document.getElementById('elementCount');
  const modeStatus = document.getElementById('modeStatus');
  const zoomLabel = document.getElementById('zoomLabel');
  const toast = document.getElementById('toast');
  const importJsonFile = document.getElementById('importJsonFile');
  const diagramJson = document.getElementById('diagramJson');
  const diagramView = document.getElementById('diagramView');
  const jsonView = document.getElementById('jsonView');
  const diagramTab = document.getElementById('diagramTab');
  const jsonTab = document.getElementById('jsonTab');
  const selectionActions = document.getElementById('selectionActions');
  const selectionCount = document.getElementById('selectionCount');
  const selectionMarquee = document.getElementById('selectionMarquee');
  const contextMenu = document.getElementById('contextMenu');

  const ICONS = window.ArqSketchDiagram.ICONS;
  const DETAIL_FIELDS = window.ArqSketchDiagram.DETAIL_FIELDS;
  const HTTP_METHODS = window.ArqSketchDiagram.HTTP_METHODS;
  const ENDPOINT_ACCESS = window.ArqSketchDiagram.ENDPOINT_ACCESS;
  const NODE_SIZE = window.ArqSketchDiagram.NODE_SIZE;
  const DEFAULT_PANEL_WIDTHS = { library: 252, properties: 340 };
  const PANEL_LIMITS = {
    library: { min: 190, max: 360, key: 'libraryResizer', css: '--sidebar-width' },
    properties: { min: 320, max: 420, key: 'propertiesResizer', css: '--properties-width' },
  };
  const TYPES = {
    frontend: { label: 'Frontend', symbol: '▤', defaultName: 'Aplicación web', desc: 'Interfaz para el usuario' },
    backend: { label: 'Backend / API', symbol: '⌘', defaultName: 'API principal', desc: 'Lógica de negocio y endpoints' },
    database: { label: 'Base de datos', symbol: '▤', defaultName: 'Base de datos', desc: 'Almacenamiento persistente' },
    service: { label: 'Servicio externo', symbol: '◇', defaultName: 'Servicio externo', desc: 'Integración con otro sistema' },
    cloud: { label: 'Nube / Hosting', symbol: '☁', defaultName: 'Servidor cloud', desc: 'Infraestructura de despliegue' },
    user: { label: 'Usuario', symbol: '♙', defaultName: 'Usuario', desc: 'Actor que utiliza el sistema' }
  };
  let nodes = [];
  let edges = [];
  let selected = null;
  let selectedNodeIds = new Set();
  let copiedSelection = null;
  let contextTarget = null;
  let connectMode = false;
  let connectFrom = null;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let nextId = 1;
  let toastTimer;
  let iconSearchTimer;
  let iconSearchController;
  let history = [];
  let historyIndex = -1;
  let historyTimer;
  let historySuspended = false;
  let backgroundPointerMoved = false;
  let panelWidths = { ...DEFAULT_PANEL_WIDTHS };
  const HISTORY_LIMIT = 100;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
  }
  function applyPanelWidths() {
    Object.entries(PANEL_LIMITS).forEach(([panel, config]) => {
      document.documentElement.style.setProperty(config.css, `${panelWidths[panel]}px`);
      const handle = document.getElementById(config.key);
      handle.setAttribute('aria-valuenow', String(panelWidths[panel]));
    });
  }
  function resizePanel(panel, requestedWidth) {
    const config = PANEL_LIMITS[panel];
    const otherPanel = panel === 'library' ? 'properties' : 'library';
    const maxAvailable = window.innerWidth - panelWidths[otherPanel] - 336;
    const maxWidth = Math.min(config.max, maxAvailable);
    if (maxWidth < config.min) return;
    panelWidths[panel] = Math.round(Math.max(config.min, Math.min(maxWidth, requestedWidth)));
    applyPanelWidths();
  }
  function savePanelWidths() {
    try {
      localStorage.setItem('arqsketch-layout', JSON.stringify(panelWidths));
    } catch (error) {
      notify(`No se pudo guardar el tamaño de los paneles: ${error.message}`);
    }
  }
  function loadPanelWidths() {
    try {
      const raw = localStorage.getItem('arqsketch-layout');
      if (!raw) {
        applyPanelWidths();
        return;
      }
      const stored = JSON.parse(raw);
      for (const panel of Object.keys(PANEL_LIMITS)) {
        if (typeof stored[panel] !== 'number' || !Number.isFinite(stored[panel])) {
          throw new Error('La configuración de tamaño guardada no es válida');
        }
        const { min, max } = PANEL_LIMITS[panel];
        panelWidths[panel] = Math.max(min, Math.min(max, stored[panel]));
      }
    } catch (error) {
      panelWidths = { ...DEFAULT_PANEL_WIDTHS };
      notify(`No se pudo restaurar el tamaño de los paneles: ${error.message}`);
    }
    applyPanelWidths();
  }
  function beginPanelResize(event, panel) {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panelWidths[panel];
    const direction = panel === 'library' ? 1 : -1;
    const move = moveEvent => resizePanel(panel, startWidth + direction * (moveEvent.clientX - startX));
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('mouseup', finish);
      savePanelWidths();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('mouseup', finish);
  }
  function makeId(prefix) { return prefix + '-' + String(nextId++).padStart(3, '0'); }
  function getNode(id) { return nodes.find(n => n.id === id); }
  function nodeCenter(n) {
    const element = document.getElementById(n.id);
    return { x: n.x + (element?.offsetWidth || n.width || 228) / 2, y: n.y + (element?.offsetHeight || n.height || 91) / 2 };
  }
  function findAvailablePosition(x, y) {
    const spacingX = 264;
    const spacingY = 190;
    const maxRing = Math.max(4, Math.min(nodes.length + 2, 50));
    for (let ring = 0; ring <= maxRing; ring += 1) {
      for (let row = -ring; row <= ring; row += 1) {
        for (let column = -ring; column <= ring; column += 1) {
          if (ring && Math.abs(row) !== ring && Math.abs(column) !== ring) continue;
          const candidate = {
            x: Math.max(8, x + column * spacingX),
            y: Math.max(8, y + row * spacingY),
          };
          const overlaps = nodes.some(node => {
            const element = document.getElementById(node.id);
            const width = element?.offsetWidth || 228;
            const height = element?.offsetHeight || 110;
            return candidate.x < node.x + width + 18 && candidate.x + 228 + 18 > node.x &&
              candidate.y < node.y + height + 18 && candidate.y + 160 + 18 > node.y;
          });
          if (!overlaps) return candidate;
        }
      }
    }
    return { x: Math.max(8, x), y: Math.max(8, y + nodes.length * spacingY) };
  }
  function currentDiagramState() {
    return JSON.stringify({ nodes, edges, nextId });
  }
  function recordHistory() {
    if (historySuspended) return;
    clearTimeout(historyTimer);
    const state = currentDiagramState();
    if (history[historyIndex] === state) return;
    history = history.slice(0, historyIndex + 1);
    history.push(state);
    if (history.length > HISTORY_LIMIT) history.shift();
    historyIndex = history.length - 1;
    updateHistoryButtons();
  }
  function scheduleHistoryRecord() {
    clearTimeout(historyTimer);
    historyTimer = setTimeout(recordHistory, 500);
  }
  function updateHistoryButtons() {
    document.getElementById('undoBtn').disabled = historyIndex <= 0;
    document.getElementById('redoBtn').disabled = historyIndex < 0 || historyIndex >= history.length - 1;
  }
  function applyDiagramState(state) {
    const data = JSON.parse(state);
    nodes = data.nodes;
    edges = data.edges;
    nextId = data.nextId;
    selected = null;
    connectFrom = null;
    canvas.querySelectorAll('.node').forEach(node => node.remove());
    nodes.forEach(renderNode);
    renderEdges();
    updateCounts();
    selectItem(null);
    saveState();
  }
  function undo() {
    clearTimeout(historyTimer);
    recordHistory();
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    applyDiagramState(history[historyIndex]);
    updateHistoryButtons();
    notify('Cambio deshecho.');
  }
  function redo() {
    clearTimeout(historyTimer);
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    applyDiagramState(history[historyIndex]);
    updateHistoryButtons();
    notify('Cambio rehecho.');
  }
  function updateCounts() {
    const componentCount = `${nodes.length} componente${nodes.length === 1 ? '' : 's'}`;
    const connectionCount = `${edges.length} ${edges.length === 1 ? 'conexión' : 'conexiones'}`;
    elementCount.textContent = `${componentCount} · ${connectionCount}`;
    emptyState.classList.toggle('hidden', nodes.length > 0);
  }
  function addNode(type, x, y, opts = {}) {
    const info = TYPES[type] || TYPES.backend;
    const node = { id: opts.id || makeId('cmp'), type, name: opts.name || info.defaultName, description: opts.description ?? info.desc,
      details: opts.details || window.ArqSketchDiagram.createDefaultDetails(type),
      icon: opts.icon || 'auto', x: Math.max(8, x), y: Math.max(8, y) };
    if (opts.width !== undefined) node.width = opts.width;
    if (opts.height !== undefined) node.height = opts.height;
    nodes.push(node);
    renderNode(node);
    updateCounts();
    selectItem({ kind: 'node', id: node.id });
    return node;
  }
  function renderIconImage(container, iconId, fallbackText, className) {
    const url = window.ArqSketchDiagram.iconifyUrl(iconId);
    if (!url) {
      const fallback = document.createElement('span');
      fallback.className = className;
      fallback.textContent = fallbackText;
      container.appendChild(fallback);
      return;
    }
    const image = document.createElement('img');
    image.className = className;
    image.src = url;
    image.alt = '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => {
      const fallback = document.createElement('span');
      fallback.className = className;
      fallback.textContent = fallbackText;
      image.replaceWith(fallback);
    }, { once: true });
    container.appendChild(image);
  }
  function renderNode(n) {
    let el = document.getElementById(n.id);
    if (!el) {
      el = document.createElement('article');
      el.id = n.id;
      el.className = `node ${n.type}`;
      el.innerHTML = '<div class="node-content"><div class="node-header"><span class="node-symbol"></span><div style="min-width:0"><div class="node-title"></div><div class="node-type"></div></div></div><div class="node-description"></div><div class="node-details"></div></div><button type="button" class="node-resize-handle" aria-label="Cambiar ancho y alto de componente" title="Arrastra para cambiar el ancho y el alto">◢</button>';
      canvas.appendChild(el);
      el.addEventListener('pointerdown', event => beginDrag(event, n.id));
      el.querySelector('.node-resize-handle').addEventListener('pointerdown', event => beginResize(event, n.id));
      el.addEventListener('click', event => {
        event.stopPropagation();
        if (connectMode) handleConnectClick(n.id);
        else if (event.shiftKey || event.ctrlKey || event.metaKey) toggleNodeSelection(n.id);
        else if (selectedNodeIds.size < 2 || !selectedNodeIds.has(n.id)) selectItem({ kind: 'node', id: n.id });
      });
    }
    const info = TYPES[n.type];
    el.style.left = `${n.x}px`; el.style.top = `${n.y}px`;
    el.style.width = `${n.width || 228}px`;
    el.style.height = n.height ? `${n.height}px` : 'auto';
    const isSelected = selectedNodeIds.has(n.id);
    el.className = `node ${n.type}${isSelected ? ' selected' : ''}${selectedNodeIds.size > 1 && isSelected ? ' multi-selected' : ''}`;
    const iconContainer = el.querySelector('.node-symbol');
    iconContainer.replaceChildren();
    renderIconImage(iconContainer, n.icon, ICONS[n.icon]?.symbol || info.symbol, 'node-icon-image');
    el.querySelector('.node-title').textContent = n.name;
    el.querySelector('.node-type').textContent = info.label;
    el.querySelector('.node-description').textContent = n.description || 'Sin descripción';
    renderNodeDetails(el.querySelector('.node-details'), n);
    el.title = [n.name, n.description, ...nodeDetailSummary(n)].filter(Boolean).join('\n');
  }
  function nodeDetailSummary(node) {
    const fields = DETAIL_FIELDS[node.type] || [];
    const summary = fields
      .filter(field => node.details?.[field.key])
      .map(field => `${field.label}: ${node.details[field.key]}`);
    if (node.type === 'backend') {
      summary.push(...(node.details.endpoints || []).map(endpoint =>
        `${endpoint.method} ${endpoint.path} · ${endpoint.access} · ${endpoint.authRequired ? endpoint.authMethod || 'requiere autenticación' : 'sin autenticación'}`));
    }
    return summary;
  }
  function renderNodeDetails(container, node) {
    container.replaceChildren();
    if (node.type === 'backend') {
      (DETAIL_FIELDS.backend || []).forEach(field => {
        const value = node.details?.[field.key];
        if (value) appendNodeDetail(container, field.label, value);
      });
      const endpoints = node.details?.endpoints || [];
      if (endpoints.length) {
        const heading = document.createElement('div');
        heading.className = 'node-endpoints-heading';
        heading.textContent = `Endpoints (${endpoints.length})`;
        container.appendChild(heading);
        endpoints.slice(0, 3).forEach(endpoint => {
          const item = document.createElement('div');
          item.className = 'node-endpoint';
          const route = document.createElement('span');
          route.className = `node-http-method method-${endpoint.method.toLowerCase()}`;
          route.textContent = endpoint.method;
          item.appendChild(route);
          const path = document.createElement('span');
          path.className = 'node-endpoint-path';
          path.textContent = endpoint.path || '/';
          path.title = endpoint.path || '/';
          item.appendChild(path);
          const access = document.createElement('small');
          access.textContent = `${endpoint.access}${endpoint.authRequired ? ' · Auth' : ''}`;
          item.appendChild(access);
          container.appendChild(item);
        });
        if (endpoints.length > 3) {
          const more = document.createElement('small');
          more.className = 'node-details-more';
          more.textContent = `+${endpoints.length - 3} endpoints más`;
          container.appendChild(more);
        }
      }
      return;
    }
    (DETAIL_FIELDS[node.type] || []).forEach(field => {
      const value = node.details?.[field.key];
      if (value) appendNodeDetail(container, field.label, value);
    });
  }
  function appendNodeDetail(container, labelText, valueText) {
    const row = document.createElement('div');
    row.className = 'node-detail-row';
    const label = document.createElement('span');
    label.className = 'node-detail-label';
    label.textContent = labelText;
    const value = document.createElement('span');
    value.className = 'node-detail-value';
    value.textContent = valueText;
    value.title = valueText;
    row.append(label, value);
    container.appendChild(row);
  }
  function beginResize(event, id) {
    if (event.button !== 0 || connectMode) return;
    event.preventDefault();
    event.stopPropagation();
    const node = getNode(id);
    const element = document.getElementById(id);
    if (!node || !element) return;
    recordHistory();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = element.offsetWidth;
    const startHeight = element.offsetHeight;
    let moved = false;
    const move = moveEvent => {
      const width = Math.max(NODE_SIZE.minWidth, Math.min(NODE_SIZE.maxWidth,
        startWidth + (moveEvent.clientX - startX) / zoom));
      const height = Math.max(NODE_SIZE.minHeight, Math.min(NODE_SIZE.maxHeight,
        startHeight + (moveEvent.clientY - startY) / zoom));
      if (Math.abs(width - startWidth) + Math.abs(height - startHeight) < 2) return;
      moved = true;
      node.width = Math.round(width);
      node.height = Math.round(height);
      renderNode(node);
      renderEdges();
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('mouseup', finish);
      if (moved) {
        selectItem({ kind: 'node', id });
        recordHistory();
        saveState();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('mouseup', finish);
  }
  function renderIconChoices(container, results) {
    container.replaceChildren();
    results.forEach(icon => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `icon-choice${selected?.kind === 'node' && getNode(selected.id)?.icon === icon.id ? ' active' : ''}`;
      button.dataset.icon = icon.id;
      button.title = `${icon.label} · ${icon.category}`;
      button.setAttribute('aria-label', `Usar icono ${icon.label}`);
      button.setAttribute('aria-pressed', String(selected?.kind === 'node' && getNode(selected.id)?.icon === icon.id));

      const symbol = document.createElement('span');
      symbol.className = 'icon-choice-symbol';
      const fallback = icon.symbol || icon.label.slice(0, 2).toUpperCase();
      renderIconImage(symbol, icon.id, fallback, 'icon-choice-image');
      const label = document.createElement('span');
      label.className = 'icon-choice-label';
      label.textContent = icon.label;
      button.append(symbol, label);
      container.appendChild(button);
    });
  }
  function renderIconPicker(query = nodeIconSearch.value) {
    const results = window.ArqSketchDiagram.searchIcons(query);
    renderIconChoices(localIconResults, results);
    if (!results.length) {
      const empty = document.createElement('p');
      empty.className = 'icon-picker-empty';
      empty.textContent = 'No hay coincidencias en los iconos integrados.';
      localIconResults.appendChild(empty);
    }
  }
  async function searchIconify(query, signal) {
    try {
      const results = await window.ArqSketchDiagram.searchIconify(query, signal);
      if (signal.aborted || query !== nodeIconSearch.value.trim()) return;
      remoteIconResults.replaceChildren();
      renderIconChoices(remoteIconResults, results);
      remoteIconStatus.textContent = results.length
        ? `${results.length} resultados · iconos servidos por Iconify`
        : 'No se encontraron iconos en Iconify. Los iconos integrados siguen disponibles.';
    } catch (error) {
      if (signal.aborted || error.name === 'AbortError') return;
      remoteIconResults.replaceChildren();
      remoteIconStatus.textContent = `No se pudo buscar en Iconify (${error.message}). Los iconos integrados siguen disponibles.`;
    }
  }
  function scheduleIconifySearch(query) {
    clearTimeout(iconSearchTimer);
    iconSearchController?.abort();
    remoteIconResults.replaceChildren();
    const term = query.trim();
    if (term.length < 2) {
      remoteIconStatus.textContent = 'Escribe al menos dos caracteres para buscar iconos en línea.';
      return;
    }
    remoteIconStatus.textContent = 'Buscando en Iconify…';
    iconSearchTimer = setTimeout(() => {
      iconSearchController = new AbortController();
      searchIconify(term, iconSearchController.signal);
    }, 300);
  }
  function updateSelectedIcon() {
    const node = selected?.kind === 'node' && getNode(selected.id);
    selectedIcon.replaceChildren();
    if (!node) return;
    const icon = ICONS[node.icon || 'auto'];
    const preview = document.createElement('span');
    preview.className = 'selected-icon-symbol';
    renderIconImage(preview, node.icon, icon?.symbol || TYPES[node.type].symbol, 'selected-icon-image');
    const label = document.createElement('span');
    label.textContent = `Icono actual: ${icon?.label || window.ArqSketchDiagram.iconifyParts(node.icon)?.name || 'Predeterminado'}`;
    selectedIcon.append(preview, label);
  }
  function renderEdges() {
    svg.innerHTML = '<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L8,3 z" fill="#8290b1"></path></marker><marker id="arrowSelected" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L8,3 z" fill="#a99dff"></path></marker></defs>';
    edges.forEach((e, i) => {
      const a = getNode(e.from), b = getNode(e.to);
      if (!a || !b) return;
      const ac = nodeCenter(a), bc = nodeCenter(b);
      const aElement = document.getElementById(a.id);
      const bElement = document.getElementById(b.id);
      const aHalfWidth = (aElement?.offsetWidth || a.width || 228) / 2;
      const aHalfHeight = (aElement?.offsetHeight || a.height || 91) / 2;
      const bHalfWidth = (bElement?.offsetWidth || b.width || 228) / 2;
      const bHalfHeight = (bElement?.offsetHeight || b.height || 91) / 2;
      const dx = bc.x - ac.x, dy = bc.y - ac.y;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      const sx = ac.x + (horizontal ? Math.sign(dx) * aHalfWidth : 0);
      const sy = ac.y + (horizontal ? 0 : Math.sign(dy) * aHalfHeight);
      const ex = bc.x - (horizontal ? Math.sign(dx) * bHalfWidth : 0);
      const ey = bc.y - (horizontal ? 0 : Math.sign(dy) * bHalfHeight);
      const bend = Math.max(35, Math.abs(horizontal ? ex-sx : ey-sy) * .42);
      const c1x = horizontal ? sx + Math.sign(dx) * bend : sx;
      const c1y = horizontal ? sy : sy + Math.sign(dy) * bend;
      const c2x = horizontal ? ex - Math.sign(dx) * bend : ex;
      const c2y = horizontal ? ey : ey - Math.sign(dy) * bend;
      const d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d); path.setAttribute('class', `connection${selected?.kind === 'edge' && selected.id === e.id ? ' selected' : ''}`);
      path.dataset.edgeId = e.id;
      path.setAttribute('marker-end', selected?.kind === 'edge' && selected.id === e.id ? 'url(#arrowSelected)' : 'url(#arrow)');
      path.style.pointerEvents = 'stroke';
      path.addEventListener('click', ev => { ev.stopPropagation(); selectItem({ kind: 'edge', id: e.id }); });
      svg.appendChild(path);
      if (e.label) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (sx + ex) / 2); text.setAttribute('y', (sy + ey) / 2 - 8);
        text.setAttribute('text-anchor', 'middle'); text.setAttribute('class', 'connection-label'); text.textContent = e.label;
        svg.appendChild(text);
      }
    });
  }
  function selectItem(item) {
    selected = item;
    selectedNodeIds = item?.kind === 'node' ? new Set([item.id]) : new Set();
    nodes.forEach(renderNode);
    renderEdges();
    updateSelectionActions();
    const isNode = item?.kind === 'node';
    const isEdge = item?.kind === 'edge';
    noSelection.classList.toggle('hidden', !!item);
    propertyForm.classList.toggle('hidden', !isNode);
    edgePropertyForm.classList.toggle('hidden', !isEdge);
    if (isNode) {
      const n = getNode(item.id);
      nodeName.value = n.name; nodeType.value = TYPES[n.type].label;
      nodeIconSearch.value = '';
      nodeDescription.value = n.description; nodeId.textContent = n.id;
      renderComponentDetails(n);
      updateSelectedIcon();
      renderIconPicker('');
    } else if (isEdge) {
      updateSelectedIcon();
      const edge = edges.find(candidate => candidate.id === item.id);
      const from = getNode(edge.from), to = getNode(edge.to);
      edgeSummary.textContent = `${from?.name || 'Componente'} → ${to?.name || 'Componente'}`;
      edgeLabel.value = edge.label || '';
    } else {
      updateSelectedIcon();
      noSelection.innerHTML = '<div class="select-illustration">⌁</div><b>Ningún elemento seleccionado</b><p>Selecciona un componente o una conexión del lienzo para ver sus propiedades.</p>';
    }
  }
  function toggleNodeSelection(id) {
    const next = new Set(selectedNodeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectMultiple(next);
  }
  function selectMultiple(ids) {
    const validIds = new Set([...ids].filter(id => getNode(id)));
    if (validIds.size <= 1) {
      selectItem(validIds.size ? { kind: 'node', id: [...validIds][0] } : null);
      return;
    }
    selected = null;
    selectedNodeIds = validIds;
    nodes.forEach(renderNode);
    renderEdges();
    noSelection.classList.remove('hidden');
    noSelection.innerHTML = `<div class="select-illustration">⌖</div><b>${validIds.size} componentes seleccionados</b><p>Arrástralos juntos o usa las acciones de alineación en el lienzo.</p>`;
    propertyForm.classList.add('hidden');
    edgePropertyForm.classList.add('hidden');
    updateSelectedIcon();
    updateSelectionActions();
  }
  function updateSelectionActions() {
    const count = selectedNodeIds.size;
    selectionActions.hidden = count < 2;
    selectionCount.textContent = `${count} seleccionados`;
    selectionActions.querySelectorAll('[data-selection-action^="distribute-"]').forEach(button => {
      button.disabled = count < 3;
    });
  }
  function appendFieldLabel(parent, text, htmlFor) {
    const label = document.createElement('label');
    label.textContent = text;
    label.htmlFor = htmlFor;
    parent.appendChild(label);
  }
  function appendSelectOptions(select, options) {
    options.forEach(option => {
      const element = document.createElement('option');
      element.value = option;
      element.textContent = option || '— Seleccionar —';
      select.appendChild(element);
    });
  }
  function renderComponentDetails(node) {
    componentDetails.replaceChildren();
    const fields = DETAIL_FIELDS[node.type] || [];
    componentDetailsSummary.textContent = node.type === 'backend'
      ? `API y endpoints (${node.details.endpoints.length})`
      : `Configuración de ${TYPES[node.type].label}`;
    const note = document.createElement('p');
    note.className = 'details-note';
    note.textContent = 'Documenta la configuración, pero no guardes claves ni secretos.';
    componentDetails.appendChild(note);
    fields.forEach(field => {
      const fieldId = `detail-${node.id}-${field.key}`;
      appendFieldLabel(componentDetails, field.label, fieldId);
      const control = document.createElement(field.type === 'textarea' ? 'textarea' : field.type === 'select' ? 'select' : 'input');
      control.id = fieldId;
      control.dataset.detailKey = field.key;
      if (field.type === 'select') appendSelectOptions(control, field.options);
      else {
        control.type = field.type;
        control.maxLength = field.maxLength;
        if (field.placeholder) control.placeholder = field.placeholder;
      }
      control.value = node.details[field.key] || '';
      componentDetails.appendChild(control);
    });
    if (node.type === 'backend') renderEndpointEditor(node);
  }
  function renderEndpointEditor(node) {
    const endpointsHeading = document.createElement('h4');
    endpointsHeading.textContent = `Endpoints (${node.details.endpoints.length})`;
    componentDetails.appendChild(endpointsHeading);
    const endpoints = document.createElement('div');
    endpoints.className = 'endpoint-list';
    node.details.endpoints.forEach((endpoint, index) => {
      const card = document.createElement('fieldset');
      card.className = 'endpoint-card';
      const legend = document.createElement('legend');
      legend.textContent = `Endpoint ${index + 1}`;
      card.appendChild(legend);
      const methodId = `endpoint-${node.id}-${index}-method`;
      appendFieldLabel(card, 'Método HTTP', methodId);
      const method = document.createElement('select');
      method.id = methodId;
      method.dataset.endpointIndex = index;
      method.dataset.endpointKey = 'method';
      appendSelectOptions(method, HTTP_METHODS);
      method.value = endpoint.method;
      card.appendChild(method);
      const pathId = `endpoint-${node.id}-${index}-path`;
      appendFieldLabel(card, 'Ruta', pathId);
      const path = document.createElement('input');
      path.id = pathId;
      path.type = 'text';
      path.maxLength = 240;
      path.placeholder = '/usuarios/:id';
      path.value = endpoint.path;
      path.dataset.endpointIndex = index;
      path.dataset.endpointKey = 'path';
      card.appendChild(path);
      const accessId = `endpoint-${node.id}-${index}-access`;
      appendFieldLabel(card, 'Visibilidad', accessId);
      const access = document.createElement('select');
      access.id = accessId;
      access.dataset.endpointIndex = index;
      access.dataset.endpointKey = 'access';
      appendSelectOptions(access, ENDPOINT_ACCESS);
      access.value = endpoint.access;
      card.appendChild(access);
      const authId = `endpoint-${node.id}-${index}-auth`;
      appendFieldLabel(card, 'Requiere autenticación', authId);
      const auth = document.createElement('select');
      auth.id = authId;
      auth.dataset.endpointIndex = index;
      auth.dataset.endpointKey = 'authRequired';
      appendSelectOptions(auth, ['true', 'false']);
      auth.options[0].textContent = 'Sí';
      auth.options[1].textContent = 'No';
      auth.value = String(endpoint.authRequired);
      card.appendChild(auth);
      const authMethodId = `endpoint-${node.id}-${index}-auth-method`;
      appendFieldLabel(card, 'Tipo de autenticación', authMethodId);
      const authMethod = document.createElement('select');
      authMethod.id = authMethodId;
      authMethod.dataset.endpointIndex = index;
      authMethod.dataset.endpointKey = 'authMethod';
      appendSelectOptions(authMethod, window.ArqSketchDiagram.AUTH_METHODS);
      authMethod.value = endpoint.authMethod;
      authMethod.disabled = !endpoint.authRequired;
      card.appendChild(authMethod);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'text-btn endpoint-remove';
      remove.dataset.action = 'remove-endpoint';
      remove.dataset.endpointIndex = index;
      remove.textContent = 'Quitar endpoint';
      card.appendChild(remove);
      endpoints.appendChild(card);
    });
    componentDetails.appendChild(endpoints);
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn btn-quiet endpoint-add';
    add.dataset.action = 'add-endpoint';
    add.textContent = '＋ Agregar endpoint';
    add.disabled = node.details.endpoints.length >= 100;
    componentDetails.appendChild(add);
  }
  function beginDrag(event, id) {
    if (event.button !== 0 || connectMode || event.shiftKey || event.ctrlKey || event.metaKey) return;
    if (!selectedNodeIds.has(id)) selectItem({ kind: 'node', id });
    recordHistory();
    const movingNodes = [...selectedNodeIds].map(nodeId => {
      const node = getNode(nodeId);
      return { node, x: node.x, y: node.y };
    });
    const startX = event.clientX, startY = event.clientY;
    let moved = false;
    const move = ev => {
      const dx = (ev.clientX - startX) / zoom, dy = (ev.clientY - startY) / zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (!moved) return;
      movingNodes.forEach(({ node, x, y }) => {
        node.x = Math.max(0, x + dx);
        node.y = Math.max(0, y + dy);
        renderNode(node);
      });
      renderEdges();
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('mouseup', finish);
      if (moved) { recordHistory(); saveState(); }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('mouseup', finish);
  }
  function handleConnectClick(id) {
    if (!connectFrom) {
      connectFrom = id; notify('Ahora selecciona el componente de destino.'); modeStatus.textContent = 'Modo: elige destino';
      return;
    }
    if (connectFrom === id) { notify('Elige un componente diferente.'); return; }
    if (!edges.some(e => e.from === connectFrom && e.to === id)) {
      recordHistory();
      edges.push({ id: makeId('con'), from: connectFrom, to: id, label: '' });
      recordHistory();
      notify('Conexión creada.');
    } else notify('Esa conexión ya existe.');
    connectFrom = null; setConnectMode(false); renderEdges(); updateCounts(); saveState();
  }
  function setConnectMode(on) {
    connectMode = on; connectFrom = null;
    canvas.classList.toggle('connect-mode', on);
    document.getElementById('connectModeBtn').classList.toggle('active', on);
    modeStatus.textContent = on ? 'Modo: conectar (elige origen)' : 'Modo: selección';
    if (on) notify('Selecciona el componente de origen y luego el destino.');
  }
  function connectFromNode(id) {
    if (!connectMode) setConnectMode(true);
    connectFrom = id;
    modeStatus.textContent = 'Modo: elige destino';
    notify('Selecciona el componente de destino.');
  }
  function closeContextMenu() {
    contextMenu.hidden = true;
    contextTarget = null;
  }
  function openContextMenu(event) {
    const nodeElement = event.target.closest('.node');
    const edgeElement = event.target.closest('.connection');
    if (!nodeElement && !edgeElement) return;
    event.preventDefault();
    if (nodeElement) {
      const id = nodeElement.id;
      if (!selectedNodeIds.has(id)) selectItem({ kind: 'node', id });
      contextTarget = { kind: 'node', id };
    } else {
      const edge = edges.find(candidate => candidate.id === edgeElement.dataset.edgeId);
      if (!edge) return;
      selectItem({ kind: 'edge', id: edge.id });
      contextTarget = { kind: 'edge', id: edge.id };
    }
    const items = contextTarget.kind === 'node'
      ? [
          ['copy', 'Copiar'],
          ['duplicate', 'Duplicar'],
          ['connect', 'Conectar desde aquí'],
          ['edit', 'Editar propiedades'],
          ['delete', 'Eliminar selección', true],
        ]
      : [
          ['edit', 'Editar conexión'],
          ['delete', 'Eliminar conexión', true],
        ];
    contextMenu.replaceChildren();
    items.forEach(([action, label, danger]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = danger ? 'context-menu-danger' : '';
      button.dataset.contextAction = action;
      button.setAttribute('role', 'menuitem');
      button.textContent = label;
      contextMenu.appendChild(button);
    });
    contextMenu.hidden = false;
    const left = Math.min(event.clientX, window.innerWidth - contextMenu.offsetWidth - 8);
    const top = Math.min(event.clientY, window.innerHeight - contextMenu.offsetHeight - 8);
    contextMenu.style.left = `${Math.max(8, left)}px`;
    contextMenu.style.top = `${Math.max(8, top)}px`;
    contextMenu.querySelector('button')?.focus();
  }
  function runContextAction(action) {
    const target = contextTarget;
    closeContextMenu();
    if (!target) return;
    if (action === 'copy') copySelection();
    else if (action === 'duplicate') duplicateSelection();
    else if (action === 'connect' && target.kind === 'node') connectFromNode(target.id);
    else if (action === 'edit' && target.kind === 'node') {
      selectItem({ kind: 'node', id: target.id });
      nodeName.focus();
      nodeName.select();
    } else if (action === 'edit' && target.kind === 'edge') {
      selectItem({ kind: 'edge', id: target.id });
      edgeLabel.focus();
      edgeLabel.select();
    } else if (action === 'delete') {
      if (target.kind === 'edge' && selected?.kind !== 'edge') selectItem({ kind: 'edge', id: target.id });
      deleteSelected();
    }
  }
  function deleteSelected() {
    if (selectedNodeIds.size > 1) {
      recordHistory();
      const removed = new Set(selectedNodeIds);
      nodes = nodes.filter(node => !removed.has(node.id));
      edges = edges.filter(edge => !removed.has(edge.from) && !removed.has(edge.to));
      removed.forEach(id => document.getElementById(id)?.remove());
      selectItem(null);
      renderEdges();
      updateCounts();
      recordHistory();
      saveState();
      notify(`${removed.size} componentes eliminados.`);
      return;
    }
    if (!selected) return;
    recordHistory();
    if (selected.kind === 'node') {
      nodes = nodes.filter(n => n.id !== selected.id);
      edges = edges.filter(e => e.from !== selected.id && e.to !== selected.id);
      document.getElementById(selected.id)?.remove();
    } else edges = edges.filter(e => e.id !== selected.id);
    selected = null; selectItem(null); renderEdges(); updateCounts(); recordHistory(); saveState(); notify('Elemento eliminado.');
  }
  function copySelection({ quiet = false } = {}) {
    const selectedNodes = nodes.filter(node => selectedNodeIds.has(node.id));
    if (!selectedNodes.length) {
      if (!quiet) notify('Selecciona uno o más componentes para copiarlos.');
      return false;
    }
    const minX = Math.min(...selectedNodes.map(node => node.x));
    const minY = Math.min(...selectedNodes.map(node => node.y));
    const ids = new Set(selectedNodes.map(node => node.id));
    copiedSelection = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)).map(node => ({ ...node, x: node.x - minX, y: node.y - minY })),
      edges: JSON.parse(JSON.stringify(edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)))),
    };
    if (!quiet) notify(`${selectedNodes.length} componente${selectedNodes.length === 1 ? '' : 's'} copiado${selectedNodes.length === 1 ? '' : 's'}.`);
    return true;
  }
  function findGroupPosition(groupNodes, x, y) {
    const width = Math.max(...groupNodes.map(node => node.x + (node.width || 228)));
    const height = Math.max(...groupNodes.map(node => node.y + (node.height || 160)));
    const spacingX = Math.max(264, width + 24);
    const spacingY = Math.max(190, height + 24);
    const maxRing = Math.max(4, Math.min(nodes.length + 2, 50));
    for (let ring = 0; ring <= maxRing; ring += 1) {
      for (let row = -ring; row <= ring; row += 1) {
        for (let column = -ring; column <= ring; column += 1) {
          if (ring && Math.abs(row) !== ring && Math.abs(column) !== ring) continue;
          const candidate = { x: Math.max(8, x + column * spacingX), y: Math.max(8, y + row * spacingY) };
          const overlaps = nodes.some(existing => {
            const element = document.getElementById(existing.id);
            const existingWidth = element?.offsetWidth || existing.width || 228;
            const existingHeight = element?.offsetHeight || existing.height || 110;
            return candidate.x < existing.x + existingWidth + 18 && candidate.x + width + 18 > existing.x &&
              candidate.y < existing.y + existingHeight + 18 && candidate.y + height + 18 > existing.y;
          });
          if (!overlaps) return candidate;
        }
      }
    }
    return { x: Math.max(8, x), y: Math.max(8, y + nodes.length * spacingY) };
  }
  function pasteSelection({ quiet = false } = {}) {
    if (!copiedSelection?.nodes.length) {
      if (!quiet) notify('No hay componentes copiados para pegar.');
      return false;
    }
    const rect = wrap.getBoundingClientRect();
    const anchorX = (rect.width / 2 - panX) / zoom - 114;
    const anchorY = (rect.height / 2 - panY) / zoom - 65;
    const position = findGroupPosition(copiedSelection.nodes, anchorX, anchorY);
    recordHistory();
    const idMap = new Map();
    const pastedNodes = copiedSelection.nodes.map(source => {
      const node = JSON.parse(JSON.stringify(source));
      const oldId = node.id;
      node.id = makeId('cmp');
      idMap.set(oldId, node.id);
      node.x += position.x;
      node.y += position.y;
      nodes.push(node);
      renderNode(node);
      return node;
    });
    copiedSelection.edges.forEach(source => {
      edges.push({
        ...JSON.parse(JSON.stringify(source)),
        id: makeId('con'),
        from: idMap.get(source.from),
        to: idMap.get(source.to),
      });
    });
    selectMultiple(pastedNodes.map(node => node.id));
    renderEdges();
    updateCounts();
    recordHistory();
    saveState();
    if (!quiet) notify(`${pastedNodes.length} componente${pastedNodes.length === 1 ? '' : 's'} pegado${pastedNodes.length === 1 ? '' : 's'}.`);
    return true;
  }
  function duplicateSelection() {
    if (!copySelection({ quiet: true })) return;
    pasteSelection({ quiet: true });
    notify('Selección duplicada.');
  }
  function alignSelection(action) {
    const selectedNodes = nodes.filter(node => selectedNodeIds.has(node.id));
    if (selectedNodes.length < 2) return;
    recordHistory();
    if (action === 'align-left') {
      const x = Math.min(...selectedNodes.map(node => node.x));
      selectedNodes.forEach(node => { node.x = x; });
    } else if (action === 'align-top') {
      const y = Math.min(...selectedNodes.map(node => node.y));
      selectedNodes.forEach(node => { node.y = y; });
    } else {
      if (selectedNodes.length < 3) {
        notify('Se necesitan al menos tres componentes para distribuir.');
        return;
      }
      const horizontal = action === 'distribute-horizontal';
      const sorted = selectedNodes.slice().sort((a, b) => horizontal ? a.x - b.x : a.y - b.y);
      const size = node => {
        const element = document.getElementById(node.id);
        return horizontal ? element?.offsetWidth || node.width || 228 : element?.offsetHeight || node.height || 110;
      };
      const start = horizontal ? sorted[0].x : sorted[0].y;
      const endNode = sorted.at(-1);
      const end = (horizontal ? endNode.x : endNode.y) + size(endNode);
      const gap = Math.max(24,
        (end - start - sorted.reduce((total, node) => total + size(node), 0)) / (sorted.length - 1));
      let offset = start;
      sorted.forEach(node => {
        if (horizontal) node.x = offset;
        else node.y = offset;
        offset += size(node) + gap;
      });
    }
    selectedNodes.forEach(renderNode);
    renderEdges();
    recordHistory();
    saveState();
  }
  function saveState() {
    renderDiagramJson();
    try {
      localStorage.setItem('arqsketch-state', JSON.stringify({ nodes, edges, nextId }));
      return true;
    } catch (error) {
      notify(`No se pudo guardar el diagrama en este navegador: ${error.message}`);
      return false;
    }
  }
  function loadState() {
    try {
      const raw = localStorage.getItem('arqsketch-state');
      if (!raw) return false;
      const data = JSON.parse(raw);
      const diagram = window.ArqSketchDiagram.normalizeDiagram(data, false);
      nodes = diagram.nodes; edges = diagram.edges; nextId = diagram.nextId;
      nodes.forEach(renderNode); renderEdges(); updateCounts();
      return nodes.length > 0;
    } catch (error) {
      notify(`No se pudo restaurar el diagrama anterior: ${error.message}`);
      return false;
    }
  }
  async function importJsonFileContent(file) {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('El archivo supera el límite de 5 MB');
      let data;
      try {
        data = JSON.parse(await file.text());
      } catch {
        throw new Error('El archivo no contiene JSON válido');
      }
      const diagram = window.ArqSketchDiagram.normalizeDiagram(data);
      if ((nodes.length || edges.length) &&
          !confirm('Abrir este archivo reemplazará el diagrama actual. ¿Deseas continuar?')) return;

      recordHistory();
      nodes = diagram.nodes;
      edges = diagram.edges;
      nextId = diagram.nextId;
      selected = null;
      connectFrom = null;
      setConnectMode(false);
      canvas.querySelectorAll('.node').forEach(node => node.remove());
      nodes.forEach(renderNode);
      renderEdges();
      updateCounts();
      selectItem(null);
      recordHistory();
      const saved = saveState();
      if (saved) {
        const componentCount = `${nodes.length} componente${nodes.length === 1 ? '' : 's'}`;
        const connectionCount = `${edges.length} ${edges.length === 1 ? 'conexión' : 'conexiones'}`;
        notify(`Diagrama abierto: ${componentCount} y ${connectionCount}.`);
      }
    } catch (error) {
      notify(`No se pudo abrir el diagrama: ${error.message}`);
    } finally {
      importJsonFile.value = '';
    }
  }
  function addAtCanvas(type, clientX, clientY) {
    const rect = wrap.getBoundingClientRect();
    recordHistory();
    const position = findAvailablePosition(
      (clientX - rect.left - panX) / zoom - 114,
      (clientY - rect.top - panY) / zoom - 65,
    );
    addNode(type, position.x, position.y);
    renderEdges(); recordHistory(); saveState();
  }
  function loadTemplate() {
    recordHistory();
    historySuspended = true;
    nodes = []; edges = []; canvas.querySelectorAll('.node').forEach(n => n.remove()); selected = null; nextId = 1;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const startX = Math.max(35, (w - 570) / 2), startY = Math.max(35, (h - 220) / 2);
    const user = addNode('user', startX, startY + 65, { name: 'Usuario final', description: 'Accede desde el navegador' });
    const front = addNode('frontend', startX + 220, startY + 65, { name: 'Frontend web', description: 'Interfaz y experiencia de usuario' });
    const api = addNode('backend', startX + 440, startY + 65, { name: 'API REST', description: 'Autenticación y lógica de negocio' });
    const db = addNode('database', startX + 440, startY + 205, { name: 'PostgreSQL', description: 'Datos de la aplicación' });
    edges = [{ id: makeId('con'), from: user.id, to: front.id, label: 'HTTPS' }, { id: makeId('con'), from: front.id, to: api.id, label: 'REST / JSON' }, { id: makeId('con'), from: api.id, to: db.id, label: 'SQL' }];
    historySuspended = false;
    selectItem(null); renderEdges(); updateCounts(); recordHistory(); saveState(); notify('Plantilla de arquitectura cargada.');
  }
  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  function diagramData() {
    return { app: 'ArqSketch', version: 1, nodes, edges };
  }
  function renderDiagramJson() {
    diagramJson.textContent = JSON.stringify(diagramData(), null, 2);
  }
  function exportJson() {
    download('arquitectura-aplicacion.json', JSON.stringify(diagramData(), null, 2), 'application/json');
    notify('Diagrama exportado como JSON.');
  }
  async function copyDiagramJson() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('El navegador no permite acceder al portapapeles en este contexto.');
      await navigator.clipboard.writeText(diagramJson.textContent);
      notify('JSON copiado al portapapeles.');
    } catch (error) {
      notify(`No se pudo copiar el JSON: ${error.message}`);
    }
  }
  function exportSvg() {
    if (!nodes.length) { notify('Añade al menos un componente antes de exportar.'); return; }
    const pad = 35, maxX = Math.max(...nodes.map(n => n.x + (document.getElementById(n.id)?.offsetWidth || 228))) + pad;
    const maxY = Math.max(...nodes.map(n => n.y + (document.getElementById(n.id)?.offsetHeight || 110))) + pad;
    const minX = Math.min(...nodes.map(n => n.x)) - pad, minY = Math.min(...nodes.map(n => n.y)) - pad;
    const width = maxX - minX, height = maxY - minY;
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`, '<rect x="-9999" y="-9999" width="20000" height="20000" fill="#0c1220"/>'];
    edges.forEach(e => {
      const a = getNode(e.from), b = getNode(e.to); if (!a || !b) return;
      const ac = nodeCenter(a), bc = nodeCenter(b);
      parts.push(`<path d="M ${ac.x} ${ac.y} L ${bc.x} ${bc.y}" stroke="#8290b1" stroke-width="2" fill="none" marker-end="url(#arr)"/>`);
      if (e.label) parts.push(`<text x="${(ac.x+bc.x)/2}" y="${(ac.y+bc.y)/2-8}" text-anchor="middle" fill="#aab5ca" font-size="10">${escapeXml(e.label)}</text>`);
    });
    parts.push('<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#8290b1"/></marker></defs>');
    nodes.forEach(n => {
      const colors = { frontend:'#65bfff', backend:'#a99aff', database:'#4fd7b7', service:'#edb76d', cloud:'#83aaff', user:'#ef8fba' };
      const nodeWidth = document.getElementById(n.id)?.offsetWidth || 228;
      const nodeHeight = document.getElementById(n.id)?.offsetHeight || 110;
      parts.push(`<rect x="${n.x}" y="${n.y}" width="${nodeWidth}" height="${nodeHeight}" rx="10" fill="#151e2e" stroke="${colors[n.type] || '#8290b1'}" stroke-width="2"/>`);
      const iconUrl = window.ArqSketchDiagram.iconifyUrl(n.icon);
      if (iconUrl) {
        parts.push(`<image href="${escapeXml(iconUrl)}" x="${n.x+10}" y="${n.y+9}" width="20" height="20"/>`);
      } else {
        const symbol = ICONS[n.icon]?.symbol || TYPES[n.type].symbol;
        parts.push(`<text x="${n.x+12}" y="${n.y+29}" fill="#edf2fb" font-size="13">${escapeXml(symbol)}</text>`);
      }
      parts.push(`<text x="${n.x+34}" y="${n.y+28}" fill="#edf2fb" font-size="12" font-weight="bold">${escapeXml(n.name)}</text>`);
      parts.push(`<text x="${n.x+12}" y="${n.y+47}" fill="#93a0b8" font-size="10">${escapeXml(TYPES[n.type].label)}</text>`);
      parts.push(`<text x="${n.x+12}" y="${n.y+68}" fill="#9ca8bd" font-size="9">${escapeXml((n.description || '').slice(0, 34))}</text>`);
      nodeDetailSummary(n).slice(0, 3).forEach((detail, index) => {
        parts.push(`<text x="${n.x+12}" y="${n.y+86+index*14}" fill="#b8c3d8" font-size="9">${escapeXml(detail.slice(0, 48))}</text>`);
      });
    });
    parts.push('</svg>');
    download('arquitectura-aplicacion.svg', parts.join(''), 'image/svg+xml;charset=utf-8');
    notify('Diagrama exportado como SVG.');
  }
  function escapeXml(s) { return String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])); }
  function reset() {
    if (nodes.length && !confirm('¿Crear un diagrama nuevo? Se borrará el diagrama actual del navegador.')) return;
    recordHistory();
    nodes = []; edges = []; selected = null; nextId = 1;
    zoom = 1; panX = 0; panY = 0;
    canvas.querySelectorAll('.node').forEach(n => n.remove()); applyTransform(); renderEdges(); updateCounts(); selectItem(null); recordHistory(); saveState(); notify('Lienzo nuevo listo.');
  }

  document.querySelectorAll('.component').forEach(btn => {
    btn.addEventListener('click', () => {
      const rect = wrap.getBoundingClientRect();
      addAtCanvas(btn.dataset.type, rect.left + wrap.clientWidth / 2, rect.top + wrap.clientHeight / 2);
    });
    btn.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', btn.dataset.type); e.dataTransfer.effectAllowed = 'copy'; });
  });
  canvas.addEventListener('click', e => {
    if (e.target === canvas && !backgroundPointerMoved) selectItem(null);
  });
  nodeName.addEventListener('input', () => {
    const n = selected?.kind === 'node' && getNode(selected.id);
    if (n) { n.name = nodeName.value; renderNode(n); saveState(); scheduleHistoryRecord(); }
  });
  nodeIconSearch.addEventListener('input', () => {
    renderIconPicker();
    scheduleIconifySearch(nodeIconSearch.value);
  });
  iconPicker.addEventListener('click', event => {
    const button = event.target.closest('button[data-icon]');
    const n = selected?.kind === 'node' && getNode(selected.id);
    if (!button || !n ||
        (!Object.hasOwn(ICONS, button.dataset.icon) && !window.ArqSketchDiagram.iconifyParts(button.dataset.icon))) return;
    recordHistory();
    n.icon = button.dataset.icon;
    renderNode(n);
    updateSelectedIcon();
    renderIconPicker();
    recordHistory();
    saveState();
  });
  nodeDescription.addEventListener('input', () => {
    const n = selected?.kind === 'node' && getNode(selected.id);
    if (n) { n.description = nodeDescription.value; renderNode(n); renderEdges(); saveState(); scheduleHistoryRecord(); }
  });
  componentDetails.addEventListener('input', event => {
    const control = event.target;
    const node = selected?.kind === 'node' && getNode(selected.id);
    if (!node || control.tagName === 'SELECT' || !control.matches('[data-detail-key], [data-endpoint-key]')) return;
    if (control.dataset.detailKey) node.details[control.dataset.detailKey] = control.value;
    else {
      const endpoint = node.details.endpoints[Number(control.dataset.endpointIndex)];
      if (endpoint) {
        endpoint[control.dataset.endpointKey] = control.dataset.endpointKey === 'authRequired'
          ? control.value === 'true'
          : control.value;
        if (control.dataset.endpointKey === 'authRequired') {
          control.closest('.endpoint-card').querySelector('[data-endpoint-key="authMethod"]').disabled = !endpoint.authRequired;
        }
      }
    }
    renderNode(node);
    renderEdges();
    saveState();
    scheduleHistoryRecord();
  });
  componentDetails.addEventListener('change', event => {
    const control = event.target;
    if (!control.matches('select[data-detail-key], select[data-endpoint-key]')) return;
    const node = selected?.kind === 'node' && getNode(selected.id);
    if (!node) return;
    recordHistory();
    if (control.dataset.detailKey) node.details[control.dataset.detailKey] = control.value;
    else {
      const endpoint = node.details.endpoints[Number(control.dataset.endpointIndex)];
      if (endpoint) {
        endpoint[control.dataset.endpointKey] = control.dataset.endpointKey === 'authRequired'
          ? control.value === 'true'
          : control.value;
        if (control.dataset.endpointKey === 'authRequired') {
          control.closest('.endpoint-card').querySelector('[data-endpoint-key="authMethod"]').disabled = !endpoint.authRequired;
        }
      }
    }
    renderNode(node);
    renderEdges();
    saveState();
    recordHistory();
  });
  componentDetails.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    const node = selected?.kind === 'node' && getNode(selected.id);
    if (!button || !node || node.type !== 'backend') return;
    recordHistory();
    if (button.dataset.action === 'add-endpoint' && node.details.endpoints.length < 100) {
      node.details.endpoints.push({
        method: 'GET',
        path: '',
        access: 'Privado',
        authRequired: true,
        authMethod: 'JWT / Bearer token',
      });
    } else if (button.dataset.action === 'remove-endpoint') {
      node.details.endpoints.splice(Number(button.dataset.endpointIndex), 1);
    } else return;
    renderComponentDetails(node);
    renderNode(node);
    renderEdges();
    componentDetails.closest('.property-group').open = true;
    saveState();
    recordHistory();
  });
  edgeLabel.addEventListener('input', () => {
    const edge = selected?.kind === 'edge' && edges.find(candidate => candidate.id === selected.id);
    if (!edge) return;
    edge.label = edgeLabel.value;
    renderEdges();
    saveState();
    scheduleHistoryRecord();
  });
  document.getElementById('connectModeBtn').addEventListener('click', () => setConnectMode(!connectMode));
  document.getElementById('deleteBtn').addEventListener('click', deleteSelected);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
  document.getElementById('deleteEdgePropertyBtn').addEventListener('click', deleteSelected);
  document.getElementById('clearBtn').addEventListener('click', reset);
  document.getElementById('newDiagramBtn').addEventListener('click', reset);
  document.getElementById('importJsonBtn').addEventListener('click', () => importJsonFile.click());
  importJsonFile.addEventListener('change', event => importJsonFileContent(event.currentTarget.files[0]));
  document.getElementById('starterTemplateBtn').addEventListener('click', loadTemplate);
  document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
  document.getElementById('exportSvgBtn').addEventListener('click', exportSvg);
  diagramTab.addEventListener('click', () => {
    diagramView.hidden = false;
    jsonView.hidden = true;
    diagramTab.classList.add('active');
    jsonTab.classList.remove('active');
    diagramTab.setAttribute('aria-selected', 'true');
    jsonTab.setAttribute('aria-selected', 'false');
  });
  jsonTab.addEventListener('click', () => {
    renderDiagramJson();
    diagramView.hidden = true;
    jsonView.hidden = false;
    jsonTab.classList.add('active');
    diagramTab.classList.remove('active');
    jsonTab.setAttribute('aria-selected', 'true');
    diagramTab.setAttribute('aria-selected', 'false');
  });
  document.getElementById('copyDiagramJsonBtn').addEventListener('click', copyDiagramJson);
  document.getElementById('zoomInBtn').addEventListener('click', () => {
    const rect = wrap.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, Math.min(1.6, +(zoom + .1).toFixed(2)));
  });
  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    const rect = wrap.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, Math.max(.35, +(zoom - .1).toFixed(2)));
  });
  document.getElementById('fitBtn').addEventListener('click', fitDiagram);
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('gridBtn').addEventListener('click', () => wrap.classList.toggle('no-grid'));
  document.getElementById('libraryResizer').addEventListener('pointerdown', event => beginPanelResize(event, 'library'));
  document.getElementById('propertiesResizer').addEventListener('pointerdown', event => beginPanelResize(event, 'properties'));
  Object.entries(PANEL_LIMITS).forEach(([panel, config]) => {
    document.getElementById(config.key).addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const direction = panel === 'library' ? 1 : -1;
      resizePanel(panel, panelWidths[panel] + direction * (event.key === 'ArrowRight' ? 10 : -10));
      savePanelWidths();
    });
  });
  wrap.addEventListener('wheel', event => {
    event.preventDefault();
    const nextZoom = Math.max(.35, Math.min(1.6, zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1)));
    zoomAt(event.clientX, event.clientY, nextZoom);
  }, { passive: false });
  wrap.addEventListener('pointerdown', event => {
    if (event.button !== 0 || connectMode || event.target.closest('.node, .connection, button, input, textarea')) return;
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      const wrapRect = wrap.getBoundingClientRect();
      const startX = event.clientX, startY = event.clientY;
      const additive = true;
      let moved = false;
      const updateMarquee = moveEvent => {
        const left = Math.min(startX, moveEvent.clientX);
        const top = Math.min(startY, moveEvent.clientY);
        const width = Math.abs(moveEvent.clientX - startX);
        const height = Math.abs(moveEvent.clientY - startY);
        if (width + height < 3) return;
        moved = true;
        backgroundPointerMoved = true;
        selectionMarquee.hidden = false;
        selectionMarquee.style.left = `${left - wrapRect.left}px`;
        selectionMarquee.style.top = `${top - wrapRect.top}px`;
        selectionMarquee.style.width = `${width}px`;
        selectionMarquee.style.height = `${height}px`;
      };
      const finishMarquee = upEvent => {
        window.removeEventListener('pointermove', updateMarquee);
        window.removeEventListener('pointerup', finishMarquee);
        window.removeEventListener('pointercancel', finishMarquee);
        window.removeEventListener('mouseup', finishMarquee);
        selectionMarquee.hidden = true;
        if (!moved) return;
        const endX = upEvent.clientX;
        const endY = upEvent.clientY;
        const bounds = {
          left: Math.min(startX, endX), right: Math.max(startX, endX),
          top: Math.min(startY, endY), bottom: Math.max(startY, endY),
        };
        const hits = nodes.filter(node => {
          const rect = document.getElementById(node.id)?.getBoundingClientRect();
          return rect && rect.right >= bounds.left && rect.left <= bounds.right &&
            rect.bottom >= bounds.top && rect.top <= bounds.bottom;
        }).map(node => node.id);
        const selection = new Set(additive ? selectedNodeIds : []);
        hits.forEach(id => selection.add(id));
        selectMultiple(selection);
      };
      window.addEventListener('pointermove', updateMarquee);
      window.addEventListener('pointerup', finishMarquee);
      window.addEventListener('pointercancel', finishMarquee);
      window.addEventListener('mouseup', finishMarquee);
      return;
    }
    const startX = event.clientX, startY = event.clientY, originalPanX = panX, originalPanY = panY;
    backgroundPointerMoved = false;
    wrap.classList.add('panning');
    wrap.setPointerCapture(event.pointerId);
    const move = moveEvent => {
      panX = originalPanX + moveEvent.clientX - startX;
      panY = originalPanY + moveEvent.clientY - startY;
      if (Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) > 3) {
        backgroundPointerMoved = true;
      }
      applyTransform();
    };
    const finish = upEvent => {
      window.removeEventListener('pointermove', move);
      wrap.classList.remove('panning');
      if (Number.isInteger(upEvent.pointerId) && wrap.hasPointerCapture(upEvent.pointerId)) {
        wrap.releasePointerCapture(upEvent.pointerId);
      }
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('mouseup', finish);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('mouseup', finish);
  });
  wrap.addEventListener('click', event => {
    if (backgroundPointerMoved) {
      backgroundPointerMoved = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.shiftKey || event.ctrlKey || event.metaKey) return;
    if (!event.target.closest('.node, .connection, button, input, textarea')) selectItem(null);
  });
  wrap.addEventListener('contextmenu', openContextMenu);
  contextMenu.addEventListener('click', event => {
    const button = event.target.closest('[data-context-action]');
    if (button) runContextAction(button.dataset.contextAction);
  });
  contextMenu.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const items = [...contextMenu.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    items[(index + step + items.length) % items.length]?.focus();
  });
  document.addEventListener('pointerdown', event => {
    if (!contextMenu.hidden && !contextMenu.contains(event.target)) closeContextMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !contextMenu.hidden) closeContextMenu();
  });
  selectionActions.addEventListener('click', event => {
    const button = event.target.closest('[data-selection-action]');
    if (button) alignSelection(button.dataset.selectionAction);
  });
  wrap.addEventListener('dragover', event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; });
  wrap.addEventListener('drop', event => {
    event.preventDefault();
    const type = event.dataTransfer.getData('text/plain');
    if (TYPES[type]) addAtCanvas(type, event.clientX, event.clientY);
  });
  function applyZoom() {
    applyTransform();
  }
  function applyTransform() {
    const transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    canvas.style.transform = transform;
    canvas.style.transformOrigin = 'top left';
    svg.style.transform = transform;
    svg.style.transformOrigin = 'top left';
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    renderEdges();
  }
  function zoomAt(clientX, clientY, nextZoom) {
    const rect = wrap.getBoundingClientRect();
    const pointX = clientX - rect.left;
    const pointY = clientY - rect.top;
    const diagramX = (pointX - panX) / zoom;
    const diagramY = (pointY - panY) / zoom;
    zoom = nextZoom;
    panX = pointX - diagramX * zoom;
    panY = pointY - diagramY * zoom;
    applyTransform();
  }
  function fitDiagram() {
    if (!nodes.length) {
      zoom = 1;
      panX = 0;
      panY = 0;
      applyTransform();
      return;
    }
    const padding = 48;
    const minX = Math.min(...nodes.map(node => node.x));
    const minY = Math.min(...nodes.map(node => node.y));
    const maxX = Math.max(...nodes.map(node => node.x + (document.getElementById(node.id)?.offsetWidth || node.width || 228)));
    const maxY = Math.max(...nodes.map(node => node.y + (document.getElementById(node.id)?.offsetHeight || node.height || 130)));
    zoom = Math.max(.35, Math.min(1.6,
      (wrap.clientWidth - padding * 2) / (maxX - minX),
      (wrap.clientHeight - padding * 2) / (maxY - minY)));
    panX = (wrap.clientWidth - (maxX - minX) * zoom) / 2 - minX * zoom;
    panY = (wrap.clientHeight - (maxY - minY) * zoom) / 2 - minY * zoom;
    applyTransform();
  }
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement?.isContentEditable;
      if (key === 'c' && !typing) {
        e.preventDefault();
        copySelection();
      } else if (key === 'v' && !typing) {
        e.preventDefault();
        pasteSelection();
      } else if (key === 'd' && !typing) {
        e.preventDefault();
        duplicateSelection();
      } else if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (key === 'y') {
        e.preventDefault();
        redo();
      }
      return;
    }
    if (['INPUT','TEXTAREA','SELECT'].includes(tag) || document.activeElement?.isContentEditable) return;
    if (e.key.toLowerCase() === 'c') setConnectMode(!connectMode);
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    if (e.key === 'Escape') { setConnectMode(false); selectItem(null); }
  });

  loadPanelWidths();
  if (!loadState()) updateCounts();
  renderDiagramJson();
  selectItem(null);
  history = [currentDiagramState()];
  historyIndex = 0;
  updateHistoryButtons();
})();