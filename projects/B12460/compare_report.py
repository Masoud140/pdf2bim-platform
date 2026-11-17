#!/usr/bin/env python3
"""B12460 (SB41 EB): platform results against design report RPT-410001 rev D and drawing 0201 (ADR-062).

    python3 projects/B12460/compare_report.py RUN_S1 RUN_S2 RUN_S3 RUN_S4     # -> projects/B12460/model/COMPARISON_REPORT.md

Each span runs as its own description; pier piles are the sum of the two adjacent spans' envelopes (each maximised
separately: an upper bound for traffic) without the wall / column weight above the sill. Platform values are INDICATIVE
(generic proposed inputs D-1; standards entries unverified)."""
import json, os, sys

H = os.path.dirname(os.path.abspath(__file__))
runs = sys.argv[1:5]
CA = [json.load(open(os.path.join(r, "combined_actions.json")))["schedule"] for r in runs]
GC = [json.load(open(os.path.join(r, "girder_checks.json"))) for r in runs]
rows = []


def add(item, ref, src, val, where, note=""):
    rows.append((item, ref, src, val, where, None if val is None or not ref else 100 * (val - ref) / ref, note))


# girders: the report's critical girder is 41A-S3-04 (tables 4-31 / 4-32)
G = {k: v for Z in CA for k, v in Z["girders"].items()}
k = max(G, key=lambda g: G[g]["ULS"]["M_sag"]["value"])
add("Girder ULS sagging moment M*, largest of the bridge (kNm)", 9023, "report table 4-31 (41A-S3-04)", G[k]["ULS"]["M_sag"]["value"], f"{k} {G[k]['ULS']['M_sag']['gov']}")
g = G["41A-S3-04"]
add("41A-S3-04 ULS M* (kNm)", 9023, "report table 4-31", g["ULS"]["M_sag"]["value"], g["ULS"]["M_sag"]["gov"])
add("41A-S3-04 ULS V* (kN)", 2005, "report table 4-31", g["ULS"]["V"]["abs"], "platform: largest |V| along the girder",
    "report value is the design shear at its critical section; definition not stated")
gr = GC[2]["41A-S3-04"]["rows"]
mid = min((r for r in gr if r.get("conf") == "open" and (r.get("sag") or {}).get("phiMu")), key=lambda r: abs(r["t"] - 0.5))
add("41A-S3-04 φMu at mid-span (kNm)", 13725, "report table 4-31", mid["sag"]["phiMu"], f"t = {mid['t']:.2f}, φ = {mid['sag']['phi']:.3f}, kuo {mid['sag']['kuo']:.3f}",
    f"platform Muo (nominal) = {mid['sag']['Muo']:,.0f}")
add("41A-S3-04 SLS soffit stress at Ms* (MPa)", 1.99, "report table 4-32 (tension; limit 3.16)", mid["sag"]["soffit_sls"], f"{mid['sag']['row_sls']}, Ms* {mid['sag']['Ms']:,.0f} kNm",
    "platform: uncracked composite stress, tension +; the report table may be at transfer (see the transfer row)")
pc = GC[2]["41A-S3-04"].get("prestress")
if pc:
    T = pc["transfer"]
    top = max(T["rows"], key=lambda r: max(r["top"], r["bot"]))
    add("41A-S3-04 transfer compression (MPa)", 19.98, "report table 4-32 (compression; limit 24)", max(top["top"], top["bot"]), f"x = {top['x_m']:.2f} m, limit {top['limitC']:.1f}",
        "platform: girder alone at transfer, f'cp 35 (0700); the report's limit 24 = 0.6 x 40 (query)")
# piles
P = [{k: v for k, v in Z["piles"].items()} for Z in CA]
for s, sls, uls, note in (("A-1", 3702, 4931, "0201 value for A-09 .. A-13"), ("B-", 5189, 7840, "0201 value for B-05 .. B-10")):
    Q = {k: v for d in P for k, v in d.items() if k.startswith(s)}
    if Q:
        k1 = max(Q, key=lambda q: Q[q]["SLS"]["N"]["max"]); add(f"Pile SLS N max, abutment {s[0]} (kN)", sls, "0201 table 1", Q[k1]["SLS"]["N"]["max"], k1, note)
        k2 = max(Q, key=lambda q: Q[q]["ULS"]["N"]["max"]); add(f"Pile ULS N max, abutment {s[0]} (kN)", uls, "0201 table 1", Q[k2]["ULS"]["N"]["max"], k2)
for pier, sls, uls in (("P1-", 3641, 5322), ("P2-", 6223, 9078), ("P3-", 3668, 5188)):
    acc = {}
    for d in P:
        for kk, v in d.items():
            if kk.startswith(pier):
                o = acc.setdefault(kk, {"SLS": 0.0, "ULS": 0.0})
                o["SLS"] += v["SLS"]["N"]["max"]; o["ULS"] += v["ULS"]["N"]["max"]
    if acc:
        k1 = max(acc, key=lambda q: acc[q]["SLS"]); add(f"Pier {pier[1]} pile SLS N max (kN)", sls, "0201 table 1", acc[k1]["SLS"], k1,
                                                       "both spans' envelopes added; wall / columns above the sill not included" + ("; P2 shared with SB41 WB (its share not included)" if pier == "P2-" else ""))
        k2 = max(acc, key=lambda q: acc[q]["ULS"]); add(f"Pier {pier[1]} pile ULS N max (kN)", uls, "0201 table 1", acc[k2]["ULS"], k2, "as above")

L = ["# B12460 (SB41 EB) — platform vs design report RPT-410001 rev D", "",
     f"Runs `{', '.join(os.path.basename(os.path.normpath(r)) for r in runs)}` (spans 1-4; ADR-062). INDICATIVE: missing inputs are the generic proposals D-1 "
     "(soil springs, bearing elastomer, temperatures, wind, losses); standards entries unverified; HLP400 transcribed-unverified.", "",
     "| Item | Report / drawing | Source | Platform | Where | Difference | Note |", "|---|---|---|---|---|---|---|"]
for item, ref, src, val, where, d, note in rows:
    fv = "—" if val is None else (f"{val:,.2f}" if abs(val) < 100 else f"{val:,.0f}")
    L.append(f"| {item} | {ref:,} | {src} | {fv} | {where} | {'—' if d is None else f'{d:+.1f} %'} | {note} |")
L += ["", "Whether a difference is acceptable is the engineer's call. Known limits of this run:", "",
      "- each span is a separate model (ADR-062): the deck joints over the piers are not modelled; pier piles add the two spans' envelopes, without the wall / column weight;",
      "- skew above 35° at abutment B (report §2; BTD 2011/06 needs approval above 35°): the grillage is used as for any other skew;",
      "- span 4: the printed abutment B bearing levels (0601 table 1: 8.159 .. 7.649) put the girder tops 50 - 290 mm below the deck soffit at the skewed B end "
      "(haunch Calculated up to 286 mm on 41A-S4-04, carried as SDL): query whether a thickened deck or pedestal applies there;",
      "- the barrier section is the 1006 section 1 polygon read for SB42 (same PB family; the SB41 EB units not re-read: query);",
      "- abutment B headstock taken centred on the bearing line (its CL for the EB part not read: query);",
      "- safety / headlight screens and utilities are not in the SDL (Missing-Flagged); wind on screens uses generic coefficients (D-1);",
      "- shear / torsion is not checked: the aggregate size is not on the drawings (0700 refers to TfNSW B80) — the report's governing check for 41A-S3-04 is shear (98 %);",
      "- the report's pier pile moments are governed by rail impact, which the platform does not model (not compared)."]
os.makedirs(os.path.join(H, "model"), exist_ok=True)
open(os.path.join(H, "model", "COMPARISON_REPORT.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L))
