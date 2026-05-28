# PUMPRADIO 🎧

> Radio underground de hardtechno, hardcore, gabber, hardstyle y rave. Transmisión en vivo 24/7 desde Argentina.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://pumpradio.com.ar)
[![PWA](https://img.shields.io/badge/PWA-ready-blue)](https://pumpradio.com.ar)
[![Bundle](https://img.shields.io/badge/bundle-21KB_JS-ff2200)](https://pumpradio.com.ar)

## Features

- **7 estaciones** underground con branding individual
- **Player** con visualizador de audio reactivo
- **Auto-reconnect** con backoff exponencial
- **Multi-estaciones** con cambio instantáneo
- **Noticias** de la escena rave/hardcore/hardtechno
- **PWA** — instalable como app
- **SEO** optimizado para buscadores
- **Keyboard shortcuts** — Space, ↑↓, ←→, M, F, ?
- **Media Session API** — controles en pantalla de bloqueo
- **0 dependencias runtime** — ~10 KB gzip total

## Stack

| Capa | Tecnología |
|------|-----------|
| Build | Vite 8 |
| UI | Vanilla JS + CSS moderno |
| Audio | Web Audio API + Audio element |
| PWA | Service Worker + Manifest |
| Deploy | Static site (cualquier CDN) |

## Estaciones

| Estación | Género | Color |
|----------|--------|-------|
| Pump! Radio | Hardtechno | 🔴 #ff2200 |
| Pump HardTech | Hardtechno | 🟠 #ff4400 |
| Pump Gabber Unit | Gabber / Hardcore | 🟠 #ff6600 |
| Neon Hardstyle | Hardstyle | 🔵 #00ddff |
| Industrial Pulse | Industrial | 🟣 #8844ff |
| Core Frequency | Hardcore | 🩷 #ff0055 |
| Black Tunnel Radio | Neo-rave | ⚫ #222233 |

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
```

## Deploy

`dist/` es un sitio estático. Servible con cualquier web server o CDN.

Ver [DEPLOY.md](./DEPLOY.md) para opciones detalladas.

## Estructura

```
src/
├── main.js         → App principal
├── engine.js       → Audio engine
├── visualizer.js   → Visualizadores
├── stations.js     → Datos de estaciones
├── news.js         → Noticias
└── style.css       → Diseño completo
```

## Licencia

MIT
