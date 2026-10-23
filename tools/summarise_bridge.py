"""Summarise a bridge description: tag counts, open items (Missing / Assumed), proposed decisions.
Usage: python3 tools/summarise_bridge.py projects/<bridge>/<bridge>.bridge.json [--md out.md]
Generic: works on any file in the pdf2bim.bridge format."""
import json, sys, os, collections

def walk(x, path, out):
    if isinstance(x, dict):
        if 'tag' in x and ('value' in x or 'cells' in x):
            out.append((path, x)); return
        for k, v in x.items():
            if k in ('documents',): continue
            walk(v, f'{path}.{k}' if path else k, out)
    elif isinstance(x, list):
        for i, v in enumerate(x):
            walk(v, f"{path}[{v.get('id', i) if isinstance(v, dict) else i}]", out)

def main():
    f = sys.argv[1]; b = json.load(open(f)); items = []; walk(b, '', items)
    dec_f = f.replace('.bridge.json', '.decisions.jsonl'); decs = [json.loads(l) for l in open(dec_f)] if os.path.exists(dec_f) else []
    cat = [(p, v) for p, v in items if not p.startswith('custom')]; cus = [(p, v) for p, v in items if p.startswith('custom')]
    L = ['# ' + os.path.basename(f) + ' — summary', '']
    for name, grp in (('Catalogue fields', cat), ('Custom (project-specific rows)', cus)):
        c = collections.Counter(v['tag'] for _, v in grp)
        L.append(f'**{name}: {len(grp)} values** — ' + ', '.join(f'{k} {n}' for k, n in c.most_common()))
    L.append('')
    def label(p, v):
        val = v.get('value', v.get('cells'))
        return f'| `{p}` | {json.dumps(val, ensure_ascii=False)[:80]} | {v.get("replace_with", "") or (v.get("note", "") or "")[:120]} |'
    import re
    def fold(lst):   # table rows of one table -> one line
        out, seen = [], {}
        for p, v in lst:
            m = re.match(r'(.*)\.rows\[\d+\]$', p)
            if not m: out.append((p, v)); continue
            k = m.group(1)
            if k in seen: seen[k][1]['_n'] += 1; continue
            w = dict(v, _n=1); seen[k] = (k + '.rows[*]', w); out.append(seen[k])
        return [(p, dict(v, value=f"{v['_n']} rows") if v.get('_n', 1) > 1 else v) for p, v in out]
    miss = fold([(p, v) for p, v in cat if v['tag'] == 'Missing-Flagged']); asm = fold([(p, v) for p, v in cat if v['tag'] == 'Assumed'])
    L += ['## Missing — flagged (catalogue)', '', '| Path | Value | Note |', '|---|---|---|'] + [label(p, v) for p, v in miss] + ['']
    L += ['## Assumed (catalogue) — to be replaced', '', '| Path | Value used | Replace with |', '|---|---|---|'] + [label(p, v) for p, v in asm] + ['']
    prop = [d for d in decs if d['status'] == 'proposed']
    L += ['## Decisions waiting for the engineer', ''] + ([f'- **{d["id"]}** `{d["key"]}`: {json.dumps(d.get("from"))} → {json.dumps(d["to"])} — {d["reason"]}' for d in prop] or ['- none']) + ['']
    L.append(f'Decision log: {len(decs)} entries ({collections.Counter(d["status"] for d in decs)})')
    txt = '\n'.join(L) + '\n'
    if '--md' in sys.argv: open(sys.argv[sys.argv.index('--md') + 1], 'w').write(txt)
    print(txt)

if __name__ == '__main__': main()
