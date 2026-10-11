const test = require('node:test');
const assert = require('node:assert/strict');
const { generateMarkdown } = require('../js/docs.js');
const { createTemplate, listTemplates } = require('../js/templates.js');
const { sanitizeModel, validateModel } = require('../js/model.js');

let id = 9000;
const makeId = (prefix) => prefix + id++;

test('plantillas producen modelos completos, con ids únicos y relaciones válidas', () => {
  const templates = listTemplates();
  assert.deepEqual(templates.map(({ id }) => id), ['blog', 'store', 'crm']);
  for (const template of templates) {
    const model = sanitizeModel(createTemplate(template.id, makeId), makeId);
    assert.ok(model.tables.length >= 3);
    assert.ok(model.relations.length >= 2);
    assert.deepEqual(validateModel(model), []);
    const ids = [
      ...model.tables.map((table) => table.id),
      ...model.tables.flatMap((table) => table.fields.map((field) => field.id)),
      ...model.relations.map((relation) => relation.id),
    ];
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('exporta documentación Markdown con descripciones, defaults, restricciones y relaciones', () => {
  const model = createTemplate('blog', makeId);
  model.tables[0].fields[1].description = 'Nombre | visible\npara el equipo';
  const markdown = generateMarkdown(model, 'postgres');
  assert.match(markdown, /\*\*Motor SQL:\*\* POSTGRES/);
  assert.match(markdown, /Nombre \\| visible<br>para el equipo/);
  assert.match(markdown, /DEFAULT CURRENT_TIMESTAMP/);
  assert.match(markdown, /ON DELETE NO ACTION/);
  assert.match(markdown, /## Relaciones/);
});

