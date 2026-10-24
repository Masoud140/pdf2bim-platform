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
| D-39 | Sill beam plan setout, structured from the takeoff (P3b) |
| D-40 | Elastomer layer thickness 12 mm (Assumed, P3b) |
| D-41 | Bearing seat RLs (Direct, from the takeoff; girder assignment by order, P3b) |

All of these are **proposed**, so every P3 result is PROVISIONAL.

## 5. P3b stage 2 — integrated model (`pdf2bim/model/substructure.py`, `bearings.py`)

`build_integrated(doc, geo, S, std, allow_proposed)` = the P3a superstructure (bearings left unsupported) + per support:

| Part | How it is built | Inputs (BR13A tag) |
|---|---|---|
| Sill beam | Straight beam line parallel to the line of bearings, at the centroid of the plan setout (front / back faces, start / end). Soffit = least-squares straight line through the pile-head RLs; centroid = soffit + d / 2. Nodes at both ends, every pile and every bearing | `headstock_setout` (D-39, Direct / Calculated, proposed); `headstock.depth` (Direct) |
| Piles | Vertical columns rl_top → rl_toe. Nodes at the rock level, the ground at the pile and every soil-layer top (cut levels within 50 mm merged, rock level kept), then pieces of about `column_segment` | `piles[]` (Direct / Calculated); `ground_rl` (Assumed, D-12) |
| Springs | Global X and Y at each pile node: k = kh · D · tributary length (rock below rl_rock; soil layers between ground and rock) × `soil_factor` | `rock_kh` 200, fill kh 10 MN/m³ (Assumed) |
| Pile toe | `analysis.pile_toe`: vertical only (Z fixed) | Model |
| Bearings | Seat node at `seat_rl` under the P1 bearing centre; top node at the girder soffit (girder line node − D); vertical link seat → top with local z along the chord: (Kv, across, along). Fixed = `bearing_fixed_stiffness` (1e7), free = 0, elastic = Ks. Rotations free | `seat_rl` (D-41, Direct, proposed); plan size / T / G (Assumed); layer 12 mm (D-40, Assumed) |
| Bearing stiffness | Ks = G A / T; S = ab / (2(a+b)t); Ec = 6 G S²; 1/Eeff = 1/Ec + 1/2000; Kv = Eeff A / T. The 6 and the 2000 MPa come from `standards/data/AS5100.4.json` (**code-extracted-unverified**); results carry the UNVERIFIED label | — |
| Rigid offsets | Massless, sill section × 1e3: sill → pile head, sill → seat, girder node → bearing top | Model |

**Not modelled:** curtain wall, wingwalls, lateral restraint blocks, backfill / earth pressure (load-case stage), access slab.

**Solver change:** `solve()` now refuses a numerically singular system. Previously a structure with no lateral support was "solved" (814 m displacement): the LU factorisation does not raise on round-off pivots. New refusals: LU pivot ratio < 1e-13 (a mechanism gives ~1e-16, the valid BR13A models ~1e-8), and a free-dof residual > 1e-4 of the largest load term. `Model.link_force(lid)` returns the link forces.

### 5.1 Verification (`tests/model/test_substructure.py`, 35 / 35)

- **Closed form:** Ks, Kv by the hand formula; pile discretisation rules; Hetényi formula limit (column length 0 → k / 2β).
- **Invariants:**
  - equilibrium residual < 1e-6 of the weight;
  - pile-toe vertical reactions = total weight;
  - bearing vertical forces = superstructure weight;
  - horizontal spring and bearing forces sum to zero under gravity;
  - sill weight = b d L γ; pile weight = πD²/4 L γ;
  - rock and fill springs sum to kh D × length;
  - sill centroid = pile-head RL + d / 2;
  - link stiffness vector and axes.
- **Hand check (V2):** pile A1 head stiffness with rock springs only is 2731 kN/m vs Hetényi 2700 kN/m (+1.1 %). βLs = 2.63 < π, so the semi-infinite hand value is slightly stiff.
- **Refusals:**
  - without `allow_proposed` the build is refused;
  - with zero soil / rock stiffness the solve is refused as a mechanism.
- **Mutation check:** 4 / 4 injected faults caught (Ks formula, sill level sign, rock-spring extent, across / along swap). Two were caught only after two tests were added.

### 5.2 BR13A vs the frozen integrated model (V5, `projects/BR13A/model/BR13A.integrated_vs_frozen.md`)

| Quantity | P3b vs frozen |
|---|---|
| Weight: superstructure / sill / piles / total | −1.2 % / −0.0 % / −0.0 % / −0.6 % (8488 vs 8538 kN) |
| Bearing Rz | −5.6 % … +3.7 % |
| Pile toe Rz | −2.4 % … +1.6 % |
| Girder midspan uz | within 0.3 mm (−18.4 … −18.7 mm) |
| Fixed-bearing (A) along forces | Self-equilibrating in both (sum ≈ 0); their split differs (e.g. A-G3 −47 vs −16 kN), since the frozen links are 1.78 m long and these are 0.10–0.13 m. Sensitive to the link idealisation; to be read with the restraint-block detail |

**Findings for the engineer (not resolved by the AI):**
- **F-5:** the abutment drawings' bearing positions along the line of bearings (A: 4977 / 2251 / −810 / −3706 mm from the SOP; B: −3708 / −812 / 2249 / 4976 mm) differ from the P1 bearing centres (girder line ∩ support line, from the GA girder setout) by **50–530 mm**. The model uses the P1 centres. Which is correct must be confirmed against DRG 202100 / 202101 and the GA.
- **F-6:** the Direct seat RLs sit 100–127 mm below the P1 girder soffit, but the Assumed bearing height is 150 mm (−23 to −50 mm). Both the bearing height (Assumed) and the haunch (D-36, Assumed 0) feed into this. The model takes the drawn levels; the bearing height is not used for geometry.

## 6. Not yet done (P3b, remaining)

- Load cases beyond self weight: SDL, traffic, temperature and the others; then combinations via the standards data.
- MIDAS .mct writer. Its syntax must be verified by import (MCT_EXPORT_METHOD §0), so it needs an engineer import test.
- Modes (T7): no eigen-solver in the Python core yet.
- Per-element deck-strip tributary at the skewed ends (MEMBER_PROPERTIES Stage A); for now the end stations use a half step.
- Shear areas Asy for girders (Asy = none, so horizontal shear deformation is ignored); the girder Asz uses the webs only.
- Run records (input hash, engine commit, settings) on analysis results.
