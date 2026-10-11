/*
 * docs.js — Generación de documentación Markdown desde un modelo.
 * Funciona como script clásico y como módulo CommonJS para pruebas.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DBDocs = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const escapeCell = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
  const code = (value) => `\`${escapeCell(value).replace(/`/g, '&#96;')}\``;
  const constraints = (field) => [
    field.pk && 'PK',
    field.fk && 'FK',
    field.nn && 'NOT NULL',
    field.uq && 'UNIQUE',
    field.ai && 'AUTOINCREMENT',
    field.defaultValue !== null && field.defaultValue !== undefined && `DEFAULT ${field.defaultValue}`,
  ].filter(Boolean).join(', ') || '—';

  function generateMarkdown(model, dialect = 'mysql') {
    const tableById = new Map(model.tables.map((table) => [table.id, table]));
    const fieldById = (table, id) => table && table.fields.find((field) => field.id === id);
    const lines = [
      '# Documentación del esquema',
      '',
      `**Motor SQL:** ${String(dialect).toUpperCase()}`,
      `**Tablas:** ${model.tables.length}  `,
      `**Relaciones:** ${model.relations.length}`,
      '',
      '## Índice',
      ...model.tables.map((table) => `- [${escapeCell(table.name)}](#${table.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')})`),
      '',
      '## Tablas',
    ];
    if (!model.tables.length) lines.push('', 'No hay tablas en el modelo.');
    for (const table of model.tables) {
      lines.push(
        '',
        `### ${escapeCell(table.name)}`,
        '',
        table.junction ? 'Tabla puente para una relación N:M.' : '',
        '',
        '| Campo | Tipo | Restricciones | Descripción |',
        '|---|---|---|---|',
        ...table.fields.map((field) =>
          `| ${code(field.name)} | ${escapeCell(field.type)} | ${escapeCell(constraints(field))} | ${escapeCell(field.description || '—')} |`
        ),
      );
    }
    lines.push('', '## Relaciones', '');
    if (!model.relations.length) lines.push('No hay relaciones definidas.');
    for (const relation of model.relations) {
      const source = tableById.get(relation.sourceTable);
      const target = tableById.get(relation.targetTable);
      const sourceField = fieldById(source, relation.sourceField);
      const targetField = fieldById(target, relation.targetField);
      if (!source || !target || !sourceField || !targetField) continue;
      lines.push(
        `- **${relation.group ? 'N:M vía tabla puente' : relation.type}:** ${code(`${source.name}.${sourceField.name}`)} → ${code(`${target.name}.${targetField.name}`)} (ON DELETE ${relation.onDelete}, ON UPDATE ${relation.onUpdate})`,
      );
    }
    lines.push('');
    return lines.filter((line, index, all) => !(line === '' && all[index - 1] === '')).join('\n');
  }

  return { generateMarkdown };
});
