const main = document.querySelector('#main');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
menu.hidden = false;
nav.dataset.collapsed = 'true';
menu.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  menu.setAttribute('aria-label', expanded ? 'Close navigation menu' : 'Open navigation menu');
  nav.dataset.collapsed = String(!expanded);
});
nav.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation menu');
    nav.dataset.collapsed = 'true';
    menu.focus();
  }
});

// Treat content as text, including any HTML characters entered by an editor.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, document.baseURI);
    return ['https:', 'http:'].includes(url.protocol) ? escape(url.href) : '';
  } catch { return ''; }
}
const link = (url, label) => safeUrl(url) ? `<a href="${safeUrl(url)}">${escape(label)}</a>` : '';
const researchCard = item => `<article class="card"><h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p></article>`;
const newsItem = item => `<article class="list-item"><time class="meta" datetime="${escape(item.date)}">${escape(item.date)}</time><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></article>`;
const pageHeading = (title, description) => `<h1>${title}</h1><p class="lead">${description}</p>`;

function render(data) {
  const {lab, research, people, publications, news} = data;
  const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));
  const page = document.body.dataset.page;
  document.querySelector('#lab-name').textContent = lab.name;
  document.querySelector('#notice').textContent = lab.notice;
  document.querySelector('#notice').hidden = !lab.notice;
  document.querySelector('#footer-name').textContent = `${lab.name} · ${lab.institution}`;
  document.title = `${page === 'index' ? 'Home' : page[0].toUpperCase() + page.slice(1)} | ${lab.name}`;
  const views = {
    index: () => `<div class="hero"><div><p class="eyebrow">${escape(lab.institution)}</p><h1>${escape(lab.name)}</h1><p class="lead">${escape(lab.tagline)}</p><p>${escape(lab.intro)}</p><a class="button" href="research.html">Explore our research</a></div><div class="placeholder">Lab or research image placeholder</div></div><section><div class="section-heading"><h2>Research themes</h2><a href="research.html">All research</a></div><div class="grid">${research.map(researchCard).join('')}</div></section><section><div class="section-heading"><h2>Recent news</h2><a href="news.html">All news</a></div>${sortedNews.slice(0, 3).map(newsItem).join('') || '<p>News will be added here.</p>'}</section>`,
    research: () => pageHeading('Research', 'Our research themes and current projects.') + research.map(item => `<section><h2>${escape(item.title)}</h2><p class="lead">${escape(item.summary)}</p><div class="grid">${(item.projects || []).map(project => `<article class="card"><h3>${escape(project.title)}</h3><p>${escape(project.description)}</p>${link(project.url, 'Project details')}</article>`).join('')}</div></section>`).join(''),
    people: () => pageHeading('People', 'Meet our faculty, researchers, students, and alumni.') + [...new Set(people.map(person => person.group))].map(group => `<section><h2>${escape(group)}</h2><div class="grid">${people.filter(person => person.group === group).map(person => `<article class="card">${safeUrl(person.image) ? `<img class="portrait" src="${safeUrl(person.image)}" alt="${escape(person.name)}" loading="lazy">` : '<div class="placeholder portrait">Portrait placeholder</div>'}<h3>${escape(person.name)}</h3><p class="meta">${escape(person.role)}</p><p>${escape(person.bio)}</p>${link(person.url, 'Profile')}</article>`).join('')}</div></section>`).join(''),
    publications: () => pageHeading('Publications', 'Research outputs, grouped by publication year.') + [...new Set(publications.map(item => item.year))].sort((a,b) => b-a).map(year => `<section><h2>${escape(year)}</h2>${publications.filter(item => item.year === year).map(item => `<article class="list-item"><h3>${escape(item.title)}</h3><p>${escape(item.authors)}</p><p class="meta">${escape(item.venue)} · ${escape(item.year)}</p><div class="links">${link(item.paperUrl, 'Paper')}${link(item.codeUrl, 'Code')}</div></article>`).join('')}</section>`).join(''),
    news: () => pageHeading('News', 'Updates, milestones, and announcements from the lab.') + (sortedNews.map(newsItem).join('') || '<p>News will be added here.</p>'),
    contact: () => pageHeading('Contact', 'Get in touch or learn about joining the lab.') + `<section class="grid"><article class="card"><h2>Visit us</h2><p>${escape(lab.institution)}</p><p class="address">${escape(lab.address)}</p></article><article class="card"><h2>Email</h2>${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lab.email) ? `<a href="mailto:${escape(lab.email)}">${escape(lab.email)}</a>` : '<p>Lab email to be added.</p>'}</article><article class="card"><h2>Join the lab</h2><p>${escape(lab.joining)}</p></article></section>`
  };
  main.innerHTML = views[page]();
}

fetch('data/content.json')
  .then(response => { if (!response.ok) throw new Error('Content request failed'); return response.json(); })
  .then(render)
  .catch(error => {
    main.innerHTML = '<h1>Content could not be loaded</h1><p>Please check that data/content.json contains valid JSON and reload the page. For local preview, serve this folder using the command in the README.</p>';
    console.error(error);
  });
