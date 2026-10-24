# P3 model builder + callable core — method and results

**Status (2026-10-24): P3a done** (superstructure on rigid bearings) on branch `p3-model`. **P3b** (substructure, elastic bearings, MIDAS .mct writer, other load cases) is **not started**.

## 1. Solver — `pdf2bim/model/solver.py`

- Linear static 3D frame in kN and m:
  - Timoshenko beams (MIDAS axes: Iy = vertical bending with Asz; Iz = horizontal with Asy);
  - MIDAS-type elastic links (beta angle, shear springs at `dry` / `drz` of the length);
  - ground springs and fixed dofs;
  - self weight as a uniform load;
  - sparse LU.
- It **refuses a singular structure** (mechanism or missing support) instead of returning numbers.
- Output: displacements, reactions, spring forces, end forces, and an equilibrium residual.
- **Verification** (`tests/model/test_solver.py`, 11 / 11):

| Case | Benchmark | Result |
|---|---|---|
| Simply supported beam, self weight | wL/2, 5wL⁴/384EI, wL²/8 | Exact |
| Cantilever (along Y) | PL³/3EI, root PL | Exact |
| Timoshenko cantilever | + PL/(G·As) | Exact |
| Spring, link, mechanism | F/k; refusal | Exact / refused |
| **BR13A integrated model** (2730 dof: girders, deck, bearings as links, sill beams, piles, 312 soil-spring dofs) | Dashboard solver on the same model (V5) | Displacements equal to **7e-10 relative**; equilibrium 9e-8 kN on 8538 kN |

## 2. Superstructure builder — `pdf2bim/model/builder.py`

- It builds the dashboard's engineer-confirmed **"Super-T model 2"** (D-15) from the description + P1 + P2, on **straight chords**. Topology and rules are in the module docstring.
- **Members** (roles: girder, web, edge, midgap, slab, rigid, cross_girder, deck_end, bearing):
  - girder sections come from P2 along the girder, including the flare and the solid end blocks; nodes are placed at every zone boundary;
  - girder weight uses the **gross** girder + deck area;
  - deck strips are b × t with weight 0;
  - cross girders 800 × 1065 (D-37) keep their weight;
  - dummies are girder × 1e-3 and rigid members girder × 1e3 (the dashboard's choices, tag Model).
- **Bearings:** zero-length links in girder axes, vertical fixed; along / across from `bearings.items` (A fixed both ways, B free along the girder).
- **BR13A:** 275 nodes and 514 members. The transverse step is 2.797 m over 14 stations (dashboard: 2.7966 m, 14); the web offset is 0.4718 m (dashboard: 0.4718).

## 3. Verification (`tests/model/test_builder.py`, 17 / 17)

- **V2 model checks:**
  - no free or duplicate nodes, no zero-length members, every member has a role;
  - equilibrium (T4) closes;
  - total weight equals the independent Σ w·L;
  - only girders and cross girders carry weight;
  - 8 bearings on the bearing-centre nodes;
  - zone boundaries are nodes on every girder;
  - cross girders are continuous.
- **Versus the dashboard's frozen superstructure** (same solver, same bearings, substructure removed; `projects/BR13A/model/BR13A.superstructure_vs_frozen.md`):

| Quantity | P3 | Frozen | Δ |
|---|---|---|---|
| Self weight | 4081.2 kN | 4130.5 kN | −1.2 % |
| Bearing reactions | A 699 / 409 / 555 / 363; B 342 / 562 / 423 / 728 kN | A 672 / 444 / 580 / 370; B 329 / 579 / 381 / 776 kN | −7.9 … +11.1 % |
| Midspan deflection | 17.3–17.5 mm | 17.2–17.7 mm | ≤ 2 % |
| Load concentration at the obtuse corners (A-G1, B-G4) | yes | yes | same behaviour |

- **The differences are explained by the model changes**, not by errors:
  - chords vs curves (265 mm);
  - flare in the sections;
  - exact 2.0 m solid zones vs mesh-quantised blocks (the frozen blocks are longer at B: 2.4 m beyond the bearing for G2, ANALYSIS_METHOD §8);
  - bearing centres on the straight support line (F-4).
- The frozen figures reproduce ANALYSIS_METHOD §6 (4130.5 kN; A 673 / 444 / 580 / 369). This independently confirms the comparison set-up.
- **This is not verification of the structure.** An independent MIDAS model remains P4.

## 4. Provisional inputs (BR13A)

| Decision | Content |
|---|---|
| D-34 | Support bearing |
| D-35 | Super-T shape |
| D-36 | Haunch 0 (Assumed) |
| D-37 | Cross girder 800 × 1065 (engineer query answer) |
| D-38 | Solid end zones 2.0 m (interpretation pending, Task B-1) |

All of these are **proposed**, so every P3 result is PROVISIONAL.

## 5. Not yet done (P3b)

- Substructure: sill beams, columns / piles and soil / rock springs from `supports[]`; bearings as elastomeric links from the bearing data.
- Load cases beyond self weight: SDL, traffic, temperature and the others; then combinations via the standards data.
- MIDAS .mct writer. Its syntax must be verified by import (MCT_EXPORT_METHOD §0), so it needs an engineer import test.
- Per-element deck-strip tributary at the skewed ends (MEMBER_PROPERTIES Stage A); for now the end stations use a half step.
- Shear areas Asy for girders (Asy = none, so horizontal shear deformation is ignored); the girder Asz uses the webs only.
- Run records (input hash, engine commit, settings) on analysis results.
