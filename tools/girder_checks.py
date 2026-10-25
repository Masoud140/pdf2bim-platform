#!/usr/bin/env python3
"""Super-T girder SLS (staged stresses, decompression, allowable moment), cracking / minimum strength and ULS bending
along every girder (P4.5 stage 6). INDICATIVE.

    python3 tools/girder_checks.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.girder_checks.md
"""
import argparse, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def f0(v):
    return "—" if v is None else f"{v:.0f}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.combinations import combined_actions
    from pdf2bim.design.girder_design import checks_along
    from standards.accessor import Standards
    std = Standards()
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, std, allow_proposed=a.allow_proposed)
    CA = combined_actions(doc, geo, S, M, std, allow_proposed=a.allow_proposed)
    out = {}
    L = ["# Super-T girder checks along the girders (P4.5 stage 6) — INDICATIVE", "",
         "Staged SLS (girder alone under prestress + Mnc, then composite), decompression Mdec, allowable moment Mal (Table 8.6.2.1 increments), "
         "cracking moment Mcr and minimum strength Muo >= 1.2 Mcr, ULS bending with the concurrent axial force. Effective prestress from the ported "
         "losses analysis (D-42 Assumed inputs); strand / bar layout an Assumed placeholder (D-1); standards values code-extracted-UNVERIFIED. "
         "**Not design-approved.** Free strains on the composite section: temperature-gradient primary strains (factors of the governing SLS row) and deck differential shrinkage (losses analysis). Shear / torsion by the general method with Assumed fitments (D-45 / D-46). Not checked: solid end blocks, strand development.", ""]
    for g in S["girders"]:
        R = checks_along(doc, geo, S, CA, M, std, g, allow_proposed=a.allow_proposed)
        out[g] = R
        L += [f"## {g}", "", "### Sagging", "",
              "| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |",
              "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
        for r in R["rows"]:
            s = r["sag"]
            L.append(f"| {r['t']:.1f} | {r['x_m']:.2f} | {f0(r['Mnc'])} | {f0(s['Ms'])} ({s['row_sls']}) | {s['soffit_sls']:.2f} | {'yes' if s['uncracked'] else 'no'} | {f0(s['Mdec'])} | {f0(s['Mal'])} | "
                     f"**{s['uS']:.2f}** | {f0(s['Mcr'])} | {f0(s['Muo'])} | {f0(s['Muo_min'])}{'' if s['okMin'] else ' **FAIL**'} | {f0(s['Mu'])} ({s['row_uls']}) | {f0(s['Nu'])} | {f0(s['phiMu'])} | **{s['uB']:.2f}** |")
        L += ["", "### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)", ""]
        shr = [r for r in R["rows"] if "u" in r.get("shear", {})]
        if shr:
            L += ["| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
            for r in shr:
                q = r["shear"]
                L.append(f"| {r['t']:.1f} | {f0(q['V'])} | {f0(q['T'])} | {f0(q['M'])} | {f0(q['N'])} | {q['row']} | {q['fitments']} | {f0(q['dv'])} | {q['th']:.1f} | {q['kv']:.3f} | {q['uCr']:.2f} | {q['uV']:.2f} | {q['uT']:.2f} | {q['uL']:.2f} | **{q['u']:.2f}**{' FAIL' if q['u'] > 1 else ''} |")
        else:
            L.append("Not checked: " + "; ".join(sorted({r.get('shear', {}).get('why', '') for r in R['rows']})))
        hog = [r for r in R["rows"] if r["hog"]["Ms"] < r["hog"]["MdecT"] or r["hog"]["Mu"] < 0]
        L += ["", "### Hogging / top face", ""]
        if hog:
            L += ["| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |", "|---|---|---|---|---|---|---|---|---|---|"]
            for r in hog:
                h = r["hog"]
                L.append(f"| {r['t']:.1f} | {f0(h['Ms'])} ({h['row_sls']}) | {f0(h['MdecT'])} | {f0(h['MalT'])} | {h['uST']:.2f} | {f0(h['Mu'])} ({h['row_uls']}) | {f0(h['phiMu'])} | {h['uB']:.2f} | {f0(h['Muo_min'])} | {f0(h['Muo'])} |")
        else:
            L.append("No station with a hogging ULS moment or an SLS moment below the top-face decompression moment.")
        lim = R["rows"][0]["limits"]
        L += ["", f"- crack-control limits (Table 8.6.2.1 as coded): fscr {lim['fscr']:g} MPa ({lim['why']['fscr']}), fscrT {lim['fscrT']:g} MPa ({lim['why']['fscrT']}), ftcr {lim['ftcr']:g} MPa",
              f"- axial force with the moments: {'concurrent N of the governing row (useN)' if R['useN'] else 'not used (useN false)'}; losses method {R['hog_method']}, time {R['time_days']:g} d"]
        L += [f"- {n}" for n in R["notes"]] + [""]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    from pdf2bim.runrecord import make as run_record
    out["run_record"] = run_record(a.description, doc, "girder_checks", allow_proposed=a.allow_proposed)
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=str)
    print("\n".join(L))


if __name__ == "__main__":
    main()
