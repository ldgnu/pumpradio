/**
 * Estaciones de PumpRadio
 * Cada estación tiene branding, color, género y stream propio.
 * Los streams son placeholder de Zeno — reemplazar por los reales.
 */

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
    streamUrl: 'https://stream.zeno.fm/gpv2kgzwum0uv',
    metadataUrl: 'https://api.zeno.fm/mounts/metadata/subscribe/e4vzegzwum0uv',
    logo: null, // CSS-based
    cover: null,
    listeners: null,
    tags: ['hardtechno', 'industrial', 'rave', 'underground']
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
    streamUrl: 'https://stream.zeno.fm/8z7q5p7d6zhvv',
    metadataUrl: 'https://api.zeno.fm/mounts/metadata/subscribe/8z7q5p7d6zhvv',
    logo: null,
    cover: null,
    listeners: null,
    tags: ['hardtechno', 'industrial', 'distorcion']
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
    streamUrl: 'https://stream.zeno.fm/2c0m6vzcn5svv',
    metadataUrl: 'https://api.zeno.fm/mounts/metadata/subscribe/2c0m6vzcn5svv',
    logo: null,
    cover: null,
    listeners: null,
    tags: ['gabber', 'hardcore', 'rotterdam', 'oldschool']
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
    streamUrl: 'https://stream.zeno.fm/kfnq1cs1h2zuv',
    metadataUrl: 'https://api.zeno.fm/mounts/metadata/subscribe/kfnq1cs1h2zuv',
    logo: null,
    cover: null,
    listeners: null,
    tags: ['hardstyle', 'melodic', 'reverse-bass']
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
    streamUrl: 'https://stream.zeno.fm/eh0chb23n48uv',
    metadataUrl: 'https://api.zeno.fm/mounts/metadata/subscribe/eh0chb23n48uv',
    logo: null,
    cover: null,
    listeners: null,
    tags: ['industrial', 'dark', 'electronica', 'noise']
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
    streamUrl: 'https://stream.zeno.fm/vh0y7bv1qa0uv',
    metadataUrl: 'https://api.zeno.fm/mounts/metadata/subscribe/vh0y7bv1qa0uv',
    logo: null,
    cover: null,
    listeners: null,
    tags: ['hardcore', 'uptempo', 'terrorcore', 'speedcore']
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
    streamUrl: 'https://stream.zeno.fm/bq7cs28xqnhvv',
    metadataUrl: 'https://api.zeno.fm/mounts/metadata/subscribe/bq7cs28xqnhvv',
    logo: null,
    cover: null,
    listeners: null,
    tags: ['neo-rave', 'minimal', 'warehouse', 'after-hours']
  }
]

export const DEFAULT_STATION = 'pump-radio'

export const GENRE_COLORS = {
  'Hardtechno': '#ff2200',
  'Gabber / Hardcore': '#ff6600',
  'Hardstyle': '#00ddff',
  'Industrial': '#8844ff',
  'Hardcore': '#ff0055',
  'Neo-rave / Dark Minimal': '#555577'
}
