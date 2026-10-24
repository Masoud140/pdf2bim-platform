# P1 geometry engine — method and results

**Status:** implemented 2026-10-24 on branch `p1-geometry` (`pdf2bim/geometry/`). **Tests:** 36 / 36 PASS (`tests/geometry/test_geometry.py`). Geometry is **Calculated** from the bridge description; it is not surveyed.

## 1. What it computes

From the bridge description alone (format 0.1 or 0.2), in MGA metres:

| Output | Definition |
|---|---|
| Control line E, N, bearing at any chainage | Horizontal elements tangent / arc / clothoid. Clothoid: curvature varies linearly with length; position integrated with 10-point Gauss–Legendre |
| Start bearing | **Calculated:** chord bearing of element 1 (TS → SC, both tabulated) minus the chord's deflection in that element. Then integrated from that single seed |
| Control line RL | Grade polyline through the tabulated points, with a symmetric parabola at each point that has a curve length. **Independent of the horizontal** (method §3) |
| Support line | Straight, through the control line at its chainage, at the bearing printed on the skew diagram |
| Bearing centre of girder m at support S | Where girder m's line (control line offset by `line_offset_S`, square to the control line) crosses support line S |
| Girder | **Straight chord** between its two bearing centres (ADR-003), extended by `bearing_offset_A/B` to the girder ends |
| Deck edges | Control line offset by `deck.edge_left / edge_right` |
| Flange edges (ADR-004) | Square to the chord, at 11 stations. Inner: half the distance to the neighbour chord minus `flange_gap`/2. Outer (first / last girder): to the deck edge minus `edge_flange_setback` |
| Checks | Misclosure at every tabulated point; skew consistency (bearing vs skew); reported in the output |

**Conventions:**
- Bearings are whole-circle, clockwise from grid north.
- Offsets are positive to the right of increasing chainage.
- Coordinates are MGA throughout. The MCT base point is used only to compare with the dashboard model.

**Rules:**
- **Missing inputs stop the build** with the field name (`GeometryInputError`). Nothing is defaulted.
- `allow_proposed=True` uses proposed overrides; each use is listed in `provisional`.
- No bridge-specific constants are in the code (tested).

**Run:** `python3 tools/build_geometry.py <description> --out <file.json> [--allow-proposed] [--compare <dashboard fixture>]`

## 2. Verification

| Test | Benchmark | Result |
|---|---|---|
| Integrator, known cases (method §6) | Quarter circle; Fresnel series of the clothoid (R 400, L 55) | Exact to 1e-12; series to 1e-9 m |
| Case 1: straight / square | Closed form | < 1 mm (exact) |
| Case 2: straight / skewed 30° | Closed form (tan 30°) | < 1 mm |
| Case 3: curved R 100 / radial supports | Closed form: radius R+o, chord 2(R+o)·sin(Δφ/2), sagitta | < 1 mm |
| Case 4: curved / skewed 20° | Closed-form line–circle intersection | < 1 mm |
| Vertical curve | Mid-ordinate (g1−g2)L/8; tangency | Exact |
| Mutation check (not committed) | Reversed turn sign; flipped offset side; vertical curve 1 % off; wrong gap formula | Caught by 10, 11, 2 and 1 failing tests |
| BR13A misclosure at SC / CS / ST | Tabulated coordinates (DRG 202012) | 0.6 / 2.2 / 2.1 mm (< 5 mm, method §5) |
| BR13A control line at support A | Documented MCT base point (E 300098.513, N 6249478.409) | 0.3 mm |
| BR13A skew | Support bearing 44.029166° vs confirmed skew 34.5° (D-4) | 34.498° to the chord normal (0.002°) |
| BR13A vs dashboard deck width per girder (`gwWidth`, independent implementation) | 44 stations | ≤ 2 mm |
| BR13A vs dashboard bearing nodes | Frozen .mct | 1.4–33 mm. **Explained (F-4):** the model's bearing nodes are not on the straight support line, nor collinear. G2: < 2 mm |

These verify the **geometry software** against closed form and against the drawing's own table. They do not verify the drawing values.

## 3. Findings

1. **The skew is chord-referenced.**
   - Both BR13A support lines are parallel at 44.029166°, which is 34.498° from the normal to the control-line chord A–B.
   - Measured from the local normal, the skew is 32.43° at A and 36.57° at B.
   - Any geometry built with "local normal + 34.5°" would be wrong by up to about 195 mm.
2. **The baseline label `geom.G*.chord_length` is misleading.** The dashboard's value is the polyline length along the curved girder mesh, not a chord. P1's true end-to-end chord differs by −6.5 to +2.0 mm. The baseline keeps its ids (it is a regression reference), and this note is the correction.
3. **The straight chords sit 256–265 mm inside the girder-line curve at midspan.** This confirms gap C-2: the dashboard mesh uses the curve, not the chord.
4. **The model's bearing nodes deviate from the printed support line by up to 26 mm (F-4).** This is a dashboard-model approximation, to be removed by the P3 model builder.
5. **Girder spacing square to the chords is not constant:** G2 deck width 2256 mm at A, 2371 mm at B. The adjacent chords between parallel skew lines on a curve are not parallel. Both implementations agree.

## 4. Provisional input used for BR13A

- **Support-line bearing:** 44.029166° for supports A and B.
- **Proposed** override D-34, by AI, revision 3 of `BR13A.bridge.0.2.json`.
- **Where the value comes from:** the description already recorded it as Direct (DRG 202012) in a note; the catalogue had no field for it. P0.2 added the optional `support_lines.bearing` column.
- **Until the engineer accepts D-34,** BR13A geometry is built only with `--allow-proposed`, and the output is labelled PROVISIONAL.

## 5. Not covered yet

- Deck end lines: the deck end position relative to the support line is not in the description.
- Headstock and pile positions: in P3, with the substructure model.
- 3D girder levels: soffit / bearing levels need P2 section depths.
- Crossfall: not used in P1; the deck surface level comes in P2 / P3.
