#!/usr/bin/env python3
"""B12461 (SB42): platform results against design report RPT-410001 rev D and drawing 0201 (ADR-062).

    python3 projects/B12461/compare_report.py RUN_S1 RUN_S2     # -> projects/B12461/model/COMPARISON_REPORT.md

Each span runs as its own description; the pier is completed here: pier pile actions = span 1 + span 2 pile actions at
P1 (each envelope maximised separately: an upper bound for traffic) + the blade wall weight (Calculated from 0405 / 0406).
Platform values are INDICATIVE (generic proposed inputs D-1; standards entries unverified)."""
import json, math, os, sys

H = os.path.dirname(os.path.abspath(__file__))
runs = sys.argv[1:3]
CA = [json.load(open(os.path.join(r, "combined_actions.json")))["schedule"] for r in runs]
GC = [json.load(open(os.path.join(r, "girder_checks.json"))) for r in runs]
rows = []


def add(item, ref, src, val, where, note=""):
    rows.append((item, ref, src, val, where, None if val is None or not ref else 100 * (val - ref) / ref, note))


# girders: the report's critical girder is 42-S1-05 (tables 4-29 / 4-30)
G = {k: v for Z in CA for k, v in Z["girders"].items()}
k = max(G, key=lambda g: G[g]["ULS"]["M_sag"]["value"])
add("Girder ULS sagging moment M* (kNm)", 15089, "report table 4-29 (42-S1-05)", G[k]["ULS"]["M_sag"]["value"], f"{k} {G[k]['ULS']['M_sag']['gov']}")
g5 = G["42-S1-05"]
add("42-S1-05 ULS M* (kNm)", 15089, "report table 4-29", g5["ULS"]["M_sag"]["value"], g5["ULS"]["M_sag"]["gov"])
add("42-S1-05 ULS V* (kN)", 1716, "report table 4-29", g5["ULS"]["V"]["abs"], "platform: largest |V| along the girder",
    "report value is the design shear at its critical section; definition not stated")
gr = GC[0]["42-S1-05"]["rows"]
mid = min((r for r in gr if r.get("conf") == "open" and (r.get("sag") or {}).get("phiMu")), key=lambda r: abs(r["t"] - 0.5))
add("42-S1-05 φMu at mid-span (kNm)", 15726, "report table 4-29", mid["sag"]["phiMu"], f"t = {mid['t']:.2f}, φ = {mid['sag']['phi']:.3f}, kuo {mid['sag']['kuo']:.3f}",
    f"platform Muo (nominal, minimum-strength check) = {mid['sag']['Muo']:,.0f}")
sys.path.insert(0, os.path.join(H, "..", "..", "tools"))
from phimu_hand_check import check as hand                    # noqa: E402
hc = hand(os.path.join(H, "..", "B12461-S1", "B12461-S1.bridge.0.2.json"), 2.4, [0.0])[0]
add("42-S1-05 φMu, independent hand check (kNm)", 15726, "report table 4-29", hc["phiMu"], "AS 5100.5 Cl 8.1.8 approximate method, b 2.4 m, no haunch",
    f"nominal Mu {hc['Mu']:,.0f} kNm, phi {hc['phi']:.2f} (tools/phimu_hand_check.py): see model/PHIMU_SLS_NOTE.md")
add("42-S1-05 SLS soffit stress at Ms* (MPa)", 3.15, "report table 4-30 (tension; limit 3.16)", mid["sag"]["soffit_sls"], f"{mid['sag']['row_sls']}, Ms* {mid['sag']['Ms']:,.0f} kNm",
    "platform: uncracked composite stress, tension +")
hg = GC[0]["42-S1-05"].get("hog") or {}
# piles
P = [{k: v for k, v in Z["piles"].items()} for Z in CA]
for s, sls, uls in (("A-0", 4686, 6606), ("B-0", 4177, 5840)):
    Q = {k: v for d in P for k, v in d.items() if k.startswith(s)}
    if Q:
        k1 = max(Q, key=lambda q: Q[q]["SLS"]["N"]["max"]); add(f"Pile SLS N max, abutment {s[0]} (kN)", sls, "0201 table 1 (design max for the abutment)", Q[k1]["SLS"]["N"]["max"], k1,
                                                                "0201 value covers the whole abutment (SB41 + SB42 piles)" if s == "A-0" else "")
        k2 = max(Q, key=lambda q: Q[q]["ULS"]["N"]["max"]); add(f"Pile ULS N max, abutment {s[0]} (kN)", uls, "0201 table 1", Q[k2]["ULS"]["N"]["max"], k2)
# pier: both spans + the wall
A_wall = 12.05 * 1.65 + math.pi * 0.825 ** 2                  # 0406: 7025 + 5025 between the end centres, 1650 thick, R 825 ends
h_wall = (8.303 + 8.584) / 2 - 1.452                          # 0405 elevation: top RL 8.303 / 8.584, pile tops RL 1.452 (0201)
W = A_wall * (h_wall - 2 * 1.5) * 25.0                        # each span model already has the 1.5 m deep sill (13.7 x 1.65): two of them
WALL = (f"blade wall {A_wall:.2f} m2 (12.05 x 1.65 + π 0.825², 0406) x ({h_wall:.2f} m (mean top RL {(8.303 + 8.584) / 2:.3f} - pile top 1.452) "
        f"- 2 x 1.5 m sill already in the two span models) x 25 kN/m3 = {W:,.0f} kN, {W / 3:,.0f} per pile (ULS x 1.2)")
pier = {}
for d in P:
    for k, v in d.items():
        if k.startswith("SB42 P1"):
            o = pier.setdefault(k, {"SLS": 0.0, "ULS": 0.0})
            o["SLS"] += v["SLS"]["N"]["max"]; o["ULS"] += v["ULS"]["N"]["max"]
if pier:
    for kk in pier:
        pier[kk]["SLS"] += W / 3; pier[kk]["ULS"] += 1.2 * W / 3
    k1 = max(pier, key=lambda q: pier[q]["SLS"]); add("Pier 1 pile SLS N max (kN)", 5763, "0201 table 1 / report", pier[k1]["SLS"], k1,
                                                   "span 1 + span 2 + wall: upper bound for traffic; " + WALL)
    k2 = max(pier, key=lambda q: pier[q]["ULS"]); add("Pier 1 pile ULS N max (kN)", 8562, "0201 table 1 / report", pier[k2]["ULS"], k2, "as above")

L = ["# B12461 (SB42) — platform vs design report RPT-410001 rev D", "",
     f"Runs `{', '.join(os.path.basename(os.path.normpath(r)) for r in runs)}` (span 1, span 2; ADR-062). INDICATIVE: missing inputs are the generic proposals D-1 "
     "(soil springs, bearing elastomer, temperatures, wind, losses); standards entries unverified; HLP400 transcribed-unverified.", "",
     "| Item | Report / drawing | Source | Platform | Where | Difference | Note |", "|---|---|---|---|---|---|---|"]
for item, ref, src, val, where, d, note in rows:
    fv = "—" if val is None else (f"{val:,.2f}" if abs(val) < 100 else f"{val:,.0f}")
    L.append(f"| {item} | {ref:,} | {src} | {fv} | {where} | {'—' if d is None else f'{d:+.1f} %'} | {note} |")
L += ["", "Whether a difference is acceptable is the engineer's call. Known limits of this run:", "",
      "- each span is a separate model (ADR-062): the link slab over the pier is not modelled; pier piles are the sum of the two spans' envelopes plus the wall;",
      "- deck widths vary along the spans (0805); the platform takes the widest station on each side (edge girders slightly conservative);",
      "- abutment A is curved (R 154.089); a straight support line through its end bearings is used (middle bearings up to ~80 mm off it, girder lines kept);",
      "- the raised footpath concrete is in the SDL (Calculated from the 0805 RLs); safety / headlight screens and utilities are not yet (Missing-Flagged);",
      "- wind on the screens in the report's critical combination (PE + HLP400 + 35 m/s wind) uses generic coefficients (D-1);",
      "- shear / torsion is not checked: the aggregate size is not on the drawings (0700 refers to TfNSW B80);",
      "- the report's pier pile moments are governed by rail impact, which the platform does not model (not compared)."]
os.makedirs(os.path.join(H, "model"), exist_ok=True)
open(os.path.join(H, "model", "COMPARISON_REPORT.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L))
