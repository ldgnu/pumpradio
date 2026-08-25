/**
 * Estaciones de PumpRadio
 * Hardcore, Hardstyle, Nu Jazz, Future Jazz, Jazztronica
 */

const HC_STREAM = 'https://stream.zeno.fm/nv74sz7wum0uv' // hardcore real (antes: reutilizaba el stream de hardstyle)
const HS_STREAM = 'https://stream.zeno.fm/gpv2kgzwum0uv' // hardstyle
const DT_STREAM = 'https://stream.zeno.fm/fpfejm9r55vuv' // deep techno
const HC_METADATA = 'https://api.zeno.fm/mounts/metadata/subscribe/nv74sz7wum0uv'
const HS_METADATA = 'https://api.zeno.fm/mounts/metadata/subscribe/e4vzegzwum0uv'
const DT_METADATA = 'https://api.zeno.fm/mounts/metadata/subscribe/fpfejm9r55vuv'

export const STATIONS = [
  {
    id: 'pump-radio',
    name: 'PumpRadio',
    tagline: 'Hardcore · Hardstyle · Nu Jazz · Grooves',
    genre: 'Multi-género',
    description: 'La estación principal. Hardcore cuando necesitás potencia, hardstyle para los kicks melódicos, y jazz futurista para bajar. Un viaje completo.',
    color: '#cc4400',
    colorSecondary: '#992200',
    accent: '#ee7722',
    streamUrl: HS_STREAM,
    metadataUrl: HS_METADATA,
    tags: ['hardcore', 'hardstyle', 'nujazz', 'electronic'],
    comingSoon: false
  },
  {
    id: 'hardstyle',
    name: 'Neon Hardstyle',
    tagline: 'Hardstyle · Raw · Melodic',
    genre: 'Hardstyle',
    description: 'Hardstyle melódico y potente. Reverse bass, kicks contundentes, breakdowns épicos.',
    color: '#00bbdd',
    colorSecondary: '#0088aa',
    accent: '#44ddff',
    streamUrl: HS_STREAM,
    metadataUrl: HS_METADATA,
    tags: ['hardstyle', 'melodic', 'raw'],
    comingSoon: false
  },
  {
    id: 'hardcore',
    name: 'Core Frequency',
    tagline: 'Hardcore · Uptempo · Gabber',
    genre: 'Hardcore',
    description: 'Hardcore en todas sus formas. Uptempo, terror, gabber oldschool. Cuando querés sentir el kick en el pecho.',
    color: '#dd2244',
    colorSecondary: '#aa0033',
    accent: '#ff5577',
    streamUrl: HC_STREAM,
    metadataUrl: HC_METADATA,
    tags: ['hardcore', 'uptempo', 'gabber'],
    comingSoon: false
  },
  {
    id: 'nujazz',
    name: 'Neo Jazz',
    tagline: 'Nu Jazz · Future Jazz · Jazztronica',
    genre: 'Nu Jazz / Future Jazz',
    description: 'Jazz futurista para las 24 horas. Grooves electrónicos, beats rotos, teclados vintage y sintes modernos. De Robert Glasper a Flying Lotus, de Brainfeeder al vinilo caliente. Para producir, laburar o flotar.',
    color: '#4488aa',
    colorSecondary: '#226688',
    accent: '#66bbdd',
    streamUrl: '',
    metadataUrl: '',
    tags: ['nujazz', 'futurejazz', 'jazztronica', 'grooves'],
    comingSoon: true
  },
  {
    id: 'jazztronica',
    name: 'Electric Grooves',
    tagline: 'Jazztronica · Beats · Electrónica orgánica',
    genre: 'Jazztronica / Electronic',
    description: 'La intersección entre el jazz y la electrónica. Sinthes analógicos, samples de vinilo, ritmos rotos y armonías que no sabías que necesitabas. De Kaytranada a Thundercat, de BADBADNOTGOOD a los rincones más profundos de Bandcamp.',
    color: '#668855',
    colorSecondary: '#446633',
    accent: '#88bb66',
    streamUrl: '',
    metadataUrl: '',
    tags: ['jazztronica', 'beats', 'electronic', 'vinyl'],
    comingSoon: true
  }
]

export const DEFAULT_STATION = 'pump-radio'
