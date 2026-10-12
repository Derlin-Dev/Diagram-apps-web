(() => {
  const canvas = document.getElementById('canvas');
  const wrap = document.getElementById('canvasWrap');
  const svg = document.getElementById('connectionsSvg');
  const connectionControlsSvg = document.getElementById('connectionControlsSvg');
  const emptyState = document.getElementById('emptyState');
  const noSelection = document.getElementById('noSelection');
  const propertiesScroll = document.getElementById('propertiesScroll');
  const propertyForm = document.getElementById('propertyForm');
  const edgePropertyForm = document.getElementById('edgePropertyForm');
  const shapePropertyForm = document.getElementById('shapePropertyForm');
  const shapeTitle = document.getElementById('shapeTitle');
  const shapeType = document.getElementById('shapeType');
  const shapeColor = document.getElementById('shapeColor');
  const edgeLabel = document.getElementById('edgeLabel');
  const edgeDirection = document.getElementById('edgeDirection');
  const edgeStyle = document.getElementById('edgeStyle');
  const edgeConnectionType = document.getElementById('edgeConnectionType');
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
  const jsonEditorStatus = document.getElementById('jsonEditorStatus');
  const selectionActions = document.getElementById('selectionActions');
  const selectionCount = document.getElementById('selectionCount');
  const selectionMarquee = document.getElementById('selectionMarquee');
  const contextMenu = document.getElementById('contextMenu');

  const ICONS = window.ArqSketchDiagram.ICONS;
  const DETAIL_FIELDS = window.ArqSketchDiagram.DETAIL_FIELDS;
  const EDGE_TYPE_LABELS = {
    general: 'General',
    api: 'API / servicio',
    data: 'Datos',
    events: 'Eventos / mensajería',
    auth: 'Autenticación',
    files: 'Archivos',
    monitoring: 'Monitoreo',
    dependency: 'Dependencia',
    other: 'Otro',
  };
  const EDGE_TYPE_COLORS = {
    general: '#8290b1',
    api: '#65bfff',
    data: '#54d6b0',
    events: '#edb76d',
    auth: '#ef8fba',
    files: '#83aaff',
    monitoring: '#b4a9ff',
    dependency: '#aab5ca',
    other: '#c2bcff',
  };
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
  let shapes = [];
  let selected = null;
  let selectedEntityIds = new Set();
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
  let jsonDraftDirty = false;
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
  function getDiagramEntity(id) { return getNode(id) || getShape(id); }
  function entityTitle(entity) { return entity.name || entity.title || 'Grupo'; }
  function entityElement(entity) {
    return entity.name ? document.getElementById(entity.id) : canvas.querySelector(`[data-shape-id="${entity.id}"]`);
  }
  function nodeCenter(n) {
    const element = entityElement(n);
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
            x: x + column * spacingX,
            y: y + row * spacingY,
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
    return { x, y: y + nodes.length * spacingY };
  }
  function currentDiagramState() {
    return JSON.stringify({ nodes, edges, shapes, nextId });
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
    shapes = data.shapes || [];
    nextId = data.nextId;
    selected = null;
    connectFrom = null;
    canvas.querySelectorAll('.node').forEach(node => node.remove());
    canvas.querySelectorAll('.group-shape').forEach(shape => shape.remove());
    shapes.forEach(renderShape);
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
    const shapeCount = `${shapes.length} grupo${shapes.length === 1 ? '' : 's'}`;
    elementCount.textContent = `${componentCount} · ${connectionCount}${shapes.length ? ` · ${shapeCount}` : ''}`;
    emptyState.classList.toggle('hidden', nodes.length > 0 || shapes.length > 0);
  }
  function addNode(type, x, y, opts = {}) {
    const info = TYPES[type] || TYPES.backend;
    const node = { id: opts.id || makeId('cmp'), type, name: opts.name || info.defaultName, description: opts.description ?? info.desc,
      details: opts.details || window.ArqSketchDiagram.createDefaultDetails(type),
      icon: opts.icon || 'auto',
      x: Math.max(-100000, Math.min(100000, x)),
      y: Math.max(-100000, Math.min(100000, y)),
    };
    if (opts.width !== undefined) node.width = opts.width;
    if (opts.height !== undefined) node.height = opts.height;
    nodes.push(node);
    renderNode(node);
    updateCounts();
    selectItem({ kind: 'node', id: node.id });
    return node;
  }
  function addShape() {
    if (shapes.length >= 300) {
      notify('El diagrama alcanzó el límite de 300 grupos.');
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const shape = {
      id: makeId('grp'),
      type: 'rectangle',
      title: 'Nuevo grupo',
      color: '#65bfff',
      x: Math.max(-100000, Math.min(100000, (rect.width / 2 - panX) / zoom - 210)),
      y: Math.max(-100000, Math.min(100000, (rect.height / 2 - panY) / zoom - 145)),
      width: 420,
      height: 290,
    };
    shapes.push(shape);
    renderShape(shape);
    updateCounts();
    selectItem({ kind: 'shape', id: shape.id });
    recordHistory();
    saveState();
  }
  function getShape(id) { return shapes.find(shape => shape.id === id); }
  function renderShape(shape) {
    let element = canvas.querySelector(`[data-shape-id="${shape.id}"]`);
    if (!element) {
      element = document.createElement('div');
      element.className = 'group-shape';
      element.dataset.shapeId = shape.id;
      element.tabIndex = 0;
      element.setAttribute('role', 'group');
      const title = document.createElement('span');
      title.className = 'group-shape-title';
      const resize = document.createElement('button');
      resize.type = 'button';
      resize.className = 'group-shape-resize';
      resize.title = 'Arrastra para cambiar el tamaño del grupo';
      resize.setAttribute('aria-label', 'Cambiar tamaño del grupo');
      element.append(title, resize);
      canvas.appendChild(element);
      element.addEventListener('pointerdown', event => beginShapeDrag(event, shape.id));
      element.addEventListener('click', event => {
        event.stopPropagation();
        if (connectMode) handleConnectClick(shape.id);
        else if (event.shiftKey || event.ctrlKey || event.metaKey) toggleEntitySelection(shape.id);
        else if (selectedEntityIds.size < 2 || !selectedEntityIds.has(shape.id)) selectItem({ kind: 'shape', id: shape.id });
      });
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectItem({ kind: 'shape', id: shape.id });
        }
      });
      resize.addEventListener('pointerdown', event => beginShapeResize(event, shape.id));
    }
    element.classList.toggle('ellipse', shape.type === 'ellipse');
    element.classList.toggle('selected', selectedEntityIds.has(shape.id));
    element.classList.toggle('multi-selected', selectedEntityIds.size > 1 && selectedEntityIds.has(shape.id));
    element.style.left = `${shape.x}px`;
    element.style.top = `${shape.y}px`;
    element.style.width = `${shape.width}px`;
    element.style.height = `${shape.height}px`;
    element.style.setProperty('--group-color', shape.color);
    element.style.setProperty('--group-fill', `${shape.color}24`);
    element.querySelector('.group-shape-title').textContent = shape.title || 'Grupo';
    element.setAttribute('aria-label', `Grupo: ${shape.title || 'Sin título'}, ${shape.type === 'ellipse' ? 'elipse' : 'rectángulo'}`);
  }
  function beginShapeDrag(event, id) {
    if (event.button !== 0 || connectMode || event.shiftKey || event.ctrlKey || event.metaKey ||
        event.target.closest('.group-shape-resize')) return;
    event.preventDefault();
    event.stopPropagation();
    const shape = getShape(id);
    if (!shape) return;
    if (!selectedEntityIds.has(id)) selectItem({ kind: 'shape', id });
    beginEntityDrag(event, id);
  }
  function beginShapeResize(event, id) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const shape = getShape(id);
    if (!shape) return;
    if (selected?.id !== id || selected?.kind !== 'shape') selectItem({ kind: 'shape', id });
    recordHistory();
    const startX = event.clientX, startY = event.clientY;
    const startWidth = shape.width, startHeight = shape.height;
    let resized = false;
    const move = moveEvent => {
      const width = Math.max(140, Math.min(2000, startWidth + (moveEvent.clientX - startX) / zoom));
      const height = Math.max(100, Math.min(1600, startHeight + (moveEvent.clientY - startY) / zoom));
      if (Math.abs(width - startWidth) + Math.abs(height - startHeight) < 2) return;
      resized = true;
      shape.width = Math.round(width);
      shape.height = Math.round(height);
      renderShape(shape);
      renderEdges();
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      if (resized) { recordHistory(); saveState(); }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
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
        else if (event.shiftKey || event.ctrlKey || event.metaKey) toggleEntitySelection(n.id);
        else if (selectedEntityIds.size < 2 || !selectedEntityIds.has(n.id)) selectItem({ kind: 'node', id: n.id });
      });
    }
    const info = TYPES[n.type];
    el.style.left = `${n.x}px`; el.style.top = `${n.y}px`;
    el.style.width = `${n.width || 228}px`;
    el.style.height = n.height ? `${n.height}px` : 'auto';
    const isSelected = selectedEntityIds.has(n.id);
    el.className = `node ${n.type}${isSelected ? ' selected' : ''}${selectedEntityIds.size > 1 && isSelected ? ' multi-selected' : ''}`;
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
  function anchorPoint(node, element, anchor) {
    const width = element?.offsetWidth || node.width || 228;
    const height = element?.offsetHeight || node.height || 130;
    const offset = anchor.offset;
    if (!node.name && node.type === 'ellipse') {
      const position = offset * 2 - 1;
      if (anchor.side === 'top' || anchor.side === 'bottom') {
        const x = node.x + width * offset;
        const delta = Math.sqrt(Math.max(0, 1 - position ** 2)) * height / 2;
        return { x, y: node.y + height / 2 + (anchor.side === 'top' ? -delta : delta) };
      }
      const y = node.y + height * offset;
      const delta = Math.sqrt(Math.max(0, 1 - position ** 2)) * width / 2;
      return { x: node.x + width / 2 + (anchor.side === 'left' ? -delta : delta), y };
    }
    if (anchor.side === 'top') return { x: node.x + width * offset, y: node.y };
    if (anchor.side === 'right') return { x: node.x + width, y: node.y + height * offset };
    if (anchor.side === 'bottom') return { x: node.x + width * offset, y: node.y + height };
    return { x: node.x, y: node.y + height * offset };
  }
  function nearestAnchor(node, element, point) {
    const width = element?.offsetWidth || node.width || 228;
    const height = element?.offsetHeight || node.height || 130;
    const x = Math.max(node.x, Math.min(node.x + width, point.x));
    const y = Math.max(node.y, Math.min(node.y + height, point.y));
    const distances = [
      { side: 'top', distance: Math.abs(point.y - node.y) },
      { side: 'right', distance: Math.abs(point.x - node.x - width) },
      { side: 'bottom', distance: Math.abs(point.y - node.y - height) },
      { side: 'left', distance: Math.abs(point.x - node.x) },
    ];
    const nearest = distances.reduce((best, item) => item.distance < best.distance ? item : best);
    const length = nearest.side === 'top' || nearest.side === 'bottom' ? width : height;
    const relativeOffset = nearest.side === 'top' || nearest.side === 'bottom' ? x - node.x : y - node.y;
    if (!node.name && node.type === 'ellipse') {
      const centerX = node.x + width / 2;
      const centerY = node.y + height / 2;
      const normalizedX = (point.x - centerX) / (width / 2);
      const normalizedY = (point.y - centerY) / (height / 2);
      const side = Math.abs(normalizedX) > Math.abs(normalizedY)
        ? (normalizedX >= 0 ? 'right' : 'left')
        : (normalizedY >= 0 ? 'bottom' : 'top');
      const offset = side === 'left' || side === 'right'
        ? Math.max(0, Math.min(1, (point.y - node.y) / height))
        : Math.max(0, Math.min(1, (point.x - node.x) / width));
      return { side, offset };
    }
    return { side: nearest.side, offset: Math.max(0, Math.min(1, relativeOffset / length)) };
  }
  function addConnectionHandle(edge, point, label, drag) {
    const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    handle.setAttribute('cx', point.x);
    handle.setAttribute('cy', point.y);
    handle.setAttribute('r', '6');
    handle.setAttribute('class', `connection-handle${drag === 'via' ? ' connection-route-handle' : ' connection-anchor-handle'}`);
    handle.setAttribute('role', 'button');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('aria-label', label);
    handle.setAttribute('title', label);
    handle.addEventListener('pointerdown', event => {
      if (drag === 'via') beginEdgeRouteDrag(event, edge, point);
      else beginEdgeAnchorDrag(event, edge, drag);
    });
    handle.addEventListener('click', event => event.stopPropagation());
    connectionControlsSvg.appendChild(handle);
  }
  function renderEdges() {
    svg.innerHTML = '<defs></defs>';
    const defs = svg.querySelector('defs');
    connectionControlsSvg.replaceChildren();
    edges.forEach((e, i) => {
      const a = getDiagramEntity(e.from), b = getDiagramEntity(e.to);
      if (!a || !b) return;
      const ac = nodeCenter(a), bc = nodeCenter(b);
      const aElement = entityElement(a);
      const bElement = entityElement(b);
      const dx = bc.x - ac.x, dy = bc.y - ac.y;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      const sourceAnchor = e.fromAnchor || {
        side: horizontal ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top'),
        offset: 0.5,
      };
      const targetAnchor = e.toAnchor || {
        side: horizontal ? (dx >= 0 ? 'left' : 'right') : (dy >= 0 ? 'top' : 'bottom'),
        offset: 0.5,
      };
      const sourcePoint = anchorPoint(a, aElement, sourceAnchor);
      const targetPoint = anchorPoint(b, bElement, targetAnchor);
      const { x: sx, y: sy } = sourcePoint;
      const { x: ex, y: ey } = targetPoint;
      const bend = Math.max(35, Math.hypot(ex - sx, ey - sy) * .42);
      const directions = {
        top: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        bottom: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
      };
      const sourceDirection = directions[sourceAnchor.side];
      const targetDirection = directions[targetAnchor.side];
      const c1x = sx + sourceDirection.x * bend;
      const c1y = sy + sourceDirection.y * bend;
      const c2x = ex + targetDirection.x * bend;
      const c2y = ey + targetDirection.y * bend;
      const chordMidpoint = { x: (sx + ex) / 2, y: (sy + ey) / 2 };
      const curveMidpoint = e.via
        ? { x: chordMidpoint.x + e.via.x, y: chordMidpoint.y + e.via.y }
        : {
            x: (sx + 3 * c1x + 3 * c2x + ex) / 8,
            y: (sy + 3 * c1y + 3 * c2y + ey) / 8,
          };
      const d = e.via
        ? `M ${sx} ${sy} Q ${chordMidpoint.x + 2 * e.via.x} ${chordMidpoint.y + 2 * e.via.y} ${ex} ${ey}`
        : `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
      const selectedEdge = selected?.kind === 'edge' && selected.id === e.id;
      const edgeColor = selectedEdge ? '#a99dff' : EDGE_TYPE_COLORS[e.connectionType || 'general'];
      const markerId = `arrow-${e.id}`;
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', markerId);
      marker.setAttribute('markerWidth', '9');
      marker.setAttribute('markerHeight', '9');
      marker.setAttribute('refX', '7');
      marker.setAttribute('refY', '3');
      marker.setAttribute('orient', 'auto-start-reverse');
      marker.setAttribute('markerUnits', 'strokeWidth');
      const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arrowHead.setAttribute('d', 'M0,0 L0,6 L8,3 z');
      arrowHead.setAttribute('fill', edgeColor);
      marker.appendChild(arrowHead);
      defs.appendChild(marker);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', `connection type-${e.connectionType || 'general'} style-${e.style || 'solid'}${selectedEdge ? ' selected' : ''}`);
      path.dataset.edgeId = e.id;
      path.style.stroke = edgeColor;
      if (e.style === 'dashed') path.style.strokeDasharray = '9 6';
      if (e.style === 'dotted') {
        path.style.strokeDasharray = '1 6';
        path.style.strokeLinecap = 'round';
      }
      if (e.direction === 'forward' || e.direction === 'both') path.setAttribute('marker-end', `url(#${markerId})`);
      if (e.direction === 'reverse' || e.direction === 'both') path.setAttribute('marker-start', `url(#${markerId})`);
      path.style.pointerEvents = 'stroke';
      path.addEventListener('click', ev => { ev.stopPropagation(); selectItem({ kind: 'edge', id: e.id }); });
      svg.appendChild(path);
      if (e.direction !== 'none') {
        const flow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        flow.setAttribute('d', d);
        flow.setAttribute('class', `connection-flow${e.direction === 'reverse' ? ' reverse' : ''}`);
        flow.setAttribute('aria-hidden', 'true');
        svg.appendChild(flow);
        if (e.direction === 'both') {
          const reverseFlow = flow.cloneNode();
          reverseFlow.setAttribute('class', 'connection-flow reverse');
          svg.appendChild(reverseFlow);
        }
      }
      const typeLabel = e.connectionType && e.connectionType !== 'general'
        ? EDGE_TYPE_LABELS[e.connectionType]
        : '';
      const connectionLabel = [typeLabel, e.label].filter(Boolean).join(' · ');
      if (connectionLabel) {
        const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelGroup.setAttribute('class', 'connection-label-group');
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', curveMidpoint.x); text.setAttribute('y', curveMidpoint.y - 8);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'connection-label');
        text.textContent = connectionLabel;
        labelGroup.appendChild(text);
        svg.appendChild(labelGroup);
        const bounds = text.getBBox();
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('x', bounds.x - 8);
        background.setAttribute('y', bounds.y - 5);
        background.setAttribute('width', bounds.width + 16);
        background.setAttribute('height', bounds.height + 10);
        background.setAttribute('rx', '6');
        background.setAttribute('class', 'connection-label-background');
        background.style.stroke = edgeColor;
        labelGroup.insertBefore(background, text);
      }
      if (selectedEdge) {
        addConnectionHandle(e, sourcePoint, 'Mover extremo inicial en la tarjeta', 'fromAnchor');
        addConnectionHandle(e, targetPoint, 'Mover punta de flecha en la tarjeta', 'toAnchor');
        addConnectionHandle(e, curveMidpoint, 'Mover recorrido de la conexión', 'via');
      }
    });
  }
  function beginEdgeRouteDrag(event, edge, initialPoint) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    recordHistory();
    let moved = false;
    const move = pointerEvent => {
      const bounds = canvas.getBoundingClientRect();
      const point = {
        x: (pointerEvent.clientX - bounds.left) / zoom,
        y: (pointerEvent.clientY - bounds.top) / zoom,
      };
      moved ||= point.x !== initialPoint.x || point.y !== initialPoint.y;
      if (!moved) return;
      const a = nodeCenter(getDiagramEntity(edge.from));
      const b = nodeCenter(getDiagramEntity(edge.to));
      const chordMidpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      edge.via = { x: point.x - chordMidpoint.x, y: point.y - chordMidpoint.y };
      renderEdges();
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      if (moved) {
        saveState();
        recordHistory();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish, { once: true });
    window.addEventListener('pointercancel', finish, { once: true });
  }
  function beginEdgeAnchorDrag(event, edge, anchorKey) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    recordHistory();
    const node = getDiagramEntity(anchorKey === 'fromAnchor' ? edge.from : edge.to);
    let moved = false;
    const move = pointerEvent => {
      const bounds = canvas.getBoundingClientRect();
      const point = {
        x: (pointerEvent.clientX - bounds.left) / zoom,
        y: (pointerEvent.clientY - bounds.top) / zoom,
      };
      edge[anchorKey] = nearestAnchor(node, entityElement(node), point);
      moved = true;
      renderEdges();
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      if (moved) {
        saveState();
        recordHistory();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish, { once: true });
    window.addEventListener('pointercancel', finish, { once: true });
  }
  function selectItem(item) {
    selected = item;
    selectedEntityIds = item && ['node', 'shape'].includes(item.kind) ? new Set([item.id]) : new Set();
    nodes.forEach(renderNode);
    renderEdges();
    updateSelectionActions();
    const isNode = item?.kind === 'node';
    const isEdge = item?.kind === 'edge';
    const isShape = item?.kind === 'shape';
    noSelection.classList.toggle('hidden', !!item);
    propertiesScroll.classList.toggle('hidden', !item);
    propertyForm.classList.toggle('hidden', !isNode);
    edgePropertyForm.classList.toggle('hidden', !isEdge);
    shapePropertyForm.classList.toggle('hidden', !isShape);
    shapes.forEach(renderShape);
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
      const from = getDiagramEntity(edge.from), to = getDiagramEntity(edge.to);
      edgeSummary.textContent = `${from ? entityTitle(from) : 'Componente'} → ${to ? entityTitle(to) : 'Componente'}`;
      edgeLabel.value = edge.label || '';
      edgeDirection.value = edge.direction || 'forward';
      edgeStyle.value = edge.style || 'solid';
      edgeConnectionType.value = edge.connectionType || 'general';
    } else if (isShape) {
      const shape = getShape(item.id);
      shapeTitle.value = shape.title;
      shapeType.value = shape.type;
      shapeColor.value = shape.color;
    } else {
      updateSelectedIcon();
      noSelection.innerHTML = '<div class="select-illustration">⌁</div><b>Ningún elemento seleccionado</b><p>Selecciona un componente, grupo o conexión del lienzo para ver sus propiedades.</p>';
    }
  }
  function toggleEntitySelection(id) {
    const next = new Set(selectedEntityIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectMultiple(next);
  }
  function selectMultiple(ids) {
    const validIds = new Set([...ids].filter(id => getDiagramEntity(id)));
    if (validIds.size <= 1) {
      const id = [...validIds][0];
      selectItem(id ? { kind: getNode(id) ? 'node' : 'shape', id } : null);
      return;
    }
    selected = null;
    selectedEntityIds = validIds;
    nodes.forEach(renderNode);
    shapes.forEach(renderShape);
    renderEdges();
    noSelection.classList.remove('hidden');
    propertiesScroll.classList.add('hidden');
    const componentCount = [...validIds].filter(id => getNode(id)).length;
    const groupCount = validIds.size - componentCount;
    noSelection.innerHTML = `<div class="select-illustration">⌖</div><b>${validIds.size} elementos seleccionados</b><p>${componentCount} componentes y ${groupCount} grupos. Arrástralos juntos o usa las acciones de alineación.</p>`;
    propertyForm.classList.add('hidden');
    edgePropertyForm.classList.add('hidden');
    shapePropertyForm.classList.add('hidden');
    updateSelectedIcon();
    updateSelectionActions();
  }
  function updateSelectionActions() {
    const count = selectedEntityIds.size;
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
    let fieldsContainer = componentDetails;
    if (node.type === 'backend') {
      const apiGroup = document.createElement('details');
      apiGroup.className = 'component-subgroup';
      apiGroup.open = true;
      const summary = document.createElement('summary');
      summary.textContent = 'Servicio API';
      const content = document.createElement('div');
      content.className = 'component-subgroup-content';
      apiGroup.append(summary, content);
      componentDetails.appendChild(apiGroup);
      fieldsContainer = content;
    }
    fields.forEach(field => {
      const fieldId = `detail-${node.id}-${field.key}`;
      appendFieldLabel(fieldsContainer, field.label, fieldId);
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
      fieldsContainer.appendChild(control);
    });
    if (node.type === 'backend') renderEndpointEditor(node);
  }
  function renderEndpointEditor(node) {
    const endpointGroup = document.createElement('details');
    endpointGroup.className = 'component-subgroup endpoint-group';
    endpointGroup.open = true;
    const endpointsHeading = document.createElement('h4');
    endpointsHeading.textContent = `Endpoints (${node.details.endpoints.length})`;
    endpointGroup.appendChild(endpointsHeading);
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
    endpointGroup.appendChild(endpoints);
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn btn-quiet endpoint-add';
    add.dataset.action = 'add-endpoint';
    add.textContent = '＋ Agregar endpoint';
    add.disabled = node.details.endpoints.length >= 100;
    endpointGroup.appendChild(add);
    componentDetails.appendChild(endpointGroup);
  }
  function beginDrag(event, id) {
    if (event.button !== 0 || connectMode || event.shiftKey || event.ctrlKey || event.metaKey) return;
    if (!selectedEntityIds.has(id)) selectItem({ kind: 'node', id });
    beginEntityDrag(event, id);
  }
  function beginEntityDrag(event, id) {
    recordHistory();
    const movingEntities = [...selectedEntityIds].map(entityId => {
      const entity = getDiagramEntity(entityId);
      return { entity, x: entity.x, y: entity.y };
    });
    const startX = event.clientX, startY = event.clientY;
    let moved = false;
    const move = ev => {
      const dx = (ev.clientX - startX) / zoom, dy = (ev.clientY - startY) / zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (!moved) return;
      movingEntities.forEach(({ entity, x, y }) => {
        entity.x = Math.max(-100000, Math.min(100000, x + dx));
        entity.y = Math.max(-100000, Math.min(100000, y + dy));
        if (entity.name) renderNode(entity);
        else renderShape(entity);
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
      connectFrom = id; notify('Ahora selecciona el componente o grupo de destino.'); modeStatus.textContent = 'Modo: elige destino';
      return;
    }
    if (connectFrom === id) { notify('Elige un componente diferente.'); return; }
    if (!edges.some(e => e.from === connectFrom && e.to === id)) {
      recordHistory();
      edges.push({ id: makeId('con'), from: connectFrom, to: id, label: '', direction: 'forward', style: 'solid', connectionType: 'general' });
      recordHistory();
      const from = getDiagramEntity(connectFrom), to = getDiagramEntity(id);
      notify(`Conexión creada: ${entityTitle(from)} → ${entityTitle(to)}.`);
    } else notify('Esa conexión ya existe.');
    connectFrom = null; setConnectMode(false); renderEdges(); updateCounts(); saveState();
  }
  function setConnectMode(on) {
    connectMode = on; connectFrom = null;
    canvas.classList.toggle('connect-mode', on);
    document.getElementById('connectModeBtn').classList.toggle('active', on);
    modeStatus.textContent = on ? 'Modo: conectar (elige origen)' : 'Modo: selección';
    if (on) notify('Selecciona un componente o grupo de origen y luego el destino.');
  }
  function connectFromNode(id) {
    if (!connectMode) setConnectMode(true);
    connectFrom = id;
    modeStatus.textContent = 'Modo: elige destino';
    notify('Selecciona el componente de destino.');
  }
  function connectFromShape(id) {
    if (!connectMode) setConnectMode(true);
    connectFrom = id;
    modeStatus.textContent = 'Modo: elige destino';
    notify('Selecciona el componente o grupo de destino.');
  }
  function closeContextMenu() {
    contextMenu.hidden = true;
    contextTarget = null;
  }
  function openContextMenu(event) {
    const nodeElement = event.target.closest('.node');
    const shapeElement = event.target.closest('.group-shape');
    const edgeElement = event.target.closest('.connection');
    if (!nodeElement && !shapeElement && !edgeElement) return;
    event.preventDefault();
    if (nodeElement) {
      const id = nodeElement.id;
      if (!selectedEntityIds.has(id)) selectItem({ kind: 'node', id });
      contextTarget = { kind: 'node', id };
    } else if (shapeElement) {
      const id = shapeElement.dataset.shapeId;
      if (!selectedEntityIds.has(id)) selectItem({ kind: 'shape', id });
      contextTarget = { kind: 'shape', id };
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
      : contextTarget.kind === 'shape'
        ? [
            ['copy', 'Copiar grupo'],
            ['duplicate', 'Duplicar grupo'],
            ['connect', 'Conectar desde aquí'],
            ['edit', 'Editar propiedades'],
            ['delete', 'Eliminar grupo', true],
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
    else if (action === 'connect' && target.kind === 'shape') connectFromShape(target.id);
    else if (action === 'edit' && target.kind === 'node') {
      selectItem({ kind: 'node', id: target.id });
      nodeName.focus();
      nodeName.select();
    } else if (action === 'edit' && target.kind === 'edge') {
      selectItem({ kind: 'edge', id: target.id });
      edgeLabel.focus();
      edgeLabel.select();
    } else if (action === 'edit' && target.kind === 'shape') {
      selectItem({ kind: 'shape', id: target.id });
      shapeTitle.focus();
      shapeTitle.select();
    } else if (action === 'delete') {
      if (target.kind === 'edge' && selected?.kind !== 'edge') selectItem({ kind: 'edge', id: target.id });
      deleteSelected();
    }
  }
  function deleteSelected() {
    if (selectedEntityIds.size > 1) {
      recordHistory();
      const removed = new Set(selectedEntityIds);
      nodes = nodes.filter(node => !removed.has(node.id));
      shapes = shapes.filter(shape => !removed.has(shape.id));
      edges = edges.filter(edge => !removed.has(edge.from) && !removed.has(edge.to));
      removed.forEach(id => {
        document.getElementById(id)?.remove();
        canvas.querySelector(`.group-shape[data-shape-id="${id}"]`)?.remove();
      });
      selectItem(null);
      renderEdges();
      updateCounts();
      recordHistory();
      saveState();
      notify(`${removed.size} elementos eliminados.`);
      return;
    }
    if (!selected) return;
    recordHistory();
    if (selected.kind === 'node') {
      nodes = nodes.filter(n => n.id !== selected.id);
      edges = edges.filter(e => e.from !== selected.id && e.to !== selected.id);
      document.getElementById(selected.id)?.remove();
    } else if (selected.kind === 'edge') edges = edges.filter(e => e.id !== selected.id);
    else {
      shapes = shapes.filter(shape => shape.id !== selected.id);
      edges = edges.filter(edge => edge.from !== selected.id && edge.to !== selected.id);
      canvas.querySelector(`.group-shape[data-shape-id="${selected.id}"]`)?.remove();
    }
    selected = null; selectItem(null); renderEdges(); updateCounts(); recordHistory(); saveState(); notify('Elemento eliminado.');
  }
  function copySelection({ quiet = false } = {}) {
    const selectedNodes = nodes.filter(node => selectedEntityIds.has(node.id));
    const selectedShapes = shapes.filter(shape => selectedEntityIds.has(shape.id));
    const selectedEntities = [...selectedNodes, ...selectedShapes];
    if (!selectedEntities.length) {
      if (!quiet) notify('Selecciona componentes o grupos para copiarlos.');
      return false;
    }
    const minX = Math.min(...selectedEntities.map(entity => entity.x));
    const minY = Math.min(...selectedEntities.map(entity => entity.y));
    const ids = new Set(selectedEntities.map(entity => entity.id));
    copiedSelection = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)).map(node => ({ ...node, x: node.x - minX, y: node.y - minY })),
      shapes: JSON.parse(JSON.stringify(selectedShapes)).map(shape => ({ ...shape, x: shape.x - minX, y: shape.y - minY })),
      edges: JSON.parse(JSON.stringify(edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)))),
      origin: { x: minX, y: minY },
    };
    if (!quiet) notify(`${selectedEntities.length} elemento${selectedEntities.length === 1 ? '' : 's'} copiado${selectedEntities.length === 1 ? '' : 's'}.`);
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
          const candidate = { x: x + column * spacingX, y: y + row * spacingY };
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
    return { x, y: y + nodes.length * spacingY };
  }
  function pasteSelection({ quiet = false, offset = false } = {}) {
    if (!copiedSelection || (!copiedSelection.nodes.length && !copiedSelection.shapes?.length)) {
      if (!quiet) notify('No hay componentes o grupos copiados para pegar.');
      return false;
    }
    const rect = wrap.getBoundingClientRect();
    const anchorX = offset
      ? copiedSelection.origin.x + 32
      : (rect.width / 2 - panX) / zoom - 114;
    const anchorY = offset
      ? copiedSelection.origin.y + 32
      : (rect.height / 2 - panY) / zoom - 65;
    if (!copiedSelection.nodes.length && copiedSelection.shapes?.length) {
      recordHistory();
      const groupWidth = Math.max(...copiedSelection.shapes.map(shape => shape.x + shape.width));
      const groupHeight = Math.max(...copiedSelection.shapes.map(shape => shape.y + shape.height));
      const shapeOriginX = offset ? anchorX : (rect.width / 2 - panX) / zoom - groupWidth / 2;
      const shapeOriginY = offset ? anchorY : (rect.height / 2 - panY) / zoom - groupHeight / 2;
      const idMap = new Map();
      const pastedShapes = copiedSelection.shapes.map(source => {
        const shape = { ...JSON.parse(JSON.stringify(source)), id: makeId('grp') };
        idMap.set(source.id, shape.id);
        shape.x += shapeOriginX;
        shape.y += shapeOriginY;
        shapes.push(shape);
        renderShape(shape);
        return shape;
      });
      copiedSelection.edges.forEach(source => {
        edges.push({
          ...JSON.parse(JSON.stringify(source)),
          id: makeId('con'),
          from: idMap.get(source.from),
          to: idMap.get(source.to),
        });
      });
      selectMultiple(pastedShapes.map(shape => shape.id));
      renderEdges();
      updateCounts();
      recordHistory();
      saveState();
      if (!quiet) notify(`${pastedShapes.length} grupo${pastedShapes.length === 1 ? '' : 's'} pegado${pastedShapes.length === 1 ? '' : 's'}.`);
      return true;
    }
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
    const pastedShapes = copiedSelection.shapes.map(source => {
      const shape = JSON.parse(JSON.stringify(source));
      const oldId = shape.id;
      shape.id = makeId('grp');
      idMap.set(oldId, shape.id);
      shape.x += position.x;
      shape.y += position.y;
      shapes.push(shape);
      renderShape(shape);
      return shape;
    });
    copiedSelection.edges.forEach(source => {
      edges.push({
        ...JSON.parse(JSON.stringify(source)),
        id: makeId('con'),
        from: idMap.get(source.from),
        to: idMap.get(source.to),
      });
    });
    selectMultiple([...pastedNodes.map(node => node.id), ...pastedShapes.map(shape => shape.id)]);
    renderEdges();
    updateCounts();
    recordHistory();
    saveState();
    if (!quiet) notify(`${pastedNodes.length + pastedShapes.length} elemento${pastedNodes.length + pastedShapes.length === 1 ? '' : 's'} pegado${pastedNodes.length + pastedShapes.length === 1 ? '' : 's'}.`);
    return true;
  }
  function duplicateSelection() {
    if (!copySelection({ quiet: true })) return;
    pasteSelection({ quiet: true, offset: true });
    notify('Selección duplicada.');
  }
  function alignSelection(action) {
    const selectedEntities = [...nodes, ...shapes].filter(entity => selectedEntityIds.has(entity.id));
    if (selectedEntities.length < 2) return;
    recordHistory();
    if (action === 'align-left') {
      const x = Math.min(...selectedEntities.map(entity => entity.x));
      selectedEntities.forEach(entity => { entity.x = x; });
    } else if (action === 'align-top') {
      const y = Math.min(...selectedEntities.map(entity => entity.y));
      selectedEntities.forEach(entity => { entity.y = y; });
    } else {
      if (selectedEntities.length < 3) {
        notify('Se necesitan al menos tres elementos para distribuir.');
        return;
      }
      const horizontal = action === 'distribute-horizontal';
      const sorted = selectedEntities.slice().sort((a, b) => horizontal ? a.x - b.x : a.y - b.y);
      const size = entity => {
        const element = entityElement(entity);
        return horizontal ? element?.offsetWidth || entity.width || 228 : element?.offsetHeight || entity.height || 110;
      };
      const start = horizontal ? sorted[0].x : sorted[0].y;
      const endEntity = sorted.at(-1);
      const end = (horizontal ? endEntity.x : endEntity.y) + size(endEntity);
      const gap = Math.max(24,
        (end - start - sorted.reduce((total, entity) => total + size(entity), 0)) / (sorted.length - 1));
      let offset = start;
      sorted.forEach(entity => {
        if (horizontal) entity.x = offset;
        else entity.y = offset;
        offset += size(entity) + gap;
      });
    }
    selectedEntities.forEach(entity => entity.name ? renderNode(entity) : renderShape(entity));
    renderEdges();
    recordHistory();
    saveState();
  }
  function saveState() {
    renderDiagramJson();
    try {
      localStorage.setItem('arqsketch-state', JSON.stringify({ nodes, edges, shapes, nextId }));
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
      nodes = diagram.nodes; edges = diagram.edges; shapes = diagram.shapes || []; nextId = diagram.nextId;
      nodes.forEach(renderNode); shapes.forEach(renderShape); renderEdges(); updateCounts();
      return nodes.length > 0 || shapes.length > 0;
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
      applyDiagramData(data, 'el archivo');
    } catch (error) {
      notify(`No se pudo abrir el diagrama: ${error.message}`);
    } finally {
      importJsonFile.value = '';
    }
  }
  function applyDiagramData(data, sourceDescription = 'el JSON') {
    const diagram = window.ArqSketchDiagram.normalizeDiagram(data);
    if ((nodes.length || edges.length || shapes.length) &&
        !confirm(`Aplicar ${sourceDescription} reemplazará el diagrama actual. ¿Deseas continuar?`)) return false;

    recordHistory();
    nodes = diagram.nodes;
    edges = diagram.edges;
    shapes = diagram.shapes || [];
    nextId = diagram.nextId;
    selected = null;
    connectFrom = null;
    setConnectMode(false);
    canvas.querySelectorAll('.node').forEach(node => node.remove());
    canvas.querySelectorAll('.group-shape').forEach(shape => shape.remove());
    nodes.forEach(renderNode);
    shapes.forEach(renderShape);
    renderEdges();
    updateCounts();
    selectItem(null);
    jsonDraftDirty = false;
    recordHistory();
    const saved = saveState();
    if (saved) {
      const componentCount = `${nodes.length} componente${nodes.length === 1 ? '' : 's'}`;
      const connectionCount = `${edges.length} ${edges.length === 1 ? 'conexión' : 'conexiones'}`;
      notify(`Diagrama abierto: ${componentCount} y ${connectionCount}.`);
      return true;
    }
    return false;
  }
  function applyDiagramJson() {
    try {
      if (diagramJson.value.length > 5 * 1024 * 1024) {
        throw new Error('El JSON supera el límite de 5 MB');
      }
      let data;
      try {
        data = JSON.parse(diagramJson.value);
      } catch {
        throw new Error('El texto no contiene JSON válido');
      }
      if (applyDiagramData(data)) {
        jsonDraftDirty = false;
        renderDiagramJson();
        jsonEditorStatus.textContent = 'JSON aplicado correctamente.';
      }
    } catch (error) {
      jsonEditorStatus.textContent = `Error: ${error.message}`;
      notify(`No se pudo aplicar el JSON: ${error.message}`);
    }
  }
  async function pasteDiagramJson() {
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error('El navegador no permite leer el portapapeles aquí. Usa Ctrl+V o Cmd+V en el editor.');
      }
      const text = await navigator.clipboard.readText();
      if (!text) throw new Error('El portapapeles está vacío');
      if (text.length > 5 * 1024 * 1024) throw new Error('El JSON supera el límite de 5 MB');
      diagramJson.value = text;
      jsonDraftDirty = true;
      jsonEditorStatus.textContent = 'JSON pegado. Revísalo y pulsa “Aplicar JSON” para cargarlo.';
      diagramJson.focus();
      notify('JSON pegado en el editor. Pulsa “Aplicar JSON” para cargar el diagrama.');
    } catch (error) {
      jsonEditorStatus.textContent = `No se pudo pegar: ${error.message}`;
      notify(`No se pudo pegar el JSON: ${error.message}`);
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
    nodes = []; edges = []; shapes = []; canvas.querySelectorAll('.node, .group-shape').forEach(n => n.remove()); selected = null; nextId = 1;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const startX = Math.max(35, (w - 570) / 2), startY = Math.max(35, (h - 220) / 2);
    const user = addNode('user', startX, startY + 65, { name: 'Usuario final', description: 'Accede desde el navegador' });
    const front = addNode('frontend', startX + 220, startY + 65, { name: 'Frontend web', description: 'Interfaz y experiencia de usuario' });
    const api = addNode('backend', startX + 440, startY + 65, { name: 'API REST', description: 'Autenticación y lógica de negocio' });
    const db = addNode('database', startX + 440, startY + 205, { name: 'PostgreSQL', description: 'Datos de la aplicación' });
    edges = [
      { id: makeId('con'), from: user.id, to: front.id, label: 'HTTPS', connectionType: 'api' },
      { id: makeId('con'), from: front.id, to: api.id, label: 'REST / JSON', connectionType: 'api' },
      { id: makeId('con'), from: api.id, to: db.id, label: 'SQL', connectionType: 'data' },
    ];
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
    return { app: 'ArqSketch', version: 1, nodes, edges, shapes };
  }
  function renderDiagramJson() {
    if (jsonDraftDirty) return;
    diagramJson.value = JSON.stringify(diagramData(), null, 2);
    jsonEditorStatus.textContent = 'Edita el JSON o pega uno para cargar un diagrama.';
  }
  function exportJson() {
    download('arquitectura-aplicacion.json', JSON.stringify(diagramData(), null, 2), 'application/json');
    notify('Diagrama exportado como JSON.');
  }
  async function copyDiagramJson() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('El navegador no permite acceder al portapapeles en este contexto.');
      await navigator.clipboard.writeText(diagramJson.value);
      notify('JSON copiado al portapapeles.');
    } catch (error) {
      notify(`No se pudo copiar el JSON: ${error.message}`);
    }
  }
  function exportSvg() {
    if (!nodes.length && !shapes.length) { notify('Añade al menos un componente o grupo antes de exportar.'); return; }
    const bounds = [
      ...nodes.map(node => ({ x: node.x, y: node.y, width: document.getElementById(node.id)?.offsetWidth || node.width || 228, height: document.getElementById(node.id)?.offsetHeight || node.height || 110 })),
      ...shapes.map(shape => ({ x: shape.x, y: shape.y, width: shape.width, height: shape.height })),
    ];
    const pad = 35;
    const maxX = Math.max(...bounds.map(item => item.x + item.width)) + pad;
    const maxY = Math.max(...bounds.map(item => item.y + item.height)) + pad;
    const minX = Math.min(...bounds.map(item => item.x)) - pad, minY = Math.min(...bounds.map(item => item.y)) - pad;
    const width = maxX - minX, height = maxY - minY;
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`, `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#0c1220"/>`];
    shapes.forEach(shape => {
      const geometry = shape.type === 'ellipse'
        ? `<ellipse cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" rx="${shape.width / 2}" ry="${shape.height / 2}"/>`
        : `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="16"/>`;
      parts.push(`<g fill="${shape.color}24" stroke="${shape.color}" stroke-width="2" stroke-dasharray="8 6">${geometry}</g>`);
      parts.push(`<text x="${shape.x + shape.width / 2}" y="${shape.y + 24}" text-anchor="middle" fill="${shape.color}" font-size="14" font-weight="bold">${escapeXml(shape.title || 'Grupo')}</text>`);
    });
    edges.forEach(e => {
      const a = getDiagramEntity(e.from), b = getDiagramEntity(e.to); if (!a || !b) return;
      const ac = nodeCenter(a), bc = nodeCenter(b);
      const edgeType = e.connectionType || 'general';
      const edgeColor = EDGE_TYPE_COLORS[edgeType] || EDGE_TYPE_COLORS.general;
      const style = e.style === 'dashed' ? 'stroke-dasharray="9 6"' : e.style === 'dotted' ? 'stroke-dasharray="1 6" stroke-linecap="round"' : '';
      const marker = `url(#arr-${edgeType})`;
      const startMarker = e.direction === 'reverse' || e.direction === 'both' ? `marker-start="${marker}"` : '';
      const endMarker = e.direction === 'forward' || e.direction === 'both' || !e.direction ? `marker-end="${marker}"` : '';
      parts.push(`<path d="M ${ac.x} ${ac.y} L ${bc.x} ${bc.y}" stroke="${edgeColor}" stroke-width="2" fill="none" ${style} ${startMarker} ${endMarker}/>`);
      const typeLabel = edgeType !== 'general' ? EDGE_TYPE_LABELS[edgeType] : '';
      const label = [typeLabel, e.label].filter(Boolean).join(' · ');
      if (label) parts.push(`<text x="${(ac.x+bc.x)/2}" y="${(ac.y+bc.y)/2-8}" text-anchor="middle" fill="#f3f5ff" stroke="#0c1220" stroke-width="5" stroke-linejoin="round" paint-order="stroke" font-size="12" font-weight="700">${escapeXml(label)}</text>`);
    });
    const markerDefs = Object.entries(EDGE_TYPE_COLORS)
      .map(([type, color]) => `<marker id="arr-${type}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto-start-reverse"><path d="M0,0 L0,6 L8,3 z" fill="${color}"/></marker>`)
      .join('');
    parts.push(`<defs>${markerDefs}</defs>`);
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
    if ((nodes.length || shapes.length) && !confirm('¿Crear un diagrama nuevo? Se borrará el diagrama actual del navegador.')) return;
    recordHistory();
    nodes = []; edges = []; shapes = []; selected = null; nextId = 1;
    zoom = 1; panX = 0; panY = 0;
    canvas.querySelectorAll('.node, .group-shape').forEach(n => n.remove()); applyTransform(); renderEdges(); updateCounts(); selectItem(null); recordHistory(); saveState(); notify('Lienzo nuevo listo.');
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
    const addingEndpoint = button.dataset.action === 'add-endpoint' && node.details.endpoints.length < 100;
    if (addingEndpoint) {
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
    if (addingEndpoint) {
      componentDetails.querySelector('.endpoint-card:last-child')?.scrollIntoView({ block: 'nearest' });
    }
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
  for (const [control, property] of [
    [edgeDirection, 'direction'],
    [edgeStyle, 'style'],
    [edgeConnectionType, 'connectionType'],
  ]) {
    control.addEventListener('change', () => {
      const edge = selected?.kind === 'edge' && edges.find(candidate => candidate.id === selected.id);
      if (!edge) return;
      recordHistory();
      edge[property] = control.value;
      renderEdges();
      saveState();
      recordHistory();
    });
  }
  shapeTitle.addEventListener('input', () => {
    const shape = selected?.kind === 'shape' && getShape(selected.id);
    if (shape) { shape.title = shapeTitle.value; renderShape(shape); saveState(); scheduleHistoryRecord(); }
  });
  shapeType.addEventListener('change', () => {
    const shape = selected?.kind === 'shape' && getShape(selected.id);
    if (!shape) return;
    recordHistory();
    shape.type = shapeType.value;
    renderShape(shape);
    saveState();
    recordHistory();
  });
  shapeColor.addEventListener('input', () => {
    const shape = selected?.kind === 'shape' && getShape(selected.id);
    if (shape) { shape.color = shapeColor.value; renderShape(shape); saveState(); scheduleHistoryRecord(); }
  });
  document.getElementById('connectModeBtn').addEventListener('click', () => setConnectMode(!connectMode));
  document.getElementById('addShapeBtn').addEventListener('click', addShape);
  document.getElementById('deleteBtn').addEventListener('click', deleteSelected);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
  document.getElementById('deleteEdgePropertyBtn').addEventListener('click', deleteSelected);
  document.getElementById('deleteShapeBtn').addEventListener('click', deleteSelected);
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
  document.getElementById('pasteDiagramJsonBtn').addEventListener('click', pasteDiagramJson);
  document.getElementById('applyDiagramJsonBtn').addEventListener('click', applyDiagramJson);
  diagramJson.addEventListener('input', () => {
    jsonDraftDirty = true;
    jsonEditorStatus.textContent = 'Hay cambios JSON sin aplicar. Pulsa “Aplicar JSON” para validar y cargar el diagrama.';
  });
  diagramJson.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      applyDiagramJson();
    }
  });
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
    if (event.button !== 0 || connectMode || event.target.closest('.node, .group-shape, .connection, button, input, textarea')) return;
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
        const hits = [...nodes, ...shapes].filter(entity => {
          const rect = entityElement(entity)?.getBoundingClientRect();
          return rect && rect.right >= bounds.left && rect.left <= bounds.right &&
            rect.bottom >= bounds.top && rect.top <= bounds.bottom;
        }).map(node => node.id);
        const selection = new Set(additive ? selectedEntityIds : []);
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
    if (!event.target.closest('.node, .group-shape, .connection, button, input, textarea')) selectItem(null);
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
    if (!nodes.length && !shapes.length) {
      zoom = 1;
      panX = 0;
      panY = 0;
      applyTransform();
      return;
    }
    const padding = 48;
    const bounds = [
      ...nodes.map(node => ({
        x: node.x,
        y: node.y,
        right: node.x + (document.getElementById(node.id)?.offsetWidth || node.width || 228),
        bottom: node.y + (document.getElementById(node.id)?.offsetHeight || node.height || 130),
      })),
      ...shapes.map(shape => ({
        x: shape.x,
        y: shape.y,
        right: shape.x + shape.width,
        bottom: shape.y + shape.height,
      })),
    ];
    const minX = Math.min(...bounds.map(item => item.x));
    const minY = Math.min(...bounds.map(item => item.y));
    const maxX = Math.max(...bounds.map(item => item.right));
    const maxY = Math.max(...bounds.map(item => item.bottom));
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