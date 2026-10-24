#!/usr/bin/env python3
"""Natural modes: P3b integrated model vs the dashboard's frozen integrated model (cross-implementation, V5 — NOT T7,
which needs an independent MIDAS eigen model). Also records the check of the Python modal solver against the dashboard's
own AN.modal on the same frozen model.

    python3 tools/compare_frozen_modes.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.modes_vs_frozen.md

Mass source for both models: member self weight as in the static analysis (deck strips, dummies and rigid members
massless; composite girders carry the gross deck + girder weight) + SDL as lumped translational mass = |SDL nodal load| / g
(P3b: its own SDL case; frozen: the dashboard's SDL nodal loads). Consistent beam mass (as the dashboard).
"""
import argparse, json, math, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT, "tools"))
from compare_frozen_integrated import frozen_model

G = 9.80665
N_MODES = 12


def dominant(m):
    d = max(m["eff"], key=lambda k: m["eff"][k])
    return d, m["eff"][d]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.loads import sdl_case
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    C = sdl_case(doc, geo, M, allow_proposed=a.allow_proposed)
    F = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
    FS = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_sdl.json")))
    FM = json.load(open(os.path.join(ROOT, "tests/model/fixtures/br13a_dashboard_modes.json")))
    base = next(r["cells"] for r in doc["project"]["base_point"]["rows"]); base = (base["E"], base["N"])
    # 1. solver check: dashboard AN.modal mass (every member weighted: deck strips and dummies too) on the frozen model
    F2 = json.loads(json.dumps(F))
    for e in F2["els"]:
        if e["sec"].startswith("TD") or e["sec"].startswith("DUM"):
            e["w"] = 25.5 * e["A"]     # what the dashboard's modal prepare does (no weightOn): finding H-3
    chk = frozen_model(F2, base).modes(len(FM["modes"]))["modes"]
    dT = max(abs(x["T"] / y["T"] - 1) for x, y in zip(chk, FM["modes"]))
    # 2. P3b vs frozen, same mass rules
    mp = M["model"].modes(N_MODES, extra_mass={k: -f[2] / G for k, f in C["loads"].items()})
    mf_model = frozen_model(F, base)
    mf = mf_model.modes(N_MODES, extra_mass={l[0]: -l[3] / G for l in FS["loads"]})
    prov = sorted({str(p.get("decision")) for p in M["provisional"] + C["provisional"] if p.get("decision")})
    L = ["# BR13A natural modes: P3b vs the dashboard's frozen integrated model", "",
         "**Cross-implementation comparison (V5), not T7.** T7 needs an independent MIDAS eigen model with the same boundary conditions and mass (P4).", "",
         f"- Status: **PROVISIONAL** (inputs {', '.join(prov)}). Mass: member self weight as in the static analysis + SDL lumped (|nodal SDL| / g). Consistent beam mass.",
         f"- Total mass in the free dofs (X): P3b {mp['mass_t'][0]:.1f} t, frozen {mf['mass_t'][0]:.1f} t.", "",
         "## Python modal solver vs the dashboard's AN.modal (same frozen model, same mass)", "",
         f"{len(FM['modes'])} modes: largest period difference **{dT:.1e}** (relative). The dashboard's modal routine weights every member, "
         "including the deck strips and dummies whose weight is already inside the composite girders (+836 kN, +9.8 % mass): **finding H-3** "
         "(affects the dashboard's earthquake response spectrum, which uses the same routine). The P3b analysis does not do this.", "",
         "## Modes (lowest 12)", "",
         "| # | P3b T (s) | dominant (eff.) | Frozen T (s) | dominant (eff.) | ΔT |", "|---|---|---|---|---|---|"]
    for i, (x, y) in enumerate(zip(mp["modes"], mf["modes"]), 1):
        dx, ex = dominant(x); dy, ey = dominant(y)
        L.append(f"| {i} | {x['T']:.4f} | {dx} {ex:.2f} | {y['T']:.4f} | {dy} {ey:.2f} | {100 * (x['T'] / y['T'] - 1):+.1f} % |")
    # pair the main modes by direction: the mode with the largest effective mass in X, Y, Z
    L += ["", "## Main mode per direction (largest effective mass)", "", "| Direction | P3b T (s), eff. | Frozen T (s), eff. | ΔT |", "|---|---|---|---|"]
    pairs = {}
    for d in "XYZ":
        x = max(mp["modes"], key=lambda q: q["eff"][d]); y = max(mf["modes"], key=lambda q: q["eff"][d])
        pairs[d] = (x["T"], x["eff"][d], y["T"], y["eff"][d])
        L.append(f"| {d} | {x['T']:.4f}, {x['eff'][d]:.2f} | {y['T']:.4f}, {y['eff'][d]:.2f} | {100 * (x['T'] / y['T'] - 1):+.1f} % |")
    L += ["", "Global X / Y are the MGA east / north axes (the bridge runs roughly east-west). Modes are paired here by order and dominant direction only; "
          "a MAC pairing on common points is not done (the two meshes differ).", "",
          "## Known model differences", "- As `BR13A.integrated_vs_frozen.md`: straight chords, varying sections, short bearing links at the drawn seat levels, sill on its setout.",
          "- SDL mass follows each model's own SDL nodal loads (`BR13A.sdl_vs_frozen.md`)."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    json.dump({"solver_vs_dashboard_dT": dT, "p3b": [{"T": q["T"], "eff": q["eff"]} for q in mp["modes"]], "frozen": [{"T": q["T"], "eff": q["eff"]} for q in mf["modes"]],
               "pairs": pairs, "mass_t": {"p3b": mp["mass_t"], "frozen": mf["mass_t"]}}, open(a.out.replace(".md", ".json"), "w"), indent=1)
    print("\n".join(L[4:]))


if __name__ == "__main__":
    main()
