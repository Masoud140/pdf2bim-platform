#!/usr/bin/env python3
"""P5.3 tests: takeoff importer (pdf2bim/takeoff.py) — round trip of the example description's Direct / Calculated
values, and the import rules (no overwrite of Direct values, refusals, tag upgrades, new paths)."""
import json, os, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.takeoff import read_values, plan_import, write_values
from schema.rules_0_2 import records

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
d = tempfile.mkdtemp(); x = os.path.join(d, "v.xlsx")
write_values(doc, x)
rows = read_values(x)
n_dc = sum(r.get("tag") in ("Direct", "Calculated") for _, r in records(doc))
P = plan_import(doc, rows)
t("round trip: every Direct / Calculated value of the description re-imports as 'same' (no proposal, query or refusal)",
  len(rows) == n_dc and P["counts"]["same"] == n_dc and P["counts"]["overrides"] == P["counts"]["queries"] == P["counts"]["refused"] == P["counts"]["new_paths"] == 0, str(P["counts"]))
R_ = dict(records(doc))
pd = next(p for p, r in records(doc) if r.get("tag") == "Direct" and isinstance(r.get("value"), (int, float)))
pa = next(p for p, r in records(doc) if r.get("tag") == "Assumed" and isinstance(r.get("value"), (int, float)) and r.get("value"))
ref = {"source_ref": "DRG-TEST sheet 2 view 3", "notes": None}
case = lambda path, v, st, **k: dict(dict({"row": 99, "path": path, "value": v, "unit": None, "source_type": st}, **ref), **k)
P = plan_import(doc, [case(pd, R_[pd]["value"] * 1.1, "Direct")])
t("a value conflicting with a Direct value becomes a query, never an override", P["counts"]["queries"] == 1 and not P["overrides"], pd)
P = plan_import(doc, [case(pa, R_[pa]["value"] * 1.1, "Direct")])
t("a new value for an Assumed field becomes an override proposal with tag Direct and the source ref", P["counts"]["overrides"] == 1 and P["overrides"][0]["tag"] == "Direct" and P["overrides"][0]["source"]["doc"].startswith("DRG-TEST"), pa)
P = plan_import(doc, [case(pa, R_[pa]["value"], "Direct")])
t("the same value found on the drawing for an Assumed field: tag upgrade proposal (Assumed -> Direct)", P["counts"]["overrides"] == 1 and P["overrides"][0]["kind"] == "tag upgrade")
P = plan_import(doc, [case(pd, 1.0, "Direct", source_ref=""), case(pd, 1.0, "Calculated", notes=""), case(pd, 1.0, "Missing — Flagged"), case(pd, 1.0, "guess")])
t("refused: Direct without source ref, Calculated without derivation, Missing with a value, unknown Data Source", P["counts"]["refused"] == 4, "; ".join(r["why"] for r in P["refused"]))
P = plan_import(doc, [case(pd, None, "NOT FOUND")])
t("Missing — Flagged (\"NOT FOUND\") where the description has a Direct value: a query", P["counts"]["queries"] == 1)
P = plan_import(doc, [case("superstructure.not_a_field", 3.0, "Direct")])
t("a unit different from the description's is refused (no silent conversion)", plan_import(doc, [case(pa, 1.0, "Direct", unit="furlong")])["counts"]["refused"] == 1)
t("an unknown path is listed as a new path for the engineer, not written", P["counts"]["new_paths"] == 1)
try:
    import openpyxl
    wb = openpyxl.Workbook(); wb.active.title = "Other"; wb.save(os.path.join(d, "b.xlsx")); read_values(os.path.join(d, "b.xlsx")); ok = False
except ValueError as e:
    ok = "no sheet" in str(e)
t("a workbook without the Values sheet is refused, naming its sheets", ok)
import shutil, subprocess, openpyxl
for f in ("BR13A.bridge.0.2.json", "BR13A.decisions.jsonl"):
    shutil.copy(os.path.join(R, "projects/BR13A", f), d)
Pd = os.path.join(d, "BR13A.bridge.0.2.json")
wb = openpyxl.load_workbook(x); wb["Values"].append([pa, R_[pa]["value"] * 1.1, R_[pa].get("unit"), "Direct", "DRG-TEST sheet 2", None]); wb.save(x)
r = subprocess.run([sys.executable, os.path.join(R, "tools/import_takeoff.py"), Pd, x, "--apply", "--decision", "D-98", "--affects", "geometry"], capture_output=True, text=True)
n = json.load(open(Pd)); rec = dict(records(n))[pa]
t("--apply: the override is proposed through propose_override (next revision, decision D-98 proposed); the current value is unchanged",
  r.returncode == 0 and n["revision"]["number"] == doc["revision"]["number"] + 1 and "D-98" in n["revision"]["note"] and rec["value"] == R_[pa]["value"]
  and rec["overrides"][-1]["approval"]["status"] == "proposed" and json.loads(open(os.path.join(d, "BR13A.decisions.jsonl")).read().splitlines()[-1])["status"] == "proposed", (r.stdout + r.stderr)[-200:])
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
