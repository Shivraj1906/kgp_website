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
for (const page of ['index', 'research', 'people', 'publications', 'news', 'contact']) {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {dataset: {}, attributes: {}, hidden: false, innerHTML: '', textContent: '', addEventListener() {}, focus() {}, getAttribute(name) { return this.attributes[name]; }, setAttribute(name, value) { this.attributes[name] = value; }});
    return elements.get(selector);
  };
  const document = {baseURI: `http://localhost:8000/${page}.html`, body: {dataset: {page}}, querySelector: element};
  const context = vm.createContext({document, window: {matchMedia: () => ({matches: true})}, URL, console, data, fetch: () => new Promise(() => {})});
  vm.runInContext(script + '\nrender(data);', context);
  const html = element('#main').innerHTML;
  rendered[page] = html;
  assert.equal((html.match(/<h1>/g) || []).length, 1, page + ': one page heading');
  assert.ok(!/undefined|fictional|placeholder|Example University/.test(html), page + ': no dummy data');
  assert.equal(element('#notice').hidden, true);
  assert.ok(document.title.includes(data.lab.name));
  const shell = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
  assert.ok(!/prototype|fictional|Research Lab</.test(shell), page + ': shell identity');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), document.baseURI);
    if (url.hostname === 'localhost') assert.ok(fs.existsSync(path.join(root, url.pathname)), `${page}: missing ${url.pathname}`);
  }
  console.log(`PASS ${page}.html renders with valid local links`);
}
assert.equal((rendered.research.match(/class="card research-card"/g) || []).length, 10);
assert.equal((rendered.publications.match(/Read paper \(DOI\)/g) || []).length, 3);
assert.equal((rendered.people.match(/<li><strong>/g) || []).length, 4);
assert.ok(rendered.news.includes(data.newsEmptyMessage));
assert.ok(rendered.contact.includes('mailto:surjendu@che.iitkgp.ac.in'));
assert.ok(rendered.contact.includes('id="opportunities"'));
assert.ok(rendered.research.includes('id="projects"'));
console.log('PASS import counts, PNG assets, biography, DOI links, empty news and contact details');
