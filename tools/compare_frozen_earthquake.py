#!/usr/bin/env python3
"""Earthquake RSA: P3c vs the dashboard (cross-implementation, V5).

    python3 tools/compare_frozen_earthquake.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.earthquake_vs_frozen.md

1. Engine check: the P3c RSA run on the dashboard's FROZEN model with the dashboard's own mass (every member weighted,
   finding H-3, + its lumped SDL masses) must reproduce the dashboard's eqRun.
2. P3c on the P3b model with the P3c mass (static self weight + SDL case): the platform result.
3. The effect of H-3 alone: the P3c RSA on the frozen model with the P3c mass rule.
"""
import argparse, json, math, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT, "tools"))
from compare_frozen_integrated import frozen_model
from compare_frozen_traffic import frozen_mdl


def frozen_supports(F, fm):
    """Sill nodes and pile chains of the frozen model, with the dashboard's pile ids (toe-constraint order)."""
    m = fm["model"]
    sb = [e for e in F["els"] if e["sec"].startswith("SB")]
    adj = {}
    for e in sb:
        adj.setdefault(e["n1"], set()).add(e["n2"]); adj.setdefault(e["n2"], set()).add(e["n1"])
    groups, seen = [], set()
    for n in adj:
        if n in seen:
            continue
        st, g = [n], []
        while st:
            x = st.pop()
            if x in seen:
                continue
            seen.add(x); g.append(x); st += list(adj[x])
        groups.append(g)
    brgA = [fm["bearings"][k]["girder_node"] for k in fm["bearings"] if k.startswith("A")]
    cA = np.mean([m.nodes[n][:2] for n in brgA], axis=0)
    sup = {}
    for g in groups:
        c = np.mean([m.nodes[n][:2] for n in g], axis=0)
        sup["A" if np.linalg.norm(c - cA) < 10 else "B"] = {"sill_nodes": g, "piles": []}
    pe = [e for e in F["els"] if e["sec"].startswith("Pile")]
    padj = {}
    for e in pe:
        padj.setdefault(e["n1"], set()).add(e["n2"]); padj.setdefault(e["n2"], set()).add(e["n1"])
    toes = [F["ids"][d // 6] for d in F["fixed_dofs"]]
    cnt = {"A": 0, "B": 0}
    for toe in toes:
        chain, cur, prev = [toe], toe, None
        while True:
            nxt = [x for x in padj.get(cur, ()) if x != prev and x not in chain]
            if not nxt:
                break
            prev, cur = cur, nxt[0]; chain.append(cur)
        ab = "A" if np.linalg.norm(m.nodes[toe][:2] - cA) < 10 else "B"
        cnt[ab] += 1
        sup[ab]["piles"].append({"id": f"{ab}{cnt[ab]}", "chain": chain[::-1], "head": chain[-1], "toe": toe})
    return sup


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.loads import sdl_case
    from pdf2bim.model.earthquake import earthquake_rsa, summary
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    C = sdl_case(doc, geo, M, allow_proposed=a.allow_proposed)
    F = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
    FS = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_sdl.json")))
    D = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_earthquake.json")))
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"]); base = (base["E"], base["N"])
    # frozen model with the dashboard's mass rule (H-3)
    F3 = json.loads(json.dumps(F))
    for e in F3["els"]:
        if e["sec"].startswith("TD") or e["sec"].startswith("DUM"):
            e["w"] = 25.5 * e["A"]
    fm3 = frozen_mdl(F3, FS, geo, base); fm3["supports"] = frozen_supports(F3, fm3)
    Qd = earthquake_rsa(doc, geo, fm3, Standards(), allow_proposed=a.allow_proposed, extra_mass={k: v for k, v in D["sdl_mass"]})
    # frozen model with the P3c mass rule (static weight + the dashboard's SDL nodal loads)
    fm = frozen_mdl(F, FS, geo, base); fm["supports"] = frozen_supports(F, fm)
    Qf = earthquake_rsa(doc, geo, fm, Standards(), sdl_loads={l[0]: l[1:] for l in FS["loads"]}, allow_proposed=a.allow_proposed)
    Qp = earthquake_rsa(doc, geo, M, Standards(), sdl_loads=C["loads"], allow_proposed=a.allow_proposed)
    fm3["model"].base = base

    def dash_brg(R_):
        out = {}
        for x in R_["brg"]:
            P = np.array(x["n2"][:2]) + base
            k = min(fm3["bearings"], key=lambda q: np.linalg.norm(fm3["model"].nodes[fm3["bearings"][q]["girder_node"]][:2] - P))
            out[k] = x
        return out
    out = {"periods": {"dash": [m_["T"] for m_ in D["modes"][:6]], "replica": Qd["periods"][:6], "frozen_p3c_mass": Qf["periods"][:6], "p3b": Qp["periods"][:6]},
           "engine": {}, "p3b": {}}
    L = ["# BR13A earthquake RSA: P3c vs the dashboard (characteristic)", "",
         f"kp {Qp['inputs']['kp']}, Z {Qp['inputs']['Z']}, site {Qp['inputs']['site_class']}, Rf {Qp['inputs']['Rf']}, ζ {Qp['inputs']['zeta']} (Assumed / Standard-verify); "
         f"{Qp['inputs']['modes']} modes, CQC + missing mass, 100 / 30 %. Ch(T) and kp from code-extracted-UNVERIFIED standards entries. **V5 comparison, not verification.**", "",
         "## Periods (s), first 6 modes", "", "| Mode | Dashboard | P3c, frozen model, dashboard mass (engine check) | P3c, frozen model, P3c mass (H-3 removed) | P3c, P3b model |", "|---|---|---|---|---|"]
    for i in range(6):
        L.append(f"| {i + 1} | {out['periods']['dash'][i]:.4f} | {out['periods']['replica'][i]:.4f} | {out['periods']['frozen_p3c_mass'][i]:.4f} | {out['periods']['p3b'][i]:.4f} |")
    L += ["", "## Engine check: dashboard eqRun vs the P3c RSA on the same model and mass", "", "| Response | Dir | Largest |Δ| | Largest value |", "|---|---|---|---|"]
    for dn in ("L", "T"):
        dsum = D["resp"][dn]; ps = summary(Qd, Qd["resp"][dn]["R"])
        db = dash_brg(dsum)
        dmax_b = max(abs(ps["bearings"][k][c] - db[k][c]) for k in db for c in ("v", "tr", "lon"))
        vmax_b = max(abs(db[k][c]) for k in db for c in ("v", "tr", "lon"))
        dp = {x["id"]: x["M"] for x in dsum["piles"]}
        dmax_p = max(abs(ps["piles"][k]["M"] - dp[k]) for k in dp); vmax_p = max(dp.values())
        out["engine"][dn] = {"bearing_max_diff": dmax_b, "bearing_max": vmax_b, "pile_M_max_diff": dmax_p, "pile_M_max": vmax_p,
                             "meff": (Qd["resp"][dn]["effective_mass_fraction"], dsum["meff"])}
        L.append(f"| bearing forces (link axes) | {dn} | {dmax_b:.2e} kN | {vmax_b:.1f} kN |")
        L.append(f"| pile max moment | {dn} | {dmax_p:.2e} kN·m | {vmax_p:.1f} kN·m |")
    L += ["", "## Platform result (P3b model, P3c mass) vs the dashboard: pile max moment (kN·m)", "",
          "| Pile | EQ-L P3c | EQ-L dashboard | EQ-T P3c | EQ-T dashboard |", "|---|---|---|---|---|"]
    psL, psT = summary(Qp, Qp["combos"]["EQ-L"]), summary(Qp, Qp["combos"]["EQ-T"])
    dL = {x["id"]: x["M"] for x in D["combos"]["EQ-L"]["piles"]}; dT = {x["id"]: x["M"] for x in D["combos"]["EQ-T"]["piles"]}
    for k in sorted(psL["piles"]):
        L.append(f"| {k} | {psL['piles'][k]['M']:.0f} | {dL[k]:.0f} | {psT['piles'][k]['M']:.0f} | {dT[k]:.0f} |")
        out["p3b"][k] = (psL["piles"][k]["M"], dL[k], psT["piles"][k]["M"], dT[k])
    fL = summary(Qf, Qf["combos"]["EQ-L"])
    h3 = {k: fL["piles"][k]["M"] / dL[k] for k in dL}
    out["H3_pile_ratio"] = h3
    L += ["", f"Effect of H-3 alone (frozen model, P3c mass vs dashboard mass, EQ-L pile moments): ratio {min(h3.values()):.3f} … {max(h3.values()):.3f}.",
          "Differences on the P3b model also include the model differences (M-2: horizontal modes 5–8 % shorter)."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=float)
    print("\n".join(L[4:]))


if __name__ == "__main__":
    main()
