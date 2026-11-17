# MCT Export Method - drawings to MIDAS Civil model (generalises beyond BR13A)

Status: learned on BR13A, Oct 2026. Every syntax fact below is VERIFIED either by MIDAS import (error log) or by the
engineer's own native MCT. Anything not listed here is unverified: do not guess it, ask for a native export.
Updated 2026-10-13: supports / load-case syntax added (section 1b), section 3 replaced by the built analysis (see ANALYSIS_METHOD.md).
Updated 2026-10-28: native BR13B model read (section 1c); MIDAS runs of generated BR13A files matched the platform solver
(section 1d); lessons in section 5.

## 0. Working rule that saved the most time
When the target software's file syntax is not documented here, **ask for a native export of one example first**.
BR13A cost five import rounds guessing `*SECTION VALUE`; the engineer's own MCT then documented composite sections,
polygons and DBUSER in its own comment header. Exported MCTs carry their own syntax in the `;` comment lines - read them.
2026-10-28: the documented-but-unchecked `*BEAMEND` was rejected by MIDAS ("Parsing Error ... Invalid command"); the native file
showed the real command (`*FRAME-RLS`). Documentation is not a native example.

## 1. Verified syntax (MIDAS Civil NX, kN-m or kN-mm; unit is set by `*UNIT`)
- `*UNIT` `KN, M, KJ, C`. Coordinates: MIDAS cannot hold MGA-sized values -> shift X,Y to a fixed documented base point
  (BR13A: control line at Support A, X = E - 300098.513, Y = N - 6249478.409), leave Z unchanged, write the offset in the file header.
- `*NODE` `iNO, X, Y, Z`.  `*ELEMENT` `iEL, BEAM, iMAT, iPRO, iN1, iN2, 0, 0`.
- `*MATERIAL` user type: `iMAT, USER, NAME, 0, 0, , C, NO, 0.05, 2, E, POISN, THERMAL, DEN, 0`. **Name max 16 characters.**
- `*SECTION` rectangle: `iSEC, DBUSER, NAME, CT, 0,0,0,0,0,0, YES, NO, SB , 2, H, B, 0,0,0,0,0,0,0,0` (H depth, B width).
  Use DBUSER shapes wherever a standard shape exists: MIDAS draws it and computes A, I, J itself.
- `*SECT-PSCVALUE` holds anything polygon-based. Composite girder + deck:
  `SECT=id, COMPOSITE-GEN, NAME, CT,0,0,0,0,0,0, YES, NO, CP_G, YES, YES, 1` then per part:
  `PART=n`, 3 lines part stiffness, 3 lines composite-so-far stiffness, `1, bMAIN, YES, E, POISN`, `OPOLY=x,y,...`.
  Stiffness trio = (A, WAREA, Asy, Asz, Ixx=J, Iyy, Izz) / (CyP,CyM,CzP,CzM,QyB,QzB,PERI_OUT,PERI_IN,Cy,Cz) / (Y1-4, Z1-4).
  Composite sections are NOT repeated in `*SECTION`. Polygon coordinates are about the bounding-box centre. Hollow cells
  are simply left open (deck slab bridging the trough); no IPOLY needed for a deck-closed Super-T.
  **MIDAS keeps the written sum-of-parts stiffness** (confirmed 2026-10-28: S16 A, Asz, J, Iyy, Izz identical); polygons are for drawing.
- A plain `VALUE` section in `*SECTION` imports but has no shape: elements are invisible/rectangular in the view. Avoid.
- Axis convention: **Iyy = vertical bending (strong), Izz = horizontal; Asy horizontal shear, Asz vertical shear.**
- Errors seen and what they meant: "BUILT or ROLL must be entered" / "shape of section is invalid" = field order
  `..., YES, NO, SHAPE, BUILT|ROLL`; "number of parameters too many" = a VALUE section needs 4 lines, not 1;
  "Parsing Error in line N: Invalid command" = the `*COMMAND` keyword does not exist.

## 1b. Supports and load case
- `*STLDCASE` then `SW, D, Self weight` (name, type D = dead, description).
- `*CONSTRAINT` then `node list, Dx Dy Dz Rx Ry Rz Rw as 7 digits (1 = fixed), group name`.
  Examples: `44 101 157 212, 1110000, Brg_AbutA_pinned`;  `55 112 168 223, 0010000, Brg_AbutB_roller`.
  Node lists: spaces between items, `a to b` and `a to b by n` accepted (native file writes `3531to4340 4343to4448by35`).
- `*USE-STLD, SW` then `*SELFWEIGHT` / `0, 0, -1, group` (gravity vector, Z up).
- Every group used (boundary or load) must be declared first in `*BNDR-GROUP` (`NAME, 0`) / `*LOAD-GROUP` (`NAME`).
- Put these after the section blocks, before `*ENDDATA`.

## 1c. From the engineer's native BR13B model (2026-10-28)
- Solid circle: `iSEC, DBUSER, NAME, CC, 0,0,0,0,0,0, YES, NO, SR , 2, D, 0,0,0,0,0,0,0,0,0` (shape SR, D = diameter, m).
- `*SECT-SCALE`: `iSEC, AREA_SF, ASY_SF, ASZ_SF, IXX_SF, IYY_SF, IZZ_SF, WGT_SF, GROUP, iPart, bDiffIJ`
  (native: `7, 1, 1, 1, 0.2, 1, 1, 1, 0.2J, 1, NO`); write it after `*BNDR-GROUP`. Platform deck strips: IXX_SF = (b·d³/6) / St-Venant J,
  so a drawn DBUSER keeps the grillage J.
- Beam end release: `*FRAME-RLS`, two lines per element:
  `iEL, NO, FLAGS_i(Fx Fy Fz Mx My Mz), 0,0,0,0,0,0` / `FLAGS_j, 0,0,0,0,0,0, GROUP` (e.g. `000010` = My released).
- Nodal loads: `*USE-STLD, CASE` then `*CONLOAD` / `node, FX, FY, FZ, MX, MY, MZ, GROUP,` (group = a load group).
- Uniform temperature: `*ELTEMPER` / `elem, dT, ` (strain = material THERMAL x dT). Section temperature: `*BSTEMPER` /
  `elem, LZ, Top, NUM, , NO` then NUM band lines `ELEMENT, 0, 0, B, H1, T1, H2, T2` (depths from the section top).
- Combinations: `*LOADCOMB` / `NAME=..., GEN, ACTIVE, 0, iTYPE (0 add, 1 envelope), DESC, 0, 0, 0, 1` then `ST|CB|RS, name, factor` triples.
- Earthquake: `*STRUCTYPE`, `*LOADTOMASS`, `*EIGEN-CTRL`, `*SFUNCTION`, `*SPLDCASE` (written 2026-10-28, not yet run).
- LCTYPE codes seen: D, DC, DW, EP, LS, T, TPG, BRK, W, PS, USER.
- Not yet used by the platform: `*BEAMLOAD`, `*MVLDCASE` / `*LINELANE` / `*VEHICLE` (moving load).
- Engineer's BR13B choices (NOT platform defaults): deck strip `SB 0.23 x 1.006` with IXX_SF 0.2; piles / columns IYY, IZZ_SF 0.4.

## 1d. MIDAS runs of generated BR13A files (2026-10-28)
- Run a (SW, released model) / b (18 static cases) / c (+ temperature + combinations): 0 errors, 0 warnings. Verifies every block
  written, including `*ELASTICLINK`, `*SPRING`, `*CONLOAD`, `*ELTEMPER`, `*BSTEMPER`, `*LOADCOMB`.
- MIDAS creates internal nodes for section offsets (915 nodes reported vs 459 written) — not a discrepancy.
- Section offset `CT` puts the top of the section bounding box on the node; MIDAS includes the offset in the stiffness.
- Element forces: **MIDAS local My = − platform My**; every other component compares directly (I end: −f, J end: +f).
- Agreement: every node within 0.013 mm and every element force within ~1 % in every static and uniform-temperature case;
  gradients (*BSTEMPER) equal in displacement, up to 3.4 % in local vertical shear next to the bearings.
- Evidence and regression test: `projects/BR13A/model/midas_run_2026-10-28*/`, `tests/model/test_midas_run.py`.

## 2. Section property rules (each was a real BR13A mistake)
1. A Super-T deck is a plain slab over a hollow trough (closed cell). Do not fill the trough with deck concrete.
2. Torsion J of the composite closed cell is ~30x the open girder alone. Compute it (finite-difference Prandtl on the polygon,
   `torsion_fd.py`, validated: rectangle 0.1 %, hollow tube vs Bredt ~6 %), do not carry the open-section value.
3. Vertical shear area = web thickness x web height (2 x 100 x 1100 here), never a bottom-width x depth product.
4. Pair bending axis with the matching shear area (Iyy with Asz). Check the pairing in the stiffness code, not just the export.
5. Check polygon area against the section table to < 1 mm2 before export; check closure and orientation. Write polygon and
   stiffness numbers to 9 significant figures (6 gave 4 mm2 area errors).
6. Cross-check any extracted section against a known native example (the engineer's OpenSuperT) for scale before trusting it.

## 3. Boundary conditions and analysis
Built: see `ANALYSIS_METHOD.md`. Bearings are a document input, never an assumption (type, guidance direction, stiffness).
Comparison method: identical mesh, identical section table, identical supports and loads (self-weight first), then compare
nodal displacements and element forces node by node / element by element — not maxima only.

## 4. Pipeline principle
One generator per target, fed only by extracted/tagged parameters. The platform generator is `pdf2bim/model/mct.py` +
`tools/export_mct.py`; the old dashboard export and its post-processing scripts are superseded.

## 5. Lessons from the MIDAS runs (2026-10-28)
1. **Anything the export writes must also be in the platform solver.** ADR-042 rigid-arm releases were written to the .mct but the
   solver never applied them; the MIDAS run showed transverse forces off by up to 70 % while global deflection agreed within 2 %.
   Compare element forces, not just deflections.
2. **Grillage releases on Super-T rigid arms are wrong when the deck is continuous over the webs**: they leave the cantilever deck
   held only by nominal torsion (SDL edge deflection 78 mm vs 5.9 mm). Owner removed them (ADR-045). Model 2 (D-15) has none.
3. Reference level: owner chose the deck top as the node level with members offset to their centroids (ADR-043, grillage
   reference Annex C Option B), in the solver and the .mct (`CT`). Cross girders stop at the outer webs of the edge girders (ADR-044).
4. **MIDAS scales an envelope combination's max / min by a NEGATIVE factor without swapping them** (run c): `CB, env, -0.7` makes the
   row's "max" the lower bound. Never put a negative factor on an envelope term: reference a negated copy of the envelope
   (`*_env_n`) with a positive factor. Positive factors behave as expected.
5. Combination checks: re-evaluate the file text with the target program's observed semantics, not the generator's own.
