#!/usr/bin/env python3
"""Import extracted values (interchange sheet "Values", pdf2bim/takeoff.py) into a bridge description as PROPOSALS (P5.3).

    python3 tools/import_takeoff.py projects/X/X.bridge.0.2.json takeoff.xlsx --report projects/X/takeoff_import.md
    python3 tools/import_takeoff.py ... --apply --decision D-50 --affects extraction --affects geometry

Without --apply nothing is written except the report. With --apply each override is proposed through
schema/propose_override.py (one revision each, all under one decision id, status proposed): the engineer accepts or
rejects them later. Queries (conflicts with Direct values) and new paths are never applied: they are listed for the engineer.
"""
import argparse, datetime, json, os, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("workbook"); ap.add_argument("--sheet", default="Values"); ap.add_argument("--report")
    ap.add_argument("--apply", action="store_true"); ap.add_argument("--decision"); ap.add_argument("--affects", action="append", default=[]); ap.add_argument("--author", default="AI")
    a = ap.parse_args()
    from pdf2bim.takeoff import read_values, plan_import
    doc = json.load(open(a.description))
    P = plan_import(doc, read_values(a.workbook, a.sheet))
    L = [f"# Takeoff import plan — `{os.path.basename(a.workbook)}` into revision {doc['revision']['number']}", "",
         ", ".join(f"{k} {v}" for k, v in P["counts"].items()) + ".", "",
         "## Override proposals", ""] + [f"- `{o['path']}`: {json.dumps(o['value'], ensure_ascii=False)} ({o['from_tag']} → {o['tag']}, {o['kind']}; {o['source']['doc']})" for o in P["overrides"]] + [
         "", "## Queries for the engineer (never applied)", ""] + [f"- row {q['row']} `{q['path']}`: {q['why']} — description {json.dumps(q.get('current'), ensure_ascii=False)}, extraction {json.dumps(q['value'], ensure_ascii=False)}" for q in P["queries"]] + [
         "", "## Refused rows", ""] + [f"- row {q['row']} `{q['path']}`: {q['why']}" for q in P["refused"]] + [
         "", "## Paths not in the description", ""] + [f"- row {q['row']} `{q['path']}` = {json.dumps(q['value'], ensure_ascii=False)}" for q in P["new_paths"]]
    if a.apply:
        if not a.decision:
            raise SystemExit("--apply needs --decision D-<n>")
        created = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
        for o in P["overrides"]:
            cmd = [sys.executable, os.path.join(ROOT, "schema/propose_override.py"), a.description, "--path", o["path"], "--value", json.dumps(o["value"]), "--tag", o["tag"],
                   "--reason", f"takeoff import {os.path.basename(a.workbook)} row {o['row']} ({o['kind']})", "--evidence", o["source"]["doc"], "--author", a.author,
                   "--decision", a.decision, "--source", json.dumps(o["source"]), "--created", created] + sum((["--affects", x] for x in a.affects), [])
            if o.get("unit"):
                cmd += ["--unit", str(o["unit"])]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode:
                raise SystemExit(f"stopped at {o['path']}: {r.stdout}{r.stderr}")
        L += ["", f"Applied: {len(P['overrides'])} proposal(s) under {a.decision} (status proposed)."]
    txt = "\n".join(L) + "\n"
    if a.report:
        open(a.report, "w").write(txt)
        json.dump(P, open(a.report.replace(".md", ".json"), "w"), indent=1, ensure_ascii=False, default=str)
    print(txt)


if __name__ == "__main__":
    main()
