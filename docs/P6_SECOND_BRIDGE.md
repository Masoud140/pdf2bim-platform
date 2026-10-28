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

## 5. Next

1. Owner answers on the flange overlap and the sill depth; replace the Assumed inputs with the design report, the bearing catalogue and the geotechnical report.
2. Traffic (7 lanes, SM1600) and the combinations on B12626; compare pile actions with 109035 Table 4.
3. G-1 (per-side flange setback) and G-3 (crowned sill), if the owner wants them modelled.
