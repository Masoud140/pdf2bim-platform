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

## 3. Verification

The results table is written after the test run (§3 is updated with the executed figures).
