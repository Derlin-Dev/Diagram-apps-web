# ArqSketch — Diagramador de aplicaciones

Aplicación web independiente para diagramar arquitecturas de aplicaciones y sistemas.

Comparte la paleta y los tokens tipográficos de `../../shared/visual-theme.css`; sus estilos funcionales permanecen locales.

## Ejecutar

Abre ArqSketch desde la extensión o sírvelo con cualquier servidor estático. Para ejecutarlo localmente desde la raíz del proyecto, inicia `python3 -m http.server 8000` y abre `http://localhost:8000/apps/architecture-designer/`. El servidor es necesario porque las plantillas incluidas se cargan como archivos JSON; los navegadores bloquean esa lectura cuando se abre `index.html` directamente como `file://`.

## Funciones

- Añadir y mover componentes de frontend, backend/API, base de datos, servicios externos, nube y usuarios.
- Editar nombre, descripción e icono de los componentes; buscar en el catálogo integrado o en Iconify por tecnología, colección o concepto (por ejemplo, React, PostgreSQL o cola); crear y eliminar conexiones.
- Completar propiedades específicas para frontend, API, base de datos, servicios, nube y usuarios. En las API se pueden documentar varias rutas, método HTTP, visibilidad y autenticación requerida.
- Configurar un componente existente como recurso genérico de Nube / Hosting o Redes y Seguridad desde Propiedades, sin crear otra tarjeta ni depender de un grupo; documentar proveedor y servicio concreto cuando corresponda.
- Organizar el panel Propiedades en grupos plegables de información general, icono y configuración específica; en las API, separar la configuración del servicio de la lista de endpoints.
- Desplazarse por todas las propiedades en un área de scroll propia, con el encabezado y las acciones inferiores del panel siempre visibles; al agregar un endpoint, el panel lo lleva a la vista.
- Consultar en las tarjetas del lienzo un resumen de esas propiedades y los primeros endpoints de cada API.
- Leer las tarjetas con mayor tamaño base de tipografía e iconos; las tarjetas siguen siendo redimensionables para adaptarse al espacio y al nivel de detalle.
- Cambiar el ancho de Biblioteca y Propiedades arrastrando sus divisores; los anchos quedan guardados en el navegador. Propiedades inicia con 340 px y permite un mínimo de 320 px para facilitar la lectura. En ventanas estrechas, se abre como panel lateral desde el botón de configuración del lienzo.
- Cambiar por separado el ancho y alto de una tarjeta desde su esquina inferior derecha. Las dimensiones (190–640 px de ancho y 130–600 px de alto) se guardan en el diagrama y viajan en su JSON.
- Elegir plantillas incluidas de aplicación web, microservicios, serverless o una plataforma cloud de comercio compleja. Sus descripciones y rutas están en `js/templates.js`; cada diagrama se mantiene en su propio archivo JSON dentro de `examples/templates/` y solo se descarga al seleccionarlo. La plataforma cloud combina recursos AWS de ejemplo, tráfico síncrono y asíncrono, almacenamiento, red, zonas de confianza, dominios y un entorno de producción. Edita el diagrama y guárdalo como plantilla propia; las incluidas no se sobrescriben. Las plantillas personalizadas pueden actualizarse o eliminarse.
- Alternar entre Diagrama y JSON para inspeccionar y editar el formato actual, pegar JSON desde el portapapeles o el teclado y aplicar el contenido validado para cargar un diagrama; los cambios JSON requieren confirmación antes de reemplazar un diagrama existente. `Ctrl/Cmd+Enter` aplica el JSON.
- Colocar componentes sin solaparlos al añadirlos desde la biblioteca; al arrastrarlos, se insertan cerca del punto de soltado.
- Mover el lienzo arrastrando el fondo, acercar/alejar con la rueda y encuadrar todos los componentes con el botón de ajuste.
- Añadir marcos de agrupación rectangulares o elípticos, editar su título y color, moverlos y cambiar su tamaño desde la esquina. Los grupos se guardan con el diagrama, aparecen en JSON/SVG y admiten copiar, pegar, duplicar, deshacer y rehacer.
- Abrir el menú contextual en un espacio vacío del lienzo para agregar un componente de cualquier tipo o un grupo directamente en esa posición; ocultar o mostrar la Biblioteca desde la barra del lienzo, con la preferencia guardada localmente.
- Clasificar marcos como dominio, entorno o zona de confianza, con estilos distintos en el lienzo, etiquetas y entradas en la leyenda y exportación SVG. Las conexiones que cruzan una zona de confianza se consideran externas; los componentes y grupos dentro de un marco se detectan por contención geométrica. Los contenedores se pueden plegar: se ocultan sus elementos, las conexiones internas y se mantienen las conexiones externas enlazadas al borde del marco.
- Consultar una descripción y ejemplo contextual de la categoría del marco, además de una guía visual completa de las capas y límites desde sus propiedades.
- Filtrar la vista por frontend, servicios, almacenamiento o conexiones externas. Es un filtro visual: no elimina ni modifica entidades, y las exportaciones JSON/SVG conservan el diagrama completo.
- Mantener los controles del lienzo agrupados por búsqueda y filtros, navegación, historial y cuadrícula, organización y herramientas; los grupos pasan a varias filas según el ancho disponible para evitar comprimir u ocultar controles. Las acciones de gestión del diagrama y exportación están separadas en la barra superior, y Propiedades se puede contraer o abrir como panel lateral en ventanas estrechas.
- Iniciar una presentación progresiva con ▶: cada contenedor revela en conjunto los componentes que contiene y luego se muestran los componentes independientes, uno por paso. Los controles permiten retroceder, avanzar o finalizar sin alterar el diagrama.
- Guardar hasta 50 hitos con nombre desde **Versiones** y restaurarlos después; el guardado es local a este navegador y es independiente de deshacer/rehacer.
- Editar una leyenda con color, nombre y descripción; las categorías de comunicación y zonas de confianza también se reflejan automáticamente. La leyenda se guarda en el JSON y se incluye en el SVG.
- Ocultar o mostrar las entradas de la leyenda del lienzo desde el propio panel, dejando su encabezado accesible.
- Mover componentes y grupos libremente por todo el lienzo, también hacia la izquierda del origen; las coordenadas negativas se conservan en JSON.
- Configurar cada conexión desde Propiedades: sentido (hacia el destino, hacia el origen, bidireccional o sin flechas), estilo (continua, discontinua o punteada), tipo de comunicación (API, datos, eventos, autenticación, archivos, monitoreo, dependencia u otro) y etiqueta o protocolo; las etiquetas se muestran con fondo de alto contraste, buscan una ubicación libre y se pueden arrastrar.
- Elegir en la biblioteca si todas las conexiones se muestran curvas o rectas en ángulo recto. La preferencia se guarda en el navegador y también se aplica a la exportación SVG; los puntos de ruta se guardan en el JSON. Al seleccionar un componente se resaltan sus conexiones y aparecen sus controles; haz clic en una conexión para editar sus propiedades. Arrastra sus puntos amarillos para cambiar la forma recta o haz doble clic en un tramo para agregar otro punto. Al mover un componente o grupo conectado, sus rutas se recalculan automáticamente y se quiebran los ajustes manuales de esas conexiones.
- Seleccionar una conexión y arrastrar sus puntos de control para cambiar el recorrido o recolocar los extremos sobre los bordes de las tarjetas; las rutas quedan detrás de las tarjetas y se guardan con el diagrama.
- Conectar componentes entre sí, grupos entre sí o componentes con grupos desde el modo Conectar o el menú contextual. Las conexiones se pueden etiquetar, ajustar en sus puntos de anclaje y exportar junto con los elementos.
- Mostrar un flujo animado sutil en las conexiones, que se desactiva si el sistema solicita movimiento reducido.
- Deshacer y rehacer cambios con los botones o con `Ctrl+Z`, `Ctrl+Y` y `Ctrl+Mayús+Z`.
- Seleccionar componentes y grupos en conjunto con `Ctrl/Cmd+clic` o con un marco iniciado en el fondo con `Mayús`; mover, alinear, distribuir, eliminar y copiar/pegar la selección mixta conservando las conexiones internas.
- Abrir acciones contextuales con clic derecho sobre componentes y conexiones.
- Seleccionar varios componentes con `Ctrl/Cmd+clic` o arrastrando un marco con `Mayús`; moverlos juntos, alinearlos y distribuirlos horizontal o verticalmente.
- Alinear una selección por bordes o centros, distribuirla horizontal o verticalmente, ajustar componentes a la cuadrícula y mostrar guías temporales de alineación al arrastrar.
- Autoorganizar los componentes seleccionados o todo el diagrama por capas, jerarquía, izquierda a derecha o radial, con separación dinámica para evitar solapamientos; al organizar una selección, los demás componentes quedan fijos. Las rutas de conexión vinculadas se recalculan al reorganizar.
- Buscar componentes y grupos para seleccionarlos y centrarlos; abrir el minimapa para navegar rápidamente y centrar la selección desde la barra del lienzo.
- Seleccionar varias conexiones con `Ctrl/Cmd+clic` o `Mayús+clic` y cambiar en lote su etiqueta, estilo, tipo de comunicación o sentido sin alterar las propiedades que no se marcaron.
- Guardar automáticamente en el navegador, abrir diagramas JSON de ArqSketch y exportar a JSON/SVG. La opción PNG/PDF permite ajustar escala, orientación y fondo; PDF abre la vista de impresión del navegador para usar “Guardar como PDF”.
- Al abrir un JSON, validar su estructura y confirmar antes de reemplazar un diagrama existente.
- Diagrama de prueba de E-Commerce en [`examples/e-commerce-architecture.json`](./examples/e-commerce-architecture.json), con servicios habilitados, infraestructura, grupos y módulos actualmente desactivados en Docker Compose.

## Datos independientes

ArqSketch conserva su propio formato JSON (`app: "ArqSketch"`, `version: 1`, `nodes`, `edges`) y usa la clave local `arqsketch-state`. DB Designer conserva su modelo relacional, su formato JSON y su propia clave de autoguardado. No comparten ni convierten proyectos automáticamente.

Los archivos JSON importados deben ser de ArqSketch versión 1. La importación admite hasta 300 componentes, 1000 conexiones y 300 figuras; un archivo inválido no reemplaza el diagrama actual. El campo opcional `details` guarda la información específica de cada tipo de componente y los diagramas anteriores sin ese campo se siguen abriendo con valores vacíos.
El campo opcional `icon` permite elegir un símbolo integrado o un icono de Iconify por componente; los diagramas anteriores que no lo incluyen conservan el icono predeterminado según su tipo.
La búsqueda remota consulta `https://api.iconify.design` sin clave y requiere conexión a Internet. Si el servicio no está disponible, el catálogo integrado continúa funcionando. Los diagramas guardan el identificador del icono, no su imagen; los SVG exportados con iconos de Iconify referencian la API y requieren conexión para cargar esas imágenes. Los iconos pertenecen a distintas colecciones y pueden tener licencias diferentes; revisa la licencia de cada colección para el uso que necesites.

El campo opcional `shapes` almacena los grupos; los diagramas anteriores que no lo contienen se abren sin figuras. Cada figura admite `category` (`general`, `domain`, `environment` o `trust-zone`) y `collapsed`; la pertenencia se calcula geométricamente, sin guardar listas de miembros. Las conexiones pueden usar identificadores de componentes o de grupos como extremos. Los campos opcionales `direction`, `style` y `connectionType` describen el sentido, estilo visual y tipo de comunicación; los diagramas anteriores se abren con los valores predeterminados (hacia el destino, línea continua y tipo general). `labelPosition` guarda la posición manual de una etiqueta; si se omite, ArqSketch busca automáticamente un lugar que evite componentes y otras etiquetas.

El campo opcional `legend` contiene hasta 30 entradas personalizadas (`id`, `label`, `description` y `color`). Si se omite, el diagrama se abre sin entradas personalizadas y mantiene la leyenda automática de comunicaciones y zonas de confianza.
