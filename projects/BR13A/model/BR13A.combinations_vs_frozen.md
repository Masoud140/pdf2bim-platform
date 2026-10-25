# BR13A AS 5100.2 combinations and combined actions: P3c vs the dashboard

All load factors and combination constants are code-extracted-UNVERIFIED standards entries (AS5100.2:load_factor:*, AS5100.2:combination:*). Load-case inputs are Assumed / Standard-verify. **V5 comparison, not verification; nothing here is design-approved.**

## 1. Engine check: generated rows (P3c generate vs dashboard genAll)

| Set | Rows P3c / dashboard | Capped | Row text SHA-256 equal |
|---|---|---|---|
| default | 1315 / 1315 | False / False | yes |
| pm_m | 4885 / 4885 | False / False | yes |
| wm_v | 1713 / 1713 | False / False | yes |
| wm_a | 1713 / 1713 | False / False | yes |
| k_custom | 1315 / 1315 | False / False | yes |
| no_pw | 1315 / 1315 | False / False | yes |
| all_but_SDLr | 5532 / 5532 | True / True | yes |
| rail_flood | 2888 / 2888 | False / False | yes |
| collision_barrier | 464 / 464 | False / False | yes |

## 2. Engine check: evaluation of the dashboard's primitives (P3c combine vs dashboard rxCombine)

Responses: all 151 quantities of the bearings and of piles A1 and B4. Terms without a primitive (dashboard and P3c): {'PED': 1142} / {'PED': 1142}.

| Limit state | Rows | Largest |Δ| max | Largest |Δ| min | Largest value | Governing rows that differ |
|---|---|---|---|---|---|
| ULS | 512 / 512 | 0.0e+00 | 0.0e+00 | 4213 | 0 |
| SLS | 803 / 803 | 0.0e+00 | 0.0e+00 | 2739 | 0 |

## 3. Platform (P3b model, P3c load cases) vs dashboard, same register selection and rows

Rows: 1315 (512 ULS, 803 SLS). Pedestrian (PED) is selected in the dashboard but has no load case in either: its 1142 terms contribute nothing (dashboard: 1142).

### Bearing vertical force v (compression +), kN

| Bearing | ULS max P3c | ULS max dash | ULS min P3c | ULS min dash | SLS max P3c | SLS max dash | SLS min P3c | SLS min dash | Match dist (m) |
|---|---|---|---|---|---|---|---|---|---|
| A-G1 | 3002 | 3266 | 126 | 446 | 1830 | 2036 | 182 | 484 | 0.02 |
| A-G2 | 2643 | 2594 | 216 | 409 | 1759 | 1724 | 657 | 732 | 0.00 |
| A-G3 | 2526 | 2287 | 161 | 328 | 1681 | 1551 | 603 | 700 | 0.00 |
| A-G4 | 2193 | 1377 | -162 | 64 | 1308 | 925 | -37 | 265 | 0.03 |
| B-G1 | 2123 | 2196 | 115 | 277 | 1335 | 1387 | 377 | 463 | 0.02 |
| B-G2 | 2100 | 2689 | 245 | 427 | 1320 | 1687 | 432 | 594 | 0.00 |
| B-G3 | 2191 | 2273 | 316 | 458 | 1400 | 1484 | 537 | 672 | 0.00 |
| B-G4 | 3629 | 2474 | 361 | 549 | 2277 | 1685 | 741 | 916 | 0.03 |

### Pile actions, ULS (largest over the pile's element ends): |M| about the sill axis (Ml) and about its normal (Mt), kN·m; N (compression +), kN

| Pile | Ml P3c | Ml dash | Mt P3c | Mt dash | N max P3c | N max dash | N min P3c | N min dash |
|---|---|---|---|---|---|---|---|---|
| A1 | 1789 | 1903 | 1103 | 1288 | 4079 | 4213 | -198 | -153 |
| A2 | 1775 | 1879 | 1068 | 1140 | 3379 | 3830 | 369 | 356 |
| A3 | 1777 | 1888 | 1025 | 1120 | 3011 | 3058 | 277 | 261 |
| A4 | 1782 | 1880 | 1050 | 1237 | 3152 | 2423 | -522 | -661 |
| B1 | 1478 | 1591 | 925 | 934 | 2872 | 3106 | -449 | -366 |
| B2 | 1483 | 1595 | 947 | 945 | 2398 | 2699 | 269 | 344 |
| B3 | 1481 | 1589 | 904 | 917 | 2671 | 2774 | 344 | 443 |
| B4 | 1479 | 1581 | 922 | 953 | 4543 | 3595 | 74 | 244 |

### Girders (largest over the girder line), kN·m / kN

| Girder | ULS M sag P3c | dash | ULS M hog P3c | dash | ULS |V| P3c | dash | ULS |T| P3c | dash | SLS M sag P3c | dash |
|---|---|---|---|---|---|---|---|---|---|---|
| G1 | 10871 | 11935 | -3063 | -2280 | 2125 | 2213 | 1776 | 1785 | 6940 | 7807 |
| G2 | 10761 | 11450 | -1474 | -1279 | 1952 | 2061 | 1789 | 1783 | 6905 | 7540 |
| G3 | 10849 | 11181 | -1234 | -1006 | 1824 | 1950 | 1867 | 1557 | 6983 | 7430 |
| G4 | 12309 | 10954 | -1582 | -758 | 2256 | 1780 | 1814 | 1269 | 7866 | 7338 |

### Sills / headstocks, ULS largest |value| over the sill (member axes)

| Support | |My| P3c | dash | |Vz| P3c | dash | |Mz| P3c | dash | |Vy| P3c | dash | |T| P3c | dash |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 2153 | 4254 | 3230 | 3485 | 680 | 461 | 670 | 520 | 1562 | 1563 |
| B | 2032 | 2174 | 3817 | 2670 | 802 | 802 | 431 | 423 | 949 | 981 |

## 4. Platform default selection (only actions with an analysed case)

Actions: BRKR, CENR, DLc, EPT, EQX, EQY, M1600, S1600, SCR, SDLp, SOo, TGN, TGP, TUC, TUW, WX, WY, WZ. Rows: 1578. Not combined (flagged): PED (loads.pedestrian: Missing-Flagged — not analysed, not combined); FLH (loads.flood: Missing-Flagged — not analysed, not combined); COLX (loads.collision: Missing-Flagged — not analysed, not combined).
Earth pressure carried by SOo (fill category not in the description: provisional).

| Bearing | ULS max v | ULS min v | SLS min v | Uplift (min < 0) |
|---|---|---|---|---|
| A-G1 | 3002 | 105 | 174 | no |
| A-G2 | 2643 | 216 | 657 | no |
| A-G3 | 2526 | 161 | 603 | no |
| A-G4 | 2199 | -162 | -37 | **yes** |
| B-G1 | 2123 | 115 | 377 | no |
| B-G2 | 2100 | 245 | 432 | no |
| B-G3 | 2193 | 316 | 537 | no |
| B-G4 | 3629 | 361 | 741 | no |

Bearing uplift (negative v) in a combination is reported, not resolved: AS 5100.2 combinations of Assumed inputs on a provisional model (see the bearing findings F-5, F-6, M-1, M-3).
