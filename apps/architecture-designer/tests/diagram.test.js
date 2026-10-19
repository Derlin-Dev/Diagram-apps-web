const test = require('node:test');
const assert = require('node:assert/strict');
const { iconifyParts, iconifyUrl, normalizeDiagram, searchIcons, searchIconify } = require('../js/diagram.js');
const { createTemplate, listTemplates } = require('../js/templates.js');
const sampleDiagram = require('./fixtures/sample-diagram.json');
const exampleDiagram = require('../ejemplo-diagrama.json');

const validDiagram = () => {
  const diagram = structuredClone(sampleDiagram);
  diagram.nodes[0].name = '  Web  ';
  diagram.nodes[0].x = 10.4;
  return diagram;
};

test('acepta el formato de exportación de ArqSketch', () => {
  const diagram = normalizeDiagram(sampleDiagram);
  assert.equal(diagram.nodes.length, 2);
  assert.equal(diagram.nodes[0].icon, 'auto');
  assert.equal(diagram.nodes[1].icon, 'auto');
  assert.deepEqual(diagram.nodes[1].details, {
    basePath: '',
    runtime: '',
    endpoints: [],
  });
});

test('el JSON de ejemplo usa iconos válidos', () => {
  assert.deepEqual(
    normalizeDiagram(exampleDiagram).nodes.map(node => node.icon),
    ['globe', 'code', 'database'],
  );
});

test('acepta componentes de Redes y Seguridad con sus detalles', () => {
  const data = validDiagram();
  data.nodes.push({
    id: 'cmp-003',
    type: 'security',
    name: 'Redes y Seguridad',
    description: 'Protección de perímetro',
    details: { scope: 'Perimetral', controls: 'WAF y TLS' },
    icon: 'security',
    x: 420,
    y: 180,
  });

  const node = normalizeDiagram(data).nodes[2];
  assert.equal(node.type, 'security');
  assert.equal(node.details.scope, 'Perimetral');
  assert.equal(node.details.controls, 'WAF y TLS');

  data.nodes[2].details.scope = 'Desconocido';
  assert.throws(() => normalizeDiagram(data), /valor de "Alcance de red".*no es válido/);
});

test('conserva los tipos de recursos y remapea su contenedor al normalizar', () => {
  const data = validDiagram();
  data.nodes[0].resourceKind = 'object-storage';
  data.nodes[0].resourceCatalog = 'cloud';
  data.nodes[0].parentGroupId = 'group-cloud';
  data.nodes[0].resourceProvider = 'AWS';
  data.nodes[0].resourceService = 'S3';
  data.shapes = [{
    id: 'group-cloud',
    type: 'rectangle',
    title: 'Producción',
    category: 'domain',
    resourceCatalog: 'cloud',
    color: '#65bfff',
    x: 0,
    y: 0,
    width: 600,
    height: 420,
  }];

  const diagram = normalizeDiagram(data);
  assert.equal(diagram.nodes[0].resourceKind, 'object-storage');
  assert.equal(diagram.nodes[0].resourceCatalog, 'cloud');
  assert.equal(diagram.nodes[0].parentGroupId, diagram.shapes[0].id);
  assert.equal(diagram.nodes[0].resourceProvider, 'AWS');
  assert.equal(diagram.nodes[0].resourceService, 'S3');
  assert.equal(diagram.shapes[0].resourceCatalog, 'cloud');

  const standalone = validDiagram();
  standalone.nodes[0].resourceKind = 'firewall';
  standalone.nodes[0].resourceCatalog = 'network';
  const standaloneDiagram = normalizeDiagram(standalone);
  assert.equal(standaloneDiagram.nodes[0].resourceCatalog, 'network');
  assert.equal(standaloneDiagram.nodes[0].parentGroupId, undefined);

  data.nodes[0].resourceService = 'x'.repeat(101);
  assert.throws(() => normalizeDiagram(data), /datos de pertenencia o tipo de recurso/);
  data.nodes[0].resourceService = 'S3';
  data.nodes[0].resourceCatalog = 'invalid';
  assert.throws(() => normalizeDiagram(data), /datos de pertenencia o tipo de recurso/);
  data.nodes[0].resourceCatalog = 'cloud';
  data.nodes[0].resourceKind = 'unregistered-resource';
  assert.throws(() => normalizeDiagram(data), /tipo de recurso.*no son válidos/);
});

test('rechaza referencias circulares entre contenedores', () => {
  const data = validDiagram();
  data.shapes = [
    {
      id: 'group-a', type: 'rectangle', title: 'A', category: 'general',
      color: '#65bfff', x: 0, y: 0, width: 600, height: 420, parentGroupId: 'group-b',
    },
    {
      id: 'group-b', type: 'rectangle', title: 'B', category: 'general',
      color: '#65bfff', x: 0, y: 0, width: 500, height: 320, parentGroupId: 'group-a',
    },
  ];
  assert.throws(() => normalizeDiagram(data), /referencia circular/);
});

test('conserva las categorías visuales y de límite de los grupos', () => {
  for (const category of ['general', 'domain', 'environment', 'trust-zone']) {
    const data = validDiagram();
    data.shapes = [{
      id: 'group-category',
      type: 'rectangle',
      title: 'Límite',
      category,
      color: '#65bfff',
      x: 0,
      y: 0,
      width: 600,
      height: 420,
    }];
    assert.equal(normalizeDiagram(data).shapes[0].category, category);
  }
});

test('las plantillas de arquitectura se cargan desde JSON y son diagramas válidos', async () => {
  const templates = listTemplates();
  assert.deepEqual(templates.map(template => template.id), [
    'web-app', 'microservices', 'serverless', 'commerce-cloud-production',
  ]);
  for (const template of templates) {
    const diagram = normalizeDiagram(await createTemplate(template.id));
    assert.ok(diagram.nodes.length >= 3);
    assert.ok(diagram.edges.length >= 2);
    assert.equal(new Set([
      ...diagram.nodes.map(node => node.id),
      ...diagram.edges.map(edge => edge.id),
      ...diagram.shapes.map(shape => shape.id),
    ]).size, diagram.nodes.length + diagram.edges.length + diagram.shapes.length);
  }
});

test('la plantilla cloud compleja combina recursos y límites anidados', async () => {
  const diagram = normalizeDiagram(await createTemplate('commerce-cloud-production'));
  assert.equal(diagram.nodes.length, 22);
  assert.equal(diagram.edges.length, 20);
  assert.deepEqual(
    new Set(diagram.shapes.map(shape => shape.category)),
    new Set(['environment', 'trust-zone', 'domain']),
  );
  const shapesByTitle = new Map(diagram.shapes.map(shape => [shape.title, shape]));
  const production = shapesByTitle.get('Producción · AWS us-east-1');
  const privateZone = shapesByTitle.get('Zona privada · VPC');
  const ordersDomain = shapesByTitle.get('Dominio · pedidos y pagos');
  assert.equal(privateZone.parentGroupId, production.id);
  assert.equal(ordersDomain.parentGroupId, privateZone.id);
  const nodesByName = new Map(diagram.nodes.map(node => [node.name, node]));
  assert.equal(nodesByName.get('Función de pedidos').parentGroupId, ordersDomain.id);
  assert.equal(nodesByName.get('Base de pedidos').resourceKind, 'managed-database');
  assert.equal(nodesByName.get('DNS público').resourceKind, 'dns-zone');
  assert.ok(diagram.edges.some(edge => edge.connectionType === 'events'));
  assert.ok(diagram.edges.some(edge => edge.connectionType === 'data'));
});

test('normaliza un diagrama ArqSketch y remapea ids de conexiones', () => {
  const diagram = normalizeDiagram(validDiagram());

  assert.deepEqual(diagram.nodes.map(({ id, name }) => [id, name]), [
    ['cmp-001', 'Web'],
    ['cmp-002', 'API'],
  ]);
  assert.deepEqual(diagram.edges, [{
    id: 'con-003',
    from: 'cmp-001',
    to: 'cmp-002',
    label: 'HTTPS',
    direction: 'forward',
    style: 'solid',
    connectionType: 'general',
  }]);
  assert.equal(diagram.nodes[0].x, 10);
  assert.equal(diagram.nextId, 4);
});

test('conserva el sentido, estilo y tipo de comunicación de las conexiones', () => {
  const data = validDiagram();
  Object.assign(data.edges[0], {
    direction: 'both',
    style: 'dotted',
    connectionType: 'events',
  });

  const edge = normalizeDiagram(data).edges[0];
  assert.equal(edge.direction, 'both');
  assert.equal(edge.style, 'dotted');
  assert.equal(edge.connectionType, 'events');

  data.edges[0].direction = 'sideways';
  assert.throws(() => normalizeDiagram(data), /sentido de la conexión.*no es válido/);
  data.edges[0].direction = 'both';
  data.edges[0].style = 'wavy';
  assert.throws(() => normalizeDiagram(data), /estilo de la conexión.*no es válido/);
  data.edges[0].style = 'dotted';
  data.edges[0].connectionType = 'unknown';
  assert.throws(() => normalizeDiagram(data), /tipo de comunicación.*no es válido/);
});

test('conserva el punto de control desplazable de una conexión y valida sus coordenadas', () => {
  const data = validDiagram();
  data.edges[0].via = { x: 48, y: -32 };
  data.edges[0].fromAnchor = { side: 'right', offset: 0.7 };
  data.edges[0].toAnchor = { side: 'left', offset: 0.3 };
  const diagram = normalizeDiagram(data);
  assert.deepEqual(diagram.edges[0].via, { x: 48, y: -32 });
  assert.deepEqual(diagram.edges[0].fromAnchor, { side: 'right', offset: 0.7 });
  assert.deepEqual(diagram.edges[0].toAnchor, { side: 'left', offset: 0.3 });

  data.edges[0].via.x = Infinity;
  assert.throws(() => normalizeDiagram(data), /punto de control.*no es válido/);

  data.edges[0].via.x = 48;
  data.edges[0].fromAnchor.offset = 1.1;
  assert.throws(() => normalizeDiagram(data), /punto de conexión.*no es válido/);
});

test('conserva y valida los puntos editables de una ruta recta', () => {
  const data = validDiagram();
  data.edges[0].waypoints = [{ x: 120, y: 140 }, { x: 180, y: 220 }];
  assert.deepEqual(normalizeDiagram(data).edges[0].waypoints, data.edges[0].waypoints);

  data.edges[0].waypoints[1].x = Infinity;
  assert.throws(() => normalizeDiagram(data), /puntos de ruta.*no son válidos/);
  data.edges[0].waypoints = Array.from({ length: 51 }, (_, index) => ({ x: index, y: index }));
  assert.throws(() => normalizeDiagram(data), /puntos de ruta.*no son válidos/);
});

test('conserva las capas plegables, posiciones de etiquetas y leyenda personalizada', () => {
  const data = validDiagram();
  data.shapes = [{
    id: 'grp-003',
    type: 'rectangle',
    title: 'Producción',
    category: 'trust-zone',
    collapsed: true,
    color: '#65bfff',
    x: 0,
    y: 0,
    width: 600,
    height: 420,
  }];
  data.edges[0].labelPosition = { x: 180, y: 95 };
  data.legend = [{
    id: 'leg-001',
    label: 'Datos sensibles',
    description: 'Solo tráfico cifrado',
    color: '#54d6b0',
  }];

  const diagram = normalizeDiagram(data);
  assert.equal(diagram.shapes[0].category, 'trust-zone');
  assert.equal(diagram.shapes[0].collapsed, true);
  assert.deepEqual(diagram.edges[0].labelPosition, { x: 180, y: 95 });
  assert.deepEqual(diagram.legend, data.legend);

  data.shapes[0].category = 'unknown';
  assert.throws(() => normalizeDiagram(data), /propiedades de la figura.*no son válidas/);
  data.shapes[0].category = 'trust-zone';
  data.edges[0].labelPosition.x = Infinity;
  assert.throws(() => normalizeDiagram(data), /posición de la etiqueta.*no es válida/);
  data.edges[0].labelPosition.x = 180;
  data.legend[0].color = 'red';
  assert.throws(() => normalizeDiagram(data), /entrada 1 de la leyenda no es válida/);
});

test('conserva detalles específicos y endpoints al importar un diagrama', () => {
  const diagram = validDiagram();
  diagram.nodes[1].details = {
    basePath: 'https://api.ejemplo.com/v1',
    runtime: 'Node.js',
    endpoints: [{
      method: 'GET',
      path: '/usuarios/:id',
      access: 'Privado',
      authRequired: true,
      authMethod: 'JWT / Bearer token',
    }],
  };

  const normalized = normalizeDiagram(diagram);
  assert.deepEqual(normalized.nodes[1].details, diagram.nodes[1].details);
});

test('conserva el tamaño personalizado de las tarjetas e impone límites', () => {
  const diagram = validDiagram();
  diagram.nodes[0].width = 360;
  diagram.nodes[0].height = 240;
  const normalized = normalizeDiagram(diagram);
  assert.equal(normalized.nodes[0].width, 360);
  assert.equal(normalized.nodes[0].height, 240);

  diagram.nodes[0].width = 189;
  assert.throws(() => normalizeDiagram(diagram), /tamaño horizontal.*no es válido/);
  diagram.nodes[0].width = 360;
  diagram.nodes[0].height = 601;
  assert.throws(() => normalizeDiagram(diagram), /tamaño vertical.*no es válido/);
});

test('crea valores iniciales y rechaza campos de detalles incompatibles', () => {
  const diagram = validDiagram();
  diagram.nodes[0].details = { basePath: '/v1' };
  assert.throws(() => normalizeDiagram(diagram), /campos no compatibles/);

  diagram.nodes[0].details = { platform: 'Consola' };
  assert.throws(() => normalizeDiagram(diagram), /no es válido/);
});

test('valida los métodos, rutas y reglas de autenticación de endpoints', () => {
  const diagram = validDiagram();
  diagram.nodes[1].details = {
    endpoints: [{
      method: 'TRACE',
      path: '/usuarios',
      access: 'Privado',
      authRequired: true,
      authMethod: 'JWT / Bearer token',
    }],
  };
  assert.throws(() => normalizeDiagram(diagram), /endpoint 1.*no es válido/);

  diagram.nodes[1].details.endpoints[0].method = 'GET';
  diagram.nodes[1].details.endpoints[0].authRequired = 'true';
  assert.throws(() => normalizeDiagram(diagram), /endpoint 1.*no es válido/);
});

test('rechaza JSON de otra aplicación o versión', () => {
  const diagram = validDiagram();
  diagram.app = 'DB Designer';
  assert.throws(() => normalizeDiagram(diagram), /no es un diagrama ArqSketch compatible/);
});

test('rechaza tipos de componentes desconocidos', () => {
  const diagram = validDiagram();
  diagram.nodes[0].type = 'script';
  assert.throws(() => normalizeDiagram(diagram), /Tipo de componente no reconocido/);
});

test('conserva iconos integrados y rechaza iconos no reconocidos', () => {
  const diagram = validDiagram();
  diagram.nodes[0].icon = 'security';
  assert.equal(normalizeDiagram(diagram).nodes[0].icon, 'security');

  diagram.nodes[0].icon = 'external-image';
  assert.throws(() => normalizeDiagram(diagram), /Icono no reconocido/);

  diagram.nodes[0].icon = 'iconify:logos:react';
  assert.equal(normalizeDiagram(diagram).nodes[0].icon, 'iconify:logos:react');
  diagram.nodes[0].icon = 'iconify:javascript:alert/evil';
  assert.throws(() => normalizeDiagram(diagram), /Icono no reconocido/);
});

test('genera URLs de Iconify solo para identificadores válidos', () => {
  assert.equal(
    iconifyUrl('iconify:logos:react'),
    'https://api.iconify.design/logos/react.svg?color=%23dce3f2',
  );
  assert.deepEqual(iconifyParts('iconify:mdi:database-outline'), { prefix: 'mdi', name: 'database-outline' });
  assert.equal(iconifyUrl('https://example.com/icon.svg'), null);
});

test('busca en Iconify y filtra identificadores que no sean iconos válidos', async () => {
  let requestUrl;
  const results = await searchIconify('React & UI', undefined, async url => {
    requestUrl = new URL(url);
    return {
      ok: true,
      json: async () => ({
        icons: ['logos:react', 'mdi:react', 'javascript:alert/evil', '../bad:icon', 'logos:react'],
      }),
    };
  });

  assert.equal(requestUrl.origin, 'https://api.iconify.design');
  assert.equal(requestUrl.pathname, '/search');
  assert.equal(requestUrl.searchParams.get('query'), 'React & UI');
  assert.equal(requestUrl.searchParams.get('limit'), '30');
  assert.deepEqual(results.map(icon => icon.id), ['iconify:logos:react', 'iconify:mdi:react']);
});

test('busca tecnologias, categorias y palabras clave sin distinguir mayúsculas', () => {
  assert.deepEqual(searchIcons('rEaCt').map(icon => icon.id), ['react', 'nextjs']);
  assert.deepEqual(searchIcons('sql').map(icon => icon.id), ['postgresql', 'mysql', 'sqlite']);
  assert.deepEqual(searchIcons('cola').map(icon => icon.id), ['flow', 'kafka', 'rabbitmq']);
  assert.deepEqual(searchIcons('no existe'), []);
});

test('rechaza conexiones con referencias inexistentes', () => {
  const diagram = validDiagram();
  diagram.edges[0].to = 'missing-node';
  assert.throws(() => normalizeDiagram(diagram), /componente inexistente/);
});

test('rechaza posiciones no finitas y nombres vacíos', () => {
  const invalidPosition = validDiagram();
  invalidPosition.nodes[0].x = Infinity;
  assert.throws(() => normalizeDiagram(invalidPosition), /posición X/);

  const invalidName = validDiagram();
  invalidName.nodes[0].name = '   ';
  assert.throws(() => normalizeDiagram(invalidName), /nombre del componente/);
});

test('admite coordenadas negativas para componentes y valida los límites absolutos', () => {
  const diagram = validDiagram();
  diagram.nodes[0].x = -240;
  diagram.nodes[0].y = -80;
  const normalized = normalizeDiagram(diagram);
  assert.equal(normalized.nodes[0].x, -240);
  assert.equal(normalized.nodes[0].y, -80);

  diagram.nodes[0].x = -100001;
  assert.throws(() => normalizeDiagram(diagram), /posición X/);
});

test('normaliza figuras de agrupación junto con el diagrama', () => {
  const diagram = validDiagram();
  diagram.shapes = [{
    id: 'group-original',
    type: 'ellipse',
    title: 'Servicios',
    color: '#65bfff',
    category: 'general',
    collapsed: false,
    x: -120,
    y: 40,
    width: 420,
    height: 290,
  }, {
    id: 'group-database',
    type: 'rectangle',
    title: 'Datos',
    color: '#4fd7b7',
    category: 'general',
    collapsed: false,
    x: 360,
    y: 40,
    width: 320,
    height: 240,
  }];
  diagram.edges.push({
    id: 'edge-groups',
    from: 'group-original',
    to: 'group-database',
    label: 'comunicación interna',
  }, {
    id: 'edge-mixed',
    from: 'group-original',
    to: diagram.nodes[0].id,
    label: 'contiene',
  });

  const normalized = normalizeDiagram(diagram);
  assert.deepEqual(normalized.shapes, [{
    id: 'grp-003',
    type: 'ellipse',
    title: 'Servicios',
    color: '#65bfff',
    category: 'general',
    collapsed: false,
    x: -120,
    y: 40,
    width: 420,
    height: 290,
  }, {
    id: 'grp-004',
    type: 'rectangle',
    title: 'Datos',
    color: '#4fd7b7',
    category: 'general',
    collapsed: false,
    x: 360,
    y: 40,
    width: 320,
    height: 240,
  }]);
  assert.deepEqual(normalized.edges[1], {
    id: 'con-006',
    from: 'grp-003',
    to: 'grp-004',
    label: 'comunicación interna',
    direction: 'forward',
    style: 'solid',
    connectionType: 'general',
  });
  assert.deepEqual(normalized.edges[2], {
    id: 'con-007',
    from: 'grp-003',
    to: 'cmp-001',
    label: 'contiene',
    direction: 'forward',
    style: 'solid',
    connectionType: 'general',
  });
  assert.equal(normalized.nextId, 8);

  diagram.shapes[0].color = 'red';
  assert.throws(() => normalizeDiagram(diagram), /propiedades de la figura/);
  diagram.shapes[0].color = '#65bfff';
  diagram.shapes[0].width = 139;
  assert.throws(() => normalizeDiagram(diagram), /tamaño de la figura/);
  diagram.shapes[0].width = 420;
  diagram.edges[1].to = 'missing-group';
  assert.throws(() => normalizeDiagram(diagram), /componente inexistente/);
});

test('permite normalizar el estado local sin cabecera de exportación', () => {
  const { app, version, ...localState } = validDiagram();
  assert.equal(normalizeDiagram(localState, false).nodes.length, 2);
});
