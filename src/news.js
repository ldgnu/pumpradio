/**
 * Noticias — Gestión de contenido
 * 
 * Fuente principal: Hard News (https://hardnews.nl/en/)
 * Traducción y adaptación al español argentino.
 */

const NEWS_ARTICLES = [
  {
    id: 1,
    title: 'Dominator 2026: apostá todo al festival de hardcore más masivo',
    summary: 'El festival de hardcore más grande de Países Bajos vuelve con una producción monstruosa. Escenarios temáticos, lo mejor del underground y una experiencia que no tiene nada que envidiarle a los grandes. Verano, sol, hardcore: la combinación perfecta.',
    source: 'Hard News',
    date: '2026-05-27',
    url: 'https://hardnews.nl/en/place-your-bets-go-all-in-on-dominator-2026/',
    tags: ['hardcore', 'festival', 'dominator']
  },
  {
    id: 2,
    title: 'Decibel Outdoor revela el line-up completo del WKND',
    summary: 'El festival más picante del hardstyle suelto acaba de soltar su cartel para las noches del WKND. B2S se mandó una programación que promete caos de calidad desde que cae el sol hasta que salen los pájaros. Si pensabas skipearlo, reconsideralo.',
    source: 'Hard News',
    date: '2026-05-27',
    url: 'https://hardnews.nl/en/decibel-outdoor-unveils-extensive-wknd-line-up/',
    tags: ['hardstyle', 'festival', 'decibel']
  },
  {
    id: 3,
    title: 'De drill beats a uptempo: la historia del hype bizarro de KEMAL',
    summary: 'El nombre KEMAL explotó en los últimos meses. En Classified el área estaba repleta, en REBiRTH se robó la escena, y en las redes no se habla de otra cosa. ¿De dónde salió este pibe? La historia de cómo pasó de hacer drill a ser la sensación del uptempo.',
    source: 'Hard News',
    date: '2026-05-26',
    url: 'https://hardnews.nl/en/from-drill-beats-to-uptempo-the-story-behind-kemals-bizarre-hype/',
    tags: ['uptempo', 'kemal', 'entrevista']
  },
  {
    id: 4,
    title: 'Musical Madness cumple 20 años: de club chico a fenómeno del hardstyle alemán',
    summary: 'Lo que arrancó sin un master plan terminó siendo uno de los sellos más importantes de Alemania. Veinte años después, Musical Madness mira para atrás y repasa cómo pasaron de hacer eventos en boliches chicos a llenar estadios. Una historia de laburo, constancia y kicks.',
    source: 'Hard News',
    date: '2026-05-23',
    url: 'https://hardnews.nl/en/musical-madness-celebrates-20-years-from-small-club-nights-to-german-hardstyle-phenomenon/',
    tags: ['hardstyle', 'musical-madness', 'aniversario']
  },
  {
    id: 5,
    title: 'DJ The Prophet vuelve a los escenarios',
    summary: 'Una leyenda del hardstyle vuelve a donde pertenece. Después de un tiempo fuera de la ruta, The Prophet confirma su regreso a los escenarios. Se viene show en grande, con toda la artillería de siempre. Los que vivieron la época dorada saben que esto es notición.',
    source: 'Hard News',
    date: '2026-05-21',
    url: 'https://hardnews.nl/en/dj-the-prophet-returns-to-the-stage/',
    tags: ['hardstyle', 'the-prophet', 'regreso']
  }
]

export class NewsManager {
  constructor(container) {
    this.container = container
    this.articles = []
  }

  async init() {
    this.render(NEWS_ARTICLES)
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
