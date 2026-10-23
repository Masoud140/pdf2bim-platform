#!/usr/bin/env python3
"""P0.1 baseline regression tests.

    python3 tests/baseline/test_baseline.py          # fast: comparator tests on the committed reference
    BASELINE_LIVE=1 python3 tests/baseline/test_baseline.py
                                                     # + runs the dashboard (about 2 x 100 s): current build vs
                                                     #   reference, and a perturbed input that must be detected

Live mode needs Node, Playwright (NODE_PATH) and Chromium, and a built dist/ (./build.sh).
Prints PASS/FAIL per test; exit code 1 if any test fails.
"""
import copy, json, os, subprocess, sys, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from compare_snapshot import compare  # noqa: E402

REF = os.path.join(ROOT, "baseline", "BR13A", "snapshot.json")
DIST = os.path.join(ROOT, "dist", "BR13A_grillage_dashboard.html")
results = []


def t(name, ok, info=""):
    ok = bool(ok)
    results.append(ok)
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


ref = json.load(open(REF))

# ---- comparator behaviour (no browser) ----
t("reference has quantities, checks and a run record",
  len(ref["quantities"]) > 500 and ref["checks"] and ref["run"]["git"]["commit"] and ref["run"]["dashboard"]["sha256"])
t("every quantity is tagged indicative with reasons",
  all(q["status"] == "indicative" and q["reasons"] for q in ref["quantities"]))
t("reference compared with itself: no differences", compare(ref, copy.deepcopy(ref)) == [])

p = copy.deepcopy(ref)
q = next(x for x in p["quantities"] if x["id"] == "brg.A_L1.V.DLc")
q["value"] *= 1.0001
d = compare(ref, p)
t("a 0.01 % change of one bearing reaction is detected (exact mode)", len(d) == 1 and d[0]["id"] == "brg.A_L1.V.DLc", str(d[:1]))
t("the same change is within the provisional engineering tolerance", compare(ref, p, "engineering") == [])

p = copy.deepcopy(ref)
next(x for x in p["quantities"] if x["id"] == "geom.G2.chord_length")["value"] += 0.002
t("a 2 mm chord change fails engineering mode (1 mm tolerance)", len(compare(ref, p, "engineering")) == 1)

p = copy.deepcopy(ref)
p["quantities"] = p["quantities"][1:]
t("a removed quantity is detected", any(x["kind"] == "removed" for x in compare(ref, p)))

p = copy.deepcopy(ref)
c = next(x for x in p["checks"] if x["id"] == "chk.equilibrium.SDL")
c["pass"] = not c["pass"]
t("a change in a consistency check's pass/fail is detected", any(x["kind"] == "check" for x in compare(ref, p)))

# ---- live runs (optional, slow) ----
if os.environ.get("BASELINE_LIVE") == "1":
    tmp = tempfile.mkdtemp()
    run = lambda dash, out: subprocess.run(["node", os.path.join(ROOT, "tools", "baseline_snapshot.js"), "--dash", dash, "--out", out],
                                           cwd=ROOT, capture_output=True, text=True, timeout=1800)
    out1 = os.path.join(tmp, "now.json")
    r = run(DIST, out1)
    t("live: snapshot of the current build runs", r.returncode == 0 and os.path.exists(out1), (r.stdout + r.stderr).strip()[-300:])
    if os.path.exists(out1):
        d = compare(ref, json.load(open(out1)))
        t("live: current build reproduces the reference exactly", d == [], f"{len(d)} differences, first: {d[:2]}")
    # perturb one real input: girder concrete E 34800000 -> 36000000 kPa in the embedded .mct
    html = open(DIST, encoding="utf-8").read()
    key = "M1_Girder_50MPa, 0, 0, , C, NO, 0.05, 2, 34800000"
    pert = os.path.join(tmp, "perturbed.html")
    open(pert, "w", encoding="utf-8").write(html.replace(key, key.replace("34800000", "36000000"), 1))
    out2 = os.path.join(tmp, "pert.json")
    r = run(pert, out2)
    if os.path.exists(out2):
        d = compare(ref, json.load(open(out2)))
        t("live: perturbed input (girder E +3.4 %) is detected", len(d) > 0 and html.count(key) == 1, f"{len(d)} differences")
    else:
        t("live: perturbed run produced a snapshot", False, (r.stdout + r.stderr)[-300:])

print(f"\n{sum(results)} passed, {len(results) - sum(results)} failed")
sys.exit(0 if all(results) else 1)
