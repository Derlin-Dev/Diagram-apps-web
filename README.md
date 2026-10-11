# Taller de diseño

Portal local que reúne herramientas de diseño en aplicaciones independientes.

## Herramientas

- **Diseñador de bases de datos** — disponible en [`apps/database-designer/`](./apps/database-designer/). Diseña esquemas relacionales, trabaja con SQL y exporta el modelo.
- **Diagramas de arquitectura (ArqSketch)** — herramienta independiente para diagramar aplicaciones y sistemas en [`apps/architecture-designer/`](./apps/architecture-designer/).

Abre `index.html` para acceder al portal o directamente `apps/database-designer/index.html` para iniciar el diseñador de bases de datos. Ambas opciones funcionan sin servidor en un navegador moderno.

## Desarrollo

No hay dependencias de ejecución. Se requiere Node.js 18 o superior para las pruebas:

```sh
npm test
```

La estructura está organizada por aplicación:

```text
index.html                    Portal de herramientas
home.css                      Estilos del portal
shared/visual-theme.css       Tokens visuales compartidos (paleta y tipografía)
apps/
  database-designer/          Aplicación existente de diseño relacional
    index.html
    styles.css
    js/
    tests/
  architecture-designer/      ArqSketch, diagramador de arquitectura
    index.html
    styles.css
    js/
package.json                  Comandos de desarrollo y pruebas
```

Cada aplicación conserva su propia interfaz, lógica y pruebas. Los módulos solo se moverán a `shared/` cuando exista una necesidad concreta y común.
