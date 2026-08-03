/**
 * Noticias — Gestión de contenido
 *
 * Fuente principal: feeds RSS de la escena hardcore/hardstyle, traídos
 * vía proxy CORS público. Si el fetch falla (offline, proxy caído), cae
 * al contenido local como fallback. Los artículos se cachean en el
 * service worker cache-first, así que el sitio es rápido y resiliente.
 */

const FALLBACK_NEWS = [
  {
    title: 'Dominator 2026: apostá todo al festival de hardcore más masivo',
    summary: 'El festival de hardcore más grande de Países Bajos vuelve con una producción monstruosa. Escenarios temáticos, lo mejor del underground y una experiencia que no tiene nada que envidiarle a los grandes.',
    source: 'Hard News',
    date: '2026-05-27',
    url: 'https://hardnews.nl/en/place-your-bets-go-all-in-on-dominator-2026/',
    tags: ['hardcore', 'festival']
  },
  {
    title: 'Decibel Outdoor revela el line-up completo del WKND',
    summary: 'B2S se mandó una programación que promete caos de calidad desde que cae el sol hasta que salen los pájaros. Si pensabas skipearlo, reconsideralo.',
    source: 'Hard News',
    date: '2026-05-27',
    url: 'https://hardnews.nl/en/decibel-outdoor-unveils-extensive-wknd-line-up/',
    tags: ['hardstyle', 'festival']
  },
  {
    title: 'Musical Madness cumple 20 años: de club chico a fenómeno del hardstyle alemán',
    summary: 'Lo que arrancó sin un master plan terminó siendo uno de los sellos más importantes de Alemania. Una historia de laburo, constancia y kicks.',
    source: 'Hard News',
    date: '2026-05-23',
    url: 'https://hardnews.nl/en/musical-madness-celebrates-20-years-from-small-club-nights-to-german-hardstyle-phenomenon/',
    tags: ['hardstyle', 'aniversario']
  },
  {
    title: 'DJ The Prophet vuelve a los escenarios',
    summary: 'Una leyenda del hardstyle vuelve a donde pertenece. Después de un tiempo fuera de la ruta, confirma su regreso. Se viene show en grande.',
    source: 'Hard News',
    date: '2026-05-21',
    url: 'https://hardnews.nl/en/dj-the-prophet-returns-to-the-stage/',
    tags: ['hardstyle', 'regreso']
  }
]

// Fuentes RSS de la escena
const FEEDS = [
  { url: 'https://hardnews.nl/en/feed/', source: 'Hard News', tag: 'hardcore' },
  { url: 'https://www.djmag.com/rss', source: 'DJ Mag', tag: 'edm' }
]

const CORS_PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`
]

export class NewsManager {
  constructor(container) {
    this.container = container
    this.articles = []
  }

  async init() {
    // Mostramos el fallback al toque (instantáneo), luego intentamos RSS
    this.render(FALLBACK_NEWS)
    try {
      const live = await this.fetchRss()
      if (live && live.length) this.render(live.slice(0, 8))
    } catch {
      // ya está el fallback renderizado
    }
  }

  async fetchRss() {
    const tasks = FEEDS.map((feed, i) =>
      this.fetchFeed(feed, CORS_PROXIES[i % CORS_PROXIES.length])
    )
    const results = await Promise.allSettled(tasks)
    const articles = []
    results.forEach((r) => {
      if (r.status === 'fulfilled') articles.push(...r.value)
    })
    return articles.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  async fetchFeed(feed, proxy) {
    let res
    for (const makeUrl of [proxy, (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`]) {
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 8000)
        res = await fetch(makeUrl(feed.url), { signal: ctrl.signal })
        clearTimeout(timer)
        if (res.ok) break
      } catch { /* try next proxy */ }
    }
    if (!res || !res.ok) return []
    const xml = await res.text()
    return this.parseRss(xml, feed)
  }

  parseRss(xml, feed) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 8)
    return items.map((item) => {
      const title = (item.querySelector('title')?.textContent || '').trim()
      const link = (item.querySelector('link')?.textContent || item.getAttribute('rdf:about') || '').trim()
      const desc = (item.querySelector('description')?.textContent || '').trim()
      const dateRaw = (item.querySelector('pubDate')?.textContent || '').trim()
      const date = dateRaw ? new Date(dateRaw).toISOString().slice(0, 10) : ''
      // Quitar HTML del summary
      const div = document.createElement('div')
      div.innerHTML = desc
      const summary = div.textContent.trim().slice(0, 200)
      return { title, summary, source: feed.source, date, url: link, tags: [feed.tag] }
    }).filter(a => a.title)
  }

  render(articles) {
    this.articles = articles
    this.container.innerHTML = articles.map(a => this.renderCard(a)).join('')
  }

  renderCard(article) {
    const tag = article.tags?.[0] || ''
    const title = article.title
    const summary = article.summary || ''
    return `
      <a class="news-card fade-in" href="${this.escapeAttr(article.url)}" target="_blank" rel="noopener noreferrer">
        <div class="news-source">${this.escapeHtml(article.source)}</div>
        <h3>${this.escapeHtml(title)}</h3>
        <p>${this.escapeHtml(summary)}</p>
        <div class="news-meta">
          <span class="date">${this.escapeHtml(article.date)}</span>
          ${tag ? `<span class="genre-tag">${this.escapeHtml(tag)}</span>` : ''}
          <span class="news-arrow">→</span>
        </div>
      </a>
    `
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  escapeAttr(text) {
    return (text || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }
}
