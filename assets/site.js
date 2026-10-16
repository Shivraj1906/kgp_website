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
const newsItem = item => `<article class="list-item"><time class="meta" datetime="${escape(item.date)}">${escape(item.date)}</time><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></article>`;
const pageHeading = (title, description) => `<div class="page-masthead"><p class="eyebrow">${escape(document.querySelector('#lab-name').textContent)} / ${escape(title)}</p><div class="page-title"><h1>${escape(title)}</h1><p>${escape(description)}</p></div></div>`;
const emailLink = (email, label = email, subject = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') ? `<a href="mailto:${escape(email)}${subject ? `?subject=${escape(encodeURIComponent(subject))}` : ''}">${escape(label)}</a>` : '';
const profileLinks = links => (links || []).map(item => link(item.url, item.label)).join('');
const opportunitiesView = data => `<section id="opportunities" class="opportunity-section"><div class="section-intro"><div><p class="eyebrow">A place for curious minds</p><h2>Find your next<br>research question.</h2></div><div><p class="standfirst">${escape(data.lab.joining)}</p><p class="join-action">${emailLink(data.lab.email, 'Email your CV ↗', 'Interest in joining MMBS Lab')}</p></div></div><div class="opportunity-grid">${(data.opportunities || []).map(item => `<article><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p></article>`).join('')}</div></section>`;
const highlightsView = data => `<section class="journal-highlights"><div class="section-intro"><div><p class="eyebrow">From the laboratory</p><h2>Research in focus</h2></div><a class="button" href="research.html?v=20261016-header3#projects">Explore the research</a></div><div class="journal-grid">${data.research.flatMap(item => item.projects || []).map(project => `<article><figure><img src="${safeUrl(project.illustration) || 'assets/images/fluid-circuit.jpg'}" alt="${escape(project.imageAlt || '')}" loading="lazy"><figcaption>${mediaCredit(project)}</figcaption></figure><p class="eyebrow">${escape(project.pillar || 'Research')}</p><h3>${escape(project.title)}</h3><p>${escape(project.description)}</p>${link(project.url, project.linkLabel || 'Read more')}</article>`).join('')}</div></section>`;
const mediaCredit = project => `${escape(project.imageCaption || 'Reference image')} &middot; ${link(project.imageSource, project.imageCredit || 'Source')} &middot; ${link(project.imageLicenseUrl, project.imageLicense || 'License')}<span class="media-context">External reference; resized / cropped.</span>`;
const personCard = person => `<article class="card person-card">${safeUrl(person.image) ? `<img class="portrait" src="${safeUrl(person.image)}" alt="${escape(person.name)}" loading="lazy">` : ''}<div><h3>${escape(person.name)}</h3><p class="meta">${escape(person.role)}</p><p>${escape(person.bio)}</p>${(person.timeline || []).length ? `<h4>Education and appointments</h4><ol class="timeline">${person.timeline.map(item => `<li><strong>${escape(item.label)}</strong><span>${escape(item.text)}</span></li>`).join('')}</ol>` : ''}<div class="links">${emailLink(person.email)}${person.links?.length ? profileLinks(person.links) : link(person.url, 'Profile')}</div></div></article>`;

function render(data) {
  const {lab, research, people, publications, news} = data;
  const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));
  const page = document.body.dataset.page;
  document.querySelector('#lab-name').textContent = lab.name;
  document.querySelector('#notice').textContent = lab.notice;
  document.querySelector('#notice').hidden = !lab.notice;
  document.querySelector('#footer-name').textContent = `${lab.name} · ${lab.institution}`;
  document.querySelector('.site-footer .container p:last-child').innerHTML = `${escape(lab.tagline)} · ${link('https://www.iitkgp.ac.in/department/CH/faculty/ch-surjendu', 'Faculty profile')}`;
  document.querySelector('meta[name="description"]').setAttribute('content', lab.intro);
  document.title = `${page === 'index' ? 'Home' : page[0].toUpperCase() + page.slice(1)} | ${lab.name}`;
  const views = {
    index: () => `<section class="home-hero" aria-label="MMBS research overview"><div class="hero-imagery"><video id="hero-video" class="hero-primary" data-src="assets/video/cell-culture.mp4" poster="assets/images/cell-culture.jpg" preload="none" muted loop playsinline aria-label="Time-lapse phase-contrast microscopy of HEK-293 cells growing in culture. Source: Walsh and colleagues, 2017."></video><div class="hero-details" aria-hidden="true"><img src="assets/images/t-lymphocyte.jpg" alt=""><img src="assets/images/fluid-circuit.jpg" alt=""></div></div><div class="home-masthead"><p class="eyebrow">Engineering at the interface of life</p><h1>Small systems.<br>Big possibilities.</h1><a class="button" href="research.html?v=20261016-header3">Explore our research</a></div><div class="hero-footnote"><span>MMBS / IIT Kharagpur</span><span>Real microscopy &middot; reference footage</span><button type="button" class="hero-media-toggle" aria-controls="hero-video" hidden>Play video</button><a href="#home-research" aria-label="Read about the laboratory">&#8595;</a></div></section><aside class="hero-credit" aria-label="Media credits"><p>Cell-culture time-lapse and fluid circuit: <a href="https://doi.org/10.1038/s41467-017-00846-4">Walsh et al., 2017</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>). T-cell micrograph: <a href="https://www.flickr.com/photos/54591706@N02/54121207473/">NIAID</a> (<a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>). Video transcoded; stills extracted / resized; display crops and dark overlays applied. Reference material, not MMBS experimental data.</p></aside>
<section class="home-introduction" id="home-research"><div class="mission-mark"><img src="${safeUrl(lab.image)}" alt="${escape(lab.imageAlt)}" width="240" height="240" loading="lazy"><p class="eyebrow">Engineering. Biology. Discovery.</p></div><div><p class="eyebrow">Our mission</p><h2>Understanding life.<br>Engineering possibilities.</h2><p class="home-standfirst">${escape(lab.intro)}</p>${(lab.about || []).map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}<a class="button" href="research.html?v=20261016-header3">More about research</a></div></section>
<div class="research-pillars" role="group" aria-label="Our research disciplines">${(lab.pillars || []).map((pillar, index) => `<div><span class="pillar-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h2>${escape(pillar.title)}</h2><p>${escape(pillar.summary)}</p></div>`).join('')}</div>
<section class="home-studies"><div class="home-section-title"><div><p class="eyebrow">From concept to discovery</p><h2>Research in focus</h2></div><a class="text-link" href="research.html?v=20261016-header3#projects">View research &#8599;</a></div><div class="study-grid">${research.flatMap(item => item.projects || []).slice(0,3).map((project,index) => `<article class="study"><a class="study-image" href="research.html?v=20261016-header3#projects" aria-label="Explore ${escape(project.title)}"><img src="${safeUrl(project.illustration) || 'assets/images/fluid-circuit.jpg'}" alt="${escape(project.imageAlt || '')}" loading="lazy"><span>0${index+1} / Reference image</span></a><p class="media-credit">${mediaCredit(project)}</p><p class="eyebrow">${escape(project.pillar || 'Research')}</p><h3><a href="research.html?v=20261016-header3#projects">${escape(project.title)}</a></h3><p>${escape(project.description)}</p></article>`).join('')}</div></section>
<section class="home-publications"><div><p class="eyebrow">Selected publications</p><h2>Science.<br>In print.</h2><a class="button" href="publications.html?v=20261016-header3">View publications</a></div><div>${[...publications].sort((a,b)=>b.year-a.year).slice(0,3).map(item=>`<article><p class="meta">${escape(item.year)} &middot; ${escape(item.venue)}</p><h3>${escape(item.title)}</h3><p>${escape(item.authors)}</p>${link(item.paperUrl,'Read paper \u2197')}</article>`).join('') || '<p>Publications will be added here.</p>'}</div></section>
<section class="home-invitation"><p class="eyebrow">Join the pursuit</p><h2>The next discovery<br>starts with a question.</h2><p>${escape(lab.joining)}</p><a class="button" href="contact.html?v=20261016-header3#opportunities">Connect with the lab</a></section>`,
    research: () => pageHeading('Research', 'Microfluidic devices, tissue models and sensing systems for studying disease and treatment responses.') + `<section id="projects" class="research-features">${research.flatMap(item => item.projects || []).map((project,index) => `<article class="research-feature"><figure><img src="${safeUrl(project.illustration) || 'assets/images/fluid-circuit.jpg'}" alt="${escape(project.imageAlt || '')}" loading="lazy"><figcaption>${mediaCredit(project)}</figcaption></figure><div><p class="eyebrow">${String(index+1).padStart(2,'0')} / ${escape(project.pillar || 'Research')}</p><h2>${escape(project.title)}</h2><p>${escape(project.description)}</p>${link(project.url, project.linkLabel || 'Research overview')}</div></article>`).join('')}</section><section class="research-directory"><div class="section-intro"><div><p class="eyebrow">Questions that connect us</p><h2>Across disciplines.</h2></div><p class="standfirst">${escape(lab.intro)}</p></div><div class="area-grid">${research.map((item,index) => `<article><span class="area-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><p class="eyebrow">${escape(item.pillar || 'Research')}</p><h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p></div></article>`).join('')}</div></section>`,
    people: () => pageHeading('People', 'Meet the people bringing engineering and biology together.') + [...new Set(people.map(person => person.group))].map(group => `<section class="people-group"><p class="eyebrow">${escape(group)}</p>${people.filter(person => person.group === group).map(personCard).join('')}</section>`).join('') + `<section class="people-invitation"><div class="section-intro"><div><p class="eyebrow">Build with us</p><h2>A growing community.</h2></div><div><p class="standfirst">${escape(lab.joining)}</p><a class="button" href="contact.html?v=20261016-header3#opportunities">Joining the lab</a></div></div><div class="opportunity-grid">${(data.memberGroups || []).map(group => `<article><h3>${escape(group.title)}</h3><p class="eyebrow">${escape(group.status)}</p></article>`).join('')}</div></section>`,
    publications: () => pageHeading('Publications', data.publicationNote || 'Ideas into evidence. Explore our research outputs, grouped by year.') + `<div class="archive-links links">${profileLinks(lab.links?.filter(item => item.label === 'Google Scholar'))}</div><div class="publication-archive">${[...new Set(publications.map(item => item.year))].sort((a,b) => b-a).map(year => `<section class="publication-year"><div><p class="eyebrow">Published work</p><h2>${escape(year)}</h2></div><div>${publications.filter(item => item.year === year).map(item => `<article class="publication-entry"><p class="eyebrow">${escape(item.venue)}</p><h3>${escape(item.title)}</h3><p class="publication-authors">${escape(item.authors)}</p>${item.summary ? `<p>${escape(item.summary)}</p>` : ''}<div class="links">${link(item.paperUrl, 'Read paper ↗')}${link(item.codeUrl, 'Code ↗')}</div></article>`).join('')}</div></section>`).join('') || '<p class="empty-state">Publications will be added here.</p>'}</div>`,
    news: () => pageHeading('News', 'A journal of research, ideas and life in the laboratory.') + (sortedNews.length ? `<section class="news-journal"><p class="eyebrow">Latest from the lab</p>${sortedNews.map(newsItem).join('')}</section>` : `<div class="journal-note"><p class="eyebrow">From the lab</p><p>${escape(data.newsEmptyMessage || 'Updates from the laboratory will appear here. Explore our research highlights below.')}</p></div>`) + highlightsView(data) + `<section class="home-invitation"><p class="eyebrow">Be part of what comes next</p><h2>Bring your curiosity.</h2><a class="button" href="contact.html?v=20261016-header3#opportunities">Explore opportunities</a></section>`,
    contact: () => pageHeading('Contact', 'A conversation can be the beginning of a new discovery. Connect with us about research, collaboration or joining the lab.') + `<section class="contact-feature"><div class="location-panel"><p class="eyebrow">Find us at</p><h2>IIT<br>Kharagpur.</h2><p class="address">${escape(lab.address)}</p><span class="location-mark" aria-hidden="true">↗</span></div><div class="contact-details"><p class="eyebrow">Start a conversation</p><h2>Let’s connect.</h2><p class="standfirst">${escape(lab.institution)}</p><div class="contact-email">${emailLink(lab.email) || '<p>Contact details will be added here.</p>'}</div><div class="links">${profileLinks(lab.links)}</div></div></section>${opportunitiesView(data)}`
  };
  main.innerHTML = views[page]();

}

// Enhancements never hide content in CSS; unavailable animation APIs are harmless.
function enhanceMotion() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window)) return;
  const active = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const target = entry.target;
      observer.unobserve(target);
      if (preference.matches || target.contains(document.activeElement) || target.closest(':target') || target.querySelector(':target') || !target.animate) continue;
      try {
        const animation = target.animate([
          { opacity: .15, transform: 'translateY(28px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)' });
        active.add(animation);
        animation.onfinish = animation.oncancel = () => active.delete(animation);
      } catch { /* Content stays visible if the browser cannot animate. */ }
    }
  }, { threshold: .08 });
  main.querySelectorAll('.home-masthead, .page-masthead, .home-section-title, .home-introduction, .study, .home-publications, .home-invitation, .research-feature, .area-grid article, .person-card, .publication-year, .journal-grid article, .opportunity-grid article').forEach(target => {
    if (target.matches('.home-masthead, .page-masthead') || target.getBoundingClientRect().top >= window.innerHeight) observer.observe(target);
  });
  const cancelMotion = () => { for (const animation of active) animation.cancel(); };
  preference.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); cancelMotion(); }
  });
  // Focus and fragment navigation take precedence over presentation.
  main.addEventListener('focusin', cancelMotion);
  window.addEventListener('hashchange', cancelMotion);
  window.addEventListener('beforeprint', cancelMotion);
}

fetch('data/content.json?v=20261016-research-photos2', { cache: 'no-store' })
  .then(response => { if (!response.ok) throw new Error('Content request failed'); return response.json(); })
  .then(render)
  .then(() => { try { enhanceMotion(); } catch { /* Optional enhancement. */ } })
  .then(() => { try { window.initHeroVideo?.(); } catch { /* The poster remains visible. */ } })
  .catch(error => {
    main.innerHTML = '<h1>Content could not be loaded</h1><p>Please check that data/content.json contains valid JSON and reload the page. For local preview, serve this folder using the command in the README.</p>';
    console.error(error);
  });
