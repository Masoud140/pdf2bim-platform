#!/usr/bin/env python3
"""B12459 (SB41 WB): platform results against design report RPT-410001 rev D and drawing 0201 — INDICATIVE ONLY (ADR-062).

    python3 projects/B12459/compare_report.py RUN_S1 RUN_S2     # -> projects/B12459/model/COMPARISON_REPORT.md
    python3 projects/B12459/compare_report.py RUN_CONT          # one continuous run of both spans (ADR-082) -> COMPARISON_REPORT_CONTINUOUS.md

The girders are continuous over the pier (stress bars); the platform runs each span simply supported. Sagging M* is therefore
overstated and there is no hogging moment: the hogging rows are listed for the record only."""
import json, os, sys

H = os.path.dirname(os.path.abspath(__file__))
runs = sys.argv[1:3]
CONT = len(runs) == 1
CA = [json.load(open(os.path.join(r, "combined_actions.json")))["schedule"] for r in runs]
GC = [json.load(open(os.path.join(r, "girder_checks.json"))) for r in runs]
rows = []


def add(item, ref, src, val, where, note=""):
    rows.append((item, ref, src, val, where, None if val is None or not ref else 100 * (val - ref) / ref, note))


G = {k: v for Z in CA for k, v in Z["girders"].items()}
k = max(G, key=lambda g: G[g]["ULS"]["M_sag"]["value"])
add("Girder ULS sagging M*, largest of the bridge (kNm)", 17320, "report table 4-27 (41B-S1-09)", G[k]["ULS"]["M_sag"]["value"], f"{k} {G[k]['ULS']['M_sag']['gov']}",
    "simply supported: expected above the continuous design")
g = G["41B-S1-09"]
add("41B-S1-09 ULS M* sagging (kNm)", 17320, "report table 4-27", g["ULS"]["M_sag"]["value"], g["ULS"]["M_sag"]["gov"],
    "continuous, self weight simply supported (staging provisional)" if CONT else "simply supported vs continuous")
if CONT:
    add("41B-S1-09 ULS M* hogging (kNm)", 14521, "report table 4-27 (φMu 14,698)", -g["ULS"]["M_hog"]["value"], f"{g['ULS']['M_hog']['gov']}, ch {g['ULS']['M_hog']['ch']:.2f}",
        "magnitude; continuous, staging provisional")
else:
    add("41B-S1-09 ULS M* hogging (kNm)", 14521, "report table 4-27 (φMu 14,698)", None, "not modelled", "no continuity in the platform")
add("41B-S1-09 ULS V* (kN)", 2122, "report table 4-27", g["ULS"]["V"]["abs"], "platform: largest |V| along the girder", "report: design shear at its critical section")
gr = GC[0]["41B-S1-09"]["rows"]
mid = min((r for r in gr if r.get("conf") == "open" and (r.get("sag") or {}).get("phiMu")), key=lambda r: abs(r["t"] - 0.5))
add("41B-S1-09 φMu at mid-span (kNm)", 17720, "report table 4-27", mid["sag"]["phiMu"], f"t = {mid['t']:.2f}, φ = {mid['sag']['phi']:.3f}",
    f"platform Muo = {mid['sag']['Muo']:,.0f}; the report value may include the deck reinforcement / stress bars")
add("41B-S1-09 SLS soffit stress at Ms* (MPa)", 3.06, "report table 4-28 (tension; limit 3.16)", mid["sag"]["soffit_sls"], f"{mid['sag']['row_sls']}, Ms* {mid['sag']['Ms']:,.0f} kNm",
    ("platform: continuous (staging provisional)" if CONT else "platform: simply supported") + ", uncracked composite, tension +")
pc = GC[0]["41B-S1-09"].get("prestress")
if pc:
    top = max(pc["transfer"]["rows"], key=lambda r: max(r["top"], r["bot"]))
    add("41B-S1-09 transfer compression (MPa)", 23.54, "report table 4-28 (compression; limit 24)", max(top["top"], top["bot"]), f"x = {top['x_m']:.2f} m, limit {top['limitC']:.1f}",
        "girder alone at transfer, f'cp 40 (0700)")
P = [Z["piles"] for Z in CA]
for ids, sls, uls in ((("A-05", "A-06", "A-07", "A-08"), 4686, 6606), (("A-09", "A-10"), 3702, 4931), (("B-05", "B-06", "B-07", "B-08"), 5189, 7840)):
        Q = {k: v for d in P for k, v in d.items() if k in ids}
        if Q:
            k1 = max(Q, key=lambda q: Q[q]["SLS"]["N"]["max"]); add(f"Pile SLS N max, {'/'.join(ids)} (kN)", sls, "0201 table 1", Q[k1]["SLS"]["N"]["max"], k1)
            k2 = max(Q, key=lambda q: Q[q]["ULS"]["N"]["max"]); add(f"Pile ULS N max, {'/'.join(ids)} (kN)", uls, "0201 table 1", Q[k2]["ULS"]["N"]["max"], k2)
acc = {}
for d in P:
    for kk, v in d.items():
        if kk.startswith("P2-"):
            o = acc.setdefault(kk, {"SLS": 0.0, "ULS": 0.0}); o["SLS"] += v["SLS"]["N"]["max"]; o["ULS"] += v["ULS"]["N"]["max"]
if acc:
    k1 = max(acc, key=lambda q: acc[q]["SLS"]); add("Pier 1 (EB P2) pile SLS N max (kN)", 6223, "0201 table 1 (P2-04)", acc[k1]["SLS"], k1,
                                                    "one continuous model; wall weight and the SB41 EB share not included" if CONT else "both spans' envelopes added; wall weight and the SB41 EB share not included")
    k2 = max(acc, key=lambda q: acc[q]["ULS"]); add("Pier 1 (EB P2) pile ULS N max (kN)", 9078, "0201 table 1 (P2-04)", acc[k2]["ULS"], k2, "as above")

L = ["# B12459 (SB41 WB) — platform vs design report RPT-410001 rev D — INDICATIVE", ""]
L += ([f"Run `{os.path.basename(os.path.normpath(runs[0]))}`: **both spans joined continuous over the pier (ADR-082)** — self weight on the simply supported spans, "
       "SDL, thermal, wind and traffic on the continuous structure (staging provisional, not read from the drawings); hogging capacity = the girder section's "
       "(deck reinforcement / stress bars not yet in the section). Missing inputs are the generic proposals D-1; standards entries unverified.", ""] if CONT else [
     f"Runs `{', '.join(os.path.basename(os.path.normpath(r)) for r in runs)}` (spans 1-2; ADR-062). **The girders are continuous over the pier "
     "(stress bars, report table 4-27); the platform has no continuity, so each span runs simply supported: sagging is overstated, hogging is absent.** "
     "Missing inputs are the generic proposals D-1; standards entries unverified.", ""])
L += ["| Item | Report / drawing | Source | Platform | Where | Difference | Note |", "|---|---|---|---|---|---|---|"]
for item, ref, src, val, where, d, note in rows:
    fv = "—" if val is None else (f"{val:,.2f}" if abs(val) < 100 else f"{val:,.0f}")
    L.append(f"| {item} | {ref:,} | {src} | {fv} | {where} | {'—' if d is None else f'{d:+.1f} %'} | {note} |")
L += ["", "Known limits of this run (whether a difference is acceptable is the engineer's call):", ""]
L += (["- continuity: staging provisional (self weight simply supported); earthquake not combined; braking per span; span 1 carriageway along the deck (ADR-082);"] if CONT else
      ["- continuity over the pier not modelled (Tier 4 'continuous spans'): not a verification of SB41 WB;"])
L += [
      "- the girder ends stop short of the single pier bearing (X1 - chord = -180 .. -490 mm): the pier end is modelled 100 mm past the bearing (Model);",
      "- abutment B girder end distance taken 400 as abutment A (0709 dims at 44°: query);",
      "- deck taken at the widest 0801 W1 / W2 station in each span (the deck tapers 18.1 -> 15.0 m in span 1): the south edge girder 41B-S1-01 carries a "
      "3.9 m overhang at the pier end that does not exist, so its M* / V* (largest of the bridge) are not comparable — compare girder 09;",
      "- SLS soffit tension 9.7 MPa vs 3.06: simply supported SDL + traffic (the report's are continuous) and generic losses (D-1); transfer compression "
      "+20 % with f'cp 40; the 0724 strand reading for S1-07..09 (52 strands) was re-checked: the difference is the basis, not the reading;",
      "- one Super-T type per span (strands of the 07-09 group, fitments of girder 09);",
      "- headstock ends of the shared abutments = end bearings ± 1 m (Model); barrier section as SB41 EB (query);",
      "- skew above 35° at abutment B; HLP400 placed by the platform's rule, not the two-marked-lanes position."]
os.makedirs(os.path.join(H, "model"), exist_ok=True)
open(os.path.join(H, "model", "COMPARISON_REPORT_CONTINUOUS.md" if CONT else "COMPARISON_REPORT.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L))
