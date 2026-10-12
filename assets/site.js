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
const closeMenuOnEscape = event => {
  if (event.key === 'Escape' && window.matchMedia('(max-width: 600px)').matches && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation menu');
    nav.dataset.collapsed = 'true';
    menu.focus();
  }
};
nav.addEventListener('keydown', closeMenuOnEscape);
menu.addEventListener('keydown', closeMenuOnEscape);

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
const researchCard = item => `<article class="card research-card">${item.pillar ? `<p class="tag">${escape(item.pillar)}</p>` : ''}<h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p></article>`;
const newsItem = item => `<article class="list-item"><time class="meta" datetime="${escape(item.date)}">${escape(item.date)}</time><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></article>`;
const pageHeading = (title, description) => `<h1>${escape(title)}</h1><p class="lead">${escape(description)}</p>`;
const emailLink = (email, label = email, subject = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') ? `<a href="mailto:${escape(email)}${subject ? `?subject=${escape(encodeURIComponent(subject))}` : ''}">${escape(label)}</a>` : '';
const profileLinks = links => (links || []).map(item => link(item.url, item.label)).join('');
const projectCard = project => `<article class="card">${project.pillar ? `<p class="tag">${escape(project.pillar)}</p>` : ''}<h3>${escape(project.title)}</h3><p>${escape(project.description)}</p>${link(project.url, 'Source research overview')}</article>`;
const opportunitiesView = data => `<section id="opportunities"><h2>Join the lab</h2><p class="lead">${escape(data.lab.joining)}</p><div class="grid opportunities">${(data.opportunities || []).map(item => `<article class="card"><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p></article>`).join('')}</div><p class="join-action">${emailLink(data.lab.email, 'Email your CV', 'Interest in joining MMBS Lab')}</p></section>`;
const highlightsView = data => `<section><div class="section-heading"><h2>Research highlights</h2><a href="research.html#projects">Explore the platforms</a></div><div class="grid">${data.research.flatMap(item => item.projects || []).map(projectCard).join('')}</div></section>`;
const personCard = person => `<article class="card person-card">${safeUrl(person.image) ? `<img class="portrait" src="${safeUrl(person.image)}" alt="${escape(person.name)}" loading="lazy">` : ''}<div><h3>${escape(person.name)}</h3><p class="meta">${escape(person.role)}</p><p>${escape(person.bio)}</p>${(person.timeline || []).length ? `<h4>Education and appointments</h4><ol class="timeline">${person.timeline.map(item => `<li><strong>${escape(item.label)}</strong><span>${escape(item.text)}</span></li>`).join('')}</ol>` : ''}<div class="links">${emailLink(person.email)}${person.links?.length ? profileLinks(person.links) : link(person.url, 'Profile')}</div></div></article>`;

function render(data) {
  const {lab, research, people, publications, news} = data;
  const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));
  const page = document.body.dataset.page;
  document.querySelector('#lab-name').textContent = lab.name;
  document.querySelector('#notice').textContent = lab.notice;
  document.querySelector('#notice').hidden = !lab.notice;
  document.querySelector('#footer-name').textContent = `${lab.name} · ${lab.institution}`;
  document.querySelector('.site-footer .container p:last-child').innerHTML = `${escape(lab.tagline)} · ${link('https://mmbslab.netlify.app/', 'Source lab website')}`;
  document.querySelector('meta[name="description"]').setAttribute('content', lab.intro);
  document.title = `${page === 'index' ? 'Home' : page[0].toUpperCase() + page.slice(1)} | ${lab.name}`;
  const views = {
    index: () => `<div class="hero"><div><p class="eyebrow">${escape(lab.institution)}</p><h1>${escape(lab.name)}</h1><p class="lead">${escape(lab.fullName || lab.tagline)}</p><p>${escape(lab.intro)}</p><div class="links"><a class="button" href="research.html">Explore our research</a><a class="button secondary" href="contact.html#opportunities">Join the lab</a></div></div>${safeUrl(lab.image) ? `<img class="hero-image" src="${safeUrl(lab.image)}" alt="${escape(lab.imageAlt)}">` : ''}</div>${lab.quote ? `<blockquote><p>${escape(lab.quote)}</p><cite>${escape(lab.quoteAttribution)}</cite></blockquote>` : ''}<section><h2>About the lab</h2>${(lab.about || []).map(text => `<p>${escape(text)}</p>`).join('')}<div class="grid pillars">${(lab.pillars || []).map(researchCard).join('')}</div></section>${highlightsView(data)}<section><div class="section-heading"><h2>Ten research directions</h2><a href="research.html">All research</a></div><div class="grid research-directions">${research.map(researchCard).join('')}</div></section>${sortedNews.length ? `<section><div class="section-heading"><h2>Recent news</h2><a href="news.html">All news</a></div>${sortedNews.slice(0, 3).map(newsItem).join('')}</section>` : ''}${opportunitiesView(data)}`,
    research: () => pageHeading('Research', 'Ten research directions connect our four pillars to human-relevant healthcare platforms.') + `<section id="projects"><h2>Flagship platforms</h2><div class="grid">${research.flatMap(item => item.projects || []).map(projectCard).join('')}</div></section><section><h2>Research areas</h2><div class="grid">${research.map(researchCard).join('')}</div></section>`,
    people: () => pageHeading('People', 'Our principal investigator and opportunities to join the growing research group.') + [...new Set(people.map(person => person.group))].map(group => `<section><h2>${escape(group)}</h2>${people.filter(person => person.group === group).map(personCard).join('')}</section>`).join('') + `<section><h2>Open positions</h2><div class="grid opportunities">${(data.memberGroups || []).map(group => `<article class="card"><h3>${escape(group.title)}</h3><p class="tag">${escape(group.status)}</p><a href="contact.html#opportunities">Joining information</a></article>`).join('')}</div></section>`,
    publications: () => pageHeading('Selected publications', data.publicationNote || 'Research outputs, grouped by publication year.') + `<div class="links">${profileLinks(lab.links?.filter(item => item.label === 'Google Scholar'))}</div>` + [...new Set(publications.map(item => item.year))].sort((a,b) => b-a).map(year => `<section><h2>${escape(year)}</h2>${publications.filter(item => item.year === year).map(item => `<article class="list-item"><h3>${escape(item.title)}</h3><p>${escape(item.authors)}</p><p class="meta">${escape(item.venue)} · ${escape(item.year)}</p><div class="links">${link(item.paperUrl, 'Read paper (DOI)')}${link(item.codeUrl, 'Code')}</div></article>`).join('')}</section>`).join(''),
    news: () => pageHeading('News & highlights', 'Announcements, research platforms and opportunities from the lab.') + (sortedNews.map(newsItem).join('') || `<p class="empty-state">${escape(data.newsEmptyMessage || 'No dated announcements are currently listed.')}</p>`) + highlightsView(data) + opportunitiesView(data),
    contact: () => pageHeading('Contact', 'Connect with Dr. Surjendu Maity about research, collaboration or joining the lab.') + `<section class="grid contact-grid"><article class="card"><h2>Visit us</h2><p class="address">${escape(lab.address)}</p></article><article class="card"><h2>Get in touch</h2><p>${emailLink(lab.email)}</p><div class="links">${profileLinks(lab.links)}</div></article></section>${opportunitiesView(data)}`
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
