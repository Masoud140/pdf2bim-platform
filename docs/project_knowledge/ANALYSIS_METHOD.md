# Independent Frame / Grillage Analysis Method (drawings -> model -> own solver -> compare with MIDAS)

> Status note 2026-11-17: historical (BR13A dashboard v30). The solver now lives in the platform (`pdf2bim/model/`, repo `docs/P3_MODEL_METHOD.md`) and **has been compared with MIDAS**: every node within 0.013 mm and every element force within about 1 % (2026-10-28, `MCT_EXPORT_METHOD.md` §1d). The formulation, sign conventions and validation recipe below still apply; the "not yet done" statements are superseded.

Status: built and validated on BR13A, Oct 2026 (dashboard v30, "Analysis" tab). Comparison with MIDAS NOT yet done.
Code in this project: `claude/analysis_core.js` (solver), `claude/analysis_live_model.js` (live model builder),
`claude/analysis_ui.js` (tab), `claude/analysis_test.js` (validation), `claude/analysis_ref_solver.py` (numpy cross-check).
Companions: `MCT_EXPORT_METHOD.md` (file syntax), `MEMBER_PROPERTIES_METHOD.md` (section properties), `GRILLAGE_PIPELINE_LESSONS.md`.

## 1. Why an independent solver
- MIDAS is a black box for a first model; an own solver on the SAME mesh, sections, supports and loads shows whether a
  difference is a modelling input or a software setting. It also lets the dashboard answer "what happens if I change X" live.
- Rule: one model definition, two solvers. The MCT text is the exchange format; the solver reads it (or the live dashboard builds the
  same content in memory). Never hand-type a second copy of the model.

## 2. Formulation (all in kN, m, tonne; global Z up)
- Element: 3D beam, 12 dof, **Timoshenko** (shear deformation on by default, toggle off for Euler-Bernoulli).
  `phi_y = 12 E Iz/(G Asy L^2)` for x-y bending, `phi_z = 12 E Iy/(G Asz L^2)` for x-z bending. G = E/(2(1+nu)).
- **Axis convention (MIDAS, beta = 0):** local x = node1 -> node2; local z = global Z projected (up): `y = normalise(Z x x_hat)`, `z = x_hat x y`. Vertical elements: y = global Y. **Iy = vertical bending (strong), Iz = horizontal; Asz vertical shear, Asy horizontal.**
  The dashboard section table uses the opposite NAMES (Iz vertical); the solver reads MIDAS names, the live builder swaps.
- Mass: consistent translational (Hermite, 156/22L/54/-13L ... with the w-theta_y signs flipped), axial m/6[2 1], torsional inertia
  `Ip = mu (Iy+Iz)/A` per length. mu = w/g (g = 9.80665). Total mass check: sum(mu L) = weight/g (BR13A 421.2 t).
- Loads: uniform self weight, gravity direction from `*SELFWEIGHT`. Rotate to local `q = R g w`; fixed-end vector
  `[qx L/2, qy L/2, qz L/2, 0, -qz L^2/12, qy L^2/12 | ... qx L/2, qy L/2, qz L/2, 0, qz L^2/12, -qy L^2/12]`.
- Assembly: dense K on free dofs only (1,658 of 1,674 for BR13A), Cholesky factor once. Throws if not positive definite
  = mechanism or missing support (good diagnostic; message names the free dof).
- Reactions: sum over attached elements of `Kg u - fg` at the fixed dofs (no need to store fixed rows).
- Member end forces (local): `f = K_l T u - f_eq`  (forces the nodes exert on the element).
- Section forces at x from node i, from the free body [0,x]: `S = -f1 - q x` for N, Vy, Vz; `T = -T1`;
  `My = -My1 - x Vz1 - qz x^2/2`, `Mz = -Mz1 + x Vy1 + qy x^2/2`. Exact for uniform load.
- **Sign conventions for diagrams:** sagging moment = **-My** (My is hogging-positive with z up). Conventional vertical shear = **-Vz**
  (positive when the left face is pushed up; a simple support starts positive). For an element traversed against its own direction
  (chain orientation) shear and torsion change sign; sagging does not.
- Modal: subspace iteration on K^-1 M with Rayleigh-Ritz (generalised small eigenproblem by Cholesky + Jacobi), ~40 iterations max,
  stops on 1e-7 change. Effective mass fraction = (phi^T M r)^2 / total mass with phi M-normalised. Modes with ~0 % effective
  mass are LOCAL (a cross girder or link rotating on soft neighbours) - not structural modes.
- Performance: 1,674 dof, 513 elements: assembly + Cholesky + static ~3 s, +6 modes ~4 s in the browser. Run in staged setTimeout steps so the page stays alive.

## 3. Weight rules (engineer decisions on BR13A)
- Composite girder sections carry girder + deck above: weight uses the **gross part areas** (Ag + Ad, G2-M 1.056 m2 -> 26.93 kN/m,
  G2-E 1.946 m2 -> 49.62 kN/m), NOT the transformed area (that is a stiffness quantity).
- **Deck transverse strips (TD) weight = 0** (engineer: avoids double counting the deck already inside the composite).
- DUM (nominal) and RIG (rigid) links weight = 0. Cross girders (XG, 800 x 1065 at the support lines) KEEP weight (real member)
  - tab has per-group checkboxes. If MIDAS gives DUM/RIG weight, zero it there or totals will not match.

## 4. Supports (engineer instruction: keep it simple)
- Bearing node = the girder-line node at the skewed bearing line of each girder (CHA / CHB with skew). BR13A nodes:
  A: G1 44, G2 101, G3 157, G4 212 -> **Dx, Dy, Dz fixed**; B: G1 55, G2 112, G3 168, G4 223 -> **Dz only**.
  (The engineer wrote "Dx, Dy" for the right end; as written the model has no vertical support at B and is unstable, so Dz was fixed.
  Confirm the intent.)  Rotations free. Springs for elastomeric bearings are a later refinement (DRG 202280-282, Table 1 on 281).
- MIDAS syntax (copied from the engineer's native MCT; import of this file not yet confirmed):
  `*STLDCASE` / `SW, D, desc`;  `*CONSTRAINT` / `node list, Dx Dy Dz Rx Ry Rz Rw as 7 digits, group` e.g. `44 101 157 212, 1110000, name`;
  `*USE-STLD, SW` then `*SELFWEIGHT` / `0, 0, -1, group`. Node lists accept spaces, `a to b`, `a to b by n`.

## 5. Validation recipe (do all of these for any new model)
1. Simply supported beam, uniform load: reaction wL/2, mid deflection 5wL^4/384EI, M = wL^2/8 (matched exactly: 60, -0.00125, 150).
2. Cantilever: tip wL^4/8EI, root moment wL^2/2 (matched: -0.012, 600).
3. Frequency of the SS beam against the closed form (use the weak axis if it is lower - the lateral mode appeared first: 7.97 Hz).
4. Equilibrium: sum of support Rz = total weight (BR13A error 0.0000 kN).
5. Independent re-implementation (`analysis_ref_solver.py`, numpy/scipy sparse): displacements agree to 1.5e-11, reactions identical.
6. Hand calculation of one girder (section 7) - arithmetic must reproduce solver reactions for the same loads.
7. Mesh sensitivity: change spacing, confirm total weight is stable (BR13A is NOT - see section 8).

## 6. BR13A results (default mesh, 2.8 m spacing, weights per section 3)
- Total weight 4,130.5 kN (421.2 t); max deflection 17.9 mm (node 259); f1 4.22 Hz (50 % mass Z), f2 4.40 Hz (46 % mass Y).
- Reactions Rz (kN): A 673.0 / 443.9 / 579.7 / 369.2 (G1-G4); B 330.5 / 580.4 / 380.1 / 773.7. Sum of each end 2,065 kN: load shifts
  to the obtuse corners (G1 at A, G4 at B) - 34.5 deg skew with a stiff skew cross girder on the support line.
- Peak sagging moment (kN.m): G1 2,532 (s 13.9 m), G2 2,569 (14.5), G3 2,606 (15.1), G4 2,660 (16.2).

## 7. Hand calculation template (girder G2, isolated, own weight)
- Span between bearings L = 28.957 m (bearings at s = 0.565 and 29.522 m of a 30.101 m girder). Mid w 26.93 kN/m, solid end block 49.62.
- Uniform check wL^2/8 = 2,823 kN.m. End block correction: extra dw = 22.69 over a = 1.379 m (A) and b = 2.447 m (B):
  P_A 31.3 kN at 0.69 m, P_B 55.5 kN at 1.22 m. R_A = wL/2 + P_A(L-a/2)/L + P_B(b/2)/L = 422.8 kN, R_B = 443.8.
  M_mid = R_A L/2 - w (L/2)^2/2 - P_A (L/2 - a/2) = 2,867 kN.m; minus overhang hogging about 8 -> **about 2,859 kN.m**.
- Model 2,569 (10 % lower). Reason: load sharing, not arithmetic. Test: load ONLY G2 -> its own reactions 268 / 303 kN (571 of its 923 kN
  weight), peak M 741 kN.m, i.e. ~38 % of its weight is carried by the neighbours through deck strips and cross girders.
  XG off changes the peak not at all (2,568.6) but cuts G2 reactions 444/580 -> 387/521 (XG weight reaches the supports).
  Using the MODEL reactions in a free-body check gives 2,760 vs diagram 2,566: the 194 kN.m gap is the shear transferred through the
  deck strips along the span. Whether that much sharing is realistic is the question for the MIDAS comparison; the deck strips are
  full tributary width (about 2.8 m x 0.2 m) with no effective-width reduction and may be too stiff transversely.

## 8. Findings that matter for the next model
- **End block assignment is mesh-quantised.** An element takes the solid (-E) section if its midpoint lies inside the block; elements are
  ~2.8 m long, so G2's block is 1.379 m (A) and 2.447 m (B) beyond the bearing, against 1.482 m from the section rule
  (2000 - 518, MEMBER_PROPERTIES_METHOD.md section 2; confirm against the drawing). Total weight changes with spacing: 4,130.5 kN at 2.8 m,
  4,036.2 kN at 2.2 m. **Fix: insert a node at the exact section boundary** (and at each bearing), then assign by element midpoint.
- Diagrams hide the solid/open change because only the load slope changes; shade the end-block bands and mark bearings on the charts.
- Section offset CT: the solver puts the section centroid on the node line; MIDAS may shift the section. Unverified difference.
- J, Asy, Asz of the composites are from a finite-difference run in Python (cached in the embedded MCT). The browser scales them when
  section parameters move and shows a warning; recompute in the pipeline for real changes (mesh spacing does not affect them).

## 9. Next steps
1. Insert section-boundary and bearing nodes; re-run; weight should become mesh-independent.
2. Run the same case in MIDAS; compare reactions node by node, then displacements, then moments/shears (CSV download from the tab).
3. Export MIDAS-recalculated composite properties (J, Asy, Asz) back into the solver.
4. Bearings as springs from DRG 202280-282 Table 1 (Needs Review until read), then superimposed dead load and live load.
5. Port the composite section writer (`*SECT-PSCVALUE`) into the dashboard MCT generator so the button exports what the tab analyses.
