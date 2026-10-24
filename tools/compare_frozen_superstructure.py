#!/usr/bin/env python3
"""Compare the P3 superstructure model with the dashboard's frozen superstructure (cross-implementation, V5).

    python3 tools/compare_frozen_superstructure.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.superstructure_vs_frozen.md

Frozen superstructure = the dashboard's Analysis-tab model (tests/model/fixtures/br13a_dashboard_selfweight.json) with the
substructure removed (piles, sill beams, soil springs, pile-toe constraints) and the girder bearing nodes supported by the
SAME bearing scheme as the P3 model (zero-length links in girder axes; fixed / free from the description). Both are solved
by the same Python solver, so differences come from the models, not from the solver.
"""
import argparse, json, math, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
from pdf2bim.model.solver import Model
from pdf2bim.model.builder import KFIX


def frozen_superstructure(fx, gfx, restraints, base):
    m = Model()
    keep = [e for e in fx["els"] if not (e["sec"].startswith("Pile") or e["sec"].startswith("SB"))]
    # keep only the connected component that holds the girders (substructure rigid offsets become loose pairs)
    adj = {}
    for e in keep:
        adj.setdefault(e["n1"], set()).add(e["n2"]); adj.setdefault(e["n2"], set()).add(e["n1"])
    start = next(e["n1"] for e in keep if e["sec"].startswith("G"))
    comp, st = set(), [start]
    while st:
        x = st.pop()
        if x not in comp:
            comp.add(x); st += list(adj[x])
    keep = [e for e in keep if e["n1"] in comp]
    used = {e["n1"] for e in keep} | {e["n2"] for e in keep}
    for n, x, y, z in fx["nodes"]:
        if n in used:
            m.node(n, x + base[0], y + base[1], z)
    for e in keep:
        m.beam(e["id"], e["n1"], e["n2"], e["E"], e["nu"], e["A"], e["Iy"], e["Iz"], e["J"], e["Asy"], e["Asz"], w=e["w"], role=e["sec"])
    weight = sum(e["w"] * np.linalg.norm(np.subtract(m.nodes[e["n2"]], m.nodes[e["n1"]])) for e in keep)
    brg = {}
    for i, l in enumerate(fx["links"]):
        sid = "A" if "AbutA" in l["group"] else "B"
        k = l["n2"]
        # girder = the frozen girder whose bearing point is this node
        g = min(gfx["girders"], key=lambda q: math.hypot(q["PA" if sid == "A" else "PB"][0] + base[0] - m.nodes[k][0], q["PA" if sid == "A" else "PB"][1] + base[1] - m.nodes[k][1]))
        t = np.subtract(g["PB"], g["PA"]); t = t / np.linalg.norm(t)
        rl, rt = restraints[(sid, f"G{g['k']}")]
        kx, ky = (KFIX if rl == "fixed" else 0.0), (KFIX if rt == "fixed" else 0.0)
        gn = 900000 + i
        m.node(gn, *m.nodes[k]); m.fix(gn, "111111")
        m.link(i + 1, gn, k, (kx, ky, KFIX, 0, 0, 0), axes=np.array([[t[0], t[1], 0], [-t[1], t[0], 0], [0, 0, 1.0]]))
        brg[f"{sid}-G{g['k']}"] = {"node": k, "ground": gn, "link": i + 1}
    return m, brg, weight


def bearing_reactions(m, res, brg):
    out = {}
    for bid, b in brg.items():
        f = m.end_forces_link(b["link"]) if hasattr(m, "end_forces_link") else None
        u = res["u"][b["node"]]
        out[bid] = None
    return out


def link_force(m, res, lid):
    """Force in the bearing link (link axes): k * (u2 - u1) with the ground node fixed -> vertical reaction = k_z * (-u_z)."""
    l = m.links[lid]
    du = res["u"][l["n2"]] - res["u"][l["n1"]]
    R = l["R"] if l["R"] is not None else np.eye(3)
    d_loc = R @ du[:3]
    return -(l["k"][:3] * d_loc)  # force the bearing exerts on the girder, link axes (along, across, up)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.builder import build_superstructure
    from pdf2bim.description import Reader
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_superstructure(doc, geo, S, allow_proposed=a.allow_proposed)
    rp = M["model"].solve()
    fx = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
    gfx = json.load(open(os.path.join(ROOT, "tests/geometry/fixtures/br13a_dashboard_geometry.json")))
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"])
    restraints = {(b["support"], b["girder"]): (b["longitudinal"], b["transverse"]) for b in M["bearings"].values()}
    fm, fb, fweight = frozen_superstructure(fx, gfx, restraints, (base["E"], base["N"]))
    rf = fm.solve()
    rows = []
    for bid, b in sorted(M["bearings"].items()):
        key = f"{b['support']}-{b['girder']}"
        lid = next(i for i, l in M["model"].links.items() if l["n2"] == b["node"])
        Rp = link_force(M["model"], rp, lid)[2]
        Rf = link_force(fm, rf, fb[key]["link"])[2]
        rows.append((key, Rp, Rf))
    P = {"weight": -rp["applied"][2], "frozen_weight": -rf["applied"][2], "rows": rows}
    # midspan deflection per girder: node nearest the chord midpoint
    defl = []
    for g in geo["girders"]:
        mid = ((g["bearing_A"]["E"] + g["bearing_B"]["E"]) / 2, (g["bearing_A"]["N"] + g["bearing_B"]["N"]) / 2)
        k = min((k for k, v in M["nodes"].items() if v["role"] == "girder" and v["line"] == g["id"]), key=lambda k: math.hypot(M["nodes"][k]["E"] - mid[0], M["nodes"][k]["N"] - mid[1]))
        gf = gfx["girders"][int(g["id"][1:]) - 1]
        mf = ((gf["PA"][0] + gf["PB"][0]) / 2 + base["E"], (gf["PA"][1] + gf["PB"][1]) / 2 + base["N"])
        kf = min((n for n in fm.nodes if n < 900000), key=lambda n: math.hypot(fm.nodes[n][0] - mf[0], fm.nodes[n][1] - mf[1]))
        defl.append((g["id"], rp["u"][k][2], rf["u"][kf][2]))
    L = ["# BR13A superstructure: P3 model vs the dashboard's frozen superstructure (self weight)", "",
         "Both models are solved by the same Python solver, with the same bearing scheme (A fixed along / across the girder, B free along, fixed across; vertical fixed).",
         "**Differences therefore come from the models themselves.** This is a cross-implementation comparison (V5), not a benchmark.", "",
         f"- P3 model: {len(M['nodes'])} nodes, {len(M['members'])} members. Status: {'PROVISIONAL (proposed inputs)' if M['provisional'] or S['provisional'] or geo['provisional'] else 'accepted inputs'}.",
         f"- Total self weight: P3 {P['weight']:.1f} kN; frozen {P['frozen_weight']:.1f} kN ({100 * (P['weight'] / P['frozen_weight'] - 1):+.2f} %).",
         f"- Equilibrium residual: P3 {np.abs(rp['equilibrium_residual']).max():.2e} kN; frozen {np.abs(rf['equilibrium_residual']).max():.2e} kN.", "",
         "| Bearing | P3 Rz (kN) | Frozen Rz (kN) | Δ |", "|---|---|---|---|"]
    for key, a1, b1 in rows:
        L.append(f"| {key} | {a1:.1f} | {b1:.1f} | {100 * (a1 / b1 - 1):+.1f} % |")
    sA = sum(r[1] for r in rows if r[0].startswith("A")); sB = sum(r[1] for r in rows if r[0].startswith("B"))
    fA = sum(r[2] for r in rows if r[0].startswith("A")); fB = sum(r[2] for r in rows if r[0].startswith("B"))
    L += [f"| Sum A | {sA:.1f} | {fA:.1f} | {100 * (sA / fA - 1):+.1f} % |", f"| Sum B | {sB:.1f} | {fB:.1f} | {100 * (sB / fB - 1):+.1f} % |", "",
          "| Girder | P3 midspan uz (mm) | Frozen midspan uz (mm) |", "|---|---|---|"]
    for gid, a1, b1 in defl:
        L.append(f"| {gid} | {a1 * 1000:.2f} | {b1 * 1000:.2f} |")
    L += ["", "**Known model differences (by design):**",
          "- P3 girders are straight chords; the frozen girders follow the curve (up to 265 mm apart at midspan).",
          "- P3 girder sections vary along the girder with the flare (P2); the frozen model uses one section per girder.",
          "- P3 solid end blocks are 2.0 m from each girder end (D-38, proposed), on nodes; the frozen ones are quantised to the mesh.",
          "- P3 bearing centres are on the straight support line; the frozen ones are up to 26 mm off it (F-4).",
          "- Deck-strip tributary at the first / last station: P3 uses a half-step. The per-element tributary to the skewed end (Stage A) is not yet implemented."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump({"weight": P["weight"], "frozen_weight": P["frozen_weight"], "reactions": rows, "deflection": defl}, open(a.out.replace(".md", ".json"), "w"), indent=1)
    print("\n".join(L[5:]))


if __name__ == "__main__":
    main()
