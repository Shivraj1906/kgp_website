// Dependency-free checks for all six rendered pages and the imported content.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/content.json'), 'utf8'));
const source = JSON.parse(fs.readFileSync(path.join(root, 'data/source.json'), 'utf8'));
const script = fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8');
assert.equal(data.research.length, source.counts.researchAreas);
assert.equal(data.research.flatMap(item => item.projects).length, source.counts.flagshipProjects);
assert.equal(data.publications.length, source.counts.publications);
assert.equal(data.people.length, source.counts.namedPeople);
assert.equal(data.memberGroups.length, source.counts.openMemberGroups);
assert.equal(data.opportunities.length, source.counts.opportunities);
assert.equal(data.news.length, source.counts.datedNews);
for (const asset of source.assets) {
  assert.ok(fs.readFileSync(path.join(root, asset.localPath)).subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
}
const rendered = {};
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
for (const page of ['index', 'research', 'people', 'publications', 'news', 'contact']) {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {dataset: {}, attributes: {}, listeners: {}, hidden: false, innerHTML: '', textContent: '', addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }, dispatch(type, event = {}) { for (const handler of this.listeners[type] || []) handler(event); }, focus() { this.focused = true; }, getAttribute(name) { return this.attributes[name]; }, setAttribute(name, value) { this.attributes[name] = value; }});
    return elements.get(selector);
  };
  const document = {baseURI: `http://localhost:8000/${page}.html`, body: {dataset: {page}}, querySelector: element};
  const context = vm.createContext({document, window: {matchMedia: () => ({matches: true})}, URL, console, data, fetch: () => new Promise(() => {})});
  vm.runInContext(script + '\nrender(data);', context);
  vm.runInContext('enhanceMotion();', context);
  context.window.matchMedia = query => ({matches: query === '(max-width: 600px)'});
  vm.runInContext('enhanceMotion();', context);
  const menu = element('.menu-toggle');
  const nav = element('#navigation');
  assert.equal(menu.hidden, false, page + ': menu progressively enabled');
  assert.equal(nav.dataset.collapsed, 'true');
  menu.dispatch('click');
  assert.equal(menu.getAttribute('aria-expanded'), 'true');
  assert.equal(menu.getAttribute('aria-label'), 'Close navigation menu');
  assert.equal(nav.dataset.collapsed, 'false');
  nav.dispatch('keydown', {key: 'Escape'});
  assert.equal(menu.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.getAttribute('aria-label'), 'Open navigation menu');
  assert.equal(nav.dataset.collapsed, 'true');
  assert.equal(menu.focused, true, page + ': Escape returns focus to menu');
  menu.dispatch('click');
  menu.dispatch('click');
  assert.equal(nav.dataset.collapsed, 'true', page + ': second click closes menu');
  const html = element('#main').innerHTML;
  rendered[page] = html;
  assert.equal((html.match(/<h1>/g) || []).length, 1, page + ': one page heading');
  assert.ok(!/undefined|fictional|placeholder|Example University/.test(html), page + ': no dummy data');
  assert.equal(element('#notice').hidden, true);
  assert.ok(document.title.includes(data.lab.name));
  const shell = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
  assert.ok(!/prototype|fictional|Research Lab</.test(shell), page + ': shell identity');
  assert.ok(/class="header-identity"><a class="brand"/.test(shell), page + ': wordmark has its own layout container');
  assert.ok(shell.includes('class="lab-emblem"'), page + ': emblem present');
  assert.ok(shell.includes('class="header-institution"'), page + ': institution present');
  assert.ok(!shell.includes('Microfluidics ?'), page + ': header separators are intact');
  for (const match of (shell + html).matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), document.baseURI);
    if (url.hostname === 'localhost') assert.ok(fs.existsSync(path.join(root, url.pathname)), `${page}: missing ${url.pathname}`);
  }
  console.log(`PASS ${page}.html renders with valid local links`);
}
for (const [page, html] of Object.entries(rendered)) {
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), `http://localhost:8000/${page}.html`);
    if (url.hostname !== 'localhost' || !url.hash) continue;
    const targetPage = path.basename(url.pathname, '.html');
    const targetHtml = rendered[targetPage] + fs.readFileSync(path.join(root, targetPage + '.html'), 'utf8');
    assert.ok(targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${page}: missing anchor ${url.href}`);
  }
}
for (const area of data.research) {
  assert.ok(rendered.research.includes(escapeHtml(area.title)), 'Research area retained: ' + area.title);
  assert.ok(rendered.research.includes(escapeHtml(area.summary)), 'Research summary retained: ' + area.title);
  for (const project of area.projects || []) {
    assert.ok(rendered.research.includes(escapeHtml(project.title)), 'Project retained: ' + project.title);
    assert.ok(rendered.research.includes(escapeHtml(project.description)), 'Project description retained: ' + project.title);
  }
}
for (const paper of data.publications) {
  assert.ok(rendered.publications.includes(escapeHtml(paper.title)), 'Publication retained: ' + paper.title);
  assert.ok(rendered.publications.includes(`href="${escapeHtml(paper.paperUrl)}"`), 'Paper link retained: ' + paper.title);
}
assert.equal((rendered.people.match(/<li><strong>/g) || []).length, 4);
assert.ok(rendered.news.includes(data.newsEmptyMessage));
assert.ok(rendered.contact.includes('mailto:surjendu@che.iitkgp.ac.in'));
assert.ok(rendered.contact.includes('id="opportunities"'));
assert.ok(rendered.research.includes('id="projects"'));
console.log('PASS import counts, PNG assets, research content, biography, DOI links, empty news, contact details and mobile menu interaction');

// Page headers may differ only in their active navigation marker.
const pages = ['index', 'research', 'people', 'publications', 'news', 'contact'];
const headers = pages.map(page => {
  const shell = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
  const header = shell.match(/<header[\s\S]*?<\/header>/)[0];
  assert.equal((header.match(/aria-current="page"/g) || []).length, 1, page + ': one active tab');
  const activeHref = header.match(/href="([^"]+)" aria-current="page"/)[1];
  assert.equal(new URL(activeHref, 'http://localhost:8001/').pathname, '/' + page + '.html', page + ': correct active tab');
  return header.replace(/ aria-current="page"/g, '');
});
for (const header of headers) assert.equal(header, headers[0], 'consistent header across all pages');
console.log('PASS identical headers and correct active navigation on all six pages');
