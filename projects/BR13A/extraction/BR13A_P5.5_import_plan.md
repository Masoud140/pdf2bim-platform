# Takeoff import plan — `BR13A_P5.5_values.xlsx` into revision 11

same 47, overrides 3, queries 19, refused 0, new_paths 3.

## Override proposals

- `loads.earthquake.rows[0]`: {"item": "kp", "value": "1.7"} (Assumed → Direct, tag upgrade; BR13A_GA_Rev02.pdf DRG-202001 cover sheet, earthquake loading notes (text layer, line starts cut) '…Y FACTOR kp: 1.7')
- `loads.earthquake.rows[1]`: {"item": "Z", "value": "0.08"} (Standard-verify → Direct, tag upgrade; BR13A_GA_Rev02.pdf DRG-202001 cover sheet, earthquake loading notes (text layer, line starts cut) '…ARD FACTOR Z: 0.08')
- `loads.earthquake.rows[2]`: {"item": "site_class", "value": "Be"} (Assumed → Direct, value; BR13A_GA_Rev02.pdf DRG-202001 cover sheet, earthquake loading notes (text layer, line starts cut) '…L CLASS: Be')

## Queries for the engineer (never applied)

- row 7 `alignment.vertical.rows[0]`: conflict with the description's Direct value — description {"ch": 1742.793, "RL": 134.391, "grade_in": null, "grade_out": null, "curve_length": null}, extraction {"ch": 1742.793, "RL": 134.391, "grade_in": null, "grade_out": -4.971, "curve_length": null}
- row 8 `alignment.vertical.rows[1]`: conflict with the description's Direct value — description {"ch": 1896.831, "RL": 131.729, "grade_in": null, "grade_out": null, "curve_length": 308.075}, extraction {"ch": 1896.831, "RL": 131.729, "grade_in": -4.971, "grade_out": -1.728, "curve_length": 308.075}
- row 9 `alignment.vertical.rows[2]`: conflict with the description's Direct value — description {"ch": 2050.869, "RL": 124.072, "grade_in": null, "grade_out": null, "curve_length": null}, extraction {"ch": 2050.869, "RL": 124.072, "grade_in": -1.728, "grade_out": null, "curve_length": null}
- row 36 `supports[A].headstock.rows[0]`: conflict with the description's Direct value — description {"width": 1700, "depth": 1520, "length": 10.928, "rl_top": null, "rl_soffit": null}, extraction {"width": 1700, "depth": 1500, "length": 10.928, "rl_top": null, "rl_soffit": null}
- row 37 `supports[B].headstock.rows[0]`: conflict with the description's Direct value — description {"width": 1700, "depth": 1520, "length": 11.445, "rl_top": null, "rl_soffit": null}, extraction {"width": 1700, "depth": 1500, "length": 11.445, "rl_top": null, "rl_soffit": null}
- row 42 `supports[A].headstock_setout.rows[0]`: extraction did not find the value the description holds as Direct — description {"edge": "front", "value": 835}, extraction null
- row 43 `supports[B].headstock_setout.rows[0]`: extraction did not find the value the description holds as Direct — description {"edge": "front", "value": 824}, extraction null
- row 46 `supports[A].piles[A1].rl_rock`: extraction did not find the value the description holds as Direct — description 116.27, extraction null
- row 49 `supports[A].piles[A2].rl_rock`: extraction did not find the value the description holds as Direct — description 116.27, extraction null
- row 52 `supports[A].piles[A3].rl_rock`: extraction did not find the value the description holds as Direct — description 116.27, extraction null
- row 55 `supports[A].piles[A4].rl_rock`: extraction did not find the value the description holds as Direct — description 116.27, extraction null
- row 57 `supports[B].piles[B1].rl_toe`: conflict with the description's Direct value — description 109.984, extraction 109.987
- row 58 `supports[B].piles[B1].rl_rock`: extraction did not find the value the description holds as Direct — description 116.484, extraction null
- row 60 `supports[B].piles[B2].rl_toe`: conflict with the description's Direct value — description 109.984, extraction 109.987
- row 61 `supports[B].piles[B2].rl_rock`: extraction did not find the value the description holds as Direct — description 116.484, extraction null
- row 63 `supports[B].piles[B3].rl_toe`: conflict with the description's Direct value — description 109.984, extraction 109.987
- row 64 `supports[B].piles[B3].rl_rock`: extraction did not find the value the description holds as Direct — description 116.484, extraction null
- row 66 `supports[B].piles[B4].rl_toe`: conflict with the description's Direct value — description 109.984, extraction 109.987
- row 67 `supports[B].piles[B4].rl_rock`: extraction did not find the value the description holds as Direct — description 116.484, extraction null

## Refused rows


## Paths not in the description

- row 71 `loads.earthquake.rows[mu_longitudinal]` = {"item": "mu_longitudinal", "value": "1.0"}
- row 72 `loads.earthquake.rows[mu_transverse]` = {"item": "mu_transverse", "value": "1.5"}
- row 73 `loads.earthquake.rows[bedc]` = {"item": "bedc", "value": "BEDC-4"}

Applied: 3 proposal(s) under D-43 (status proposed).
