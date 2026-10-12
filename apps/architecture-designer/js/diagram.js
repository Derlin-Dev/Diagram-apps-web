(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArqSketchDiagram = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TYPES = ['frontend', 'backend', 'database', 'service', 'cloud', 'user'];
  const MAX_NODES = 300;
  const MAX_EDGES = 1000;
  const MAX_SHAPES = 300;
  const MAX_COORDINATE = 100000;
  const MIN_NODE_WIDTH = 190;
  const MAX_NODE_WIDTH = 640;
  const MIN_NODE_HEIGHT = 130;
  const MAX_NODE_HEIGHT = 600;
  const NODE_SIZE = {
    minWidth: MIN_NODE_WIDTH,
    maxWidth: MAX_NODE_WIDTH,
    minHeight: MIN_NODE_HEIGHT,
    maxHeight: MAX_NODE_HEIGHT,
  };
  const AUTH_METHODS = ['', 'JWT / Bearer token', 'Cookie de sesión', 'OAuth 2.0', 'API key', 'Usuario y contraseña', 'mTLS', 'Otro'];
  const ACCESS_LEVELS = ['', 'Público', 'Privado'];
  const ENVIRONMENTS = ['', 'Desarrollo', 'Pruebas', 'Producción'];
  const EDGE_DIRECTIONS = ['forward', 'reverse', 'both', 'none'];
  const EDGE_STYLES = ['solid', 'dashed', 'dotted'];
  const EDGE_TYPES = ['general', 'api', 'data', 'events', 'auth', 'files', 'monitoring', 'dependency', 'other'];
  const DETAIL_FIELDS = {
    frontend: [
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['', 'Web', 'Móvil', 'Escritorio', 'Web y móvil'] },
      { key: 'framework', label: 'Framework / tecnología', type: 'text', maxLength: 100, placeholder: 'Ej.: React, Vue, Flutter' },
      { key: 'baseUrl', label: 'URL o dominio', type: 'url', maxLength: 300, placeholder: 'https://app.ejemplo.com' },
      { key: 'access', label: 'Acceso', type: 'select', options: ACCESS_LEVELS },
      { key: 'authMethod', label: 'Autenticación', type: 'select', options: AUTH_METHODS },
    ],
    backend: [
      { key: 'basePath', label: 'URL base', type: 'text', maxLength: 300, placeholder: 'https://api.ejemplo.com/v1' },
      { key: 'runtime', label: 'Runtime / framework', type: 'text', maxLength: 100, placeholder: 'Ej.: Node.js, FastAPI, Spring' },
    ],
    database: [
      { key: 'engine', label: 'Motor', type: 'text', maxLength: 100, placeholder: 'Ej.: PostgreSQL, MongoDB, Redis' },
      { key: 'databaseName', label: 'Base de datos / esquema', type: 'text', maxLength: 100 },
      { key: 'deployment', label: 'Despliegue', type: 'select', options: ['', 'Autogestionado', 'Administrado', 'Serverless', 'Local'] },
      { key: 'environment', label: 'Entorno', type: 'select', options: ENVIRONMENTS },
      { key: 'access', label: 'Acceso de red', type: 'select', options: ACCESS_LEVELS },
      { key: 'authMethod', label: 'Autenticación', type: 'select', options: AUTH_METHODS },
    ],
    service: [
      { key: 'provider', label: 'Proveedor / servicio', type: 'text', maxLength: 100, placeholder: 'Ej.: Stripe, SendGrid' },
      { key: 'integration', label: 'Tipo de integración', type: 'select', options: ['', 'REST', 'GraphQL', 'gRPC', 'SOAP', 'Webhook', 'Cola / eventos', 'SDK'] },
      { key: 'baseUrl', label: 'URL o endpoint', type: 'url', maxLength: 300, placeholder: 'https://servicio.ejemplo.com' },
      { key: 'authMethod', label: 'Autenticación', type: 'select', options: AUTH_METHODS },
    ],
    cloud: [
      { key: 'provider', label: 'Proveedor', type: 'text', maxLength: 100, placeholder: 'Ej.: AWS, Azure, GCP' },
      { key: 'region', label: 'Región', type: 'text', maxLength: 100, placeholder: 'Ej.: us-east-1' },
      { key: 'environment', label: 'Entorno', type: 'select', options: ENVIRONMENTS },
      { key: 'deployment', label: 'Tipo de despliegue', type: 'select', options: ['', 'VM', 'Contenedores', 'Kubernetes', 'Serverless', 'PaaS', 'Otro'] },
      { key: 'scaling', label: 'Escalado / capacidad', type: 'text', maxLength: 160, placeholder: 'Ej.: 2 instancias, autoescalado' },
    ],
    user: [
      { key: 'role', label: 'Rol', type: 'text', maxLength: 100, placeholder: 'Ej.: Administrador, cliente' },
      { key: 'accessLevel', label: 'Nivel de acceso', type: 'select', options: ['', 'Administrador', 'Operador', 'Usuario', 'Solo lectura', 'Invitado'] },
      { key: 'authMethod', label: 'Autenticación', type: 'select', options: AUTH_METHODS },
      { key: 'identityProvider', label: 'Proveedor de identidad', type: 'text', maxLength: 100, placeholder: 'Ej.: Cognito, Auth0, SSO corporativo' },
    ],
  };
  const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  const ENDPOINT_ACCESS = ['Público', 'Privado'];
  const ICONS = {
    auto: { label: 'Predeterminado', symbol: null, category: 'General', keywords: ['tipo', 'componente'] },
    globe: { label: 'Web / red', symbol: '◎', category: 'General', keywords: ['internet', 'network', 'sitio'] },
    app: { label: 'Aplicación', symbol: '▤', category: 'General', keywords: ['software', 'programa'] },
    code: { label: 'Código / API', symbol: '⌘', category: 'General', keywords: ['desarrollo', 'endpoint'] },
    server: { label: 'Servidor', symbol: '▣', category: 'Infraestructura', keywords: ['host', 'máquina'] },
    database: { label: 'Base de datos', symbol: '◉', category: 'Datos', keywords: ['db', 'persistencia'] },
    cloud: { label: 'Nube', symbol: '☁', category: 'Infraestructura', keywords: ['cloud computing'] },
    user: { label: 'Usuario', symbol: '♙', category: 'General', keywords: ['persona', 'actor'] },
    settings: { label: 'Configuración', symbol: '⚙', category: 'General', keywords: ['ajustes', 'proceso'] },
    security: { label: 'Seguridad', symbol: '⬡', category: 'General', keywords: ['auth', 'autenticación', 'protección'] },
    flow: { label: 'Flujo / cola', symbol: '⇄', category: 'General', keywords: ['queue', 'mensajería', 'eventos'] },
    mail: { label: 'Correo', symbol: '✉', category: 'General', keywords: ['email', 'notificación'] },
    storage: { label: 'Almacenamiento', symbol: '▧', category: 'Datos', keywords: ['archivo', 'bucket', 'object storage'] },
    key: { label: 'Llave / acceso', symbol: '⚿', category: 'General', keywords: ['credencial', 'secreto'] },
    html: { label: 'HTML', symbol: 'HTML', category: 'Frontend', keywords: ['markup', 'web'] },
    css: { label: 'CSS', symbol: 'CSS', category: 'Frontend', keywords: ['estilos', 'web'] },
    javascript: { label: 'JavaScript', symbol: 'JS', category: 'Frontend', keywords: ['js', 'web'] },
    typescript: { label: 'TypeScript', symbol: 'TS', category: 'Frontend', keywords: ['ts', 'javascript'] },
    react: { label: 'React', symbol: '⚛', category: 'Frontend', keywords: ['reactjs', 'interfaz', 'ui'] },
    vue: { label: 'Vue.js', symbol: 'V', category: 'Frontend', keywords: ['vuejs', 'interfaz', 'ui'] },
    angular: { label: 'Angular', symbol: 'A', category: 'Frontend', keywords: ['interfaz', 'ui'] },
    nextjs: { label: 'Next.js', symbol: 'N', category: 'Frontend', keywords: ['next', 'react', 'framework'] },
    nodejs: { label: 'Node.js', symbol: 'Node', category: 'Backend', keywords: ['node', 'javascript', 'runtime'] },
    python: { label: 'Python', symbol: 'Py', category: 'Backend', keywords: ['django', 'fastapi', 'flask'] },
    java: { label: 'Java', symbol: 'J', category: 'Backend', keywords: ['spring', 'jvm'] },
    dotnet: { label: '.NET', symbol: '.NET', category: 'Backend', keywords: ['csharp', 'c#', 'asp.net'] },
    go: { label: 'Go', symbol: 'Go', category: 'Backend', keywords: ['golang'] },
    php: { label: 'PHP', symbol: 'PHP', category: 'Backend', keywords: ['laravel'] },
    graphql: { label: 'GraphQL', symbol: 'GQL', category: 'Backend', keywords: ['api', 'query'] },
    postgresql: { label: 'PostgreSQL', symbol: 'Pg', category: 'Datos', keywords: ['postgres', 'sql', 'relacional'] },
    mysql: { label: 'MySQL', symbol: 'My', category: 'Datos', keywords: ['sql', 'relacional'] },
    sqlite: { label: 'SQLite', symbol: 'Sq', category: 'Datos', keywords: ['sql', 'local', 'relacional'] },
    mongodb: { label: 'MongoDB', symbol: 'Mo', category: 'Datos', keywords: ['mongo', 'nosql', 'documentos'] },
    redis: { label: 'Redis', symbol: 'Re', category: 'Datos', keywords: ['cache', 'caché', 'key value'] },
    aws: { label: 'AWS', symbol: 'AWS', category: 'Infraestructura', keywords: ['amazon', 'cloud', 'nube'] },
    azure: { label: 'Microsoft Azure', symbol: 'Az', category: 'Infraestructura', keywords: ['microsoft', 'cloud', 'nube'] },
    gcp: { label: 'Google Cloud', symbol: 'GCP', category: 'Infraestructura', keywords: ['gcp', 'google', 'cloud', 'nube'] },
    docker: { label: 'Docker', symbol: 'Dk', category: 'Infraestructura', keywords: ['contenedor', 'container'] },
    kubernetes: { label: 'Kubernetes', symbol: 'K8s', category: 'Infraestructura', keywords: ['k8s', 'orquestación', 'contenedor'] },
    linux: { label: 'Linux', symbol: 'Li', category: 'Infraestructura', keywords: ['sistema operativo', 'servidor'] },
    git: { label: 'Git', symbol: 'Git', category: 'Herramientas', keywords: ['versiones', 'control de versiones'] },
    github: { label: 'GitHub', symbol: 'GH', category: 'Herramientas', keywords: ['repositorio', 'git'] },
    kafka: { label: 'Apache Kafka', symbol: 'K', category: 'Mensajería', keywords: ['eventos', 'stream', 'cola'] },
    rabbitmq: { label: 'RabbitMQ', symbol: 'Mq', category: 'Mensajería', keywords: ['mensajes', 'cola', 'queue'] },
    api: { label: 'API / REST', symbol: 'API', category: 'General', keywords: ['endpoint', 'http', 'servicio'] },
    payment: { label: 'Pagos', symbol: '$', category: 'General', keywords: ['payment', 'stripe', 'facturación'] },
    search: { label: 'Búsqueda', symbol: '⌕', category: 'General', keywords: ['search', 'índice'] },
  };

  function searchIcons(query = '') {
    const tokenize = value => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .match(/[\p{L}\p{N}]+/gu) || [];
    const terms = tokenize(query);
    return Object.entries(ICONS)
      .filter(([, icon]) => {
        const tokens = tokenize(`${icon.label} ${icon.category} ${(icon.keywords || []).join(' ')}`);
        return terms.every(term => tokens.some(token => token === term || token.startsWith(term)));
      })
      .map(([id, icon]) => ({ id, ...icon }));
  }

  function iconifyParts(iconId) {
    if (typeof iconId !== 'string') return null;
    const match = /^iconify:([a-z0-9][a-z0-9_-]*):([a-z0-9][a-z0-9_-]*)$/i.exec(iconId);
    return match ? { prefix: match[1].toLowerCase(), name: match[2].toLowerCase() } : null;
  }

  function iconifyUrl(iconId, color = '#dce3f2') {
    const parts = iconifyParts(iconId);
    if (!parts) return null;
    const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#dce3f2';
    return `https://api.iconify.design/${encodeURIComponent(parts.prefix)}/${encodeURIComponent(parts.name)}.svg?color=${encodeURIComponent(safeColor)}`;
  }

  function createDefaultDetails(type) {
    const details = Object.fromEntries((DETAIL_FIELDS[type] || []).map(field => [field.key, '']));
    if (type === 'backend') details.endpoints = [];
    return details;
  }

  function normalizeDetails(type, details, componentName) {
    if (details === undefined || details === null) return createDefaultDetails(type);
    if (typeof details !== 'object' || Array.isArray(details)) {
      throw new Error(`Los detalles de "${componentName}" no son válidos`);
    }
    const fields = DETAIL_FIELDS[type] || [];
    const allowedKeys = new Set(fields.map(field => field.key));
    if (type === 'backend') allowedKeys.add('endpoints');
    if (Object.keys(details).some(key => !allowedKeys.has(key))) {
      throw new Error(`Los detalles de "${componentName}" contienen campos no compatibles`);
    }
    const normalized = createDefaultDetails(type);
    fields.forEach(field => {
      const value = details[field.key];
      if (value === undefined || value === null) return;
      if (typeof value !== 'string' || value.length > field.maxLength && field.maxLength) {
        throw new Error(`El campo "${field.label}" de "${componentName}" no es válido`);
      }
      if (field.type === 'select' && !field.options.includes(value)) {
        throw new Error(`El valor de "${field.label}" en "${componentName}" no es válido`);
      }
      normalized[field.key] = value;
    });
    if (type === 'backend' && details.endpoints !== undefined) {
      if (!Array.isArray(details.endpoints) || details.endpoints.length > 100) {
        throw new Error(`La lista de endpoints de "${componentName}" no es válida`);
      }
      normalized.endpoints = details.endpoints.map((endpoint, index) => {
        if (!endpoint || typeof endpoint !== 'object' || Array.isArray(endpoint) ||
            Object.keys(endpoint).some(key => !['method', 'path', 'access', 'authRequired', 'authMethod'].includes(key)) ||
            !HTTP_METHODS.includes(endpoint.method) ||
            typeof endpoint.path !== 'string' || endpoint.path.length > 240 ||
            !ENDPOINT_ACCESS.includes(endpoint.access) ||
            typeof endpoint.authRequired !== 'boolean' ||
            typeof endpoint.authMethod !== 'string' || !AUTH_METHODS.includes(endpoint.authMethod)) {
          throw new Error(`El endpoint ${index + 1} de "${componentName}" no es válido`);
        }
        return {
          method: endpoint.method,
          path: endpoint.path,
          access: endpoint.access,
          authRequired: endpoint.authRequired,
          authMethod: endpoint.authMethod,
        };
      });
    }
    return normalized;
  }

  async function searchIconify(query, signal, fetchImpl = globalThis.fetch) {
    const term = typeof query === 'string' ? query.trim() : '';
    if (term.length < 2) return [];
    if (typeof fetchImpl !== 'function') throw new Error('Este navegador no permite buscar iconos en línea');

    const url = new URL('https://api.iconify.design/search');
    url.searchParams.set('query', term);
    url.searchParams.set('limit', '30');
    const response = await fetchImpl(url.toString(), { signal });
    if (!response.ok) throw new Error(`Iconify respondió con el estado ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.icons)) throw new Error('La respuesta de Iconify no tiene el formato esperado');

    const seen = new Set();
    return data.icons
      .filter(icon => typeof icon === 'string' && /^[a-z0-9][a-z0-9_-]*:[a-z0-9][a-z0-9_-]*$/i.test(icon))
      .filter(icon => !seen.has(icon) && seen.add(icon))
      .slice(0, 30)
      .map(icon => {
        const [category, name] = icon.split(':');
        const label = name.replace(/[-_]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
        return {
          id: `iconify:${icon.toLowerCase()}`,
          iconifyId: icon.toLowerCase(),
          label,
          category,
          symbol: null,
        };
      });
  }

  function normalizeDiagram(data, requireMetadata = true) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('El archivo debe contener un objeto JSON de ArqSketch');
    }
    if (requireMetadata && (data.app !== 'ArqSketch' || data.version !== 1)) {
      throw new Error('El archivo no es un diagrama ArqSketch compatible (versión 1)');
    }
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new Error('El JSON debe incluir las listas "nodes" y "edges"');
    }
    if (requireMetadata && data.nodes.length > MAX_NODES) {
      throw new Error(`El diagrama supera el límite de ${MAX_NODES} componentes`);
    }
    if (requireMetadata && data.edges.length > MAX_EDGES) {
      throw new Error(`El diagrama supera el límite de ${MAX_EDGES} conexiones`);
    }

    let id = 1;
    const nextId = (prefix) => `${prefix}-${String(id++).padStart(3, '0')}`;
    const nodeIds = new Map();
    const seenNodeIds = new Set();
    const nodes = data.nodes.map((node, index) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        throw new Error(`El componente ${index + 1} no es válido`);
      }
      if (typeof node.id !== 'string' || !node.id.trim() || node.id.length > 100 || seenNodeIds.has(node.id)) {
        throw new Error(`El identificador del componente ${index + 1} falta, es duplicado o no es válido`);
      }
      if (!TYPES.includes(node.type)) throw new Error(`Tipo de componente no reconocido en "${node.name || index + 1}"`);
      const icon = node.icon === undefined || node.icon === null || node.icon === '' ? 'auto' : node.icon;
      if (typeof icon !== 'string' || (!Object.hasOwn(ICONS, icon) && !iconifyParts(icon))) {
        throw new Error(`Icono no reconocido en "${node.name || index + 1}"`);
      }
      if (typeof node.name !== 'string' || !node.name.trim() || node.name.trim().length > 50) {
        throw new Error(`El nombre del componente ${index + 1} debe tener entre 1 y 50 caracteres`);
      }
      if (node.description !== undefined && node.description !== null &&
          (typeof node.description !== 'string' || node.description.length > 240)) {
        throw new Error(`La descripción de "${node.name}" supera el límite de 240 caracteres`);
      }
      for (const coordinate of ['x', 'y']) {
        if (typeof node[coordinate] !== 'number' || !Number.isFinite(node[coordinate]) ||
            Math.abs(node[coordinate]) > MAX_COORDINATE) {
          throw new Error(`La posición ${coordinate.toUpperCase()} de "${node.name}" no es válida`);
        }
      }
      const size = {};
      for (const [dimension, min, max] of [
        ['width', MIN_NODE_WIDTH, MAX_NODE_WIDTH],
        ['height', MIN_NODE_HEIGHT, MAX_NODE_HEIGHT],
      ]) {
        if (node[dimension] !== undefined) {
          if (typeof node[dimension] !== 'number' || !Number.isFinite(node[dimension]) ||
              node[dimension] < min || node[dimension] > max) {
            throw new Error(`El tamaño ${dimension === 'width' ? 'horizontal' : 'vertical'} de "${node.name}" no es válido`);
          }
          size[dimension] = Math.round(node[dimension]);
        }
      }
      seenNodeIds.add(node.id);
      const safeId = nextId('cmp');
      nodeIds.set(node.id, safeId);
      return {
        id: safeId,
        type: node.type,
        name: node.name.trim(),
        description: node.description || '',
        details: normalizeDetails(node.type, node.details, node.name),
        icon,
        x: requireMetadata ? Math.round(node.x) : node.x,
        y: requireMetadata ? Math.round(node.y) : node.y,
        ...size,
      };
    });

    if (data.shapes !== undefined && (!Array.isArray(data.shapes) || data.shapes.length > MAX_SHAPES)) {
      throw new Error(`La lista de figuras no es válida (máximo ${MAX_SHAPES})`);
    }
    const entityIds = new Map(nodeIds);
    const seenShapeIds = new Set();
    const shapes = (data.shapes || []).map((shape, index) => {
      if (!shape || typeof shape !== 'object' || Array.isArray(shape) ||
          typeof shape.id !== 'string' || !shape.id.trim() || shape.id.length > 100 ||
          seenShapeIds.has(shape.id) || entityIds.has(shape.id)) {
        throw new Error(`La figura ${index + 1} no es válida`);
      }
      if (!['rectangle', 'ellipse'].includes(shape.type) ||
          typeof shape.title !== 'string' || shape.title.length > 80 ||
          typeof shape.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(shape.color)) {
        throw new Error(`Las propiedades de la figura ${index + 1} no son válidas`);
      }
      for (const coordinate of ['x', 'y']) {
        if (typeof shape[coordinate] !== 'number' || !Number.isFinite(shape[coordinate]) ||
            Math.abs(shape[coordinate]) > MAX_COORDINATE) {
          throw new Error(`La posición ${coordinate.toUpperCase()} de la figura ${index + 1} no es válida`);
        }
      }
      for (const [dimension, min, max] of [['width', 140, 2000], ['height', 100, 1600]]) {
        if (typeof shape[dimension] !== 'number' || !Number.isFinite(shape[dimension]) ||
            shape[dimension] < min || shape[dimension] > max) {
          throw new Error(`El tamaño de la figura ${index + 1} no es válido`);
        }
      }
      seenShapeIds.add(shape.id);
      const safeId = nextId('grp');
      entityIds.set(shape.id, safeId);
      return {
        id: safeId,
        type: shape.type,
        title: shape.title,
        color: shape.color,
        x: requireMetadata ? Math.round(shape.x) : shape.x,
        y: requireMetadata ? Math.round(shape.y) : shape.y,
        width: Math.round(shape.width),
        height: Math.round(shape.height),
      };
    });

    const seenEdgeIds = new Set();
    const seenPairs = new Set();
    const edges = data.edges.map((edge, index) => {
      if (!edge || typeof edge !== 'object' || Array.isArray(edge)) {
        throw new Error(`La conexión ${index + 1} no es válida`);
      }
      if (typeof edge.id !== 'string' || !edge.id.trim() || edge.id.length > 100 || seenEdgeIds.has(edge.id)) {
        throw new Error(`El identificador de la conexión ${index + 1} falta, es duplicado o no es válido`);
      }
      if (typeof edge.from !== 'string' || typeof edge.to !== 'string' ||
          !entityIds.has(edge.from) || !entityIds.has(edge.to)) {
        throw new Error(`La conexión ${index + 1} apunta a un componente inexistente`);
      }
      if (edge.from === edge.to) throw new Error(`La conexión ${index + 1} no puede apuntar al mismo componente`);
      const pair = `${edge.from}\u0000${edge.to}`;
      if (seenPairs.has(pair)) throw new Error(`La conexión ${index + 1} está duplicada`);
      if (edge.label !== undefined && edge.label !== null &&
          (typeof edge.label !== 'string' || edge.label.length > 120)) {
        throw new Error(`La etiqueta de la conexión ${index + 1} supera el límite de 120 caracteres`);
      }
      const direction = edge.direction === undefined ? 'forward' : edge.direction;
      const style = edge.style === undefined ? 'solid' : edge.style;
      const connectionType = edge.connectionType === undefined ? 'general' : edge.connectionType;
      if (!EDGE_DIRECTIONS.includes(direction)) {
        throw new Error(`El sentido de la conexión ${index + 1} no es válido`);
      }
      if (!EDGE_STYLES.includes(style)) {
        throw new Error(`El estilo de la conexión ${index + 1} no es válido`);
      }
      if (!EDGE_TYPES.includes(connectionType)) {
        throw new Error(`El tipo de comunicación de la conexión ${index + 1} no es válido`);
      }
      let via;
      if (edge.via !== undefined) {
        if (!edge.via || typeof edge.via !== 'object' || Array.isArray(edge.via) ||
            !Number.isFinite(edge.via.x) || !Number.isFinite(edge.via.y) ||
            Math.abs(edge.via.x) > MAX_COORDINATE || Math.abs(edge.via.y) > MAX_COORDINATE) {
          throw new Error(`El punto de control de la conexión ${index + 1} no es válido`);
        }
        via = { x: edge.via.x, y: edge.via.y };
      }
      const anchors = {};
      for (const [key, anchor] of [['fromAnchor', edge.fromAnchor], ['toAnchor', edge.toAnchor]]) {
        if (anchor === undefined) continue;
        if (!anchor || typeof anchor !== 'object' || Array.isArray(anchor) ||
            !['top', 'right', 'bottom', 'left'].includes(anchor.side) ||
            !Number.isFinite(anchor.offset) || anchor.offset < 0 || anchor.offset > 1) {
          throw new Error(`El punto de conexión ${index + 1} no es válido`);
        }
        anchors[key] = { side: anchor.side, offset: anchor.offset };
      }
      seenEdgeIds.add(edge.id);
      seenPairs.add(pair);
      return {
        id: nextId('con'),
        from: entityIds.get(edge.from),
        to: entityIds.get(edge.to),
        label: edge.label || '',
        direction,
        style,
        connectionType,
        ...(via ? { via } : {}),
        ...anchors,
      };
    });

    return { nodes, edges, shapes, nextId: id };
  }

  return {
    AUTH_METHODS,
    DETAIL_FIELDS,
    EDGE_DIRECTIONS,
    EDGE_STYLES,
    EDGE_TYPES,
    ENDPOINT_ACCESS,
    HTTP_METHODS,
    ICONS,
    NODE_SIZE,
    createDefaultDetails,
    iconifyParts,
    iconifyUrl,
    normalizeDiagram,
    searchIcons,
    searchIconify,
  };
});
