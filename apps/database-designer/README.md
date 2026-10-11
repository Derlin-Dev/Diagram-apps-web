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
- Abrir un menú contextual con clic derecho sobre una tabla o el lienzo para acceder a acciones comunes.
- Reordenar campos arrastrando el control ⠿ en el panel de propiedades; el nuevo orden se conserva en el diagrama, el JSON y el SQL.
- Exportar el diagrama completo como SVG o PNG desde la barra del lienzo; SVG conserva la nitidez al ampliarlo y PNG se genera con fondo claro.
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
- Las relaciones se dibujan detrás de las tarjetas; al seleccionar una tabla, sus conexiones se resaltan y las demás se atenúan.
- Generar SQL para MySQL, PostgreSQL o SQLite:
  - Las tablas se ordenan según sus dependencias; en caso de ciclos, las FK se emiten con `ALTER TABLE`.
  - Claves primarias compuestas, `AUTO_INCREMENT` / `GENERATED … AS IDENTITY` / `AUTOINCREMENT` según el motor.
  - `UUID` en MySQL se convierte en `CHAR(36)`; SQLite recibe `PRAGMA foreign_keys = ON;`.
- Los valores por defecto admiten literales de texto, números, booleanos y `CURRENT_TIMESTAMP` en campos de fecha/hora. El texto se escapa como literal SQL; no se ejecuta como una expresión arbitraria.
- Exportar documentación Markdown con tablas, campos, restricciones, descripciones y relaciones desde **Documentación**.
- Pestaña **Resumen** con advertencias (nombres duplicados, tablas sin PK, FK a campos no únicos, tipos distintos…).
- Deshacer / rehacer (`Ctrl+Z` / `Ctrl+Y`) y autoguardado del modelo en el navegador; la interfaz confirma el guardado y avisa si el almacenamiento falla. Los borradores SQL aún no aplicados se advierten al salir.
- Exportar `schema.sql` con el dialecto activo, guardar/importar el modelo JSON (se valida y sanea al importar), descargar la vista activa del panel, copiar el contenido y duplicar/pegar tablas desde el portapapeles.
- Ejemplo de modelo con relaciones 1:1, 1:N y N:M.

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
  antes de ejecutar en producción. Por ejemplo, MySQL no permite `TEXT` en `UNIQUE` sin longitud de prefijo.
