# RECOMENDACIONES — PumpRadio

## Implementadas en rebuild

- [x] Migrar a build system moderno (Vite)
- [x] Modularizar en archivos con responsabilidad única
- [x] Agregar visualizador de audio
- [x] Auto-reconnect con backoff
- [x] SEO completo
- [x] Diseño responsive mobile-first
- [x] Multi-estaciones con branding individual
- [x] Keyboard shortcuts
- [x] PWA completo
- [x] Dark mode
- [x] Remover dependencias innecesarias

## Implementadas en revamp 1.1.0 ("PumpRadio FX")
- [x] **Visualizador reactivo full-screen** (canvas acelerado: espectro + partículas + beat flash)
- [x] **Station cards grid** (reemplaza al `<select>`)
- [x] **Iconos SVG** (play/pause morph, volumen, logo con equalizer)
- [x] **Now Playing marquee** para títulos largos
- [x] **Noticias RSS reales** (Hard News + DJ Mag) con fallback offline
- [x] Sacar debug junk del footer
- [x] Colores del visualizador reactivos por estación

## Pendientes para futura iteración

### Corto plazo

1. **Streams reales**
   - Reemplazar URLs placeholder de Zeno por streams reales
   - Configurar metadata endpoint para cada estación

2. **RSS noticias**
   - Implementar fetch a feeds RSS de sitios de música electrónica
   - Usar CORS proxy (corsproxy.io o similar)
   - Traducción automática al español

3. **Logo real**
   - Diseñar logos individuales para cada estación
   - Reemplazar favicon SVG por versión pulida

### Mediano plazo

4. **Backend liviano**
   - Node.js o Rust para API propia
   - Endpoints: now playing, listeners count, history
   - WebSocket para metadata en tiempo real

5. **User accounts**
   - Favoritos por estación
   - Historial personal
   - Playlists guardadas

6. **Community features**
   - Chat integrado
   - Track requests
   - DJ schedules

7. **Analytics**
   - Plausible o Umami (self-hosted)
   - Sin Google Analytics

### Largo plazo

8. **App nativa**
   - Tauri (Rust) para desktop
   - Reproducción en background
   - Notificaciones de nueva canción

9. **Streaming propio**
   - Icecast/KH AIO para transmitir desde Argentina
   - Múltiples calidades (128k, 192k, 320k)
   - Relay network

10. **AI integration**
    - Track ID automático
    - Recomendaciones basadas en hora del día
    - Descubrimiento de música similar

## Stack recomendado para features futuros

- Backend: Rust (Actix Web) o Node (Fastify)
- DB: SQLite (archivo único, fácil backup)
- Cache: Redis (opcional, para listeners count)
- Streaming: Icecast + Liquidsoap
- Deploy: Docker Compose en self-hosted
