#!/usr/bin/env python3
"""Decision review page (P5.4): every PROPOSED decision of a bridge description with what it changes, why, the
evidence, the layers and recorded outputs it affects, and the command that records the engineer's decision.

    python3 tools/decision_review.py projects/BR13A/BR13A.bridge.0.2.json     # writes projects/BR13A/DECISION_REVIEW.{md,html}
"""
import html, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def review(f):
    from pdf2bim.register import build
    from pdf2bim.runrecord import decision_log
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    from stale import scan
    doc = json.load(open(f)); dec = decision_log(f)
    Q = build(doc, dec)
    outs = scan(os.path.dirname(os.path.abspath(f)))
    items = []
    for did in Q["proposed_decisions"]:
        d = dec[did]
        vals = [q for q in Q["items"] if q["decision"] == did and "proposed" in q["categories"]]
        aff = set(d.get("affects") or [])
        hit = sorted({o["file"] for o in outs if o["tool"] and set(_layers(o["tool"])) & aff}) if aff else []
        items.append({"id": did, "key": d.get("key"), "by": d.get("by"), "date": d.get("date"), "reason": d.get("reason"), "evidence": d.get("evidence") or [],
                      "affects": sorted(aff), "values": [{"path": q["path"], "value": q["value"], "tag": q["tag"]} for q in vals], "outputs": hit,
                      "accept": f"python3 schema/accept_decision.py {os.path.relpath(f, ROOT)} --decision {did} --by \"<your name>\"",
                      "reject": f"python3 schema/accept_decision.py {os.path.relpath(f, ROOT)} --decision {did} --by \"<your name>\" --reject --note \"<why>\""})
    return doc, items


def _layers(tool):
    from pdf2bim.runrecord import LAYERS, ALL
    return LAYERS.get(tool, ALL)


def main():
    f = sys.argv[1]
    doc, items = review(f)
    base = os.path.join(os.path.dirname(os.path.abspath(f)), "DECISION_REVIEW")
    L = [f"# Decisions waiting for the engineer — {os.path.basename(f)} revision {doc['revision']['number']}", "", f"{len(items)} proposed decision(s). Generated; do not edit.", ""]
    for it in items:
        L += [f"## {it['id']} — `{it['key']}`", "", it["reason"] or "", "", f"- proposed by {it['by']} on {it['date']}; affects {', '.join(it['affects']) or '—'}",
              f"- evidence: {'; '.join(it['evidence']) or '—'}", f"- values ({len(it['values'])}): " + ", ".join(f"`{v['path']}`" for v in it["values"][:8]) + (" …" if len(it["values"]) > 8 else ""),
              f"- recorded outputs that become stale: {', '.join(it['outputs']) or 'none recorded'}", f"- accept: `{it['accept']}`", f"- reject: `{it['reject']}`", ""]
    open(base + ".md", "w").write("\n".join(L) + "\n")
    e = html.escape
    cards = "".join(f"<section><h2>{e(it['id'])} <code>{e(str(it['key']))}</code></h2><p>{e(it['reason'] or '')}</p><ul><li>Affects: {e(', '.join(it['affects']) or '—')}</li>"
                    f"<li>Evidence: {e('; '.join(it['evidence']) or '—')}</li><li>Values: {len(it['values'])}</li><li>Outputs made stale: {e(', '.join(it['outputs']) or 'none recorded')}</li></ul>"
                    f"<p>Accept:</p><pre>{e(it['accept'])}</pre><p>Reject:</p><pre>{e(it['reject'])}</pre></section>" for it in items)
    open(base + ".html", "w").write(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Decision Review</title>
<style>:root{{--bg:#fff;--fg:#1d1d1f;--card:#f6f6f8;--line:#ddd}}@media (prefers-color-scheme:dark){{:root{{--bg:#16171a;--fg:#e8e8ea;--card:#202126;--line:#333}}}}
body{{background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif;margin:0;padding:16px;max-width:960px}}section{{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 16px;margin:12px 0}}
pre{{white-space:pre-wrap;word-break:break-all;background:var(--bg);padding:8px;border-radius:6px;border:1px solid var(--line)}}h2{{font-size:16px}}</style></head><body>
<h1>Decisions waiting — {e(os.path.basename(f))} revision {doc['revision']['number']}</h1><p>{len(items)} proposed decision(s). Generated from the description; do not edit.</p>{cards}</body></html>
""")
    print(f"{base}.md / .html: {len(items)} proposed decision(s)")


if __name__ == "__main__":
    main()
