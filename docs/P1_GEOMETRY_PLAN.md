# P1 — Geometry engine in Python: implementation plan (for review)

**Status:** proposed 2026-10-23. **Not started.** It starts only after the owner reviews this plan (ADR-015).

## 1. Objective and acceptance

**Objective:** compute all bridge geometry from the bridge description alone, in true MGA coordinates, with stable ids. The function is deterministic and callable without a browser.

**Acceptance criteria:**
1. The 4 validation cases (VERIFICATION §3) are reproduced to T2 / T3 (1 mm; 0.001°) against hand-checked coordinates:
   - straight / square;
   - straight / skewed;
   - curved / straight chords;
   - curved / skewed.
2. BR13A:
   - girder chord ends, chord lengths, offsets and deck edges equal the baseline (`geom.*`) to 1 mm, after converting the dashboard's local MCT coordinates with the documented project base point (`project.base_point`: CH 1895.300, E 300098.513, N 6249478.409; MCT export offset only);
   - the alignment reproduces the validated control line (CONTROL_LINE_RECONSTRUCTION_METHOD checklist; sub-2 mm, sub-0.001°).
3. **No BR13A constants in the code;** everything comes from the description. Missing inputs raise a typed "missing value" result; nothing is defaulted silently.
4. Every output value carries a tag: Calculated, with a derivation naming its inputs.
5. Unit tests (V1), the 4 cases, the BR13A comparison and the baseline (T1, unchanged dashboard) all pass and are recorded.

## 2. Scope

**In:**
- horizontal alignment (tangent / spiral / arc; chainage ↔ E, N, bearing);
- vertical alignment (grades, parabolic curves; RL at chainage);
- crossfall;
- support lines (chainage + skew, MGA);
- bearing positions (per girder line, on support lines);
- **straight girder chords** between bearings (ADR-003);
- deck edges (left / right offsets along the alignment) and their intersection with the support lines;
- per-girder deck width and flange edges along the chord (ADR-004: G1 / G4 outer edge on the deck edge, gap field, setback);
- headstock and pile head positions where the description has them.

**Out (later stages):** sections (P2), model mesh / members (P3), loads, Revit / DXF output (the existing DXF builder stays).

**Transverse members:** P1 provides the geometry of support lines and lines at any skew. **It does not assume transverse members are perpendicular to girders.** The P3 builder chooses the orientation.

## 3. Design

- **Package:** `pdf2bim/geometry/` (Python 3.11+, standard library + numpy).
  - `alignment.py`: horizontal elements with an exact spiral (series to convergence 1e-12), vertical curves, `point(ch, offset) → (E, N, RL)` and the inverse `station(E, N) → (ch, offset)`.
  - `supports.py`: support lines, bearings.
  - `girders.py`: chords and the end / bearing setback.
  - `deck.py`: edges, widths, flange edges.
  - `model.py`: typed result objects with ids (`G1`, `A-G1`, support `A`) and derivation records.
- **Interface:**

  ```python
  geometry = build_geometry(description: dict) -> Geometry
  ```

  `Geometry` serialises to JSON (MGA, metres), with a hash of the input description.
- **Lessons applied** (CONTROL_LINE_RECONSTRUCTION_METHOD):
  - horizontal and vertical are computed independently (the earlier coupling bug);
  - no general-purpose geometry library for spirals (the earlier library bug);
  - no arbitrary local origin (the coordinate-offset trap); MGA throughout, and the base point is used only for MCT export.
- **The JavaScript dashboard is unchanged in P1.** It remains the reference. Switching the dashboard to the Python geometry is a P3 / P5 step after verification.

## 4. Steps (each a small commit on branch `p1-geometry`, from the reviewed base)

1. Test fixtures: the 4 synthetic validation cases as small bridge descriptions with hand-checked expected coordinates (written and checked first, before code).
2. Horizontal alignment + unit tests (tangent, arc, spiral; chainage round trip).
3. Vertical alignment + crossfall + tests.
4. Support lines and bearings + tests (square and skewed).
5. Girder chords + deck edges + flange edges + tests (4 cases).
6. BR13A run: compare with the baseline `geom.*` and with the control-line validation data; difference report.
7. Docs: method note, `CURRENT_STATUS`, `VERIFICATION_STRATEGY` §5 results. Stop for review.

## 5. Open points for the owner

1. **Who checks the hand coordinates of the 4 synthetic cases?** I prepare them with derivations; an independent check is recommended (ADR-012, T2).
2. Bearing setback from the support line along the girder: BR13A uses a Model value. Should P1 take it from the description as a per-support value? Proposed: yes, tagged.
3. **Python version and packaging** for your Windows machine without admin rights: proposed Python 3.11+, numpy only, installed with `pip --user`.
