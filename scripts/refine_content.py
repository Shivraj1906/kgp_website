"""Apply reviewed editorial copy without discarding fresh imported records."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def apply_editorial(data):
    editorial = json.loads((ROOT / 'data' / 'editorial.json').read_text(encoding='utf-8'))
    data['lab'].update(editorial['lab'])
    for items, key, section in [
        (data['research'], 'title', 'researchByTitle'),
        ([project for area in data['research'] for project in area['projects']], 'title', 'projectsByTitle'),
        (data['people'], 'name', 'peopleByName'),
        (data['publications'], 'paperUrl', 'publicationsByDoi'),
        (data['opportunities'], 'title', 'opportunitiesByTitle'),
    ]:
        for item in items:
            changes = dict(editorial[section].get(item[key], {}))
            # Display titles may be edited; retain the source key for repeat runs.
            if not changes and item.get('sourceTitle'):
                changes = dict(editorial[section].get(item['sourceTitle'], {}))
            links = changes.pop('additionalLinks', [])
            if 'title' in changes:
                item.setdefault('sourceTitle', item['title'])
            item.update(changes)
            for link in links:
                if link not in item.setdefault('links', []):
                    item['links'].append(link)
    for key in ['publicationNote', 'newsEmptyMessage']:
        data[key] = editorial[key]
    # Keep submitted member profiles across upstream refreshes and repeat runs.
    members = json.loads((ROOT / 'data' / 'members.json').read_text(encoding='utf-8'))
    member_names = {person['name'].casefold() for person in members}
    data['people'] = [person for person in data['people']
                      if person.get('source') != 'member-form'
                      and person['name'].casefold() not in member_names] + members
    return data


if __name__ == '__main__':
    target = ROOT / 'data' / 'content.json'
    data = apply_editorial(json.loads(target.read_text(encoding='utf-8')))
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Applied reviewed editorial copy to data/content.json')
