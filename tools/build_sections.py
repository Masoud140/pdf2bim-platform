#!/usr/bin/env python3
"""Build girder section properties along every girder (P2) from a description + its P1 geometry; write JSON + report.

    python3 tools/build_sections.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/sections/BR13A.sections.json
"""
import argparse, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.description import MissingInput
from pdf2bim.geometry.alignment import GeometryInputError


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--out", required=True); ap.add_argument("--allow-proposed", action="store_true")
    ap.add_argument("--h", type=float, default=5.0, help="torsion FD mesh size (mm)")
    a = ap.parse_args()
    doc = json.load(open(a.description))
    try:
        geo = build_geometry(doc, allow_proposed=a.allow_proposed)
        S = build_sections(doc, geo, allow_proposed=a.allow_proposed, torsion_h=a.h)
    except (MissingInput, GeometryInputError) as e:
        sys.exit(f"sections not built — missing input: {e}")
    S["geometry_provisional"] = geo["provisional"]
    S["source"] = os.path.relpath(a.description, ROOT)
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(S, open(a.out, "w"), indent=1, ensure_ascii=False, default=float)
    prov = S["provisional"] + geo["provisional"]
    L = [f"# Girder sections — {os.path.basename(a.description)}", "",
         "- Built by `tools/build_sections.py` (P2, `pdf2bim/sections`).",
         f"- Units: {S['units']}. Deck E / girder E = {S['E_deck_MPa']:.0f} / {S['E_girder_MPa']:.0f} MPa (n = {S['modular_ratio_deck']:.4f}); deck {S['deck_thickness']:.0f} mm; torsion mesh {S['torsion_h']} mm.",
         f"- **Status: {'PROVISIONAL — uses proposed values' if prov else 'accepted values only'}.** Calculated, not independently verified.", ""]
    if prov:
        decs = sorted({p["decision"] for p in prov if p.get("decision")})
        L += [f"**Provisional inputs:** {len(prov)} uses of proposed values, from decisions {', '.join(decs)} (see `BR13A.decisions.jsonl`).", ""]
    L += ["**Flags:**", ""] + [f"- {f}" for f in S["flags"]] + [""] + [f"- {n}" for n in S["notes"]] + [""]
    for gid, g in S["girders"].items():
        L += [f"## {gid} — {g['type']} (haunch {g['haunch']} mm)", "",
              "| t | flange L / R (mm) | deck L / R (mm) | girder A | girder yc | girder Ix | composite A (transf.) | composite yc | composite Ix | composite Iy | J composite |",
              "|---|---|---|---|---|---|---|---|---|---|---|"]
        for r in g["stations"]:
            G, C = r["girder"], r["composite"]
            L.append(f"| {r['t']:.1f} | {r['w_left']:.0f} / {r['w_right']:.0f} | {r['deck_left']:.0f} / {r['deck_right']:.0f} | {G['A']:.0f} | {G['yc']:.1f} | {G['Ix']:.4e} | "
                     f"{C['A_transformed']:.0f} | {C['yc']:.1f} | {C['Ix']:.4e} | {C['Iy']:.4e} | {C['J_geometric']:.4e} |")
        L.append("")
    rep = a.out.replace(".json", ".md")
    open(rep, "w").write("\n".join(L) + "\n")
    print(f"{a.out} + {os.path.relpath(rep, ROOT)} written; {len(S['girders'])} girders; provisional {len(prov)}; flags {len(S['flags'])}")


if __name__ == "__main__":
    main()
