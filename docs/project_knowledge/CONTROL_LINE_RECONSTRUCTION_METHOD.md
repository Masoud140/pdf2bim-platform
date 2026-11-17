# Control Line / Alignment Reconstruction — Standing Method

**Status: proposed addition to project standing rules (CLAUDE.md).** Written after
reconstructing BR13A's control line, including one real modeling bug found and fixed, one
coordinate-convention issue found and fixed, and one geometry-library bug found and worked
around — all three are documented below so they aren't re-discovered from scratch on the
next bridge. Updated 2026-11-17 with lessons from the SB-1510 set (SB42 MCR0, SB41 EB MC80): §2a, §5.

**Applies whenever** a GA drawing set includes a horizontal alignment table with TS/SC/CS/ST
(or this firm's HTP1/HTP2/HCEN/HTP3/HTP4) chainage/coordinate/bearing/radius data, plus a
vertical alignment diagram with grade/RL/curve-length data. This is standard on any
TfNSW-style GA sheet with a "Horizontal Alignment Diagram" / "Vertical Alignment Diagram" /
"Skew Diagram" set (typically the sheet the project already treats as authoritative for
chainage/level/skew — see existing standing rule on that).

In the platform the alignment engine is `pdf2bim/geometry/alignment.py` (method: repo `docs/P1_GEOMETRY_METHOD.md`); each bridge's transcription and checks live in `projects/<id>/extraction/values.py`.

---

## 1. Read the table first, verbatim, before computing anything

Transcribe every cell of the horizontal alignment table and the vertical alignment diagram
into the schema exactly as printed — chainage, easting, northing, bearing in/out, radius —
before any reconstruction starts. This transcription is `status: "direct"`, `confidence:
1.0`. Everything computed afterward is `status: "derived"`, capped below 1.0, however good
the cross-validation.

**Keep these raw values in the model as permanent, separate reference objects** — not just
in a spreadsheet — one labelled point + text label per table row, plus a couple of
independent geometric checks (see §4). This is what let a real coordinate-convention problem
get caught immediately by inspection rather than trusted silently.

## 2. Segment structure: tangent → spiral → circular arc → spiral → tangent

This is standard road/rail alignment practice (confirmed against Austroads/AASHTO-aligned
references), not a simplification:

- **Spiral length** = the chainage difference between the TS/SC pair (or CS/ST pair) —
  already in the table, no separate "spiral parameter" data is needed.
- **Circular arc radius** = the table's stated radius, applying only to the arc between
  SC and CS.
- **Clothoid curvature**: κ(l) = l / (R·L) for a spiral of length L and radius R, l = distance
  travelled into the spiral. This is the standard Euler-spiral relation (equivalently
  l·r = L·R = constant) — reconstruct it either via the Taylor/Fresnel series or by direct
  numerical integration of the curvature ODE (dβ/ds = κ(s), position = ∫(sin β, cos β) ds).
  Both are recognized textbook methods; numerical integration is simpler to get right and was
  used here, cross-validated to <2mm against the table's own coordinates.
- **Turn direction**: work out the sign (left turn = bearing decreases with increasing
  chainage, or vice versa) from the table's own bearing-in/bearing-out values before writing
  the curvature function — don't assume a convention. Getting this sign backwards produces
  a result that looks plausible in bearing-change magnitude but diverges badly in position
  (confirmed the hard way: a sign error here gave 2mm error at the first check point,
  ballooning to 118m by the fourth — always validate the endpoint(s) *furthest* from the
  seed point, not just the nearest one).

### 2a. Other table shapes met since (2026-11)

- **Compound circular curves with no spirals** (SB42 MCR0: R 90 → R 180, then a tangent): the HTP / HCEN rows give the arc start, centre and end; the radius and turn direction come from the centre position, checked against the tabulated radius.
- **Printed bearing may be the back bearing.** SB41 EB MC80 prints the HTP6–HTP7 tangent as 64°04'34", but the coordinates in order of increasing chainage give 244°04'34" (length 108.215 m equals the chainage difference exactly). Always derive the direction of travel from consecutive tabulated coordinates and chainages; record a printed bearing that differs by 180° as a flag, not an error to correct silently.

## 3. Horizontal and vertical are independent — never fit one 3D curve through both

**This was a real modeling error, caught and fixed.** A road's plan curvature (radius) and
its vertical grade are separate design specifications. Fitting a single 3D arc through points
that carry both real plan curvature *and* real differing elevation gives a distorted radius
(observed: fitting through HTP2/HTP3/midpoint at their true RLs gave 400.65m against a
tabulated 400.000m — 650mm off, purely from the points not being coplanar).

**Correct method:**
1. Build/verify the circular arc in a single flat plane (any one constant Z — doesn't need to
   be zero, matching the rest of the model's schematic Z is fine) using the table's plan
   coordinates only. This is the object whose Radius should read the table value when
   selected in Rhino.
2. Separately, apply the real vertical-curve RL to each point via chainage, exactly the same
   way for the arc as for the spirals and tangents. Never let elevation feed back into the
   horizontal fit.

## 4. Build native, exact geometry for the parts that can be exact

- **Circular arc**: use the CAD kernel's native Arc type via a 3-point fit (two known points
  on the arc + one interior point computed from the table's centre + radius + angle bisector
  — not the two-point-and-tangent overload, see §6). A native Arc is mathematically exact and
  self-verifying: select it, read its own Radius/Center properties, no trust in Claude's
  arithmetic required.
- **Spirals**: no CAD kernel (Rhino included) has an exact clothoid primitive — it's a
  transcendental curve. Dense point-sampling (sub-metre spacing) is the standard, correct
  approach here, not a shortcut. A NURBS "interpolated" fit is *not* better than a plain
  polyline through the same points for this purpose — a NURBS interpolation through the
  points is fine if the library supports true interpolation (passes through every point);
  a NURBS *control-point* curve does not pass through the points and should not be used
  as a substitute.
- **Tangents**: exact straight lines, trivial.

## 5. Validation checklist — run all of these, every time

| Check | Method | Target |
|---|---|---|
| Endpoint coordinates | Compare computed position at every named table point (not just the seed point) to its tabulated E/N | <5mm |
| Endpoint bearings | Compare computed heading to tabulated bearing in/out | <0.01° (or exactly 180° off: flag as a printed back bearing, §2a) |
| Tangent length | Distance between consecutive tabulated points of a tangent vs. their chainage difference | exact (mm) |
| Arc radius | Native flat-Arc fit through raw table-derived points, read Rhino's own `.Radius` | within the table's own rounding (a few cm on a 300,000+ scale coordinate table is normal, not an error) |
| Arc centre | Native flat-Arc `.Center` vs. the table's stated curve-centre coordinates | same tolerance as above |
| Vertical curve | Evaluate the parabola at any independently-dimensioned chainage/RL pair elsewhere on the drawing (e.g. abutment deck surface levels) | <5mm |
| Overall length | Chainage difference between two independently-dimensioned points vs. any directly-stated overall length on the drawing | exact or sub-mm |

Do not treat a single passing check as sufficient — several of the above are cheap to run and
each one is a genuinely independent cross-reference. The arc radius check in particular is
only meaningful if built as a native, exact primitive (§4) — a sampled/approximated arc will
"pass" a radius check against its own generating formula trivially, which proves nothing.

## 6. Test library geometry functions on a known case before trusting them on real data

Two real library issues surfaced while building this, in `rhino3dm` (the same likely applies
to RhinoCommon inside a live Grasshopper session — untested there, worth re-checking):

- `Arc(pointA, tangentA, pointB)` (the two-point-plus-tangent constructor) returned an
  incorrect radius on a trivial, unambiguous test case (a known quarter-circle) — a real
  binding bug, not a data problem. `Arc(pointA, pointOnInterior, pointB)` (three-point
  constructor) was verified correct on the same test case and used instead.
- `Linetypes.Add()` returns `None`, unlike `Layers.Add()`/`Materials.Add()`, which do return
  the new index — the new item's index is its position (count before the add), not the
  return value.
- Object names that *start* with `[`, `(`, or `{` are silently wiped on write/read.

**Standing practice**: before relying on any geometry-construction function from a library
for the first time in this pipeline, run it on a hand-verifiable trivial case (a unit circle,
a 3-4-5 triangle, etc.) and check the *exact expected* numeric answer, not just "did it run
without an exception." Two of the three issues above only surfaced this way, not from the
real BR13A data.

## 7. Coordinate convention

Use the project's true survey coordinates (MGA/GDA or equivalent) directly as model X/Y, with
no arbitrary local-origin shift, unless the firm has a **documented, fixed project base
point** used consistently across every discipline's model. An undocumented local origin
(even one noted in a metadata file) makes it impossible for someone to cross-check a Rhino
coordinate against the drawing without knowing to reverse a shift they may not know exists —
this was found and fixed in this session precisely because it broke that check. Double
precision floats handle real MGA-scale coordinates (300,000 / 6,249,000) with zero
measurable rounding loss — there is no technical reason to shift them. (Exception: MIDAS export needs a documented base-point shift; repo `docs/P3_MODEL_METHOD.md`.)

## 8. Confidence tagging for a reconstructed alignment, specifically

- Raw table transcription (points, bearings, radius as printed): `confidence 1.0`,
  `status "direct"`.
- Native-Arc-fitted circular segment, cross-validated: `confidence ~0.95-0.98`,
  `status "derived"` (it's still a fit through table data, not a literal curve object lifted
  from the drawing file).
- Sampled spiral segments, cross-validated at both ends: `confidence ~0.9`, `status
  "derived"` (inherently approximate — clothoids can't be represented exactly).
- Anything using an *assumed* or *extrapolated* value not in the table (e.g. a tangent
  extended past the last named point purely for visual context): flag explicitly as such in
  the notes, even if the confidence number alone wouldn't otherwise signal it.
