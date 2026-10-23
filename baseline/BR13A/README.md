# BR13A baseline (P0.1) — reference snapshot of the current implementation

**Purpose:** detect regressions while the platform is rebuilt (P1–P4). The baseline records what the **current software** produces for BR13A, and exactly how to reproduce it.

> **It is not a set of correct answers.** Reproducible does not mean right. Every quantity is tagged `indicative`, with the reasons it cannot yet be relied on. Agreement with this baseline shows that the software has not changed; it does not show that the engineering is correct.

## Files

| File | What |
|---|---|
| `snapshot.json` | The reference: run record, 953 quantities (each with unit, status and reasons), 15 consistency checks, limitations |
| `SNAPSHOT_SUMMARY.md` | Readable tables generated from `snapshot.json` (`tools/summarise_snapshot.py`) |
| `test_run.md` | Record of running every existing test script on the same commit (`tools/run_suite.py`) |

## Baseline identity

- **Code:** branch `p0.1-baseline`, created from `docs/p0-architecture` @ `7d00263`. The dashboard sources (`src/`, `base/`, `build.sh`, `vendor/`) are identical to `step-b2-br13a` @ `42dcec7`; `git diff 42dcec7 7d00263 -- src base build.sh vendor` is empty.
- **Dashboard:** `dist/BR13A_grillage_dashboard.html`, built by `./build.sh`, sha256 `710b259d2c7117d0…` (= the delivered v45).
- **Inputs:**
  - the dashboard's embedded data: `P` parameters (stored in full in `snapshot.json` → `run.settings`) and the frozen MIDAS .mct (sha256 recorded);
  - the bridge description and decision log hashes are recorded for traceability only. **The dashboard does not read them yet (B-1).**
- **Settings:** combination options `CBX.opt()` (stored); model size (455 nodes, 687 elements, 8 bearing links, 156 springs, 2 constraint groups).
- **Environment:** Node 22.22.0, Playwright 1.56.0, Chromium 141.0.7390.37.

## What is captured

Captured on 2026-10-23:
- geometry: chord lengths and offsets of G1–G4;
- section properties: the 8 girder sections in the model (A, Iy, Iz, J, Asy, Asz), plus the design section;
- pile head stiffness (model and hand);
- self-weight midspan displacements;
- modal periods and effective masses (6 modes);
- uniform-temperature elongations;
- bearing actions for every bearing and direction: DL, SDL, M1600, ULS and SLS envelopes;
- girder actions per girder (M, V, T, N; DL / SDL / M1600 / ULS / SLS envelopes);
- pile ULS envelopes (N, Ml, Mt) per pile;
- headstock ULS envelopes;
- Super-T design results at LC1–LC4 and at 48 stations (uS, uST, uB, uL, Mu, φMu, dn, prestress).

## Verified vs indicative

| Category | Content | How to read it |
|---|---|---|
| **Consistency checks** (15, evaluated in each run) | Statics: SDL reactions = applied SDL. Closed form: pile stiffness vs Hetenyi; temperature elongation vs αΔTL. Mass bookkeeping. Software: no exceptions, run complete, SVG drawing. | 14 PASS, 1 FAIL (`chk.no_svg_nan`, see below). A pass shows **internal consistency of the software only**. The inputs and the engineering rules are not validated by these checks. |
| **Indicative quantities** (953) | Everything else | Reproducible regression values. Not verified. Reasons are listed per quantity, for example: Assumed inputs (568), unverified standard values (595), no independent MIDAS model (705), combination approximations (474), placeholder strands (215), design engine discrepancy E-1 (166) |
| **Verified reference results** | — | **None yet.** Values become verified only after V4 benchmarks (an independent model, closed-form cases, worked examples) and engineer review. |

## Findings recorded by this baseline (not fixed; for review)

- **H-2 — plots drawn with NaN / Infinity coordinates.** 88 browser console errors per run (SVG `line` / `rect` / `path` attributes). No calculation exception, but some plot has invalid input. To locate in P3 / P5 work.
- **D-3 — end region of the girder.**
  - Along the girder, the design gives max uB 1.171 and max uL (shear / torsion) 3.966 at x = 0.75 m.
  - The design section has no solid-end zones defined (`zones` empty).
  - The values come from the placeholder strand layout and are indicative. **Engineer review is needed** before reading anything into them: the end-block definition, the solid zone length and the transfer / development length.
- **E-1 (known):** at LC1 the design engine gives dn 239.0 mm on this section; the neutral-axis discrepancy against the worked example remains open.
- **F-1 / pedestrian:** the engine reports the pedestrian case as missing (`PED: 1142` combination rows) and takes it as 0.

## Reproduce

```bash
./build.sh                                                     # sha256 must be 710b259d2c7117d0...
export NODE_PATH=/path/to/node_modules                         # Playwright 1.56 (cloud workspace: /opt/npm-tools/node_modules)
node tools/baseline_snapshot.js --out /tmp/now.json            # about 100 s; CHROMIUM=/path/to/chromium if not /opt/pw-browsers/chromium
python3 tools/compare_snapshot.py baseline/BR13A/snapshot.json /tmp/now.json          # exact mode; exit 0 = no regression
python3 tests/baseline/test_baseline.py                        # fast comparator tests
BASELINE_LIVE=1 python3 tests/baseline/test_baseline.py        # + live run and a perturbed-input run (about 4 min)
python3 tools/run_suite.py                                     # every existing test script -> baseline/BR13A/test_run.md
```

## Rules for using the baseline

- Any change to engine code is compared in **exact** mode.
- Every difference must be explained before the reference is replaced. Replacing `snapshot.json` is a reviewed change, with its reason in the commit and in `CURRENT_STATUS.md`.
- When a new implementation (the Python core) is compared with the dashboard, use **engineering** mode with the tolerances in `docs/VERIFICATION_STRATEGY.md` §4.
- **A pass in engineering mode never overrides** a failed physical check, a wrong boundary condition or an unexplained discrepancy.
