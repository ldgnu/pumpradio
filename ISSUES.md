# ISSUES ENCONTRADOS — Pre-rebuild

## Críticos

1. **API key hardcodeada en JS**
   - `API_KEY = "18fe07917957c289983464588aabddfb"` en ambos scripts
   - Expuesta públicamente en el frontend
   - **Riesgo:** uso indebido por terceros

2. **Código duplicado**
   - `script.js` (Zeno FM) y `script_azura.js` (AzuraCast)
   - 90% del código es idéntico
   - Dificulta mantenimiento

3. **Sin manejo de errores real**
   - `audio.onerror` muestra `confirm()` nativo
   - Sin reconexión automática
   - Sin feedback visual al usuario

## Altos

4. **Sin SEO**
   - Sin OG tags, Twitter cards, meta description
   - Título: "Radio Player"
   - No indexable para búsqueda

5. **Branding incorrecto**
   - Manifest con "Jailson WebRadio"
   - Título en portugués
   - Sin identidad de marca

6. **Dependencias pesadas sin uso real**
   - animate.css (1584 líneas, 24 KB)
   - Font Awesome completo (~60 KB)
   - Bootstrap JS (no necesario para el layout)

## Medios

7. **Sin responsive completo**
   - El layout se rompe en mobile
   - Cover art no escala bien
   - Volumen oculto en mobile

8. **Sin visualizador de audio**
   - Solo muestra metadata
   - Sin feedback visual de reproducción

9. **Sin lazy loading**
   - Imágenes cargan todas al inicio
   - Cover art de Deezer sin manejo de error

## Bajos

10. **Variables globales**
    - `audio`, `musicHistory`, `showHistory` en window
    - Posibles colisiones

11. **Código muerto**
    - `volumeUp()`, `volumeDown()` no se usan desde UI
    - Logo con `display: none`
    - Lyrics modal apenas funcional

12. **Comentarios en portugués**
    - Mezcla portugués/inglés en código
