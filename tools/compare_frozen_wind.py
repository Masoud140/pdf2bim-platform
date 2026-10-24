#!/usr/bin/env python3
"""Wind cases: P3c vs the dashboard (cross-implementation, V5).

    python3 tools/compare_frozen_wind.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.wind_vs_frozen.md
"""
import argparse, json, math, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT, "tools"))
from compare_frozen_integrated import frozen_model

DMAP = {"WT+": "WT+", "WT-": "WT−", "WTV+": "WTV+", "WTV-": "WTV−", "WVU+": "WVU+", "WVU-": "WVU−", "WVD+": "WVD+", "WVD-": "WVD−", "WL+": "WL+", "WL-": "WL−"}


def resultant(L, nodes):
    F = sum((np.asarray(f) for f in L.values()), np.zeros(6))
    o = sum(np.asarray(f)[2] * nodes[k]["o"] for k, f in L.items()) / F[2] if abs(F[2]) > 1e-9 else None
    return F, o


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.wind import wind_cases
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    W = wind_cases(doc, geo, S, M, allow_proposed=a.allow_proposed)
    D = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_wind.json")))
    F = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"]); base = (base["E"], base["N"])
    fm = frozen_model(F, base)
    al = geo["_alignment"]
    out = {"totals": {}, "vertical_resultant": {}, "response": {}}
    v = W["values"]
    L = ["# BR13A wind: P3c vs the dashboard (characteristic, V_uls)", "",
         f"q = {v['q_kPa']:.3f} kPa; exposed depth {v['exposed_depth']:.3f} m; wT {v['wT']:.3f}, wV {v['wV']:.3f}, wL {v['wL']:.3f} kN/m (inputs Assumed / Standard-verify). "
         "**V5 comparison, not verification.**", "",
         f"- Levers above the model node level (girder top): superstructure {v['lever_super']:+.3f} m, vehicles {v['lever_vehicle']:.3f} m. "
         f"The dashboard uses {D['eSup']:+.3f} / {D['eVeh']:.3f} m measured from the deck top although its nodes are at the girder top (**H-6**: its wind levers are 0.2 m low).",
         "- Vertical wind: P3c shares the resultant over the girder lines about their length-weighted centroid (exact total and position). "
         "The dashboard measures from the deck centre and ignores the line lengths (**H-7**): its total uplift differs by ±0.9 % between the two wind directions.", "",
         "## Load totals (kN; X, Y, Z) and vertical resultant position", "", "| Case | P3c | Dashboard | vertical resultant offset P3c / dashboard (m) |", "|---|---|---|---|"]
    fnodes = {}
    for cid, c in W["cases"].items():
        Fp, op = resultant(c["loads"], M["nodes"])
        Ld = {l[0]: l[1:] for l in D["cases"][DMAP[cid]]}
        Fd = sum((np.asarray(f) for f in Ld.values()), np.zeros(6))
        od = None
        if abs(Fd[2]) > 1e-9:
            for k in Ld:
                if k not in fnodes:
                    fnodes[k] = al.station(*fm.nodes[k][:2], guess=geo["supports"][0]["ch"])[1]
            od = sum(Ld[k][2] * fnodes[k] for k in Ld) / Fd[2]
        out["totals"][cid] = (Fp[:3].tolist(), Fd[:3].tolist()); out["vertical_resultant"][cid] = (op, od)
        L.append(f"| {cid} | {Fp[0]:.2f}, {Fp[1]:.2f}, {Fp[2]:.2f} | {Fd[0]:.2f}, {Fd[1]:.2f}, {Fd[2]:.2f} | " + (f"{op:.3f} / {od:.3f}" if op is not None else "—") + " |")
    L += ["", f"Target vertical resultant offsets: deck centre {(geo['deck']['edge_left_offset'] + geo['deck']['edge_right_offset']) / 2:.3f} ± 0.25 b.", "",
          "## Responses: sum of bearing vertical forces and largest pile moment", "", "| Case | P3c ΣRz / max pile M | Dashboard loads on the frozen model ΣRz / max pile M |", "|---|---|---|"]
    piles_f = [n for n in fm.nodes]
    for cid, c in W["cases"].items():
        M["model"].solve(gravity=(0, 0, 0), loads=c["loads"])
        rz = sum(M["model"].link_force(b["link"])[1][2] for b in M["bearings"].values())
        pm = max(max(math.hypot(*M["model"].end_forces(e)[4:6]), math.hypot(*M["model"].end_forces(e)[10:12])) for e, b in M["model"].beams.items() if b.get("role") == "pile")
        fm.solve(gravity=(0, 0, 0), loads={l[0]: l[1:] for l in D["cases"][DMAP[cid]]})
        rzf = sum(fm.link_force(l["id"])[1][2] for l in F["links"])
        pmf = max(max(math.hypot(*fm.end_forces(e)[4:6]), math.hypot(*fm.end_forces(e)[10:12])) for e, b in fm.beams.items() if b.get("role", "").startswith("Pile"))
        out["response"][cid] = (rz, pm, rzf, pmf)
        L.append(f"| {cid} | {rz:.1f} / {pm:.1f} | {rzf:.1f} / {pmf:.1f} |")
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=float)
    print("\n".join(L[3:]))


if __name__ == "__main__":
    main()
