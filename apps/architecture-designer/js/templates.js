(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArqSketchTemplates = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const templates = [
    {
      id: 'web-app',
      name: 'Aplicación web',
      description: 'Usuario, frontend, API y base de datos.',
      file: 'web-app.json',
    },
    {
      id: 'microservices',
      name: 'Microservicios',
      description: 'Gateway, servicios de pedidos y pagos, cola y almacenamiento.',
      file: 'microservices.json',
    },
    {
      id: 'serverless',
      name: 'Arquitectura serverless',
      description: 'Frontend, API gestionada, funciones, almacenamiento y servicio externo.',
      file: 'serverless.json',
    },
    {
      id: 'commerce-cloud-production',
      name: 'Plataforma cloud de comercio',
      description: 'Ejemplo complejo con entorno de producción, zonas de confianza, dominios funcionales y recursos cloud y de red.',
      file: 'commerce-cloud-production.json',
    },
  ];

  async function readTemplateFile(filename) {
    if (typeof module === 'object' && module.exports) {
      const fs = require('node:fs/promises');
      const path = require('node:path');
      return fs.readFile(path.join(__dirname, '..', 'examples', 'templates', filename), 'utf8');
    }

    const url = new URL(`./examples/templates/${encodeURIComponent(filename)}`, document.baseURI);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    return response.text();
  }

  function listTemplates() {
    return templates.map(({ id, name, description }) => ({ id, name, description }));
  }

  async function createTemplate(id) {
    const template = templates.find(item => item.id === id);
    if (!template) throw new Error('Plantilla de arquitectura no encontrada');
    const contents = await readTemplateFile(template.file);
    return JSON.parse(contents);
  }

  return { listTemplates, createTemplate };
});
