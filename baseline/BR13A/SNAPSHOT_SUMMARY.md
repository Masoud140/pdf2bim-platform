# BR13A baseline snapshot — summary

> **Status: INDICATIVE.** Every value below is a reproducible output of the current software. None is a verified engineering result. Reasons are recorded per quantity in `snapshot.json` (field `reasons`).

## Run record

- Created: 2026-10-23T04:32:31.911Z (100.1 s)
- Git: `7d00263e8e4d360092ec86bdaf4825887046bdb6` on `p0.1-baseline` (tracked files modified: False)
- Dashboard: `dist/BR13A_grillage_dashboard.html` sha256 `710b259d2c7117d00c5caa1b1ec0dc02249fba33c0939b171c29e563f1032ca0`
- Embedded .mct sha256 `7b8caf568cd383706f92b0acf920428b62d4441471dec746ced995be009f667e`
- Bridge description sha256 `0ec378f688bc65d8959d2232b5c202f71bc20fc84c64a3ce4bef45a4dc425bb3`; decision log `ecd2c92b719eead47e3bd57cc79b16ec89f04d198710feb3a5d3c504be0855d2`
- Note: The dashboard runs on its embedded data (P parameters + frozen .mct). The bridge description is recorded for traceability but is NOT read by the dashboard (B-1).
- Environment: Node v22.22.0, Playwright 1.56.0, Chromium 141.0.7390.37
- Command: `node tools/baseline_snapshot.js --out baseline/BR13A/snapshot.json`
- Quantities: 953

## Consistency checks (evaluated in the run)

| Check | Value | Limit | Result | Basis |
|---|---|---|---|---|
| chk.equilibrium.SDL — Sum of SDL vertical bearing reactions vs applied SDL total (superstructure) | 4.84853e-10 | relative residual <= 0.001 | PASS | statics |
| chk.pile_stiffness — Pile head lateral stiffness: discretised model vs Hetenyi beam-on-elastic-foundation hand value | 0.0148922 | |ratio-1| <= 0.05 (provisional) | PASS | closed form |
| chk.temp.TU+.G1 — Girder elongation under uniform temperature: model vs free alpha*dT*L | 0.00487834 | |ratio-1| <= 0.01 (free longitudinal bearing at one end) | PASS | closed form |
| chk.temp.TU+.G2 — Girder elongation under uniform temperature: model vs free alpha*dT*L | -0.00047884 | |ratio-1| <= 0.01 (free longitudinal bearing at one end) | PASS | closed form |
| chk.temp.TU+.G3 — Girder elongation under uniform temperature: model vs free alpha*dT*L | -0.00299932 | |ratio-1| <= 0.01 (free longitudinal bearing at one end) | PASS | closed form |
| chk.temp.TU+.G4 — Girder elongation under uniform temperature: model vs free alpha*dT*L | -0.00216551 | |ratio-1| <= 0.01 (free longitudinal bearing at one end) | PASS | closed form |
| chk.temp.TU−.G1 — Girder elongation under uniform temperature: model vs free alpha*dT*L | 0.00487834 | |ratio-1| <= 0.01 (free longitudinal bearing at one end) | PASS | closed form |
| chk.temp.TU−.G2 — Girder elongation under uniform temperature: model vs free alpha*dT*L | -0.00047884 | |ratio-1| <= 0.01 (free longitudinal bearing at one end) | PASS | closed form |
| chk.temp.TU−.G3 — Girder elongation under uniform temperature: model vs free alpha*dT*L | -0.00299932 | |ratio-1| <= 0.01 (free longitudinal bearing at one end) | PASS | closed form |
| chk.temp.TU−.G4 — Girder elongation under uniform temperature: model vs free alpha*dT*L | -0.00216551 | |ratio-1| <= 0.01 (free longitudinal bearing at one end) | PASS | closed form |
| chk.modal_mass — Modal analysis total mass vs structure + SDL mass | -8.88178e-16 | |ratio-1| <= 1e-6 | PASS | bookkeeping |
| chk.no_js_exceptions — No uncaught JavaScript exceptions during the run | 0 | = 0 | PASS | software |
| chk.no_console_errors — No other console errors during the run | 0 | = 0 | PASS | software |
| chk.no_svg_nan — No SVG elements drawn with NaN / Infinity coordinates (plot defect, known issue H-2) | 88 | = 0 | **FAIL** | software |
| chk.combination_complete — Combined actions run finished, not capped | 0 | Done and not capped | PASS | software |

These checks test the software's internal consistency (statics, closed-form comparisons). They do not validate the inputs or the engineering rules.

## Geometry and sections

| Girder | Chord length (m) | Offset (m) | Self-weight midspan uz (mm) |
|---|---|---|---|
| G1 | 30.1616 | -3.1656 | -17.62 |
| G2 | 30.0825 | -0.8552 | -18.32 |
| G3 | 29.9999 | 1.4552 | -18.07 |
| G4 | 29.9130 | 3.7656 | -19.02 |

- Design section (Girder definition): D 1515 mm, deck 200 mm, deck width 2289.6 mm, A 594164 mm², I 1.8144e+11 mm⁴, yb 723.1 mm, strands 48 (placeholder)
- Pile head stiffness: model 2740.3 kN/m, Hetenyi hand 2700.1 kN/m

## Modal (first 6 modes)

| Mode | T (s) | Meff L | Meff T | Meff V |
|---|---|---|---|---|
| 1 | 0.667 | 0.596 | 0.055 | 0.000 |
| 2 | 0.377 | 0.007 | 0.615 | 0.000 |
| 3 | 0.298 | 0.003 | 0.001 | 0.395 |
| 4 | 0.261 | 0.082 | 0.090 | 0.005 |
| 5 | 0.175 | 0.005 | 0.000 | 0.000 |
| 6 | 0.163 | 0.094 | 0.034 | 0.000 |

- Total mass 1047.3 t

## Bearing vertical reactions (kN, compression +)

| Bearing | DL | SDL | M1600 max | ULS max | ULS min | SLS max |
|---|---|---|---|---|---|---|
| A L1 | 739 | 168 | 1092 | 3266 | 446 | 2036 |
| A L2 | 661 | 73 | 754 | 2594 | 409 | 1724 |
| A L3 | 616 | 78 | 560 | 2287 | 328 | 1551 |
| A L4 | 465 | 121 | 237 | 1377 | 64 | 925 |
| B L5 | 424 | 124 | 695 | 2196 | 277 | 1387 |
| B L6 | 573 | 63 | 1003 | 2689 | 427 | 1687 |
| B L7 | 641 | 62 | 743 | 2273 | 458 | 1484 |
| B L8 | 849 | 205 | 476 | 2474 | 549 | 1685 |

## Girder actions (envelope over the girder's elements; kNm / kN)

| Girder / quantity | DL max | SDL max | M1600 max | ULS max | ULS min | SLS max |
|---|---|---|---|---|---|---|
| G1 GM1 | 3296 | 700 | 3455 | 11935 | -272 | 7807 |
| G1 GV | 322 | 98 | 488 | 1508 | -2213 | 956 |
| G1 GT | 1 | 42 | 176 | 434 | -1785 | 180 |
| G2 GM1 | 3329 | 636 | 3232 | 11450 | -828 | 7540 |
| G2 GV | 386 | 77 | 559 | 1656 | -2061 | 1058 |
| G2 GT | -0 | 11 | 450 | 1003 | -1783 | 488 |
| G3 GM1 | 3408 | 643 | 3004 | 11181 | -960 | 7430 |
| G3 GV | 509 | 98 | 616 | 1950 | -1676 | 1267 |
| G3 GT | 1 | 30 | 340 | 748 | -1557 | 366 |
| G4 GM1 | 3457 | 708 | 2726 | 10954 | -758 | 7338 |
| G4 GV | 548 | 132 | 449 | 1780 | -1343 | 1194 |
| G4 GT | -0 | 61 | 176 | 515 | -1269 | 408 |

## Pile actions (ULS envelope over the pile length)

| Pile | N max | N min | Ml max | Ml min | Mt max | Mt min |
|---|---|---|---|---|---|---|
| A1 | 4213 | -153 | 1903 | -1069 | 962 | -1288 |
| A2 | 3830 | 356 | 1879 | -1058 | 1027 | -1140 |
| A3 | 3058 | 261 | 1888 | -1054 | 1120 | -1048 |
| A4 | 2423 | -661 | 1880 | -1048 | 1237 | -1003 |
| B1 | 3106 | -366 | 687 | -1591 | 748 | -934 |
| B2 | 2699 | 344 | 701 | -1595 | 856 | -945 |
| B3 | 2774 | 443 | 701 | -1589 | 917 | -876 |
| B4 | 3595 | 244 | 689 | -1581 | 953 | -765 |

## Super-T design (design locations)

| Location | uS (SLS) | uST | uB (ULS bending) | uL (shear/torsion) | Mu (kNm) | φMu (kNm) | dn (mm) |
|---|---|---|---|---|---|---|---|
| LC1 | 0.423 | 0.000 | 0.686 | 0.866 | 18326 | 14661 | 239.0 |
| LC2 | 0.339 | 0.000 | 0.549 | 0.758 | 18374 | 14700 | 232.8 |
| LC3 | 0.079 | 0.000 | 0.156 | 0.382 | 18495 | 14796 | 219.7 |
| LC4 | -0.000 | 0.791 | 0.044 | 0.369 | -1359 | -1087 | 161.4 |

- Along the girder (48 stations, all design combinations): max uS 0.454 at x = 14.34 m; max uB 1.171 at x = 0.75 m; max uL 3.966 at x = 0.75 m

## Limitations recorded in the snapshot

- All quantities are INDICATIVE: reproducible outputs of the current software, not verified engineering results.
- Combination: missing load cases reported by the engine: {"PED":1142} (pedestrian load taken as 0).
- Load case tags (C Calculated, A Assumed-input, S Standard): DLc:C SDLp:A SOo:A SOc:A EPT:A BRKR:A CENR:A TUW:A TUC:A WX_U:A WX_35:A WX_S:A WY_U:A WY_35:A WY_S:A WZ_U:A WZ_35:A WZ_S:A TGP:A TGN:A SCR:A EQX:A EQY:A M1600:S S1600:S
- Self-weight displacements come from the Analysis tab (frozen grillage .mct, gravity), not from the integrated substructure model.
- Design results use the TfNSW T4 standard strand/bar layout as a placeholder (D-1).

## Why the values are indicative (count of quantities per reason)

| Reason | Quantities |
|---|---|
| integrated model not independently verified (no independent MIDAS model, G-1) | 705 |
| standard values not yet verified against authorised copies (ADR-009) | 595 |
| load case built from Assumed inputs | 568 |
| combination approximations: separate M/V/T traffic envelopes, unsigned earthquake (F-1) | 474 |
| frozen BR13A .mct, flared flange widths not in model stiffness (E-2, D-2) | 418 |
| pedestrian load missing (taken as 0) | 308 |
| strands and bars are placeholders (TfNSW T4 layout, D-1) | 215 |
| design engine neutral-axis discrepancy vs worked example (E-1) | 166 |
| section properties not checked against an independent calculation in this run | 61 |
| geometry not yet independently checked against the 4 P1 validation cases | 56 |
| soil / rock springs from Assumed inputs | 56 |
| mesh on offset curves, not straight chords (C-2) | 4 |
