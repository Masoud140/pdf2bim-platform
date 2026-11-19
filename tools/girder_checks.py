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


def prestress_md(pc):
    """Markdown of pdf2bim.design.prestress_checks: transfer stresses, debonding, development length (limits Standard - verify)."""
    T, D, V = pc["transfer"], pc["debonding"], pc["development"]
    w = T["worst"]
    L = ["### Prestress checks (transfer, debonding, development length) — limits transcribed, Standard - verify", "",
         f"- **Transfer** (f'cp {T['fci']:g} MPa; {T['note']}): compression u = **{w['uC']:.2f}** at x = {w.get('uC_x_m', 0):.2f} m; "
         f"tension u = **{w['uT']:.2f}** at x = {w.get('uT_x_m', 0):.2f} m against {T['ft']:.2f} MPa (0.25 sqrt f'cp), "
         f"**{w['uTa']:.2f}** against {T['fta']:.2f} MPa (0.5 sqrt f'cp, bonded steel within 200 mm of the tension face)" + ("" if T["ok_bonded"] else " — **EXCEEDS**")]
    if "ends" in D:
        L.append(f"- **Debonding** (TfNSW BTD 2011/06: <= {100 * D['max_fraction']:.0f} % per section, no adjacent debonded strands; "
                 + ("applies: client " + str(D["client"]) if D["applies"] else "not applicable unless the authority is TfNSW: client " + str(D["client"])) + "): "
                 + "; ".join(f"end {e}: {q['n_debonded']} of {q['n']} ({100 * q['worst_fraction']:.0f} %), adjacent pairs {len(q['adjacent_pairs'])}" + ("" if q["ok"] else " **FAIL**") for e, q in D["ends"].items()))
    else:
        L.append(f"- **Debonding**: not checked ({D['why']})")
    fl = V["flagged_stations"]
    L.append(f"- **Development length** Lp {V['Lp_min']:.0f}–{V['Lp_max']:.0f} mm (x2 for debonded strands); every strand fully developed beyond {V['full_from_A_m']:.2f} m from end A and {V['full_from_B_m']:.2f} m from end B. "
             + (("ULS stations inside a development length (those strands capped, ADR-073): " + ", ".join(f"{q['x_m']:.2f} m ({q['n_partial']})" for q in fl)) if fl else "No ULS station inside a development length."))
    C = pc.get("cover") or {}
    if C.get("rows"):
        bad = [q for q in C["rows"] if not q["ok"]]
        L.append(f"- Placement cover (AS 5100.5 Cl 4.14.2, verify): least clear cover {C['min_clear']:.0f} mm vs required {C['required']:.0f} mm "
                 f"({', '.join(f'{k} {v:.0f}' for k, v in C['terms'].items())}): " + ("OK" if not bad else f"**{len(bad)} strands short**")
                 + ("; maximum aggregate missing, 1.5 x aggregate not checked" if C["aggregate_missing"] else ""))
    return L + [""]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description", nargs="+", help="one description, or one per span in order (continuous spans, ADR-082)"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.combinations import combined_actions
    from pdf2bim.design.girder_design import checks_along
    from standards.accessor import Standards
    std = Standards()
    spans = []
    for f in a.description:
        d = json.load(open(f))
        g = build_geometry(d, allow_proposed=a.allow_proposed)
        S = build_sections(d, g, allow_proposed=a.allow_proposed)
        spans.append((d, g, S, build_integrated(d, g, S, std, allow_proposed=a.allow_proposed)))
    descs, a.description = a.description, a.description[0]
    doc, geo, S, M = spans[0]
    if len(spans) == 1:
        CA = combined_actions(doc, geo, S, M, std, allow_proposed=a.allow_proposed)
    else:
        from pdf2bim.model import continuous
        M = continuous.join([x[3] for x in spans])
        CA = continuous.combined_actions(spans, M, std, allow_proposed=a.allow_proposed)
    out = {}

    def tags(field):   # data-source tags of a girder-type table across the description (e.g. strand_pattern: Direct)
        ts = {r_.get("tag") for T_ in (doc.get("superstructure") or {}).get("supert_types") or [] for r_ in (T_.get(field) or {}).get("rows", [])}
        return " / ".join(sorted(t_ for t_ in ts if t_)) or "missing"
    L = ["# Super-T girder checks along the girders (P4.5 stage 6) — INDICATIVE", "",
         "Staged SLS (girder alone under prestress + Mnc, then composite), decompression Mdec, allowable moment Mal (Table 8.6.2.1 increments), "
         "cracking moment Mcr and minimum strength Muo >= 1.2 Mcr, ULS bending with the concurrent axial force. Effective prestress from the ported "
         f"losses analysis; inputs: strand pattern {tags('strand_pattern')}, bars {tags('bars')}, fitments {tags('fitments')} "
         f"(tags of the description){'; PROPOSED decisions used: ' + ', '.join(sorted({str(q.get('decision')) for q in M['provisional'] + S['provisional'] + geo['provisional'] if q.get('decision')})) if a.allow_proposed else ''}; "
         "standards values code-extracted-UNVERIFIED. "
         "**Not design-approved.** Free strains on the composite section: temperature-gradient primary strains (factors of the governing SLS row) and deck differential shrinkage (losses analysis). Shear / torsion by the general method. Solid-end zone stations: shear only (rectangular approx, Assumed ADR-039); flexure / SLS not applicable. Strand development not checked.", "",
         *([f"**Continuous spans (ADR-082):** {' + '.join(f'`{x}`' for x in descs)}: actions from the joined model (self weight on the simply supported spans, later loads "
            "continuous; staging provisional). The hogging capacity over the pier is the girder section's (deck reinforcement / stress bars not yet in the section, stage 4).", ""] if len(spans) > 1 else []),
         "SUMMARY", ""]
    i_sum = len(L)
    for k, (doc, geo, S, _) in enumerate(spans):
        if len(spans) > 1:
            CA["primitives"]["cases"]["thermal"] = CA["primitives"]["cases"]["thermal_spans"][k]   # this span's gradient profiles
        for g in S["girders"]:
            R = checks_along(doc, geo, S, CA, M, std, g, allow_proposed=a.allow_proposed)
            out[g] = R
            L += [f"## {g}", "", "### Sagging", "",
                  "| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |",
                  "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
            for r in R["rows"]:
                if r.get("conf") == "solid":
                    continue  # solid end zone: flexure / SLS checks not performed here (shear only; see shear table)
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
            hog = [r for r in R["rows"] if r.get("conf") != "solid" and r["hog"].get("Ms") is not None and (r["hog"]["Ms"] < r["hog"]["MdecT"] or r["hog"]["Mu"] < 0)]
            L += ["", "### Hogging / top face", ""]
            if hog:
                L += ["| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |", "|---|---|---|---|---|---|---|---|---|---|"]
                for r in hog:
                    h = r["hog"]
                    L.append(f"| {r['t']:.1f} | {f0(h['Ms'])} ({h['row_sls']}) | {f0(h['MdecT'])} | {f0(h['MalT'])} | {h['uST']:.2f} | {f0(h['Mu'])} ({h['row_uls']}) | {f0(h['phiMu'])} | {h['uB']:.2f} | {f0(h['Muo_min'])} | {f0(h['Muo'])} |")
            else:
                L.append("No station with a hogging ULS moment or an SLS moment below the top-face decompression moment.")
            ph = [r for r in R["rows"] if r.get("pier_hog")]
            if ph:
                L += ["", "### Hogging over the interior support (stress bars + deck reinforcement over the pier, ADR-082)", "",
                      "| end | x (m) | M* (ULS row) | N* | deck bars | phi Mu, no stress bars | phi Mu, bars at lock-off | M*/phi Mu (lock-off) | bar force required (kN) | UTS (kN) |",
                      "|---|---|---|---|---|---|---|---|---|---|"]
                for r in ph:
                    q = r["pier_hog"]; a_, b_ = q["no_bars"] or {}, q["at_lockoff"] or {}
                    lk = f"{f0(b_.get('phiMu'))} ({q['n_stress_bars']} x {q['lockoff_kN']:g} kN) | **{b_['uB']:.2f}**" if b_ else "— | —"
                    fr = "—" if q["F_required_kN"] is None else f0(q["F_required_kN"])
                    L.append(f"| {'A' if r['t'] == 0 else 'B'} | {q['x_m']:.2f} | {f0(q['Mu'])} ({q['row_uls']}) | {f0(q['Nu'])} | {q['deck_bars']} | {f0(a_.get('phiMu'))} | {lk} | "
                             f"{fr} | {q['uts_kN'] if q['uts_kN'] not in (None, '') else '**Missing - Flagged**'} |")
                L.append("Section at the girder end (solid end) with the strands at their decompression prestrain (none developed at the end), the deck bars over the pier and the stress bars "
                         "at the force shown (rigid-plastic; the bar strength is not on the drawings: 'bar force required' is what each bar must develop at ULS, to compare with the supplier's UTS). "
                         "M* at the model node on the bearing. Open stations on continuous runs include the typical deck bars and the long pier bars within their length.")
            lim = R["rows"][0]["limits"]
            L += ["", f"- crack-control limits (Table 8.6.2.1 as coded): fscr {lim['fscr']:g} MPa ({lim['why']['fscr']}), fscrT {lim['fscrT']:g} MPa ({lim['why']['fscrT']}), ftcr {lim['ftcr']:g} MPa",
                  f"- axial force with the moments: {'concurrent N of the governing row (useN)' if R['useN'] else 'not used (useN false)'}; losses method {R['hog_method']}, time {R['time_days']:g} d"]
            L += [f"- {n}" for n in R["notes"]] + [""]
            L += prestress_md(R["prestress"])
    S_ = ["## Summary (largest utilisation along each girder)", "", "| Girder | Ms*/Mal (SLS) | M*/phi Mu (ULS) | hogging M*/phi Mu (ULS) | shear / torsion u | Muo < 1.2 Mcr |", "|---|---|---|---|---|---|"]
    for g, R in out.items():
        fl = [r for r in R["rows"] if r.get("conf") != "solid"]
        uS = max(r["sag"]["uS"] for r in fl); uB = max(r["sag"]["uB"] for r in fl)
        uv = [r["shear"]["u"] for r in R["rows"] if "u" in r.get("shear", {})]
        uh = [r["hog"]["uB"] for r in fl if r["hog"].get("Mu") is not None and r["hog"]["Mu"] < 0 and r["hog"].get("uB") is not None]
        uh += [r["pier_hog"]["at_lockoff"]["uB"] for r in R["rows"] if (r.get("pier_hog") or {}).get("at_lockoff")]
        uH = f"{max(uh):.2f}{' **> 1**' if max(uh) > 1 else ''}" if uh else "—"
        S_.append(f"| {g} | {uS:.2f} | {uB:.2f}{' **> 1**' if uB > 1 else ''} | {uH} | {max(uv):.2f}{' **> 1**' if uv and max(uv) > 1 else ''} | "
                  f"{'yes' if any(not r['sag']['okMin'] for r in fl) else 'no'} |" if uv else f"| {g} | {uS:.2f} | {uB:.2f} | {uH} | — | — |")
    L[i_sum - 2:i_sum - 1] = S_ + [""]   # replaces the SUMMARY placeholder line
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    from pdf2bim.runrecord import make as run_record
    out["run_record"] = run_record(a.description, doc, "girder_checks", allow_proposed=a.allow_proposed)
    json.dump(out, open(a.out.replace(".md", ".json"), "w"), indent=1, default=str)
    print("\n".join(L))


if __name__ == "__main__":
    main()
