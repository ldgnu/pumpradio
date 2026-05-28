# CHANGELOG — PumpRadio

## [1.0.0] — 2026-05-28 — Rebuild completo

### Cambios estructurales
- **Stack migrado** de HTML estático + jQuery/Bootstrap a **Vite + vanilla JS moderno**
- **Eliminadas** todas las dependencias legacy: jQuery 3.2.1, Bootstrap, Font Awesome, animate.css
- **Nuevas dependencias**: solo Vite (build tool), cero runtime dependencies
- **Estructura modular**: `src/main.js`, `src/engine.js`, `src/visualizer.js`, `src/news.js`, `src/stations.js`
- **Build output**: 21 KB JS + 13 KB CSS (gzip: ~10 KB total)

### Player
- ✅ AudioEngine con **reconexión automática** (5 intentos con backoff exponencial)
- ✅ **Web Audio API** para visualización (cuando el browser lo soporta)
- ✅ Visualizador de barras **simulado** como fallback (siempre visible)
- ✅ Ambient background con **canvas animado** (frecuencias reactivas)
- ✅ Volumen persistente en localStorage
- ✅ Mute toggle
- ✅ Manejo de errores con overlay de reconexión
- ✅ Media Session API (controles en pantalla de bloqueo/notificaciones)
- ✅ Autoplay inteligente con fallback por política del browser

### Multi-estaciones
- ✅ **7 estaciones** con branding individual, color, descripción y género
- ✅ Selector de estaciones en header
- ✅ Cambio de paleta de colores por estación (CSS custom properties)
- ✅ Tags de género interactivos
- ✅ Atajos de teclado para navegar entre estaciones (←/→, P/N)

### Diseño visual
- ✅ Paleta oscura industrial: negro, grises, rojo ácido, naranja (#ff2200, #ff6600)
- ✅ Tipografía: Inter (display) + JetBrains Mono (técnica)
- ✅ Estética underground rave: bordes duros, tipografía condensada, brutalismo elegante
- ✅ CSS custom properties para theming dinámico por estación
- ✅ Responsive: mobile-first hasta desktop cinematic
- ✅ Scrollbar custom
- ✅ Animaciones suaves (fadeIn, slideUp)

### Noticias
- ✅ Sección secundaria con grid de cards
- ✅ 6 noticias hardcodeadas sobre hardtechno, hardcore, hardstyle, festivales
- ✅ Arquitectura preparada para RSS ingestion futura
- ✅ Tags por género en cada card

### SEO & Social
- ✅ OpenGraph tags
- ✅ Twitter cards
- ✅ Meta keywords y description (hardtechno, hardcore, gabber, rave argentina, etc.)
- ✅ canonical URL
- ✅ lang="es-AR"
- ✅ OG image generada (1200x630)

### PWA
- ✅ Manifest.json con icons, theme_color, display standalone
- ✅ Service Worker con cache-first para assets, network-first para API
- ✅ Icons SVG + PNG en 32, 192, 512px
- ✅ Apple touch icon

### Performance
- **Lighthouse score estimado**: 95+ (sin frameworks pesados, sin render blocking)
- Bundle: 21 KB JS, 13 KB CSS
- Sin dependencias runtime
- Lazy loading de imágenes
- Transiciones CSS en lugar de JS animations

### Archivos eliminados
- `js/script.js`, `js/script_azura.js`, `js/bootstrap.min.js`
- `css/style.css`, `css/animate.css`, `css/bootstrap.min.css`, `css/font-awesome.min.css`
- `fonts/` (Font Awesome completo)
- `img/` (4 imágenes, ~2.7 MB)
- `service-worker.js` original (reemplazado)
- `manifest.json` original (Jailson WebRadio branding)
- `README.md` (vacío)

### Archivos nuevos
- `src/main.js` — App principal
- `src/engine.js` — Audio engine
- `src/visualizer.js` — Visualizadores
- `src/news.js` — Noticias
- `src/stations.js` — Datos de estaciones
- `src/style.css` — Sistema de diseño completo
- `index.html` — HTML semántico, SEO, PWA
- `vite.config.js` — Build config
- `public/sw.js` — Service Worker
- `public/manifest.json` — PWA manifest
- `public/og-image.png` — Open Graph image
- `public/CNAME` — Custom domain
- `public/pumpradio-logo-*.png|svg` — Iconos
- `public/favicon-32.png|svg` — Favicon

### Próximos pasos recomendados
1. Reemplazar streams placeholder de Zeno por streams reales
2. Configurar RSS feeds reales para noticias
3. Agregar traducción automática (IA) de noticias internacionales
4. Implementar backend para listeners count
5. Generar logos reales para cada estación
6. Deploy a GitHub Pages / Vercel / Cloudflare Pages
