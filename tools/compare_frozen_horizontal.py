#!/usr/bin/env python3
"""Horizontal load cases (EP, EPTA, EPTB, BRKp, BRKm, CEN): P3c vs the dashboard (cross-implementation, V5).

    python3 tools/compare_frozen_horizontal.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.horizontal_vs_frozen.md

Columns: load totals (P3c vs dashboard), the P3c case also run with the dashboard's retained height (isolates the
retained-height difference), pile moments and bearing horizontal forces on the two models.
"""
import argparse, copy, json, math, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.horizontal import horizontal_cases
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    Hc = horizontal_cases(doc, geo, M, Standards(), allow_proposed=a.allow_proposed)
    D = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_horizontal.json")))
    d2 = copy.deepcopy(doc)
    for s in d2["supports"]:
        s["backfill"]["rows"][0]["cells"]["retained_height"] = D["geom"][s["id"]]["H"]
    Hd = horizontal_cases(d2, geo, M, Standards(), allow_proposed=a.allow_proposed)
    m = M["model"]
    out = {"totals": {}, "piles": {}, "bearings": {}, "H": {k: (Hc["geometry"][k]["H"], D["geom"][k]["H"]) for k in Hc["geometry"]}}
    L = ["# BR13A horizontal load cases: P3c vs the dashboard (characteristic)", "",
         "Earth pressure (K0, γ 20, φ 30°, Assumed), traffic surcharge 10 kPa (Assumed), braking 500 kN (Assumed), centrifugal W V²/(g R) "
         f"(W = M1600 1440 kN from the unverified standards entry, V 60 km/h Assumed, R = {Hc['cases']['CEN']['R']:.0f} m). **V5 comparison, not verification.**", "",
         "## Retained height", "", "| Support | P3c (Calculated: road level at the setout point − sill soffit) | Dashboard (sill depth + 0.15 bearing zone + girder + deck + surfacing) |", "|---|---|---|"]
    for k, (hp, hd) in out["H"].items():
        L.append(f"| {k} | {hp:.3f} m | {hd:.3f} m ({100 * (hp / hd - 1):+.1f} %) |")
    L += ["", "## Load totals (kN, global X, Y)", "", "| Case | P3c | P3c with the dashboard's H | Dashboard |", "|---|---|---|---|"]
    for cid, c in Hc["cases"].items():
        tp = sum((np.asarray(f) for f in c["loads"].values()), np.zeros(6))[:2]
        tdh = sum((np.asarray(f) for f in Hd["cases"][cid]["loads"].values()), np.zeros(6))[:2]
        td = D["cases"][cid]["tot"][:2]
        out["totals"][cid] = (tp.tolist(), tdh.tolist(), td)
        L.append(f"| {cid} | {tp[0]:.1f}, {tp[1]:.1f} | {tdh[0]:.1f}, {tdh[1]:.1f} | {td[0]:.1f}, {td[1]:.1f} |")
    L += ["", "## Pile maximum moment (kN·m) and bearing horizontal forces (kN)", ""]
    for cid, c in Hc["cases"].items():
        m.solve(gravity=(0, 0, 0), loads=c["loads"])
        pm = {}
        for sid, s in M["supports"].items():
            for p in s["piles"]:
                ch = set(p["chain"]); mx = 0.0
                for eid, b in m.beams.items():
                    if b["n1"] in ch and b["n2"] in ch:
                        f = m.end_forces(eid)
                        mx = max(mx, math.hypot(f[4], f[5]), math.hypot(f[10], f[11]))
                pm[p["id"]] = mx
        dp = {q["id"]: q["M"] for q in D["cases"][cid]["piles"]}
        br = {bid: float(np.hypot(*m.link_force(b["link"])[1][:2])) for bid, b in sorted(M["bearings"].items())}
        out["piles"][cid] = {k: (pm[k], dp.get(k)) for k in pm}
        L += [f"### {cid}", "", "| Pile | P3c M | Dashboard M |", "|---|---|---|"]
        for k in pm:
            L.append(f"| {k} | {pm[k]:.0f} | {dp.get(k, float('nan')):.0f} |")
        hb = sum(br.values())
        hd = sum(math.hypot(q["tr"], q["lon"]) for q in D["cases"][cid]["brg"])
        out["bearings"][cid] = (hb, hd)
        L += ["", f"Sum of bearing horizontal forces: P3c {hb:.1f} kN, dashboard {hd:.1f} kN.", ""]
    L += ["Differences: the retained height (above) for EP / EPT; for all cases the models (`BR13A.integrated_vs_frozen.md`, M-2: the P3b "
          "model is stiffer horizontally, so the split between the bearings / sills and the piles differs)."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=float)
    print("\n".join(L[4:40]))


if __name__ == "__main__":
    main()
