#!/usr/bin/env python3
"""Exports step: Excel workbook (bridge data with tags, Needs Review = every Missing-Flagged row, girder checks, hog,
bearings, piles) and Word report, built from a run's outputs only; hog curves carried from the losses analysis."""
import json, os, shutil, subprocess, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R); sys.path.insert(0, os.path.join(R, "schema"))
from openpyxl import load_workbook
from docx import Document
from rules_0_2 import records
from pdf2bim.design.girder_design import _hog

res = []


def t(name, ok, info=""):
    res.append(bool(ok)); print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


h = _hog({"X": [0.0, 15000.0, 30000.0], "res": [{"label": "Transfer", "t": 0, "hog": [0.0, 51.234, 0.0]}, {"label": "130 d", "t": 130, "hog": [0.0, 71.0, 0.0]}]})
t("hog curves kept per reported time, stations in m", h["x_m"] == [0.0, 15.0, 30.0] and h["times"][0]["hog_mm"] == [0.0, 51.23, 0.0] and h["times"][1]["label"] == "130 d")

rd = tempfile.mkdtemp(prefix="pdf2bim_exp_")
for n in ("combined_actions", "girder_checks"):
    shutil.copy(os.path.join(R, f"projects/B12626/model/B12626.{n}.json"), os.path.join(rd, f"{n}.json"))
gc = json.load(open(os.path.join(rd, "girder_checks.json")))
g0 = next(k for k, v in gc.items() if isinstance(v, dict) and "rows" in v)
gc[g0]["hog"] = h
json.dump(gc, open(os.path.join(rd, "girder_checks.json"), "w"))
desc = os.path.join(R, "projects/B12626/B12626.bridge.0.2.json")
p = subprocess.run([sys.executable, "app/export_files.py", desc, rd], cwd=R, capture_output=True, text=True)
t("export step runs", p.returncode == 0, (p.stdout + p.stderr)[-300:])
wb = load_workbook(os.path.join(rd, "workbook.xlsx"))
t("workbook sheets", {"Read me", "Bridge data", "Needs Review", "Girder checks", "Bearings", "Piles", f"Hog {g0}"[:31]} <= set(wb.sheetnames), wb.sheetnames)
doc = json.load(open(desc))
rec = list(records(doc))
bd = list(wb["Bridge data"].iter_rows(min_row=2, values_only=True))
t("every bridge-data record exported with its tag", len(bd) == len(rec) and all(r[3] for r in bd))
nr = list(wb["Needs Review"].iter_rows(min_row=2, values_only=True))
t("Needs Review = every Missing-Flagged record", len(nr) == sum(r.get("tag") == "Missing-Flagged" for _, r in rec) and all(r[3] == "Missing-Flagged" for r in nr), len(nr))
ca = json.load(open(os.path.join(rd, "combined_actions.json")))
pl = {r[0]: r for r in wb["Piles"].iter_rows(min_row=2, values_only=True)}
k = next(iter(ca["schedule"]["piles"]))
t("pile actions copied unchanged from the actions step", pl[k][1] == ca["schedule"]["piles"][k]["ULS"]["N"]["max"] and len(pl) == len(ca["schedule"]["piles"]))
hg = list(wb[f"Hog {g0}"[:31]].iter_rows(values_only=True))
t("hog sheet: x and one column per time", hg[0] == ("x (m)", "Transfer (mm)", "130 d (mm)") and hg[2] == (15.0, 51.23, 71.0))
d = Document(os.path.join(rd, "report.docx"))
t("Word report with tables (tags, needs review, girders, bearings, piles)", len(d.tables) >= 4 and "calculation summary" in d.paragraphs[0].text)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
