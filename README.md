# Taller de diseño

Portal local que reúne herramientas de diseño en aplicaciones independientes.

## Herramientas

- **Diseñador de bases de datos** — disponible en `apps/database-designer/`. Diseña esquemas relacionales, trabaja con SQL y exporta el modelo.
- **Diagramas de arquitectura (ArqSketch)** — herramienta independiente para diagramar aplicaciones y sistemas en `apps/architecture-designer/`.

Abre `index.html` para acceder al portal o directamente `apps/database-designer/index.html` para iniciar el diseñador de bases de datos. Ambas opciones funcionan sin servidor en un navegador moderno.

## Extensión para VS Code

La extensión abre DB Designer y ArqSketch en paneles Webview y añade el contenedor **Diseñadores** a la barra de actividad. Dentro de esa vista, selecciona una app para abrirla; también están disponibles los comandos **DB Designer: Abrir diseñador** y **ArqSketch: Abrir diagramador** desde la paleta de comandos.

Para generar el instalador `.vsix`, ejecuta desde la raíz del proyecto:

```sh
npx --yes @vscode/vsce package --allow-missing-repository
```

El archivo `db-designer-tools-1.0.0.vsix` resultante se instala desde VS Code con **Extensions: Install from VSIX...** o con `code --install-extension db-designer-tools-1.0.0.vsix`. Para probar durante el desarrollo, abre este proyecto en VS Code y pulsa `F5`.

La extensión permite usar los flujos existentes de las apps; las búsquedas de iconos de Iconify requieren conexión a Internet.

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
extension.js                  Entrada de la extensión para VS Code
media/                        Iconos de la barra de actividad y los Webviews
```

Cada aplicación conserva su propia interfaz, lógica y pruebas. Los módulos solo se moverán a `shared/` cuando exista una necesidad concreta y común.
