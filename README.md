# 💘 EMGLC — Medidor de Enamoramiento

Una web interactiva y graciosa que "calcula" el porcentaje de amor entre dos personas. Sin backend, sin dependencias: solo HTML, CSS y JavaScript puro.

## Cómo usarlo

Abre `index.html` en tu navegador, o sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Publicarlo con GitHub Pages

1. Ve a **Settings → Pages** en este repositorio.
2. En "Build and deployment", selecciona la rama que quieras publicar (por ejemplo `main`) y la carpeta raíz (`/`).
3. Guarda y espera unos minutos: GitHub te dará una URL pública para compartir el medidor.

## Características

- Escribe dos nombres y obtén un porcentaje de "amor" animado sobre un corazón que se llena.
- Mensajes graciosos según el resultado (desde "ni con telescopio" hasta "alerta de boda").
- Secuencia de carga con frases absurdas ("Consultando las estrellas...", "Preguntando a Cupido...").
- Confeti si el resultado es alto, temblor de pantalla si es muy bajo.
- Easter egg: si escribes el mismo nombre en ambos campos.
- Corazones flotando de fondo y botón para copiar el resultado y compartirlo.
- 100% responsive, sin dependencias externas de JS.

---

# 🗂️ Tablero de Señalización

En [`tablero/`](tablero/) está el tablero para acomodar las imágenes del catálogo de señalización por área de tienda, arrastrando y soltando. Se entrega como dos HTML autónomos (`tablero/dist/Manual.html` y `tablero/dist/Admin.html`) que se suben juntos a una carpeta de SharePoint y guardan ahí mismo las fotos. Instrucciones en [`tablero/README.md`](tablero/README.md).
