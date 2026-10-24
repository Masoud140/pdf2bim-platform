#!/usr/bin/env python3
"""Imposed-strain cases (TU+, TU-, TGP, TGN, SCR): P3c vs the dashboard (cross-implementation, V5).

    python3 tools/compare_frozen_thermal.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.thermal_vs_frozen.md

Isolation: the P3c imposition (superstructure found by connectivity, imposed free strain / curvature) applied to the
dashboard's FROZEN model, with the dashboard's own free strain / curvature for the gradient, must reproduce the dashboard
exactly; then the P3c case on the P3b model (own sections, own model).
"""
import argparse, json, math, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT, "tools"))
from compare_frozen_traffic import frozen_mdl

DASH_ID = {"TU+": "TU+", "TU-": "TU−", "TGP": "TGP", "TGN": "TGN", "SCR": "SCR"}


def link_local(m, lid):
    """(v, tr, lon) as the dashboard reports them: v = f[0] (compression +), tr = -f[1], lon = -f[2] (local end-1 forces)."""
    L, R, T, Kl, fl, dofs = m._el[("link", lid)]
    f = Kl @ (T @ m._u[dofs])
    return f[0], -f[1], -f[2]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.thermal import thermal_cases, superstructure_beams
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    C = thermal_cases(doc, geo, S, M, allow_proposed=a.allow_proposed)
    F = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
    FS = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_sdl.json")))
    D = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_thermal.json")))
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"]); base = (base["E"], base["N"])
    fm = frozen_mdl(F, FS, geo, base); m = fm["model"]
    sup = superstructure_beams(fm)
    T = C["inputs"]["temperature"]; eps = C["inputs"]["shrinkage_strain"]
    iso, out = {}, {"isolation": {}, "p3b": {}, "dashboard": {}, "free": {}}
    # isolation on the frozen model
    for cid in ("TU+", "TU-", "SCR", "TGP", "TGN"):
        imp = {}
        for e in sup:
            b = m.beams[e]; L = float(np.linalg.norm(m.nodes[b["n2"]] - m.nodes[b["n1"]])); u = np.zeros(12)
            if cid in ("TU+", "TU-"):
                u[6] = T["alpha"] * ((T["T_max"] if cid == "TU+" else T["T_min"]) - T["T_set"]) * L
            elif cid == "SCR":
                u[6] = -eps * L
            else:
                if b.get("role", "").find("composite") < 0:
                    continue
                fr = D["free"]["pos" if cid == "TGP" else "neg"]
                u[6] = fr["e0"] * L; u[8] = -fr["phi"] * L * L / 2; u[10] = fr["phi"] * L
            imp[e] = u
        m.solve(gravity=(0, 0, 0), loads={}, imposed=imp)
        dd = D["cases"][DASH_ID[cid]]["brg"]
        rows = []
        for q in dd:
            v, tr, lon = link_local(m, int(q["id"][1:]))
            rows.append((q["id"], q["ab"], (q["v"], q["tr"], q["lon"]), (v, tr, lon)))
        out["isolation"][cid] = rows
    # P3c on the P3b model: vertical and plan-horizontal resultant per bearing, vs the dashboard (matched by plan position)
    for cid, c in C["cases"].items():
        M["model"].solve(gravity=(0, 0, 0), loads={}, imposed=c["imposed"])
        dd = D["cases"][DASH_ID[cid]]["brg"]
        rows = []
        for bid, b in sorted(M["bearings"].items()):
            g = M["model"].link_force(b["link"])[1]
            gn = M["model"].nodes[b["girder_node"]]
            q = min(dd, key=lambda q: math.hypot(q["n2"][0] + base[0] - gn[0], q["n2"][1] + base[1] - gn[1]))
            rows.append((bid, g[2], math.hypot(g[0], g[1]), q["v"], math.hypot(q["tr"], q["lon"])))
        out["p3b"][cid] = rows
    mid = {}
    for cid in ("TGP", "TGN"):
        fr = C["cases"][cid]["free"]
        gm = [x for x in M["members"] if x["role"] == "girder" and x["line"] == "G1"]
        e = gm[len(gm) // 2]["id"]
        mid[cid] = (fr[e]["e0"], fr[e]["phi"], D["free"]["pos" if cid == "TGP" else "neg"]["e0"], D["free"]["pos" if cid == "TGP" else "neg"]["phi"])
    out["free"] = mid
    prov = sorted({str(p.get("decision")) for p in C["provisional"] if p.get("decision")})
    L = ["# BR13A imposed-strain cases (uniform temperature, gradient, shrinkage + creep): P3c vs the dashboard", "",
         "Characteristic, unfactored. **Cross-implementation comparison (V5), not verification.** Inputs (BR13A, Assumed): "
         f"T_max {T['T_max']}, T_min {T['T_min']}, T_set {T['T_set']} °C, α {T['alpha']}, shrinkage + creep {eps * 1e6:.0f}e-6, gradient profiles as in the description "
         f"(= the dashboard's assumed profiles). Status: PROVISIONAL ({', '.join(prov)}).", "",
         "## Isolation: the P3c imposition on the dashboard's frozen model (dashboard free strain / curvature for the gradient)", "",
         "| Case | largest bearing-force difference vs the dashboard (kN) | largest dashboard bearing force (kN) |", "|---|---|---|"]
    for cid, rows in out["isolation"].items():
        dmax = max(max(abs(x - y) for x, y in zip(r[2], r[3])) for r in rows)
        fmax = max(max(abs(x) for x in r[2]) for r in rows)
        L.append(f"| {cid} | {dmax:.2e} | {fmax:.1f} |")
    L += ["", "## Free strain and curvature of the composite section, G1 midspan (gradient)", "",
          "| Case | P3c e0 | Dashboard e0 | P3c φ (1/m) | Dashboard φ (1/m) |", "|---|---|---|---|---|"]
    for cid, (e0, ph, de0, dph) in mid.items():
        L.append(f"| {cid} | {e0:.3e} | {de0:.3e} ({100 * (e0 / de0 - 1):+.1f} %) | {ph:.3e} | {dph:.3e} ({100 * (ph / dph - 1):+.1f} %) |")
    L += ["", "The dashboard integrates over one design section (its design girder, its deck width) for every girder element; P3c uses each element's own "
          "section (P2: flared flanges, tributary deck width, solid ends).", "",
          "## P3c on the P3b model vs the dashboard (bearing forces: vertical; horizontal resultant in plan)", ""]
    for cid, rows in out["p3b"].items():
        L += [f"### {cid}", "", "| Bearing | P3c Rz | Dashboard v | P3c H | Dashboard H |", "|---|---|---|---|---|"]
        for bid, rz, h, dv, dh in rows:
            L.append(f"| {bid} | {rz:.1f} | {dv:.1f} | {h:.1f} | {dh:.1f} |")
        L.append("")
    L += ["Differences on the P3b model come from the models (`BR13A.integrated_vs_frozen.md`): the fixed bearings at A restrain the "
          "deck's expansion / shortening, so the horizontal forces depend on the bearing-link idealisation, the pile and sill stiffness and the "
          "bearing positions; the vertical forces from the girder geometry and sections."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=float)
    print("\n".join(L[4:]))


if __name__ == "__main__":
    main()
