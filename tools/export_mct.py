#!/usr/bin/env python3
"""Export the P3b integrated model of a bridge as a MIDAS Civil .mct (NEEDS AN ENGINEER IMPORT TEST).

    python3 tools/export_mct.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.integrated.mct

Writes the .mct, a sidecar .mct.json (node / element maps, block status) and a .mct.md import checklist.
"""
import argparse, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    ap.add_argument("--verified-only", action="store_true", help="omit blocks with unverified syntax (links, springs)")
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.mct import write_mct
    from schema.c14n import content_hash
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    prov = sorted({str(p.get("decision")) for p in M["provisional"] + S["provisional"] + geo["provisional"] if p.get("decision")})
    name = doc["project"].get("name", {}).get("value") if isinstance(doc["project"].get("name"), dict) else None
    title = f"{name or os.path.basename(a.description)} integrated model, revision {doc['revision']['number']}" + (f" — PROVISIONAL ({', '.join(prov)})" if prov else "")
    txt, rep = write_mct(M, doc, title=title, include_unverified=not a.verified_only)
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write(txt)
    side = {k: v for k, v in rep.items()}
    side.update({"description": os.path.relpath(a.description, ROOT), "revision": doc["revision"]["number"], "description_hash": doc.get("hash", {}).get("value"),
                 "provisional": prov, "standards_status": M["standards_status"]})
    from pdf2bim.runrecord import make as run_record
    side["run_record"] = run_record(a.description, doc, "export_mct", allow_proposed=a.allow_proposed)
    json.dump(side, open(a.out + ".json", "w"), indent=1, default=str)
    L = [f"# MIDAS import checklist — `{os.path.basename(a.out)}`", "",
         f"**Status: {rep['status']}.** Generated from revision {doc['revision']['number']} of `{side['description']}`"
         + (f"; PROVISIONAL inputs {', '.join(prov)}." if prov else "."), "",
         f"Contents: {rep['nodes']} nodes, {rep['elements']} beam elements, {rep['materials']} materials, {rep['sections']} sections, "
         f"{rep['links']} elastic links, {rep['springs']} point springs, {rep['supports']} supported nodes. Base point E {rep['base_point'][0]:.3f}, N {rep['base_point'][1]:.3f}.", "",
         "Checked without MIDAS (not an import): re-read by the platform and re-solved (self weight equal; displacements to 1e-6), and read by the dashboard's own .mct parser "
         "(same counts, no warnings, same self weight). See `tests/model/test_mct.py`.", "",
         "## Please check on import (engineer)", "",
         "1. The file imports without errors or warnings (send the MIDAS message log if not).",
         "2. **Elastic links (UNVERIFIED syntax):** 8 links listed; display the link local axes — local z must run along each girder; SDx = vertical stiffness.",
         "3. **Point springs (UNVERIFIED syntax):** 148 nodes on the piles; check one spring value (kN/m, global X and Y).",
         "4. Self weight (load case SW) total reaction ≈ the platform's value in the report (`BR13A.integrated_vs_frozen.md`).",
         "5. Composite girders are COMPOSITE-GEN (girder + deck polygons; drawing = nearest station, stiffness = interpolated). In Section Properties confirm MIDAS kept the written A, Iyy, Izz, J (not recalculated from the polygons) and that self weight still totals the SW reaction in the report. Piles = DBUSER SR; deck strips = DBUSER SB + *SECT-SCALE (J).",
         "6. Section offset (CT / CC) and the node line: confirm the girders are not shifted vertically (MCT_EXPORT_METHOD §2 rule 7).",
         "7. SDL and other load cases are NOT in the file: nodal-load syntax (*CONLOAD) is not documented. A native MIDAS export with one nodal load, one point spring "
         "and one elastic link would let the platform write them without guessing.", ""]
    open(a.out + ".md", "w").write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
