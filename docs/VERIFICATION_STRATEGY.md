# Verification strategy

**Purpose:** say how we know each layer gives the right answer, and what must pass before a result is used for design. Agreed 2026-10-23.

## 1. Levels of verification

| Level | What | Runs | Pass rule |
|---|---|---|---|
| **V1 Unit** | One function: geometry formula, section property, a load formula, a clause value | Every commit | Assert against a hand value with a stated tolerance |
| **V2 Model checks** | Automatic checks on every built model (list in §2) | Every model build and every run | All pass, or the run is marked **not for design** |
| **V3 Regression** | BR13A snapshot of key outputs with run record (`baseline/BR13A/`, P0.1); compare new runs to it | Every commit that touches C–F | T1 exact, or the difference is explained and the snapshot is updated by a reviewed commit |
| **V4 Benchmarks** | Independent solutions: textbook / worked examples, closed-form beams, MIDAS models built independently, Hambly-type grillage cases | Per module, before switching to it | Within stated tolerance |
| **V5 Cross-implementation** | Python core against the JavaScript dashboard on the same input during migration | Per migrated module | Within tolerance; differences explained |
| **V6 Engineer review** | Engineer reviews results, decisions and approximations | At each stage gate | Recorded as a decision |

## 2. Model checks (V2), run on every built model

- **Geometry:**
  - girder chords meet their bearings;
  - span = bearing-to-bearing distance;
  - deck edge and flange edges agree (G1 / G4 outer edge on the deck edge);
  - skew angles match the support lines.
- **Connectivity:** no free nodes; no duplicate nodes or members; every member has a role, a section and a material.
- **Boundary:** the stiffness matrix is not singular. Reactions add up to the applied load in each direction (equilibrium to 0.1 % of total load).
- **Diagnostics:** the first modes are not mechanisms; no very large stiffness ratios without a reason; rigid links are flagged.
- **Units:** the input field catalogue units are respected; no mixed mm / m.

## 3. Geometry validation cases (P1)

All four cases are required before the geometry engine is used:
1. straight alignment, square supports;
2. straight alignment, skewed supports;
3. curved alignment, straight girder chords, square supports;
4. curved alignment, straight chords, skewed supports (BR13A is close to this).

Each case has hand-checked coordinates. Transverse members are not assumed perpendicular to girders.

## 4. Tolerances — provisional test thresholds (approved 2026-10-23 for review, ADR-012)

**Status:** these are **initial engineering-software test thresholds**. They are not universal acceptance criteria for every bridge model. Each row must keep its justification. A row becomes a **release gate** only after the engineer has reviewed its justification and applicability.

**Overriding rules:**
1. **A passing tolerance never overrides** a failed physical check, an incorrect boundary condition, a modelling error or an unresolved discrepancy. Those are failures whatever the number.
2. When the engineering quantity or benchmark needs it, stricter or different criteria are set, and recorded here.
3. A tolerance compares an implementation with a **benchmark**. It says nothing about the uncertainty of the **inputs** (survey, drawing, Assumed values). Input uncertainty is recorded on the value itself (tag, significance), not in this table.

| # | Test quantity | Benchmark | Metric | Tolerance | Justification | Action if exceeded |
|---|---|---|---|---|---|---|
| T1 | Same-software regression (all snapshot quantities) | `baseline/BR13A/snapshot.json` from the same engine | \|a−b\| ≤ max(1e-12, 1e-9·max(\|a\|,\|b\|)) | exact (1e-9 relative) | Same code + same inputs must give the same numbers; only floating-point summation order may differ | Stop. Explain the difference (an intended change or a bug). Replace the reference only by a reviewed commit with the reason |
| T2 | Generated coordinates: nodes, bearing points, chord ends, deck and flange edges | Analytical geometry from the same inputs (hand / closed-form for the 4 P1 cases; dashboard values for BR13A) | Max point-to-point distance in plan and level | 1 mm | **Generation accuracy only.** Geometry formulas are exact; 1 mm allows numerical roundoff and series truncation (spirals) while staying far below construction tolerance. It does **not** cover survey or drawing uncertainty, which is often 5–20 mm and belongs to the input value | Find the formula / step at fault. For P1 the geometry module fails. Never widen the tolerance to absorb a drawing conflict; record the conflict as a query instead |
| T3 | Lengths and angles derived from coordinates (span, chord length, skew) | Same as T2 | Absolute difference | 1 mm; 0.001° | Follows from T2 (an angle over about 30 m: 1 mm ≈ 0.002°) | As T2 |
| T4 | Equilibrium of every load case, each direction | Applied loads of the same case | **Force:** \|ΣR + ΣF\| ≤ 0.1 % of Σ\|F\| (reference load = sum of absolute applied forces in that direction). **Moment** about the support-line midpoint: residual ≤ 0.1 % of Σ\|F\|·L_ref, with L_ref = span. Numerical floor 1e-6 kN | 0.1 % | A linear solve satisfies equilibrium to roundoff (about 1e-10 relative, as measured on BR13A SDL: 4.8e-10). 0.1 % flags lost loads, wrong load directions or unconnected members while ignoring precision noise | **Physical failure.** Do not use the results. Look for missing reactions (springs, links), loads off the model, or a mechanism. Not overridable by any other pass |
| T5 | Section properties A, I, centroid, shear areas | Independent calculation (hand / independent software) of the same geometry | Relative difference | 0.5 % | Polygon integration is exact; 0.5 % allows fillet / chamfer discretisation. Differences above this point to a geometry or definition error | Compare the outlines and the definition (product type, overrides). Do not proceed to P3 with that section |
| T6 | St Venant torsion J (open / closed cell) | Finite-difference or FE torsion solution, refined mesh (`claude/torsion_fd.py`) | Relative difference | 2 % | Torsion of thin-walled and composite sections is mesh-sensitive; 2 % is the convergence band seen in the FD study | Refine the mesh; check the cell idealisation |
| T7 | Modal periods | Independent MIDAS eigen model of the same structure: **same boundary conditions** (springs, bearings), **same mass source** (self weight + SDL, mass type stated: lumped or consistent), same stiffness assumptions | Modes paired by MAC ≥ 0.9 and the same dominant direction; compare only paired modes with effective mass ≥ 5 % in some direction; relative difference of T | 3 % | Modal periods depend on mass and stiffness representation (lumped vs consistent, rigid link mass, discretisation). 3 % separates those from real errors. **Unpaired or physically different modes are not compared;** mode order alone is not pairing | Check the mass source, boundary conditions and rigid-link mass. A mode in one model with no partner in the other is a finding to explain, not a tolerance pass |
| T8 | Member actions and reactions vs closed form (simply supported beam, single girder, uniform load / point load) | Closed-form solution | Relative difference at control points (midspan M, support V / R) | 2 % | Grillage of one girder should reproduce beam theory closely; 2 % allows shear deformation and discretisation | Find the stiffness / connectivity / load-position error |
| T9 | Grillage distribution vs refined model (multi-girder, skew) | Independent MIDAS grillage or plate model; Hambly-type benchmark cases | Relative difference of governing actions | 5 % | Grillage idealisation (transverse stiffness, torsion) legitimately differs from refined models; 5 % is a typical engineering band. **To be confirmed by the engineer per case** | Investigate the idealisation. A larger difference may be acceptable only by recorded engineer decision |
| T10 | Integrated model (substructure, springs) vs independent MIDAS model | Independent MIDAS model built from the same bridge description | Bearing, pile and headstock actions per case | 2 % (actions), 3 % (periods, see T7) | Same idealisation in both models, so differences should be small | As T8; boundary conditions first |
| T11 | Design capacities and stresses | Published / worked examples (each example referenced) | Relative difference of Mu, Vu, Tu, stresses, **and of the intermediate quantities** (dn, ku, strain) | 1 % | Strain-compatibility calculations are exact apart from fibre discretisation. Intermediate quantities must agree too: matching Mu with a different neutral axis (E-1) is a **failure** | Fix the engine before any design use |
| T12 | Pile head stiffness vs closed form (Hetenyi) | Beam on elastic foundation | Relative difference | 5 % (provisional) | The discretised spring model approximates a continuous foundation; measured 1.5 % on BR13A | Refine the spring spacing; check the soil input |
| T13 | Uniform temperature free elongation (girder with one free bearing) | αΔTL | Ratio | ±1 % | Measured −0.05 % … +0.49 % on BR13A; restraint from bearings and piles is small but not zero | Check the bearing restraint and link stiffness |

**Recording rule:** every test result records the row number (T1–T13), the benchmark used and the measured value. It does not record only pass / fail.

## 5. Current state of the tests (executed 2026-10-23)

- **Branch and code:** branch `p0.1-baseline`. The dashboard code is identical to step-b2-br13a `42dcec7`. Build sha256 `710b259d2c71…` (= v45).
- **The full record is in** `baseline/BR13A/test_run.md`: every script, its command, exit code, time and last output lines.
- **Assertion tests:**
  - schema: PASS (see `test_run.md`);
  - baseline comparator: 8 PASS / 0 FAIL;
  - baseline live (`BASELINE_LIVE=1`): the current build reproduces the reference exactly (0 differences in 953 quantities), and a perturbed input (girder E +3.4 %) is detected (755 differences).
- **Baseline consistency checks** (`baseline/BR13A/snapshot.json`): 14 PASS, 1 FAIL (H-2, SVG drawn with NaN / Infinity).
- **Print-only scripts:** they complete or fail with errors. **They do not assert;** completing is not a pass. Values worth noting:
  - engine `dsg_test`: Mu 68971 vs 68979, but dn 221.0 vs 240.9 and kuo 0.0935 vs 0.1019 (E-1);
  - `sub_t`: 2740.35 vs 2700.14 kN/m.
- **Format 0.2** (2026-10-24, branch `p0.2-format`): `tests/schema/test_format_0_2.py` 47 / 47 PASS (canonicalisation vectors, hash, worked example, rule-specific rejections, revision immutability, BR13A round trip). These test **record-keeping integrity**, not engineering values.
- **P3c imposed strains / horizontal / wind / earthquake** (2026-10-25, branch `p3-model`): 70 tests.
  - Closed forms (imposed strain and curvature, gradient integration, earth pressure, wind statics, SDOF RSA).
  - Isolation runs on the dashboard's model: thermal to 3e-7 kN, earthquake to 3e-6 relative, load totals equal.
  - Standards values (Ch, M1600 weight) unverified. **No independent MIDAS check yet** (T10, P4).
- **P3c traffic** (2026-10-24, branch `p3-model`): `tests/model/test_traffic.py` 20 / 20.
  - Independent brute force of the vehicle placement is equal to 1e-6; UDL and patterning by closed form / exact grid sum; lane factors.
  - Engine vs the dashboard with the dashboard's own distribution rule: 0.01 % (V5).
  - Standards values unverified. **No independent MIDAS moving-load check yet.**
- **P3b SDL / .mct / modes** (2026-10-24, branch `p3-model`):
  - loads 25 / 25: exact clipping, survey-coordinate precision, conservation of force and first moments, independent area and length integrations, T4 equilibrium; vs the dashboard total +0.3 %, distribution alone ≤ 8 %;
  - mct 16 / 16: round trip and dashboard parser. **No MIDAS import yet.**
  - modes 10 / 10: closed form within 1e-6; dashboard AN.modal reproduced to 4.5e-8. **T7 not met yet** (needs an independent MIDAS eigen model).
- **P3b integrated model** (2026-10-24, branch `p3-model`): `tests/model/test_substructure.py` 35 / 35 (closed-form bearing stiffness; V2 invariants: equilibrium, toe reactions = weight, bearing forces = superstructure weight; pile-head stiffness vs Hetényi +1.1 %; mechanism refusal; 4 / 4 mutations caught). Vs the frozen integrated model (V5): bearing Rz ≤ 5.6 %, pile toe ≤ 2.4 %, midspan ≤ 0.3 mm. Bearing stiffness coefficients **unverified** (standards data). Modes (T7) not yet available.
- **P3a solver and model** (2026-10-24, branch `p3-model`):
  - solver: 11 / 11 (closed form exact; dashboard integrated model reproduced to 7e-10, V5);
  - builder: 17 / 17 (V2 model checks; T4 equilibrium; vs the frozen superstructure: weight −1.2 %, deflection ≤ 2 %, reactions ±11 %, explained).
  - **No independent MIDAS model yet** (T10, P4).
- **P2 sections** (2026-10-24, branch `p2-sections`): `tests/sections/test_sections.py` 24 / 24 PASS. **T5 met** (30 published rows within 0.47 %); **T6 met** (exact closed-cell tube within 0.8 %). BR13A G2 / G3 composite vs the frozen model within 0.1 % (V5).
- **Full suite** (2026-10-25, commit `0e99431`): 35 scripts, 368 / 368 assertions PASS, 18 print-only ran (`baseline/BR13A/test_run.md`).
- **Earlier full suite** (2026-10-24, commit `48ee031`): 31 scripts, 298 / 298 assertions PASS, 18 print-only ran (`baseline/BR13A/test_run.md`).
- **Earlier full suite** (2026-10-24, commit `a0e719d`): 27 scripts, 226 / 226 assertions PASS, 18 print-only ran (`baseline/BR13A/test_run.md`).
- **Earlier full suite** (2026-10-24, commit `5e91a8f`): 23 scripts, 136 / 136 assertions PASS, 18 print-only scripts ran without software errors (`baseline/BR13A/test_run.md`). Live baseline 11 / 11 (`live_run.txt`).
- **P1 geometry** (2026-10-24, branch `p1-geometry`): `tests/geometry/test_geometry.py` 36 / 36 PASS. **T2 / T3 met** on the 4 closed-form cases (§3). BR13A: misclosure ≤ 2.2 mm, base point 0.3 mm, skew 0.002°. Deck widths vs the dashboard ≤ 2 mm (V5). Bearing nodes vs the dashboard 1.4–33 mm (explained, F-4). Mutation check: all 4 injected faults were caught.
- **Standards framework** (2026-10-24, branch `p0.3-standards`): `tests/standards/test_standards.py` 28 / 28 PASS. These are framework tests and an inventory-vs-code check. **No standards value is verified.**
- **Missing:**
  - assertions in the browser and engine scripts;
  - an independent MIDAS model of the integrated structure (T10);
  - the P1 geometry cases (T2–T3);
  - automatic V2 model checks on every build.

## 6. Gates before design use

A result can be used for design only when:
- V2 passes for that run;
- the modules it uses passed V1, V3 and V4;
- every Assumed / Model input it depends on has an engineer decision.

Until then, every report carries **"preliminary — not for construction"**.
