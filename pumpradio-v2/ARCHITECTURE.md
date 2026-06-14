# PumpRadio v2 — Architecture & Technical Specification

> **Objetivo**: Radio online self-hosted, cyberpunk/terminal aesthetic, producción-ready, compitiendo visual/UX con Spotify/Plexamp/DI.FM

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión | Justificación |
|------|------------|---------|---------------|
| **Framework** | Next.js | 15 (App Router) | Server Components, streaming, edge runtime, Turbopack |
| **Language** | TypeScript | 5.x | Type safety end-to-end |
| **Styling** | Tailwind CSS | 4.x | Utility-first, JIT, design tokens |
| **UI Components** | shadcn/ui | latest | Accesible, customizable, Radix primitives |
| **Motion** | Framer Motion | 11.x | 60fps animations, layout animations |
| **3D/WebGL** | React Three Fiber + Drei | latest | React declarative Three.js, performance |
| **State** | Zustand + TanStack Query | latest | Simple global state + server state caching |
| **Forms** | React Hook Form + Zod | latest | Type-safe forms |
| **Database** | PostgreSQL + Prisma ORM | 16 / 5.x | Type-safe DB, migrations, relations |
| **Cache/Queue** | Redis (ioredis) | 7.x | Session, rate limit, pub/sub, cache |
| **Auth** | NextAuth.js v5 | latest | Session, OAuth providers |
| **Audio** | Web Audio API (native) | — | AnalyserNode, real-time FFT |
| **Container** | Docker + Docker Compose | 27.x | Reproducible deploys |
| **Proxy** | Nginx (reverse proxy) | latest | TLS termination, static, rate limit |
| **CI/CD** | GitHub Actions | — | Build, test, deploy |
| **Monitoring** | Sentry + Prometheus | — | Errors, metrics |

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL USERS                           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTPS/WSS
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE (WAF, DDoS, CDN)              │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX (Reverse Proxy)                   │
│  ├── TLS Termination (Let's Encrypt / Cloudflare Origin CA)    │
│  ├── Static Assets (Next.js /_next, public/)                   │
│  ├── Rate Limiting (100 req/s per IP)                          │
│  ├── WebSocket Upgrade (/api/ws/*)                             │
│  └── Compression (gzip/brotli)                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  NEXT.JS APP    │    │  POSTGRESQL     │    │     REDIS       │
│  (Node.js 20)   │    │  (Primary DB)   │    │  (Cache/Queue)  │
│                 │    │                 │    │                 │
│ • App Router    │    │ • Stations      │    │ • Session store │
│ • API Routes    │    │ • Tracks        │    │ • Rate limiting │
│ • Server Comp.  │    │ • History       │    │ • Pub/Sub       │
│ • WebSocket     │    │ • Favorites     │    │ • Queue jobs    │
│ • Edge Runtime  │    │ • Rankings      │    │ • Stream metadata│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 3. Modelo de Datos (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum StationStatus {
  LIVE
  COMING_SOON
  MAINTENANCE
}

enum StreamQuality {
  LOW      // 64kbps
  STANDARD // 128kbps
  HIGH     // 192kbps
  LOSSLESS // 320kbps+
}

model Station {
  id            String   @id @default(cuid())
  slug          String   @unique
  name          String
  tagline       String
  genre         String
  description   String
  colorPrimary  String   // Hex
  colorSecondary String  // Hex
  colorAccent   String   // Hex
  status        StationStatus @default(COMING_SOON)
  streamUrl     String?
  metadataUrl   String?
  quality       StreamQuality @default(STANDARD)
  bpm           Int?     // Average BPM for genre
  tags          String[]
  logoUrl       String?
  backgroundUrl String?  // Station-specific background
  sortOrder     Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tracks        Track[]
  history       PlayHistory[]
  favorites     Favorite[]
  listeners     ListenerCount[]
  
  @@index([status, isActive])
  @@index([slug])
}

model Track {
  id          String   @id @default(cuid())
  title       String
  artist      String
  album       String?
  artworkUrl  String?
  duration    Int?     // seconds
  bpm         Int?
  genre       String?
  isrc        String?  @unique
  stations    Station[] @relation("StationTracks")
  plays       PlayHistory[]
  favorites   Favorite[]
  stats       TrackStats?

  @@index([artist, title])
  @@index([genre])
  @@index([isrc])
}

model TrackStats {
  id              String @id @default(cuid())
  trackId         String @unique
  track           Track  @relation(fields: [trackId], references: [id], onDelete: Cascade)
  totalPlays      Int    @default(0)
  uniqueListeners Int    @default(0)
  totalDuration   Int    @default(0) // seconds listened
  lastPlayedAt    DateTime?
  rankPosition    Int?
  weeklyPlays     Int    @default(0)
  monthlyPlays    Int    @default(0)

  @@index([rankPosition])
}

model PlayHistory {
  id        String   @id @default(cuid())
  trackId   String
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  stationId String
  station   Station  @relation(fields: [stationId], references: [id], onDelete: Cascade)
  userId    String?  // null for anonymous
  startedAt DateTime @default(now())
  endedAt   DateTime?
  duration  Int?     // actual listened seconds
  quality   StreamQuality
  source    String   // web, mobile, api, embed

  @@index([stationId, startedAt])
  @@index([trackId, startedAt])
  @@index([userId, startedAt])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  trackId   String?
  track     Track?   @relation(fields: [trackId], references: [id], onDelete: Cascade)
  stationId String?
  station   Station? @relation(fields: [stationId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, trackId])
  @@unique([userId, stationId])
  @@index([userId])
}

model ListenerCount {
  id           String   @id @default(cuid())
  stationId    String
  station      Station  @relation(fields: [stationId], references: [id], onDelete: Cascade)
  count        Int
  recordedAt   DateTime @default(now())

  @@index([stationId, recordedAt])
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  role          Role      @default(LISTENER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  favorites     Favorite[]
  history       PlayHistory[]
  sessions      Session[]
  
  @@index([email])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime
  createdAt    DateTime @default(now())
  
  @@index([userId])
}

enum Role {
  LISTENER
  MODERATOR
  ADMIN
}
```

---

## 4. Audio Engine Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      AUDIO ENGINE (Client)                       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │ HTMLAudioEl  │───▶│  AudioContext    │───▶│  GainNode    │   │
│  │ (stream src) │    │  (Web Audio API) │    │  (volume)    │   │
│  └──────────────┘    └────────┬─────────┘    └──────┬───────┘   │
│                               │                       │          │
│                    ┌──────────┴──────────┐            │          │
│                    ▼                     ▼            ▼          │
│            ┌─────────────┐        ┌─────────────┐  ┌─────────┐  │
│            │ AnalyserNode│        │ MediaStream │  │ Media   │  │
│            │ (FFT 2048)  │        │ Destination │  │ Session │  │
│            └──────┬──────┘        └─────────────┘  └─────────┘  │
│                   │                                         │     │
│                   ▼                                         │     │
│            ┌─────────────┐                                   │     │
│            │ Data Array  │◀──────────────────────────────────┘     │
│            │ (Uint8Array)│                                       │
│            └──────┬──────┘                                       │
│                   │                                              │
│        ┌──────────┼──────────┐                                   │
│        ▼          ▼           ▼                                   │
│   ┌────────┐ ┌────────┐ ┌─────────┐                              │
│   │Spectrum│ │ VU Meter│ │Equalizer│                              │
│   │ 3D/R3F │ │  Bars  │ │  Bands  │                              │
│   └────────┘ └────────┘ └─────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

### Web Audio Pipeline

```typescript
// Core pipeline (client/audio-engine.ts)
class AudioEngine {
  private audio: HTMLAudioElement
  private ctx: AudioContext
  private source: MediaElementAudioSourceNode
  private analyser: AnalyserNode
  private gainNode: GainNode
  private dataArray: Uint8Array
  
  // Config
  private readonly FFT_SIZE = 2048
  private readonly SMOOTHING = 0.8
  
  // Outputs
  public onFrequencyData: (data: Uint8Array) => void
  public onTimeData: (data: Uint8Array) => void
  public onVolume: (level: number) => void
  public onMetadata: (meta: TrackMeta) => void
  
  constructor(streamUrl: string) {
    this.audio = new Audio(streamUrl)
    this.audio.crossOrigin = 'anonymous' // Critical for Web Audio
    this.ctx = new AudioContext({ latencyHint: 'playback' })
    this.buildGraph()
  }
  
  private buildGraph() {
    this.source = this.ctx.createMediaElementSource(this.audio)
    this.analyser = this.ctx.createAnalyser()
    this.gainNode = this.ctx.createGain()
    
    this.analyser.fftSize = this.FFT_SIZE
    this.analyser.smoothingTimeConstant = this.SMOOTHING
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    
    // Chain: Source → Analyser → Gain → Destination
    this.source.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.gainNode.connect(this.ctx.destination)
  }
  
  // 60fps render loop
  private renderLoop = () => {
    this.analyser.getByteFrequencyData(this.dataArray)
    this.analyser.getByteTimeDomainData(this.timeArray)
    this.onFrequencyData?.(this.dataArray)
    this.onTimeData?.(this.timeArray)
    this.onVolume?.(this.calculateRMS())
    requestAnimationFrame(this.renderLoop)
  }
}
```

---

## 5. Visualización 3D (React Three Fiber)

### Componentes Principales

| Componente | Descripción | Técnica |
|------------|-------------|---------|
| **Spectrum3D** | Barras 3D reactivas a frecuencia | InstancedMesh + ShaderMaterial |
| **VUMeter** | Medidor VU estilo analógico | Circular progress + glow |
| **EqualizerBands** | 10-31 bandas ecualizador | InstancedMesh con scale Y |
| **Waveform3D** | Forma de onda circular/lineal | Line2 / TubeGeometry |
| **ParticleField** | Partículas reactivas al beat | GPU particles (Points + Shader) |
| **AlbumArt3D** | Portada flotante con glow | PlaneGeometry + Custom Shader |
| **BackgroundReactive** | Fondo que respira con la música | Fullscreen shader con audio uniform |

### Shader: Spectrum Bars (GLSL)

```glsl
// spectrumBars.frag
uniform sampler2D audioTexture; // FFT data as texture
uniform float time;
uniform vec3 colorPrimary;
uniform vec3 colorSecondary;
uniform float beatIntensity;

varying vec2 vUv;

void main() {
  float freq = texture2D(audioTexture, vec2(vUv.x, 0.5)).r;
  float height = freq * 2.0 + beatIntensity * 0.5;
  
  vec3 color = mix(colorPrimary, colorSecondary, vUv.y);
  color *= 1.0 + beatIntensity * 0.3; // Pulse on beat
  
  float alpha = smoothstep(0.0, height, vUv.y);
  gl_FragColor = vec4(color, alpha);
}
```

---

## 6. Station System — Branding por Estación

```typescript
// lib/stations/config.ts
export const STATIONS_CONFIG: StationConfig[] = [
  {
    id: 'pump-radio',
    slug: 'pump-radio',
    name: 'Pump! Radio',
    tagline: 'Hardtechno · Hardcore · Nu Jazz',
    genre: 'Multi-género Underground',
    description: 'La nave nodriza. Hardtechno industrial para el workout, hardcore gabber para el caos, Nu Jazz para el after. Argentina al mundo.',
    colors: {
      primary: '#ff2200',      // Rojo ácido
      secondary: '#cc0000',    // Rojo sangre
      accent: '#ff6600',       // Naranja neón
      glow: '#ff3300',
      background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #0a0505 70%)'
    },
    streamUrl: 'https://stream.zeno.fm/gpv2kgzwum0uv',
    metadataUrl: 'https://api.zeno.fm/mounts/metadata/subscribe/e4vzegzwum0uv',
    quality: StreamQuality.HIGH,
    bpm: 155,
    tags: ['hardtechno', 'hardcore', 'gabber', 'nujazz', 'industrial'],
    visualizer: {
      type: 'industrial',
      particleColor: '#ff2200',
      spectrumStyle: 'sharp',
      backgroundShader: 'grid-pulse'
    },
    status: StationStatus.LIVE
  },
  {
    id: 'neon-hardstyle',
    slug: 'neon-hardstyle',
    name: 'Neon Hardstyle',
    tagline: 'Raw · Melodic · Euphoric',
    genre: 'Hardstyle',
    description: 'Kicks que rompen el suelo. Reverse bass, melodías épicas, euphoria pura. De Headhunterz a los nuevos talentos del rawstyle.',
    colors: {
      primary: '#00ddff',      // Cian neón
      secondary: '#0099cc',    // Azul profundo
      accent: '#66ffff',       // Cian brillante
      glow: '#00ccff',
      background: 'radial-gradient(ellipse at center, #0a1a1f 0%, #050a0d 70%)'
    },
    streamUrl: 'https://stream.example.com/hardstyle',
    metadataUrl: 'https://api.example.com/metadata/hardstyle',
    quality: StreamQuality.HIGH,
    bpm: 150,
    tags: ['hardstyle', 'rawstyle', 'euphoric', 'melodic', 'reverse-bass'],
    visualizer: {
      type: 'euphoric',
      particleColor: '#00ddff',
      spectrumStyle: 'smooth',
      backgroundShader: 'wave-field'
    },
    status: StationStatus.COMING_SOON
  },
  {
    id: 'neo-jazz',
    slug: 'neo-jazz',
    name: 'Neo Jazz',
    tagline: 'Nu Jazz · Future Jazz · Jazztronica',
    genre: 'Nu Jazz / Future Jazz',
    description: 'Jazz del futuro. Robert Glasper, Flying Lotus, Thundercat, BADBADNOTGOOD. Beats rotos, sintes vintage, grooves para producir o flotar.',
    colors: {
      primary: '#4488aa',      // Azul jazz
      secondary: '#226688',    // Azul medianoche
      accent: '#66bbdd',       // Azul suave
      glow: '#55aaff',
      background: 'radial-gradient(ellipse at center, #0a1218 0%, #05080c 70%)'
    },
    streamUrl: 'https://stream.example.com/nujazz',
    metadataUrl: 'https://api.example.com/metadata/nujazz',
    quality: StreamQuality.STANDARD,
    bpm: 95,
    tags: ['nujazz', 'futurejazz', 'jazztronica', 'downtempo', 'beats'],
    visualizer: {
      type: 'organic',
      particleColor: '#4488aa',
      spectrumStyle: 'flowing',
      backgroundShader: 'liquid-metal'
    },
    status: StationStatus.COMING_SOON
  },
  {
    id: 'electric-grooves',
    slug: 'electric-grooves',
    name: 'Electric Grooves',
    tagline: 'Jazztronica · Broken Beats · Vinyl Vibes',
    genre: 'Jazztronica / Electronic',
    description: 'La intersección orgánica. Kaytranada, Knxwledge, Sam Gendel. Samples de vinilo, sintes analógicos, ritmos que no encajan en géneros.',
    colors: {
      primary: '#668855',      // Verde musgo
      secondary: '#446633',    // Verde bosque
      accent: '#88bb66',       // Verde lima
      glow: '#77aa55',
      background: 'radial-gradient(ellipse at center, #0a120a 0%, #050805 70%)'
    },
    streamUrl: 'https://stream.example.com/jazztronica',
    metadataUrl: 'https://api.example.com/metadata/jazztronica',
    quality: StreamQuality.STANDARD,
    bpm: 110,
    tags: ['jazztronica', 'beats', 'vinyl', 'experimental', 'lofi'],
    visualizer: {
      type: 'vinyl',
      particleColor: '#668855',
      spectrumStyle: 'groove',
      backgroundShader: 'vinyl-grooves'
    },
    status: StationStatus.COMING_SOON
  },
  {
    id: 'core-frequency',
    slug: 'core-frequency',
    name: 'Core Frequency',
    tagline: 'Hardcore · Uptempo · Terror · Gabber',
    genre: 'Hardcore',
    description: '180+ BPM sin piedad. Uptempo, Frenchcore, Terror, Early Gabber. Cuando el kick tiene que doler.',
    colors: {
      primary: '#dd2244',      // Rosa sangrante
      secondary: '#aa0033',    // Rojo oscuro
      accent: '#ff5577',       // Rosa neón
      glow: '#ff3366',
      background: 'radial-gradient(ellipse at center, #1a0508 0%, #0a0203 70%)'
    },
    streamUrl: 'https://stream.example.com/hardcore',
    metadataUrl: 'https://api.example.com/metadata/hardcore',
    quality: StreamQuality.HIGH,
    bpm: 180,
    tags: ['hardcore', 'uptempo', 'frenchcore', 'terror', 'gabber'],
    visualizer: {
      type: 'aggressive',
      particleColor: '#dd2244',
      spectrumStyle: 'brutal',
      backgroundShader: 'glitch-grid'
    },
    status: StationStatus.COMING_SOON
  },
  {
    id: 'black-tunnel',
    slug: 'black-tunnel',
    name: 'Black Tunnel Radio',
    tagline: 'Dark Techno · Industrial · EBM',
    genre: 'Dark Techno / Industrial',
    description: 'El túnel sin luz. Berghain sound, industrial puro, EBM clásico, dark techno hipnótico. Para las 4am.',
    colors: {
      primary: '#222233',      // Casi negro azulado
      secondary: '#111122',    // Negro profundo
      accent: '#444466',       // Gris azulado
      glow: '#333355',
      background: 'radial-gradient(ellipse at center, #050508 0%, #000000 60%)'
    },
    streamUrl: 'https://stream.example.com/darktechno',
    metadataUrl: 'https://api.example.com/metadata/darktechno',
    quality: StreamQuality.STANDARD,
    bpm: 128,
    tags: ['darktechno', 'industrial', 'ebm', 'minimal', 'hypnotic'],
    visualizer: {
      type: 'minimal',
      particleColor: '#444466',
      spectrumStyle: 'subtle',
      backgroundShader: 'void'
    },
    status: StationStatus.COMING_SOON
  }
]
```

---

## 7. API Routes (Next.js App Router)

```
app/api/
├── stations/
│   ├── route.ts              # GET all, POST create (admin)
│   └── [slug]/
│       ├── route.ts          # GET one, PUT update, DELETE
│       ├── stream/
│       │   └── route.ts      # Proxy stream (CORS, auth)
│       ├── metadata/
│       │   └── route.ts      # SSE endpoint for metadata
│       ├── current/
│       │   └── route.ts      # Now playing + queue
│       ├── history/
│       │   └── route.ts      # Play history (paginated)
│       ├── stats/
│       │   └── route.ts      # Station stats (listeners, top tracks)
│       └── visualizer/
│           └── route.ts      # WebSocket para data tiempo real
├── tracks/
│   ├── route.ts              # Search, filter
│   ├── [id]/
│   │   ├── route.ts          # Track details
│   │   ├── stats/
│   │   │   └── route.ts      # Track rankings
│   │   └── artwork/
│   │       └── route.ts      # Artwork proxy
├── favorites/
│   ├── route.ts              # GET user favorites, POST add
│   └── [id]/
│       └── route.ts          # DELETE remove
├── history/
│   └── route.ts              # User play history
├── rankings/
│   ├── tracks/
│   │   └── route.ts          # Top tracks (global, weekly, by station)
│   ├── artists/
│   │   └── route.ts          # Top artists
│   └── stations/
│       └── route.ts          # Station popularity
├── analytics/
│   ├── listeners/
│   │   └── route.ts          # Real-time listener count
│   └── events/
│       └── route.ts          # Track play events (batch)
├── auth/
│   ├── [...nextauth]/
│   │   └── route.ts          # NextAuth v5
│   ├── register/
│   │   └── route.ts
│   └── session/
│       └── route.ts
└── ws/
    └── route.ts              # WebSocket server (metadata, viz data)
```

---

## 8. Frontend Architecture (App Router)

```
app/
├── (public)/
│   ├── layout.tsx            # Root layout, providers
│   ├── page.tsx              # Landing / Station selector
│   ├── globals.css           # Tailwind + CSS variables
│   ├── providers.tsx         # QueryClient, Zustand, Theme
│   │
│   ├── stations/
│   │   └── [slug]/
│   │       ├── layout.tsx    # Station layout (sidebar, header)
│   │       ├── page.tsx      # Player principal (Now Playing gigante)
│   │       ├── history/
│   │       │   └── page.tsx  # Historial de la estación
│   │       ├── favorites/
│   │       │   └── page.tsx  # Favoritos del usuario
│   │       ├── rankings/
│   │       │   └── page.tsx  # Top tracks/artists de la estación
│   │       └── stats/
│   │           └── page.tsx  # Estadísticas detalladas
│   │
│   ├── search/
│   │   └── page.tsx          # Búsqueda global tracks/artists
│   │
│   └── settings/
│       └── page.tsx          # Configuración usuario
│
├── (admin)/
│   ├── layout.tsx            # Admin layout + auth guard
│   ├── stations/
│   │   ├── page.tsx          # CRUD estaciones
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx
│   ├── tracks/
│   │   └── page.tsx          # Gestión tracks
│   ├── analytics/
│   │   └── page.tsx          # Dashboard analytics
│   └── users/
│       └── page.tsx          # Gestión usuarios
│
├── api/                      # API routes (ver sección 7)
│
├── components/
│   ├── ui/                   # Shadcn components
│   ├── audio/                # Player, Visualizer, Controls
│   ├── stations/             # StationCard, StationSelector, Branding
│   ├── visualizer/
│   │   ├── Spectrum3D.tsx
│   │   ├── VUMeter.tsx
│   │   ├── Equalizer3D.tsx
│   │   ├── Waveform3D.tsx
│   │   ├── ParticleField.tsx
│   │   └── BackgroundReactive.tsx
│   ├── player/
│   │   ├── NowPlaying.tsx    # Giant cover + track info
│   │   ├── TransportControls.tsx
│   │   ├── VolumeSlider.tsx
│   │   ├── QualitySelector.tsx
│   │   └── StationBadge.tsx
│   ├── charts/
│   │   ├── TrackRanking.tsx
│   │   ├── ArtistRanking.tsx
│   │   └── StationPopularity.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── hooks/
│   ├── useAudioEngine.ts
│   ├── useStation.ts
│   ├── useVisualizer.ts
│   ├── useFavorites.ts
│   ├── useHistory.ts
│   └── useMediaSession.ts
│
├── lib/
│   ├── audio-engine.ts       # Core Web Audio
│   ├── stations-config.ts    # Station definitions
│   ├── visualizer-shaders/   # GLSL shaders
│   ├── prisma.ts
│   ├── redis.ts
│   ├── auth.ts
│   └── utils.ts
│
├── types/
│   ├── station.ts
│   ├── track.ts
│   ├── audio.ts
│   └── visualizer.ts
│
└── styles/
    ├── globals.css
    └── visualizer.css        # Animaciones CSS para fallback 2D
```

---

## 9. Docker Compose (Production)

```yaml
# docker-compose.yml
version: '3.9'

services:
  # ─── APP ──────────────────────────────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    image: pumpradio/app:${TAG:-latest}
    container_name: pumpradio-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=https://${DOMAIN}
      - NEXT_PUBLIC_APP_URL=https://${DOMAIN}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - pumpradio-internal
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  # ─── POSTGRESQL ───────────────────────────────────────
  db:
    image: postgres:16-alpine
    container_name: pumpradio-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prisma/migrations:/docker-entrypoint-initdb.d/migrations:ro
    networks:
      - pumpradio-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # ─── REDIS ────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: pumpradio-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - pumpradio-internal
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # ─── NGINX (Reverse Proxy + TLS) ─────────────────────
  nginx:
    image: nginx:alpine
    container_name: pumpradio-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./public:/var/www/pumpradio/public:ro
    depends_on:
      - app
    networks:
      - pumpradio-internal
      - pumpradio-external

  # ─── CERTBOT (Let's Encrypt) ─────────────────────────
  certbot:
    image: certbot/certbot:latest
    container_name: pumpradio-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done'"

networks:
  pumpradio-internal:
    driver: bridge
    internal: true
  pumpradio-external:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

---

## 10. Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml application/rss+xml application/atom+xml image/svg+xml;

    # Upstream
    upstream pumpradio_app {
        server app:3000;
        keepalive 32;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=ws:10m rate=50r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # HTTP → HTTPS redirect
    server {
        listen 80;
        server_name ${DOMAIN} www.${DOMAIN};
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name ${DOMAIN} www.${DOMAIN};

        ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
        
        # SSL Config (Mozilla Intermediate)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss: https:; media-src 'self' https: blob:; frame-ancestors 'self';" always;

        # Static assets (Next.js /_next, public)
        location /_next/static/ {
            proxy_pass http://pumpradio_app;
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff";
        }

        location /public/ {
            alias /var/www/pumpradio/public/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            limit_conn conn 10;
            
            proxy_pass http://pumpradio_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket (metadata, visualizer)
        location /api/ws/ {
            limit_req zone=ws burst=10 nodelay;
            
            proxy_pass http://pumpradio_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }

        # Stream Proxy (CORS handling)
        location /api/stations/*/stream/ {
            proxy_pass http://pumpradio_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 3600;
            proxy_send_timeout 3600;
            
            # CORS for audio elements
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Range, Accept, Origin" always;
            add_header Access-Control-Expose-Headers "Content-Length, Content-Range, Accept-Ranges" always;
        }

        # Main App
        location / {
            proxy_pass http://pumpradio_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Next.js needs these
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Server $host;
        }
    }
}
```

---

## 11. Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy.sh

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="${DOMAIN:-pumpradio.com.ar}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"
ENV_FILE=".env.production"

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $*"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $*"; exit 1; }

# 1. Load env
if [[ ! -f "$ENV_FILE" ]]; then
    error "Missing $ENV_FILE. Copy from .env.production.example"
fi
source "$ENV_FILE"

log "🚀 Deploying PumpRadio v2 to $DOMAIN (tag: $TAG)"

# 2. Pull latest images
log "📥 Pulling base images..."
docker compose pull db redis nginx certbot

# 3. Build app image
log "🔨 Building app image..."
docker compose build --no-cache app

# 4. Run migrations
log "🗄️ Running database migrations..."
docker compose run --rm app npx prisma migrate deploy

# 5. Seed database (stations, admin user)
log "🌱 Seeding database..."
docker compose run --rm app npx tsx prisma/seed.ts

# 6. Start services
log "▶️ Starting services..."
docker compose up -d

# 7. Health checks
log "🏥 Waiting for health checks..."
for i in {1..30}; do
    if curl -sf "http://localhost/health" >/dev/null 2>&1; then
        log "✅ Health check passed"
        break
    fi
    sleep 2
    [[ $i -eq 30 ]] && error "Health check failed after 60s"
done

# 8. Verify SSL
log "🔒 Verifying SSL certificate..."
if ! openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -checkend 86400; then
    warn "SSL certificate expires soon or missing. Running certbot..."
    docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" -d "www.$DOMAIN" --email "$LETSENCRYPT_EMAIL" --agree-tos --non-interactive
    docker compose exec nginx nginx -s reload
fi

# 9. Smoke tests
log "🧪 Running smoke tests..."
curl -sf "https://$DOMAIN/api/stations" | jq -e 'length > 0' || error "Stations API failed"
curl -sf "https://$DOMAIN/api/stations/pump-radio/current" | jq -e '.track' || error "Current track API failed"

log "✅ Deployment complete! 🎉"
log "🌐 https://$DOMAIN"
log "📊 Dashboard: https://$DOMAIN/admin (if admin user)"
```

---

## 12. Checklist de Producción

### ✅ Infraestructura
- [ ] VPS con 4+ vCPU, 8GB+ RAM, 100GB+ SSD
- [ ] Docker + Docker Compose v2 instalados
- [ ] Dominio configurado (A record → VPS IP)
- [ ] Cloudflare configurado (Proxy ON, WAF rules)
- [ ] Let's Encrypt / Cloudflare Origin CA para TLS

### ✅ Configuración
- [ ] `.env.production` completado con todos los secrets
- [ ] `NEXTAUTH_SECRET` generado (`openssl rand -base64 32`)
- [ ] `DATABASE_URL` con conexión pooling (PgBouncer opcional)
- [ ] `REDIS_URL` con password si expuesto
- [ ] Streams URLs válidas y accesibles (CORS OK)

### ✅ Base de Datos
- [ ] Migraciones aplicadas (`prisma migrate deploy`)
- [ ] Seed ejecutado (estaciones, admin user)
- [ ] Índices creados (ver schema)
- [ ] Backup automático configurado (pg_dump cron)

### ✅ Streams
- [ ] Stream URLs responden 200 con audio/mpeg
- [ ] Metadata URLs devuelven JSON válido (EventSource)
- [ ] CORS headers en streams (`Access-Control-Allow-Origin: *`)
- [ ] Bitrates configurados por estación
- [ ] Fallback streams configurados

### ✅ Frontend
- [ ] Build production exitoso (`npm run build`)
- [ ] Bundle analyze: < 200KB JS, < 50KB CSS gzipped
- [ ] Lighthouse: Performance > 90, Accessibility > 95
- [ ] PWA instalable (manifest, SW, icons)
- [ ] SEO: meta tags, OG, Twitter cards, sitemap.xml

### ✅ Audio & Visualizer
- [ ] Web Audio API funciona en Chrome/Firefox/Safari
- [ ] AnalyserNode recibe datos (crossOrigin=anonymous)
- [ ] 3D visualizers renderizan 60fps en desktop
- [ ] Fallback 2D CSS para móviles/low-end
- [ ] Media Session API: controles en lock screen

### ✅ Backend
- [ ] API routes responden < 200ms p95
- [ ] WebSocket conexiones estables
- [ ] Rate limiting activo (100req/s API, 50req/s WS)
- [ ] Auth: NextAuth v5 con providers configurados
- [ ] Prisma: connection pool configurado

### ✅ Monitoreo
- [ ] Sentry DSN configurado
- [ ] Prometheus metrics endpoint (/api/metrics)
- [ ] Logs estructurados (JSON) → Loki/ELK
- [ ] Alertas: downtime, high error rate, SSL expiry

### ✅ Seguridad
- [ ] Cloudflare WAF: OWASP Top 10 rules ON
- [ ] Rate limiting en Nginx + API
- [ ] CSP headers estrictos
- [ ] Secrets solo en env, nunca en repo
- [ ] Dependabot / Renovate activado

---

## 13. Próximos Pasos Inmediatos

1. **Crear repo nuevo** `pumpradio-v2` (privado) con esta estructura
2. **Setup inicial**: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
3. **Instalar deps**: shadcn/ui, three, @react-three/fiber, @react-three/drei, framer-motion, zustand, @tanstack/react-query, prisma, next-auth, ioredis, zod, react-hook-form
4. **Configurar Prisma** + migración inicial + seed
5. **Audio Engine** core (Web Audio API + AnalyserNode)
6. **Station System** + branding config
7. **Visualizer components** con R3F
8. **API routes** + WebSocket server
9. **Dockerize** + deploy script
10. **Deploy a staging** → validar → producción

---

## 14. Estimación de Esfuerzo

| Fase | Tareas | Días estimados |
|------|--------|----------------|
| Setup & Config | Next.js, TS, Tailwind, Shadcn, Prisma, Docker | 2 |
| Audio Engine | Web Audio, AnalyserNode, Metadata, Reconnect | 2 |
| Station System | Config, Branding, Multi-station routing | 1 |
| Visualizers 3D | Spectrum, VU, Equalizer, Particles, Background | 4 |
| UI/UX Cyberpunk | Theme, Components, Animations, Responsive | 3 |
| Backend API | Stations, Tracks, History, Favorites, Rankings | 3 |
| Auth & Users | NextAuth, Sessions, Roles | 1 |
| Real-time | WebSocket, Live metadata, Viz data sync | 2 |
| Testing & Polish | Lighthouse, Cross-browser, Mobile, PWA | 2 |
| Deploy & Docs | Docker, Scripts, SSL, Monitoring, README | 2 |
| **Total** | | **~22 días** |

---

*Documento vivo — actualizar conforme avanza la implementación*