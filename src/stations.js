/**
 * Estaciones de PumpRadio
 * Cada estación tiene branding, color, género y stream propio.
 */

// Único stream funcionando por ahora (hardstyle)
const ACTIVE_STREAM = 'https://stream.zeno.fm/gpv2kgzwum0uv'
const ACTIVE_METADATA = 'https://api.zeno.fm/mounts/metadata/subscribe/e4vzegzwum0uv'

export const STATIONS = [
  {
    id: 'pump-radio',
    name: 'Pump! Radio',
    tagline: 'Hardtechno · Rave · Underground',
    genre: 'Hardtechno',
    description: 'La estación original. Hardtechno industrial, rave y música underground electrónica 24/7.',
    color: '#ff2200',
    colorSecondary: '#cc0000',
    accent: '#ff6600',
    streamUrl: ACTIVE_STREAM,
    metadataUrl: ACTIVE_METADATA,
    tags: ['hardtechno', 'industrial', 'rave', 'underground'],
    comingSoon: false
  },
  {
    id: 'hardstyle',
    name: 'Neon Hardstyle',
    tagline: 'Hardstyle · Reverse Bass · Melodic',
    genre: 'Hardstyle',
    description: 'Hardstyle melódico y potente. Reverse bass, kicks contundentes, breakdowns épicos.',
    color: '#00ddff',
    colorSecondary: '#0099cc',
    accent: '#66eeff',
    streamUrl: ACTIVE_STREAM,
    metadataUrl: ACTIVE_METADATA,
    tags: ['hardstyle', 'melodic', 'reverse-bass'],
    comingSoon: false
  },
  {
    id: 'hardtech',
    name: 'Pump HardTech',
    tagline: 'Hardtechno puro · Sin concesiones',
    genre: 'Hardtechno',
    description: 'La cara más dura del hardtechno. Bombos distorsionados, kicks saturando, ritmos implacables.',
    color: '#ff4400',
    colorSecondary: '#cc2200',
    accent: '#ff8800',
    streamUrl: ACTIVE_STREAM,
    metadataUrl: ACTIVE_METADATA,
    tags: ['hardtechno', 'industrial', 'distorcion'],
    comingSoon: true
  },
  {
    id: 'gabber',
    name: 'Pump Gabber Unit',
    tagline: 'Gabber · Hardcore · 200 BPM+',
    genre: 'Gabber / Hardcore',
    description: 'Gabber sin filtro. Del oldschool Rotterdam al mainstreamcore. Velocidades extremas.',
    color: '#ff6600',
    colorSecondary: '#cc4400',
    accent: '#ffaa00',
    streamUrl: ACTIVE_STREAM,
    metadataUrl: ACTIVE_METADATA,
    tags: ['gabber', 'hardcore', 'rotterdam', 'oldschool'],
    comingSoon: true
  },
  {
    id: 'industrial',
    name: 'Industrial Pulse',
    tagline: 'Industrial · Dark Electronica',
    genre: 'Industrial',
    description: 'Paisajes sonoros industriales. Metal, ruido, electrónica oscura. La banda sonora del colapso.',
    color: '#8844ff',
    colorSecondary: '#6622cc',
    accent: '#aa66ff',
    streamUrl: ACTIVE_STREAM,
    metadataUrl: ACTIVE_METADATA,
    tags: ['industrial', 'dark', 'electronica', 'noise'],
    comingSoon: true
  },
  {
    id: 'core-frequency',
    name: 'Core Frequency',
    tagline: 'Hardcore · Uptempo · Terror',
    genre: 'Hardcore',
    description: 'Hardcore en todas sus formas. Uptempo, terrorcore, speedcore. Sin límites de BPM.',
    color: '#ff0055',
    colorSecondary: '#cc0033',
    accent: '#ff4488',
    streamUrl: ACTIVE_STREAM,
    metadataUrl: ACTIVE_METADATA,
    tags: ['hardcore', 'uptempo', 'terrorcore', 'speedcore'],
    comingSoon: true
  },
  {
    id: 'black-tunnel',
    name: 'Black Tunnel Radio',
    tagline: 'Neo-rave · Dark Minimal',
    genre: 'Neo-rave / Dark Minimal',
    description: 'El lado más oscuro del rave. Minimal, electro, techno warehouse. Para after-hours infinitos.',
    color: '#222233',
    colorSecondary: '#111122',
    accent: '#555577',
    streamUrl: ACTIVE_STREAM,
    metadataUrl: ACTIVE_METADATA,
    tags: ['neo-rave', 'minimal', 'warehouse', 'after-hours'],
    comingSoon: true
  }
]

export const DEFAULT_STATION = 'pump-radio'
