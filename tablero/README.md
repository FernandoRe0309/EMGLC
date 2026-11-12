# Tablero de Señalización

App web (HTML, CSS y JavaScript puro, sin dependencias) para acomodar las imágenes del catálogo de señalización por área de tienda, arrastrando y soltando.

## Privacidad

Las imágenes **no se suben a ningún lado**. Se leen desde tu computadora y se guardan solo en el navegador (IndexedDB). Por eso puedes publicar la app en GitHub Pages sin publicar las imágenes: no hace falta subir la carpeta `Señalización/` al repositorio.

## Cómo se usa

1. **Cargar carpeta** → elige la carpeta `Señalización` completa (o arrástrala sobre la página). Se conservan las subcarpetas y los nombres tal cual (acentos, espacios finales, erratas).
2. Arrastra cada imagen de la **Biblioteca** a la sección que le corresponde. También puedes soltarla sobre la pestaña de una sección (barra superior) o sobre su encabezado.
3. Arrastra las tarjetas para reordenarlas o moverlas entre secciones. Suelta una tarjeta sobre la biblioteca para quitarla.
4. Haz clic en una imagen para verla en grande y agregarla/moverla con un menú (útil en celular).
5. Haz clic en el título de una tarjeta o sección para editarlo.

En celular o tablet, **mantén presionada** una imagen un momento para empezar a arrastrarla.

El tablero se guarda automáticamente en el navegador.

## Botones

| Botón | Qué hace |
|---|---|
| Cargar carpeta / imágenes | Agrega imágenes a la biblioteca. Si vuelves a cargar una ruta existente, se actualiza la imagen. |
| Exportar catálogo | Descarga `catalogo-senalizacion.html`: un archivo autónomo con las imágenes incrustadas, buscador y navegación por secciones. |
| Guardar tablero | Descarga un `.json` con la distribución (secciones, rutas y títulos; sin imágenes). Sirve como respaldo o para pasarlo a otra computadora. |
| Abrir tablero | Carga un `.json` guardado. Las tarjetas cuyas imágenes no estén en la biblioteca aparecen como "Falta la imagen" hasta que cargues la carpeta. |
| Más → Colocar por carpeta | Coloca las imágenes **sin colocar** en la sección cuyo nombre coincide exactamente con su carpeta (ignorando acentos, mayúsculas y espacios). No adivina por parecido: `F&V` no se asigna a "Frutas y Verduras". |
| Más → Crear secciones desde carpetas | Crea una sección por cada carpeta que no tenga una sección con el mismo nombre. |

## Desarrollo local

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000/tablero/`.
