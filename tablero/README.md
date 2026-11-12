# Manual de Señalización

App web estática (HTML, CSS y JavaScript) que se publica en GitHub Pages. Las fotos y la distribución se guardan en una **carpeta de SharePoint**. Cada persona inicia sesión con su cuenta de la empresa (Microsoft 365); nadie tiene que pegar tokens.

| Panel | Dirección | Para quién |
|---|---|---|
| Lectura | `https://<sitio>/` | Todos. Portada con la guía, los avisos y los formatos W2, B2 y BAE. Al elegir uno se ve su catálogo por área; clic en una foto para verla en grande. |
| Administrador | `https://<sitio>/admin/` | Quien acomoda y publica. No hay ningún enlace entre los dos paneles: comparte cada dirección solo con quien corresponda. |

## Dónde poner la URL de la carpeta de SharePoint

En **`config.js`** (en la raíz). Es el único archivo que hay que editar:

```js
window.TABLERO_CONFIG = {
  sharepointFolderUrl: 'https://empresa.sharepoint.com/sites/MiSitio/Documentos compartidos/Manual señalización',
  clientId: '…',   // lo da TI (ver abajo)
  tenantId: '…',   // lo da TI (ver abajo)
};
```

Para la URL, abre la carpeta en SharePoint y copia la dirección del navegador, o usa **Copiar vínculo** sobre la carpeta.

Al publicar, dentro de esa carpeta se crean solas las subcarpetas según dónde colocaste cada foto:

```
Manual señalización/
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
- Si mueves o quitas una foto, al publicar se mueve o se borra su archivo, y las carpetas que quedan vacías se eliminan.
- Las fotos se optimizan al subir (máximo 2000 px, JPEG). Las que no cambiaron no se vuelven a subir.
- La app solo borra archivos que ella misma publicó.

## Registro de la app (TI, una sola vez)

Para que la página pueda iniciar sesión con Microsoft y leer o escribir en SharePoint, TI debe registrarla en **Microsoft Entra ID** (portal de Azure → *App registrations → New registration*):

1. **Name**: `Manual de señalización`. **Supported account types**: *Accounts in this organizational directory only*.
2. **Redirect URI**: plataforma **Single-page application (SPA)** y la dirección de `auth.html` del sitio publicado, por ejemplo `https://<sitio>/auth.html`. Si se prueba en la computadora, agregar también `http://localhost:8000/auth.html`.
3. **API permissions → Microsoft Graph → Delegated**: `Files.ReadWrite.All` (administradores) y `Files.Read.All` (lectores). Luego **Grant admin consent**.
4. Copiar **Application (client) ID** → `clientId` y **Directory (tenant) ID** → `tenantId` en `config.js`.

**Permisos en SharePoint** (son los que realmente protegen el manual):

- **Lectores**: permiso de *lectura* en la carpeta.
- **Administradores**: permiso de *edición* en la carpeta. Aunque alguien abra `/admin/`, si no tiene permiso de edición no puede publicar.

## Uso del panel de administrador

1. **Iniciar sesión** (botón de la barra azul) con la cuenta de la empresa.
2. **Cargar carpeta** → elige la carpeta de fotos de tu computadora (o arrástrala a la página).
3. Elige el formato en las pestañas **W2 / B2 / BAE** y arrastra cada foto a su área. En celular o tablet, mantén presionado un momento y luego arrastra.
4. Arrastra tarjetas para reordenarlas o moverlas; suéltalas sobre la biblioteca para quitarlas. Clic en un título para editarlo.
5. **Publicar**. Arriba se indica si hay *cambios sin publicar*.

- **⚙ Editar formato**: nombre, subtítulo y color. **+ Formato** agrega uno nuevo. **✎ Textos de portada** edita los avisos.
- Al iniciar sesión, si no tienes cambios pendientes, se carga la última versión publicada, por ejemplo la que publicó otra persona. **Más → Cargar lo publicado** la trae a mano.
- **Más → Conexión a SharePoint** muestra la carpeta configurada, la cuenta y un botón para probar la conexión.
- **Exportar catálogo** descarga un HTML autónomo del formato actual. **Guardar / Abrir tablero** hace un respaldo `.json` de la distribución, sin fotos.

## Publicar el sitio en GitHub Pages

1. Crea un repositorio en la organización y sube todo el contenido de esta carpeta a la raíz de `main`: `index.html`, `admin/`, `vendor/`, `config.js`, `sharepoint.js`, `auth.html`, etc. **No subas las fotos**: van a SharePoint.
2. **Settings → Pages → Source: Deploy from a branch → `main` / (root)**.
3. Recomendado: **Visibility: Private**.
4. Da a TI la dirección `https://<sitio>/auth.html` para el registro de la app y completa `config.js`.

## Probar en la computadora

```bash
python3 -m http.server 8000
```

Lectura en `http://localhost:8000/`, administrador en `http://localhost:8000/admin/`. Para iniciar sesión, TI debe agregar `http://localhost:8000/auth.html` a la app.

---

Incluye la librería oficial de inicio de sesión de Microsoft (`vendor/msal-browser.min.js`, MSAL 3.27.0, licencia MIT en `vendor/MSAL-LICENSE`).
