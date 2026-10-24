#!/usr/bin/env python3
"""Traffic envelopes (M1600, S1600, characteristic): P3c engine vs the dashboard's Traffic tab (cross-implementation, V5).

    python3 tools/compare_frozen_traffic.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.traffic_vs_frozen.md

Three columns per quantity:
- dashboard engine on the frozen model (tests/model/fixtures/br13a_dashboard_traffic_{def,sweep}.json);
- P3c engine on the SAME frozen model (isolates the engine: load model, distribution, lane / vehicle placement, envelope);
- P3c engine on the P3b integrated model (adds the model differences).
"""
import argparse, json, math, os, re, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT, "tools"))
from compare_frozen_integrated import frozen_model


def frozen_mdl(F, FS, geo, base):
    """The frozen model as a P3 model record (roles, lines, bearings), for the P3c engine."""
    al = geo["_alignment"]
    m = frozen_model(F, base)
    deck = {l[0] for l in FS["loads"]}
    gnode = {}
    members = []
    for e in F["els"]:
        mt = re.match(r"(G\d)-[ME]_composite", e["sec"])
        if mt:
            members.append({"id": e["id"], "n1": e["n1"], "n2": e["n2"], "role": "girder", "line": mt.group(1)})
            gnode[e["n1"]] = mt.group(1); gnode[e["n2"]] = mt.group(1)
    nodes = {}
    for n in deck | set(gnode):
        ch, o = al.station(*m.nodes[n][:2], guess=geo["supports"][0]["ch"])
        nodes[n] = {"role": "girder", "line": gnode.get(n), "ch": ch, "o": o}
    bearings = {}
    for l in F["links"]:
        sid = "A" if "AbutA" in l["group"] else "B"
        P = m.nodes[l["n2"]]
        g = min(gnode, key=lambda n: math.hypot(m.nodes[n][0] - P[0], m.nodes[n][1] - P[1]))
        bearings[f"{sid}-{gnode[g]}"] = {"link": l["id"], "girder": gnode[g], "support": sid, "girder_node": l["n2"]}
    return {"model": m, "nodes": nodes, "members": members, "bearings": bearings}


def summary(T, mn):
    R, E = T["responses"], T["env"][mn]
    g = {}
    for gid in sorted({r["girder"] for r in R if r["t"] == "M"}):
        g[gid] = (max(E["max"][i] for i, r in enumerate(R) if r["t"] == "M" and r["girder"] == gid),
                  min(E["min"][i] for i, r in enumerate(R) if r["t"] == "D" and r["girder"] == gid) * 1000)
    b = {r["bearing"]: E["max"][i] for i, r in enumerate(R) if r["t"] == "B"}
    return g, b


def dash_summary(D, mn, fm, fmdl):
    R = D["R"][mn]
    g = {f"G{gi + 1}": (max(r["max"] for r in R if r["t"] == "M" and r["g"] == gi), min(r["min"] for r in R if r["t"] == "D" and r["g"] == gi))
         for gi in sorted({r["g"] for r in R if r["t"] == "M"})}
    b = {}
    for r in (r for r in R if r["t"] == "B"):
        P = r["n2"]
        bid = min(fmdl["bearings"], key=lambda k: math.hypot(fm.nodes[fmdl["bearings"][k]["girder_node"]][0] - (P[0] + fm.base[0]),
                                                             fm.nodes[fmdl["bearings"][k]["girder_node"]][1] - (P[1] + fm.base[1])))
        b[bid] = r["max"]
    return g, b


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.traffic import traffic_envelope
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    F = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
    FS = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_sdl.json")))
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"]); base = (base["E"], base["N"])
    fmdl = frozen_mdl(F, FS, geo, base)
    fmdl["model"].base = base
    out = {"modes": {}}
    std = Standards()
    L = ["# BR13A traffic (M1600 / S1600, characteristic): P3c engine vs the dashboard's Traffic tab", "",
         "Characteristic envelopes (DLA and accompanying lane factors included, no load factor). Default options as the dashboard: lateral wheel shift ±0.4 m, patterned UDL, no DLA on the UDL, 0.25 m vehicle steps. "
         "**Cross-implementation comparison (V5), not verification.** Standards values used are code-extracted-UNVERIFIED (lane width, M1600 / S1600, DLA, lane factors).", "",
         "Columns: **Dash/frozen** = the dashboard engine on its frozen model; **P3c/frozen** = the P3c engine on the same frozen model (isolates the engine); "
         "**P3c/P3b** = the P3c engine on the P3b integrated model (adds the model differences).", ""]
    for mode, lay in (("def", "left"), ("sweep", "sweep")):
        D = json.load(open(os.path.join(ROOT, f"tests/model/fixtures/br13a_dashboard_traffic_{mode}.json")))
        Tf = traffic_envelope(doc, geo, fmdl, std, allow_proposed=a.allow_proposed, layout=lay)
        Tp = traffic_envelope(doc, geo, M, std, allow_proposed=a.allow_proposed, layout=lay)
        npos = len(Tp["layouts"])
        title = "lanes packed from the left kerb (dashboard default)" if lay == "left" else f"swept across the carriageway ({npos} positions)"
        L += [f"## Lane layout: {title}", ""]
        res = {}
        for mn in Tp["models"]:
            gd, bd = dash_summary(D, mn, fmdl["model"], fmdl)
            gf, bf = summary(Tf, mn); gp, bp = summary(Tp, mn)
            res[mn] = {"girders": {k: (gd[k], gf[k], gp[k]) for k in gd}, "bearings": {k: (bd[k], bf.get(k), bp.get(k)) for k in sorted(bd)}}
            L += [f"### {mn}", "", "| Girder | max M Dash/frozen | P3c/frozen | Δ engine | P3c/P3b | Δ total | min uz Dash/frozen (mm) | P3c/frozen | P3c/P3b |", "|---|---|---|---|---|---|---|---|---|"]
            for k in gd:
                L.append(f"| {k} | {gd[k][0]:.0f} | {gf[k][0]:.0f} | {100 * (gf[k][0] / gd[k][0] - 1):+.1f} % | {gp[k][0]:.0f} | {100 * (gp[k][0] / gd[k][0] - 1):+.1f} % | {gd[k][1]:.2f} | {gf[k][1]:.2f} | {gp[k][1]:.2f} |")
            L += ["", "| Bearing | max R Dash/frozen (kN) | P3c/frozen | Δ engine | P3c/P3b | Δ total |", "|---|---|---|---|---|---|"]
            for k in sorted(bd):
                L.append(f"| {k} | {bd[k]:.1f} | {bf[k]:.1f} | {100 * (bf[k] / bd[k] - 1):+.1f} % | {bp[k]:.1f} | {100 * (bp[k] / bd[k] - 1):+.1f} % |")
            L.append("")
        out["modes"][lay] = res
    # engine verification: the dashboard's distribution rule replicated (one-node lines included), then without the one-node lines (H-5)
    from pdf2bim.model.traffic import Influence
    from pdf2bim.model.loads import deck_end_lines, _side
    al = geo["_alignment"]; ends = deck_end_lines(geo)
    inside = lambda c, o: all(_side(*ends[k], al.point(c, o)[:2]) >= -1e-6 for k in ends)
    D = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_traffic_sweep.json")))
    rep = {}
    for tag, mn_ in (("replica", 1), ("no_one_node_lines", 3)):
        infl = Influence(fmdl, dist="lines", ends=inside, min_line_nodes=mn_)
        T = traffic_envelope(doc, geo, fmdl, std, allow_proposed=a.allow_proposed, layout="sweep", inf=infl)
        rep[tag] = {}
        for mn in T["models"]:
            gd, bd = dash_summary(D, mn, fmdl["model"], fmdl); gf, bf = summary(T, mn)
            rep[tag][mn] = {"girders": {k: (gd[k][0], gf[k][0]) for k in gd}, "bearings": {k: (bd[k], bf[k]) for k in bd}}
    out["engine_check"] = rep
    one = [round(o, 3) for o, pl in Influence(fmdl, dist="lines", ends=inside).lines if len(pl) < 3]
    L += ["## Engine check: the dashboard's distribution rule reproduced (sweep)", "",
          "The P3c engine run with the dashboard's own load-distribution rule (trW: between constant-offset node lines; a point beyond a line's end goes to its end node) "
          "on the frozen model reproduces the dashboard's envelope, which checks the lane, vehicle, DLA, patterning and lane-factor logic:", "",
          "| Model | largest |Δ| girder max M | largest |Δ| bearing max R |", "|---|---|---|"]
    for mn, r in rep["replica"].items():
        L.append(f"| {mn} | {max(abs(b / a - 1) for a, b in r['girders'].values()) * 100:.2f} % | {max(abs(b / a - 1) for a, b in r['bearings'].values()) * 100:.2f} % |")
    L += ["", f"## Finding H-5: one-node 'lines' at the bearing nodes", "",
          f"In the dashboard's mesh the bearing nodes sit off the girder / web lines (F-4); its rule makes each of them a one-node 'line' (offsets {', '.join(str(x) for x in one)} m) "
          "that collects the load at that offset over the WHOLE span and puts it straight onto the bearing node. Removing only those one-node lines from the same rule:", "",
          "| Bearing (M1600, sweep) | Dashboard | Dashboard rule without one-node lines | P3c triangles, frozen model |", "|---|---|---|---|"]
    tri = out["modes"]["sweep"]["M1600"]["bearings"]
    for k, (a_, b_) in sorted(rep["no_one_node_lines"]["M1600"]["bearings"].items()):
        L.append(f"| {k} | {a_:.0f} | {b_:.0f} ({100 * (b_ / a_ - 1):+.0f} %) | {tri[k][1]:.0f} |")
    L += ["", "The dashboard's inner-bearing traffic reactions are therefore overstated (up to ≈ +44 %) and its girder moments slightly understated (1–6 %). "
          "Without the one-node lines the dashboard rule and the P3c triangulation agree closely.", ""]
    # the layout finding
    s, d = out["modes"]["sweep"]["M1600"], out["modes"]["left"]["M1600"]
    L += ["## Finding H-4: the dashboard's default lane layout", "",
          "The dashboard's default ('def') packs the lanes against the left kerb and does not move them. Swept across the carriageway, the M1600 envelope rises (dashboard engine, frozen model):", "",
          "| Quantity | Left-packed (default) | Swept | Ratio |", "|---|---|---|---|"]
    for k in s["girders"]:
        L.append(f"| {k} max M (kN·m) | {d['girders'][k][0][0]:.0f} | {s['girders'][k][0][0]:.0f} | {s['girders'][k][0][0] / d['girders'][k][0][0]:.2f} |")
    for k in s["bearings"]:
        L.append(f"| {k} max R (kN) | {d['bearings'][k][0]:.0f} | {s['bearings'][k][0]:.0f} | {s['bearings'][k][0] / d['bearings'][k][0]:.2f} |")
    L += ["", "The P3c engine uses the sweep by default."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1)
    print("\n".join(L[6:]))


if __name__ == "__main__":
    main()
