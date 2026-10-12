const test = require('node:test');
const assert = require('node:assert/strict');
const { iconifyParts, iconifyUrl, normalizeDiagram, searchIcons, searchIconify } = require('../js/diagram.js');
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
    x: -120,
    y: 40,
    width: 420,
    height: 290,
  }, {
    id: 'group-database',
    type: 'rectangle',
    title: 'Datos',
    color: '#4fd7b7',
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
    x: -120,
    y: 40,
    width: 420,
    height: 290,
  }, {
    id: 'grp-004',
    type: 'rectangle',
    title: 'Datos',
    color: '#4fd7b7',
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
