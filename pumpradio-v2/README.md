# 🚀 PumpRadio v2

Radio online self-hosted con estética cyberpunk/terminal, visualización 3D en tiempo real, soporte multi-estación, y stack moderno.

> **De:** [PumpRadio](https://github.com/ldgnu/pumpradio) v1 (vanilla JS + Vite + estático)  
> **A:** Next.js 15 + TypeScript + Tailwind + R3F + Shadcn + PostgreSQL + Redis + Docker

---

## ✨ Features

### 🎵 Audio
- Web Audio API con AnalyserNode para FFT en tiempo real (2048 bands)
- Visualización 3D con React Three Fiber:
  - Spectrum 3D (barras reactivas a frecuencia)
  - VU Meter circular con glow
  - Equalizer 3D con partículas
  - Campo de partículas reactivas al beat
  - Waveform 3D circular
  - Background reactivo con shaders GLSL
- Metadata streaming vía SSE/EventSource
- Reconexión automática con backoff exponencial
- Control de volumen persistente (localStorage)

### 📻 Estaciones
- Sistema multi-estación con branding único por canal:
  - 🅿️ **Pump! Radio** — Hardtechno · Hardcore · Nu Jazz
  - 💠 **Neon Hardstyle** — Raw · Melodic · Euphoric
  - 🎷 **Neo Jazz** — Nu Jazz · Future Jazz · Jazztronica
  - 🎛️ **Electric Grooves** — Jazztronica · Broken Beats
  - 💀 **Core Frequency** — Hardcore · Uptempo · Terror
  - ⚫ **Black Tunnel Radio** — Dark Techno · Industrial · EBM
- Cada estación con colores, visualizador y animaciones propias

### 🖥️ UI/UX
- Estética cyberpunk con glassmorphism, neon glow, scanlines
- Animaciones fluidas a 60fps con Framer Motion
- Now Playing gigante con cover art animado
- Modo OLED (true black)
- Tema terminal opcional
- Responsive (mobile-first)
- PWA ready

### 📊 Backend (próximamente)
- PostgreSQL + Prisma ORM
- Redis para cache, rate limiting y pub/sub
- Historial de reproducción
- Favoritos por usuario
- Rankings de tracks y artistas
- Estadísticas en tiempo real
- NextAuth v5 para autenticación

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **3D/WebGL** | React Three Fiber + Drei |
| **UI** | shadcn/ui + Radix primitives |
| **Animations** | Framer Motion 11 |
| **State** | Zustand + TanStack Query |
| **Database** | PostgreSQL 16 + Prisma 7 |
| **Cache** | Redis 7 (ioredis) |
| **Auth** | NextAuth v5 |
| **Container** | Docker + Compose |

---

## 🚀 Quick Start (Development)

```bash
# 1. Clone
git clone git@github.com:ldgnu/pumpradio.git
cd pumpradio/pumpradio-v2

# 2. Install
npm install

# 3. Copy env
cp .env.example .env.local
# Editar DATABASE_URL, NEXTAUTH_SECRET, etc.

# 4. Run DB
docker compose up -d db redis

# 5. Push schema
npx prisma db push

# 6. Seed (opcional)
npx prisma db seed

# 7. Dev server
npm run dev
# → http://localhost:3000
```

## 🐳 Docker (Production)

```bash
# 1. Configurar env
cp .env.example .env.production
# Editar todas las variables

# 2. Deploy
./scripts/deploy.sh

# O manualmente:
TAG=$(date '+%Y%m%d-%H%M%S') docker compose up -d --build

# 3. Verificar
curl http://localhost:3000/api/health
```

## 📦 Project Structure

```
pumpradio-v2/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.tsx        # Root layout + providers
│   │   │   ├── page.tsx          # Landing + player
│   │   │   ├── globals.css       # Cyberpunk theme
│   │   │   └── station/[slug]/
│   │   │       └── page.tsx      # Station detail
│   │   └── api/
│   │       └── health/route.ts   # Health check
│   ├── components/
│   │   ├── player/
│   │   │   ├── NowPlaying.tsx    # Track display
│   │   │   ├── TransportControls.tsx
│   │   │   └── StationBadge.tsx
│   │   ├── stations/
│   │   │   ├── StationCard.tsx
│   │   │   └── StationSelector.tsx
│   │   ├── visualizer/
│   │   │   ├── Spectrum3D.tsx    # 3D frequency bars
│   │   │   ├── VUMeter.tsx       # Circular VU meter
│   │   │   ├── Equalizer3D.tsx   # 10-band equalizer
│   │   │   ├── ParticleField.tsx # Beat-reactive particles
│   │   │   ├── Waveform3D.tsx    # Circular waveform
│   │   │   ├── BackgroundReactive.tsx
│   │   │   ├── SpectrumScene.tsx # Canvas wrapper
│   │   │   └── index.ts
│   │   └── ui/                   # shadcn components
│   ├── hooks/
│   │   └── useAudioEngine.ts     # Web Audio API core
│   ├── lib/
│   │   ├── store.ts              # Zustand store
│   │   ├── stations-config.ts    # Station definitions
│   │   ├── shaders.ts            # GLSL shaders
│   │   ├── redis.ts              # Redis client
│   │   ├── prisma.ts             # Prisma client
│   │   └── utils.ts              # cn() helper
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── deploy.sh
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
└── ARCHITECTURE.md
```

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `REDIS_PASSWORD` | Redis password | ✅ |
| `NEXTAUTH_URL` | NextAuth base URL | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret (generate: `openssl rand -base64 32`) | ✅ |
| `NEXT_PUBLIC_APP_URL` | Public app URL | ✅ |
| `POSTGRES_USER` | DB user | docker |
| `POSTGRES_PASSWORD` | DB password | docker |
| `POSTGRES_DB` | DB name | docker |

---

## 📋 Roadmap

- [x] Setup Next.js + TypeScript + Tailwind + Shadcn
- [x] Audio Engine (Web Audio API)
- [x] Visualización 3D (R3F)
- [x] Sistema de estaciones
- [x] UI Cyberpunk
- [x] Docker + Docker Compose
- [ ] API Routes (Stations, Tracks, History)
- [ ] Autenticación (NextAuth v5)
- [ ] Favoritos + Historial
- [ ] Rankings + Estadísticas
- [ ] WebSocket para metadata en tiempo real
- [ ] Admin Dashboard
- [ ] PWA completo (offline, push)
- [ ] Tests (Vitest + Playwright)
- [ ] CI/CD (GitHub Actions)

---

## 🛡️ Security

- Cloudflare (WAF, DDoS, CDN)
- No secrets hardcodeados (variables de entorno)
- PostgreSQL y Redis solo en red interna Docker
- Health check sin información sensible
- Rate limiting vía Redis

---

## 📄 License

MIT — [ldgnu](https://github.com/ldgnu)
