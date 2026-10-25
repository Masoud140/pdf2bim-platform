#!/usr/bin/env python3
"""Concurrent traffic actions (P4.1): for each governing traffic extreme, the load state that produces it and every
other response under that same state. Characteristic (DLA and lane factors included, no load factor).

    python3 tools/concurrent_traffic.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.traffic_concurrent.md

Reports, per vehicle model:
- girders: largest sagging M (over the line's element ends) with the concurrent V and T at the same section;
- bearings: largest v with the concurrent tr and lon;
- piles: the state of the largest |Ml| and of the largest |Mt|, each with the concurrent other moment and N, and the
  concurrent resultant against the separate-envelope bound sqrt(Ml_env^2 + Mt_env^2) (ARCHITECTURE §4).
Values only; inputs carry their tags; nothing is design-approved."""
import argparse, json, math, os, sys
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
    from pdf2bim.model.responses import ResponseSet
    from pdf2bim.model.traffic import traffic_envelope, Influence, governing_state, concurrent
    from standards.accessor import Standards
    std = Standards()
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, std, allow_proposed=a.allow_proposed)
    RS = ResponseSet(M)
    T = traffic_envelope(doc, geo, M, std, allow_proposed=a.allow_proposed, inf=Influence(M, responses=RS))
    ix = RS.index
    out = {"models": {}, "settings": T["settings"], "layouts": len(T["layouts"]), "lane_factors": T["lane_factors"], "provisional": T["provisional"]}
    L = ["# Concurrent traffic actions (P4.1) — characteristic, DLA and lane factors included, no load factor", "",
         "Each row: the load state (lane layout, lane ranking, vehicle position, patterned UDL) that produces the extreme in the first column, and the other actions under **that same state**. "
         "Standards values (M1600 / S1600, lane width, lane factors) are code-extracted-UNVERIFIED; model PROVISIONAL. Values only. Units kN, kN·m.", ""]
    for mn in T["models"]:
        E = T["env"][mn]
        res = {"girders": {}, "bearings": {}, "piles": {}}
        L += [f"## {mn}", "", "### Girders: largest sagging moment and concurrent actions at the same section", "",
              "| Girder | M sag | at ch | V concurrent | V envelope (same section) | T concurrent | T envelope | Lanes loaded (offset: factor) |", "|---|---|---|---|---|---|---|---|"]
        lines = sorted({n[1][0] for n in RS.names if n[0] == "G"})
        for g in lines:
            cand = [(E["max"][i], n) for n, i in ix.items() if n[0] == "G" and n[1][0] == g and n[2][0] == "M"]
            v, n = max(cand)
            st = governing_state(T, mn, ix[n], 1); c = concurrent(T, st)
            end = n[2][1]
            iv, it = ix[n[:2] + ("V" + end,)], ix[n[:2] + ("T" + end,)]
            ch = RS.meta[n[:2]]["ch"][int(end) - 1]
            env_v = max(abs(E["max"][iv]), abs(E["min"][iv])); env_t = max(abs(E["max"][it]), abs(E["min"][it]))
            res["girders"][g] = {"M": float(v), "ch": ch, "element": n[1][1], "end": int(end), "V": float(c[iv]), "V_env": float(env_v), "T": float(c[it]), "T_env": float(env_t),
                                 "check": float(c[ix[n]]), "factors": st["factors"]}
            L.append(f"| {g} | {v:.0f} | {ch:.2f} | {c[iv]:.0f} | {env_v:.0f} | {c[it]:.0f} | {env_t:.0f} | " + ", ".join(f"{o:.1f}: {f:g}" for o, f in st["factors"]) + " |")
        L += ["", "### Bearings: largest vertical force and concurrent horizontal forces", "", "| Bearing | v max | tr concurrent | |tr| envelope | lon concurrent | |lon| envelope |", "|---|---|---|---|---|---|"]
        for b in sorted(M["bearings"]):
            i = ix[("BL", b, "v")]
            st = governing_state(T, mn, i, 1); c = concurrent(T, st)
            itr, ilo = ix[("BL", b, "tr")], ix[("BL", b, "lon")]
            etr = max(abs(E["max"][itr]), abs(E["min"][itr])); elo = max(abs(E["max"][ilo]), abs(E["min"][ilo]))
            res["bearings"][b] = {"v": float(E["max"][i]), "tr": float(c[itr]), "tr_env": float(etr), "lon": float(c[ilo]), "lon_env": float(elo), "check": float(c[i])}
            L.append(f"| {b} | {E['max'][i]:.0f} | {c[itr]:.0f} | {etr:.0f} | {c[ilo]:.0f} | {elo:.0f} |")
        L += ["", "### Piles: concurrent moment resultant vs the separate-envelope bound", "",
              "| Pile | state | Ml | Mt | N | concurrent resultant | bound √(Ml_env² + Mt_env²) | ratio |", "|---|---|---|---|---|---|---|---|"]
        for pid in sorted({n[1][0] for n in RS.names if n[0] == "P"}):
            rows = {q: [(n, i) for n, i in ix.items() if n[0] == "P" and n[1][0] == pid and n[2][:-1] == q and n[2][-1] in "12"] for q in ("Ml", "Mt", "N")}
            amp = lambda i: max(abs(E["max"][i]), abs(E["min"][i]))
            nl, il = max(rows["Ml"], key=lambda x: amp(x[1])); nt_, it_ = max(rows["Mt"], key=lambda x: amp(x[1]))
            bound = math.hypot(amp(il), amp(it_))
            res["piles"][pid] = {"bound": bound, "states": {}}
            for lab, (nn, ii) in (("max |Ml|", (nl, il)), ("max |Mt|", (nt_, it_))):
                sg = 1 if abs(E["max"][ii]) >= abs(E["min"][ii]) else -1
                st = governing_state(T, mn, ii, sg); c = concurrent(T, st)
                key = nn[:2]; end = nn[2][-1]
                ml, mt, nf = c[ix[key + ("Ml" + end,)]], c[ix[key + ("Mt" + end,)]], c[ix[key + ("N" + end,)]]
                rr = math.hypot(ml, mt)
                res["piles"][pid]["states"][lab] = {"element": key[1][1], "end": int(end), "Ml": float(ml), "Mt": float(mt), "N": float(nf), "resultant": rr, "check": float(c[ii])}
                L.append(f"| {pid} | {lab} (element {key[1][1]}, end {end}) | {ml:.0f} | {mt:.0f} | {nf:.0f} | {rr:.0f} | {bound:.0f} | {rr / bound:.2f} |")
        L.append("")
        out["models"][mn] = res
    L += ["Notes:", "- Every state reproduces its envelope value exactly (`tests/model/test_concurrent.py`); concurrent values lie within their own envelopes.",
          "- The pile resultant from one state is a lower bound of the true largest resultant over all states; the √ of separate envelopes is an upper bound. The true value lies between them (P4.3 refines it).", ""]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=lambda x: x.tolist() if hasattr(x, "tolist") else str(x))
    print("\n".join(L))


if __name__ == "__main__":
    main()
