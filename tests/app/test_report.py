#!/usr/bin/env python3
"""P7.5 / P7.6 tests: model view modes against the owner's MIDAS run, and the calculation report built from run outputs.

BR13A: app/model_view.py computes the modes with the earthquake mass (ADR-046); T1 must equal the MIDAS run
2026-10-28g value 0.563 s (projects/BR13A/model/midas_run_2026-10-28g/COMPARISON.md). The report is then built from that
model view plus the repository's combined actions / girder checks, and must list every value needing review."""
import json, os, re, shutil, subprocess, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(R, "schema")); sys.path.insert(0, os.path.join(R, "app"))
from rules_0_2 import records
from server import effective

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


D = os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")
d = tempfile.mkdtemp(prefix="pdf2bim_report_")
subprocess.run([sys.executable, "app/model_view.py", D, f"{d}/model_view.json", "--allow-proposed"], cwd=R, check=True, capture_output=True)
mv = json.load(open(f"{d}/model_view.json"))
t("modes computed with the analysis.modes count of the description", len(mv["modes"]) == 30 and mv["modes"][0]["T"] > 0)
t("T1 = MIDAS run 2026-10-28g (lumped mass X Y Z) 0.563 s to 0.5 %", abs(mv["modes"][0]["T"] / 0.563 - 1) < 0.005, f"{mv['modes'][0]['T']} s")
t("mode shapes available as 3D cases", "Mode 1" in mv["cases"] and len(mv["cases"]["Mode 1"]["u"]) == len(mv["nodes"]))
t("periods decrease with mode number", all(a["T"] >= b["T"] for a, b in zip(mv["modes"], mv["modes"][1:])))

for src, dst in (("BR13A.combined_actions.json", "combined_actions.json"), ("BR13A.girder_checks.json", "girder_checks.json")):
    shutil.copy(os.path.join(R, "projects/BR13A/model", src), os.path.join(d, dst))
json.dump({"id": "test", "engine_commit": "test", "started": "-", "steps": [{"title": "Model", "state": "done", "seconds": 1.0}]}, open(f"{d}/status.json", "w"))
r = subprocess.run([sys.executable, "app/report.py", D, d, "--allow-proposed"], cwd=R, capture_output=True, text=True)
t("report written", r.returncode == 0 and os.path.exists(f"{d}/report.html"), (r.stderr or r.stdout)[-200:])
H = open(f"{d}/report.html").read()
doc = json.load(open(D))
n_rev = sum(1 for _, rec in records(doc) for v, tag, ov in [effective(rec, True)] if tag in ("Missing-Flagged", "Assumed") or ov)
t("needs-review section lists every Missing / Assumed / proposed value", f"Values needing review ({n_rev})" in H, f"{n_rev}")
t("report carries the INDICATIVE banner and the unverified-standards statement", "INDICATIVE — NOT DESIGN-APPROVED" in H and "not yet verified" in H)
t("report has model, modes, design actions, girder checks and limitations sections",
  all(s in H for s in ("Model and permanent loads", "Natural modes", "Design actions", "Super-T girder checks", "Limitations and open items")))
t("no NaN / None leaked into the report", not re.search(r">(nan|NaN|None)<", H))

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
