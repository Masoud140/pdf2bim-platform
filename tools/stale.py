#!/usr/bin/env python3
"""List every recorded output of the projects and whether it is current or stale (P5.1).

    python3 tools/stale.py [projects/BR13A] [--out projects/BR13A/STALE.md]

An output is a .json under the project's model/, geometry/ or sections/ folders; its run record is the top-level
"run_record" (pdf2bim.runrecord). Outputs without one are listed as "unknown" (made before P5.1: re-run the tool).
"""
import argparse, glob, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def scan(project):
    from pdf2bim.runrecord import status
    rows = []
    for p in sorted(glob.glob(os.path.join(project, "*", "*.json")) + glob.glob(os.path.join(project, "*", "*", "*.json"))):
        if "/history/" in p or "/proposals/" in p or "/source/" in p:
            continue
        try:
            d = json.load(open(p))
        except Exception:
            continue
        rec = d.get("run_record") if isinstance(d, dict) else None
        st = status(rec)
        rows.append({"file": os.path.relpath(p, ROOT), "tool": (rec or {}).get("tool"), "revision": (rec or {}).get("revision"), **st})
    return rows


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("projects", nargs="*"); ap.add_argument("--out")
    a = ap.parse_args()
    projects = a.projects or sorted(p for p in glob.glob(os.path.join(ROOT, "projects", "*")) if os.path.isdir(p))
    L = ["# Output status (current / stale)", "", "| Output | Tool | Recorded revision | State | Engine changed | Reasons |", "|---|---|---|---|---|---|"]
    allrows = []
    for pr in projects:
        for r in scan(pr):
            allrows.append(r)
            L.append(f"| `{r['file']}` | {r['tool'] or '—'} | {r['revision'] if r['revision'] is not None else '—'} | **{r['state']}** | {'yes' if r['engine_changed'] else ('—' if r['engine_changed'] is None else 'no')} | {'; '.join(r['reasons']) or '—'} |")
    n = {s: sum(r["state"] == s for r in allrows) for s in ("current", "stale", "unknown")}
    L += ["", f"{n['current']} current, {n['stale']} stale, {n['unknown']} without a run record."]
    txt = "\n".join(L) + "\n"
    if a.out:
        open(a.out, "w").write(txt)
    print(txt)


if __name__ == "__main__":
    main()
