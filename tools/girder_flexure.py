#!/usr/bin/env python3
"""Super-T girder ULS flexure along every girder (P4.5 stage 5c): effective prestress from the losses analysis,
design actions from the AS 5100.2 combined actions, phi Mu by strain compatibility. INDICATIVE.

    python3 tools/girder_flexure.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.girder_flexure.md
"""
import argparse, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.combinations import combined_actions
    from pdf2bim.design.girder_design import flexure_along
    from standards.accessor import Standards
    std = Standards()
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, std, allow_proposed=a.allow_proposed)
    CA = combined_actions(doc, geo, S, M, std, allow_proposed=a.allow_proposed)
    out = {}
    L = ["# Super-T girder ULS flexure along the girders (P4.5 stage 5c) — INDICATIVE", "",
         "Effective prestress at the last reported time from the ported losses analysis (inputs: description + D-42 Assumed placeholders); "
         "strand / bar layout an Assumed placeholder (D-1); ULS sagging M* from the AS 5100.2 combined actions at the nearest girder element end; "
         "phi Mu by strain compatibility. Standards values code-extracted-UNVERIFIED. **Not design-approved.** "
         "Not yet checked: hogging, SLS staged stresses, minimum strength, shear / torsion, strand development. Superseded by BR13A.girder_checks.md (stage 6: strand prestrain includes the concrete strain at the strand; concurrent N*).", ""]
    for g in S["girders"]:
        R = flexure_along(doc, geo, S, CA, M, std, g, allow_proposed=a.allow_proposed)
        out[g] = R
        L += [f"## {g}", "", "| t | x (m) | strands | mean sigma_pe (MPa) | M* sag (kN m) | governing row | phi Mu (kN m) | kuo | M* / phi Mu |", "|---|---|---|---|---|---|---|---|---|"]
        for r in R["rows"]:
            L.append(f"| {r['t']:.1f} | {r['x_m']:.2f} | {r['n_strands']} | {r['sigma_pe_mean']:.0f} | {r['M_sag']:.0f} | {r['row_sag']} | {r['phiMu']:.0f} | {r['kuo']:.3f} | **{r['u_sag']:.2f}** |")
        L += [""] + [f"- {n}" for n in R["notes"]] + [""]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=str)
    print("\n".join(L))


if __name__ == "__main__":
    main()
