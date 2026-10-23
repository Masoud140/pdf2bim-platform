# BR13A.bridge.json — summary

**Catalogue fields: 489 values** — Assumed 177, Calculated 92, Direct 70, Standard-verify 62, Model 50, Input-user 24, Missing-Flagged 10, Confirmed-Engineer 4
**Custom (project-specific rows): 439 values** — Direct 279, Calculated 94, Missing-Flagged 43, Confirmed-Engineer 18, Model 5

## Missing — flagged (catalogue)

| Path | Value | Note |
|---|---|---|
| `project.importance_level` | null | Not in the drawing set; needed for the earthquake return period |
| `project.design_life` | null | Not in the drawing set |
| `deck.other_sdl` | null | Nothing shown on the GA |
| `superstructure.supert_types[ST1].deck_bars.rows[*]` | "2 rows" |  |
| `superstructure.supert_types[ST1].transfer_supports` | null | Hog uses the bearing offset when blank |
| `superstructure.supert_types[ST1].age_at_erection` | null |  |
| `loads.pedestrian` | null | Footway not confirmed; pedestrian load still ticked in the Combos tab and taken as zero |
| `loads.flood` | null | Not addressed |
| `loads.collision` | null | Not addressed |

## Assumed (catalogue) — to be replaced

| Path | Value used | Replace with |
|---|---|---|
| `deck.barriers[barrier_left].height` | 1100.0 | barrier drawing DRG 202401 / product sheet |
| `deck.barriers[barrier_left].weight` | 8 | barrier drawing DRG 202401 / product sheet |
| `deck.barriers[barrier_left].solid` | true | barrier drawing |
| `deck.barriers[barrier_right].height` | 1100.0 | barrier drawing DRG 202401 / product sheet |
| `deck.barriers[barrier_right].weight` | 8 | barrier drawing DRG 202401 / product sheet |
| `deck.barriers[barrier_right].solid` | true | barrier drawing |
| `superstructure.supert_types[ST1].concrete_transfer` | 40 | girder drawings / specification |
| `superstructure.supert_types[ST1].strand_pattern.rows[*]` | "48 rows" | girder drawings (strand pattern / debonding not in this set) |
| `superstructure.supert_types[ST1].jacking_ratio` | 0.75 | girder drawings / specification |
| `superstructure.supert_types[ST1].bars.rows[*]` | "18 rows" | girder drawings |
| `superstructure.supert_types[ST1].age_at_transfer` | 7 | construction programme |
| `superstructure.supert_types[ST1].age_deck_cast` | 60 | construction programme |
| `bearings.items[A-G1].plan_a` | 400 | bearing schedule |
| `bearings.items[A-G1].plan_b` | 500 | bearing schedule |
| `bearings.items[A-G1].elastomer_thickness` | 60 | bearing schedule |
| `bearings.items[A-G1].shear_modulus` | 0.69 | supplier / AS 5100.4 |
| `bearings.items[A-G1].height` | 150.0 | bearing schedule / girder seat detail |
| `bearings.items[A-G2].plan_a` | 400 | bearing schedule |
| `bearings.items[A-G2].plan_b` | 500 | bearing schedule |
| `bearings.items[A-G2].elastomer_thickness` | 60 | bearing schedule |
| `bearings.items[A-G2].shear_modulus` | 0.69 | supplier / AS 5100.4 |
| `bearings.items[A-G2].height` | 150.0 | bearing schedule / girder seat detail |
| `bearings.items[A-G3].plan_a` | 400 | bearing schedule |
| `bearings.items[A-G3].plan_b` | 500 | bearing schedule |
| `bearings.items[A-G3].elastomer_thickness` | 60 | bearing schedule |
| `bearings.items[A-G3].shear_modulus` | 0.69 | supplier / AS 5100.4 |
| `bearings.items[A-G3].height` | 150.0 | bearing schedule / girder seat detail |
| `bearings.items[A-G4].plan_a` | 400 | bearing schedule |
| `bearings.items[A-G4].plan_b` | 500 | bearing schedule |
| `bearings.items[A-G4].elastomer_thickness` | 60 | bearing schedule |
| `bearings.items[A-G4].shear_modulus` | 0.69 | supplier / AS 5100.4 |
| `bearings.items[A-G4].height` | 150.0 | bearing schedule / girder seat detail |
| `bearings.items[B-G1].plan_a` | 400 | bearing schedule |
| `bearings.items[B-G1].plan_b` | 500 | bearing schedule |
| `bearings.items[B-G1].elastomer_thickness` | 60 | bearing schedule |
| `bearings.items[B-G1].shear_modulus` | 0.69 | supplier / AS 5100.4 |
| `bearings.items[B-G1].height` | 150.0 | bearing schedule / girder seat detail |
| `bearings.items[B-G2].plan_a` | 400 | bearing schedule |
| `bearings.items[B-G2].plan_b` | 500 | bearing schedule |
| `bearings.items[B-G2].elastomer_thickness` | 60 | bearing schedule |
| `bearings.items[B-G2].shear_modulus` | 0.69 | supplier / AS 5100.4 |
| `bearings.items[B-G2].height` | 150.0 | bearing schedule / girder seat detail |
| `bearings.items[B-G3].plan_a` | 400 | bearing schedule |
| `bearings.items[B-G3].plan_b` | 500 | bearing schedule |
| `bearings.items[B-G3].elastomer_thickness` | 60 | bearing schedule |
| `bearings.items[B-G3].shear_modulus` | 0.69 | supplier / AS 5100.4 |
| `bearings.items[B-G3].height` | 150.0 | bearing schedule / girder seat detail |
| `bearings.items[B-G4].plan_a` | 400 | bearing schedule |
| `bearings.items[B-G4].plan_b` | 500 | bearing schedule |
| `bearings.items[B-G4].elastomer_thickness` | 60 | bearing schedule |
| `bearings.items[B-G4].shear_modulus` | 0.69 | supplier / AS 5100.4 |
| `bearings.items[B-G4].height` | 150.0 | bearing schedule / girder seat detail |
| `supports[A].piles[A1].ground_rl` | 126.739 | embankment / spill-through levels, geotechnical report |
| `supports[A].piles[A2].ground_rl` | 126.892 | embankment / spill-through levels, geotechnical report |
| `supports[A].piles[A3].ground_rl` | 127.045 | embankment / spill-through levels, geotechnical report |
| `supports[A].piles[A4].ground_rl` | 127.199 | embankment / spill-through levels, geotechnical report |
| `supports[A].soil_layers.rows[*]` | {"name": "Embankment fill", "rl_top": null, "kh": 10, "gamma": 20, "phi": 30} | geotechnical report |
| `supports[A].rock_kh` | 200 | geotechnical report |
| `supports[A].backfill.rows[*]` | {"gamma": 20, "phi": 30, "K": "K0", "retained_height": null} | geotechnical report |
| `supports[B].piles[B1].ground_rl` | 125.723 | embankment / spill-through levels, geotechnical report |
| `supports[B].piles[B2].ground_rl` | 125.88 | embankment / spill-through levels, geotechnical report |
| `supports[B].piles[B3].ground_rl` | 126.037 | embankment / spill-through levels, geotechnical report |
| `supports[B].piles[B4].ground_rl` | 126.194 | embankment / spill-through levels, geotechnical report |
| `supports[B].soil_layers.rows[*]` | {"name": "Embankment fill", "rl_top": null, "kh": 10, "gamma": 20, "phi": 30} | geotechnical report |
| `supports[B].rock_kh` | 200 | geotechnical report |
| `supports[B].backfill.rows[*]` | {"gamma": 20, "phi": 30, "K": "K0", "retained_height": null} | geotechnical report |
| `materials.strand.rows[*]` | {"type": "15.2 mm strand", "diameter": 15.2, "area": 140, "fpb": null, "Ep": 200 | girder drawings / specification |
| `loads.design_speed` | 60 | road design criteria |
| `loads.braking_force` | 500 | AS 5100.2 Cl 7.8.2 calculation |
| `loads.traffic_surcharge` | 10 | AS 5100.2 earth pressure from traffic |
| `loads.wind.rows[*]` | "8 rows" | site / project data |
| `loads.temperature.rows[*]` | "4 rows" | site / project data |
| `loads.gradient_positive.rows[*]` | "13 rows" | AS 5100.2 Cl 18.3 profile |
| `loads.gradient_negative.rows[*]` | "13 rows" | AS 5100.2 Cl 18.3 profile |
| `loads.shrinkage_creep_shortening` | 300 | Hog time analysis + creep |
| `loads.earthquake.rows[*]` | "4 rows" | project seismic criteria / geotechnical report |

## Decisions waiting for the engineer

- none

Decision log: 33 entries (Counter({'accepted': 32, 'superseded': 1}))
