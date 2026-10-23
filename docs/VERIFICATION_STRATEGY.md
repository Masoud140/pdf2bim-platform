# Verification strategy

**Purpose:** say how we know each layer gives the right answer, and what must pass before a result is used for design. Agreed 2026-10-23.

## 1. Levels of verification

| Level | What | Runs | Pass rule |
|---|---|---|---|
| **V1 Unit** | One function: geometry formula, section property, a load formula, a clause value | Every commit | Assert against a hand value with a stated tolerance |
| **V2 Model checks** | Automatic checks on every built model (list in §2) | Every model build and every run | All pass, or the run is marked **not for design** |
| **V3 Regression** | BR13A snapshot of key outputs with run record; compare new runs to it | Every commit that touches C–F | Equal within tolerance, or the difference is explained and the snapshot is updated by a reviewed decision |
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

## 4. Tolerances (initial, to be confirmed by the engineer)

| Quantity | Tolerance |
|---|---|
| Coordinates | 1 mm |
| Section properties (A, I, J, centroid) | 0.5 % (FD torsion 2 %) |
| Equilibrium (reactions vs applied) | 0.1 % of total |
| Benchmark actions (M, V, reactions) | 2 % (grillage vs closed form 5 %) |
| Design capacities vs worked example | 1 % |
| Modal periods vs MIDAS | 3 % |

## 5. Current state of the tests (executed 2026-10-23 on the v45 build)

These are the results actually run on branch `docs/p0-architecture` (code = step-b2-br13a 42dcec7):

- **Build:** reproducible. sha256 of `dist/` = delivered v45 (`710b259d2c7117d0…`).
- **Schema tests** (`python3 tests/schema/test_schema.py`): 17 PASS, 0 FAIL.
- **Engine worked-example scripts** (print only, no asserts):
  - `dsg_test` ULS: Mu 68971 vs target 68979 (0.01 %). **However** dn 221.0 vs 240.9 and kuo 0.0935 vs 0.1019 (**about 8 % off**). The moment agrees but the neutral axis does not. **Open item E-1.**
  - `dsg_t2` (γ = 0.7 variant): Mu 68214.6 vs 68978.9 (1.1 %); dn 259.9 vs 240.9.
  - `dsg_t3` Ms 39591 vs 39590.6 ✓; `dsg_t4` 1.2 Mcr 40802 ✓.
- **Browser scripts** (print only):
  - `sub_t`: pile head stiffness 2740.35 vs Hetenyi hand 2700.14 kN/m (1.5 %);
  - `sl_t`: spring sums = applied (EP 22.2 / −21.5);
  - `tm_t`: chord elongation ratio ≈ 1.00;
  - `dg36_t`: runs, no errors, Mu 18326, LC4 sh.uL 0.383.
- **Not run in this session:** `eq_t`, `rx_t`, `wd_t`, `tg_t`, `x_t`, `gw_t`, `soil_t`, `dgxl_t`, `dgdoc_t`. They passed visual checks when their features were built, but they are not re-verified here.

**What is missing:**
- assertions (most tests only print);
- a regression snapshot (V3);
- an independent MIDAS model of the integrated structure (V4);
- automatic model checks (V2);
- the four geometry cases (§3).

## 6. Gates before design use

A result can be used for design only when:
- V2 passes for that run;
- the modules it uses passed V1, V3 and V4;
- every Assumed / Model input it depends on has an engineer decision.

Until then, every report carries **"preliminary — not for construction"**.
