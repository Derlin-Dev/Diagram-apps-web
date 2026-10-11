# ArqSketch — Diagramador de aplicaciones

Aplicación web independiente para diagramar arquitecturas de aplicaciones y sistemas.

Comparte la paleta y los tokens tipográficos de `../../shared/visual-theme.css`; sus estilos funcionales permanecen locales.

## Ejecutar

Abre `index.html` en un navegador moderno o accede desde el portal principal (`../../index.html`). No requiere instalación ni servidor. También puede servirse con cualquier servidor estático.

## Funciones

- Añadir y mover componentes de frontend, backend/API, base de datos, servicios externos, nube y usuarios.
- Editar nombre, descripción e icono de los componentes; buscar en el catálogo integrado o en Iconify por tecnología, colección o concepto (por ejemplo, React, PostgreSQL o cola); crear y eliminar conexiones.
- Completar propiedades específicas para frontend, API, base de datos, servicios, nube y usuarios. En las API se pueden documentar varias rutas, método HTTP, visibilidad y autenticación requerida.
- Organizar el panel Propiedades en grupos plegables de información general, icono y configuración específica para acceder rápidamente a los campos que se necesitan.
- Consultar en las tarjetas del lienzo un resumen de esas propiedades y los primeros endpoints de cada API.
- Cambiar el ancho de Biblioteca y Propiedades arrastrando sus divisores; los anchos quedan guardados en el navegador. Propiedades inicia con 340 px y permite un mínimo de 320 px para facilitar la lectura.
- Cambiar por separado el ancho y alto de una tarjeta desde su esquina inferior derecha. Las dimensiones (190–640 px de ancho y 130–600 px de alto) se guardan en el diagrama y viajan en su JSON.
- Usar la plantilla de arquitectura de ejemplo, el zoom y la cuadrícula.
- Alternar entre las pestañas Diagrama y JSON para inspeccionar en tiempo real el formato actual del proyecto y copiarlo al portapapeles.
- Colocar componentes sin solaparlos al añadirlos desde la biblioteca; al arrastrarlos, se insertan cerca del punto de soltado.
- Mover el lienzo arrastrando el fondo, acercar/alejar con la rueda y encuadrar todos los componentes con el botón de ajuste.
- Editar la etiqueta o protocolo de una conexión desde el panel Propiedades.
- Deshacer y rehacer cambios con los botones o con `Ctrl+Z`, `Ctrl+Y` y `Ctrl+Mayús+Z`.
- Copiar, pegar y duplicar componentes o grupos con sus conexiones internas mediante `Ctrl/Cmd+C`, `Ctrl/Cmd+V` y `Ctrl/Cmd+D`.
- Abrir acciones contextuales con clic derecho sobre componentes y conexiones.
- Seleccionar varios componentes con `Ctrl/Cmd+clic` o arrastrando un marco con `Mayús`; moverlos juntos, alinearlos y distribuirlos horizontal o verticalmente.
- Guardar automáticamente en el navegador, abrir diagramas JSON de ArqSketch y exportar a JSON o SVG.
- Al abrir un JSON, validar su estructura y confirmar antes de reemplazar un diagrama existente.

## Datos independientes

ArqSketch conserva su propio formato JSON (`app: "ArqSketch"`, `version: 1`, `nodes`, `edges`) y usa la clave local `arqsketch-state`. DB Designer conserva su modelo relacional, su formato JSON y su propia clave de autoguardado. No comparten ni convierten proyectos automáticamente.

Los archivos JSON importados deben ser de ArqSketch versión 1. La importación admite hasta 300 componentes y 1000 conexiones; un archivo inválido no reemplaza el diagrama actual. El campo opcional `details` guarda la información específica de cada tipo de componente y los diagramas anteriores sin ese campo se siguen abriendo con valores vacíos.
El campo opcional `icon` permite elegir un símbolo integrado o un icono de Iconify por componente; los diagramas anteriores que no lo incluyen conservan el icono predeterminado según su tipo.
La búsqueda remota consulta `https://api.iconify.design` sin clave y requiere conexión a Internet. Si el servicio no está disponible, el catálogo integrado continúa funcionando. Los diagramas guardan el identificador del icono, no su imagen; los SVG exportados con iconos de Iconify referencian la API y requieren conexión para cargar esas imágenes. Los iconos pertenecen a distintas colecciones y pueden tener licencias diferentes; revisa la licencia de cada colección para el uso que necesites.
