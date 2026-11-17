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
├── Portada inicio.jpg                ← foto de portada de la página de inicio (opcional)
└── W2/
    ├── Logo.png                      ← logo del formato (opcional)
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
- Las fotos de portada se muestran completas, con la proporción de la imagen (sin recortes).
- Si mueves o quitas una foto, al publicar se mueve o se manda a la **papelera de reciclaje** de SharePoint; las carpetas que quedan vacías también.
- Las fotos se optimizan al subir (máximo 2000 px, JPEG). Las que no cambiaron no se vuelven a subir.
- La app solo toca lo que ella misma publicó; nunca borra `Manual.aspx`, `Admin.aspx` ni otros archivos.

Las páginas usan la sesión de SharePoint de quien las abre: para ver el manual basta con poder abrir la carpeta, y para publicar hay que poder editarla (lo normal en SharePoint).

### `.aspx` o `.html`

Son el mismo contenido; el `.aspx` solo agrega en la primera línea la directiva de página de SharePoint (`<%@ Page Language="C#" %>`). Usa el que tu sitio de SharePoint muestre como página. Si los dos se descargan en lugar de abrirse, el administrador de SharePoint debe permitir páginas personalizadas en ese sitio.

## Trabajo en equipo (varias personas en el administrador)

- Cada persona edita en su navegador y sus cambios se comparten al presionar **Publicar**.
- **Al publicar se combinan** tus cambios con lo que otra persona haya publicado mientras tanto; no se reemplaza su trabajo. Si los dos cambiaron exactamente lo mismo (por ejemplo, el mismo título), se conserva lo tuyo.
- **Cada 20 segundos** el administrador revisa si alguien publicó y lo trae a tu pantalla (si estás escribiendo o con una ventana abierta, espera a que termines). El manual de lectura se actualiza solo cada minuto.
- Arriba se indica quién publicó por última vez y si tienes *cambios sin publicar*.
- **Publicar nunca borra fotos.** Para quitar de SharePoint las que ya no se usan: **Más → Limpiar fotos sin usar…** (van a la papelera de reciclaje).
- **Más → Versiones anteriores (restaurar)…**: antes de cada publicación se guarda una copia en la carpeta `_historial` (las últimas 60).
- Si el archivo de la página en SharePoint es más nuevo que el que tienes abierto, aparece **"Hay una versión nueva de esta página — Actualizar ahora"**, y el administrador no deja publicar hasta actualizar (así una versión vieja no puede borrar lo que no conoce).

### Si se perdió algo antes de esta versión

- `tablero.json` tiene **historial de versiones de SharePoint**: en la carpeta, clic en los tres puntos del archivo → **Historial de versiones** → elige una versión anterior → **Restaurar**.
- Las fotos que la versión anterior mandó a la papelera están en la **Papelera de reciclaje** del sitio de SharePoint (se conservan 93 días) → **Restaurar**.

## Uso del panel de administrador

1. **Cargar carpeta** → elige la carpeta de fotos de tu computadora (o arrástrala a la página).
2. Elige el **formato** (W2 / B2 / BAE), la **zona** y el **área**.
3. Arrastra cada foto de la biblioteca **sobre el espacio** que le corresponde. Si la sueltas entre los espacios (o en **+ Espacio**), se crea un espacio nuevo con el nombre de la foto. También puedes soltarla sobre el botón de otra área.
4. **Publicar**. Arriba se indica si hay *cambios sin publicar*.

Más cosas:

- Clic en el título de una zona, un área, un espacio o en el texto azul del área para editarlo.
- **Títulos para agrupar la señalización** dentro de un área (por ejemplo *Licencias* y *Letreros* en Servicios al Cliente): botón **+ Título** junto a *+ Espacio*; escribe el título y arrástralo (desde ⋮⋮) arriba de los recuadros que agrupa. Se puede ocultar (icono de ojo) o eliminar (icono de bote) sin borrar los recuadros. En el manual aparece como encabezado y en el checklist como separador.
- Al arrastrar un recuadro o un título, se queda atenuado en su lugar y una **barra azul** marca exactamente dónde va a caer.
- **Texto debajo de la imagen** (opcional, por tarjeta): clic en *+ Agregar texto debajo de la imagen* en el espacio. Mayús + Enter hace un renglón nuevo. Si se deja vacío no aparece en el manual; si tiene texto, también sale en el checklist.
- Arrastra un espacio para reordenarlo, o suéltalo sobre el botón de otra área para moverlo. Suéltalo sobre la biblioteca para quitarle la foto.
- **Foto de portada**: arrastra una imagen al recuadro de arriba (o elígela en **Personalizar panel**).
- **Personalizar panel** (de cada formato):
  - **Datos**: nombre, subtítulo, color, **logo** (aparece en la tarjeta del formato en la página de inicio; se publica en PNG para conservar la transparencia), foto de portada y si el formato aparece en la página de inicio.
  - **Botones**: qué botones tiene la barra del formato (*Cambiar formato*, *Descarga Checklist*), su texto y orden; agregar botones propios con enlace (por ejemplo a un PDF) o quitarlos.
  - **Secciones**: mostrar u ocultar la foto de portada, el texto azul de cada área y los espacios sin foto.
  - **Zonas y áreas**: agregar, quitar, renombrar, reordenar y ocultar sin borrar.
- **Notas** en el formato, en cada zona y en cada área. Los botones **+ Nota arriba de …** / **+ Nota abajo de …** las ponen justo en ese lugar: arriba o abajo de las zonas (formato completo), de las áreas (zona) o de la señalización (área). Tipos: *Importante* rojo o amarillo, recuadro azul con lista, aviso azul claro, nota gris, texto con botón y solo botón. Cada nota se edita (*Editar*), se ordena (↑ ↓), cambia de lugar con **Pasar arriba/abajo** o se elimina (icono de bote). La zona Protección Civil empieza con dos notas de ejemplo.
- **Copiar y pegar zonas y áreas entre formatos**: **Copiar** en la zona o el área (copia notas, espacios, fotos y textos); cambia de formato (y de zona, para un área) y presiona **Pegar zona / Pegar área**. Si ya existe una con el mismo nombre, eliges *agregar como nueva* o *reemplazar*. Lo copiado se queda guardado en el navegador hasta que copies otra cosa o lo olvides con la ×.
- Botones **Visible / Oculta** en cada zona y área, y el icono de ojo en cada espacio, para ocultarlos del manual sin borrarlos. Lo oculto se ve atenuado en el administrador.
- **Consideraciones Importantes**: tarjeta que el manual muestra al abrirse y que la tienda debe cerrar con **CONFIRMO DE LEÍDO Y ENTERADO**. La confirmación se guarda en ese navegador; si cambias el texto se vuelve a pedir. En la página principal queda un botón para volver a verla. Se edita (o se desactiva) en **Página de inicio**.
- **+ Formato** agrega uno. **Página de inicio**: foto de portada de la página de inicio (opcional) y los textos de los avisos.
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
| `blocks.js`, `blocks.css` | Notas (bloques de contenido); las usan los dos paneles |

Después de cualquier cambio, genera los dos HTML finales:

```bash
python3 build.py
```

y vuelve a subir `dist/Manual.aspx` y `dist/Admin.aspx` (o los `.html`) a la carpeta de SharePoint.
