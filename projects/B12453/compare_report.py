#!/usr/bin/env python3
"""B12453 (SB02): platform results against the design report RPT-000001 rev E and drawing 0201 (P8 stage 3).

    python3 projects/B12453/compare_report.py RUN_DIR       # RUN_DIR holds combined_actions.json, girder_checks.json
                                                           # -> projects/B12453/model/COMPARISON_REPORT.md

Report values are for "the most critically loaded" element over SB01 / SB02 / SB03 unless the table is per bridge.
Platform values are INDICATIVE (proposed inputs D-1; standards entries unverified; HLP400 not modelled)."""
import json, os, sys

H = os.path.dirname(os.path.abspath(__file__))
run = sys.argv[1]
ca = json.load(open(os.path.join(run, "combined_actions.json")))
gc = json.load(open(os.path.join(run, "girder_checks.json")))
Z = ca["schedule"]


def mx(d, f):
    k = max(d, key=lambda k: f(d[k]) if f(d[k]) is not None else float("-inf"))
    return f(d[k]), k


rows = []


def add(item, ref, src, val, where, scope):
    d = None if val is None or not ref else 100 * (val - ref) / ref
    rows.append((item, ref, src, val, where, d, scope))


v, k = mx(Z["girders"], lambda g: g["ULS"]["M_sag"]["value"]); add("Girder ULS sagging moment M* (kNm)", 15924, "report table 4-6", v, f"{k} {Z['girders'][k]['ULS']['M_sag']['gov']}", "critical girder, 3 bridges")
v, k = mx(Z["girders"], lambda g: g["SLS"]["M_sag"]["value"]); add("Girder SLS moment (kNm)", 10528, "report table 4-4", v, f"{k} {Z['girders'][k]['SLS']['M_sag']['gov']}", "critical girder, 3 bridges")
v, k = mx(Z["girders"], lambda g: g["ULS"]["V"]["abs"]); add("Girder ULS shear V* (kN)", 2157, "report table 4-6 ('equivalent shear', incl. torsion)", v, k, "critical girder, 3 bridges")
phi = []
for g, R in gc.items():
    if isinstance(R, dict) and "rows" in R:
        for r in R["rows"]:
            if r.get("conf") != "solid" and abs(r["t"] - 0.5) < 0.06 and r.get("sag", {}).get("phiMu"):
                phi.append((r["sag"]["phiMu"], g))
if phi:
    v, k = max(phi); add("Girder ULS capacity φMu at midspan (kNm)", 17057, "report table 4-6", v, k, "critical girder")
v, k = mx(Z["bearings"], lambda b: b["SLS"]["v"]["max"]); add("Bearing SLS N max (kN)", 2015, "report table 4-10", v, k, "all bearings, 3 bridges")
v, k = mx(Z["bearings"], lambda b: -b["SLS"]["v"]["min"]); add("Bearing SLS N min (kN)", 946, "report table 4-10", -v, k, "all bearings, 3 bridges")
for s, sls, uls, m in (("A", 2713, 3524, 2049), ("B", 2885, 3524, 2031)):
    P = {k: p for k, p in Z["piles"].items() if k.startswith(s)}
    v, k = mx(P, lambda p: p["SLS"]["N"]["max"]); add(f"Pile SLS N max, abutment {s}2 (kN)", sls, "drawing 0201 table 1 (report 5-5: 3281)", v, k, "per abutment SB02")
    v, k = mx(P, lambda p: p["ULS"]["N"]["max"]); add(f"Pile ULS N max, abutment {s}2 (kN)", uls, "drawing 0201 table 1 / report 5-5", v, k, "per abutment SB02")
    PR = {k: (ca.get("pile_resultants") or {}).get(k, {}).get("resultant_upper") for k in P}
    k = max(PR, key=lambda q: PR[q] or 0); add(f"Pile ULS moment, abutment {s}2 (kNm)", m, "drawing 0201 table 1 (report 4-15: 2053)", PR[k], k, "per abutment SB02")
v, k = mx(Z["piles"], lambda p: max(p["SLS"]["Ml"]["abs"], p["SLS"]["Mt"]["abs"])); add("Pile SLS moment (kNm)", 952, "report table 4-14 (with N 2358)", v, k, "critical pile, 3 bridges")

L = ["# B12453 (SB02) — platform vs design report RPT-000001 rev E", "",
     f"Run `{os.path.basename(os.path.normpath(run))}`; INDICATIVE: development inputs D-1 PROPOSED (soil springs, bearing elastomer, temperatures "
     "and wind as BR13A — Appendix J not supplied); standards entries unverified; **HLP400 not modelled** (SM1600 only); report values are the critical "
     "element over the three bridges unless marked per abutment.", "",
     "| Item | Report / drawing | Source | Platform | Where (governing row) | Difference |", "|---|---|---|---|---|---|"]
for item, ref, src, val, where, d, scope in rows:
    L.append(f"| {item} | {ref:,} | {src} | {'—' if val is None else f'{val:,.0f}'} | {where} | {'—' if d is None else f'{d:+.1f} %'} |")
open(os.path.join(H, "model", "COMPARISON_REPORT.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L))
