# P2 sections and products — method and results

**Status:** implemented 2026-10-24 on branch `p2-sections` (`pdf2bim/sections/`, `library/products/supert.json`). **Tests:** `tests/sections/test_sections.py`; results in §3. Section properties are **Calculated** from the description and the P1 geometry.

## 1. What it computes

| Item | Method |
|---|---|
| Super-T product data | `library/products/supert.json`, extracted from the dashboard code (`library/extract_supert.py`): T1–T5 dimensions, shared shape defaults, published property table (30 rows). Status **code-extracted-unverified** (not checked against the TfNSW standard drawings) |
| One Super-T definition (ADR-004) | Product type (`supert_types[].section = lib:supert/T4`) + drawing overrides (`supert_types[].shape`, new catalogue table) → parameters, with the provenance of each (`param_source`) |
| Outline | Port of the dashboard `secGeom()`: open / closed / solid configurations, generalised to **unequal left / right flange tips** (flared edge girders) |
| Properties | Exact polygon integrals (Green's theorem): A, centroid, Ix (vertical bending), Iy (lateral), with voids and modular-ratio parts |
| Composite | Girder (E_girder) + deck slab (E_deck, n = E_d / E_g) on the top flange with `supert_types[].haunch`. Deck width per girder from P1: flange edges + flange_gap/2 to the neighbours; on the outer side, to the deck edge |
| Torsion J | Finite differences on the Prandtl stress function: a port of the validated `claude/torsion_fd.py`. Composite J on the real geometry (closed cell formed by the deck over the trough), as **one material** (stated) |
| Along the girder | At the P1 flange stations (t = 0 … 1 between bearings), per girder |

**Rules:**
- Missing inputs stop the build with the field name.
- Proposed records are used only with `allow_proposed`, and are listed as provisional.
- If `zones` (solid end blocks) is empty, the output says so and only the open section is produced. Nothing is assumed.

## 2. BR13A inputs added (proposed, awaiting the engineer)

- **D-35 — Super-T shape** (13 parameters) in `supert_types[ST1].shape`.
  - The B2 importer had read only 5 of the 13 Section-designer rows. It missed the detail rows, including **ttf = 90 mm (Direct, DRG 202304)**, so the definition would have fallen back silently to the product default of 75 mm.
  - Values and tags are copied from the dashboard v45 state.
- **D-36 — haunch: Assumed 0 mm.** This is the dashboard default and is not a drawing value; it must be replaced.

## 3. Verification (executed 2026-10-24; `tests/sections/test_sections.py` 24 / 24 PASS)

| Test | Benchmark | Result |
|---|---|---|
| Polygon integrals | Hand formulas: rectangle, T-section (parallel axes), tube, modular ratio, clockwise outline | Exact |
| Super-T outline, 30 cases | Published property table (T1–T5; open / closed flange; W 1800 / 2100 / 2400) | All within 0.47 % (A, yb, I). Worst case T5 (T5 tolerance 0.5 %). The table is code-extracted, not yet checked against TfNSW |
| BR13A one definition | Dashboard `secGeom` (V5) | A, yb, I equal to 1e-5 |
| Torsion, solid rectangle | Exact series | 0.57 % (h 5 mm), 0.14 % (h 2.5); Richardson estimate within 0.1 % |
| Torsion, closed cell | Thick circular tube π/2(Ro⁴ − Ri⁴) (exact) | 0.8 % (h 1 mm; T6 tolerance 2 %) |
| BR13A G2 / G3 midspan composite | Frozen-model G2-M / G3-M composites (V5) and the member-properties report: A 1.030e6, yc 1100, I 3.83e11, J 2.0e11 | A, I within 0.1 %; J within 0.1 % |
| BR13A G1 / G4 midspan composite | Frozen model (no flare, gap D-2) | Differs in the direction of the flare: G1 −4.9 %, G4 +8.3 % area. **Expected:** the model ignores the flare |
| Refusals | No proposed values; unknown type; flange tip inside the fillet | Refused, naming the field |

## 4. BR13A results (provisional)

- Full table: `projects/BR13A/sections/BR13A.sections.md` (11 stations × 4 girders).
- **Edge-girder flare now in the section properties.** G1 composite area: 1.018e6 mm² at the ends, 0.952e6 at midspan. G4: 1.018e6 at the ends, 1.097e6 at midspan.
- **Inner girders:** the composite area grows from A to B (1.014e6 → 1.047e6 mm²), because the chord spacing grows (P1 finding 5).
- **J:**
  - composite closed cell about 2.0e11 mm⁴;
  - girder alone (open) about 6.3e9 mm⁴, about 32× smaller.

  The deck closing the trough dominates torsion.

## 5. Limits and open items

- **Solid end blocks:** `zones` is empty in the description, so no solid segments are produced. The drawing values in the member-properties method (2000 END DIAPHRAGM, 518 to the bearing) still need confirmation (Task B-1). They are **not assumed**.
- **Haunch** is Assumed 0 mm (D-36). The composite stiffness depends on it.
- **Composite J** is a single-material figure (n = 0.94 not applied to the deck for J).
- **Shear areas:** not produced. The dashboard's open-girder Asz is overstated about 3.6× (member-properties method §12); P3 will compute shear areas properly.
- **The product library is unverified** (code-extracted). It must be checked against the TfNSW Super-T standard drawings before design use.
- **The dashboard / frozen model do not use these sections yet** (P3).
