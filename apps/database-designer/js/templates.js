/*
 * templates.js — Plantillas de inicio, convertidas al formato normal del modelo.
 * Funciona como script clásico y como módulo CommonJS para pruebas.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DBTemplates = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const definitions = [
    {
      id: 'blog', name: 'Blog', description: 'Autores, publicaciones y comentarios.',
      tables: [
        { name: 'usuarios', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['nombre', 'VARCHAR(255)', { nn: true }], ['email', 'VARCHAR(255)', { uq: true, nn: true }]] },
        { name: 'publicaciones', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['autor_id', 'INT', { nn: true }], ['titulo', 'VARCHAR(255)', { nn: true }], ['contenido', 'TEXT'], ['creado_en', 'DATETIME', { nn: true, defaultValue: 'CURRENT_TIMESTAMP' }]] },
        { name: 'comentarios', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['publicacion_id', 'INT', { nn: true }], ['autor_id', 'INT', { nn: true }], ['contenido', 'TEXT', { nn: true }]] },
      ],
      relations: [['usuarios', 'id', 'publicaciones', 'autor_id'], ['publicaciones', 'id', 'comentarios', 'publicacion_id'], ['usuarios', 'id', 'comentarios', 'autor_id']],
    },
    {
      id: 'store', name: 'Tienda en línea', description: 'Clientes, productos, pedidos y sus detalles.',
      tables: [
        { name: 'clientes', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['nombre', 'VARCHAR(255)', { nn: true }], ['email', 'VARCHAR(255)', { uq: true, nn: true }]] },
        { name: 'productos', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['nombre', 'VARCHAR(255)', { nn: true }], ['precio', 'DECIMAL(10,2)', { nn: true, defaultValue: '0.00' }], ['activo', 'BOOLEAN', { nn: true, defaultValue: 'true' }]] },
        { name: 'pedidos', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['cliente_id', 'INT', { nn: true }], ['fecha', 'DATETIME', { nn: true, defaultValue: 'CURRENT_TIMESTAMP' }]] },
        { name: 'detalle_pedido', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['pedido_id', 'INT', { nn: true }], ['producto_id', 'INT', { nn: true }], ['cantidad', 'INT', { nn: true, defaultValue: '1' }], ['precio_unitario', 'DECIMAL(10,2)', { nn: true }]] },
      ],
      relations: [['clientes', 'id', 'pedidos', 'cliente_id'], ['pedidos', 'id', 'detalle_pedido', 'pedido_id'], ['productos', 'id', 'detalle_pedido', 'producto_id']],
    },
    {
      id: 'crm', name: 'CRM', description: 'Empresas, contactos, oportunidades y actividades.',
      tables: [
        { name: 'empresas', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['nombre', 'VARCHAR(255)', { nn: true }], ['sitio_web', 'VARCHAR(255)']] },
        { name: 'contactos', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['empresa_id', 'INT'], ['nombre', 'VARCHAR(255)', { nn: true }], ['email', 'VARCHAR(255)'], ['telefono', 'VARCHAR(255)']] },
        { name: 'oportunidades', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['contacto_id', 'INT', { nn: true }], ['titulo', 'VARCHAR(255)', { nn: true }], ['valor', 'DECIMAL(10,2)', { defaultValue: '0.00' }], ['estado', 'VARCHAR(255)', { nn: true, defaultValue: 'nuevo' }]] },
        { name: 'actividades', fields: [['id', 'INT', { pk: true, nn: true, ai: true }], ['contacto_id', 'INT', { nn: true }], ['tipo', 'VARCHAR(255)', { nn: true }], ['descripcion', 'TEXT'], ['programada_en', 'DATETIME']] },
      ],
      relations: [['empresas', 'id', 'contactos', 'empresa_id'], ['contactos', 'id', 'oportunidades', 'contacto_id'], ['contactos', 'id', 'actividades', 'contacto_id']],
    },
  ];

  function listTemplates() {
    return definitions.map(({ id, name, description }) => ({ id, name, description }));
  }

  function createTemplate(templateId, makeId) {
    if (typeof makeId !== 'function') throw new Error('Se requiere una función para generar identificadores');
    const definition = definitions.find((item) => item.id === templateId);
    if (!definition) throw new Error('Plantilla no encontrada');
    const tables = definition.tables.map((source, index) => ({
      id: makeId('t'),
      name: source.name,
      x: 50 + (index % 2) * 330,
      y: 50 + Math.floor(index / 2) * 290,
      color: ['#1684e8', '#07865f', '#8548d9', '#e87917'][index % 4],
      junction: null,
      fields: source.fields.map(([name, type, options = {}]) => ({
        id: makeId('f'),
        name,
        type,
        description: '',
        defaultValue: options.defaultValue ?? null,
        pk: !!options.pk,
        nn: !!options.nn || !!options.pk,
        ai: !!options.ai,
        uq: !!options.uq,
        fk: false,
      })),
    }));
    const byName = new Map(tables.map((table) => [table.name, table]));
    const relations = definition.relations.map(([sourceTable, sourceField, targetTable, targetField]) => {
      const source = byName.get(sourceTable), target = byName.get(targetTable);
      const sourceColumn = source.fields.find((field) => field.name === sourceField);
      const targetColumn = target.fields.find((field) => field.name === targetField);
      targetColumn.fk = true;
      return {
        id: makeId('r'),
        type: '1:N',
        sourceTable: source.id,
        sourceField: sourceColumn.id,
        targetTable: target.id,
        targetField: targetColumn.id,
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
        created: false,
        uqAdded: false,
        group: null,
      };
    });
    return { version: 2, dialect: 'mysql', tables, relations };
  }

  return { listTemplates, createTemplate };
});
