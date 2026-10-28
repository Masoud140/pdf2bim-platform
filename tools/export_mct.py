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
    # static load cases as nodal loads (*CONLOAD). Types are the native BR13B LCTYPE codes; centrifugal has none there -> USER.
    from pdf2bim.model.loads import sdl_case
    from pdf2bim.model.horizontal import horizontal_cases
    from pdf2bim.model.wind import wind_cases
    cases = {"SDL": {"type": "D", "loads": sdl_case(doc, geo, M, allow_proposed=a.allow_proposed)["loads"]}}
    typ = {"EP": "EP", "EPTA": "EP", "EPTB": "EP", "BRKp": "BRK", "BRKm": "BRK", "CEN": "USER"}
    for k, v in horizontal_cases(doc, geo, M, Standards(), allow_proposed=a.allow_proposed)["cases"].items():
        cases[k] = {"type": typ.get(k, "USER"), "loads": v["loads"]}
    for k, v in wind_cases(doc, geo, S, M, allow_proposed=a.allow_proposed)["cases"].items():
        cases[k] = {"type": "W", "loads": v["loads"]}
    # temperature / shrinkage as element temperatures (*ELTEMPER uniform, *BSTEMPER gradient band); alpha from the description
    from pdf2bim.model.thermal import thermal_cases
    import numpy as np
    Th = thermal_cases(doc, geo, S, M, allow_proposed=a.allow_proposed)
    alpha = Th["inputs"]["temperature"]["alpha"]
    mm = M["model"]
    Lb = lambda e: float(np.linalg.norm(mm.nodes[mm.beams[e]["n2"]] - mm.nodes[mm.beams[e]["n1"]]))
    for k, v in Th["cases"].items():
        cases[k] = {"type": {"TU+": "T", "TU-": "T", "TGP": "TPG", "TGN": "TPG"}.get(k, "USER"),
                    "strain": {e: (u[6] / Lb(e), u[10] / Lb(e)) for e, u in v["imposed"].items()}}
    # AS 5100.2 combinations of the exported cases (rows with traffic / earthquake wait until those are exported)
    from pdf2bim.model.combinations import Register, generate
    from pdf2bim.model.mct import midas_combinations
    Wsc = wind_cases(doc, geo, S, M, allow_proposed=a.allow_proposed)["scale"]
    # earthquake: the platform's spectrum points, directions and mode count (earthquake.py) as MIDAS spectrum cases
    from pdf2bim.model.earthquake import ch_factor
    from pdf2bim.description import Reader
    import math
    rdq = Reader(doc, a.allow_proposed)
    eqv = {r["item"]: r["value"] for r in rdq.rows((doc.get("loads") or {}).get("earthquake"), "loads.earthquake")}
    kp, Zq, Rf, zeta, site = float(eqv["kp"]), float(eqv["Z"]), float(eqv["Rf"]), float(eqv["zeta"]), str(eqv["site_class"]).strip()
    chrow = Standards().get("AS1170.4:spectral_shape:Ch").value["rows"][site]
    Ts = sorted({0.0, 0.1, 0.3, 1.5} | {round(0.06 * k, 2) for k in range(1, 101)})
    cA = np.mean([mm.nodes[k][:2] for k in M["supports"][geo["supports"][0]["id"]]["sill_nodes"]], axis=0)
    cB = np.mean([mm.nodes[k][:2] for k in M["supports"][geo["supports"][-1]["id"]]["sill_nodes"]], axis=0)
    eq = {"points": [(T, kp * Zq * ch_factor(T, chrow) / Rf) for T in Ts], "kp": kp, "Z": Zq, "site": site, "zeta": zeta,
          "angle_L": math.degrees(math.atan2(cB[1] - cA[1], cB[0] - cA[0])), "modes": int(rdq.value((doc.get("analysis") or {}).get("modes"), "analysis.modes")),
          "mass_cases": ["SDL", "SW_mass"]}
    # member self weight as a mass-only beam-load case: MIDAS did not convert the self weight to mass (run 2026-10-28e);
    # Loads to Masses converts beam loads (owner screenshot). Not used in any combination.
    cases["SW_mass"] = {"type": "USER", "beam": {e: b["w"] for e, b in mm.beams.items() if b["w"] > 0}}
    on = {"DLc", "SDLp", "SOo", "EPT", "BRKR", "CENR", "TUW", "TUC", "TGP", "TGN", "SCR", "WX", "WY", "WZ", "EQX", "EQY"}
    rows = generate(Register(Standards(), on), None)["rows"]
    combos, skipped = midas_combinations(rows, Wsc["with_traffic"], Wsc["sls"], eq_cases=True)
    txt, rep = write_mct(M, doc, title=title, include_unverified=not a.verified_only, cases=cases, alpha=alpha, combos=combos, eq=eq)
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
         f"2. **Elastic links:** {rep['links']} links (bearings); display the link local axes — local z must run along each girder; SDx = vertical stiffness.",
         f"3. **Point springs:** {rep['springs']} nodes on the piles; check one spring value (kN/m, global X and Y).",
         "4. Self weight (load case SW) total reaction ≈ the platform's value in the report (`BR13A.integrated_vs_frozen.md`).",
         "5. Composite girders are COMPOSITE-GEN (girder + deck polygons; drawing = nearest station, stiffness = interpolated). In Section Properties confirm MIDAS kept the written A, Iyy, Izz, J (not recalculated from the polygons) and that self weight still totals the SW reaction in the report. Piles = DBUSER SR; deck strips = DBUSER SB + *SECT-SCALE (J).",
         "6. Section offset (CT / CC) and the node line: confirm the girders are not shifted vertically (MCT_EXPORT_METHOD §2 rule 7).",
         "7. Load cases: SW + SDL, earth pressure (EP, EPTA, EPTB), braking (BRKp / BRKm), centrifugal (CEN, type USER) and 10 wind cases as *CONLOAD "
         "nodal loads (native BR13B syntax; + / - in names spelled p / m); uniform temperature TUp / TUm and shrinkage SCR as *ELTEMPER (dT = strain / alpha on every "
         "superstructure beam), gradients TGP / TGN as one *BSTEMPER band per girder element (force and moment equal the platform's E A e0 / E I phi). "
         "**Check the gradient cases against the platform** (band integration by MIDAS is the one unverified assumption).",
         "8. Combinations: the platform's AS 5100.2 rows that use only exported cases, as plain additive *LOADCOMB rows; rows with vertical wind "
         "(up / down) or traffic surcharge (A / B / none) are expanded into one row per alternative (suffix a, b, c ...), never nested envelopes "
         "(MIDAS evaluates nested envelopes in its own way). No envelope combination is written: MIDAS's envelope of the rows ignored 63 of 145 members "
         "(run 2026-10-28e) — envelope with MIDAS's own tools or use the platform's envelopes. Factors are code-extracted-UNVERIFIED "
         "standards entries. Rows with traffic are not written yet (traffic is not in the file).",
         "9. Earthquake: spectrum cases EQ_L / EQ_T (one direction each; the 1.0 / 0.3 directional combination is in the combination rows) with the platform's "
         "Sa(T) points; masses = SDL + member self weight, both through *LOADTOMASS (SW_mass = self weight as beam loads, a mass-only case: do NOT combine it), lumped (native setting; the platform uses consistent mass, and adds a missing-mass term). "
         "**Check:** (a) the *SPLDCASE last field 0.3 (copied from the native file) must NOT add an orthogonal 30 % — compare EQ_L results with the platform's "
         "longitudinal-alone results; (b) MIDAS uses the listed spectrum points, not its own AS 5100.2 'Be' curve (the native BR13B 'Be' values equal the "
         "platform's Ae row — owner to confirm which is right).", ""]
    open(a.out + ".md", "w").write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
