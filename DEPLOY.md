# PUMPRADIO — Deploy & Config

## Requisitos

- Node.js 18+
- npm

## Dev

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Build producción

```bash
npm run build
# → dist/
```

El output en `dist/` es un sitio estático, servible con cualquier web server.

## Deploy

### GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

O configurar GitHub Actions para deploy automático en cada push.

### Cloudflare Pages

1. Conectar repo a Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`

### Vercel

1. Importar repo
2. Framework preset: Vite
3. Output directory: `dist`

### Netlify

1. Importar repo
2. Build command: `npm run build`
3. Publish directory: `dist`

### Nginx

```nginx
server {
    listen 80;
    server_name pumpradio.com.ar;
    root /var/www/pumpradio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(js|css|png|jpg|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Post-deploy

1. **Reemplazar streams** en `src/stations.js`:
   - `streamUrl`: URL del stream (Zeno, Icecast, Shoutcast)
   - `metadataUrl`: URL de metadata (API Zeno, etc.)

2. **Configurar dominio**:
   - El CNAME apunta a `pumphradio.com.ar`
   - DNS apuntando a GitHub Pages / Cloudflare

3. **Noticias**:
   - Por defecto usa datos hardcodeados (showcase)
   - Para RSS real: implementar `fetch()` a feeds + CORS proxy

4. **Analytics** (opcional):
   - Agregar script de Plausible/Umami antes del `</head>`

## Variables de estación

Cada estación en `src/stations.js` necesita:

```js
{
  id: 'unique-id',
  name: 'Nombre visible',
  tagline: 'Breve descripción',
  genre: 'Género',
  description: 'Descripción larga',
  color: '#ff2200',        // Color primario
  colorSecondary: '#cc0000', // Secundario
  accent: '#ff6600',        // Acento
  streamUrl: 'URL del stream',
  metadataUrl: 'URL de metadata (opcional)',
  tags: ['tag1', 'tag2']
}
```

## CORS

Si el stream o API de metadata tiene problemas de CORS:
- Zeno.fm no requiere configuración especial
- Para otros providers, puede ser necesario un proxy

## Service Worker

El SW usa estrategia:
- **Cache-first** para assets estáticos (JS, CSS, imágenes)
- **Network-first** para APIs
- **No cache** para streams de audio
- Precarga: index.html, manifest.json
