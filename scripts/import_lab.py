"""Import the public MMBS lab page into this site's JSON schema (stdlib only).

Research descriptions and biographies are condensed; names, publication metadata,
links and contact details are retained. Fail on unexpected source structure.
"""
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import json
import re
from urllib.request import urlopen
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://mmbslab.netlify.app/'


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def text(self):
        return re.sub(r'\s+', ' ', ''.join(c.text() if isinstance(c, Node) else c for c in self.children)).strip()

    def find(self, tag=None, cls=None, id=None):
        result = []
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get('class', '').split()) and (id is None or child.attrs.get('id') == id):
                    result.append(child)
                result.extend(child.find(tag, cls, id))
        return result


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}:
            self.stack.append(node)
        elif tag == 'br':
            self.stack[-1].children.append(' ')

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def one(nodes):
    if len(nodes) != 1:
        raise ValueError(f'Expected one source element, found {len(nodes)}')
    return nodes[0]


def import_lab():
    with urlopen(SOURCE, timeout=30) as response:
        page = Document(response.read().decode('utf-8')).root
    section = lambda name: one(page.find(id=name))
    areas = section('research-areas').find(cls='research-item')
    projects = section('research').find(cls='research-item')
    papers = section('publications').find(cls='pub-item')
    openings = section('members').find(cls='members-group')[1:]
    joins = section('join').find(cls='join-item')
    assert (len(areas), len(projects), len(papers), len(openings), len(joins)) == (10, 3, 3, 4, 4), 'Source changed: review new content before importing'
    summaries = [
        'Tissue physiology on microengineered chips for disease studies and drug evaluation.',
        'Microscale devices that control fluids, cells and reagents.',
        'Bioprinted tissues with engineered geometry and biological function.',
        'Biomaterials designed to interact with cells and tissue.',
        'Sensitive biosensors and electronic interfaces for monitoring biological processes.',
        'Multiscale and multiphysics models for device development and biological analysis.',
        'Tumour chips for studying cancer mechanisms, screening treatments and tailoring therapy.',
        'Experimental platforms for testing drugs, delivery methods and immune responses.',
        'Functional tissue replacements and approaches to tissue regeneration.',
        'Machine learning for biomedical device design, image analysis and diagnostics.',
    ]
    project_summaries = [
        'Models the lymph-node paracortex and declining immune function with age to evaluate cancer-vaccine responses in older patients, who are less represented in preclinical studies.',
        'Recreates the cellular and mechanical conditions of brain tissue in a 3D glioblastoma model to investigate treatment resistance and candidate therapies.',
        'Brain and tumour organoids with vascular networks for studies of aging, neuroinflammation and personalised immuno-oncology treatments, in collaboration with Duke University School of Medicine.',
    ]
    research = []
    for i, area in enumerate(areas):
        research.append({'title': one(area.find(tag='h3')).text(), 'summary': summaries[i], 'pillar': one(area.find(cls='tag')).text(), 'projects': []})
    # Flagships are grouped under the broad organ-on-chip research area.
    for i, project in enumerate(projects):
        research[0]['projects'].append({'title': one(project.find(tag='h3')).text(), 'description': project_summaries[i], 'pillar': one(project.find(cls='tag')).text(), 'url': SOURCE + '#research'})
    publications = []
    for paper in papers:
        publications.append({'title': one(paper.find(tag='h4')).text(), 'authors': one(paper.find(cls='authors')).text(), 'venue': one(paper.find(cls='venue')).text(), 'year': int(one(paper.find(cls='yr')).text()), 'paperUrl': one(paper.find(cls='doi')).attrs['href'], 'codeUrl': ''})
    pi = one(page.find(cls='pi-card'))
    pi_links = one(pi.find(cls='pi-links')).find(tag='a')
    links = [{'label': a.text(), 'url': a.attrs['href']} for a in pi_links if a.attrs['href'].startswith('https:')]
    email = next(a.attrs['href'].removeprefix('mailto:') for a in pi_links if a.attrs['href'].startswith('mailto:'))
    image_dir = ROOT / 'assets' / 'images'
    image_dir.mkdir(parents=True, exist_ok=True)
    assets = []
    for name in ['mmbs-logo.png', 'DR-Surjendu.png']:
        url = urljoin(SOURCE, 'images/' + name)
        with urlopen(url, timeout=30) as response:
            image = response.read()
        assert image.startswith(b'\x89PNG\r\n\x1a\n'), f'Invalid PNG: {url}'
        (image_dir / name).write_bytes(image)
        assets.append({'sourceUrl': url, 'localPath': 'assets/images/' + name})
    timeline = [
        {'label': 'PhD', 'text': 'Nanotechnology at IIT Guwahati with Prof. Dipankar Bandyopadhyay; microfluidic transport, sensing and delivery of nanoscale objects.'},
        {'label': 'Postdoc', 'text': 'Terasaki Institute for Biomedical Innovation, Los Angeles, with Prof. Ali Khademhosseini; cancer-vaccine screening and glioblastoma drug resistance using organ chips.'},
        {'label': 'Postdoc', 'text': 'Duke University School of Medicine with Prof. Shyni Varghese; aging-brain models and vascularised tumour organoids on chips.'},
        {'label': 'Current', 'text': 'Assistant Professor of Chemical Engineering at IIT Kharagpur and Principal Investigator of the MMBS Laboratory.'},
    ]
    join_descriptions = [
        'Project and thesis opportunities spanning the ten research areas.',
        'Thesis projects combining device fabrication with biological experiments.',
        'Full-time doctoral research; send a CV and a statement of interest.',
        'Research opportunities in biomedical chip platforms.',
    ]
    opportunities = [{'title': one(item.find(tag='strong')).text(), 'description': join_descriptions[i]} for i, item in enumerate(joins)]
    quote = one(page.find(cls='hero-quote'))
    quote_text = ''.join(c if isinstance(c, str) else '' for c in quote.children).strip().strip('“”')
    data = {
        'lab': {
            'name': 'MMBS Laboratory',
            'fullName': one(section('top').find(tag='h1')).text(),
            'tagline': 'Microfluidics · Materials · Bio-interfaces · Sensing',
            'institution': one(section('top').find(cls='eyebrow')).text(),
            'intro': 'We combine chemical engineering, biology and computation to develop microfluidic chips, engineered tissues, biomaterials and biosensors for healthcare research.',
            'about': [
                'Based in Chemical Engineering at IIT Kharagpur, the lab connects microfluidics, biomaterials, biological interfaces and sensing with computational modelling, AI and advanced manufacturing.',
                'Our platforms include lab and organ chips, 3D-bioprinted tissue and disease models, functional biomaterials, biosensors and multiscale simulations. Applications include disease modelling, drug discovery, immunotherapy, tissue engineering, regeneration and precision medicine. Microfabrication and translational biology help turn engineering models into predictive tools for healthcare.',
                'We welcome research partnerships with universities, hospitals, institutes and industry.',
            ],
            'email': email,
            'address': 'Department of Chemical Engineering\nIndian Institute of Technology Kharagpur\nKharagpur, West Bengal 721302, India',
            'joining': 'B.Tech and M.Tech students, PhD applicants and postdoctoral researchers interested in interdisciplinary biomedical engineering are welcome to enquire. Research spans microfluidics, organ chips, bioprinting, biomaterials, biosensors and computational modelling.',
            'notice': '', 'image': 'assets/images/mmbs-logo.png',
            'imageAlt': 'MMBS emblem representing microfluidics, materials, bio-interfaces and sensing around a chip',
            'quote': quote_text, 'quoteAttribution': one(quote.find(tag='cite')).text(),
            'links': links,
            'pillars': [
                {'title': 'Microfluidics', 'summary': 'Fluid control in lab and organ chips.'},
                {'title': 'Materials', 'summary': 'Functional biomaterials and bioprinted structures.'},
                {'title': 'Bio-interfaces', 'summary': 'Cell and tissue interfaces for modelling disease.'},
                {'title': 'Sensing', 'summary': 'Biosensors and bioelectronics for live measurements.'},
            ],
        },
        'research': research,
        'people': [{'name': one(pi.find(cls='pi-name')).text(), 'role': one(pi.find(cls='pi-role')).text(), 'group': 'Principal Investigator', 'bio': 'Dr. Maity combines chemical engineering, nanotechnology and bioengineering to develop organ and organoid chips, lab-on-a-chip devices and biosensors for human-relevant disease and treatment studies.', 'image': 'assets/images/DR-Surjendu.png', 'url': links[0]['url'], 'email': email, 'links': links, 'timeline': timeline}],
        'memberGroups': [{'title': one(group.find(tag='h3')).text(), 'status': one(group.find(cls='is-open')).text().lstrip('+').strip()} for group in openings],
        'opportunities': opportunities,
        'publications': publications,
        'publicationNote': 'The source lists three selected papers from the group and collaborators. The principal investigator’s Google Scholar profile provides the wider publication record.',
        'news': [],
        'newsEmptyMessage': 'The source website does not list dated lab announcements. Research highlights and current opportunities are available below.',
    }
    # Preserve current contact fields while checking they are still on the source.
    assert '721302' in section('contact').text() and 'Kharagpur' in section('contact').text()
    assert len(pi.find(cls='pi-timeline')[0].find(tag='li')) == len(timeline)
    (ROOT / 'data' / 'content.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    provenance = {
        'sourceUrl': SOURCE, 'retrievedAt': datetime.now(timezone.utc).isoformat(),
        'sections': [{'id': name, 'url': SOURCE + '#' + name} for name in ['top', 'about', 'research-areas', 'research', 'publications', 'members', 'join', 'contact']],
        'counts': {'researchAreas': len(areas), 'flagshipProjects': len(projects), 'publications': len(papers), 'namedPeople': 1, 'openMemberGroups': len(openings), 'opportunities': len(joins), 'datedNews': 0},
        'assets': assets,
        'notes': [
            'Descriptive prose and biography are condensed; source publication metadata, names and links are retained.',
            'The source has no dated news, named students or alumni. Open positions are stored separately from people.',
            'Publications are the source’s selected list, not an independently verified complete bibliography; abbreviated author lists remain abbreviated.',
            'Source template-editing instructions and contact form implementation notes are excluded from lab content.',
            'Flagship projects are stored under the organ-on-a-chip research area; their original pillar labels are retained.',
        ],
    }
    (ROOT / 'data' / 'source.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(provenance['counts']))


if __name__ == '__main__':
    import_lab()
