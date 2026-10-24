# BR13A integrated model: P3b vs the dashboard's frozen integrated model (self weight)

Both models are solved by the same Python solver (equal to the dashboard solver to 7e-10, `tests/model/test_solver.py`).
**Differences therefore come from the models themselves.** Cross-implementation comparison (V5), not a benchmark. Nothing here is independently verified.

- P3b model: 459 nodes, 696 members, 8 bearing links, 148 spring nodes. Status: **PROVISIONAL (proposed inputs: D-37, D-39, D-40, D-41)**; standards: **UNVERIFIED — standards data not approved**.
- Frozen model: 455 nodes, 687 members, 8 links.
- Equilibrium residual: P3b 6.5e-05 kN; frozen 1.8e-07 kN.

## Self weight (kN)

| Part | P3b | Frozen | Δ |
|---|---|---|---|
| superstructure | 4081.2 | 4130.5 | -1.2 % |
| sill | 1476.8 | 1477.1 | -0.0 % |
| piles | 2929.9 | 2929.9 | -0.0 % |
| total | 8488.0 | 8537.5 | -0.6 % |

## Bearings

Vertical: upward force on the girder (compression in the bearing). Along: horizontal force on the girder along its chord, + in the direction A → B (both models projected on the same P1 chord).

| Bearing | P3b Rz (kN) | Frozen Rz (kN) | Δ | P3b along (kN) | Frozen along (kN) | plan match (mm) |
|---|---|---|---|---|---|---|
| A-G1 | 617.8 | 609.8 | +1.3 % | 83.5 | 76.7 | 19 |
| A-G2 | 550.7 | 550.6 | +0.0 % | -19.8 | -33.6 | 1 |
| A-G3 | 487.1 | 516.2 | -5.6 % | -46.9 | -16.1 | 4 |
| A-G4 | 371.8 | 389.5 | -4.5 % | -16.5 | -26.4 | 25 |
| B-G1 | 368.7 | 355.5 | +3.7 % | 0.0 | 2.2 | 23 |
| B-G2 | 472.3 | 479.1 | -1.4 % | -0.0 | -2.0 | 1 |
| B-G3 | 546.1 | 533.1 | +2.5 % | -0.0 | -2.2 | 5 |
| B-G4 | 666.7 | 696.8 | -4.3 % | -0.0 | 1.8 | 33 |

## Piles (self weight)

| Pile | P3b toe Rz (kN) | Frozen toe Rz (kN) | Δ | P3b head ux, uy (mm) | Frozen head ux, uy (mm) | plan match (mm) |
|---|---|---|---|---|---|---|
| A1 | 1250.3 | 1230.5 | +1.6 % | 0.33, -0.43 | 0.17, -0.25 | 0 |
| A2 | 1101.2 | 1116.6 | -1.4 % | 0.10, -0.23 | 0.06, -0.15 | 1 |
| A3 | 996.7 | 1020.9 | -2.4 % | -0.13, -0.02 | -0.06, -0.05 | 0 |
| A4 | 919.5 | 938.5 | -2.0 % | -0.37, 0.19 | -0.18, 0.06 | 0 |
| B1 | 898.4 | 886.1 | +1.4 % | 0.17, 0.05 | 0.18, 0.03 | 0 |
| B2 | 923.9 | 917.0 | +0.8 % | 0.07, 0.13 | 0.12, 0.07 | 0 |
| B3 | 1052.8 | 1058.5 | -0.5 % | -0.02, 0.19 | 0.07, 0.09 | 0 |
| B4 | 1345.2 | 1369.4 | -1.8 % | -0.10, 0.24 | 0.03, 0.10 | 0 |

## Girder midspan deflection (mm)

| Girder | P3b uz | Frozen uz |
|---|---|---|
| G1 | -18.53 | -18.22 |
| G2 | -18.36 | -18.34 |
| G3 | -18.54 | -18.60 |
| G4 | -18.69 | -18.96 |

## Pile-head lateral stiffness, one pile alone (hand check, V2)

Pile A1: column above rock Lc = 10.47 m, socket Ls = 6.50 m, EI = 1.957e+06 kN·m², k = kh·D = 2.1e+05 kN/m², β = 0.4047 /m, βLs = 2.63 (< π: the socket is not 'long'; the semi-infinite hand value is a little stiff).

| Case | Stiffness (kN/m) |
|---|---|
| Model, rock springs only | 2731 |
| Hand (Hetényi semi-infinite socket + cantilever column) | 2700 |
| Model / hand | 1.011 |
| Model, rock + fill springs (as modelled) | 28051 |

## Geometry checks

| Check | Model | Description | Δ (mm) | Status |
|---|---|---|---|---|
| A: sill width (setout front - back) vs headstock.width | 1700.0 | 1700.0 | +0.0 | OK |
| A: pile heads on one straight sill soffit (max residual) | 0.4 | 0.0 | +0.4 | OK |
| A: piles on the line of bearings (max offset) | 0.7 | 0.0 | +0.7 | OK |
| A-G1: seat RL + bearings.height vs girder soffit | 125.2 | 150.0 | -24.8 | FLAG |
| A-G2: seat RL + bearings.height vs girder soffit | 119.5 | 150.0 | -30.5 | FLAG |
| A-G3: seat RL + bearings.height vs girder soffit | 99.8 | 150.0 | -50.2 | FLAG |
| A-G4: seat RL + bearings.height vs girder soffit | 109.3 | 150.0 | -40.7 | FLAG |
| B: sill width (setout front - back) vs headstock.width | 1700.0 | 1700.0 | +0.0 | OK |
| B: pile heads on one straight sill soffit (max residual) | 0.0 | 0.0 | +0.0 | OK |
| B: piles on the line of bearings (max offset) | 1.1 | 0.0 | +1.1 | OK |
| B-G1: seat RL + bearings.height vs girder soffit | 117.9 | 150.0 | -32.1 | FLAG |
| B-G2: seat RL + bearings.height vs girder soffit | 120.8 | 150.0 | -29.2 | FLAG |
| B-G3: seat RL + bearings.height vs girder soffit | 109.5 | 150.0 | -40.5 | FLAG |
| B-G4: seat RL + bearings.height vs girder soffit | 127.0 | 150.0 | -23.0 | FLAG |

## Known model differences (by design)
- Superstructure as in P3a (straight chords, varying sections, 2.0 m solid ends D-38, bearing centres on the support line): see `BR13A.superstructure_vs_frozen.md`.
- Bearing seats at the Direct mortar-pad RLs (D-41); bearing tops at the girder soffit; short links (100–127 mm). The frozen links run from the sill top to the girder node line (≈ 1.78 m).
- Sill centroid on its plan setout (D-39: 15 / 26 mm behind the line of bearings at A / B); soffit = straight line through the pile-head RLs. The frozen sill runs on the bearing line.
- Bearing fixed stiffness from analysis.bearing_fixed_stiffness (1e7 kN/m), as the frozen model.
- Not modelled in either: curtain wall (weight and stiffness), wingwalls, lateral restraint blocks, backfill / earth pressure (load cases), access / approach slab.
