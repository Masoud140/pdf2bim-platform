# BR13A traffic (M1600 / S1600, characteristic): P3c engine vs the dashboard's Traffic tab

Characteristic envelopes (DLA and accompanying lane factors included, no load factor). Default options as the dashboard: lateral wheel shift ±0.4 m, patterned UDL, no DLA on the UDL, 0.25 m vehicle steps. **Cross-implementation comparison (V5), not verification.** Standards values used are code-extracted-UNVERIFIED (lane width, M1600 / S1600, DLA, lane factors).

Columns: **Dash/frozen** = the dashboard engine on its frozen model; **P3c/frozen** = the P3c engine on the same frozen model (isolates the engine); **P3c/P3b** = the P3c engine on the P3b integrated model (adds the model differences).

## Lane layout: lanes packed from the left kerb (dashboard default)

### M1600

| Girder | max M Dash/frozen | P3c/frozen | Δ engine | P3c/P3b | Δ total | min uz Dash/frozen (mm) | P3c/frozen | P3c/P3b |
|---|---|---|---|---|---|---|---|---|
| G1 | 3455 | 3548 | +2.7 % | 3383 | -2.1 % | -24.10 | -24.74 | -24.84 |
| G2 | 3232 | 3280 | +1.5 % | 3282 | +1.5 % | -21.91 | -22.21 | -22.47 |
| G3 | 3004 | 3031 | +0.9 % | 3033 | +1.0 % | -20.28 | -20.47 | -20.56 |
| G4 | 2734 | 2758 | +0.9 % | 2880 | +5.3 % | -18.30 | -18.45 | -18.66 |

| Bearing | max R Dash/frozen (kN) | P3c/frozen | Δ engine | P3c/P3b | Δ total |
|---|---|---|---|---|---|
| A-G1 | 1092.4 | 1062.4 | -2.7 % | 1064.4 | -2.6 % |
| A-G2 | 753.7 | 770.1 | +2.2 % | 733.3 | -2.7 % |
| A-G3 | 560.5 | 558.5 | -0.4 % | 509.6 | -9.1 % |
| A-G4 | 237.3 | 237.2 | -0.0 % | 286.3 | +20.6 % |
| B-G1 | 694.5 | 682.4 | -1.8 % | 673.1 | -3.1 % |
| B-G2 | 1002.8 | 770.2 | -23.2 % | 753.0 | -24.9 % |
| B-G3 | 743.3 | 709.9 | -4.5 % | 719.5 | -3.2 % |
| B-G4 | 476.3 | 479.6 | +0.7 % | 501.4 | +5.3 % |

### S1600

| Girder | max M Dash/frozen | P3c/frozen | Δ engine | P3c/P3b | Δ total | min uz Dash/frozen (mm) | P3c/frozen | P3c/P3b |
|---|---|---|---|---|---|---|---|---|
| G1 | 2703 | 2843 | +5.2 % | 2715 | +0.4 % | -18.97 | -19.92 | -19.98 |
| G2 | 2545 | 2662 | +4.6 % | 2663 | +4.6 % | -17.40 | -18.17 | -18.36 |
| G3 | 2333 | 2449 | +5.0 % | 2450 | +5.0 % | -15.87 | -16.64 | -16.75 |
| G4 | 2120 | 2220 | +4.7 % | 2314 | +9.1 % | -14.12 | -14.77 | -14.96 |

| Bearing | max R Dash/frozen (kN) | P3c/frozen | Δ engine | P3c/P3b | Δ total |
|---|---|---|---|---|---|
| A-G1 | 814.7 | 802.1 | -1.6 % | 807.6 | -0.9 % |
| A-G2 | 575.3 | 585.6 | +1.8 % | 563.1 | -2.1 % |
| A-G3 | 428.1 | 420.8 | -1.7 % | 383.9 | -10.3 % |
| A-G4 | 166.6 | 164.5 | -1.3 % | 203.2 | +21.9 % |
| B-G1 | 489.8 | 489.9 | +0.0 % | 481.4 | -1.7 % |
| B-G2 | 710.3 | 584.3 | -17.7 % | 572.4 | -19.4 % |
| B-G3 | 558.4 | 546.9 | -2.1 % | 554.6 | -0.7 % |
| B-G4 | 345.5 | 357.5 | +3.5 % | 374.2 | +8.3 % |

## Lane layout: swept across the carriageway (21 positions)

### M1600

| Girder | max M Dash/frozen | P3c/frozen | Δ engine | P3c/P3b | Δ total | min uz Dash/frozen (mm) | P3c/frozen | P3c/P3b |
|---|---|---|---|---|---|---|---|---|
| G1 | 3460 | 3548 | +2.6 % | 3383 | -2.2 % | -24.13 | -24.74 | -24.84 |
| G2 | 3237 | 3280 | +1.3 % | 3282 | +1.4 % | -21.95 | -22.21 | -22.47 |
| G3 | 3260 | 3301 | +1.3 % | 3274 | +0.5 % | -22.26 | -22.54 | -22.14 |
| G4 | 3624 | 3666 | +1.2 % | 3825 | +5.6 % | -25.32 | -25.62 | -25.40 |

| Bearing | max R Dash/frozen (kN) | P3c/frozen | Δ engine | P3c/P3b | Δ total |
|---|---|---|---|---|---|
| A-G1 | 1092.4 | 1062.4 | -2.7 % | 1064.4 | -2.6 % |
| A-G2 | 838.9 | 771.7 | -8.0 % | 733.3 | -12.6 % |
| A-G3 | 928.9 | 742.0 | -20.1 % | 679.0 | -26.9 % |
| A-G4 | 748.6 | 755.4 | +0.9 % | 784.3 | +4.8 % |
| B-G1 | 694.5 | 682.4 | -1.8 % | 673.1 | -3.1 % |
| B-G2 | 1024.9 | 770.2 | -24.9 % | 753.0 | -26.5 % |
| B-G3 | 1141.1 | 793.6 | -30.5 % | 767.2 | -32.8 % |
| B-G4 | 1184.8 | 1185.6 | +0.1 % | 1199.0 | +1.2 % |

### S1600

| Girder | max M Dash/frozen | P3c/frozen | Δ engine | P3c/P3b | Δ total | min uz Dash/frozen (mm) | P3c/frozen | P3c/P3b |
|---|---|---|---|---|---|---|---|---|
| G1 | 2722 | 2843 | +4.4 % | 2715 | -0.3 % | -19.08 | -19.92 | -19.98 |
| G2 | 2566 | 2662 | +3.7 % | 2663 | +3.8 % | -17.54 | -18.17 | -18.36 |
| G3 | 2511 | 2677 | +6.6 % | 2656 | +5.8 % | -17.32 | -18.45 | -18.13 |
| G4 | 2766 | 2943 | +6.4 % | 3066 | +10.9 % | -19.40 | -20.61 | -20.46 |

| Bearing | max R Dash/frozen (kN) | P3c/frozen | Δ engine | P3c/P3b | Δ total |
|---|---|---|---|---|---|
| A-G1 | 814.7 | 802.1 | -1.6 % | 807.6 | -0.9 % |
| A-G2 | 618.8 | 586.7 | -5.2 % | 563.1 | -9.0 % |
| A-G3 | 667.0 | 565.4 | -15.2 % | 518.8 | -22.2 % |
| A-G4 | 524.0 | 546.7 | +4.3 % | 574.4 | +9.6 % |
| B-G1 | 489.8 | 489.9 | +0.0 % | 481.4 | -1.7 % |
| B-G2 | 729.5 | 584.3 | -19.9 % | 572.4 | -21.5 % |
| B-G3 | 811.1 | 596.7 | -26.4 % | 584.6 | -27.9 % |
| B-G4 | 893.8 | 897.3 | +0.4 % | 910.1 | +1.8 % |

## Engine check: the dashboard's distribution rule reproduced (sweep)

The P3c engine run with the dashboard's own load-distribution rule (trW: between constant-offset node lines; a point beyond a line's end goes to its end node) on the frozen model reproduces the dashboard's envelope, which checks the lane, vehicle, DLA, patterning and lane-factor logic:

| Model | largest |Δ| girder max M | largest |Δ| bearing max R |
|---|---|---|
| M1600 | 0.01 % | 0.81 % |
| S1600 | 0.01 % | 0.63 % |

## Finding H-5: one-node 'lines' at the bearing nodes

In the dashboard's mesh the bearing nodes sit off the girder / web lines (F-4); its rule makes each of them a one-node 'line' (offsets -3.928, -0.54, 0.486, 3.218 m) that collects the load at that offset over the WHOLE span and puts it straight onto the bearing node. Removing only those one-node lines from the same rule:

| Bearing (M1600, sweep) | Dashboard | Dashboard rule without one-node lines | P3c triangles, frozen model |
|---|---|---|---|
| A-G1 | 1092 | 1065 (-3 %) | 1062 |
| A-G2 | 839 | 772 (-8 %) | 772 |
| A-G3 | 929 | 739 (-20 %) | 742 |
| A-G4 | 749 | 754 (+1 %) | 755 |
| B-G1 | 695 | 680 (-2 %) | 682 |
| B-G2 | 1025 | 771 (-25 %) | 770 |
| B-G3 | 1141 | 791 (-31 %) | 794 |
| B-G4 | 1185 | 1195 (+1 %) | 1186 |

The dashboard's inner-bearing traffic reactions are therefore overstated (up to ≈ +44 %) and its girder moments slightly understated (1–6 %). Without the one-node lines the dashboard rule and the P3c triangulation agree closely.

## Finding H-4: the dashboard's default lane layout

The dashboard's default ('def') packs the lanes against the left kerb and does not move them. Swept across the carriageway, the M1600 envelope rises (dashboard engine, frozen model):

| Quantity | Left-packed (default) | Swept | Ratio |
|---|---|---|---|
| G1 max M (kN·m) | 3455 | 3460 | 1.00 |
| G2 max M (kN·m) | 3232 | 3237 | 1.00 |
| G3 max M (kN·m) | 3004 | 3260 | 1.09 |
| G4 max M (kN·m) | 2734 | 3624 | 1.33 |
| A-G1 max R (kN) | 1092 | 1092 | 1.00 |
| A-G2 max R (kN) | 754 | 839 | 1.11 |
| A-G3 max R (kN) | 560 | 929 | 1.66 |
| A-G4 max R (kN) | 237 | 749 | 3.15 |
| B-G1 max R (kN) | 695 | 695 | 1.00 |
| B-G2 max R (kN) | 1003 | 1025 | 1.02 |
| B-G3 max R (kN) | 743 | 1141 | 1.54 |
| B-G4 max R (kN) | 476 | 1185 | 2.49 |

The P3c engine uses the sweep by default.
