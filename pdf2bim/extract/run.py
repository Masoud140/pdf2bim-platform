#!/usr/bin/env python3
"""Read a drawing set with Claude and build the bridge description from what verify.py accepts (P9).

    ANTHROPIC_API_KEY=... python3 -m pdf2bim.extract.run --pdf set.pdf [--pdf report.pdf] --out DIR [--pages 1-20] [--model M]
    -> DIR/values.json (new_description input), DIR/pages/<file>_p<n>.json (Claude's answer + checks, for audit),
       DIR/EXTRACTION.md (summary: accepted / rejected / conflicts / cost)

Conflicting values for one field (different pages, different numbers) are NOT resolved here: the field stays
Missing-Flagged with the candidates in its note, for the engineer."""
import argparse, json, os, re, sys, time

from . import pages as PG
from .reader import DEFAULT_MODEL, read_page
from .verify import check_page, norm

ROW = re.compile(r"^(.*)\.rows\[\d*\]$")


def doc_id(number, page_text, fname, page_no):
    """A short document id from the printed drawing number (its trailing digits), checked to be on the page."""
    if number and norm(number) in norm(page_text):
        m = re.search(r"(\d{3,})\D*$", str(number))
        if m:
            return f"DRG-{m.group(1)[-6:]}", str(number)
    stem = re.sub(r"[^A-Za-z0-9]+", "-", os.path.splitext(fname)[0])[:24]
    return f"PG-{stem}-{page_no}", f"{fname} page {page_no}"


def merge(accepted):
    """accepted: [(page_label, value)] -> new_description values; scalar conflicts -> Missing-Flagged with candidates."""
    scal, tables, out, conflicts = {}, {}, [], []
    for lab, v in accepted:
        m = ROW.match(v["path"])
        if m:
            rows = tables.setdefault(m.group(1), [])
            if all(r["cells"] != v["cells"] for r in rows):
                rows.append(v)
            continue
        scal.setdefault(v["path"], []).append((lab, v))
    for p, cands in scal.items():
        vals = []
        for lab, v in cands:
            if not any(v["value"] == w for w in vals):
                vals.append(v["value"])
        if len(vals) == 1:
            r = dict(cands[0][1])
            if len(cands) > 1:
                r["note"] = "also on " + ", ".join(sorted({lab for lab, _ in cands[1:]}))[:300]
            out.append(r)
        else:
            conflicts.append(p)
            out.append({"path": p, "tag": "Missing-Flagged", "value": None, **({"unit": cands[0][1]["unit"]} if "unit" in cands[0][1] else {}),
                        "note": "drawings disagree, engineer to choose: " + "; ".join(f"{v['value']} ({lab}: {v['source'].get('text', '')[:60]})" for lab, v in cands)[:600]})
    for base, rows in tables.items():
        for i, r in enumerate(rows):
            out.append(dict(r, path=f"{base}.rows[{i}]"))
    return out, conflicts


def run(pdfs, out, key, model=DEFAULT_MODEL, page_range=None, call=None, progress=print):
    os.makedirs(os.path.join(out, "pages"), exist_ok=True)
    docs, accepted, rejected, usage, n_pages, failed = {}, [], [], {"input_tokens": 0, "output_tokens": 0, "cache_read_input_tokens": 0}, 0, []
    kw = {"call": call} if call else {}
    for pdf in pdfs:
        fname = os.path.basename(pdf)
        n = PG.page_count(pdf)
        sel = [i for i in range(n) if page_range is None or page_range[0] <= i + 1 <= page_range[1]]
        for i in sel:
            n_pages += 1
            text = PG.page_text(pdf, i)
            progress(f"{fname} page {i + 1}/{n}: reading")
            t0 = time.time()
            try:
                ans, raw, u = read_page(PG.page_png(pdf, i), text, key, model, **kw)
            except Exception as e:                              # one bad page must not lose the rest
                failed.append(f"{fname} p{i + 1}: {e}"[:300]); progress(f"  failed: {e}"); continue
            for k in usage:
                usage[k] += int(u.get(k) or 0)
            if ans is None:
                failed.append(f"{fname} p{i + 1}: answer was not JSON"); continue
            d = ans.get("document") or {}
            did, number = doc_id(d.get("number"), text, fname, i + 1)
            docs.setdefault(did, {"id": did, "number": number, "revision": str(d.get("revision") or "-")[:20], "kind": "drawing",
                                  **({"title": str(d["title"])[:200]} if d.get("title") else {})})
            acc, rej = check_page(ans.get("values") or [], text, did, i + 1)
            lab = f"{did} p{i + 1}"
            accepted += [(lab, v) for v in acc]
            rejected += [(lab, v, why) for v, why in rej]
            json.dump({"file": fname, "page": i + 1, "document": did, "seconds": round(time.time() - t0, 1), "usage": u,
                       "answer": ans, "accepted": acc, "rejected": [{"value": v, "reason": why} for v, why in rej]},
                      open(os.path.join(out, "pages", f"{re.sub(r'[^A-Za-z0-9]+', '_', fname)}_p{i + 1:03d}.json"), "w"), indent=1)
            progress(f"  {did}: {len(acc)} accepted, {len(rej)} rejected")
    values, conflicts = merge(accepted)
    json.dump({"origin": f"Claude drawing reader ({model}), {n_pages} pages of {', '.join(os.path.basename(p) for p in pdfs)}",
               "documents": list(docs.values()), "values": values}, open(os.path.join(out, "values.json"), "w"), indent=1)
    L = ["# Drawing reader report", "", f"Model `{model}` · {n_pages} pages · {len(docs)} documents · "
         f"tokens in {usage['input_tokens']:,} (cached {usage['cache_read_input_tokens']:,}) / out {usage['output_tokens']:,}", "",
         f"- accepted values: **{len(values) - len(conflicts)}** (Direct / Calculated re-checked against the page text; Model = read, not a printed literal)",
         f"- conflicts left Missing-Flagged for the engineer: **{len(conflicts)}** {', '.join(conflicts[:20])}",
         f"- rejected proposals: **{len(rejected)}** (listed below; nothing rejected is used)",
         f"- pages that failed: **{len(failed)}**", ""] + [f"  - {f}" for f in failed] + ["", "## Rejected", "", "| Page | Path | Value | Reason |", "|---|---|---|---|"]
    for lab, v, why in rejected[:500]:
        val = v.get("value", v.get("cells")) if isinstance(v, dict) else v
        L.append(f"| {lab} | `{(v.get('path') if isinstance(v, dict) else '')}` | {str(val)[:60]} | {why} |")
    open(os.path.join(out, "EXTRACTION.md"), "w").write("\n".join(L) + "\n")
    return {"values": len(values), "conflicts": len(conflicts), "rejected": len(rejected), "failed": len(failed), "documents": len(docs), "usage": usage}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pdf", action="append", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pages", help="page range of each PDF, e.g. 1-20")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    a = ap.parse_args()
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        sys.exit("set ANTHROPIC_API_KEY (the owner's key; never commit it)")
    pr = tuple(int(x) for x in a.pages.split("-")) if a.pages else None
    print(json.dumps(run(a.pdf, a.out, key, a.model, pr), indent=1))


if __name__ == "__main__":
    main()
