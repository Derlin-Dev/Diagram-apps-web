# DB Designer

Aplicación web sencilla para diseñar esquemas relacionales y exportarlos a SQL.

Comparte la paleta y los tokens tipográficos de `../../shared/visual-theme.css`; sus estilos de editor y diagrama permanecen locales.

## Ejecutar
1. Abre el portal principal (`../../index.html`) o directamente esta aplicación (`index.html`) en un navegador moderno. No necesita instalación ni servidor
   (los scripts son clásicos, no módulos ES, justamente para que funcione con `file://`).
2. También puedes servir la carpeta con cualquier servidor estático local.

## Funciones
- Crear tablas y editar nombres, campos, tipos de datos, descripciones, valores por defecto, PK, NOT NULL, UNIQUE y autoincremento.
- Iniciar el diagrama con plantillas editables de blog, tienda en línea o CRM; cargar una plantilla confirma antes de reemplazar el modelo actual.
- Duplicar campos desde sus propiedades; conserva tipo y restricciones NOT NULL/UNIQUE, con nombre único, pero no clona PK, FK ni autoincremento.
- Cambiar entre el diagrama, SQL, JSON y resumen desde pestañas en el área de trabajo; cada vista ocupa el panel central completo.
- Buscar tablas y campos desde el diagrama; el resultado selecciona la tabla, resalta el campo y centra el lienzo (`Ctrl+F` / `Cmd+F`).
- Navegar diagramas grandes con zoom centrado en el cursor (`Ctrl` + rueda), arrastre del lienzo con botón central o `Espacio` + arrastre, centrar tabla seleccionada y ajustar el diagrama completo.
- Organizar todas las tablas manualmente en una cuadrícula sin superposiciones desde el botón ▦ de la barra del lienzo; el cambio se puede deshacer y el diagrama se ajusta a la pantalla.
- Seleccionar tablas con `Ctrl/Cmd+clic`, arrastrarlas juntas, alinearlas por bordes o centros y distribuirlas uniformemente. La autoorganización ofrece flujo de dependencias, izquierda a derecha, capas y radial; puede reorganizar solo una selección.
- Mostrar u ocultar la cuadrícula, activar el ajuste opcional al arrastrar y consultar guías temporales de alineación. Las relaciones de las tablas movidas se enrutan de nuevo.
- Mostrar el minimapa para navegar por diagramas grandes y centrar una tabla o la selección; la búsqueda existente permite saltar a tablas y campos.
- Seleccionar varias relaciones con `Ctrl/Cmd+clic` o `Mayús+clic` y aplicar en lote cardinalidad, `ON DELETE` y `ON UPDATE`. Los cambios se validan en conjunto antes de actualizar el modelo.
- Abrir un menú contextual con clic derecho sobre una tabla o el lienzo para acceder a acciones comunes.
- Reordenar campos arrastrando el control ⠿ en el panel de propiedades; el nuevo orden se conserva en el diagrama, el JSON y el SQL.
- Exportar el diagrama completo como SVG o abrir la exportación PNG/PDF configurando escala, orientación y color de fondo. PDF se genera desde el diálogo de impresión del navegador.
- Presentar las tablas progresivamente en el orden del modelo con controles anterior/siguiente; finalizar restaura el diagrama completo sin cambiar los datos.
- Guardar hasta 50 versiones con nombre y restaurarlas desde **Versiones**; además, guardar hasta 50 modelos como plantillas personalizadas, actualizarlas o eliminarlas. Las plantillas incluidas de blog, tienda y CRM permanecen intactas.
- Editar relaciones existentes desde la lista de relaciones: cambiar 1:1/1:N, opcionalidad y acciones `ON DELETE`/`ON UPDATE`. Para relaciones N:M se editan las acciones de ambas claves de la tabla puente.
- Importar DDL desde **Importar SQL**, pegando texto o cargando un archivo `.sql`. La primera versión admite `CREATE TABLE` de MySQL, PostgreSQL y SQLite con claves primarias, claves foráneas simples, `UNIQUE` y `NOT NULL`; las sentencias o características no compatibles se omiten y aparecen como advertencias antes de confirmar. La importación reemplaza el modelo actual y solicita confirmación.
- Editar o pegar SQL directamente en la pestaña **SQL**. Usa **Revisar y aplicar** (o `Ctrl+Enter` / `Cmd+Enter`) para analizarlo y confirmar el cambio al diagrama; el código escrito no modifica el modelo hasta que se aplique. **Restaurar SQL generado** descarta el borrador.
- Las confirmaciones de acciones destructivas usan diálogos propios; al crear un proyecto nuevo puedes descargar una copia del JSON y/o del borrador SQL, descartar los cambios o seguir editando. `Esc` y clic fuera cierran el diálogo sin confirmar.
- Arrastrar tablas en el lienzo; zoom con los botones o `Ctrl` + rueda; botón ⛶ para ajustar a la pantalla.
- **Tres tipos de relación** (herramienta *Crear relación*: clic en la tabla origen y luego en la destino):
  - **1:1** — agrega una FK en la tabla destino y la marca `UNIQUE`.
  - **1:N** — agrega una FK en la tabla destino.
  - **N:M** — crea automáticamente una **tabla puente** con una FK hacia cada tabla y clave primaria compuesta.
    Puedes agregarle campos propios (p. ej. `fecha`). Eliminar la relación elimina también la tabla puente.
  - Autorrelaciones (la misma tabla como origen y destino), p. ej. `empleados.jefe_id → empleados.id`.
  - Acciones `ON DELETE` / `ON UPDATE` (`NO ACTION`, `RESTRICT`, `CASCADE`, `SET NULL`) y FK opcional.
  - Solo se puede referenciar un campo que sea PK o UNIQUE, y el tipo de la FK sigue al del campo referenciado.
- Notación pata de gallo en las líneas: dos barras = “uno”, tres puntas = “muchos”.
- Las relaciones se dibujan detrás de las tarjetas; al seleccionar una tabla, sus conexiones se resaltan y las demás se atenúan. También aparecen controles para modificar directamente cada relación conectada. Al mover una tabla, sus relaciones se enrutan automáticamente de nuevo y se restablecen sus ajustes manuales de anclaje o recorrido.
- Haz clic en una relación para enfocarla y editarla desde el lienzo; sus controles permiten mover los extremos por los bordes de las tablas y ajustar el recorrido. La posición se conserva en el JSON, autoguardado, historial y exportación SVG.
- Elegir en **Diagrama** si todas las conexiones se muestran curvas o rectas en ángulo recto. Es una preferencia visual global que se conserva en el navegador y también se aplica al SVG exportado; al cambiar de estilo se mantienen intactos los puntos de ruta guardados. Con una tabla seleccionada, sus relaciones muestran puntos de control; arrástralos para remodelar la ruta o haz doble clic sobre una línea recta para agregar un punto. La ruta se conserva en el JSON.
- Volver al portal desde el botón visible **← Inicio** en la barra superior.
- Generar SQL para MySQL, PostgreSQL o SQLite:
  - Las tablas se ordenan según sus dependencias; en caso de ciclos, las FK se emiten con `ALTER TABLE`.
  - Claves primarias compuestas, `AUTO_INCREMENT` / `GENERATED … AS IDENTITY` / `AUTOINCREMENT` según el motor.
  - Las tablas MySQL declaran `ENGINE=InnoDB` para habilitar claves foráneas independientemente del motor predeterminado del servidor.
  - Los identificadores se escapan según el dialecto; los nombres de constraints FK se limitan a 63 caracteres para evitar límites de PostgreSQL/MySQL.
  - `UUID` es nativo en PostgreSQL, se convierte en `CHAR(36)` en MySQL y en `TEXT` en SQLite; SQLite recibe `PRAGMA foreign_keys = ON;` y las PK llevan `NOT NULL` explícito.
  - SQLite usa afinidad dinámica: `DECIMAL(10,2)` se representa como `NUMERIC`, sin garantía de precisión/escala impuesta por el motor.
- Los valores por defecto admiten literales de texto, números y booleanos; `CURRENT_TIMESTAMP` solo se admite en campos `DATETIME` para mantener compatibilidad entre motores. El texto se escapa como literal SQL; no se ejecuta como una expresión arbitraria.
- Exportar documentación Markdown con tablas, campos, restricciones, descripciones y relaciones desde **Documentación**.
- Pestaña **Resumen** con advertencias (nombres duplicados, tablas sin PK, FK a campos no únicos, tipos distintos…).
- Deshacer / rehacer (`Ctrl+Z` / `Ctrl+Y`) y autoguardado del modelo en el navegador; la interfaz confirma el guardado y avisa si el almacenamiento falla. Las versiones y plantillas personalizadas también se guardan localmente en este navegador. Los borradores SQL aún no aplicados se advierten al salir.
- Exportar `schema.sql` con el dialecto activo, guardar/importar el modelo JSON (se valida y sanea al importar), descargar la vista activa del panel, copiar el contenido y duplicar/pegar tablas desde el portapapeles.
- Ejemplo de modelo con relaciones 1:1, 1:N y N:M.
- Modelo de prueba del proyecto E-Commerce en [`examples/e-commerce-database.json`](./examples/e-commerce-database.json): ocho tablas de los cuatro servicios con PostgreSQL como dialecto. Las referencias entre servicios se conservan como códigos, sin inventar claves foráneas entre bases aisladas; los tipos `double` se aproximan a `DECIMAL(10,2)` para ajustarse a los tipos disponibles en el diseñador.

## Atajos
| Tecla | Acción |
|---|---|
| `Ctrl+Z` / `Ctrl+Y` | Deshacer / rehacer |
| `Ctrl+F` | Buscar una tabla o campo |
| `Espacio` + arrastrar o botón central + arrastrar | Desplazar el diagrama |
| Clic derecho sobre una tabla o el lienzo | Menú contextual |
| `Ctrl+Enter` en el editor SQL | Revisar y aplicar SQL al diagrama |
| `Ctrl+D` | Duplicar la tabla seleccionada |
| `Ctrl+C` / `Ctrl+V` | Copiar y pegar una tabla desde el portapapeles |
| `Supr` | Eliminar la tabla seleccionada |
| `Esc` | Salir del modo relación o cerrar el diálogo |
| `Enter` / `Espacio` sobre una tabla enfocada | Seleccionarla |

## Estructura
```
index.html        Interfaz
styles.css        Estilos
js/model.js       Modelo puro: validación, importación segura y operaciones de relaciones
js/sql.js         Generador SQL puro: generateSQL(model, dialect)
js/sql-import.js  Importador de DDL CREATE TABLE (MySQL, PostgreSQL y SQLite)
js/templates.js   Modelos iniciales de ejemplo
js/docs.js        Exportación de documentación Markdown
js/app.js         Interfaz (DOM, eventos, render)
tests/            Pruebas unitarias (Node)
```

`model.js` y `sql.js` no tocan el DOM: se cargan en el navegador (`window.DBD`) y también con `require` en Node.

## Importación SQL

El importador reconoce definiciones `CREATE TABLE` con identificadores entrecomillados y restricciones de columna o de tabla; también acepta SQL copiado desde bloques Markdown con fences. Normaliza los tipos al conjunto disponible en el editor. Importa valores `DEFAULT` literales de texto, numéricos, booleanos y `CURRENT_TIMESTAMP`; no importa datos (`INSERT`), índices, expresiones `DEFAULT` arbitrarias, restricciones compuestas `UNIQUE` ni claves foráneas compuestas. Cada elemento omitido o aproximado se informa en el análisis previo a la importación. El SQL del editor usa este mismo flujo de revisión antes de modificar el diagrama.

## Pruebas
Requiere Node 18 o superior (no hay dependencias):

Ejecuta desde la raíz del proyecto:

```
npm test
```

## Formato del JSON (versión 2)
Cada relación guarda `type` (`1:1` o `1:N`), `onDelete`, `onUpdate` y, si pertenece a una N:M, un `group` que
coincide con el campo `junction` de la tabla puente. Los archivos de la versión 1 se siguen pudiendo abrir.

## Notas
- Es un prototipo frontend: los datos del modelo viven en el navegador mediante autoguardado local; exporta el JSON para conservar una copia independiente o compartirla.
- La generación de SQL es una base de trabajo; valida tipos, restricciones y sintaxis según tu versión del motor
  antes de ejecutar en producción. El resumen advierte cuando MySQL no permite `TEXT` en `PRIMARY KEY` o `UNIQUE` sin longitud de prefijo, y cuando el autoincremento no tiene una PK entera simple. El comportamiento de los tipos y valores predeterminados depende del motor.
