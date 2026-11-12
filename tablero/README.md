# Manual de Señalización

Dos archivos autónomos (cada uno con todo su CSS y JavaScript adentro) que se suben **juntos a una misma carpeta de SharePoint**. Todo se guarda en esa misma carpeta; no hay que configurar URLs, tokens ni registrar apps.

| Archivo | Para quién | Qué hace |
|---|---|---|
| `dist/Manual.aspx` (o `.html`) | Todos (solo lectura) | Portada con la guía, los avisos y los formatos. Dentro de cada formato: foto de portada, zonas (Frente de Tienda, Piso de Venta, Trastienda, Protección Civil), áreas y los espacios de señalización con su foto. Clic en una foto para verla en grande. Botón **Descarga Checklist** para imprimir o guardar en PDF. |
| `dist/Admin.aspx` (o `.html`) | Quien acomoda y publica | Misma estructura, pero editable: arrastrar fotos a cada espacio, crear o renombrar zonas, áreas y espacios, y **Publicar**. |

No hay ningún enlace entre los dos archivos: comparte cada uno solo con quien corresponda.

## Estructura del manual

```
Formato (W2, B2, BAE…)
└── Zona (Frente de Tienda, Piso de Venta, Trastienda, Protección Civil)
    └── Área (Entrada y Salida de Clientes, Carnes, Recibo…)
        ├── Texto del área ("En … solo deberás contar con la siguiente señalización")
        └── Espacios: título + una foto (o "Imagen pendiente")
```

Cada formato empieza con las mismas zonas y áreas; todo se puede renombrar, agregar, mover o eliminar desde el administrador.

## Instalación

1. Crea (o elige) una carpeta en SharePoint, por ejemplo `Documentos compartidos/Manual señalización`.
2. Sube ahí `Manual.aspx` y `Admin.aspx` (o las versiones `.html`).
3. Abre `Admin.aspx` desde SharePoint, carga tus fotos, acomódalas y presiona **Publicar**.
4. Comparte el enlace de `Manual.aspx` con las tiendas.

Al publicar, la carpeta queda así (las subcarpetas se crean solas según dónde colocaste cada foto):

```
Manual señalización/
├── Manual.aspx
├── Admin.aspx
├── tablero.json                      ← distribución, textos y títulos (no lo edites a mano)
└── W2/
    ├── Portada.jpg                   ← foto de portada del formato (opcional)
    ├── Frente de Tienda/
    │   └── Entrada y Salida de Clientes/
    │       ├── Horario de operación.jpg
    │       └── Medios de pago.jpg
    └── Piso de Venta/
        └── Carnes/
            └── Alergenos.jpg
```

- Cada foto se guarda con el **nombre del espacio** donde la colocaste.
- Solo se crean carpetas donde hay fotos.
- Si mueves o quitas una foto, al publicar se mueve o se manda a la **papelera de reciclaje** de SharePoint; las carpetas que quedan vacías también.
- Las fotos se optimizan al subir (máximo 2000 px, JPEG). Las que no cambiaron no se vuelven a subir.
- La app solo toca lo que ella misma publicó; nunca borra `Manual.aspx`, `Admin.aspx` ni otros archivos.

Las páginas usan la sesión de SharePoint de quien las abre: para ver el manual basta con poder abrir la carpeta, y para publicar hay que poder editarla (lo normal en SharePoint).

### `.aspx` o `.html`

Son el mismo contenido; el `.aspx` solo agrega en la primera línea la directiva de página de SharePoint (`<%@ Page Language="C#" %>`). Usa el que tu sitio de SharePoint muestre como página. Si los dos se descargan en lugar de abrirse, el administrador de SharePoint debe permitir páginas personalizadas en ese sitio.

## Uso del panel de administrador

1. **Cargar carpeta** → elige la carpeta de fotos de tu computadora (o arrástrala a la página).
2. Elige el **formato** (W2 / B2 / BAE), la **zona** y el **área**.
3. Arrastra cada foto de la biblioteca **sobre el espacio** que le corresponde. Si la sueltas entre los espacios (o en **+ Espacio**), se crea un espacio nuevo con el nombre de la foto. También puedes soltarla sobre el botón de otra área.
4. **Publicar**. Arriba se indica si hay *cambios sin publicar*.

Más cosas:

- Clic en el título de una zona, un área, un espacio o en el texto azul del área para editarlo.
- Arrastra un espacio para reordenarlo, o suéltalo sobre el botón de otra área para moverlo. Suéltalo sobre la biblioteca para quitarle la foto.
- **Foto de portada**: arrastra una imagen al recuadro de arriba (o elígela en **⚙ Editar formato**).
- **⚙ Editar formato**: nombre, subtítulo, color y foto de portada. **+ Formato** agrega uno. **✎ Textos de portada** edita los avisos de la página de inicio.
- **Más → Colocar por carpeta**: coloca las fotos sin usar en el área cuyo nombre coincide con su carpeta; si el área ya tiene un espacio vacío con el mismo nombre que la foto, la pone ahí.
- Al abrir el administrador, si no tienes cambios pendientes, se carga la última versión publicada (por ejemplo, la que publicó otra persona). **Más → Cargar lo publicado** la trae a mano.
- **Exportar catálogo** descarga un HTML del formato actual con las fotos incrustadas. **Guardar / Abrir tablero** hace un respaldo `.json` sin fotos.

## Desarrollo

El código fuente está separado para poder editarlo con calma:

| Archivo | Contenido |
|---|---|
| `index.html`, `viewer.css`, `viewer.js` | Panel de lectura |
| `admin/index.html`, `admin/styles.css`, `admin/admin.js` | Panel de administrador |
| `sharepoint.js` | Conexión con la carpeta de SharePoint (API REST del sitio) |

Después de cualquier cambio, genera los dos HTML finales:

```bash
python3 build.py
```

y vuelve a subir `dist/Manual.aspx` y `dist/Admin.aspx` (o los `.html`) a la carpeta de SharePoint.
