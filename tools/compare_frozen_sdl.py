#!/usr/bin/env python3
"""Compare the P3b SDL case with the dashboard's SDL case (cross-implementation, V5).

    python3 tools/compare_frozen_sdl.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.sdl_vs_frozen.md

P3b: pdf2bim.model.loads.sdl_case on the P3b integrated model. Dashboard: rxSDL() nodal loads
(tests/model/fixtures/br13a_dashboard_sdl.json) on the frozen integrated model (tests/model/fixtures/br13a_dashboard_selfweight.json).
Both are solved by the same Python solver, without self weight. Differences come from the load discretisation and the models.
"""
import argparse, json, math, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT, "tools"))
from compare_frozen_integrated import frozen_model


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.loads import sdl_case
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    C = sdl_case(doc, geo, M, allow_proposed=a.allow_proposed)
    mp = M["model"]; rp = mp.solve(gravity=(0, 0, 0), loads=C["loads"])
    F = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
    FS = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_sdl.json")))
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"]); base = (base["E"], base["N"])
    mf = frozen_model(F, base)
    rf = mf.solve(gravity=(0, 0, 0), loads={l[0]: l[1:] for l in FS["loads"]})

    # isolation: the P3b load points distributed onto the frozen model's own deck nodes (the dashboard's SDL load nodes)
    import pdf2bim.model.loads as LM
    al = geo["_alignment"]
    fnodes = {}
    for l in FS["loads"]:
        ch, o = al.station(*mf.nodes[l[0]][:2], guess=geo["supports"][0]["ch"])
        fnodes[l[0]] = {"role": "girder", "ch": ch, "o": o}
    keep = LM.SNAP_MAX
    LM.SNAP_MAX = 0.5          # the frozen deck ends are quantised to its mesh (diagnostic only)
    Dz = LM.Distributor(fnodes)
    for q in C["point_loads"]:
        Dz.add(*q)
    lz = Dz.nodal()
    LM.SNAP_MAX = keep
    iso = {}
    mf.solve(gravity=(0, 0, 0), loads={k: (0, 0, v, 0, 0, 0) for k, v in lz.items()})
    for l in F["links"]:
        iso[l["id"]] = mf.link_force(l["id"])[1][2]
    rf = mf.solve(gravity=(0, 0, 0), loads={l[0]: l[1:] for l in FS["loads"]})
    rows = []
    for bid, b in sorted(M["bearings"].items()):
        gn = mp.nodes[b["girder_node"]]
        lf = min(F["links"], key=lambda l: math.hypot(mf.nodes[l["n2"]][0] - gn[0], mf.nodes[l["n2"]][1] - gn[1]))
        rows.append((bid, mp.link_force(b["link"])[1][2], mf.link_force(lf["id"])[1][2], iso[lf["id"]]))
    prow = []
    for sid, s in M["supports"].items():
        for p in s["piles"]:
            P = mp.nodes[p["toe"]]
            nf = min(rf["reactions"], key=lambda n: math.hypot(mf.nodes[n][0] - P[0], mf.nodes[n][1] - P[1]))
            prow.append((p["id"], rp["reactions"][p["toe"]][2], rf["reactions"][nf][2]))
    gfx = json.load(open(os.path.join(ROOT, "tests/geometry/fixtures/br13a_dashboard_geometry.json")))
    defl = []
    for g in geo["girders"]:
        mid = ((g["bearing_A"]["E"] + g["bearing_B"]["E"]) / 2, (g["bearing_A"]["N"] + g["bearing_B"]["N"]) / 2)
        k = min((k for k, v in M["nodes"].items() if v["role"] == "girder" and v.get("line") == g["id"]), key=lambda k: math.hypot(M["nodes"][k]["E"] - mid[0], M["nodes"][k]["N"] - mid[1]))
        gf = gfx["girders"][int(g["id"][1:]) - 1]
        mfp = ((gf["PA"][0] + gf["PB"][0]) / 2 + base[0], (gf["PA"][1] + gf["PB"][1]) / 2 + base[1])
        kf = min((n for n in mf.nodes if mf.nodes[n][2] > 128.5), key=lambda n: math.hypot(mf.nodes[n][0] - mfp[0], mf.nodes[n][1] - mfp[1]))
        defl.append((g["id"], rp["u"][k][2] * 1000, rf["u"][kf][2] * 1000))
    prov = sorted({str(p.get("decision")) for p in M["provisional"] + C["provisional"] if p.get("decision")})
    tags = {}
    for x in C["inputs"]:
        tags.setdefault(x["tag"], []).append(x["path"])
    L = ["# BR13A SDL (superimposed dead load): P3b vs the dashboard (unfactored)", "",
         "P3b: `sdl_case` on the P3b integrated model. Dashboard: its own SDL nodal loads (rxSDL) on the frozen integrated model.",
         "Both are solved by the same Python solver, without self weight. **Cross-implementation comparison (V5), not verification.**", "",
         f"- Status: **PROVISIONAL** (model inputs {', '.join(prov)}). Load inputs by tag: " + "; ".join(f"{t}: {', '.join(v)}" for t, v in sorted(tags.items(), key=lambda q: str(q[0]))) + ".",
         f"- Not applied: {', '.join(n['path'] + ' (' + str(n['tag']) + ')' for n in C['not_applied']) or 'none'}.",
         f"- Discretisation: {C['points']} load points (cells {C['settings']['dc_m']} × {C['settings']['do_m']} m, clipped at the skewed deck ends); "
         f"{C['snapped_points']} point(s) moved onto the node hull by at most {C['snap_max_m'] * 1000:.2f} mm.",
         f"- Equilibrium residual: P3b {np.abs(rp['equilibrium_residual']).max():.1e} kN; frozen {np.abs(rf['equilibrium_residual']).max():.1e} kN.", "",
         "## Totals (kN, downward)", "", "| Component | P3b | Basis |", "|---|---|---|"]
    for c in C["components"]:
        if c["kind"] == "area":
            L.append(f"| {c['name']} | {-c['total_kN']:.1f} | {c['pressure_kPa']:.3f} kPa × {c['plan_area_m2']:.2f} m² (offsets {c['from_offset']} … {c['to_offset']} m) |")
        else:
            L.append(f"| {c['name']} | {-c['total_kN']:.1f} | {c['w_kN_per_m']} kN/m × {c['length_m']:.3f} m (offset {c['offset']} m) |")
    L += [f"| **total** | **{-C['total_kN']:.1f}** | dashboard: **{FS['total']:.1f}** ({100 * (-C['total_kN'] / FS['total'] - 1):+.2f} %) |", "",
          "## Bearing reactions (kN, upward on the girder)", "",
          "Isolation column: the P3b load points placed on the FROZEN model's deck nodes (same triangulation method) and solved on the frozen model, "
          f"so it differs from the dashboard column only by the load discretisation / distribution ({Dz.snapped} points moved ≤ {Dz.snap_max * 1000:.0f} mm onto its mesh-quantised deck ends).", "",
          "| Bearing | P3b model + P3b loads | Frozen + dashboard loads | Δ | Frozen + P3b loads (isolation) | Δ distribution only |", "|---|---|---|---|---|---|"]
    for bid, x, y, z in rows:
        L.append(f"| {bid} | {x:.1f} | {y:.1f} | {100 * (x / y - 1):+.1f} % | {z:.1f} | {100 * (z / y - 1):+.1f} % |")
    L += ["", "## Pile toe reactions (kN)", "", "| Pile | P3b | Dashboard (frozen) | Δ |", "|---|---|---|---|"]
    for pid, x, y in prow:
        L.append(f"| {pid} | {x:.1f} | {y:.1f} | {100 * (x / y - 1):+.1f} % |")
    L += ["", "## Girder midspan deflection (mm)", "", "| Girder | P3b | Dashboard (frozen) |", "|---|---|---|"]
    for gid, x, y in defl:
        L.append(f"| {gid} | {x:.2f} | {y:.2f} |")
    L += ["", "## Known differences",
          "- Dashboard: point loads on a 0.2 × 0.1 m grid kept only where the cell centre is inside the deck (partial cells at the skewed ends are dropped); barrier pieces of 0.2 m chainage. P3b: cells clipped exactly at the end lines; barrier pieces measured along the offset curve.",
          "- Distribution: dashboard trW() transverse weights; P3b barycentric weights on a triangulation of the deck nodes (exact force and first moments).",
          "- Models: as `BR13A.integrated_vs_frozen.md` (straight chords, sections, bearing links)."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump({"isolation_snapped": Dz.snapped, "total": -C["total_kN"], "dashboard_total": FS["total"], "bearings": rows, "piles": prow, "deflection": defl,
               "components": [{k: v for k, v in c.items() if k != "inputs"} for c in C["components"]]},
              open(a.out.replace(".md", ".json"), "w"), indent=1, default=float)
    print("\n".join(L[5:]))


if __name__ == "__main__":
    main()
