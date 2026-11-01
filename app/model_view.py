#!/usr/bin/env python3
"""Model data for the web app's 3D / analysis views: the integrated model (nodes, members by role, bearing links,
springs) and its self-weight and SDL solutions (displacements, support reactions, equilibrium check).

    python3 app/model_view.py DESCRIPTION.json OUT.json [--allow-proposed]

Coordinates are written relative to the model's first node (E, N rounded to the metre) so the browser keeps precision;
the offset is written as "origin" (true MGA = local + origin)."""
import json, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.loads import sdl_case
from standards.accessor import Standards


def solve_view(m, r):
    u = {str(n): [round(float(x), 6) for x in v[:3]] for n, v in r["u"].items()}
    reac = {str(n): [round(float(x), 2) for x in v[:6]] for n, v in r["reactions"].items()}
    spr = {str(n): [round(float(x), 2) for x in v[:3]] for n, v in r["spring_forces"].items()}
    return {"u": u, "reactions": reac, "spring_forces": spr, "applied_kN": [round(float(x), 2) for x in r["applied"]],
            "equilibrium_residual_kN": round(float(np.abs(r["equilibrium_residual"]).max()), 6)}


def main():
    desc, out = sys.argv[1], sys.argv[2]
    ap = "--allow-proposed" in sys.argv
    doc = json.load(open(desc))
    geo = build_geometry(doc, allow_proposed=ap)
    S = build_sections(doc, geo, allow_proposed=ap)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=ap)
    m = M["model"]
    first = m.nodes[sorted(m.nodes)[0]]
    o = [round(float(first[0])), round(float(first[1])), 0.0]
    nodes = {str(k): [round(float(v[0] - o[0]), 4), round(float(v[1] - o[1]), 4), round(float(v[2]), 4), (M["nodes"].get(k) or {}).get("role", "")]
             for k, v in m.nodes.items()}
    beams = [[str(b["n1"]), str(b["n2"]), b.get("role", "")] for b in m.beams.values()]
    links = [[str(l["n1"]), str(l["n2"]), l.get("role", "link")] for l in m.links.values()]
    sw = solve_view(m, m.solve())
    sd = sdl_case(doc, geo, M, allow_proposed=ap)
    sdl = solve_view(m, m.solve(gravity=(0.0, 0.0, 0.0), loads=sd["loads"]))
    sdl["total_kN"] = round(float(sd["total_kN"]), 2)
    prov = sorted({str(q.get("decision")) for q in M["provisional"] + S["provisional"] + geo["provisional"] if q.get("decision")})
    json.dump({"origin": o, "nodes": nodes, "beams": beams, "links": links, "springs": [str(n) for n in m.springs],
               "fixed": [str(n) for n in m.fixed], "cases": {"SW": sw, "SDL": sdl}, "geometry_checks": geo["checks"],
               "provisional_decisions": prov, "allow_proposed": ap}, open(out, "w"), default=str)
    print(f"model view: {len(nodes)} nodes, {len(beams)} members, {len(links)} links; SW applied {sw['applied_kN'][2]} kN, "
          f"SDL {sdl['total_kN']} kN; equilibrium residual {sw['equilibrium_residual_kN']} kN")


if __name__ == "__main__":
    main()
