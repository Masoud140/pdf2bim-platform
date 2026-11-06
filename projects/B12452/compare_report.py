#!/usr/bin/env python3
"""B12452 (SB01): platform results against the design report RPT-000001 rev E and drawing 0201 (P8 stage 4c).

    python3 projects/B12452/compare_report.py RUN_DIR      # -> projects/B12452/model/COMPARISON_REPORT.md

Report tables 4-4..4-15 give the critical element over SB01 / SB02 / SB03; drawing 0201 gives SB01 per abutment.
Platform values are INDICATIVE (generic proposed inputs D-1; standards entries unverified)."""
import json, os, sys

H = os.path.dirname(os.path.abspath(__file__))
run = sys.argv[1]
ca = json.load(open(os.path.join(run, "combined_actions.json")))
gc = json.load(open(os.path.join(run, "girder_checks.json")))
Z = ca["schedule"]
rows = []


def mx(d, f):
    k = max(d, key=lambda k: f(d[k]) if f(d[k]) is not None else float("-inf"))
    return f(d[k]), k


def add(item, ref, src, val, where, scope):
    rows.append((item, ref, src, val, where, None if val is None else 100 * (val - ref) / ref, scope))


v, k = mx(Z["girders"], lambda g: g["ULS"]["M_sag"]["value"]); add("Girder ULS sagging moment M* (kNm)", 15924, "report table 4-6", v, f"{k} {Z['girders'][k]['ULS']['M_sag']['gov']}", "critical girder, 3 bridges")
v, k = mx(Z["girders"], lambda g: g["SLS"]["M_sag"]["value"]); add("Girder SLS moment (kNm)", 10528, "report table 4-4", v, f"{k} {Z['girders'][k]['SLS']['M_sag']['gov']}", "critical girder, 3 bridges")
v, k = mx(Z["girders"], lambda g: g["ULS"]["V"]["abs"]); add("Girder ULS shear V* (kN)", 2157, "report table 4-6 ('equivalent shear', incl. torsion)", v, k, "critical girder, 3 bridges")
phi = [(r["sag"]["phiMu"], g) for g, R in gc.items() if isinstance(R, dict) and "rows" in R for r in R["rows"]
       if r.get("conf") != "solid" and abs(r["t"] - 0.5) < 0.06 and (r.get("sag") or {}).get("phiMu")]
if phi:
    v, k = max(phi); add("Girder ULS capacity φMu at midspan (kNm)", 17057, "report table 4-6", v, k, "critical girder")
v, k = mx(Z["bearings"], lambda b: b["SLS"]["v"]["max"]); add("Bearing SLS N max (kN)", 2015, "report table 4-10", v, k, "all bearings, 3 bridges")
for s, sls, uls, m in (("A", 3491, 4210, 1771), ("B", 2791, 4210, 1765)):
    P = {k: p for k, p in Z["piles"].items() if k.startswith(s)}
    v, k = mx(P, lambda p: p["SLS"]["N"]["max"]); add(f"Pile SLS N max, abutment {s}1 (kN)", sls, "drawing 0201 table 1 (report 5-5: 3573 / 3515)", v, k, "per abutment SB01")
    v, k = mx(P, lambda p: p["ULS"]["N"]["max"]); add(f"Pile ULS N max, abutment {s}1 (kN)", uls, "drawing 0201 table 1 / report 5-5", v, k, "per abutment SB01")
    PR = {k: (ca.get("pile_resultants") or {}).get(k, {}).get("resultant_upper") for k in P}
    k = max(PR, key=lambda q: PR[q] or 0); add(f"Pile ULS moment, abutment {s}1 (kNm)", m, "drawing 0201 table 1", PR[k], k, "per abutment SB01")

L = ["# B12452 (SB01) — platform vs design report RPT-000001 rev E", "",
     f"Run `{os.path.basename(os.path.normpath(run))}`; INDICATIVE: missing inputs are the generic proposals D-1 (ADR-058: soil springs, bearing elastomer, "
     "temperatures, wind); standards entries unverified; HLP400 transcribed-unverified (AS 5100.7-2004 App A). Report girder / bearing values are the critical "
     "element over the three bridges; pile values are SB01 per abutment (0201).", "",
     "| Item | Report / drawing | Source | Platform | Where (governing row) | Difference |", "|---|---|---|---|---|---|"]
for item, ref, src, val, where, d, scope in rows:
    L.append(f"| {item} | {ref:,} | {src} | {'—' if val is None else f'{val:,.0f}'} | {where} | {'—' if d is None else f'{d:+.1f} %'} |")
L += ["", "Colour-free on purpose: whether a difference is acceptable is the engineer's call. Known limits of this run:", "",
      "- deck widths W2 / W3 vary along the span (0701 / 0703); the platform uses the mid-length values (one carriageway width each side);",
      "- HLP400 centred on each carriageway ±1 m; the report's 'any two marked lanes in each direction' positions are not tried (traffic.py shortcut);",
      "- lanes per carriageway floor(width / 3.2) = 4 + 5 = 9, as the 9 design lanes on drawing 0101;",
      "- median barrier weight from the 0706 detail B outline with two slope-break heights scaled (not dimensioned);",
      "- soil springs are generic placeholders, so pile moments are not benchmarkable until Appendix J is supplied."]
os.makedirs(os.path.join(H, "model"), exist_ok=True)
open(os.path.join(H, "model", "COMPARISON_REPORT.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L))
