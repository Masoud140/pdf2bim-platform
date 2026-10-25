# Decisions waiting for the engineer — BR13A.bridge.0.2.json revision 11

9 proposed decision(s). Generated; do not edit.

## D-34 — `alignment.support_lines.rows[0]`

Structure the support-line bearing that the description already records as Direct (alignment.support_lines.note: 'Support line bearing 44.029166° (Direct, DRG 202012)') into the new bearing column, so the geometry engine can fix the support-line direction. Check: 44.029166° is 34.498° from the normal to the control-line chord A-B, consistent with the confirmed skew 34.5° (D-4). Needs engineer acceptance (ADR-005).

- proposed by AI on 2026-10-24T13:00:00+11:00; affects geometry, model
- evidence: DRG-202012 skew diagram (via alignment.support_lines.note)
- values (2): `alignment.support_lines.rows[0]`, `alignment.support_lines.rows[1]`
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-34 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-34 --by "<your name>" --reject --note "<why>"`

## D-35 — `superstructure/supert_types/ST1/shape`

Complete the Super-T shape definition in the catalogue field supert_types[ST1].shape. The B2 importer read only the 5 main Section-designer rows (SROWS) and skipped the 8 detail rows (SDET), so the drawing value ttf = 90 mm (top flange thickness, tagged Direct in the dashboard, DRG 202304) was missing; without it the sections would silently use the product default 75 mm. Values and tags are copied from the dashboard v45 state (projects/BR13A/source/dashboard_v45_state.json: secGeo, STAG). Needs engineer acceptance.

- proposed by AI on 2026-10-24T15:30:00+11:00; affects design.supert, model
- evidence: projects/BR13A/source/dashboard_v45_state.json (secGeo, STAG); DRG-202304 girder section
- values (13): `superstructure.supert_types[ST1].shape.rows[0]`, `superstructure.supert_types[ST1].shape.rows[1]`, `superstructure.supert_types[ST1].shape.rows[2]`, `superstructure.supert_types[ST1].shape.rows[3]`, `superstructure.supert_types[ST1].shape.rows[4]`, `superstructure.supert_types[ST1].shape.rows[5]`, `superstructure.supert_types[ST1].shape.rows[6]`, `superstructure.supert_types[ST1].shape.rows[7]` …
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-35 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-35 --by "<your name>" --reject --note "<why>"`

## D-36 — `superstructure/supert_types/ST1/haunch`

The girder-to-deck haunch (gap between the Super-T top flange and the deck soffit) is not in the drawing set read so far. The dashboard uses 0 mm as a default ('replace with project value', MEMBER_PROPERTIES_METHOD §12). Proposed as an Assumed 0 mm so the composite section can be computed; it changes the composite stiffness and must be replaced with the drawing value.

- proposed by AI on 2026-10-24T15:31:00+11:00; affects design.supert, model
- evidence: claude/MEMBER_PROPERTIES_METHOD.md §12 (haunch gap assumed 0, dashboard default)
- values (1): `superstructure.supert_types[ST1].haunch`
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-36 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-36 --by "<your name>" --reject --note "<why>"`

## D-37 — `superstructure/cross_girders`

Record the support-line cross girders in the new catalogue table superstructure.cross_girders: 800 mm wide (plan width normal to the skewed face) x 1065 mm deep, as answered by the engineer in the design query of 2026-10-13 (BR13A_Design_Query_Perimeter_Members.docx, recorded in claude/MEMBER_PROPERTIES_METHOD.md section 10), read from the cross-girder detail on DRG 202011. Concrete taken as the deck grade (40 MPa) as in the dashboard - to confirm. Needed by the model builder (P3).

- proposed by AI on 2026-10-24T13:30:00+11:00; affects loads, model
- evidence: claude/MEMBER_PROPERTIES_METHOD.md section 10 (engineer query response 2026-10-13); DRG-202011 cross-girder detail
- values (2): `superstructure.cross_girders.rows[0]`, `superstructure.cross_girders.rows[1]`
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-37 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-37 --by "<your name>" --reject --note "<why>"`

## D-38 — `superstructure/supert_types/ST1/zones`

Solid end blocks: '2000 END DIAPHRAGM' is printed on the PSC girder plan / elevation (DRG 202302 sheet C, 202303 sheet D), read as the along-girder length of the solid end block from each girder end (claude/MEMBER_PROPERTIES_METHOD.md section 2.2). The interpretation is NOT yet confirmed on the elevation view (Task B-1); the frozen dashboard model uses solid end sections. Proposed so the model builder can represent them; must be confirmed before use in design.

- proposed by AI on 2026-10-24T13:31:00+11:00; affects design.supert, model
- evidence: DRG-202302 sheet C / DRG-202303 sheet D: 2000 END DIAPHRAGM callout; claude/MEMBER_PROPERTIES_METHOD.md section 2.2 (Task B-1 pending)
- values (2): `superstructure.supert_types[ST1].zones.rows[0]`, `superstructure.supert_types[ST1].zones.rows[1]`
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-38 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-38 --by "<your name>" --reject --note "<why>"`

## D-39 — `supports/A/headstock_setout + supports/B/headstock_setout`

Structure the headstock (sill beam) plan setout already in the description's abutment takeoff (custom.takeoff_abutments rows 21-27, Direct / Calculated) into the new catalogue table supports[].headstock_setout, so the substructure model builder can place the sill beam. Sign convention read from the takeoff: front face positive = toward the span; start = south end (negative), end = north end (positive) along the printed bearing-line direction 044 deg 01'45" (toward the northern side, takeoff row 17). The sill end positions are the FRONT-FACE ends; the model uses them for the centroid line (sill end faces assumed square to the line of bearings, not confirmed). No new values: structuring only.

- proposed by AI on 2026-10-24T15:40:00+11:00; affects model
- evidence: custom.takeoff_abutments rows 17, 21-27; DRG-202100 / 202101 plan dimension chains; DRG-202103 Sec 3/7
- values (8): `supports[A].headstock_setout.rows[0]`, `supports[A].headstock_setout.rows[1]`, `supports[A].headstock_setout.rows[2]`, `supports[A].headstock_setout.rows[3]`, `supports[B].headstock_setout.rows[0]`, `supports[B].headstock_setout.rows[1]`, `supports[B].headstock_setout.rows[2]`, `supports[B].headstock_setout.rows[3]`
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-39 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-39 --by "<your name>" --reject --note "<why>"`

## D-40 — `bearings/items/A-G1/layer_thickness + bearings/items/A-G2/layer_thickness + bearings/items/A-G3/layer_thickness + bearings/items/A-G4/layer_thickness + bearings/items/B-G1/layer_thickness + bearings/items/B-G2/layer_thickness + bearings/items/B-G3/layer_thickness + bearings/items/B-G4/layer_thickness`

Internal elastomer layer thickness is not in the drawing set (bearing schedule missing). The dashboard divides the Assumed 60 mm total into layers of about 12 mm (src/sub.js S.brg: n = round(T/12), t = T/n = 12 mm) to get the shape factor for the compression stiffness Kv. Recorded as an explicit Assumed placeholder so the vertical bearing stiffness can be computed and is visibly provisional. Replace with the bearing schedule / supplier data.

- proposed by AI on 2026-10-24T15:41:00+11:00; affects model
- evidence: src/sub.js line 22 (S.brg); bearings.items[*].elastomer_thickness (Assumed 60 mm)
- values (8): `bearings.items[A-G1].layer_thickness`, `bearings.items[A-G2].layer_thickness`, `bearings.items[A-G3].layer_thickness`, `bearings.items[A-G4].layer_thickness`, `bearings.items[B-G1].layer_thickness`, `bearings.items[B-G2].layer_thickness`, `bearings.items[B-G3].layer_thickness`, `bearings.items[B-G4].layer_thickness`
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-40 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-40 --by "<your name>" --reject --note "<why>"`

## D-41 — `bearings/items/A-G1/seat_rl + bearings/items/A-G2/seat_rl + bearings/items/A-G3/seat_rl + bearings/items/A-G4/seat_rl + bearings/items/B-G1/seat_rl + bearings/items/B-G2/seat_rl + bearings/items/B-G3/seat_rl + bearings/items/B-G4/seat_rl`

Structure the bearing seat RLs already in the abutment takeoff (custom.takeoff_abutments group 4, Direct from DRG 202280-202282) into the new catalogue field bearings.items[*].seat_rl, so the substructure builder can place the bearing seats. The takeoff does not say which girder each drawing bearing serves (Missing-Flagged); the AI assigns them BY ORDER along the line of bearings (A: drawing bearing 4 = G1 ... 1 = G4; B: 1 = G1 ... 4 = G4), which the RLs confirm (seat RL rises with the deck crossfall in the same order as the girder soffits). No new values. NOTE F-5: the takeoff bearing POSITIONS along the line of bearings (A: 4977 / 2251 / -810 / -3706; B: -3708 / -812 / 2249 / 4976 mm) differ from the P1 bearing centres (girder line x support line) by 50-530 mm; the positions are NOT used. Engineer to resolve which is correct.

- proposed by AI on 2026-10-24T19:40:00+11:00; affects model
- evidence: custom.takeoff_abutments group 4 rows 90-112 (A and B); DRG-202281 (202280-202282); projects/BR13A/geometry/BR13A.geometry.json (bearing centres)
- values (8): `bearings.items[A-G1].seat_rl`, `bearings.items[A-G2].seat_rl`, `bearings.items[A-G3].seat_rl`, `bearings.items[A-G4].seat_rl`, `bearings.items[B-G1].seat_rl`, `bearings.items[B-G2].seat_rl`, `bearings.items[B-G3].seat_rl`, `bearings.items[B-G4].seat_rl`
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-41 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-41 --by "<your name>" --reject --note "<why>"`

## D-42 — `design/prestress_losses`

Record the prestress-loss / camber inputs that the dashboard's Hog Calculator uses for BR13A and that the description does not hold (environment, relaxation data, stage times, loads on the girder, method switches), as Assumed placeholders in the new field design.prestress_losses, so the ported losses analysis (pdf2bim/design/prestress.py) can run from the description. Geometry, section, strands, bars, concrete and ages are NOT duplicated: they come from the description / P1 / P2. Standards values (Table 3.1.2, Table 3.3.1, basic drying shrinkage, transmission length) are standards entries, not project data. Every value is a placeholder to replace.

- proposed by AI on 2026-10-25T23:00:00+11:00; affects design.supert
- evidence: tests/design/fixtures/br13a_dashboard_hog.json (dashboard Hog inputs p); base/BR13A_grillage_dashboard_v15.html Hog input table (demo defaults)
- values (29): `design.prestress_losses.rows[0]`, `design.prestress_losses.rows[1]`, `design.prestress_losses.rows[2]`, `design.prestress_losses.rows[3]`, `design.prestress_losses.rows[4]`, `design.prestress_losses.rows[5]`, `design.prestress_losses.rows[6]`, `design.prestress_losses.rows[7]` …
- recorded outputs that become stale: projects/BR13A/model/BR13A.combined_actions.json, projects/BR13A/model/BR13A.integrated.mct.json, projects/BR13A/model/BR13A.traffic_concurrent.json
- accept: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-42 --by "<your name>"`
- reject: `python3 schema/accept_decision.py projects/BR13A/BR13A.bridge.0.2.json --decision D-42 --by "<your name>" --reject --note "<why>"`

