# DECISIONES TÉCNICAS — PumpRadio Rebuild

## Stack

**Decisión:** Vite + vanilla JS modules (sin framework)

**Por qué:**
- El proyecto es una single-page app con un estado simple (estación actual, metadata)
- Un framework (React/Vue/Svelte) agrega ~30-50 KB al bundle por cero beneficio real
- Vite da HMR, tree-shaking, minificación y bundling sin config compleja
- JS modules nativos mantienen el código organizado sin overhead

**Trade-off:** Si el proyecto crece (usuario login, playlists, favoritos), convendría migrar a Svelte o Preact.

## Audio Engine

**Decisión:** Audio element + Web Audio API opcional

**Por qué:**
- `Audio` element es lo único que garantiza reproducción de streams ICECAST/SHOUTcast
- Web Audio API se usa solo para visualización (AnalyserNode)
- Si AudioContext no está disponible, el visualizador cae a barras animadas por JS

**Auto-reconnect:**
- 5 intentos con backoff exponencial (3s, 4.5s, 6.75s, 10.12s, 15.19s)
- Se recrea el elemento Audio para forzar conexión fresca
- El EventSource de metadata reconecta automáticamente

## Visualizador

**Decisión:** Tres capas:
1. Canvas background con frecuencias reales (Web Audio API)
2. Barras UI con frecuencias simuladas (fallback)
3. Siempre visible aunque AudioContext no esté disponible

**Por qué:**
- El canvas background es decorativo, no crítico
- Las barras UI son el visualizador principal y deben funcionar siempre
- La simulación con ondas seno + ruido da un efecto creíble sin audio real

## Diseño

**Decisión:** CSS custom properties para theming dinámico

**Por qué:**
- Cada estación tiene su propia paleta de colores
- Cambiar `--accent-color` via JS es instantáneo, sin recompilar CSS
- El diseño es lo suficientemente simple para no necesitar CSS-in-JS

**Estética:**
- Brutalismo industrial: bordes duros, tipografía grande, espacios generosos
- Inspiración: flyers gabber 90s, Berghain, warehouse rave, cyberpunk sobrio
- Sin glow barato, sin gradientes excesivos, sin animaciones superfluas

## PWA

**Decisión:** Service Worker manual (sin Workbox)

**Por qué:**
- El SW es simple (cache-first assets, network-first API)
- Workbox agrega complejidad y dependencias para un caso trivial
- El SW se copia tal cual a dist/ desde public/

## Noticias

**Decisión:** Datos hardcodeados como showcase, arquitectura preparada para RSS

**Por qué:**
- No hay backend ni API de noticias disponible
- La estructura `NewsManager` permite inyectar cualquier fuente
- Próximo paso: RSS parsing via fetch + CORS proxy

## Estructura de archivos

```
src/
  main.js       → App lifecycle, DOM, event handlers
  engine.js     → Audio playback, streaming, reconnect
  visualizer.js → Canvas + DOM visualizers
  stations.js   → Station data (config)
  news.js       → News management
  style.css     → Design system
```

- Sin rutas, sin router, sin estado global — el estado vive en la instancia de `PumpRadioApp`
- Cada módulo tiene una responsabilidad clara y testable
- Los datos de estaciones son configuración pura, separados de la lógica
