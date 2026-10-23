"""Schema checks: the examples pass; values that break the tag rules fail.  Run: python3 tests/schema/test_schema.py"""
import json, os, copy, sys
from jsonschema import Draft202012Validator
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = Draft202012Validator(json.load(open(os.path.join(R, 'schema/bridge.schema.json'))))
D = Draft202012Validator(json.load(open(os.path.join(R, 'schema/decision.schema.json'))))
ok = True
def check(name, valid, errs):
    global ok
    good = (len(errs) == 0) == valid
    ok &= good
    print(('PASS ' if good else 'FAIL ') + name + ('' if good else ' — ' + '; '.join(e.message[:120] for e in errs[:3])))
ex = json.load(open(os.path.join(R, 'examples/new_bridge.bridge.json')))
check('example bridge is valid', True, list(B.iter_errors(ex)))
for line in open(os.path.join(R, 'examples/new_bridge.decisions.jsonl')):
    check('example decision is valid', True, list(D.iter_errors(json.loads(line))))
bad = [
 ('Direct without a source', lambda x: x['deck']['edge_left'].pop('source')),
 ('Calculated without a derivation', lambda x: x['deck']['edge_left'].update(tag='Calculated')),
 ('Assumed without replace_with', lambda x: x['loads']['shrinkage_creep_shortening'].pop('replace_with')),
 ('Missing-Flagged marked accepted', lambda x: x['project']['importance_level'].update(status='accepted')),
 ('Input-user without a decision id', lambda x: x['deck']['slab_thickness'].update(tag='Input-user')),
 ('bare number instead of a tagged value', lambda x: x['deck'].update(end_gap=50)),
 ('unknown field', lambda x: x['deck'].update(colour={'value': 'red', 'tag': 'Direct', 'status': 'open', 'source': {'doc': 'GA-01'}})),
 ('wrong unit', lambda x: x['deck']['slab_thickness'].update(unit='m')),
 ('enum outside the list', lambda x: x['superstructure']['type'].update(value='box girder')),
 ('table row without a tag', lambda x: x['supports'][0]['soil_layers']['rows'][0].pop('tag')),
]
for name, f in bad:
    x = copy.deepcopy(ex); f(x); check('rejects: ' + name, False, list(B.iter_errors(x)))
d = json.loads(open(os.path.join(R, 'examples/new_bridge.decisions.jsonl')).readline())
x = dict(d, from_tag='Direct'); check('rejects: overruling a Direct value without evidence', False, list(D.iter_errors(x)))
x = dict(d); x.pop('approved_by'); check('rejects: accepted decision without approver', False, list(D.iter_errors(x)))
sys.exit(0 if ok else 1)
