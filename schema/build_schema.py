"""Build schema/bridge.schema.json and docs/BRIDGE_FIELDS.md from schema/fields.py."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import fields as F

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORMAT = 'pdf2bim.bridge/0.1'
TAGS = ['Direct', 'Calculated', 'Missing-Flagged', 'Standard-verify', 'Input-user', 'Confirmed-Engineer', 'Assumed', 'Model']
STATUS = ['open', 'proposed', 'accepted', 'rejected', 'superseded']

TYPEMAP = {'num': {'type': ['number', 'null']}, 'int': {'type': ['integer', 'null']}, 'str': {'type': ['string', 'null']},
           'bool': {'type': ['boolean', 'null']}, 'ref': {'type': ['string', 'null'], 'pattern': '^(lib|std):'},
           'enum': {'type': ['string', 'null']}}

def tag_rules():
    """Conditional requirements per tag (the 'how sure are we' rules)."""
    return [
        {'if': {'properties': {'tag': {'const': 'Direct'}}}, 'then': {'required': ['source'], 'properties': {'source': {'required': ['doc']}}}},
        {'if': {'properties': {'tag': {'const': 'Calculated'}}}, 'then': {'required': ['derivation']}},
        {'if': {'properties': {'tag': {'const': 'Missing-Flagged'}}}, 'then': {'properties': {'status': {'enum': ['open']}}}},
        {'if': {'properties': {'tag': {'const': 'Standard-verify'}}}, 'then': {'required': ['ref']}},
        {'if': {'properties': {'tag': {'const': 'Assumed'}}}, 'then': {'required': ['source', 'replace_with'], 'properties': {'source': {'required': ['note']}}}},
        {'if': {'properties': {'tag': {'enum': ['Input-user', 'Confirmed-Engineer']}}}, 'then': {'required': ['decision']}},
        {'if': {'properties': {'tag': {'const': 'Model'}}}, 'then': {'required': ['source'], 'properties': {'source': {'required': ['note']}}}},
    ]

META = {
    'tag': {'enum': TAGS, 'description': 'Data source category'},
    'source': {'$ref': '#/$defs/source'},
    'derivation': {'$ref': '#/$defs/derivation'},
    'ref': {'type': 'string', 'pattern': '^(lib|std):', 'description': 'Product library or standards key'},
    'status': {'enum': STATUS},
    'decision': {'type': 'string', 'pattern': '^D-[0-9]+$', 'description': 'Last decision-log entry that set this value'},
    'replace_with': {'type': 'string', 'description': 'What the real value will come from (Assumed values)'},
    'note': {'type': 'string'},
}

def leaf(kind, unit, desc, opts=None):
    if kind == 'table':
        cols = {c: dict(TYPEMAP[k[0]], description=k[1]) for c, k in opts.items()}
        row = {'type': 'object', 'required': ['cells', 'tag', 'status'], 'additionalProperties': False,
               'properties': dict({'cells': {'type': 'object', 'additionalProperties': False, 'properties': cols}}, **META), 'allOf': tag_rules()}
        return {'type': 'object', 'description': desc, 'additionalProperties': False, 'required': ['rows'],
                'properties': {'rows': {'type': 'array', 'items': row}, 'note': {'type': 'string'}}}
    v = dict(TYPEMAP[kind])
    if kind == 'enum' and opts: v = {'enum': opts + [None]}
    return {'type': 'object', 'description': desc + (f' [{unit}]' if unit else ''), 'additionalProperties': False,
            'required': ['value', 'tag', 'status'], 'properties': dict({'value': v, 'unit': {'const': unit} if unit else {'type': 'string'}}, **META),
            'allOf': tag_rules()}

def group(g):
    props = {}
    for k, spec in g.items():
        props[k] = node(spec)
    return {'type': 'object', 'additionalProperties': False, 'properties': props}

def node(spec):
    if isinstance(spec, dict): return group(spec)
    if spec[0] == 'list':
        item = group(spec[1]); item['properties'] = dict({'id': {'type': 'string'}}, **item['properties']); item['required'] = ['id']
        return {'type': 'array', 'description': spec[2], 'items': item}
    return leaf(*spec)

schema = {
    '$schema': 'https://json-schema.org/draft/2020-12/schema',
    '$id': 'https://github.com/Masoud140/pdf2bim-platform/schema/bridge.schema.json',
    'title': 'Bridge description (single-span Super-T / plank) — ' + FORMAT,
    'type': 'object', 'required': ['format'], 'additionalProperties': False,
    'properties': dict({
        'format': {'const': FORMAT},
        'documents': {'type': 'array', 'description': 'Document register: every drawing / report a value can cite',
                      'items': {'type': 'object', 'required': ['id'], 'additionalProperties': False,
                                'properties': {'id': {'type': 'string'}, 'title': {'type': 'string'}, 'number': {'type': 'string'}, 'revision': {'type': 'string'},
                                               'kind': {'enum': ['drawing', 'report', 'specification', 'email', 'other']}, 'file': {'type': 'string'}}}},
        'library': {'type': 'string', 'description': 'Product library file used (lib: keys)'},
        'standards': {'type': 'string', 'description': 'Standards parameter file used (std: keys)'},
        'custom': {'type': 'object', 'description': F.CUSTOM_NOTE, 'additionalProperties': {'oneOf': [{'$ref': '#/$defs/customValue'}, {'$ref': '#/$defs/customTable'}]}},
    }, **{k: node(v) for k, v in F.SECTIONS.items()}),
    '$defs': {
        'customValue': dict(leaf('str', '', 'custom value'), properties=dict(leaf('str', '', '')['properties'], value={}, unit={'type': 'string'}, section={'type': 'string', 'description': 'Which group it belongs to, e.g. deck'})),
        'customTable': dict(leaf('table', '', 'custom table', {}), properties=dict(rows={'type': 'array', 'items': dict(leaf('table', '', '', {})['properties']['rows']['items'], properties=dict(leaf('table', '', '', {})['properties']['rows']['items']['properties'], cells={'type': 'object'}))}, note={'type': 'string'}, section={'type': 'string'}, columns={'type': 'object'})),
        'source': {'type': 'object', 'additionalProperties': False, 'description': 'Where the value comes from',
                   'properties': {'doc': {'type': 'string', 'description': 'documents[].id'}, 'sheet': {'type': 'string'}, 'view': {'type': 'string'},
                                  'text': {'type': 'string', 'description': 'Text / dimension as printed'}, 'note': {'type': 'string'}}},
        'derivation': {'type': 'object', 'required': ['formula', 'inputs'], 'additionalProperties': False,
                       'properties': {'formula': {'type': 'string'}, 'inputs': {'type': 'array', 'items': {'type': 'string', 'description': 'path of an input value'}}}},
    },
}

with open(os.path.join(ROOT, 'schema', 'bridge.schema.json'), 'w') as f: json.dump(schema, f, indent=1, ensure_ascii=False)

# ---- field table for review ----
out = ['# Bridge description — field catalogue (' + FORMAT + ')', '',
       'Generated from `schema/fields.py` by `python schema/build_schema.py` — edit the catalogue, not this file.', '',
       'Every field is a tagged value (value, unit, tag, source / derivation / ref, status). Tables carry a tag per row. Lists have any number of items.', '']
def walk(g, path, depth):
    lists, groups = [], []
    for k, spec in g.items():
        p = f'{path}.{k}' if path else k
        if isinstance(spec, dict): groups.append((p, spec)); continue
        if spec[0] == 'list': lists.append((p, spec)); out.append(f'| `{p}[]` | list | | {spec[2]} (fields below) |'); continue
        kind, unit, desc = spec[0], spec[1], spec[2].replace('|', '/')
        extra = ''
        if kind == 'enum' and len(spec) > 3: extra = ' — one of: ' + ', '.join(spec[3])
        if kind == 'table': extra = ' — columns: ' + ', '.join(f'{c}' + (f' ({v[1]})' if v[1] else '') for c, v in spec[3].items())
        out.append(f'| `{p}` | {kind} | {unit} | {desc}{extra} |')
    for p, spec in lists:
        out.append(''); out.append(f'#### `{p}[]` — each item has an `id` plus:'); out.append('')
        out.append('| Field | Kind | Unit | Description |'); out.append('|---|---|---|---|'); walk(spec[1], p + '[]', depth + 1)
    for p, spec in groups:
        out.append(''); out.append(f'### {p}'); out.append('')
        out.append('| Field | Kind | Unit | Description |'); out.append('|---|---|---|---|'); walk(spec, p, depth + 1)
for sec, g in F.SECTIONS.items():
    if isinstance(g, tuple):
        out.append(''); out.append(f'## {sec}[] — {g[2]}'); out.append(''); out.append('| Field | Kind | Unit | Description |'); out.append('|---|---|---|---|'); walk(g[1], sec + '[]', 1)
    else:
        out.append(''); out.append(f'## {sec}'); out.append(''); out.append('| Field | Kind | Unit | Description |'); out.append('|---|---|---|---|'); walk(g, sec, 1)
with open(os.path.join(ROOT, 'docs', 'BRIDGE_FIELDS.md'), 'w') as f: f.write('\n'.join(out) + '\n')
print('schema and field table written')
