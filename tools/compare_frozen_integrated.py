#!/usr/bin/env python3
"""Compare the P3b integrated model with the dashboard's frozen integrated model (cross-implementation, V5), self weight.

    python3 tools/compare_frozen_integrated.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.integrated_vs_frozen.md

Frozen = the dashboard's Analysis-tab model (tests/model/fixtures/br13a_dashboard_selfweight.json: superstructure, bearing
links, sill beams, rigid offsets, piles, rock / fill springs, pile toes held vertically), solved by the same Python solver
(equal to the dashboard to 7e-10, test_solver). Differences therefore come from the models. Also: pile-head lateral
stiffness of one pile column (rock springs only) against the Hetenyi hand value (V2 hand check).
"""
import argparse, json, math, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
from pdf2bim.model.solver import Model


def frozen_model(F, base):
    m = Model()
    for n, x, y, z in F["nodes"]:
        m.node(n, x + base[0], y + base[1], z)
    for e in F["els"]:
        m.beam(e["id"], e["n1"], e["n2"], e["E"], e["nu"], e["A"], e["Iy"], e["Iz"], e["J"], e["Asy"], e["Asz"], w=e["w"], role=e["sec"])
    for l in F["links"]:
        m.link(l["id"], l["n1"], l["n2"], l["k"], beta=l["beta"], dry=l["dry"], drz=l["drz"], group=l["group"])
    for s in F["spr"]:
        k = [0] * 6; k[s["k6"]] = s["k"]; m.spring(s["n"], k)
    fx = {}
    for d in F["fixed_dofs"]:
        fx.setdefault(F["ids"][d // 6], ["0"] * 6)[d % 6] = "1"
    for n, f in fx.items():
        m.fix(n, "".join(f))
    return m


def force_on_top(m, lid):
    """Global force the bearing link exerts on its upper node (n2)."""
    return m.link_force(lid)[1]


def weight_by(m, key):
    out = {}
    for e in m.beams.values():
        L = float(np.linalg.norm(m.nodes[e["n2"]] - m.nodes[e["n1"]]))
        k = key(e)
        out[k] = out.get(k, 0.0) + e["w"] * L
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated, pile_head_stiffness, hetenyi_head_stiffness
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    mp = M["model"]; rp = mp.solve()
    F = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
    gfx = json.load(open(os.path.join(ROOT, "tests/geometry/fixtures/br13a_dashboard_geometry.json")))
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"])
    base = (base["E"], base["N"])
    mf = frozen_model(F, base); rf = mf.solve(gravity=F["gravity"])

    # ---- weights ----
    sub_roles = {"sill": "sill", "pile": "piles"}
    wp = weight_by(mp, lambda e: sub_roles.get(e["role"], "superstructure"))
    wf = weight_by(mf, lambda e: "sill" if e["role"].startswith("SB") else ("piles" if e["role"].startswith("Pile") else "superstructure"))

    # ---- bearings: vertical reaction (compression +) and horizontal forces, matched by support and girder ----
    brows = []
    for bid, b in sorted(M["bearings"].items()):
        gP = force_on_top(mp, b["link"])
        gn = mp.nodes[b["girder_node"]]
        lf = min(F["links"], key=lambda l: math.hypot(mf.nodes[l["n2"]][0] - gn[0], mf.nodes[l["n2"]][1] - gn[1]))
        gF = force_on_top(mf, lf["id"])
        dist = math.hypot(mf.nodes[lf["n2"]][0] - gn[0], mf.nodes[lf["n2"]][1] - gn[1])
        t = np.array([b_["unit_t"] for b_ in [{"unit_t": next(g["unit_t"] for g in geo["girders"] if g["id"] == b["girder"])}]][0] + (0.0,))
        brows.append((bid, gP[2], gF[2], float(gP @ t), float(gF @ t), dist))

    # ---- piles: toe vertical reaction and head displacement, matched by plan position ----
    prows = []
    for sid, s in M["supports"].items():
        for p in s["piles"]:
            toeP = rp["reactions"][p["toe"]][2]
            P = mp.nodes[p["toe"]]
            toeF_n = min(rf["reactions"], key=lambda n: math.hypot(mf.nodes[n][0] - P[0], mf.nodes[n][1] - P[1]))
            dist = math.hypot(mf.nodes[toeF_n][0] - P[0], mf.nodes[toeF_n][1] - P[1])
            toeF = rf["reactions"][toeF_n][2]
            H = mp.nodes[p["head"]]
            headF = min((n for n in mf.nodes), key=lambda n: math.hypot(mf.nodes[n][0] - H[0], mf.nodes[n][1] - H[1]) + abs(mf.nodes[n][2] - H[2]))
            prows.append((p["id"], toeP, toeF, dist, rp["u"][p["head"]][:3] * 1000, rf["u"][headF][:3] * 1000))

    # ---- girder midspan deflection ----
    defl = []
    for g in geo["girders"]:
        mid = ((g["bearing_A"]["E"] + g["bearing_B"]["E"]) / 2, (g["bearing_A"]["N"] + g["bearing_B"]["N"]) / 2)
        k = min((k for k, v in M["nodes"].items() if v["role"] == "girder" and v.get("line") == g["id"]), key=lambda k: math.hypot(M["nodes"][k]["E"] - mid[0], M["nodes"][k]["N"] - mid[1]))
        gf = gfx["girders"][int(g["id"][1:]) - 1]
        mfp = ((gf["PA"][0] + gf["PB"][0]) / 2 + base[0], (gf["PA"][1] + gf["PB"][1]) / 2 + base[1])
        kf = min((n for n in mf.nodes if mf.nodes[n][2] > 128.5), key=lambda n: math.hypot(mf.nodes[n][0] - mfp[0], mf.nodes[n][1] - mfp[1]))
        defl.append((g["id"], rp["u"][k][2] * 1000, rf["u"][kf][2] * 1000))

    # ---- pile head stiffness (one pile alone) vs Hetenyi ----
    p0 = M["supports"]["A"]["piles"][0]
    pb = next(b for b in mp.beams.values() if b["role"] == "pile")
    EI = pb["E"] * pb["Iy"]
    k_rock = p0["rock_kh"] * 1000 * M["settings"]["soil_factor"] * p0["D"]
    Lc = p0["levels"][0] - p0["rock"]; Ls = p0["rock"] - p0["levels"][-1]
    hand, beta = hetenyi_head_stiffness(EI, k_rock, Lc)
    k_mod_rock = pile_head_stiffness(M, p0, include_soil=False)
    k_mod_all = pile_head_stiffness(M, p0, include_soil=True)

    prov = M["provisional"] or S["provisional"] or geo["provisional"]
    resid = np.abs(rp["equilibrium_residual"]).max()
    L = ["# BR13A integrated model: P3b vs the dashboard's frozen integrated model (self weight)", "",
         "Both models are solved by the same Python solver (equal to the dashboard solver to 7e-10, `tests/model/test_solver.py`).",
         "**Differences therefore come from the models themselves.** Cross-implementation comparison (V5), not a benchmark. Nothing here is independently verified.", "",
         f"- P3b model: {len(mp.nodes)} nodes, {len(mp.beams)} members, {len(mp.links)} bearing links, {len(mp.springs)} spring nodes. "
         f"Status: **{'PROVISIONAL (proposed inputs: ' + ', '.join(sorted({str(p.get('decision')) for p in M['provisional']})) + ')' if prov else 'accepted inputs'}**; standards: **{M['standards_status']}**.",
         f"- Frozen model: {len(mf.nodes)} nodes, {len(mf.beams)} members, {len(mf.links)} links.",
         f"- Equilibrium residual: P3b {resid:.1e} kN; frozen {np.abs(rf['equilibrium_residual']).max():.1e} kN.", "",
         "## Self weight (kN)", "", "| Part | P3b | Frozen | Δ |", "|---|---|---|---|"]
    for part in ("superstructure", "sill", "piles"):
        L.append(f"| {part} | {wp.get(part, 0):.1f} | {wf.get(part, 0):.1f} | {100 * (wp.get(part, 0) / wf[part] - 1):+.1f} % |")
    L.append(f"| total | {sum(wp.values()):.1f} | {sum(wf.values()):.1f} | {100 * (sum(wp.values()) / sum(wf.values()) - 1):+.1f} % |")
    L += ["", "## Bearings", "", "Vertical: upward force on the girder (compression in the bearing). Along: horizontal force on the girder along its chord, + in the direction A → B (both models projected on the same P1 chord).", "",
          "| Bearing | P3b Rz (kN) | Frozen Rz (kN) | Δ | P3b along (kN) | Frozen along (kN) | plan match (mm) |", "|---|---|---|---|---|---|---|"]
    for bid, a1, b1, h1, h2, dist in brows:
        L.append(f"| {bid} | {a1:.1f} | {b1:.1f} | {100 * (a1 / b1 - 1):+.1f} % | {h1:.1f} | {h2:.1f} | {dist * 1000:.0f} |")
    L += ["", "## Piles (self weight)", "", "| Pile | P3b toe Rz (kN) | Frozen toe Rz (kN) | Δ | P3b head ux, uy (mm) | Frozen head ux, uy (mm) | plan match (mm) |", "|---|---|---|---|---|---|---|"]
    for pid, a1, b1, dist, uP, uF in prows:
        L.append(f"| {pid} | {a1:.1f} | {b1:.1f} | {100 * (a1 / b1 - 1):+.1f} % | {uP[0]:.2f}, {uP[1]:.2f} | {uF[0]:.2f}, {uF[1]:.2f} | {dist * 1000:.0f} |")
    L += ["", "## Girder midspan deflection (mm)", "", "| Girder | P3b uz | Frozen uz |", "|---|---|---|"]
    for gid, a1, b1 in defl:
        L.append(f"| {gid} | {a1:.2f} | {b1:.2f} |")
    L += ["", "## Pile-head lateral stiffness, one pile alone (hand check, V2)", "",
          f"Pile {p0['id']}: column above rock Lc = {Lc:.2f} m, socket Ls = {Ls:.2f} m, EI = {EI:.4g} kN·m², k = kh·D = {k_rock:.4g} kN/m², β = {beta:.4f} /m, βLs = {beta * Ls:.2f}"
          + (" (< π: the socket is not 'long'; the semi-infinite hand value is a little stiff)" if beta * Ls < math.pi else "") + ".", "",
          "| Case | Stiffness (kN/m) |", "|---|---|",
          f"| Model, rock springs only | {k_mod_rock:.0f} |", f"| Hand (Hetényi semi-infinite socket + cantilever column) | {hand:.0f} |",
          f"| Model / hand | {k_mod_rock / hand:.3f} |", f"| Model, rock + fill springs (as modelled) | {k_mod_all:.0f} |", "",
          "## Geometry checks", "", "| Check | Model | Description | Δ (mm) | Status |", "|---|---|---|---|---|"]
    for c in M["checks"]:
        L.append(f"| {c['id']} | {c['model']:.1f} | {c['description']:.1f} | {c['diff_mm']:+.1f} | {'OK' if c['ok'] else 'FLAG'} |")
    L += ["", "## Known model differences (by design)",
          "- Superstructure as in P3a (straight chords, varying sections, 2.0 m solid ends D-38, bearing centres on the support line): see `BR13A.superstructure_vs_frozen.md`.",
          "- Bearing seats at the Direct mortar-pad RLs (D-41); bearing tops at the girder soffit; short links (100–127 mm). The frozen links run from the sill top to the girder node line (≈ 1.78 m).",
          "- Sill centroid on its plan setout (D-39: 15 / 26 mm behind the line of bearings at A / B); soffit = straight line through the pile-head RLs. The frozen sill runs on the bearing line.",
          "- Bearing fixed stiffness from analysis.bearing_fixed_stiffness (1e7 kN/m), as the frozen model.",
          f"- Not modelled in either: {', '.join(M['not_modelled'])}."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump({"weight": wp, "frozen_weight": wf, "bearings": brows, "piles": [(p[0], p[1], p[2]) for p in prows], "deflection": defl,
               "pile_head": {"model_rock": k_mod_rock, "hand": hand, "model_all": k_mod_all, "beta": beta, "Lc": Lc, "Ls": Ls},
               "checks": M["checks"], "standards": M["standards_used"], "provisional": [p.get("decision") for p in M["provisional"]]},
              open(a.out.replace(".md", ".json"), "w"), indent=1, default=float)
    print("\n".join(L[5:]))


if __name__ == "__main__":
    main()
