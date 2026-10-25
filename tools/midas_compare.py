#!/usr/bin/env python3
"""P4.4: compare the platform's integrated model with MIDAS Civil results of the exported .mct.

    # 1. the platform's own tables (self weight, modes) in the .mct numbering, for the engineer:
    python3 tools/midas_compare.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --write-platform projects/BR13A/model/midas
    # 2. after the MIDAS run: put reactions.csv / beam_forces.csv / modes.csv / mode_shapes.csv (any subset) in a folder:
    python3 tools/midas_compare.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --midas <folder> --out projects/BR13A/model/BR13A.midas_compare.md

The .mct and its sidecar must come from the same description revision (tools/export_mct.py). Expected MIDAS headers and
sign conventions: pdf2bim/model/midas_compare.py COLUMNS / CONVENTIONS (UNCONFIRMED until the first real export).
"""
import argparse, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
KINDS = ("reactions", "beam_forces", "modes", "mode_shapes")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true")
    ap.add_argument("--write-platform"); ap.add_argument("--midas"); ap.add_argument("--out"); ap.add_argument("--load", default="SW"); ap.add_argument("--modes", type=int, default=10)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.mct import write_mct
    from pdf2bim.model.midas_compare import platform_tables, write_table, read_table, compare, CONVENTIONS
    from standards.accessor import Standards
    doc = json.load(open(a.description))
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, Standards(), allow_proposed=a.allow_proposed)
    _, rep = write_mct(M, doc)
    side = json.loads(json.dumps(rep, default=str))
    P = platform_tables(M, side, n_modes=a.modes, case=a.load)
    if a.write_platform:
        os.makedirs(a.write_platform, exist_ok=True)
        for k in KINDS:
            write_table(P[k], os.path.join(a.write_platform, f"platform_{k}.csv"), k)
        open(os.path.join(a.write_platform, "README.md"), "w").write(
            "# Platform results in the .mct numbering (P4.4)\n\n"
            f"Description revision {doc['revision']['number']}; load case `{a.load}` = self weight (the only case in the .mct); {a.modes} modes (consistent beam mass, links / springs massless).\n\n"
            "Files: `platform_reactions.csv`, `platform_beam_forces.csv`, `platform_modes.csv`, `platform_mode_shapes.csv` (MIDAS-style headers).\n\n"
            f"Conventions ({CONVENTIONS['status']}):\n\n" + "\n".join(f"- {k}: {v}" for k, v in CONVENTIONS.items() if k != "status") +
            "\n\nAfter the MIDAS run, export the same tables as CSV into a folder as `reactions.csv`, `beam_forces.csv`, `modes.csv`, `mode_shapes.csv` and run `tools/midas_compare.py ... --midas <folder>`.\n"
            "MIDAS must use the same mass source for the modes (self weight converted to mass, consistent mass) — otherwise periods differ by idealisation (T7).\n")
        print(f"platform tables written to {a.write_platform}")
    if a.midas:
        Mi = {}
        for k in KINDS:
            f = os.path.join(a.midas, f"{k}.csv")
            if os.path.exists(f):
                Mi[k] = read_table(f, k, load=None if k in ("modes", "mode_shapes") else a.load)
        if not Mi:
            raise SystemExit(f"no MIDAS tables found in {a.midas} (expected {', '.join(k + '.csv' for k in KINDS)})")
        C = compare(P, Mi)
        L = [f"# Platform vs MIDAS — {os.path.basename(a.description)} revision {doc['revision']['number']}", "",
             f"**Overall: {'PASS' if C['pass'] else 'NOT PASSED'}** (tolerances {C['tolerances']}). Conventions {CONVENTIONS['status']}.", ""]
        for k in ("reactions", "beam_forces"):
            if k in C:
                c = C[k]
                L += [f"## {k}", "", f"- compared values {c['compared']}; outside tolerance {len(c['outside_tolerance'])}; only platform {len(c['only_platform'])}; only MIDAS {len(c['only_midas'])}; {'pass' if c['pass'] else 'NOT passed'}",
                      "- worst: " + "; ".join(f"{q} {v['rel']:.2%} at {v['at']}" for q, v in c["worst"].items())]
                if "total" in c:
                    L.append(f"- total vertical reaction: platform {c['total']['platform'][2]:.1f}, MIDAS {c['total']['midas'][2]:.1f} kN ({c['total']['rel_FZ']:.2%})")
                L += [f"  - {b['key']} {b['component']}: platform {b['platform']:.2f}, MIDAS {b['midas']:.2f} ({b['rel']:.1%})" for b in c["outside_tolerance"][:30]] + [""]
        if "modes" in C:
            c = C["modes"]
            L += ["## modes", "", f"- {c['note']}"]
            for q in c.get("paired", []):
                L.append(f"- platform {q['platform_mode']} ↔ MIDAS {q['midas_mode']}: MAC {q['mac']:.3f}, T {q['T_platform']:.4f} vs {q['T_midas']:.4f} s ({q['rel']:.2%})")
            if c.get("unpaired_platform") or c.get("unpaired_midas"):
                L.append(f"- unpaired: platform {c.get('unpaired_platform')}, MIDAS {c.get('unpaired_midas')} — explain")
        out = a.out or os.path.join(a.midas, "comparison.md")
        open(out, "w").write("\n".join(L) + "\n")
        json.dump(C, open(out.replace(".md", ".json"), "w"), indent=1, default=str)
        print("\n".join(L))


if __name__ == "__main__":
    main()
