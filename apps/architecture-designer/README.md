# ArqSketch — Diagramador de aplicaciones

Aplicación web independiente para diagramar arquitecturas de aplicaciones y sistemas.

Comparte la paleta y los tokens tipográficos de `../../shared/visual-theme.css`; sus estilos funcionales permanecen locales.

## Ejecutar

Abre `index.html` en un navegador moderno o accede desde el portal principal (`../../index.html`). No requiere instalación ni servidor. También puede servirse con cualquier servidor estático.

## Funciones

- Añadir y mover componentes de frontend, backend/API, base de datos, servicios externos, nube y usuarios.
- Editar nombre, descripción e icono de los componentes; buscar en el catálogo integrado o en Iconify por tecnología, colección o concepto (por ejemplo, React, PostgreSQL o cola); crear y eliminar conexiones.
- Completar propiedades específicas para frontend, API, base de datos, servicios, nube y usuarios. En las API se pueden documentar varias rutas, método HTTP, visibilidad y autenticación requerida.
- Organizar el panel Propiedades en grupos plegables de información general, icono y configuración específica; en las API, separar la configuración del servicio de la lista de endpoints.
- Desplazarse por todas las propiedades en un área de scroll propia, con el encabezado y las acciones inferiores del panel siempre visibles; al agregar un endpoint, el panel lo lleva a la vista.
- Consultar en las tarjetas del lienzo un resumen de esas propiedades y los primeros endpoints de cada API.
- Leer las tarjetas con mayor tamaño base de tipografía e iconos; las tarjetas siguen siendo redimensionables para adaptarse al espacio y al nivel de detalle.
- Cambiar el ancho de Biblioteca y Propiedades arrastrando sus divisores; los anchos quedan guardados en el navegador. Propiedades inicia con 340 px y permite un mínimo de 320 px para facilitar la lectura.
- Cambiar por separado el ancho y alto de una tarjeta desde su esquina inferior derecha. Las dimensiones (190–640 px de ancho y 130–600 px de alto) se guardan en el diagrama y viajan en su JSON.
- Usar la plantilla de arquitectura de ejemplo, el zoom y la cuadrícula.
- Alternar entre Diagrama y JSON para inspeccionar y editar el formato actual, pegar JSON desde el portapapeles o el teclado y aplicar el contenido validado para cargar un diagrama; los cambios JSON requieren confirmación antes de reemplazar un diagrama existente. `Ctrl/Cmd+Enter` aplica el JSON.
- Colocar componentes sin solaparlos al añadirlos desde la biblioteca; al arrastrarlos, se insertan cerca del punto de soltado.
- Mover el lienzo arrastrando el fondo, acercar/alejar con la rueda y encuadrar todos los componentes con el botón de ajuste.
- Añadir marcos de agrupación rectangulares o elípticos, editar su título y color, moverlos y cambiar su tamaño desde la esquina. Los grupos se guardan con el diagrama, aparecen en JSON/SVG y admiten copiar, pegar, duplicar, deshacer y rehacer.
- Mover componentes y grupos libremente por todo el lienzo, también hacia la izquierda del origen; las coordenadas negativas se conservan en JSON.
- Configurar cada conexión desde Propiedades: sentido (hacia el destino, hacia el origen, bidireccional o sin flechas), estilo (continua, discontinua o punteada), tipo de comunicación (API, datos, eventos, autenticación, archivos, monitoreo, dependencia u otro) y etiqueta o protocolo; las etiquetas se muestran con fondo de alto contraste para facilitar su lectura.
- Seleccionar una conexión y arrastrar sus puntos de control para cambiar el recorrido o recolocar los extremos sobre los bordes de las tarjetas; las rutas quedan detrás de las tarjetas y se guardan con el diagrama.
- Conectar componentes entre sí, grupos entre sí o componentes con grupos desde el modo Conectar o el menú contextual. Las conexiones se pueden etiquetar, ajustar en sus puntos de anclaje y exportar junto con los elementos.
- Mostrar un flujo animado sutil en las conexiones, que se desactiva si el sistema solicita movimiento reducido.
- Deshacer y rehacer cambios con los botones o con `Ctrl+Z`, `Ctrl+Y` y `Ctrl+Mayús+Z`.
- Seleccionar componentes y grupos en conjunto con `Ctrl/Cmd+clic` o con un marco iniciado en el fondo con `Mayús`; mover, alinear, distribuir, eliminar y copiar/pegar la selección mixta conservando las conexiones internas.
- Abrir acciones contextuales con clic derecho sobre componentes y conexiones.
- Seleccionar varios componentes con `Ctrl/Cmd+clic` o arrastrando un marco con `Mayús`; moverlos juntos, alinearlos y distribuirlos horizontal o verticalmente.
- Guardar automáticamente en el navegador, abrir diagramas JSON de ArqSketch y exportar a JSON o SVG.
- Al abrir un JSON, validar su estructura y confirmar antes de reemplazar un diagrama existente.

## Datos independientes

ArqSketch conserva su propio formato JSON (`app: "ArqSketch"`, `version: 1`, `nodes`, `edges`) y usa la clave local `arqsketch-state`. DB Designer conserva su modelo relacional, su formato JSON y su propia clave de autoguardado. No comparten ni convierten proyectos automáticamente.

Los archivos JSON importados deben ser de ArqSketch versión 1. La importación admite hasta 300 componentes, 1000 conexiones y 300 figuras; un archivo inválido no reemplaza el diagrama actual. El campo opcional `details` guarda la información específica de cada tipo de componente y los diagramas anteriores sin ese campo se siguen abriendo con valores vacíos.
El campo opcional `icon` permite elegir un símbolo integrado o un icono de Iconify por componente; los diagramas anteriores que no lo incluyen conservan el icono predeterminado según su tipo.
La búsqueda remota consulta `https://api.iconify.design` sin clave y requiere conexión a Internet. Si el servicio no está disponible, el catálogo integrado continúa funcionando. Los diagramas guardan el identificador del icono, no su imagen; los SVG exportados con iconos de Iconify referencian la API y requieren conexión para cargar esas imágenes. Los iconos pertenecen a distintas colecciones y pueden tener licencias diferentes; revisa la licencia de cada colección para el uso que necesites.

El campo opcional `shapes` almacena los grupos; los diagramas anteriores que no lo contienen se abren sin figuras. Las conexiones pueden usar identificadores de componentes o de grupos como extremos. Los campos opcionales `direction`, `style` y `connectionType` describen el sentido, estilo visual y tipo de comunicación; los diagramas anteriores se abren con los valores predeterminados (hacia el destino, línea continua y tipo general).
