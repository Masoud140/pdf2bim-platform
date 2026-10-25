"""Query Register from a bridge description (P5.2).

    from pdf2bim.register import build
    Q = build(doc, decisions)          # decisions: {id: entry} from the .decisions.jsonl
    Q["items"]                         # one per open item; Q["counts"] by category

Open items: every Missing-Flagged value (category "missing"), every Assumed value ("assumed": a placeholder to
replace), every Standard-verify value ("standard": a standards value to check against an authorised copy) and every
value or row whose status is "proposed" or that carries a proposed override ("proposed": waiting for the engineer's
decision; the override's decision and value are listed). A value can carry two
categories (an Assumed value proposed by a decision): it is listed once with both.
Each item: path, categories, tag, value, unit, source note, what replaces it (replace_with), the decision id and its
reason, the layers it affects (the decision's `affects`, else from the description section) and the outputs that
depend on those layers (pdf2bim.runrecord.LAYERS) — so the register shows which results each open item touches.
"""
import json
from .runrecord import LAYERS

SECTION_LAYERS = {"project": ["extraction"], "alignment": ["extraction", "geometry"], "deck": ["geometry", "model"], "superstructure": ["model", "design.supert"],
                  "bearings": ["substructure", "model"], "supports": ["substructure", "model"], "materials": ["model", "design.supert"], "loads": ["loads"],
                  "combinations": ["combinations"], "analysis": ["analysis.static", "analysis.modal"], "design": ["design.supert"], "custom": ["extraction"]}
NEEDED_FROM = {"missing": "drawings / project documents (not in the set)", "assumed": "engineer or project data (replace the placeholder)",
               "standard": "standards reviewer with an authorised copy", "proposed": "engineer decision (accept / change / reject)"}


def values_of(doc):
    """(path, record) of every tagged value / table row, with the description's own path rules (schema.rules_0_2)."""
    from schema.rules_0_2 import records
    return list(records(doc))


def build(doc, decisions=None):
    decisions = decisions or {}
    items, values = [], values_of(doc)
    for path, v in values:
        cats = []
        tag = v.get("tag")
        if tag == "Missing-Flagged":
            cats.append("missing")
        elif tag == "Assumed":
            cats.append("assumed")
        elif tag == "Standard-verify":
            cats.append("standard")
        pov = [o for o in v.get("overrides") or [] if (o.get("approval") or {}).get("status") == "proposed"]
        if v.get("status") == "proposed" or pov:
            cats.append("proposed")
        if not cats:
            continue
        did = pov[-1].get("decision") if pov else v.get("decision")
        d = decisions.get(did) if did else None
        sec = path.split(".")[0].split("[")[0]
        aff = (d or {}).get("affects") or SECTION_LAYERS.get(sec, ["extraction"])
        outs = sorted(t for t, L in LAYERS.items() if set(L) & set(aff))
        src = v.get("source") or {}
        items.append({"path": path, "categories": cats, "tag": tag, "status": v.get("status"),
                      "value": v.get("value", v.get("cells")), "unit": v.get("unit"), "proposed_value": pov[-1]["value"] if pov else None,
                      "note": v.get("note") or (src.get("note") if isinstance(src, dict) else None),
                      "replace_with": v.get("replace_with"), "decision": did, "decision_status": (d or {}).get("status"), "decision_reason": (d or {}).get("reason"),
                      "affects": list(aff), "outputs": outs, "needed_from": NEEDED_FROM[cats[0]] if cats[0] != "assumed" or not v.get("replace_with") else v["replace_with"]})
    counts = {c: sum(c in q["categories"] for q in items) for c in NEEDED_FROM}
    tags = {}
    for _, v in values:
        tags[v.get("tag")] = tags.get(v.get("tag"), 0) + 1
    return {"items": items, "counts": counts, "tag_counts": tags, "values": len(values),
            "proposed_decisions": sorted([k for k, d in decisions.items() if d.get("status") == "proposed"], key=lambda s: int(s.split("-")[1]))}


def to_markdown(Q, title):
    L = [f"# Query Register — {title}", "", f"{Q['values']} tagged values; open items: " + ", ".join(f"{k} {n}" for k, n in Q["counts"].items())
         + f". Decisions waiting: {', '.join(Q['proposed_decisions']) or 'none'}.", "", "Generated from the bridge description (`tools/query_register.py`); do not edit by hand.", ""]
    for cat, head in (("missing", "Missing — flagged"), ("proposed", "Proposed (waiting for the engineer)"), ("assumed", "Assumed placeholders to replace"), ("standard", "Standards values to verify")):
        L += [f"## {head} ({sum(cat in q['categories'] for q in Q['items'])})", "", "| Path | Value | Note / replace with | Decision | Affects | Outputs |", "|---|---|---|---|---|---|"]
        for q in [q for q in Q["items"] if cat in q["categories"]]:
            val = json.dumps(q["value"], ensure_ascii=False)
            val = val if len(val) <= 60 else val[:57] + "..."
            note = (q["replace_with"] or q["note"] or "").replace("|", "/")
            L.append(f"| `{q['path']}` | {val.replace('|', '/')}{(' ' + q['unit']) if q['unit'] else ''} | {note[:140]} | {q['decision'] or '—'} | {', '.join(q['affects'])} | {', '.join(q['outputs'])} |")
        L.append("")
    return "\n".join(L) + "\n"


def to_html(Q, title):
    data = json.dumps(Q["items"], ensure_ascii=False).replace("</", "<\\/")
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Query Register</title><style>
:root{{--bg:#fff;--fg:#1d1d1f;--mut:#666;--line:#ddd;--miss:#fde8e8;--missfg:#8b1a1a;--asm:#fff4dc;--std:#e8f0fd;--prop:#efe8fd}}
@media (prefers-color-scheme:dark){{:root{{--bg:#16171a;--fg:#e8e8ea;--mut:#9a9aa0;--line:#333;--miss:#3a1f1f;--missfg:#f3b0b0;--asm:#3a3220;--std:#1f2a3a;--prop:#2a2240}}}}
body{{background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif;margin:0;padding:16px}} h1{{font-size:20px}} .mut{{color:var(--mut)}}
input,select{{font:inherit;padding:6px;margin:4px 8px 12px 0;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:6px}}
.wrap{{overflow-x:auto}} table{{border-collapse:collapse;width:100%;min-width:720px}} td,th{{border-bottom:1px solid var(--line);padding:6px;text-align:left;vertical-align:top}}
tr.missing td:first-child{{background:var(--miss);color:var(--missfg)}} tr.assumed td:first-child{{background:var(--asm)}} tr.standard td:first-child{{background:var(--std)}} tr.proposed td:first-child{{background:var(--prop)}} code{{font-size:12px}}
</style></head><body><h1>Query Register — {title}</h1>
<p class="mut">{Q['values']} tagged values. Open: {', '.join(f'{k} {n}' for k, n in Q['counts'].items())}. Generated from the bridge description; do not edit.</p>
<label>Category <select id="c"><option value="">all</option><option>missing</option><option>proposed</option><option>assumed</option><option>standard</option></select></label>
<label>Search <input id="q" placeholder="path, note, decision"></label>
<div class="wrap"><table><thead><tr><th>Category</th><th>Path</th><th>Value</th><th>Note / replace with</th><th>Decision</th><th>Affects → outputs</th></tr></thead><tbody id="b"></tbody></table></div>
<script>const D={data};const b=document.getElementById('b'),c=document.getElementById('c'),q=document.getElementById('q');
function esc(s){{return String(s==null?'':s).replace(/[&<>]/g,m=>({{'&':'&amp;','<':'&lt;','>':'&gt;'}}[m]))}}
function draw(){{const cc=c.value,qq=q.value.toLowerCase();b.innerHTML=D.filter(x=>(!cc||x.categories.includes(cc))&&(!qq||JSON.stringify(x).toLowerCase().includes(qq))).map(x=>'<tr class="'+x.categories[0]+'"><td>'+x.categories.join(', ')+'</td><td><code>'+esc(x.path)+'</code></td><td>'+esc(JSON.stringify(x.value)).slice(0,80)+(x.unit?' '+esc(x.unit):'')+'</td><td>'+esc(x.replace_with||x.note||'')+'</td><td>'+esc(x.decision||'—')+'</td><td>'+esc(x.affects.join(', '))+' → '+esc(x.outputs.join(', '))+'</td></tr>').join('')}}
c.onchange=draw;q.oninput=draw;draw();</script></body></html>
"""
