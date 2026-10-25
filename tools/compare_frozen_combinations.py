#!/usr/bin/env python3
"""AS 5100.2 combinations and combined actions: P3c vs the dashboard (cross-implementation, V5).

    python3 tools/compare_frozen_combinations.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.combinations_vs_frozen.md

1. Engine check, generator: the P3c rows equal the dashboard's genAll rows (SHA-256 of the canonical row text) for the
   dashboard defaults, option variants and three other register selections that exercise every generator path.
2. Engine check, evaluation: the P3c combination of the dashboard's own primitives (rxPrim, bearings + two piles)
   reproduces the dashboard's rxCombine envelopes and governing rows.
3. Platform result on the P3b model (the dashboard's register selection, so the rows are the same): bearing vertical
   force and pile actions vs the dashboard's combined actions. The differences come from the load cases (findings
   H-3 ... H-7, M-1 ... M-3), not from the combination step (checks 1 and 2).
4. Platform default: only actions with an analysed case take part (pedestrian load: Missing-Flagged, not combined).
"""
import argparse, hashlib, json, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
FIX = os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_combinations.json")


def canon(rows):
    return "\n".join("|".join([r["name"], r["ls"], r["col"], r["type"], r["pe"], ",".join(f"{i}:{f:.4f}" for i, f in r["t"])]) for r in rows)


def sha(rows):
    return hashlib.sha256(canon(rows).encode("utf-8")).hexdigest()


def generator_check(D, std):
    from pdf2bim.model.combinations import Register, generate
    on0 = {r["id"] for r in D["register"] if r["on"]}
    out = {}
    for k, v in D["sets"].items():
        o = v["opt"]
        G = generate(Register(std, set(v["on"] or on0)), {x: o[x] for x in ("pm", "wm", "pw", "td", "k1", "k2", "rf", "cap")})
        out[k] = {"n": (len(G["rows"]), v["n"]), "capped": (G["capped"], v["capped"]), "sha_equal": sha(G["rows"]) == v["sha256"]}
    return out


def evaluation_check(D, std):
    from pdf2bim.model.combinations import Register, generate, combine
    on0 = {r["id"] for r in D["register"] if r["on"]}
    G = generate(Register(std, on0))
    nn = lambda v: np.array([np.nan if a is None else a for a in v], float)
    prim = {k: ({"s": nn(v["s"])} if "s" in v else {"max": nn(v["max"]), "min": nn(v["min"])}) for k, v in D["rx"]["Pm"].items()}
    C = combine(G["rows"], prim)
    r = {"missing": (C["missing"], D["rx"]["miss"])}
    for ls in ("ULS", "SLS"):
        d = D["rx"]["C_on_P"][ls]
        r[ls] = {"max_diff": float(np.nanmax(np.abs(C[ls]["max"] - nn(d["max"])))), "min_diff": float(np.nanmax(np.abs(C[ls]["min"] - nn(d["min"])))),
                 "largest": float(np.nanmax(np.abs(nn(d["max"])))), "rows": (C[ls]["n"], D["rx"]["byLs"][ls]),
                 "governing_differ": sum(a != b for a, b in zip(C[ls]["gmax"], d["gmax"])) + sum(a != b for a, b in zip(C[ls]["gmin"], d["gmin"])),
                 "n": len(d["max"])}
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.combinations import primitives, Register, generate, combine, available_actions
    from standards.accessor import Standards
    std = Standards()
    D = json.load(open(FIX))
    gen = generator_check(D, std)
    ev = evaluation_check(D, std)
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, std, allow_proposed=a.allow_proposed)
    Pr = primitives(doc, geo, S, M, std, allow_proposed=a.allow_proposed)
    on_dash = {r["id"] for r in D["register"] if r["on"]}
    Gd = generate(Register(std, on_dash))
    Cd = combine(Gd["rows"], Pr["prim"])
    on_pf = available_actions(Pr["prim"])
    Gp = generate(Register(std, on_pf))
    Cp = combine(Gp["rows"], Pr["prim"])
    ix = {n: i for i, n in enumerate(Pr["names"])}
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"]); base = np.array([base["E"], base["N"]])
    m = M["model"]
    # dashboard quantities
    Q = D["rx"]["Q"]; DC = D["rx"]["C"]
    nn = lambda v: np.array([np.nan if x is None else x for x in v], float)
    dash = {ls: {k: nn(DC[ls][k]) for k in ("max", "min")} for ls in ("ULS", "SLS")}
    # bearings: match the dashboard link top node to the nearest P3b bearing girder node (plan)
    bpos = {bid: m.nodes[b["girder_node"]][:2] for bid, b in M["bearings"].items()}
    brg = {}
    for i, q in enumerate(Q):
        if q["k"] == "B" and q["t"] == "V":
            P = np.array(q["n2"][:2]) + base
            bid = min(bpos, key=lambda k: np.linalg.norm(bpos[k] - P))
            brg[bid] = {"dist": float(np.linalg.norm(bpos[bid] - P)), "i": i}
    out = {"generator": gen, "evaluation": ev, "bearings": {}, "piles": {}, "platform_default": {}}
    L = ["# BR13A AS 5100.2 combinations and combined actions: P3c vs the dashboard", "",
         "All load factors and combination constants are code-extracted-UNVERIFIED standards entries (AS5100.2:load_factor:*, AS5100.2:combination:*). "
         "Load-case inputs are Assumed / Standard-verify. **V5 comparison, not verification; nothing here is design-approved.**", "",
         "## 1. Engine check: generated rows (P3c generate vs dashboard genAll)", "", "| Set | Rows P3c / dashboard | Capped | Row text SHA-256 equal |", "|---|---|---|---|"]
    for k, v in gen.items():
        L.append(f"| {k} | {v['n'][0]} / {v['n'][1]} | {v['capped'][0]} / {v['capped'][1]} | {'yes' if v['sha_equal'] else '**NO**'} |")
    L += ["", "## 2. Engine check: evaluation of the dashboard's primitives (P3c combine vs dashboard rxCombine)", "",
          f"Responses: all {ev['ULS']['n']} quantities of the bearings and of piles A1 and B4. Terms without a primitive (dashboard and P3c): {ev['missing'][1]} / {ev['missing'][0]}.", "",
          "| Limit state | Rows | Largest |Δ| max | Largest |Δ| min | Largest value | Governing rows that differ |", "|---|---|---|---|---|---|"]
    for ls in ("ULS", "SLS"):
        e = ev[ls]
        L.append(f"| {ls} | {e['rows'][0]} / {e['rows'][1]} | {e['max_diff']:.1e} | {e['min_diff']:.1e} | {e['largest']:.0f} | {e['governing_differ']} |")
    L += ["", "## 3. Platform (P3b model, P3c load cases) vs dashboard, same register selection and rows", "",
          f"Rows: {len(Gd['rows'])} ({sum(r['ls'] == 'ULS' for r in Gd['rows'])} ULS, {sum(r['ls'] == 'SLS' for r in Gd['rows'])} SLS). "
          f"Pedestrian (PED) is selected in the dashboard but has no load case in either: its {Cd['missing'].get('PED', 0)} terms contribute nothing (dashboard: {D['rx']['miss'].get('PED', 0)}).", "",
          "### Bearing vertical force v (compression +), kN", "", "| Bearing | ULS max P3c | ULS max dash | ULS min P3c | ULS min dash | SLS max P3c | SLS max dash | SLS min P3c | SLS min dash | Match dist (m) |",
          "|---|---|---|---|---|---|---|---|---|---|"]
    for bid in sorted(brg):
        i = ix[("BL", bid, "v")]; j = brg[bid]["i"]
        row = [Cd["ULS"]["max"][i], dash["ULS"]["max"][j], Cd["ULS"]["min"][i], dash["ULS"]["min"][j], Cd["SLS"]["max"][i], dash["SLS"]["max"][j], Cd["SLS"]["min"][i], dash["SLS"]["min"][j]]
        out["bearings"][bid] = {"p3c": row[0::2], "dash": row[1::2], "dist": brg[bid]["dist"], "gov_p3c": [Cd["ULS"]["gmax"][i], Cd["ULS"]["gmin"][i]], "gov_dash": [DC["ULS"]["gmax"][j], DC["ULS"]["gmin"][j]]}
        L.append(f"| {bid} | " + " | ".join(f"{x:.0f}" for x in row) + f" | {brg[bid]['dist']:.2f} |")
    # piles: max over elements / ends of |envelope| for Ml, Mt; N max / min
    def pile_p3c(C, ls):
        r = {}
        for n, i in ix.items():
            if n[0] == "P":
                pid, q = n[1][0], n[2]
                k = q[:-1] if q[-1] in "12" and q[:-1] in ("Ml", "Mt", "N") else None
                if not k:
                    continue
                d = r.setdefault(pid, {"Ml": 0.0, "Mt": 0.0, "Nmax": -np.inf, "Nmin": np.inf})
                if k == "N":
                    d["Nmax"] = max(d["Nmax"], C[ls]["max"][i]); d["Nmin"] = min(d["Nmin"], C[ls]["min"][i])
                else:
                    d[k] = max(d[k], abs(C[ls]["max"][i]), abs(C[ls]["min"][i]))
        return r

    def pile_dash(ls):
        r = {}
        for j, q in enumerate(Q):
            if q["k"] == "P":
                d = r.setdefault(q["pile"], {"Ml": 0.0, "Mt": 0.0, "Nmax": -np.inf, "Nmin": np.inf})
                if q["t"] == "N":
                    d["Nmax"] = max(d["Nmax"], dash[ls]["max"][j]); d["Nmin"] = min(d["Nmin"], dash[ls]["min"][j])
                else:
                    d[q["t"]] = max(d[q["t"]], abs(dash[ls]["max"][j]), abs(dash[ls]["min"][j]))
        return r
    pp, pd = pile_p3c(Cd, "ULS"), pile_dash("ULS")
    L += ["", "### Pile actions, ULS (largest over the pile's element ends): |M| about the sill axis (Ml) and about its normal (Mt), kN·m; N (compression +), kN", "",
          "| Pile | Ml P3c | Ml dash | Mt P3c | Mt dash | N max P3c | N max dash | N min P3c | N min dash |", "|---|---|---|---|---|---|---|---|---|"]
    for pid in sorted(pd):
        a_, b_ = pp.get(pid), pd[pid]
        if a_ is None:
            L.append(f"| {pid} | — | {b_['Ml']:.0f} | — | {b_['Mt']:.0f} | — | {b_['Nmax']:.0f} | — | {b_['Nmin']:.0f} |"); continue
        out["piles"][pid] = {"p3c": a_, "dash": b_}
        L.append(f"| {pid} | {a_['Ml']:.0f} | {b_['Ml']:.0f} | {a_['Mt']:.0f} | {b_['Mt']:.0f} | {a_['Nmax']:.0f} | {b_['Nmax']:.0f} | {a_['Nmin']:.0f} | {b_['Nmin']:.0f} |")
    # platform default selection
    up = {bid: (Cp["ULS"]["max"][ix[("BL", bid, "v")]], Cp["ULS"]["min"][ix[("BL", bid, "v")]], Cp["SLS"]["min"][ix[("BL", bid, "v")]]) for bid in M["bearings"]}
    out["platform_default"] = {"on": sorted(on_pf), "rows": len(Gp["rows"]), "missing": Cp["missing"], "not_combined": Pr["not_combined"], "bearing_v": up}
    L += ["", "## 4. Platform default selection (only actions with an analysed case)", "",
          f"Actions: {', '.join(sorted(on_pf))}. Rows: {len(Gp['rows'])}. Not combined (flagged): " + "; ".join(f"{k} ({w})" for k, w in Pr["not_combined"]) + ".",
          f"Earth pressure carried by {', '.join(x for x in ('SOo', 'SOc') if x in on_pf)} (fill category not in the description: provisional).", "",
          "| Bearing | ULS max v | ULS min v | SLS min v | Uplift (min < 0) |", "|---|---|---|---|---|"]
    for bid in sorted(up):
        L.append(f"| {bid} | {up[bid][0]:.0f} | {up[bid][1]:.0f} | {up[bid][2]:.0f} | {'**yes**' if min(up[bid][1], up[bid][2]) < 0 else 'no'} |")
    L += ["", "Bearing uplift (negative v) in a combination is reported, not resolved: AS 5100.2 combinations of Assumed inputs on a provisional model (see the bearing findings F-5, F-6, M-1, M-3)."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=lambda x: x.tolist() if hasattr(x, "tolist") else float(x))
    print("\n".join(L[4:]))


if __name__ == "__main__":
    main()
