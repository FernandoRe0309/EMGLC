# Manual de Señalización

Dos archivos HTML autónomos (cada uno con todo su CSS y JavaScript adentro) que se suben **juntos a una misma carpeta de SharePoint**. Todo se guarda en esa misma carpeta; no hay que configurar URLs, tokens ni registrar apps.

| Archivo | Para quién | Qué hace |
|---|---|---|
| `dist/Manual.html` | Todos (solo lectura) | Portada con la guía, los avisos y los formatos W2, B2 y BAE. Al elegir uno se ve su catálogo por área; clic en una foto para verla en grande. |
| `dist/Admin.html` | Quien acomoda y publica | Tablero para arrastrar las fotos a cada área de cada formato y **Publicar**. |

No hay ningún enlace entre los dos archivos: comparte cada uno solo con quien corresponda.

## Instalación

1. Crea (o elige) una carpeta en SharePoint, por ejemplo `Documentos compartidos/Manual señalización`.
2. Sube ahí `Manual.html` y `Admin.html`.
3. Abre `Admin.html` desde SharePoint, carga tus fotos, acomódalas y presiona **Publicar**.
4. Comparte el enlace de `Manual.html` con las tiendas.

Al publicar, la carpeta queda así (las subcarpetas se crean solas según dónde colocaste cada foto):

```
Manual señalización/
├── Manual.html
├── Admin.html
├── tablero.json            ← distribución, textos y títulos (no lo edites a mano)
├── W2/
│   ├── Carnes/
│   │   ├── Alergenos.jpg
│   │   └── Hypofoam.jpg
│   └── Comedor/
│       └── Zona de descanso.jpg
└── B2/
    └── Autocobro SCO/
        └── Aereo autocobro B2.jpg
```

- Solo se crean carpetas para las áreas que tienen fotos.
- Si mueves o quitas una foto, al publicar se mueve o se manda a la **papelera de reciclaje** de SharePoint; las carpetas que quedan vacías también.
- Las fotos se optimizan al subir (máximo 2000 px, JPEG). Las que no cambiaron no se vuelven a subir.
- La app solo toca lo que ella misma publicó; nunca borra `Manual.html`, `Admin.html` ni otros archivos.

Las páginas usan la sesión de SharePoint de quien las abre: para ver el manual basta con poder abrir la carpeta, y para publicar hay que poder editarla (lo normal en SharePoint).

### Si SharePoint descarga el archivo en lugar de abrirlo

Algunos sitios de SharePoint no muestran archivos `.html` como página. Si al hacer clic se descarga, usa en su lugar **`dist/Manual.aspx`** y **`dist/Admin.aspx`** (mismo contenido, con la directiva de página de SharePoint). Si tampoco abre, el administrador de SharePoint debe permitir páginas personalizadas en ese sitio.

## Uso del panel de administrador

1. **Cargar carpeta** → elige la carpeta de fotos de tu computadora (o arrástrala a la página).
2. Elige el formato en las pestañas **W2 / B2 / BAE** y arrastra cada foto a su área. En celular o tablet, mantén presionado un momento y luego arrastra.
3. Arrastra tarjetas para reordenarlas o moverlas; suéltalas sobre la biblioteca para quitarlas. Clic en un título para editarlo.
4. **Publicar**. Arriba se indica si hay *cambios sin publicar*.

- **⚙ Editar formato**: nombre, subtítulo y color. **+ Formato** agrega uno. **✎ Textos de portada** edita los avisos.
- Al abrir `Admin.html`, si no tienes cambios pendientes, se carga la última versión publicada (por ejemplo, la que publicó otra persona). **Más → Cargar lo publicado** la trae a mano.
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

y vuelve a subir `dist/Manual.html` y `dist/Admin.html` a la carpeta de SharePoint.
