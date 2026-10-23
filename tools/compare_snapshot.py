#!/usr/bin/env python3
"""Compare two baseline snapshots (pdf2bim.baseline/0.1).

    python3 tools/compare_snapshot.py REFERENCE.json NEW.json [--mode exact|engineering] [--report out.md]

Modes
- exact (default): regression of the same software. Every quantity must agree to
  relative 1e-9 (absolute 1e-12 near zero). Any difference means behaviour changed and
  must be explained before the reference is replaced.
- engineering: used when a NEW implementation (e.g. the Python core) is compared with the
  dashboard. Group tolerances come from docs/VERIFICATION_STRATEGY.md section 4 and are
  PROVISIONAL. A pass in this mode never overrides a failed physical check.

The comparison also fails if a quantity is added or removed, or if any consistency
check changes its pass/fail state. Exit code 0 = no regression, 1 = regression, 2 = usage error.
Agreement with the reference shows the software is unchanged; it does not show the results are correct.
"""
import json, sys, math, argparse

# (prefix, abs tolerance, rel tolerance, note) -- first match wins; provisional, see VERIFICATION_STRATEGY §4
ENG_TOL = [
    ("geom.", 0.001, 0.0, "coordinates / lengths 1 mm (generation accuracy)"),
    ("model.section.", 0.0, 0.005, "section properties 0.5 %"),
    ("design.section.", 0.0, 0.005, "section properties 0.5 %"),
    ("modal.mode", 0.0, 0.03, "modal periods 3 % (paired modes only)"),
    ("", 0.0, 0.02, "other actions 2 % (provisional)"),
]


def tol_for(qid, mode):
    if mode == "exact":
        return 1e-12, 1e-9, "exact regression"
    for pre, a, r, note in ENG_TOL:
        if qid.startswith(pre):
            return a, r, note
    return 0.0, 0.02, "default"


def compare(ref, new, mode="exact"):
    """Return a list of difference records; empty list = no regression."""
    diffs = []
    rq = {q["id"]: q for q in ref["quantities"]}
    nq = {q["id"]: q for q in new["quantities"]}
    for k in sorted(set(rq) - set(nq)):
        diffs.append({"id": k, "kind": "removed", "ref": rq[k]["value"], "new": None})
    for k in sorted(set(nq) - set(rq)):
        diffs.append({"id": k, "kind": "added", "ref": None, "new": nq[k]["value"]})
    for k in sorted(set(rq) & set(nq)):
        a, b = rq[k]["value"], nq[k]["value"]
        if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
            ta, tr, note = tol_for(k, mode)
            if not (math.isfinite(a) and math.isfinite(b)):
                ok = a == b
            else:
                ok = abs(a - b) <= max(ta, tr * max(abs(a), abs(b)))
            if not ok:
                rel = abs(a - b) / max(abs(a), 1e-30)
                diffs.append({"id": k, "kind": "value", "ref": a, "new": b, "rel": rel, "tolerance": note})
        elif a != b:
            diffs.append({"id": k, "kind": "value", "ref": a, "new": b})
        if rq[k].get("unit") != nq[k].get("unit"):
            diffs.append({"id": k, "kind": "unit", "ref": rq[k].get("unit"), "new": nq[k].get("unit")})
    rc = {c["id"]: c["pass"] for c in ref.get("checks", [])}
    nc = {c["id"]: c["pass"] for c in new.get("checks", [])}
    for k in sorted(set(rc) | set(nc)):
        if rc.get(k) != nc.get(k):
            diffs.append({"id": k, "kind": "check", "ref": rc.get(k), "new": nc.get(k)})
    return diffs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reference"); ap.add_argument("new")
    ap.add_argument("--mode", choices=["exact", "engineering"], default="exact")
    ap.add_argument("--report")
    a = ap.parse_args()
    try:
        ref, new = json.load(open(a.reference)), json.load(open(a.new))
    except Exception as e:
        print("usage error:", e); sys.exit(2)
    d = compare(ref, new, a.mode)
    lines = [f"# Snapshot comparison ({a.mode})", "",
             f"- reference: {a.reference} (commit {ref['run']['git']['commit']}, dashboard {ref['run']['dashboard']['sha256'][:16]})",
             f"- new: {a.new} (commit {new['run']['git']['commit']}, dashboard {new['run']['dashboard']['sha256'][:16]})",
             f"- quantities: {len(ref['quantities'])} / {len(new['quantities'])}; differences: {len(d)}", ""]
    for x in d[:200]:
        lines.append(f"- {x['kind']:7s} {x['id']}: {x.get('ref')} -> {x.get('new')}" + (f" (rel {x['rel']:.3g}; {x['tolerance']})" if 'rel' in x else ""))
    if len(d) > 200:
        lines.append(f"- ... {len(d) - 200} more")
    lines.append("")
    lines.append("RESULT: " + ("NO REGRESSION" if not d else "REGRESSION / CHANGE DETECTED"))
    out = "\n".join(lines)
    print(out)
    if a.report:
        open(a.report, "w").write(out + "\n")
    sys.exit(0 if not d else 1)


if __name__ == "__main__":
    main()
