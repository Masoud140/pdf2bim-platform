# P6 — second bridge (B12626) through the unchanged chain

**Status 2026-10-28:** stages 1–3b done. The platform chain (description → geometry → sections → integrated model → loads →
MIDAS .mct) runs on B12626. The results are **PROVISIONAL**: they use decision **D-1 (PROPOSED)**, the development inputs the drawings do not give.

Source: owner PDF `Second_Example.pdf` (72 sheets, DS2023/000442, IFC rev 00). It is not committed. Survey and extraction notes: `projects/B12626/extraction/SURVEY.md`.

## 1. Pipeline (repeatable)

| Step | Tool | Output |
|---|---|---|
| Extract | `projects/B12626/extraction/build_values.py` | `B12626_values.json`: every value with its sheet, view and tag |
| Map to the catalogue | `projects/B12626/extraction/to_description.py` | `B12626_description_values.json` |
| New description | `tools/new_description.py` (generic) | `projects/B12626/B12626.bridge.0.2.json`, revision 1, extracted values only |
| Development inputs | `projects/B12626/dev_inputs.py` | revision 2: 173 overrides proposed under D-1 (166 Assumed, 5 Standard-verify, 2 Calculated) |
| Chain | `tools/export_mct.py --allow-proposed` | `projects/B12626/model/B12626.integrated.mct` and its checklist |

**What `new_description` does:**
- It writes every catalogue field.
- Any field the extraction does not fill is written as Missing-Flagged: value null, status open. Nothing is invented.
- Revision 1 records the extracted state as the original.
- It refuses a path the catalogue does not know, or a unit other than the catalogue's.
- It never writes over an existing description.

**How the development inputs work:**
- They are overrides with status *proposed*. The extracted values stay the current values.
- Tools use the proposals only with `--allow-proposed`.
- The owner accepts, changes or rejects them through the decision tool (ADR-005).
- **Calculated** items are arithmetic on drawing values.
- **Assumed** items name what should replace them.
- **Standard-verify** items point to unverified standards entries.
- A table row that does not exist yet is written as a Missing-Flagged placeholder in revision 1, because the format can only override an existing record.

## 2. Generality gaps found by the second bridge

| Id | Gap (BR13A-specific behaviour) | Fix |
|---|---|---|
| G-1 | `superstructure.edge_flange_setback` is one value per bridge. B12626 needs 36 mm east and 43 mm west. | **Open.** Assumed 40 mm, giving outer flanges of 1156.5 / 1162.5 instead of 1160. A catalogue change to a per-side setback is needed. |
| G-2 | The sill and the piles used one concrete row, and piles could only be solid concrete. | **Fixed.** Sill concrete (row naming headstock / sill / abutment) and pile concrete are now looked up separately. Concrete-filled steel tube piles are supported: catalogue `piles.wall_thickness` and `materials.steel`. The tube is transformed to the infill concrete (uncracked, full bond: a Model choice). The weight includes both materials. The MCT writes SR plus `*SECT-SCALE` area / inertia factors; **WGT_SF = the area factor is UNVERIFIED in MIDAS**. |
| G-3 | The sill soffit is taken as one straight line through the pile heads. B12626's sill is crowned: pile tops 5.977 / 6.122 / 6.266. | **Open.** The model sill stays straight and rigid arms reach the pile heads. The check reports a 173 mm residual. |
| G-4 | Pile and bearing ids shared one key on the sill. B12626 uses A-01 for both, so piles hung from the wrong sill nodes: the sill rotated and the self-weight deflection was 130 mm. | **Fixed.** The key is now (kind, id). Self-weight deflection is 23.2 mm against a hand value of 20.7 mm. |
| G-5 | The builder searched only 12 m along a line to find the deck edge (BR13A is 9 m wide). | **Fixed.** The search range scales with the offset. |
| G-6 | The SDL deck-end search ran past the start of the alignment table, which begins 5 m before the deck. | **Fixed.** The search is clamped to the table. |
| G-7 | A Missing `seat_rl` record counted as "given", which blocked the top_rl − bearing_height route. | **Fixed.** |
| G-8 | The check "piles on the line of bearings" assumed BR13A's layout. B12626's piles are 175 mm behind the bearings, on the sill centre. | **Fixed.** The check is now "piles inside the sill width". |
| G-9 | The MCT import checklist had BR13A's link and spring counts written in. | **Fixed.** |
| G-10 | There was no way to start a description for a new bridge. | **Fixed:** `tools/new_description.py` (7 tests). |
| G-11 | Sections added the half flange gap to the deck width only when the neighbour's id started with "G" (BR13A: G1…G4). B12626's girders are SG-01…, so every interior girder lost 24 mm of deck. | **Fixed.** The test is now "neighbour is not the deck edge"; an interior girder carries 2344 mm. |
| G-12 | Prestress inputs always took strand area and MBL from the AS 5100.5 table (140 mm², 250 kN), and refused a different `materials.strand.area`. B12626's drawings specify 1830 MPa strand with MBL 261 kN. | **Fixed.** When `materials.strand` gives area and fpb (from the drawings), those are used; otherwise the table, as before. |

## 3. Data findings (owner)

- **Median girders:** the flanges are 1160 on every girder sheet. At the 2269 spacing across the median they overlap by 51 mm.
  - The platform trims both median flanges to 1122.5.
  - **Owner:** which is right, the spacing or a trimmed flange that isn't drawn?
- **Pile diameter:** 109031 lists 900, but 109035 says "∅900 ID", so the outside diameter is 932.
  - The description uses OD 932 (Calculated).
- **Sill:**
  - Overall length is 23 412 on 109051 / 052. The GA "abutment length" of 26 315 / 26 312 includes the wingwalls.
  - The section gives a depth of 1575 (A) / 1925 (B) below the seat; the elevation shows "1350 / 1700 TYP".
  - **Owner:** what does the elevation figure measure?
- **Levels and alignment:**
  - RL 9.493 is printed both as the design surface (109011) and as the top of concrete (109302).
  - The alignment table has two typos (SURVEY.md).
- **Not on the drawings:**
  - Bearing elastomer layers and G (catalogue part only).
  - Soil layers and moduli ("refer geotechnical report").
  - Temperature, gradient, shrinkage, braking and surcharge (design report not supplied).
- **Benchmark available:** 109035 Table 4 gives pile design loads (both abutments, not concurrent).
  - SLS N 3535 kN; ULS N 5175 kN.
  - ULS M 1831 kNm in the concrete and 50 kNm in the steel.
  - These can be compared once traffic and the combinations run.

## 4. Results (provisional, D-1)

| Quantity | Platform | Check |
|---|---|---|
| Support points vs printed SOPs | 3.8 mm (MC10 lies off the setout line) | < 5 mm |
| Girder length end to end | 27.900 ×10 | 27 900 printed |
| Typical flange tip | 1160.0 | 1160 printed |
| Self weight | 16 926 kN, reactions equal | equilibrium |
| Midspan self-weight deflection | 23.2 mm | 20.7 mm by hand (one girder, simply supported) |
| SDL | 1960.6 kN | 1967.6 kN by hand |
| MIDAS export | 951 nodes, 1452 elements, 20 bearing links, 298 springs | round trip: self weight to 1e-5, translations to 0.01 mm |

Tests: `tests/model/test_b12626_chain.py` (10), `tests/schema/test_new_description.py` (7), `tests/model/test_substructure.py` (+2 for the filled tube pile).

## 4a. Stage 4 (2026-11-02): girder reinforcement and benchmarks against the designer's numbers

**Extracted:**
- **Strands (109206):** 48 × 15.2 mm, all straight.
  - Rows A–E at 60 + 4 × 50 mm, columns 25 + 5 × 50 mm each side; row F has 2 strands at ±495 mm, 80 mm below the top.
  - Debonding: 8 strands for 7000, 6 for 5000, 6 for 3000, and row F for 800 from each end. The counts are checked against the drawing.
- **Prestress:** jacking ratio 190 / 261 = 0.728 (Calculated). Strand area = MBL / fpb = 142.6 mm².
- **Web fitments:** N16, 2 legs, in zones from end A (Calculated from bundle counts × spacing).
  - SG-02…09: @100 / 200 / 300 / 200 / 100.
  - SG-01 and SG-10: @100 / 200 / 100. They become girder type ST2.
  - The 1.5 m end diaphragm zones are not listed (other bar marks).
- **Deck longitudinal bars:** N16 @150 each face; cover 61 mm to them (45 mm to the outer transverse bars + 16).
- **Hog table (109201):** transfer 41 mm, 28 days 53 mm, 90 days 60 mm; wet deck slab 23 mm.

**Benchmarks (provisional D-1 inputs):**

| Quantity | Designer (drawing) | Platform | Difference |
|---|---|---|---|
| Pile N, SLS (109035 Table 4) | 3535 kN | 3626 kN | +2.6 % |
| Pile N, ULS | 5175 kN | 5399 kN | +4.3 % |
| Pile M, ULS | 1831 + 50 kNm | 2312 kNm | +23 %: earthquake-governed, placeholder soil (kh 10 MN/m³) |
| Wet-deck deflection | 23 mm | 24.4 mm (elastic, girder alone) | +6 % |
| Hog at transfer | 41 mm | 48.4 mm | +18 % |
| Hog at 28 / 90 days | 53 / 60 mm | 89.5 / 106.5 mm | growth after transfer about 3× the designer's |

- **H-11 (engineer):** the platform's time-dependent hog is far above the designer's.
  - The model is the dashboard's AS 5100.5 creep / shrinkage engine, loading at a 1-day age.
  - Ep and E at transfer change it by less than 2 %. The simplified method gives 94 mm and transfer at 3 days gives 100 mm.
  - The designer's calculation is not in the drawing set.
  - The creep model and the age at loading for steam-cured girders need review before the platform's hog or SLS losses are relied on.
- Report: `projects/B12626/model/B12626.hog_vs_drawing.md` (`projects/B12626/hog_vs_drawing.py`). Combined actions: `projects/B12626/model/B12626.combined_actions.md`.

## 4b. Stage 5 (2026-11-02): girder design checks on the real strands and fitments

`tools/girder_checks.py` on B12626 (`projects/B12626/model/B12626.girder_checks.md`, summary at the top). Inputs: strand pattern Direct (109206); fitments Calculated from the bundle counts; girder longitudinal bars not extracted; losses inputs as D-1. Also added: fitment cover 30 mm and aggregate 14 mm (Direct, 109251 / 109201).

| Girders | SLS Ms*/Mal | ULS M*/φMu | Shear / torsion u |
|---|---|---|---|
| SG-01, SG-10 (edge) | 0.87–0.88 | **1.04** | **1.00–1.01** (uL, @200 zone) |
| SG-02, SG-09 | 0.77 | 0.96 | 0.89 |
| SG-03…SG-08 | 0.59–0.68 | 0.85–0.89 | 0.67–0.76 |

An IFC design should not exceed 1.0, so the platform is conservative somewhere for the edge girders. The likely cause is visible in the governing row (ULS-B-0156): the whole SDL case takes the 'permanent' factor 2.0, barriers included. AS 5100.2 has a 'special case' factor of 1.4 for SDL that is accurately known, which precast barriers may qualify for.
- With 1.4 on the barriers, the edge-girder M* drops by roughly 450 kNm, giving u ≈ 1.00. This is an estimate, not a run.
- **H-12 (engineer):**
  - Split the SDL case into barriers and surfacing.
  - Choose the barrier factor: 2.0 (as now) or 1.4.
  - This applies to BR13A too.
- **Other contributors:** H-11 (losses / hog) and the D-1 placeholders for wind, temperature and the barrier centroid.

Also fixed this stage:
- **G-13:** the girder-checks report quoted BR13A decision ids (D-1, D-42, D-45, D-46) in its header. It now states the input tags and the proposed decisions in use, and opens with a summary table.
- The fpb note now names where MBL came from.

## 5. Next

1. Owner answers on the flange overlap and the sill depth; replace the Assumed inputs with the design report, the bearing catalogue and the geotechnical report.
2. Traffic (7 lanes, SM1600) and the combinations on B12626; compare pile actions with 109035 Table 4.
3. G-1 (per-side flange setback) and G-3 (crowned sill), if the owner wants them modelled.
