# Member Properties Method — Transverse Grouping, Girder Segmentation, Edge Taper

> Status note 2026-11-17: historical (BR13A dashboard era). The header below ("nothing implemented") is out of date: the platform implements straight-chord girders, solid end zones with their own torsion, deck strips and composite sections (repo `docs/P1_GEOMETRY_METHOD.md`, `docs/P2_SECTIONS_METHOD.md`). §12 findings 1 (girder Asz) and 2 (Iz/Asy pairing) were fixed in dashboard v28. Kept for the reasoning and the BR13A drawing values.

**Status: PLAN FOR REVIEW. Nothing in this document is implemented yet.**
Bridge: BR13A (M7–M12 Interchange, DRG set M712UDC-JHGRP-M7I-BR-DRG-2023xx).
Companion to `DATA_SOURCE_CATEGORIZATION_STANDARD.md` (tagging) and
`CONTROL_LINE_RECONSTRUCTION_METHOD.md` (alignment).

This covers three defects raised against the Member Properties tab of the
BR13A Grillage Dashboard:

- **A** — transverse deck elements each carry their own width; needs engineer-style grouping
- **B** — girders are solid near supports (end diaphragms), not open section as currently modelled
- **C** — edge girders are tapered, so one flange width cannot serve a whole girder

---

## 0. Prerequisite finding — DECISION REQUIRED BEFORE STAGE C

**The model places girders on constant-offset curves, not straight chords. The taper
is therefore identically zero by construction, and Stage C cannot proceed until this
is resolved.**

`girders()` returns constant offsets `P.gcen + (i − (n−1)/2)·P.gspac`, and `pt(ch,o)`
places every node at that fixed offset normal to the control line. The control line is
a spiral–arc–spiral with `R = 400 m`. So each girder line is modelled as a *curve
parallel to the alignment*. Deck edges are likewise constant offsets
(`edgeL = −4.300`, `edgeR = +4.900`). Deck-edge-minus-girder-line is thus a constant
1.1344 m on both sides, and yields no taper.

Physically, a precast Super-T is a **straight member placed as a chord** between its
two setting-out points, while the deck edge follows the curve. Measured with the
page's own alignment functions, using each girder's own skewed end chainages:

| Girder | Offset (m) | End chainages | Chord length (m) | Max chord-to-curve deviation (mm) |
|---|---|---|---|---|
| G1 | −3.1656 | 1897.312 → 1926.558 | 29.009 | **265.4** |
| G2 | −0.8552 | 1895.843 → 1924.844 | 28.933 | 262.4 |
| G3 | +1.4552 | 1894.375 → 1923.131 | 28.854 | 259.3 |
| G4 | +3.7656 | 1892.907 → 1921.417 | 28.771 | 256.1 |

Closed-form check: mid-ordinate for L = 29.927 m at R = 400 m is
`R(1 − cos(L/2R)) = 279.9 mm` — consistent with the 256–265 mm measured over the
shorter skew-trimmed chords. Deviation is negative for every girder (all chords bow
toward the curve centre).

Consequence at the deck edges — equal at the ends, opposite in sign at mid-span:

| Overhang | At girder ends | At mid-span | Change |
|---|---|---|---|
| Left (edgeL − G1) | 1134 mm | 869 mm | **narrows 265 mm** |
| Right (edgeR − G4) | 1134 mm | 1391 mm | **widens 256 mm** |

This is the mechanism behind the `VARIES VARIES VARIES` callouts on the typical
section, and it matches the reported edge-girder taper.

**Caution — this is not a cosmetic change.** Moving girder lines onto chords shifts
them by up to 265 mm, which also moves the web lines and rigid outriggers, and changes
every transverse element span (currently 291 / 331 / 498 / 607 / 683 mm). Stage A
should be re-run after any chord change, not before.

**Decision needed:** adopt straight-chord girder geometry (physically correct, changes
the mesh), or keep constant-offset girders and treat the taper as a separate overlay
on section properties only (mesh unchanged, geometry approximate)?

---

## 1. Stage A — transverse deck element width and grouping

### 1.1 The defect

The current table uses each element's **own span between longitudinal lines** as the
width `b`, feeding `A = b·t` and `I = b·t³/12`. That is the wrong quantity. Per the
grillage reference, for a skewed deck the transverse member width is the **orthogonal
spacing** — the longitudinal tributary the transverse line carries, perpendicular to
the member — not the member's length.

### 1.2 What the mesh actually gives

Transverse `slab` elements are generated only on the uniform perpendicular stations
(`perp`), not at the scattered skew boundary nodes:

- `perp` has **14 stations at a uniform step of 2796.6 mm** (from `P.tgt` = 2.8 m target)
- **106 slab elements across 12 stations** (2 perp stations fall entirely outside the deck)
- Station spacing measured between consecutive slab stations: 2.7966 m throughout, no drift
- Interior stations (1900.021 → 1919.597) carry 10 slab elements each — full deck width
- Four stations are trimmed by the 34.5° skew: 1894.428 (5 elements), 1897.225 (9),
  1922.394 (8), 1925.190 (4)

The ~88 scattered node chainages that make the mesh look irregular belong to the
longitudinal boundary nodes at the skewed abutments; those are joined by `end`
elements and carry no slab properties.

### 1.3 Method

1. **Correct `b`** to the orthogonal tributary spacing:
   - interior station: `b = 2796.6 mm` (full step; half-step each side)
   - first/last station: `b = ` half-step toward the interior **+** perpendicular
     distance out to the skewed deck end (`chdA` / `chdB`)
2. **Skewed end stations need per-element tributary.** Because the deck end is skewed
   at 34.5°, the distance from an end station out to the deck end *varies across the
   width*. So on each of the 4 trimmed stations, tributary depth is evaluated at each
   element's own mid-offset, not once for the line.
3. **Group into property bands.** Elements sharing the same `b` (to a stated tolerance)
   become one property group with one ID. Report the group table, not 106 rows.
4. **Keep span separate from width.** The element's own length stays as `L` for the
   stiffness matrix; it must not re-enter `A`, `I` or `J`.

### 1.4 Expected outcome

All interior transverse members become **identical — a single group**. Only the four
skew-trimmed end stations differ. Expect roughly **5–8 property groups in place of 106
rows**, which is the engineer-style grouping asked for, reached by fixing the width
definition rather than by approximating anything away.

### 1.5 Properties per group

| Quantity | Formula | Tag |
|---|---|---|
| `AX` | `b · t` | Calculated |
| `AZ` | `(5/6) · b · t` | Calculated |
| `IX` | `b · t³ / 12` | Calculated |
| `IZ` (J) | `b · t³ / 3` | Calculated |
| `E` | deck concrete Ec | Missing — Flagged (see §4) |

`t` = 200 mm deck slab (`P.slab`).

---

## 2. Stage B — girder segmentation: solid ends and diaphragms

### 2.1 The defect

Every girder is currently one prismatic **open** Super-T over its whole length. The
drawings show a solid end block and diaphragms, so the end elements have substantially
different properties — most importantly in torsion.

### 2.2 Drawing values

From the PSC Girder Concrete sheets (202302 sheet C, 202303 sheet D):

| Value | Source | Tag |
|---|---|---|
| `2000` END DIAPHRAGM | girder plan/elevation callout | **Direct** |
| Overall girder length along ℄ = `29927` (at soffit) | girder plan | **Direct** |
| `518` (girder end → ℄ bearing) | dimension string adjacent to END DIAPHRAGM | Direct — *interpretation to confirm* |
| `150 × 150` fillet at end diaphragms | callout | **Direct** |
| `50 × 50` fillet at internal diaphragms | typical section | **Direct** |
| Internal diaphragm spacing `4500 MIN TO 8000 MAX` | girder elevation | **Direct (a range)** |
| Internal diaphragm thickness `100 MIN 150 MAX` | girder elevation | **Direct (a range)** |
| Girder depth `1515` | section | **Direct** |
| Skew `34.5°` | girder plan | **Direct** |
| Girder marks G-01, G-02/G-03 (2 No), G-04 (1 No) | sheet titles | **Direct** |

**Cross-check supporting the `518` reading:** `29927 − 2 × 518 = 28891 mm` bearing to
bearing. The model's support chainages give `CHB − CHA = 1924.21 − 1895.30 = 28910 mm`
— agreement to 19 mm (0.07 %). Strong corroboration, but **confirm against the
elevation view before use** (Task B-1).

**Derived, pending that confirmation:** the solid end block runs `2000 − 518 = 1482 mm`
past the bearing centreline into the span — Calculated.

### 2.3 Method

1. **Task B-1 (first).** Confirm on the girder elevation that `2000` is the
   along-girder length of the solid end block, that `518` is end-face to bearing
   centreline, and locate where the void actually stops. Do not proceed on the
   cross-check alone.
2. **Add a `solid` section configuration.** `secGeom()` today supports only
   `open` (trough/recess, no void) and the voided closed form. A genuine solid end
   block is the outer outline with **no void subtracted** — a third configuration.
3. **Torsion must change form.** The open Super-T uses thin-walled `J ≈ ⅓ Σ b·t³`,
   which is very small. A solid end block is a solid St-Venant section with a far
   larger `J`. Carrying the open-section `J` into the end elements understates
   torsional restraint exactly where load distribution is most sensitive. This is the
   single most consequential item in Stage B.
4. **Segment each girder** into: solid end block → open mid-section → solid end block,
   splitting at the confirmed transition chainage, and assign per-segment properties.
5. **End diaphragm as a transverse member** at each support line, with its own property
   group (2000 mm deep solid, thickness from B-1).
6. **Internal diaphragms.** Only a *range* is dimensioned, so actual positions are
   **not** recoverable. Record as Missing — Flagged with the range noted; do not place
   them at an assumed spacing.

---

## 3. Stage C — edge girder taper

**Blocked on the §0 decision.**

### 3.1 Method (once chord geometry is settled)

1. Per station along each edge girder, compute
   `overhang(ch) = |deck edge offset − girder chord offset(ch)|` — Calculated from
   Direct inputs (deck edge offsets, girder offsets/spacing, `R`, girder end chainages).
2. Feed the per-station width into `secGeom()` by overriding `P.flange` per element,
   as the tab already does per girder, then band the results into groups as in Stage A.
3. Apply to G1 and G4 only; G2 and G3 are interior and keep a constant flange width.

### 3.2 Unresolved ambiguity — must be settled, not assumed

`P.flange = 2280.4 mm` is a **precast** dimension. The taper could be either:

- **(a)** the precast Super-T top flange itself cast tapered in plan, or
- **(b)** a constant precast flange with a varying **in-situ deck overhang**

These give different section properties and different deck-slab tributaries. The
`VARIES VARIES VARIES` callout alone does not distinguish them.

**Where to look:** the `PLAN GIRDER G-01` and `PLAN GIRDER G-04` views. The G-04 plan
carries two adjacent dimensions `966` / `977`, and sheet E carries `1044 / 522 / 522`
— these are the most likely record of a tapered precast flange. Resolve at Task C-1
before computing anything. Until resolved: **Missing — Flagged**.

---

## 4. Data inventory

### Direct (drawing values, usable as-is)
`2000` end diaphragm · `29927` girder length · `1515` depth · `34.5°` skew ·
`150×150` / `50×50` fillets · internal diaphragm ranges · girder marks ·
`R = 400 m` · deck edge offsets · `P.slab = 200 mm`

### Calculated (documented derivation from Direct values)
Chord deviations per girder · overhang variation (265 / 256 mm) · solid block
extent past bearing (1482 mm) · all transverse `AX`/`AZ`/`IX`/`IZ` · composite girder
section properties

### Missing — Flagged for Review
| Item | Why | Where it should be |
|---|---|---|
| Internal diaphragm positions | only a 4500–8000 range dimensioned | girder elevation, sheets C/D |
| Taper mechanism — precast flange vs in-situ overhang | `VARIES` does not distinguish | PLAN GIRDER G-01 / G-04 |
| Girder concrete grade and Ec | not sighted in this set | PSC girder notes / sheet 300 |
| Deck concrete grade and Ec | not sighted in this set | deck sheets 202400 / 202011 |
| Solid-end void termination point | callout interpretation pending | girder elevation |
| End diaphragm thickness | not separately dimensioned | girder elevation |

The dashboard's current `E` defaults (32800 / 28600 MPa) are **demo values, not
extracted**, and must read Missing — Flagged until the grades are sighted. Any
property computed from them inherits that flag.

---

## 5. Validation checklist

Run before accepting any stage:

1. **Transverse tributary closes.** Sum of all transverse tributary widths along a
   longitudinal line = deck length along that line, to < 1 mm.
2. **Interior groups collapse to one.** If corrected interior widths are not all
   2796.6 mm, the tributary logic is wrong.
3. **Span and width stay separate.** Element length must not appear in `A`, `I` or `J`.
4. **Solid end `J` ≫ open `J`.** If the end block's torsion constant is not
   substantially larger, the solid configuration has not taken effect.
5. **Overhangs are equal at ends, opposite at mid-span.** Left narrows, right widens,
   both ≈ 260 mm. Same sign on both edges means a sign error in the chord offset.
6. **Chord closure.** Chord length must be slightly less than the arc length between
   the same two setting-out points, never more.
7. **Independent check.** Reproduce one transverse group and one girder segment by
   hand (or a separate script that does not share code with the tab) and compare.
8. **Tag audit.** Every value carries exactly one of Direct / Calculated /
   Missing — Flagged, and the Needs Review roll-up lists every flagged item.

---

## 6. Staging and checkpoints

Each stage stops for confirmation before the next begins.

| Stage | Work | Gate |
|---|---|---|
| **0** | Decide chord vs constant-offset geometry (§0) | **Decision required — blocks C** |
| **A** | Fix transverse `b`; per-element tributary at the 4 skew-trimmed stations; group | Review the group table and count |
| **B-1** | Confirm solid-end geometry on the girder elevation | Confirm the `2000` / `518` reading |
| **B-2** | Add `solid` configuration; segment girders; end diaphragm member | Review segment properties, esp. `J` |
| **C-1** | Resolve taper mechanism (precast flange vs in-situ overhang) | Confirm from G-01 / G-04 plans |
| **C-2** | Per-station edge widths; band into groups | Review edge group table |
| **D** | Consolidated property table, Needs Review roll-up | Sign-off before stiffness matrix |

Stage A is independent of B and C and is the only one that is a straight correctness
fix, so it is the natural first build. Stage C is gated on Stage 0. Stage B needs one
drawing confirmation before any code.

**Not in scope here:** the 12×12 stiffness matrix, global connectivity and MIDAS `.mct`
export, which consume this tab's output and follow Stage D.


---

## 10. Design query responses — received 2026-10-13 (dashboard v20)

Answers were written into `BR13A_Design_Query_Perimeter_Members.docx` by the engineer.

| Query | Response | Applied |
|---|---|---|
| 1 — perimeter lines | **Option C**: support lines structural at the exact Support A / B locations; **dummy elements on Deck end A and B** | Support lines -> section XG; deck-end lines -> nominal dummy section (was: excluded) |
| 2 — cross girder | **800 mm wide x 1065 mm deep**, read from the cross-girder detail (800 is dimensioned normal to the skewed face, i.e. a plan width; 1065 DRG 202011) | XG = 800 x 1065 rectangle, **Direct** |
| 3 — 47.65 mm member | **Option A**: exclude below the minimum length | unchanged (cutoff 100 mm) |

XG properties (Calculated from the two Direct values): A = 852,000 mm2; Iz (vertical bending) = b*h^3/12 = 8.053e10 mm4;
Iy = h*b^3/12 = 4.544e10 mm4; J = 9.80e10 mm4 (rectangle St-Venant, b/h = 0.751); Asy = Asz = 5/6*A.

Result: 36 support-line members now carry XG; 233 DUM (195 web + 38 deck-end); only 2 members unassigned
(both below the length cutoff). Support lines are no longer absent from the assembly.

Open / still flagged:
- A second dimension, **420**, sits beside the 800 on the same detail; it is not marked as a width and is **not used**.
- XG concrete grade is taken as the deck 40 MPa (M2) -- **confirm** for the cast-in-place cross girder.
- XG is a rectangle on the bearing line and is not combined with the 200 mm deck slab above it (no composite action assumed).
- Girder grade / DRG 202300 still absent.

---

## 12. MIDAS MCT export, composite girders, and three model findings (2026-10-13)

**MCT status.** Nodes, elements, materials and plain VALUE sections now import (format learned from parser errors:
VALUE = 4 lines, header ends `SB, ROLL`; material name max 16 chars). XY shifted to a fixed base point, control line at
Support A (CH 1895.300): X = E - 300098.513, Y = N - 6249478.409, Z unchanged.

**Composite sections.** The engineer supplied a full MIDAS model MCT; its comment header documents the syntax. Composite
girders go in `*SECT-PSCVALUE` as `COMPOSITE-GEN` (PART=1 girder, PART=2 deck) with `OPOLY` polygons, not in `*SECTION`.
8 composites (G1-G4, end block + mid) replace the bare girder sections. Offset CT as in the engineer's own model.

**Correction to my own earlier DXF composite.** I had filled the Super-T trough with deck concrete. Wrong: the deck is a plain
200 mm slab over the hollow trough, so the composite is a closed cell (as in the engineer's OpenSuperT). Rebuilt.

**Findings in the dashboard (not yet fixed, MCT file unaffected):**
1. Open-girder vertical shear area `Asz = 0.85*bw*(D-d2)` uses the 757 mm bottom width, giving 804,000 mm2.
   Webs are 100 mm: `2*th*(yfu-yf)` = 221,000 mm2. Overstated ~3.6x. Affects Timoshenko phi of the girders.
2. Strong-axis inertia is named Iz in the dashboard but its Asy (horizontal shear) is paired with it in `kLocal`; MIDAS
   convention is Iyy vertical, Asz vertical. Pairing is crossed for girders. Slabs unaffected (Asy = Asz).
3. Member Properties composite table uses flange width as deck width; its comment says tributary width.
4. Open-girder J (6.1e9) is for the girder alone; with the deck the section is a closed cell, J ~ 2.0e11 (FD, h = 5 mm,
   solver validated: rectangle 0.1 %, tube vs Bredt ~6 %).

**Composite results (mid-section G2): A transformed 1.030e6 mm2, centroid 1100 mm above soffit, Iv 3.83e11 mm4, J 2.0e11 mm4.
Solid end block J (FD) 2.32e11 vs old approximation 2.50e11 (-7 %).**

**Open items.** Node line is at deck soffit; CT offset places the section top at the node line (200 mm low) - needs the
USER offset syntax or a change in MIDAS. Haunch gap assumed 0 (dashboard default, 'replace with project value').
Deck width = full tributary width, no effective-width reduction. J/Asy/Asz in the MCT are first estimates; recalc in MIDAS.
