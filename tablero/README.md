# Tablero de Señalización

App web estática (HTML, CSS y JavaScript puro, sin dependencias) para GitHub Pages, con dos paneles:

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Todos (solo lectura) | Muestra el catálogo publicado por área de tienda, con buscador. Al hacer clic en una imagen se abre en grande: flechas o deslizar para pasar a la siguiente, botón ⤢ o clic sobre la imagen para acercar, Esc para cerrar. |
| `admin.html` | Administradores | Tablero para arrastrar las imágenes a cada sección, editar títulos y **publicar** los cambios. |

## Cómo funciona la publicación

GitHub Pages solo sirve archivos; no tiene base de datos. Por eso el botón **Publicar** del panel de administrador guarda los cambios **en el propio repositorio**, en un solo commit:

- `data/tablero.json`: secciones, títulos y rutas de las imágenes.
- `data/img/<huella>.jpg`: cada imagen optimizada (máximo 2000 px de lado, JPEG). El nombre es la huella SHA-1 del archivo original, así que una imagen que no cambió no se vuelve a subir; las que ya no se usan se borran.

Ese commit vuelve a desplegar GitHub Pages y en 1–2 minutos el panel de lectura muestra los cambios.

**Quién puede publicar:** solo quien tenga un token con permiso de escritura en el repositorio. Cualquiera puede abrir `admin.html`, pero sin ese token no puede cambiar nada de lo que ven los demás.

## Configurar el token (una vez por administrador y navegador)

1. En GitHub: tu foto → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Resource owner**: la organización de la empresa. **Repository access**: solo este repositorio.
3. **Repository permissions → Contents: Read and write**.
4. Si la organización usa SSO o aprueba tokens, autorízalo o espera la aprobación.
5. En `admin.html` → **Más → Configurar publicación**: organización, repositorio, rama (`main`) y token. Usa **Probar conexión**.

El token se guarda solo en ese navegador (**Olvidar token** lo borra).

## Uso del panel de administrador

1. **Cargar carpeta** → elige la carpeta `Señalización` (o arrástrala a la página). Se conservan subcarpetas y nombres tal cual.
2. Arrastra cada imagen de la **Biblioteca** a su sección, a la pestaña de la sección o a su encabezado. En celular/tablet, mantén presionado un momento y luego arrastra.
3. Arrastra tarjetas para reordenarlas o moverlas; suéltalas sobre la biblioteca para quitarlas. Clic en un título para editarlo.
4. **Publicar**. Arriba se indica si hay *cambios sin publicar*.

Al abrir `admin.html`, si no tienes cambios pendientes, se carga automáticamente la última versión publicada (por ejemplo, la que publicó otro administrador). **Más → Cargar lo publicado** la trae a mano y descarta tus cambios locales.

La primera publicación de ~180 imágenes tarda unos minutos porque GitHub limita cuántos archivos se pueden subir por minuto; las siguientes solo suben lo nuevo.

### Otras opciones

| Opción | Qué hace |
|---|---|
| Exportar catálogo | Descarga un HTML autónomo con las imágenes incrustadas. |
| Guardar / Abrir tablero | Respaldo `.json` de la distribución (sin imágenes). |
| Más → Colocar por carpeta | Coloca las imágenes sin colocar en la sección cuyo nombre coincide exactamente con su carpeta (ignorando acentos y mayúsculas). No adivina por parecido. |
| Más → Crear secciones desde carpetas | Una sección por cada carpeta que no tenga una. |

## Publicar el sitio en GitHub (empresa)

1. Crea un repositorio en la organización y sube estos archivos a la raíz de `main`, incluida la carpeta `.github/` y `.nojekyll`. **No subas la carpeta `Señalización/`**: las imágenes las sube el panel de administrador ya optimizadas.
2. **Settings → Pages → Source: GitHub Actions**. Si Actions no está habilitado, usa **Deploy from a branch → `main` / (root)**.
3. Recomendado en GitHub Enterprise Cloud: **Settings → Pages → Visibility → Private**, para que solo la gente de la empresa con acceso al repositorio vea la página.

## Desarrollo local

```bash
python3 -m http.server 8000
```

Panel de lectura en `http://localhost:8000/`, administrador en `http://localhost:8000/admin.html`.
