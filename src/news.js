/**
 * Noticias — Gestión de contenido
 * 
 * Como no tenemos backend propio, hacemos fetch a fuentes RSS/API
 * públicas y las renderizamos como cards.
 * 
 * Por ahora: datos hardcodeados como showcase.
 * Próximo paso: RSS real + traducción automática.
 */

const FALLBACK_NEWS = [
  {
    id: 1,
    title: 'Nuevo set de I Hate Models en Berghain circula online',
    summary: 'Una grabación del set completo del DJ francés en la última noche de Klubnacht está dando vueltas en SoundCloud y Mixcloud.',
    source: 'Rave News',
    date: '2026-05-27',
    url: '#',
    tags: ['hardtechno', 'berghain']
  },
  {
    id: 2,
    title: 'Thunderdome 2026 anuncia lineup completo',
    summary: 'El festival de hardcore más grande del mundo vuelve con Angerfist, Miss K8, Deadly Guns y más de 50 artistas en 5 escenarios.',
    source: 'Hardcore News',
    date: '2026-05-26',
    url: '#',
    tags: ['hardcore', 'festival', 'thunderdome']
  },
  {
    id: 3,
    title: 'Nuevo sello: Industrial Techno Records lanza compilado VA',
    summary: '17 artistas de la escena industrial techno global se unen en un compilado benéfico para clubs underground afectados por cierres.',
    source: 'Electronic Pulse',
    date: '2026-05-25',
    url: '#',
    tags: ['industrial', 'techno']
  },
  {
    id: 4,
    title: 'Defqon.1 2026 rompe récord de asistencia',
    summary: 'El festival australiano de hardstyle y hardcore congregó a más de 35,000 personas en Sídney durante el fin de semana.',
    source: 'Hardstyle Mag',
    date: '2026-05-24',
    url: '#',
    tags: ['hardstyle', 'festival', 'defqon']
  },
  {
    id: 5,
    title: 'Escucha: nuevo track de 999999999 con sonido más oscuro',
    summary: 'El dúo italiano vuelve con un sonido más industrial y menos rave, adelantando su próximo EP en Possession Records.',
    source: 'Techno Radar',
    date: '2026-05-23',
    url: '#',
    tags: ['hardtechno', 'industrial', 'release']
  },
  {
    id: 6,
    title: 'Los mejores festivales de música underground en Europa 2026',
    summary: 'Desde el Stone Techno Festival en Serbia hasta el Nachtdigital en Alemania: guía completa de festivales underground para este verano.',
    source: 'Underground Guide',
    date: '2026-05-22',
    url: '#',
    tags: ['festival', 'guide']
  }
]

export class NewsManager {
  constructor(container) {
    this.container = container
    this.articles = []
  }

  async init() {
    this.render(FALLBACK_NEWS)

    // Try to fetch real news if we had an API
    // this.fetchFromRSS().then(articles => this.render(articles))
  }

  render(articles) {
    this.articles = articles
    this.container.innerHTML = articles.map(article => this.renderCard(article)).join('')
  }

  renderCard(article) {
    const tag = article.tags?.[0] || ''
    return `
      <article class="news-card fade-in">
        <div class="news-source">${this.escapeHtml(article.source)}</div>
        <h3>${this.escapeHtml(article.title)}</h3>
        <p>${this.escapeHtml(article.summary)}</p>
        <div class="news-meta">
          <span class="date">${article.date}</span>
          ${tag ? `<span class="genre-tag">${tag}</span>` : ''}
        </div>
      </article>
    `
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
