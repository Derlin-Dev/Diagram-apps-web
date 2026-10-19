(() => {
  const canvas = document.getElementById('canvas');
  const wrap = document.getElementById('canvasWrap');
  const appShell = document.querySelector('.app-shell');
  const toggleLibraryBtn = document.getElementById('toggleLibraryBtn');
  const togglePropertiesBtn = document.getElementById('togglePropertiesBtn');
  const svg = document.getElementById('connectionsSvg');
  const connectionControlsSvg = document.getElementById('connectionControlsSvg');
  const connectionLineStyleSelect = document.getElementById('connectionLineStyle');
  const emptyState = document.getElementById('emptyState');
  const noSelection = document.getElementById('noSelection');
  const propertiesScroll = document.getElementById('propertiesScroll');
  const propertyForm = document.getElementById('propertyForm');
  const edgePropertyForm = document.getElementById('edgePropertyForm');
  const shapePropertyForm = document.getElementById('shapePropertyForm');
  const shapeTitle = document.getElementById('shapeTitle');
  const shapeCategory = document.getElementById('shapeCategory');
  const layerExplainerIcon = document.getElementById('layerExplainerIcon');
  const layerExplainerTitle = document.getElementById('layerExplainerTitle');
  const layerExplainerDescription = document.getElementById('layerExplainerDescription');
  const layerExplainerExample = document.getElementById('layerExplainerExample');
  const layerGuideDialog = document.getElementById('layerGuideDialog');
  const componentResourceCatalog = document.getElementById('componentResourceCatalog');
  const componentResourceType = document.getElementById('componentResourceType');
  const applyResourceBtn = document.getElementById('applyResourceBtn');
  const shapeType = document.getElementById('shapeType');
  const shapeColor = document.getElementById('shapeColor');
  const toggleGroupCollapseBtn = document.getElementById('toggleGroupCollapseBtn');
  const diagramViewFilter = document.getElementById('diagramViewFilter');
  const legendEntries = document.getElementById('legendEntries');
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
  const diagramSearch = document.getElementById('diagramSearch');
  const diagramSearchResults = document.getElementById('diagramSearchResults');
  const alignmentGuides = document.getElementById('alignmentGuides');
  const miniMap = document.getElementById('miniMap');

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
  const MIN_ZOOM = 0.15;
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
    security: { label: 'Redes y Seguridad', symbol: '⬡', defaultName: 'Redes y Seguridad', desc: 'Controles de red y protección de la arquitectura' },
    user: { label: 'Usuario', symbol: '♙', defaultName: 'Usuario', desc: 'Actor que utiliza el sistema' }
  };
  const SHAPE_CATEGORY_LABELS = {
    general: 'Grupo',
    domain: 'Dominio',
    environment: 'Entorno',
    'trust-zone': 'Zona de confianza',
  };
  const SHAPE_CATEGORY_HELP = {
    general: {
      title: 'Grupo general',
      icon: '▱',
      description: 'Organiza componentes sin marcar un límite de negocio, entorno o seguridad.',
      example: 'Ejemplo: agrupar elementos relacionados para moverlos o plegarlos juntos.',
    },
    domain: {
      title: 'Dominio funcional',
      icon: '▰',
      description: 'Señala una capacidad o área del negocio a la que pertenecen los componentes.',
      example: 'Ejemplo: Facturación, Inventario o Gestión de usuarios.',
    },
    environment: {
      title: 'Entorno de despliegue',
      icon: '▤',
      description: 'Separa los componentes según el ambiente donde se ejecutan o prueban.',
      example: 'Ejemplo: Desarrollo, Pruebas o Producción.',
    },
    'trust-zone': {
      title: 'Zona de confianza',
      icon: '⬡',
      description: 'Marca un límite de seguridad. Las conexiones que entran o salen cuentan como externas.',
      example: 'Ejemplo: Red privada, zona pública o perímetro protegido por un firewall.',
    },
  };
  const RESOURCE_CATALOGS = {
    cloud: [
      { kind: 'object-storage', type: 'cloud', name: 'Almacenamiento de objetos', description: 'Almacena archivos y objetos en la nube', icon: 'storage' },
      { kind: 'serverless-function', type: 'cloud', name: 'Función serverless', description: 'Ejecuta código bajo demanda', icon: 'settings' },
      { kind: 'virtual-machine', type: 'cloud', name: 'Máquina virtual', description: 'Instancia de cómputo en la nube', icon: 'server' },
      { kind: 'container-platform', type: 'cloud', name: 'Plataforma de contenedores', description: 'Ejecuta y orquesta contenedores', icon: 'cloud' },
      { kind: 'managed-database', type: 'database', name: 'Base de datos administrada', description: 'Base de datos gestionada por el proveedor cloud', icon: 'database' },
      { kind: 'message-queue', type: 'service', name: 'Cola de mensajes', description: 'Mensajería asíncrona entre servicios', icon: 'flow' },
      { kind: 'load-balancer', type: 'cloud', name: 'Balanceador de carga', description: 'Distribuye el tráfico entre instancias', icon: 'globe' },
    ],
    network: [
      { kind: 'route-table', type: 'security', name: 'Tabla de rutas', description: 'Define rutas entre redes y subredes', icon: 'globe' },
      { kind: 'firewall', type: 'security', name: 'Firewall / WAF', description: 'Filtra tráfico y protege aplicaciones', icon: 'security' },
      { kind: 'subnet', type: 'security', name: 'Subred', description: 'Segmento de red público o privado', icon: 'globe' },
      { kind: 'network-gateway', type: 'security', name: 'Gateway / VPN', description: 'Conecta redes de forma controlada', icon: 'security' },
      { kind: 'virtual-machine', type: 'cloud', name: 'Máquina virtual', description: 'Servidor conectado a esta red', icon: 'server' },
      { kind: 'load-balancer', type: 'cloud', name: 'Balanceador de carga', description: 'Distribuye tráfico hacia las máquinas', icon: 'globe' },
      { kind: 'dns-zone', type: 'security', name: 'Zona DNS', description: 'Administra nombres y registros de red', icon: 'globe' },
    ],
  };
  const RESOURCE_KIND_LABELS = Object.fromEntries(Object.values(RESOURCE_CATALOGS)
    .flat().map(resource => [resource.kind, resource.name]));
  let nodes = [];
  let edges = [];
  let shapes = [];
  let legend = [];
  let selected = null;
  let selectedEntityIds = new Set();
  let selectedEdgeIds = new Set();
  let copiedSelection = null;
  let contextTarget = null;
  let connectMode = false;
  let connectFrom = null;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let connectionLineStyle = 'curved';
  let diagramViewFilterValue = 'all';
  let snapToGrid = false;
  let nextId = 1;
  let toastTimer;
  let iconSearchTimer;
  let iconSearchController;
  let history = [];
  let historyIndex = -1;
  let historyTimer;
  let historySuspended = false;
  let jsonDraftDirty = false;
  let presentationSteps = [];
  let presentationIndex = -1;
  let presentationActive = false;
  let presentationView = null;
  let presentationTransitionTimer = null;
  let backgroundPointerMoved = false;
  let panelWidths = { ...DEFAULT_PANEL_WIDTHS };
  let libraryHidden = false;
  let propertiesHidden = window.matchMedia('(max-width: 1000px)').matches;
  let diagramLegendCollapsed = false;
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
  function applyLibraryVisibility() {
    appShell.classList.toggle('library-hidden', libraryHidden);
    toggleLibraryBtn.textContent = libraryHidden ? '◨' : '◧';
    toggleLibraryBtn.title = libraryHidden ? 'Mostrar biblioteca' : 'Ocultar biblioteca';
    toggleLibraryBtn.setAttribute('aria-label', toggleLibraryBtn.title);
    toggleLibraryBtn.setAttribute('aria-pressed', String(libraryHidden));
  }
  function loadLibraryVisibility() {
    try {
      libraryHidden = localStorage.getItem('arqsketch-library-hidden') === 'true';
    } catch (error) {
      notify(`No se pudo restaurar la visibilidad de la biblioteca: ${error.message}`);
    }
    applyLibraryVisibility();
  }
  function toggleLibraryVisibility() {
    libraryHidden = !libraryHidden;
    applyLibraryVisibility();
    try {
      localStorage.setItem('arqsketch-library-hidden', String(libraryHidden));
    } catch (error) {
      notify(`No se pudo guardar la visibilidad de la biblioteca: ${error.message}`);
    }
  }
  function applyPropertiesVisibility() {
    const compact = window.matchMedia('(max-width: 1000px)').matches;
    appShell.classList.toggle('properties-hidden', propertiesHidden && !compact);
    appShell.classList.toggle('properties-open', !propertiesHidden && compact);
    const visible = !propertiesHidden;
    togglePropertiesBtn.setAttribute('aria-pressed', String(visible));
    togglePropertiesBtn.title = visible ? 'Ocultar propiedades' : 'Mostrar propiedades';
    togglePropertiesBtn.setAttribute('aria-label', togglePropertiesBtn.title);
  }
  function togglePropertiesVisibility() {
    propertiesHidden = !propertiesHidden;
    applyPropertiesVisibility();
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
    return JSON.stringify({ nodes, edges, shapes, legend, nextId });
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
    legend = data.legend || [];
    nextId = data.nextId;
    selected = null;
    connectFrom = null;
    canvas.querySelectorAll('.node').forEach(node => node.remove());
    canvas.querySelectorAll('.group-shape').forEach(shape => shape.remove());
    shapes.forEach(renderShape);
    nodes.forEach(renderNode);
    inferGroupMemberships();
    renderLegend(); renderEdges();
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
      ...(opts.resourceKind ? { resourceKind: opts.resourceKind } : {}),
      ...(opts.resourceCatalog ? { resourceCatalog: opts.resourceCatalog } : {}),
      ...(opts.resourceProvider ? { resourceProvider: opts.resourceProvider } : {}),
      ...(opts.resourceService ? { resourceService: opts.resourceService } : {}),
      ...(opts.parentGroupId ? { parentGroupId: opts.parentGroupId } : {}),
    };
    if (opts.width !== undefined) node.width = opts.width;
    if (opts.height !== undefined) node.height = opts.height;
    nodes.push(node);
    renderNode(node);
    updateCounts();
    if (opts.select !== false) selectItem({ kind: 'node', id: node.id });
    return node;
  }
  function addShape(clientX, clientY) {
    if (shapes.length >= 300) {
      notify('El diagrama alcanzó el límite de 300 grupos.');
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const screenX = Number.isFinite(clientX) ? clientX : rect.left + rect.width / 2;
    const screenY = Number.isFinite(clientY) ? clientY : rect.top + rect.height / 2;
    const shape = {
      id: makeId('grp'),
      type: 'rectangle',
      category: 'general',
      title: 'Nuevo grupo',
      color: '#65bfff',
      collapsed: false,
      x: Math.max(-100000, Math.min(100000, (screenX - rect.left - panX) / zoom - 210)),
      y: Math.max(-100000, Math.min(100000, (screenY - rect.top - panY) / zoom - 145)),
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
  function updateLayerExplainer(category) {
    const help = SHAPE_CATEGORY_HELP[category] || SHAPE_CATEGORY_HELP.general;
    layerExplainerIcon.textContent = help.icon;
    layerExplainerTitle.textContent = help.title;
    layerExplainerDescription.textContent = help.description;
    layerExplainerExample.textContent = help.example;
    document.getElementById('layerExplainer').dataset.category = category;
  }
  function getShape(id) { return shapes.find(shape => shape.id === id); }
  function populateResourceTypes(select, catalog, selectedKind = '') {
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = catalog ? 'Selecciona un recurso' : 'Selecciona un catálogo';
    select.appendChild(placeholder);
    (RESOURCE_CATALOGS[catalog] || []).forEach(resource => {
      const option = document.createElement('option');
      option.value = resource.kind;
      option.textContent = resource.name;
      select.appendChild(option);
    });
    select.value = selectedKind;
    select.disabled = !catalog;
  }
  function resourceCatalogForKind(kind, catalog = '') {
    if (catalog && RESOURCE_CATALOGS[catalog]?.some(resource => resource.kind === kind)) return catalog;
    return Object.entries(RESOURCE_CATALOGS)
      .find(([, resources]) => resources.some(resource => resource.kind === kind))?.[0] || '';
  }
  function applyResourceToComponent() {
    const node = selected?.kind === 'node' && getNode(selected.id);
    if (!node) return;
    const resource = RESOURCE_CATALOGS[componentResourceCatalog.value]
      ?.find(item => item.kind === componentResourceType.value);
    if (!resource) {
      notify('Selecciona un catálogo y un tipo de recurso válidos.');
      return;
    }
    const currentProvider = node.resourceProvider || node.details.provider || '';
    recordHistory();
    node.type = resource.type;
    node.name = resource.name;
    node.description = resource.description;
    node.icon = resource.icon;
    node.resourceKind = resource.kind;
    node.resourceCatalog = componentResourceCatalog.value;
    node.resourceService = '';
    delete node.resourceProvider;
    node.details = window.ArqSketchDiagram.createDefaultDetails(resource.type);
    if (currentProvider) {
      if (resource.type === 'cloud') node.details.provider = currentProvider;
      else node.resourceProvider = currentProvider;
    }
    if (resource.type === 'cloud') delete node.resourceProvider;
    nodeType.value = TYPES[node.type].label;
    nodeName.value = node.name;
    nodeDescription.value = node.description;
    renderComponentDetails(node);
    renderNode(node);
    updateSelectedIcon();
    renderIconPicker('');
    renderEdges();
    saveState();
    recordHistory();
    notify(`El componente seleccionado ahora es ${resource.name}.`);
  }
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
      const collapse = document.createElement('button');
      collapse.type = 'button';
      collapse.className = 'group-shape-collapse';
      collapse.addEventListener('click', event => {
        event.stopPropagation();
        shape.collapsed = !shape.collapsed;
        renderShape(shape);
        renderEdges();
        recordHistory();
        saveState();
      });
      const resize = document.createElement('button');
      resize.type = 'button';
      resize.className = 'group-shape-resize';
      resize.title = 'Arrastra para cambiar el tamaño del grupo';
      resize.setAttribute('aria-label', 'Cambiar tamaño del grupo');
      element.append(title, collapse, resize);
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
    element.classList.toggle('collapsed', shape.collapsed === true);
    Object.keys(SHAPE_CATEGORY_LABELS).forEach(category => {
      element.classList.toggle(`category-${category}`, (shape.category || 'general') === category);
    });
    element.style.left = `${shape.x}px`;
    element.style.top = `${shape.y}px`;
    element.style.width = `${shape.collapsed ? 230 : shape.width}px`;
    element.style.height = `${shape.collapsed ? 48 : shape.height}px`;
    element.style.setProperty('--group-color', shape.color);
    element.style.setProperty('--group-fill', `${shape.color}24`);
    const categoryLabel = SHAPE_CATEGORY_LABELS[shape.category] || SHAPE_CATEGORY_LABELS.general;
    element.querySelector('.group-shape-title').textContent = shape.title || 'Grupo';
    element.querySelector('.group-shape-title').dataset.categoryLabel = categoryLabel;
    const collapseButton = element.querySelector('.group-shape-collapse');
    collapseButton.textContent = shape.collapsed ? '+' : '−';
    collapseButton.title = shape.collapsed ? 'Expandir contenedor' : 'Plegar contenedor';
    collapseButton.setAttribute('aria-label', collapseButton.title);
    element.setAttribute('aria-label', `${categoryLabel}: ${shape.title || 'Sin título'}, ${shape.collapsed ? 'plegado' : 'expandido'}`);
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
    el.querySelector('.node-type').textContent = n.resourceKind
      ? `${info.label} · ${RESOURCE_KIND_LABELS[n.resourceKind] || n.resourceKind}`
      : info.label;
    el.querySelector('.node-description').textContent = n.description || 'Sin descripción';
    renderNodeDetails(el.querySelector('.node-details'), n);
    el.title = [n.name, n.description, ...nodeDetailSummary(n)].filter(Boolean).join('\n');
  }
  function nodeDetailSummary(node) {
    const fields = DETAIL_FIELDS[node.type] || [];
    const summary = fields
      .filter(field => node.details?.[field.key])
      .map(field => `${field.label}: ${node.details[field.key]}`);
    if (node.resourceProvider && !node.details?.provider) summary.push(`Proveedor: ${node.resourceProvider}`);
    if (node.resourceService) summary.push(`Servicio: ${node.resourceService}`);
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
    if (node.resourceProvider && !node.details?.provider) appendNodeDetail(container, 'Proveedor', node.resourceProvider);
    if (node.resourceService) appendNodeDetail(container, 'Servicio', node.resourceService);
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
  function entityBounds(entity) {
    const element = entityElement(entity);
    return {
      left: entity.x,
      top: entity.y,
      right: entity.x + (entity.name ? element?.offsetWidth || entity.width || 228 : entity.width),
      bottom: entity.y + (entity.name ? element?.offsetHeight || entity.height || 130 : entity.height),
    };
  }
  function shapeGeometryContains(shape, entity) {
    if (shape.id === entity.id) return false;
    const frame = { left: shape.x, top: shape.y, right: shape.x + shape.width, bottom: shape.y + shape.height };
    const bounds = entityBounds(entity);
    return bounds.left >= frame.left && bounds.top >= frame.top &&
      bounds.right <= frame.right && bounds.bottom <= frame.bottom;
  }
  function shapeContains(shape, entity) {
    if (shape.id === entity.id) return false;
    if (entity.parentGroupId) {
      let parent = getShape(entity.parentGroupId);
      const seen = new Set();
      while (parent && !seen.has(parent.id)) {
        if (parent.id === shape.id) return true;
        seen.add(parent.id);
        parent = getShape(parent.parentGroupId);
      }
      return false;
    }
    return shapeGeometryContains(shape, entity);
  }
  function inferGroupMemberships() {
    [...nodes, ...shapes].forEach(entity => {
      if (entity.parentGroupId) return;
      const parent = shapes
        .filter(shape => shapeGeometryContains(shape, entity) &&
          (entity.name || shape.width * shape.height > entity.width * entity.height))
        .sort((a, b) => a.width * a.height - b.width * b.height)[0];
      if (parent) entity.parentGroupId = parent.id;
    });
  }
  function isHiddenByCollapsedShape(entity) {
    return shapes.some(shape => shape.collapsed && shapeContains(shape, entity));
  }
  function collapsedProxy(entity) {
    const candidates = shapes
      .filter(shape => shape.collapsed && shapeContains(shape, entity) && !isHiddenByCollapsedShape(shape))
      .sort((a, b) => a.width * a.height - b.width * b.height);
    return candidates[0] || entity;
  }
  function edgeIsExternal(edge) {
    const from = getDiagramEntity(edge.from), to = getDiagramEntity(edge.to);
    if (!from || !to) return false;
    if (['service', 'cloud'].includes(from.type) || ['service', 'cloud'].includes(to.type)) return true;
    return shapes.some(shape => shape.category === 'trust-zone' && shapeContains(shape, from) !== shapeContains(shape, to));
  }
  function getViewVisibility() {
    const entityIds = new Set();
    const edgeIds = new Set();
    if (diagramViewFilterValue === 'all') {
      [...nodes, ...shapes].forEach(entity => entityIds.add(entity.id));
      edges.forEach(edge => edgeIds.add(edge.id));
      return { entityIds, edgeIds };
    }
    const seeds = new Set(nodes.filter(node => {
      if (diagramViewFilterValue === 'frontend') return node.type === 'frontend';
      if (diagramViewFilterValue === 'services') return ['backend', 'service', 'security'].includes(node.type);
      if (diagramViewFilterValue === 'storage') return node.type === 'database' ||
        ['object-storage', 'managed-database'].includes(node.resourceKind);
      return false;
    }).map(node => node.id));
    edges.forEach(edge => {
      const relevant = diagramViewFilterValue === 'external'
        ? edgeIsExternal(edge)
        : seeds.has(edge.from) || seeds.has(edge.to);
      if (!relevant) return;
      edgeIds.add(edge.id);
      entityIds.add(edge.from);
      entityIds.add(edge.to);
    });
    seeds.forEach(id => entityIds.add(id));
    shapes.forEach(shape => {
      if ([...entityIds].some(id => {
        const entity = getDiagramEntity(id);
        return entity && shapeContains(shape, entity);
      })) entityIds.add(shape.id);
    });
    return { entityIds, edgeIds };
  }
  function addConnectionHandle(edge, point, label, drag, routePoints) {
    const isWaypoint = drag.startsWith('waypoint:');
    const handle = document.createElementNS('http://www.w3.org/2000/svg', isWaypoint ? 'rect' : 'circle');
    if (isWaypoint) {
      handle.setAttribute('x', point.x - 5);
      handle.setAttribute('y', point.y - 5);
      handle.setAttribute('width', '10');
      handle.setAttribute('height', '10');
      handle.setAttribute('transform', `rotate(45 ${point.x} ${point.y})`);
    } else {
      handle.setAttribute('cx', point.x);
      handle.setAttribute('cy', point.y);
      handle.setAttribute('r', '6');
    }
    handle.setAttribute('class', `connection-handle${drag === 'via' ? ' connection-route-handle' : ' connection-anchor-handle'}${isWaypoint ? ' connection-waypoint-handle' : ''}`);
    handle.setAttribute('role', 'button');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('aria-label', label);
    handle.setAttribute('title', label);
    handle.addEventListener('pointerdown', event => {
      if (drag === 'via') beginEdgeRouteDrag(event, edge, point);
      else if (isWaypoint) beginEdgeWaypointDrag(event, edge, Number(drag.split(':')[1]), routePoints);
      else beginEdgeAnchorDrag(event, edge, drag);
    });
    handle.addEventListener('click', event => event.stopPropagation());
    connectionControlsSvg.appendChild(handle);
  }

  const EDGE_DIRECTIONS = {
    top: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  };

  function orthogonalRoute(sourcePoint, targetPoint, sourceDirection, targetDirection, waypoints = []) {
    const points = [sourcePoint];
    const append = point => {
      const previous = points[points.length - 1];
      if (previous.x !== point.x && previous.y !== point.y) points.push({ x: point.x, y: previous.y });
      if (previous.x !== point.x || previous.y !== point.y) points.push(point);
    };
    if (waypoints.length) {
      waypoints.forEach(append);
      append(targetPoint);
      return points;
    }
    const startStub = {
      x: sourcePoint.x + sourceDirection.x * 24,
      y: sourcePoint.y + sourceDirection.y * 24,
    };
    const endStub = {
      x: targetPoint.x + targetDirection.x * 24,
      y: targetPoint.y + targetDirection.y * 24,
    };
    append(startStub);
    if (sourceDirection.y === 0 && targetDirection.y === 0) {
      const middleX = (startStub.x + endStub.x) / 2;
      append({ x: middleX, y: startStub.y });
      append({ x: middleX, y: endStub.y });
    } else if (sourceDirection.x === 0 && targetDirection.x === 0) {
      const middleY = (startStub.y + endStub.y) / 2;
      append({ x: startStub.x, y: middleY });
      append({ x: endStub.x, y: middleY });
    } else {
      append({ x: endStub.x, y: startStub.y });
    }
    append(endStub);
    append(targetPoint);
    return points;
  }

  function edgeRoute(edge, sourcePoint, targetPoint, sourceAnchor, targetAnchor) {
    return orthogonalRoute(
      sourcePoint,
      targetPoint,
      EDGE_DIRECTIONS[sourceAnchor.side],
      EDGE_DIRECTIONS[targetAnchor.side],
      edge.waypoints || [],
    );
  }

  function polylineMidpoint(points) {
    const lengths = points.slice(1).map((point, index) =>
      Math.hypot(point.x - points[index].x, point.y - points[index].y));
    let remaining = lengths.reduce((sum, length) => sum + length, 0) / 2;
    for (let index = 0; index < lengths.length; index++) {
      if (remaining <= lengths[index]) {
        const start = points[index], end = points[index + 1];
        const ratio = lengths[index] ? remaining / lengths[index] : 0;
        return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
      }
      remaining -= lengths[index];
    }
    return points[0];
  }

  function polylinePointAt(points, fraction) {
    const lengths = points.slice(1).map((point, index) =>
      Math.hypot(point.x - points[index].x, point.y - points[index].y));
    let remaining = lengths.reduce((sum, length) => sum + length, 0) * fraction;
    for (let index = 0; index < lengths.length; index++) {
      if (remaining <= lengths[index]) {
        const start = points[index], end = points[index + 1];
        const ratio = lengths[index] ? remaining / lengths[index] : 0;
        return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
      }
      remaining -= lengths[index];
    }
    return points[points.length - 1];
  }

  function straightEditWaypoint(edge, routePoints) {
    if (edge.waypoints?.length) {
      const index = Math.floor((edge.waypoints.length - 1) / 2);
      return { index, point: edge.waypoints[index] };
    }
    return { index: 0, point: polylinePointAt(routePoints, .5) };
  }

  function addDirectionArrow(tip, fromPoint, color, dimmed = false) {
    const dx = tip.x - fromPoint.x;
    const dy = tip.y - fromPoint.y;
    const length = Math.hypot(dx, dy);
    if (!length) return;
    const ux = dx / length, uy = dy / length;
    const baseX = tip.x - ux * 10;
    const baseY = tip.y - uy * 10;
    const perpendicularX = -uy * 5;
    const perpendicularY = ux * 5;
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', `M ${tip.x} ${tip.y} L ${baseX + perpendicularX} ${baseY + perpendicularY} L ${baseX - perpendicularX} ${baseY - perpendicularY} Z`);
    arrow.setAttribute('class', 'connection-direction-arrow');
    arrow.classList.toggle('focus-dimmed', dimmed);
    arrow.setAttribute('fill', color);
    arrow.setAttribute('aria-hidden', 'true');
    arrow.style.pointerEvents = 'none';
    connectionControlsSvg.appendChild(arrow);
  }

  function connectionLabelText(edge) {
    const type = edge.connectionType && edge.connectionType !== 'general'
      ? EDGE_TYPE_LABELS[edge.connectionType]
      : '';
    return [type, edge.label].filter(Boolean).join(' · ');
  }
  function labelPositionFor(edge, label, midpoint, occupied, blocked) {
    const width = Math.max(52, label.length * 7 + 18);
    if (edge.labelPosition) {
      const point = edge.labelPosition;
      occupied.push({ left: point.x - width / 2, right: point.x + width / 2, top: point.y - 12, bottom: point.y + 12 });
      return point;
    }
    const offsets = [[0, 0], [0, -24], [0, 24], [0, -44], [0, 44], [-32, 0], [32, 0], [-42, -22], [42, -22], [-42, 22], [42, 22]];
    const boxFor = point => ({ left: point.x - width / 2, right: point.x + width / 2, top: point.y - 12, bottom: point.y + 12 });
    const score = point => {
      const box = { left: point.x - width / 2, right: point.x + width / 2, top: point.y - 12, bottom: point.y + 12 };
      return blocked.filter(other => box.left < other.right + 6 && box.right > other.left - 6 &&
        box.top < other.bottom + 6 && box.bottom > other.top - 6).length * 2 +
        occupied.filter(other => box.left < other.right + 8 && box.right > other.left - 8 &&
          box.top < other.bottom + 6 && box.bottom > other.top - 6).length;
    };
    let point = midpoint, bestScore = score(midpoint);
    if (bestScore > 0) {
      search: {
        for (const [x, y] of offsets.slice(1)) {
          const candidate = { x: midpoint.x + x, y: midpoint.y + y };
          const candidateScore = score(candidate);
          if (candidateScore < bestScore) { point = candidate; bestScore = candidateScore; }
          if (candidateScore === 0) { point = candidate; break search; }
        }
        for (let radius = 60; radius <= 360; radius += 30) {
          for (let offset = -radius; offset <= radius; offset += 30) {
            const candidates = [
              { x: midpoint.x + offset, y: midpoint.y - radius },
              { x: midpoint.x + offset, y: midpoint.y + radius },
              { x: midpoint.x - radius, y: midpoint.y + offset },
              { x: midpoint.x + radius, y: midpoint.y + offset },
            ];
            for (const candidate of candidates) {
              const candidateScore = score(candidate);
              if (candidateScore < bestScore) { point = candidate; bestScore = candidateScore; }
              if (candidateScore === 0) { point = candidate; break search; }
            }
          }
        }
      }
    }
    occupied.push(boxFor(point));
    return point;
  }
  function renderLegend() {
    if (!legendEntries) return;
    legendEntries.replaceChildren();
    legend.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'legend-entry-editor';
      const color = document.createElement('input');
      color.type = 'color';
      color.value = entry.color;
      color.setAttribute('aria-label', `Color de ${entry.label}`);
      const label = document.createElement('input');
      label.maxLength = 80;
      label.value = entry.label;
      label.placeholder = 'Nombre';
      label.setAttribute('aria-label', 'Nombre de leyenda');
      const description = document.createElement('input');
      description.maxLength = 160;
      description.value = entry.description;
      description.placeholder = 'Nota o límite';
      description.setAttribute('aria-label', 'Descripción de leyenda');
      const update = () => {
        recordHistory();
        entry.color = color.value;
        entry.label = label.value.trim() || 'Nueva entrada';
        entry.description = description.value.trim();
        renderLegend();
        saveState();
        recordHistory();
      };
      [color, label, description].forEach(input => input.addEventListener('change', update));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = 'Eliminar entrada de leyenda';
      remove.setAttribute('aria-label', remove.title);
      remove.addEventListener('click', () => {
        recordHistory();
        legend.splice(index, 1);
        renderLegend();
        saveState();
        recordHistory();
      });
      row.append(color, label, description, remove);
      legendEntries.appendChild(row);
    });
    renderDiagramLegend();
    renderMiniMap();
  }
  function legendItems() {
    const connectionTypes = [...new Set(edges.map(edge => edge.connectionType || 'general'))];
    return [
      ...connectionTypes.map(type => ({
        label: EDGE_TYPE_LABELS[type] || 'General',
        color: EDGE_TYPE_COLORS[type] || EDGE_TYPE_COLORS.general,
        description: 'Conexión',
      })),
      ...shapes.filter(shape => shape.category && shape.category !== 'general').map(shape => ({
        label: `${shape.title || SHAPE_CATEGORY_LABELS[shape.category]} · ${SHAPE_CATEGORY_LABELS[shape.category]}`,
        color: shape.color,
        description: shape.category === 'trust-zone'
          ? 'Las conexiones que cruzan el límite se consideran externas'
          : shape.category === 'environment'
            ? 'Entorno de despliegue'
            : 'Límite de dominio',
      })),
      ...legend,
    ];
  }
  function renderDiagramLegend() {
    const root = document.getElementById('diagramLegend');
    if (!root) return;
    root.replaceChildren();
    const items = legendItems();
    root.hidden = !items.length;
    if (!items.length) return;
    root.classList.toggle('is-collapsed', diagramLegendCollapsed);
    const heading = document.createElement('div');
    heading.className = 'diagram-legend-heading';
    const title = document.createElement('strong');
    title.textContent = 'Leyenda';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'diagram-legend-toggle';
    toggle.textContent = diagramLegendCollapsed ? 'Mostrar' : 'Ocultar';
    toggle.setAttribute('aria-expanded', String(!diagramLegendCollapsed));
    toggle.setAttribute('aria-label', diagramLegendCollapsed ? 'Mostrar leyenda' : 'Ocultar leyenda');
    toggle.addEventListener('click', () => {
      diagramLegendCollapsed = !diagramLegendCollapsed;
      renderDiagramLegend();
    });
    heading.append(title, toggle);
    root.appendChild(heading);
    const content = document.createElement('div');
    content.className = 'diagram-legend-content';
    content.hidden = diagramLegendCollapsed;
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'diagram-legend-item';
      const swatch = document.createElement('i');
      swatch.style.backgroundColor = item.color;
      const label = document.createElement('span');
      label.textContent = item.description ? `${item.label} · ${item.description}` : item.label;
      row.append(swatch, label);
      content.appendChild(row);
    });
    root.appendChild(content);
  }
  function beginEdgeLabelDrag(event, edge, initialPosition) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectItem({ kind: 'edge', id: edge.id });
    recordHistory();
    const bounds = wrap.getBoundingClientRect();
    const startX = event.clientX, startY = event.clientY;
    const grabOffsetX = initialPosition.x - (startX - bounds.left - panX) / zoom;
    const grabOffsetY = initialPosition.y - (startY - bounds.top - panY) / zoom;
    let moved = false;
    const move = moveEvent => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      moved ||= Math.abs(dx) + Math.abs(dy) > 2;
      if (!moved) return;
      edge.labelPosition = {
        x: Math.round((moveEvent.clientX - bounds.left - panX) / zoom + grabOffsetX),
        y: Math.round((moveEvent.clientY - bounds.top - panY) / zoom + grabOffsetY),
      };
      renderEdges();
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      if (moved) { recordHistory(); saveState(); }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish, { once: true });
    window.addEventListener('pointercancel', finish, { once: true });
  }

  function renderEdges() {
    svg.innerHTML = '<defs></defs>';
    connectionControlsSvg.replaceChildren();
    const visibility = getViewVisibility();
    const selectedGroup = selected?.kind === 'shape' ? getShape(selected.id) : null;
    const focusedNodeIds = selected?.kind === 'node'
      ? new Set([selected.id])
      : selectedGroup ? new Set() : null;
    const focusedShapeIds = focusedNodeIds ? new Set() : null;
    if (selected?.kind === 'node' && focusedNodeIds) {
      edges.forEach(edge => {
        const relatedId = edge.from === selected.id
          ? edge.to
          : edge.to === selected.id ? edge.from : null;
        if (!relatedId) return;
        const relatedNode = getNode(relatedId);
        const relatedShape = getShape(relatedId);
        if (relatedNode) focusedNodeIds.add(relatedNode.id);
        if (relatedShape) {
          focusedShapeIds.add(relatedShape.id);
          nodes.filter(node => shapeContains(relatedShape, node))
            .forEach(node => focusedNodeIds.add(node.id));
          shapes.filter(shape => shapeContains(relatedShape, shape))
            .forEach(shape => focusedShapeIds.add(shape.id));
        }
      });
    } else if (selectedGroup) {
      focusedShapeIds.add(selectedGroup.id);
      nodes.filter(node => shapeContains(selectedGroup, node))
        .forEach(node => focusedNodeIds?.add(node.id));
      shapes.filter(shape => shapeContains(selectedGroup, shape))
        .forEach(shape => focusedShapeIds.add(shape.id));
    }
    nodes.forEach(node => {
      const element = entityElement(node);
      if (!element) return;
      const visible = visibility.entityIds.has(node.id) && !isHiddenByCollapsedShape(node) &&
        isPresentationEntityVisible(node.id);
      element.hidden = !visible;
      element.classList.toggle('view-context', visible && !focusedNodeIds?.has(node.id) &&
        !edges.some(edge => visibility.edgeIds.has(edge.id) && (edge.from === node.id || edge.to === node.id)));
      element.classList.toggle('focus-dimmed', visible && focusedNodeIds && !focusedNodeIds.has(node.id));
    });
    shapes.forEach(shape => {
      const element = entityElement(shape);
      if (!element) return;
      const visible = visibility.entityIds.has(shape.id) && !isHiddenByCollapsedShape(shape) &&
        isPresentationEntityVisible(shape.id);
      element.hidden = !visible;
      element.classList.toggle('focus-dimmed', visible && focusedNodeIds &&
        !focusedShapeIds.has(shape.id) &&
        ![...focusedNodeIds].some(id => {
          const node = getNode(id);
          return node && shapeContains(shape, node);
        }));
    });
    const occupiedLabels = [];
    const blockers = nodes.map(entityBounds);
    edges.forEach((e, i) => {
      if (!visibility.edgeIds.has(e.id) || !isPresentationEntityVisible(e.from) ||
          !isPresentationEntityVisible(e.to)) return;
      const originalA = getDiagramEntity(e.from), originalB = getDiagramEntity(e.to);
      if (!originalA || !originalB) return;
      const a = collapsedProxy(originalA), b = collapsedProxy(originalB);
      if (a.id === b.id) return;
      const ac = nodeCenter(a), bc = nodeCenter(b);
      const aElement = entityElement(a);
      const bElement = entityElement(b);
      const dx = bc.x - ac.x, dy = bc.y - ac.y;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      const sourceAnchor = a.id === originalA.id && e.fromAnchor || {
        side: horizontal ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top'),
        offset: 0.5,
      };
      const targetAnchor = b.id === originalB.id && e.toAnchor || {
        side: horizontal ? (dx >= 0 ? 'left' : 'right') : (dy >= 0 ? 'top' : 'bottom'),
        offset: 0.5,
      };
      const sourcePoint = anchorPoint(a, aElement, sourceAnchor);
      const targetPoint = anchorPoint(b, bElement, targetAnchor);
      const { x: sx, y: sy } = sourcePoint;
      const { x: ex, y: ey } = targetPoint;
      const bend = Math.max(35, Math.hypot(ex - sx, ey - sy) * .42);
      const sourceDirection = EDGE_DIRECTIONS[sourceAnchor.side];
      const targetDirection = EDGE_DIRECTIONS[targetAnchor.side];
      const c1x = sx + sourceDirection.x * bend;
      const c1y = sy + sourceDirection.y * bend;
      const c2x = ex + targetDirection.x * bend;
      const c2y = ey + targetDirection.y * bend;
      const chordMidpoint = { x: (sx + ex) / 2, y: (sy + ey) / 2 };
      const curveControl = e.via
        ? { x: chordMidpoint.x + 2 * e.via.x, y: chordMidpoint.y + 2 * e.via.y }
        : null;
      const curveMidpoint = e.via
        ? { x: chordMidpoint.x + e.via.x, y: chordMidpoint.y + e.via.y }
        : {
            x: (sx + 3 * c1x + 3 * c2x + ex) / 8,
            y: (sy + 3 * c1y + 3 * c2y + ey) / 8,
          };
      const routePoints = connectionLineStyle === 'straight'
        ? edgeRoute(
            a.id === originalA.id && b.id === originalB.id ? e : { ...e, waypoints: [] },
            sourcePoint,
            targetPoint,
            sourceAnchor,
            targetAnchor,
          )
        : [];
      const d = connectionLineStyle === 'straight'
        ? `M ${routePoints.map(point => `${point.x} ${point.y}`).join(' L ')}`
        : e.via
          ? `M ${sx} ${sy} Q ${chordMidpoint.x + 2 * e.via.x} ${chordMidpoint.y + 2 * e.via.y} ${ex} ${ey}`
          : `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
      const selectedEdge = selectedEdgeIds.has(e.id) || (selected?.kind === 'edge' && selected.id === e.id);
      const endpointInFocus = id => focusedNodeIds?.has(id) || focusedShapeIds?.has(id);
      const relatedEdge = !selectedEdge && (selectedGroup
        ? endpointInFocus(e.from) && endpointInFocus(e.to)
        : ['node', 'shape'].includes(selected?.kind) &&
          (e.from === selected.id || e.to === selected.id));
      const unrelatedEdge = Boolean(focusedNodeIds && (selectedGroup
        ? !endpointInFocus(e.from) || !endpointInFocus(e.to)
        : e.from !== selected.id && e.to !== selected.id));
      const edgeColor = selectedEdge ? '#a99dff' : EDGE_TYPE_COLORS[e.connectionType || 'general'];
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', `connection type-${e.connectionType || 'general'} style-${e.style || 'solid'}${selectedEdge ? ' selected' : relatedEdge ? ' related' : ''}${unrelatedEdge ? ' focus-dimmed' : ''}`);
      path.dataset.edgeId = e.id;
      path.style.stroke = edgeColor;
      if (relatedEdge) path.style.filter = `drop-shadow(0 0 4px ${edgeColor})`;
      if (e.style === 'dashed') path.style.strokeDasharray = '9 6';
      if (e.style === 'dotted') {
        path.style.strokeDasharray = '1 6';
        path.style.strokeLinecap = 'round';
      }
      path.style.pointerEvents = 'stroke';
      path.addEventListener('click', ev => {
        ev.stopPropagation();
        if (ev.ctrlKey || ev.metaKey || ev.shiftKey) toggleEdgeSelection(e.id);
        else selectItem({ kind: 'edge', id: e.id });
      });
      svg.appendChild(path);
      if (e.direction === 'forward' || e.direction === 'reverse' || e.direction === 'both') {
        const arrowPoints = connectionLineStyle === 'straight'
          ? { start: routePoints[1], end: routePoints[routePoints.length - 2] }
          : {
              start: curveControl || { x: c1x, y: c1y },
              end: curveControl || { x: c2x, y: c2y },
            };
        if (e.direction === 'forward' || e.direction === 'both') addDirectionArrow(targetPoint, arrowPoints.end, edgeColor, unrelatedEdge);
        if (e.direction === 'reverse' || e.direction === 'both') addDirectionArrow(sourcePoint, arrowPoints.start, edgeColor, unrelatedEdge);
      }
      if (e.direction !== 'none') {
        const flow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        flow.setAttribute('d', d);
        flow.setAttribute('class', `connection-flow${e.direction === 'reverse' ? ' reverse' : ''}${unrelatedEdge ? ' focus-dimmed' : ''}`);
        if (relatedEdge) flow.style.stroke = edgeColor;
        flow.setAttribute('aria-hidden', 'true');
        svg.appendChild(flow);
        if (e.direction === 'both') {
          const reverseFlow = flow.cloneNode();
          reverseFlow.setAttribute('class', `connection-flow reverse${unrelatedEdge ? ' focus-dimmed' : ''}`);
          svg.appendChild(reverseFlow);
        }
      }
      const connectionLabel = connectionLabelText(e);
      if (connectionLabel) {
        const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelGroup.setAttribute('class', `connection-label-group draggable${unrelatedEdge ? ' focus-dimmed' : ''}`);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const midpoint = connectionLineStyle === 'straight' ? polylineMidpoint(routePoints) : curveMidpoint;
        const labelPoint = labelPositionFor(e, connectionLabel, midpoint, occupiedLabels, blockers);
        text.setAttribute('x', labelPoint.x); text.setAttribute('y', labelPoint.y + 4);
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
        labelGroup.addEventListener('pointerdown', event => beginEdgeLabelDrag(event, e, labelPoint));
        labelGroup.addEventListener('click', event => {
          event.stopPropagation();
          if (event.ctrlKey || event.metaKey || event.shiftKey) toggleEdgeSelection(e.id);
          else selectItem({ kind: 'edge', id: e.id });
        });
      }
      if ((selectedEdge && selectedEdgeIds.size < 2) || relatedEdge) {
        addConnectionHandle(e, sourcePoint, 'Mover extremo inicial en la tarjeta', 'fromAnchor');
        addConnectionHandle(e, targetPoint, 'Mover punta de flecha en la tarjeta', 'toAnchor');
        if (connectionLineStyle === 'curved') {
          addConnectionHandle(e, curveMidpoint, 'Mover recorrido de la conexión', 'via');
        } else {
          const { index, point } = straightEditWaypoint(e, routePoints);
          addConnectionHandle(e, point, 'Mover el punto de recorrido recto', `waypoint:${index}`, e.waypoints || [point]);
        }
      }
    });
    renderDiagramLegend();
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
  function beginEdgeWaypointDrag(event, edge, routeIndex, initialWaypoints) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    recordHistory();
    const previousWaypoints = edge.waypoints
      ? edge.waypoints.map(point => ({ ...point }))
      : null;
    const selectedWaypoint = initialWaypoints[routeIndex];
    edge.waypoints = edge.waypoints?.length === 1
      ? edge.waypoints.map(point => ({ ...point }))
      : [{ ...selectedWaypoint }];
    let moved = false;
    const move = pointerEvent => {
      const bounds = wrap.getBoundingClientRect();
      const point = {
        x: Math.max(-100000, Math.min(100000, (pointerEvent.clientX - bounds.left - panX) / zoom)),
        y: Math.max(-100000, Math.min(100000, (pointerEvent.clientY - bounds.top - panY) / zoom)),
      };
      const current = edge.waypoints[0];
      moved ||= point.x !== current.x || point.y !== current.y;
      edge.waypoints[0] = { x: Math.round(point.x), y: Math.round(point.y) };
      renderEdges();
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      if (moved) {
        saveState();
        recordHistory();
      }
    };
    const cancel = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      if (previousWaypoints) edge.waypoints = previousWaypoints;
      else delete edge.waypoints;
      renderEdges();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
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
    selectedEdgeIds = item?.kind === 'edge' ? new Set([item.id]) : new Set();
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
      const resourceCatalog = resourceCatalogForKind(n.resourceKind, n.resourceCatalog);
      componentResourceCatalog.value = resourceCatalog;
      populateResourceTypes(componentResourceType, resourceCatalog, n.resourceKind || '');
      applyResourceBtn.disabled = !n.resourceKind;
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
      shapeCategory.value = shape.category || 'general';
      updateLayerExplainer(shape.category || 'general');
      shapeType.value = shape.type;
      shapeColor.value = shape.color;
      toggleGroupCollapseBtn.textContent = shape.collapsed ? 'Expandir contenido' : 'Plegar contenido';
    } else {
      updateSelectedIcon();
      noSelection.innerHTML = '<div class="select-illustration">⌁</div><b>Ningún elemento seleccionado</b><p>Selecciona un componente, grupo o conexión del lienzo para ver sus propiedades.</p>';
    }
    updateBatchEdgeButton();
  }
  function toggleEdgeSelection(id) {
    selected = null;
    selectedEntityIds.clear();
    if (selectedEdgeIds.has(id)) selectedEdgeIds.delete(id);
    else selectedEdgeIds.add(id);
    nodes.forEach(renderNode);
    shapes.forEach(renderShape);
    renderEdges();
    propertyForm.classList.add('hidden');
    edgePropertyForm.classList.add('hidden');
    shapePropertyForm.classList.add('hidden');
    propertiesScroll.classList.add('hidden');
    noSelection.classList.remove('hidden');
    noSelection.innerHTML = `<div class="select-illustration">⌁</div><b>${selectedEdgeIds.size} conexiones seleccionadas</b><p>Usa “Lote” para cambiar sus propiedades comunes.</p>`;
    updateSelectionActions();
    updateBatchEdgeButton();
  }
  function updateBatchEdgeButton() {
    const button = document.getElementById('batchEdgesBtn');
    if (button) button.disabled = selectedEdgeIds.size < 2;
  }
  function openBatchEdgeEditor() {
    if (selectedEdgeIds.size < 2) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'batch-edge-dialog';
    dialog.innerHTML = `<form method="dialog">
      <h2>Editar conexiones seleccionadas</h2>
      <p>Marca solo las propiedades que quieras aplicar a las ${selectedEdgeIds.size} conexiones.</p>
      <label><input type="checkbox" name="change-label"> Etiqueta <input name="label" maxlength="120" placeholder="Nueva etiqueta"></label>
      <label><input type="checkbox" name="change-style"> Estilo <select name="style"><option value="solid">Sólida</option><option value="dashed">Discontinua</option><option value="dotted">Punteada</option></select></label>
      <label><input type="checkbox" name="change-type"> Tipo <select name="connectionType"><option value="general">General</option><option value="http">HTTP</option><option value="data">Datos</option><option value="event">Evento</option><option value="async">Asíncrona</option></select></label>
      <label><input type="checkbox" name="change-direction"> Sentido <select name="direction"><option value="forward">Unidireccional</option><option value="both">Bidireccional</option><option value="reverse">Inverso</option></select></label>
      <div class="dialog-actions"><button value="cancel">Cancelar</button><button value="apply" class="btn-primary">Aplicar</button></div>
    </form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.addEventListener('close', () => {
      if (dialog.returnValue !== 'apply') return;
      const form = dialog.querySelector('form');
      const values = new FormData(form);
      const edgesToUpdate = edges.filter(edge => selectedEdgeIds.has(edge.id));
      const changed = ['change-label', 'change-style', 'change-type', 'change-direction']
        .some(name => form.elements[name].checked);
      if (changed) recordHistory();
      if (form.elements['change-label'].checked) edgesToUpdate.forEach(edge => { edge.label = String(values.get('label') || ''); });
      if (form.elements['change-style'].checked) edgesToUpdate.forEach(edge => { edge.style = String(values.get('style')); });
      if (form.elements['change-type'].checked) edgesToUpdate.forEach(edge => { edge.connectionType = String(values.get('connectionType')); });
      if (form.elements['change-direction'].checked) edgesToUpdate.forEach(edge => { edge.direction = String(values.get('direction')); });
      if (changed && edgesToUpdate.length) {
        renderEdges();
        saveState();
        recordHistory();
      }
    });
    dialog.showModal();
  }
  function toggleEntitySelection(id) {
    const next = new Set(selectedEntityIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectMultiple(next);
  }
  function selectMultiple(ids) {
    selectedEdgeIds.clear();
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
    if (node.resourceKind) {
      const resourceGroup = document.createElement('details');
      resourceGroup.className = 'component-subgroup';
      resourceGroup.open = true;
      const summary = document.createElement('summary');
      summary.textContent = 'Proveedor y servicio';
      const content = document.createElement('div');
      content.className = 'component-subgroup-content';
      resourceGroup.append(summary, content);
      componentDetails.appendChild(resourceGroup);
      const resourceFields = [
        ...((DETAIL_FIELDS[node.type] || []).some(field => field.key === 'provider') ? [] : [
          { key: 'resourceProvider', label: 'Proveedor', placeholder: 'Ej.: AWS, Azure, GCP' },
        ]),
        { key: 'resourceService', label: 'Servicio concreto', placeholder: 'Ej.: Lambda, S3, EC2' },
      ];
      resourceFields.forEach(field => {
        const fieldId = `resource-${node.id}-${field.key}`;
        appendFieldLabel(content, field.label, fieldId);
        const control = document.createElement('input');
        control.id = fieldId;
        control.type = 'text';
        control.maxLength = 100;
        control.placeholder = field.placeholder;
        control.value = field.key === 'resourceProvider'
          ? node.resourceProvider || node.details.provider || ''
          : node[field.key] || '';
        control.dataset.resourceKey = field.key;
        content.appendChild(control);
      });
    }
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
  function entitySize(entity) {
    const element = entityElement(entity);
    return {
      width: element?.offsetWidth || entity.width || 228,
      height: element?.offsetHeight || entity.height || 110,
    };
  }
  function findSmartAlignment(moving, proposedX, proposedY, movingIds = selectedEntityIds) {
    const movingSize = entitySize(moving);
    const movingX = [proposedX, proposedX + movingSize.width / 2, proposedX + movingSize.width];
    const movingY = [proposedY, proposedY + movingSize.height / 2, proposedY + movingSize.height];
    const excluded = new Set(movingIds);
    let bestX = null, bestY = null;
    [...nodes, ...shapes].filter(entity => !excluded.has(entity.id)).forEach(target => {
      const size = entitySize(target);
      const targetX = [target.x, target.x + size.width / 2, target.x + size.width];
      const targetY = [target.y, target.y + size.height / 2, target.y + size.height];
      movingX.forEach(value => targetX.forEach(targetValue => {
        const distance = targetValue - value;
        if (Math.abs(distance) <= 7 && (!bestX || Math.abs(distance) < Math.abs(bestX.delta))) {
          bestX = { delta: distance, position: targetValue };
        }
      }));
      movingY.forEach(value => targetY.forEach(targetValue => {
        const distance = targetValue - value;
        if (Math.abs(distance) <= 7 && (!bestY || Math.abs(distance) < Math.abs(bestY.delta))) {
          bestY = { delta: distance, position: targetValue };
        }
      }));
    });
    return { dx: bestX?.delta || 0, dy: bestY?.delta || 0, x: bestX?.position, y: bestY?.position };
  }
  function renderAlignmentGuides(x, y) {
    alignmentGuides.replaceChildren();
    alignmentGuides.setAttribute('viewBox', `0 0 ${wrap.clientWidth} ${wrap.clientHeight}`);
    [[x, 'vertical'], [y, 'horizontal']].forEach(([position, orientation]) => {
      if (position == null) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      if (orientation === 'vertical') {
        line.setAttribute('x1', position * zoom + panX); line.setAttribute('x2', position * zoom + panX);
        line.setAttribute('y1', '0'); line.setAttribute('y2', String(wrap.clientHeight));
      } else {
        line.setAttribute('y1', position * zoom + panY); line.setAttribute('y2', position * zoom + panY);
        line.setAttribute('x1', '0'); line.setAttribute('x2', String(wrap.clientWidth));
      }
      line.setAttribute('class', 'alignment-guide');
      alignmentGuides.appendChild(line);
    });
  }
  function beginEntityDrag(event, id) {
    recordHistory();
    const movingIds = new Set(selectedEntityIds);
    [...movingIds].forEach(selectedId => {
      const selectedShape = getShape(selectedId);
      if (!selectedShape) return;
      [...nodes, ...shapes].filter(entity => shapeContains(selectedShape, entity))
        .forEach(entity => movingIds.add(entity.id));
    });
    const movingEntities = [...movingIds].map(entityId => {
      const entity = getDiagramEntity(entityId);
      return { entity, x: entity.x, y: entity.y };
    }).filter(item => item.entity);
    const movingEntityIds = new Set(movingEntities.map(({ entity }) => entity.id));
    const startX = event.clientX, startY = event.clientY;
    let moved = false;
    let routesReset = false;
    const move = ev => {
      let dx = (ev.clientX - startX) / zoom, dy = (ev.clientY - startY) / zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (!moved) return;
      const primary = movingEntities.find(item => item.entity.id === id) || movingEntities[0];
      if (primary) {
        if (snapToGrid) {
          dx += Math.round((primary.x + dx) / 22) * 22 - (primary.x + dx);
          dy += Math.round((primary.y + dy) / 22) * 22 - (primary.y + dy);
        }
        const guides = findSmartAlignment(primary.entity, primary.x + dx, primary.y + dy, movingEntityIds);
        dx += guides.dx; dy += guides.dy;
        renderAlignmentGuides(guides.x, guides.y);
      }
      if (!routesReset) {
        edges.forEach(edge => {
          if (!movingEntityIds.has(edge.from) && !movingEntityIds.has(edge.to)) return;
          delete edge.fromAnchor;
          delete edge.toAnchor;
          delete edge.via;
          delete edge.waypoints;
          delete edge.labelPosition;
        });
        routesReset = true;
      }
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
      alignmentGuides.replaceChildren();
      if (moved) {
        movingEntities.forEach(({ entity }) => {
          const parent = getShape(entity.parentGroupId);
          if (parent && !shapeGeometryContains(parent, entity)) delete entity.parentGroupId;
          if (!entity.parentGroupId) {
            const inferredParent = shapes
              .filter(shape => shapeGeometryContains(shape, entity))
              .sort((a, b) => a.width * a.height - b.width * b.height)[0];
            if (inferredParent) entity.parentGroupId = inferredParent.id;
          }
        });
        renderEdges();
        recordHistory();
        saveState();
      }
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
    event.preventDefault();
    let shapeContents = [];
    if (!nodeElement && !shapeElement && !edgeElement) {
      selectItem(null);
      contextTarget = { kind: 'canvas', x: event.clientX, y: event.clientY };
    } else if (nodeElement) {
      const id = nodeElement.id;
      if (!selectedEntityIds.has(id)) selectItem({ kind: 'node', id });
      contextTarget = { kind: 'node', id };
    } else if (shapeElement) {
      const id = shapeElement.dataset.shapeId;
      if (!selectedEntityIds.has(id)) selectItem({ kind: 'shape', id });
      contextTarget = { kind: 'shape', id };
      const shape = getShape(id);
      shapeContents = [id, ...[...nodes, ...shapes]
        .filter(entity => entity.id !== id && shapeContains(shape, entity))
        .map(entity => entity.id)];
    } else {
      const edge = edges.find(candidate => candidate.id === edgeElement.dataset.edgeId);
      if (!edge) return;
      selectItem({ kind: 'edge', id: edge.id });
      contextTarget = { kind: 'edge', id: edge.id };
    }
    const items = contextTarget.kind === 'canvas'
      ? [
          ...Object.entries(TYPES).map(([type, info]) => [`add-component:${type}`, `Agregar ${info.label}`]),
          ['add-group', 'Agregar grupo'],
        ]
      : contextTarget.kind === 'node'
      ? [
          ['copy', 'Copiar'],
          ['duplicate', 'Duplicar'],
          ['connect', 'Conectar desde aquí'],
          ['edit', 'Editar propiedades'],
          ['delete', 'Eliminar selección', true],
        ]
      : contextTarget.kind === 'shape'
        ? [
            ...(shapeContents.length > 1 ? [['select-contents', `Seleccionar grupo y contenido (${shapeContents.length})`]] : []),
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
    if (target.kind === 'canvas' && action.startsWith('add-component:')) {
      const type = action.slice('add-component:'.length);
      if (Object.hasOwn(TYPES, type)) addAtCanvas(type, target.x, target.y);
    } else if (target.kind === 'canvas' && action === 'add-group') {
      addShape(target.x, target.y);
    } else if (action === 'copy') copySelection();
    else if (action === 'duplicate') duplicateSelection();
    else if (action === 'select-contents' && target.kind === 'shape') {
      const shape = getShape(target.id);
      if (!shape) return;
      const contents = [shape.id, ...[...nodes, ...shapes]
        .filter(entity => entity.id !== shape.id && shapeContains(shape, entity))
        .map(entity => entity.id)];
      if (contents.length) selectMultiple(contents);
    }
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
      pastedShapes.forEach(shape => {
        if (shape.parentGroupId) {
          const parentId = idMap.get(shape.parentGroupId);
          if (parentId) shape.parentGroupId = parentId;
          else delete shape.parentGroupId;
        }
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
    [...pastedNodes, ...pastedShapes].forEach(entity => {
      if (entity.parentGroupId) {
        const parentId = idMap.get(entity.parentGroupId);
        if (parentId) entity.parentGroupId = parentId;
        else delete entity.parentGroupId;
      }
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
    const sizes = new Map(selectedEntities.map(entity => [entity.id, entitySize(entity)]));
    if (action.startsWith('distribute-') && selectedEntities.length < 3) {
      notify('Se necesitan al menos tres elementos para distribuir.');
      return;
    }
    recordHistory();
    if (action.startsWith('align-')) {
      const horizontal = ['align-left', 'align-center-x', 'align-right'].includes(action);
      const positions = selectedEntities.map(entity => {
        const size = sizes.get(entity.id);
        const start = horizontal ? entity.x : entity.y;
        const extent = horizontal ? size.width : size.height;
        return { entity, start, extent };
      });
      const target = action.endsWith('left') || action.endsWith('top')
        ? Math.min(...positions.map(item => item.start))
        : action.endsWith('right') || action.endsWith('bottom')
          ? Math.max(...positions.map(item => item.start + item.extent))
          : positions.reduce((sum, item) => sum + item.start + item.extent / 2, 0) / positions.length;
      positions.forEach(({ entity, start, extent }) => {
        const position = action.endsWith('left') || action.endsWith('top')
          ? target
          : action.endsWith('right') || action.endsWith('bottom')
            ? target - extent
            : target - extent / 2;
        if (horizontal) entity.x = position;
        else entity.y = position;
      });
    } else {
      const horizontal = action === 'distribute-horizontal';
      const sorted = selectedEntities.slice().sort((a, b) => horizontal ? a.x - b.x : a.y - b.y);
      const size = entity => horizontal ? sizes.get(entity.id).width : sizes.get(entity.id).height;
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
    const movedIds = new Set(selectedEntities.map(entity => entity.id));
    edges.forEach(edge => {
      if (!movedIds.has(edge.from) && !movedIds.has(edge.to)) return;
      delete edge.fromAnchor;
      delete edge.toAnchor;
      delete edge.via;
      delete edge.waypoints;
      delete edge.labelPosition;
    });
    selectedEntities.forEach(entity => entity.name ? renderNode(entity) : renderShape(entity));
    renderEdges();
    recordHistory();
    saveState();
  }
  function runAutoLayout() {
    const selectedItems = nodes.filter(node => selectedEntityIds.has(node.id));
    const items = selectedItems.length > 1 ? selectedItems : [...nodes];
    if (items.length < 2) return notify('Agrega o selecciona al menos dos componentes para organizar.');
    recordHistory();
    const mode = document.getElementById('layoutSelect').value;
    const gapX = 96, gapY = 48;
    const sizes = new Map(items.map(node => [node.id, entitySize(node)]));
    let startX = Math.max(24, Math.min(...items.map(node => node.x)));
    const startY = Math.max(24, Math.min(...items.map(node => node.y)));
    const ranks = new Map();
    if (mode === 'hierarchy') {
      const ids = new Set(items.filter(item => item.name).map(node => node.id));
      const outgoing = new Map(items.map(item => [item.id, []]));
      const incoming = new Map(items.map(item => [item.id, []]));
      edges.forEach(edge => {
        if (!ids.has(edge.from) || !ids.has(edge.to)) return;
        outgoing.get(edge.from).push(edge.to);
        incoming.get(edge.to).push(edge.from);
      });
      const comparePosition = (a, b) => a.y - b.y || a.x - b.x;
      const remaining = new Set(items.map(item => item.id));
      while (remaining.size) {
        const roots = [...remaining]
          .filter(id => incoming.get(id).every(previous => !remaining.has(previous)))
          .sort((a, b) => comparePosition(getNode(a), getNode(b)));
        const root = roots[0] || [...remaining]
          .sort((a, b) => comparePosition(getNode(a), getNode(b)))[0];
        const rootRank = Math.max(-1, ...edges
          .filter(edge => edge.to === root && ranks.has(edge.from))
          .map(edge => ranks.get(edge.from))) + 1;
        const queue = [[root, rootRank]];
        remaining.delete(root);
        while (queue.length) {
          const [id, rank] = queue.shift();
          ranks.set(id, rank);
          outgoing.get(id).forEach(next => {
            if (!remaining.has(next)) return;
            remaining.delete(next);
            queue.push([next, rank + 1]);
          });
        }
      }
    } else if (mode === 'layers') {
      const layerRank = { user: 0, frontend: 0, backend: 1, service: 1, security: 1, database: 2, cloud: 2 };
      items.forEach(node => ranks.set(node.id, layerRank[node.type] ?? 1));
    } else if (mode === 'horizontal') {
      items.slice().sort((a, b) => a.x - b.x || a.y - b.y).forEach((node, index) => {
        node.x = startX;
        node.y = startY;
        startX += sizes.get(node.id).width + gapX;
      });
    }
    if (mode === 'radial') {
      const circumference = items.reduce((total, node) => {
        const size = sizes.get(node.id);
        return total + Math.max(size.width, size.height) + gapY;
      }, 0);
      const radius = Math.max(220, circumference / (2 * Math.PI));
      const maxWidth = Math.max(...[...sizes.values()].map(size => size.width));
      const maxHeight = Math.max(...[...sizes.values()].map(size => size.height));
      const centerX = startX + radius + maxWidth / 2;
      const centerY = startY + radius + maxHeight / 2;
      items.forEach((node, index) => {
        const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2;
        const size = sizes.get(node.id);
        node.x = Math.round(centerX + Math.cos(angle) * radius - size.width / 2);
        node.y = Math.round(centerY + Math.sin(angle) * radius - size.height / 2);
      });
    } else if (mode === 'layers' || mode === 'hierarchy') {
      const columns = new Map();
      items.forEach(node => {
        const rank = ranks.get(node.id) || 0;
        const column = columns.get(rank) || [];
        column.push(node);
        columns.set(rank, column);
      });
      const rankX = new Map();
      let x = startX;
      [...columns.keys()].sort((a, b) => a - b).forEach(rank => {
        rankX.set(rank, x);
        x += Math.max(...columns.get(rank).map(node => sizes.get(node.id).width)) + gapX;
      });
      [...columns.keys()].sort((a, b) => a - b).forEach(rank => {
        const column = columns.get(rank);
        const barycenter = node => {
          const linked = edges
            .filter(edge => edge.to === node.id && ranks.has(edge.from) && ranks.get(edge.from) < rank)
            .map(edge => getNode(edge.from))
            .filter(Boolean);
          return linked.length
            ? linked.reduce((total, previous) => total + previous.y + sizes.get(previous.id).height / 2, 0) / linked.length
            : node.y;
        };
        column.sort((a, b) => barycenter(a) - barycenter(b) || a.y - b.y || a.x - b.x);
        let y = startY;
        column.forEach(node => {
          node.x = rankX.get(rank);
          node.y = y;
          y += sizes.get(node.id).height + gapY;
        });
      });
    }
    const movedIds = new Set(items.map(node => node.id));
    const fixedBounds = nodes
      .filter(node => !movedIds.has(node.id))
      .map(node => ({ ...entityBounds(node), id: node.id }));
    const placedBounds = [];
    const overlapPadding = 28;
    items.slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach(node => {
      const size = sizes.get(node.id);
      const x = node.x;
      let y = node.y;
      let overlaps;
      let attempts = 0;
      do {
        const candidate = { left: x, top: y, right: x + size.width, bottom: y + size.height };
        overlaps = [...fixedBounds, ...placedBounds].filter(other =>
          candidate.left < other.right + overlapPadding &&
          candidate.right + overlapPadding > other.left &&
          candidate.top < other.bottom + overlapPadding &&
          candidate.bottom + overlapPadding > other.top);
        if (overlaps.length) y = Math.max(...overlaps.map(other => other.bottom)) + overlapPadding;
        attempts += 1;
      } while (overlaps.length && attempts < nodes.length + 1);
      node.x = x;
      node.y = y;
      placedBounds.push({ left: x, top: y, right: x + size.width, bottom: y + size.height });
    });
    items.forEach(node => {
      node.x = Math.round(node.x);
      node.y = Math.round(node.y);
    });
    edges.forEach(edge => {
      if (!movedIds.has(edge.from) && !movedIds.has(edge.to)) return;
      delete edge.fromAnchor;
      delete edge.toAnchor;
      delete edge.via;
      delete edge.waypoints;
      delete edge.labelPosition;
    });
    items.forEach(item => item.name ? renderNode(item) : renderShape(item));
    renderEdges();
    saveState();
    recordHistory();
  }
  function centerEntities(items) {
    if (!items.length) return;
    const bounds = items.map(entity => {
      const size = entitySize(entity);
      return { left: entity.x, top: entity.y, right: entity.x + size.width, bottom: entity.y + size.height };
    });
    const left = Math.min(...bounds.map(bound => bound.left));
    const top = Math.min(...bounds.map(bound => bound.top));
    const right = Math.max(...bounds.map(bound => bound.right));
    const bottom = Math.max(...bounds.map(bound => bound.bottom));
    panX = wrap.clientWidth / 2 - ((left + right) / 2) * zoom;
    panY = wrap.clientHeight / 2 - ((top + bottom) / 2) * zoom;
    applyTransform();
  }
  function renderDiagramSearch() {
    const query = diagramSearch.value.trim().toLocaleLowerCase();
    diagramSearchResults.replaceChildren();
    if (!query) { diagramSearchResults.hidden = true; return; }
    const matches = [...nodes, ...shapes].filter(entity =>
      `${entityTitle(entity)} ${entity.name || ''} ${entity.type || ''} ${RESOURCE_KIND_LABELS[entity.resourceKind] || ''}`.toLocaleLowerCase().includes(query)).slice(0, 12);
    matches.forEach(entity => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'diagram-search-result';
      option.setAttribute('role', 'option');
      option.textContent = `${entityTitle(entity)} · ${entity.name ? 'Componente' : 'Grupo'}`;
      option.addEventListener('click', () => {
        selectItem({ kind: entity.name ? 'node' : 'shape', id: entity.id });
        centerEntities([entity]);
        diagramSearchResults.hidden = true;
        diagramSearch.focus();
      });
      diagramSearchResults.appendChild(option);
    });
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'diagram-search-empty';
      empty.textContent = 'No se encontraron elementos';
      diagramSearchResults.appendChild(empty);
    }
    diagramSearchResults.hidden = false;
  }
  function renderMiniMap() {
    if (!miniMap || miniMap.hidden) return;
    const rect = miniMap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const context = miniMap.getContext('2d');
    if (!context) return;
    const scale = window.devicePixelRatio || 1;
    miniMap.width = Math.round(rect.width * scale);
    miniMap.height = Math.round(rect.height * scale);
    context.scale(scale, scale);
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#101827';
    context.fillRect(0, 0, rect.width, rect.height);
    const items = [...nodes, ...shapes];
    if (!items.length) return;
    const raw = items.map(entity => {
      const size = entitySize(entity);
      return { entity, right: entity.x + size.width, bottom: entity.y + size.height };
    });
    const minX = Math.min(...items.map(entity => entity.x)) - 40;
    const minY = Math.min(...items.map(entity => entity.y)) - 40;
    const maxX = Math.max(...raw.map(item => item.right)) + 40;
    const maxY = Math.max(...raw.map(item => item.bottom)) + 40;
    const ratio = Math.min((rect.width - 12) / Math.max(1, maxX - minX), (rect.height - 12) / Math.max(1, maxY - minY));
    const offsetX = (rect.width - (maxX - minX) * ratio) / 2;
    const offsetY = (rect.height - (maxY - minY) * ratio) / 2;
    raw.forEach(({ entity, right, bottom }) => {
      context.fillStyle = entity.name ? (TYPES[entity.type]?.color || '#79a8ff') : '#9a8cff';
      context.fillRect(offsetX + (entity.x - minX) * ratio, offsetY + (entity.y - minY) * ratio,
        Math.max(3, (right - entity.x) * ratio), Math.max(3, (bottom - entity.y) * ratio));
    });
    const viewLeft = (-panX / zoom - minX) * ratio + offsetX;
    const viewTop = (-panY / zoom - minY) * ratio + offsetY;
    context.strokeStyle = '#ffffffcc';
    context.lineWidth = 1;
    context.strokeRect(viewLeft, viewTop, wrap.clientWidth / zoom * ratio, wrap.clientHeight / zoom * ratio);
    miniMap.dataset.bounds = JSON.stringify({ minX, minY, ratio, offsetX, offsetY });
  }
  function saveState() {
    renderDiagramJson();
    try {
      localStorage.setItem('arqsketch-state', JSON.stringify({ nodes, edges, shapes, legend, nextId }));
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
      nodes = diagram.nodes; edges = diagram.edges; shapes = diagram.shapes || []; legend = diagram.legend || []; nextId = diagram.nextId;
      nodes.forEach(renderNode); shapes.forEach(renderShape); inferGroupMemberships(); renderLegend(); renderEdges(); updateCounts();
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

    endPresentation();
    recordHistory();
    nodes = diagram.nodes;
    edges = diagram.edges;
    shapes = diagram.shapes || [];
    legend = diagram.legend || [];
    nextId = diagram.nextId;
    selected = null;
    connectFrom = null;
    setConnectMode(false);
    canvas.querySelectorAll('.node').forEach(node => node.remove());
    canvas.querySelectorAll('.group-shape').forEach(shape => shape.remove());
    nodes.forEach(renderNode);
    shapes.forEach(renderShape);
    inferGroupMemberships();
    renderLegend(); renderEdges();
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
    openTemplates();
  }
  function readStoredList(key) {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(stored)) throw new Error('El contenido guardado no es una lista válida');
      return stored;
    } catch (error) {
      notify(`No se pudieron leer los datos guardados: ${error.message}`);
      return [];
    }
  }
  function openTemplates() {
    const builtins = window.ArqSketchTemplates.listTemplates();
    const custom = readStoredList('arqsketch-templates-v1');
    const all = [
      ...builtins.map(item => ({ ...item, custom: false })),
      ...custom.map(item => ({ ...item, custom: true })),
    ];
    const modal = document.createElement('div');
    modal.className = 'architecture-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `<section class="architecture-modal-card">
      <h2>Plantillas de arquitectura</h2>
      <p>Elige un ejemplo, edítalo en el lienzo y guárdalo como plantilla personalizada. Las plantillas incluidas no se sobrescriben.</p>
      <label for="architectureTemplateSelect">Plantilla</label>
      <select class="control" id="architectureTemplateSelect">
        ${all.map(item => `<option value="${escapeXml(item.id)}">${escapeXml(item.name)}${item.custom ? ' · Personalizada' : ' · Incluida'}</option>`).join('')}
      </select>
      <p class="template-description" id="architectureTemplateDescription"></p>
      <label for="architectureTemplateName">Nombre para guardar una copia</label>
      <input class="control" id="architectureTemplateName" maxlength="60" placeholder="Ej.: Arquitectura de pagos">
      <div class="modal-actions">
        <button class="btn btn-quiet" id="closeArchitectureTemplates">Cerrar</button>
        <span class="modal-spacer"></span>
        <button class="btn btn-quiet" id="deleteArchitectureTemplate" type="button">Eliminar propia</button>
        <button class="btn btn-quiet" id="updateArchitectureTemplate" type="button">Actualizar propia</button>
        <button class="btn btn-quiet" id="saveArchitectureTemplate" type="button">Guardar copia actual</button>
        <button class="btn btn-primary" id="loadArchitectureTemplate" type="button">Cargar</button>
      </div>
    </section>`;
    document.body.appendChild(modal);
    const select = modal.querySelector('#architectureTemplateSelect');
    const selectedTemplate = () => all.find(item => item.id === select.value);
    const update = () => {
      const item = selectedTemplate();
      modal.querySelector('#architectureTemplateDescription').textContent = item?.description || '';
      modal.querySelector('#deleteArchitectureTemplate').disabled = !item?.custom;
      modal.querySelector('#updateArchitectureTemplate').disabled = !item?.custom;
    };
    const close = () => modal.remove();
    select.addEventListener('change', update);
    modal.querySelector('#closeArchitectureTemplates').addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    modal.querySelector('#loadArchitectureTemplate').addEventListener('click', async event => {
      const item = selectedTemplate();
      if (!item) return;
      const loadButton = event.currentTarget;
      loadButton.disabled = true;
      try {
        const data = item.custom ? item.data : await window.ArqSketchTemplates.createTemplate(item.id);
        if (applyDiagramData(data, `la plantilla "${item.name}"`)) close();
      } catch (error) {
        notify(`No se pudo cargar la plantilla: ${error.message}`);
      } finally {
        if (loadButton.isConnected) loadButton.disabled = false;
      }
    });
    modal.querySelector('#saveArchitectureTemplate').addEventListener('click', () => {
      const name = modal.querySelector('#architectureTemplateName').value.trim();
      if (!name) {
        modal.querySelector('#architectureTemplateName').focus();
        notify('Escribe un nombre para la plantilla personalizada.');
        return;
      }
      const saved = readStoredList('arqsketch-templates-v1');
      if (!nodes.length && !shapes.length) {
        notify('Añade componentes o grupos antes de guardar una plantilla.');
        return;
      }
      if (saved.length >= 50) {
        notify('Ya tienes 50 plantillas personalizadas; elimina una antes de guardar otra.');
        return;
      }
      const customId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      saved.push({ id: customId, name, description: `${nodes.length} componentes · ${edges.length} conexiones`, data: diagramData() });
      try {
        localStorage.setItem('arqsketch-templates-v1', JSON.stringify(saved));
        notify(`Plantilla "${name}" guardada.`);
        close();
      } catch (error) {
        notify(`No se pudo guardar la plantilla: ${error.message}`);
      }
    });
    modal.querySelector('#updateArchitectureTemplate').addEventListener('click', () => {
      const item = selectedTemplate();
      if (!item?.custom || (!nodes.length && !shapes.length)) {
        notify('Carga o crea un diagrama antes de actualizar una plantilla propia.');
        return;
      }
      const saved = readStoredList('arqsketch-templates-v1');
      const index = saved.findIndex(entry => entry.id === item.id);
      if (index < 0) return;
      saved[index] = { ...saved[index], description: `${nodes.length} componentes · ${edges.length} conexiones`, data: diagramData() };
      try {
        localStorage.setItem('arqsketch-templates-v1', JSON.stringify(saved));
        notify(`Plantilla "${item.name}" actualizada.`);
        close();
      } catch (error) {
        notify(`No se pudo actualizar la plantilla: ${error.message}`);
      }
    });
    modal.querySelector('#deleteArchitectureTemplate').addEventListener('click', () => {
      const item = selectedTemplate();
      if (!item?.custom || !confirm(`¿Eliminar la plantilla "${item.name}"?`)) return;
      try {
        localStorage.setItem('arqsketch-templates-v1', JSON.stringify(custom.filter(entry => entry.id !== item.id)));
        close();
        openTemplates();
      } catch (error) {
        notify(`No se pudo eliminar la plantilla: ${error.message}`);
      }
    });
    update();
    select.focus();
  }
  function openVersions() {
    const key = 'arqsketch-versions-v1';
    const versions = readStoredList(key);
    const modal = document.createElement('div');
    modal.className = 'architecture-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `<section class="architecture-modal-card">
      <h2>Versiones guardadas</h2>
      <p>Guarda hitos con nombre y restaura cualquiera sin afectar el historial de deshacer.</p>
      <label for="architectureVersionName">Nombre del hito</label>
      <input class="control" id="architectureVersionName" maxlength="60" placeholder="Ej.: Antes de integrar pagos">
      <div class="modal-actions"><button class="btn btn-primary" id="saveArchitectureVersion">Guardar versión actual</button></div>
      <label for="architectureVersionSelect">Versiones disponibles</label>
      <select class="control" id="architectureVersionSelect" size="5">
        ${versions.map(version => `<option value="${escapeXml(version.id)}">${escapeXml(version.name)} · ${new Date(version.createdAt).toLocaleString()}</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="btn btn-quiet" id="closeArchitectureVersions">Cerrar</button><span class="modal-spacer"></span>
        <button class="btn btn-quiet" id="deleteArchitectureVersion">Eliminar versión</button>
        <button class="btn btn-primary" id="restoreArchitectureVersion">Restaurar</button>
      </div>
    </section>`;
    document.body.appendChild(modal);
    const select = modal.querySelector('#architectureVersionSelect');
    if (versions.length) select.selectedIndex = 0;
    const close = () => modal.remove();
    modal.querySelector('#closeArchitectureVersions').addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    const persist = (list) => {
      try {
        localStorage.setItem(key, JSON.stringify(list));
        return true;
      } catch (error) {
        notify(`No se pudieron guardar las versiones: ${error.message}`);
        return false;
      }
    };
    modal.querySelector('#saveArchitectureVersion').addEventListener('click', () => {
      const name = modal.querySelector('#architectureVersionName').value.trim();
      if (!name) { modal.querySelector('#architectureVersionName').focus(); return; }
      versions.unshift({ id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, createdAt: new Date().toISOString(), data: diagramData() });
      versions.splice(50);
      if (persist(versions)) { notify(`Versión "${name}" guardada.`); close(); }
    });
    modal.querySelector('#restoreArchitectureVersion').addEventListener('click', () => {
      const version = versions.find(item => item.id === select.value);
      if (!version) { notify('Selecciona una versión para restaurar.'); return; }
      if (applyDiagramData(version.data, `la versión "${version.name}"`)) close();
    });
    modal.querySelector('#deleteArchitectureVersion').addEventListener('click', () => {
      const version = versions.find(item => item.id === select.value);
      if (!version || !confirm(`¿Eliminar la versión "${version.name}"?`)) return;
      if (persist(versions.filter(item => item.id !== version.id))) { close(); openVersions(); }
    });
    modal.querySelector('#architectureVersionName').focus();
  }
  function isPresentationEntityVisible(id) {
    if (!presentationActive) return true;
    return presentationSteps.slice(0, presentationIndex + 1).some(step => step.entityIds.includes(id));
  }
  function updatePresentation() {
    const toolbar = document.getElementById('presentationToolbar');
    toolbar.hidden = !presentationActive;
    if (!presentationActive) return;
    const status = document.getElementById('presentationStatus');
    status.textContent = presentationIndex < 0
      ? `Inicio · ${presentationSteps.length} pasos`
      : `Paso ${presentationIndex + 1} de ${presentationSteps.length}: ${presentationSteps[presentationIndex].label}`;
    document.getElementById('presentationPreviousBtn').disabled = presentationIndex <= 0;
    document.getElementById('presentationNextBtn').disabled = presentationIndex >= presentationSteps.length - 1;
  }
  function focusPresentationStep(step) {
    if (!step?.entityIds.length) return;
    const bounds = step.entityIds
      .map(getDiagramEntity)
      .filter(Boolean)
      .map(entityBounds);
    if (!bounds.length) return;
    const left = Math.min(...bounds.map(bound => bound.left));
    const top = Math.min(...bounds.map(bound => bound.top));
    const right = Math.max(...bounds.map(bound => bound.right));
    const bottom = Math.max(...bounds.map(bound => bound.bottom));
    const width = Math.max(1, right - left);
    const height = Math.max(1, bottom - top);
    const padding = Math.min(100, Math.max(36, Math.min(wrap.clientWidth, wrap.clientHeight) * .12));
    zoom = Math.max(MIN_ZOOM, Math.min(1.35,
      (wrap.clientWidth - padding * 2) / width,
      (wrap.clientHeight - padding * 2) / height));
    panX = (wrap.clientWidth - width * zoom) / 2 - left * zoom;
    panY = (wrap.clientHeight - height * zoom) / 2 - top * zoom;
    applyTransform();
  }
  function startPresentation() {
    const assigned = new Set();
    presentationSteps = [];
    shapes.forEach(shape => {
      const members = nodes.filter(node => shapeContains(shape, node) && !assigned.has(node.id));
      members.forEach(node => assigned.add(node.id));
      presentationSteps.push({ label: shape.title || 'Grupo', entityIds: [shape.id, ...members.map(node => node.id)] });
    });
    nodes.filter(node => !assigned.has(node.id)).forEach(node => {
      presentationSteps.push({ label: node.name || 'Componente', entityIds: [node.id] });
    });
    if (!presentationSteps.length) { notify('Añade componentes o grupos antes de iniciar la presentación.'); return; }
    presentationView = { zoom, panX, panY };
    clearTimeout(presentationTransitionTimer);
    wrap.classList.add('presentation-focus');
    presentationActive = true;
    presentationIndex = -1;
    document.getElementById('presentationNextBtn').disabled = false;
    updatePresentation();
    renderEdges();
    advancePresentation();
  }
  function advancePresentation(direction = 1) {
    presentationIndex = Math.max(-1, Math.min(presentationSteps.length - 1, presentationIndex + direction));
    updatePresentation();
    renderEdges();
    focusPresentationStep(presentationSteps[presentationIndex]);
  }
  function endPresentation() {
    presentationActive = false;
    presentationSteps = [];
    presentationIndex = -1;
    updatePresentation();
    renderEdges();
    if (presentationView) {
      zoom = presentationView.zoom;
      panX = presentationView.panX;
      panY = presentationView.panY;
      presentationView = null;
      applyTransform();
      clearTimeout(presentationTransitionTimer);
      presentationTransitionTimer = setTimeout(() => {
        wrap.classList.remove('presentation-focus');
        presentationTransitionTimer = null;
      }, 750);
    } else {
      wrap.classList.remove('presentation-focus');
    }
  }
  function openExportDialog() {
    const modal = document.createElement('div');
    modal.className = 'architecture-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `<section class="architecture-modal-card">
      <h2>Exportar diagrama</h2>
      <label for="architectureExportFormat">Formato</label>
      <select class="control" id="architectureExportFormat"><option value="png">PNG</option><option value="pdf">PDF (imprimir o guardar)</option></select>
      <label for="architectureExportScale">Escala / tamaño de impresión</label>
      <select class="control" id="architectureExportScale"><option value="0.5">50 %</option><option value="0.75">75 %</option><option value="1" selected>100 %</option><option value="1.25">125 %</option><option value="1.5">150 %</option></select>
      <label for="architectureExportOrientation">Orientación</label>
      <select class="control" id="architectureExportOrientation"><option value="auto">Automática</option><option value="landscape">Horizontal</option><option value="portrait">Vertical</option></select>
      <label for="architectureExportBackground">Color de fondo</label>
      <input class="control" id="architectureExportBackground" type="color" value="#0c1220">
      <p class="template-description">PDF abre el diálogo de impresión del navegador; allí elige “Guardar como PDF”.</p>
      <div class="modal-actions"><button class="btn btn-quiet" id="cancelArchitectureExport">Cancelar</button><span class="modal-spacer"></span><button class="btn btn-primary" id="confirmArchitectureExport">Exportar</button></div>
    </section>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#cancelArchitectureExport').addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    modal.querySelector('#confirmArchitectureExport').addEventListener('click', () => {
      const options = {
        format: modal.querySelector('#architectureExportFormat').value,
        scale: Number(modal.querySelector('#architectureExportScale').value),
        orientation: modal.querySelector('#architectureExportOrientation').value,
        background: modal.querySelector('#architectureExportBackground').value,
      };
      close();
      exportConfigured(options);
    });
    modal.querySelector('#architectureExportFormat').focus();
  }
  async function exportConfigured(options) {
    try {
      const source = buildArchitectureSvg(options.background, { includeRemoteIcons: options.format === 'pdf' });
      if (options.format === 'pdf') {
        const popup = window.open('', '_blank');
        if (!popup) throw new Error('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes e inténtalo de nuevo.');
        const [, svgWidth = '1', svgHeight = '1'] = source.match(/<svg[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/) || [];
        const orientation = options.orientation === 'auto'
          ? (Number(svgWidth) >= Number(svgHeight) ? 'landscape' : 'portrait')
          : options.orientation;
        popup.document.open();
        popup.document.write(`<!doctype html><html><head><title>ArqSketch</title><style>@page{size:A4 ${orientation};margin:8mm}html,body{margin:0;background:${options.background}}svg{display:block;width:${options.scale * 100}%;height:auto;max-width:none;object-fit:contain}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>${source}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),200));</script></body></html>`);
        popup.document.close();
        notify('Se abrió la vista de impresión para guardar el diagrama como PDF.');
        return;
      }
      const imageUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
      try {
        const image = new Image();
        image.src = imageUrl;
        await image.decode();
        const { width, height } = image;
        const scale = options.scale;
        let outputWidth = Math.round(width * scale), outputHeight = Math.round(height * scale);
        const orientationMismatch = options.orientation !== 'auto' &&
          ((options.orientation === 'landscape') !== (width >= height));
        if (orientationMismatch) [outputWidth, outputHeight] = [outputHeight, outputWidth];
        if (outputWidth * outputHeight > 48000000) throw new Error('La imagen superaría el límite de 48 megapíxeles; reduce la escala.');
        const canvas = document.createElement('canvas');
        canvas.width = outputWidth; canvas.height = outputHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('El navegador no pudo crear la imagen.');
        context.fillStyle = options.background;
        context.fillRect(0, 0, outputWidth, outputHeight);
        if (orientationMismatch) {
          context.translate(outputWidth / 2, outputHeight / 2);
          context.rotate(Math.PI / 2);
          context.drawImage(image, -outputHeight / 2, -outputWidth / 2, outputHeight, outputWidth);
        } else context.drawImage(image, 0, 0, outputWidth, outputHeight);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('El navegador no pudo generar el archivo PNG.');
        download('arquitectura-aplicacion.png', blob, 'image/png');
        notify(`PNG exportado al ${Math.round(scale * 100)} %.`);
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      notify(`No se pudo exportar: ${error.message}`);
    }
  }
  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  function diagramData() {
    return { app: 'ArqSketch', version: 1, nodes, edges, shapes, legend };
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
  function buildArchitectureSvg(background = '#0c1220', { includeRemoteIcons = true } = {}) {
    if (!nodes.length && !shapes.length) throw new Error('Añade al menos un componente o grupo antes de exportar.');
    const bounds = [
      ...nodes.map(node => ({ x: node.x, y: node.y, width: document.getElementById(node.id)?.offsetWidth || node.width || 228, height: document.getElementById(node.id)?.offsetHeight || node.height || 110 })),
      ...shapes.map(shape => ({ x: shape.x, y: shape.y, width: shape.width, height: shape.height })),
      ...edges.flatMap(edge => edge.waypoints || []).map(point => ({ x: point.x, y: point.y, width: 0, height: 0 })),
    ];
    const pad = 35;
    const minX = Math.min(...bounds.map(item => item.x)) - pad;
    const minY = Math.min(...bounds.map(item => item.y)) - pad;
    const exportLegend = legendItems();
    const maxX = Math.max(...bounds.map(item => item.x + item.width)) + pad + (exportLegend.length ? 270 : 0);
    const maxY = Math.max(
      ...bounds.map(item => item.y + item.height),
      minY + 60 + exportLegend.length * 22,
    ) + pad;
    const width = maxX - minX, height = maxY - minY;
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`, `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${escapeXml(background)}"/>`];
    shapes.forEach(shape => {
      const category = shape.category || 'general';
      const categoryLabel = SHAPE_CATEGORY_LABELS[category] || SHAPE_CATEGORY_LABELS.general;
      const categoryStyle = category === 'domain'
        ? 'stroke-dasharray="none"'
        : category === 'environment'
          ? 'stroke-dasharray="10 5"'
          : category === 'trust-zone'
            ? 'stroke-dasharray="2 5" stroke-linecap="round"'
            : 'stroke-dasharray="8 6"';
      const fillOpacity = category === 'trust-zone' ? '38' : '24';
      const strokeWidth = category === 'trust-zone' ? 3 : 2;
      const geometry = shape.type === 'ellipse'
        ? `<ellipse cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" rx="${shape.width / 2}" ry="${shape.height / 2}"/>`
        : `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="16"/>`;
      parts.push(`<g fill="${shape.color}${fillOpacity}" stroke="${shape.color}" stroke-width="${strokeWidth}" ${categoryStyle}>${geometry}</g>`);
      parts.push(`<text x="${shape.x + shape.width / 2}" y="${shape.y + 24}" text-anchor="middle" fill="${shape.color}" font-size="14" font-weight="bold">${escapeXml(`${shape.title || 'Grupo'} · ${categoryLabel}`)}</text>`);
    });
    const exportOccupiedLabels = [];
    const exportBlockers = nodes.map(node => ({
      left: node.x,
      top: node.y,
      right: node.x + (document.getElementById(node.id)?.offsetWidth || node.width || 228),
      bottom: node.y + (document.getElementById(node.id)?.offsetHeight || node.height || 130),
    }));
    edges.forEach(e => {
      const a = getDiagramEntity(e.from), b = getDiagramEntity(e.to); if (!a || !b) return;
      const ac = nodeCenter(a), bc = nodeCenter(b);
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
      const sourcePoint = anchorPoint(a, entityElement(a), sourceAnchor);
      const targetPoint = anchorPoint(b, entityElement(b), targetAnchor);
      const edgeType = e.connectionType || 'general';
      const edgeColor = EDGE_TYPE_COLORS[edgeType] || EDGE_TYPE_COLORS.general;
      const style = e.style === 'dashed' ? 'stroke-dasharray="9 6"' : e.style === 'dotted' ? 'stroke-dasharray="1 6" stroke-linecap="round"' : '';
      const marker = `url(#arr-${edgeType})`;
      const startMarker = e.direction === 'reverse' || e.direction === 'both' ? `marker-start="${marker}"` : '';
      const endMarker = e.direction === 'forward' || e.direction === 'both' || !e.direction ? `marker-end="${marker}"` : '';
      const routePoints = connectionLineStyle === 'straight'
        ? edgeRoute(e, sourcePoint, targetPoint, sourceAnchor, targetAnchor)
        : [];
      const bend = Math.max(35, Math.hypot(targetPoint.x - sourcePoint.x, targetPoint.y - sourcePoint.y) * .42);
      const sourceDirection = EDGE_DIRECTIONS[sourceAnchor.side];
      const targetDirection = EDGE_DIRECTIONS[targetAnchor.side];
      const midpoint = { x: (sourcePoint.x + targetPoint.x) / 2, y: (sourcePoint.y + targetPoint.y) / 2 };
      const pathData = connectionLineStyle === 'straight'
        ? `M ${routePoints.map(point => `${point.x} ${point.y}`).join(' L ')}`
        : e.via
          ? `M ${sourcePoint.x} ${sourcePoint.y} Q ${midpoint.x + 2 * e.via.x} ${midpoint.y + 2 * e.via.y} ${targetPoint.x} ${targetPoint.y}`
          : `M ${sourcePoint.x} ${sourcePoint.y} C ${sourcePoint.x + sourceDirection.x * bend} ${sourcePoint.y + sourceDirection.y * bend}, ${targetPoint.x + targetDirection.x * bend} ${targetPoint.y + targetDirection.y * bend}, ${targetPoint.x} ${targetPoint.y}`;
      parts.push(`<path d="${pathData}" stroke="${edgeColor}" stroke-width="2" fill="none" ${style} ${startMarker} ${endMarker}/>`);
      const typeLabel = edgeType !== 'general' ? EDGE_TYPE_LABELS[edgeType] : '';
      const label = [typeLabel, e.label].filter(Boolean).join(' · ');
      const midpointLabel = connectionLineStyle === 'straight' ? polylineMidpoint(routePoints) : e.via
        ? { x: midpoint.x + e.via.x, y: midpoint.y + e.via.y }
        : { x: (sourcePoint.x + 3 * (sourcePoint.x + sourceDirection.x * bend) + 3 * (targetPoint.x + targetDirection.x * bend) + targetPoint.x) / 8, y: (sourcePoint.y + 3 * (sourcePoint.y + sourceDirection.y * bend) + 3 * (targetPoint.y + targetDirection.y * bend) + targetPoint.y) / 8 };
      if (label) {
        const labelPoint = labelPositionFor(e, label, midpointLabel, exportOccupiedLabels, exportBlockers);
        parts.push(`<text x="${labelPoint.x}" y="${labelPoint.y + 4}" text-anchor="middle" fill="#f3f5ff" stroke="${escapeXml(background)}" stroke-width="5" stroke-linejoin="round" paint-order="stroke" font-size="12" font-weight="700">${escapeXml(label)}</text>`);
      }
    });
    const markerDefs = Object.entries(EDGE_TYPE_COLORS)
      .map(([type, color]) => `<marker id="arr-${type}" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto-start-reverse"><path d="M0,0 L0,6 L8,3 z" fill="${color}"/></marker>`)
      .join('');
    parts.push(`<defs>${markerDefs}</defs>`);
    nodes.forEach(n => {
      const colors = { frontend:'#65bfff', backend:'#a99aff', database:'#4fd7b7', service:'#edb76d', cloud:'#83aaff', security:'#ef8fba', user:'#ef8fba' };
      const nodeWidth = document.getElementById(n.id)?.offsetWidth || 228;
      const nodeHeight = document.getElementById(n.id)?.offsetHeight || 110;
      parts.push(`<rect x="${n.x}" y="${n.y}" width="${nodeWidth}" height="${nodeHeight}" rx="10" fill="#151e2e" stroke="${colors[n.type] || '#8290b1'}" stroke-width="2"/>`);
      const iconUrl = includeRemoteIcons ? window.ArqSketchDiagram.iconifyUrl(n.icon) : null;
      if (iconUrl) {
        parts.push(`<image href="${escapeXml(iconUrl)}" x="${n.x+10}" y="${n.y+9}" width="20" height="20"/>`);
      } else {
        const symbol = ICONS[n.icon]?.symbol || TYPES[n.type].symbol;
        parts.push(`<text x="${n.x+12}" y="${n.y+29}" fill="#edf2fb" font-size="13">${escapeXml(symbol)}</text>`);
      }
      parts.push(`<text x="${n.x+34}" y="${n.y+28}" fill="#edf2fb" font-size="12" font-weight="bold">${escapeXml(n.name)}</text>`);
      const subtitle = n.resourceKind
        ? `${TYPES[n.type].label} · ${RESOURCE_KIND_LABELS[n.resourceKind] || n.resourceKind}`
        : TYPES[n.type].label;
      parts.push(`<text x="${n.x+12}" y="${n.y+47}" fill="#93a0b8" font-size="10">${escapeXml(subtitle)}</text>`);
      parts.push(`<text x="${n.x+12}" y="${n.y+68}" fill="#9ca8bd" font-size="9">${escapeXml((n.description || '').slice(0, 34))}</text>`);
      nodeDetailSummary(n).slice(0, 3).forEach((detail, index) => {
        parts.push(`<text x="${n.x+12}" y="${n.y+86+index*14}" fill="#b8c3d8" font-size="9">${escapeXml(detail.slice(0, 48))}</text>`);
      });
    });
    if (exportLegend.length) {
      const x = maxX - 255;
      const y = minY + 14;
      const legendHeight = 50 + exportLegend.length * 22;
      parts.push(`<rect x="${x}" y="${y}" width="245" height="${legendHeight}" rx="10" fill="#151e2e" stroke="#35415a"/>`);
      parts.push(`<text x="${x + 12}" y="${y + 20}" fill="#edf2fb" font-size="12" font-weight="700">Leyenda</text>`);
      exportLegend.forEach((item, index) => {
        const rowY = y + 40 + index * 22;
        parts.push(`<rect x="${x + 12}" y="${rowY - 9}" width="10" height="10" rx="3" fill="${item.color}"/>`);
        parts.push(`<text x="${x + 29}" y="${rowY}" fill="#dce3f2" font-size="10">${escapeXml(`${item.label}${item.description ? ` · ${item.description}` : ''}`)}</text>`);
      });
    }
    parts.push('</svg>');
    return parts.join('');
  }
  function exportSvg() {
    try {
      download('arquitectura-aplicacion.svg', buildArchitectureSvg(), 'image/svg+xml;charset=utf-8');
      notify('Diagrama exportado como SVG.');
    } catch (error) {
      notify(`No se pudo exportar SVG: ${error.message}`);
    }
  }
  function escapeXml(s) { return String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])); }
  function reset() {
    if ((nodes.length || shapes.length) && !confirm('¿Crear un diagrama nuevo? Se borrará el diagrama actual del navegador.')) return;
    endPresentation();
    recordHistory();
    nodes = []; edges = []; shapes = []; legend = []; selected = null; nextId = 1;
    zoom = 1; panX = 0; panY = 0;
    canvas.querySelectorAll('.node, .group-shape').forEach(n => n.remove()); renderLegend(); applyTransform(); renderEdges(); updateCounts(); selectItem(null); recordHistory(); saveState(); notify('Lienzo nuevo listo.');
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
    if (!node || control.tagName === 'SELECT' ||
        !control.matches('[data-detail-key], [data-endpoint-key], [data-resource-key]')) return;
    if (control.dataset.detailKey) node.details[control.dataset.detailKey] = control.value;
    else if (control.dataset.resourceKey === 'resourceProvider') {
      if (node.type === 'cloud') node.details.provider = control.value;
      else node.resourceProvider = control.value;
    } else if (control.dataset.resourceKey) node[control.dataset.resourceKey] = control.value;
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
    if (shape) { shape.title = shapeTitle.value; renderShape(shape); renderEdges(); saveState(); scheduleHistoryRecord(); }
  });
  shapeCategory.addEventListener('change', () => {
    updateLayerExplainer(shapeCategory.value);
    const shape = selected?.kind === 'shape' && getShape(selected.id);
    if (!shape) return;
    recordHistory();
    shape.category = shapeCategory.value;
    renderShape(shape);
    renderEdges();
    renderLegend();
    saveState();
    recordHistory();
  });
  document.getElementById('openLayerGuideBtn').addEventListener('click', () => {
    if (!layerGuideDialog.open) layerGuideDialog.showModal();
  });
  const closeLayerGuide = () => {
    if (layerGuideDialog.open) layerGuideDialog.close();
  };
  document.getElementById('closeLayerGuideBtn').addEventListener('click', closeLayerGuide);
  document.getElementById('dismissLayerGuideBtn').addEventListener('click', closeLayerGuide);
  componentResourceCatalog.addEventListener('change', () => {
    populateResourceTypes(componentResourceType, componentResourceCatalog.value);
    applyResourceBtn.disabled = true;
  });
  componentResourceType.addEventListener('change', () => {
    applyResourceBtn.disabled = !componentResourceType.value;
  });
  applyResourceBtn.addEventListener('click', applyResourceToComponent);
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
    if (shape) { shape.color = shapeColor.value; renderShape(shape); renderEdges(); saveState(); scheduleHistoryRecord(); }
  });
  toggleGroupCollapseBtn.addEventListener('click', () => {
    const shape = selected?.kind === 'shape' && getShape(selected.id);
    if (!shape) return;
    recordHistory();
    shape.collapsed = !shape.collapsed;
    renderShape(shape);
    toggleGroupCollapseBtn.textContent = shape.collapsed ? 'Expandir contenido' : 'Plegar contenido';
    renderEdges();
    saveState();
    recordHistory();
  });
  document.getElementById('connectModeBtn').addEventListener('click', () => setConnectMode(!connectMode));
  connectionLineStyleSelect.addEventListener('change', event => {
    const style = event.currentTarget.value;
    if (!['curved', 'straight'].includes(style)) {
      event.currentTarget.value = connectionLineStyle;
      notify('El estilo de las conexiones seleccionado no es válido.');
      return;
    }
    connectionLineStyle = style;
    try {
      localStorage.setItem('arqsketch-connection-line-style', connectionLineStyle);
    } catch (error) {
      notify(`No se pudo guardar la preferencia de estilo: ${error.message}`);
    }
    renderEdges();
  });
  document.getElementById('addShapeBtn').addEventListener('click', addShape);
  document.getElementById('addLegendEntryBtn').addEventListener('click', () => {
    if (legend.length >= 30) {
      notify('La leyenda admite hasta 30 entradas personalizadas.');
      return;
    }
    recordHistory();
    legend.push({ id: makeId('leg'), label: 'Nueva entrada', description: '', color: '#65bfff' });
    renderLegend();
    saveState();
    recordHistory();
  });
  diagramViewFilter.addEventListener('change', () => {
    diagramViewFilterValue = diagramViewFilter.value;
    renderEdges();
  });
  document.getElementById('deleteBtn').addEventListener('click', deleteSelected);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
  document.getElementById('deleteEdgePropertyBtn').addEventListener('click', deleteSelected);
  document.getElementById('deleteShapeBtn').addEventListener('click', deleteSelected);
  document.getElementById('clearBtn').addEventListener('click', reset);
  document.getElementById('newDiagramBtn').addEventListener('click', reset);
  document.getElementById('importJsonBtn').addEventListener('click', () => importJsonFile.click());
  importJsonFile.addEventListener('change', event => importJsonFileContent(event.currentTarget.files[0]));
  document.getElementById('starterTemplateBtn').addEventListener('click', loadTemplate);
  document.getElementById('templatesBtn').addEventListener('click', openTemplates);
  document.getElementById('versionsBtn').addEventListener('click', openVersions);
  document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
  document.getElementById('exportSvgBtn').addEventListener('click', exportSvg);
  document.getElementById('exportPngBtn').addEventListener('click', openExportDialog);
  document.getElementById('presentBtn').addEventListener('click', startPresentation);
  document.getElementById('presentationPreviousBtn').addEventListener('click', () => advancePresentation(-1));
  document.getElementById('presentationNextBtn').addEventListener('click', () => advancePresentation(1));
  document.getElementById('presentationEndBtn').addEventListener('click', endPresentation);
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
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, Math.max(MIN_ZOOM, +(zoom - .1).toFixed(2)));
  });
  document.getElementById('fitBtn').addEventListener('click', fitDiagram);
  toggleLibraryBtn.addEventListener('click', toggleLibraryVisibility);
  togglePropertiesBtn.addEventListener('click', togglePropertiesVisibility);
  document.getElementById('closePropertiesBtn').addEventListener('click', () => {
    propertiesHidden = true;
    applyPropertiesVisibility();
  });
  appShell.addEventListener('click', event => {
    if (event.target === appShell && appShell.classList.contains('properties-open')) {
      propertiesHidden = true;
      applyPropertiesVisibility();
    }
  });
  window.matchMedia('(max-width: 1000px)').addEventListener('change', event => {
    propertiesHidden = event.matches;
    applyPropertiesVisibility();
  });
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('gridBtn').addEventListener('click', event => {
    const visible = wrap.classList.toggle('no-grid') === false;
    event.currentTarget.setAttribute('aria-pressed', String(visible));
  });
  document.getElementById('snapToGrid').addEventListener('change', event => { snapToGrid = event.currentTarget.checked; });
  document.getElementById('autoLayoutBtn').addEventListener('click', runAutoLayout);
  document.getElementById('batchEdgesBtn').addEventListener('click', openBatchEdgeEditor);
  document.getElementById('miniMapToggleBtn').addEventListener('click', () => {
    miniMap.hidden = !miniMap.hidden;
    document.getElementById('miniMapToggleBtn').setAttribute('aria-pressed', String(!miniMap.hidden));
    if (!miniMap.hidden) renderMiniMap();
  });
  document.getElementById('centerSelectedBtn').addEventListener('click', () => {
    const selectedItems = [...nodes, ...shapes].filter(entity => selectedEntityIds.has(entity.id));
    if (!selectedItems.length && selected && ['node', 'shape'].includes(selected.kind)) {
      selectedItems.push(getDiagramEntity(selected.id));
    }
    centerEntities(selectedItems.filter(Boolean));
  });
  diagramSearch.addEventListener('input', renderDiagramSearch);
  diagramSearch.addEventListener('keydown', event => {
    if (event.key === 'Escape') { diagramSearchResults.hidden = true; return; }
    if (event.key === 'Enter') diagramSearchResults.querySelector('button')?.click();
  });
  wrap.addEventListener('click', event => {
    if (!miniMap.hidden && event.target === miniMap) {
      const bounds = JSON.parse(miniMap.dataset.bounds || 'null');
      if (!bounds) return;
      const rect = miniMap.getBoundingClientRect();
      const x = (event.clientX - rect.left - bounds.offsetX) / bounds.ratio + bounds.minX;
      const y = (event.clientY - rect.top - bounds.offsetY) / bounds.ratio + bounds.minY;
      panX = wrap.clientWidth / 2 - x * zoom;
      panY = wrap.clientHeight / 2 - y * zoom;
      applyTransform();
    } else if (!diagramSearchResults.contains(event.target) && event.target !== diagramSearch) {
      diagramSearchResults.hidden = true;
    }
  });
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
    const nextZoom = Math.max(MIN_ZOOM, Math.min(1.6, zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1)));
    zoomAt(event.clientX, event.clientY, nextZoom);
  }, { passive: false });
  wrap.addEventListener('pointerdown', event => {
    if (event.button !== 0 || connectMode || event.target.closest('.node, .group-shape, .connection, .mini-map, .diagram-search-results, button, input, textarea')) return;
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
  window.addEventListener('resize', renderMiniMap);
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
    zoom = Math.max(MIN_ZOOM, Math.min(1.6,
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
    if (e.key === 'Escape') {
      setConnectMode(false);
      selectItem(null);
      if (appShell.classList.contains('properties-open')) {
        propertiesHidden = true;
        applyPropertiesVisibility();
      }
    }
  });

  loadPanelWidths();
  loadLibraryVisibility();
  applyPropertiesVisibility();
  try {
    const savedConnectionLineStyle = localStorage.getItem('arqsketch-connection-line-style');
    if (savedConnectionLineStyle === 'curved' || savedConnectionLineStyle === 'straight') {
      connectionLineStyle = savedConnectionLineStyle;
    }
    connectionLineStyleSelect.value = connectionLineStyle;
  } catch (error) {
    notify(`No se pudo restaurar la preferencia de estilo: ${error.message}`);
  }
  if (!loadState()) updateCounts();
  renderDiagramJson();
  selectItem(null);
  history = [currentDiagramState()];
  historyIndex = 0;
  updateHistoryButtons();
})();