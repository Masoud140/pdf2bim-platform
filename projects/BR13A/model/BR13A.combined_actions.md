# Combined actions — AS 5100.2 ULS / SLS envelopes (P3c)

**INDICATIVE. Not design-approved.** Load factors and combination constants: code-extracted-UNVERIFIED standards entries. Load-case inputs: Assumed / Standard-verify / Model values of the description; model from accepted values. Values only: no capacity check. Units kN, kN·m, m.

Run: `projects/BR13A/BR13A.bridge.0.2.json` sha256 0217dacc6291ef21…, engine `ab355fa` (+ uncommitted changes), 602 ULS + 976 SLS rows; actions BRKR, CENR, DLc, EPT, EQX, EQY, M1600, S1600, SCR, SDLp, SOo, TGN, TGP, TUC, TUW, WX, WY, WZ.

Not combined (no analysed case): PED — loads.pedestrian: Missing-Flagged — not analysed, not combined; FLH — loads.flood: Missing-Flagged — not analysed, not combined; COLX — loads.collision: Missing-Flagged — not analysed, not combined.

Provisional inputs used: 1 (listed in the .json). Governing row names refer to the rows in the .json.

## Bearings (link axes: v vertical, compression +; tr transverse; lon longitudinal)

| Bearing | ULS v max | ULS v min | SLS v max | SLS v min | ULS |tr| | ULS |lon| | Governing (ULS v max / min) |
|---|---|---|---|---|---|---|---|
| A-G1 | 3000 | 104 | 1829 | 173 | 1531 | 1811 | ULS-B-0090 / ULS-B-0479 |
| A-G2 | 2646 | 215 | 1762 | 658 | 598 | 666 | ULS-B-0108 / ULS-K-0005 |
| A-G3 | 2526 | 160 | 1681 | 604 | 796 | 1100 | ULS-B-0156 / ULS-K-0006 |
| A-G4 **uplift** | 2202 | -173 | 1310 | -44 | 1204 | 1170 | ULS-B-0462 / ULS-B-0107 |
| B-G1 | 2124 | 153 | 1336 | 378 | 533 | 0 | ULS-B-0084 / ULS-B-0485 |
| B-G2 | 2097 | 241 | 1317 | 429 | 412 | 0 | ULS-B-0156 / ULS-B-0359 |
| B-G3 | 2190 | 355 | 1399 | 536 | 559 | 0 | ULS-B-0216 / ULS-H-0013 |
| B-G4 | 3635 | 360 | 2280 | 741 | 276 | 0 | ULS-B-0090 / ULS-B-0425 |

## Piles (ULS; largest over the pile's element ends)

| Pile | |Ml| (about sill axis) | gov | |Mt| (about its normal) | gov | N max (compr.) | N min | gov (N max / min) |
|---|---|---|---|---|---|---|---|---|
| A1 | 1456 | ULS-H-0001 | 850 | ULS-H-0005 | 4083 | 84 | ULS-B-0088 / ULS-H-0013 |
| A2 | 1435 | ULS-H-0001 | 805 | ULS-H-0005 | 3364 | 375 | ULS-B-0108 / ULS-B-0407 |
| A3 | 1437 | ULS-H-0001 | 761 | ULS-H-0005 | 2998 | 282 | ULS-B-0156 / ULS-B-0359 |
| A4 | 1449 | ULS-H-0001 | 799 | ULS-H-0005 | 3154 | -488 | ULS-B-0135 / ULS-B-0106 |
| B1 | 1243 | ULS-H-0005 | 699 | ULS-H-0005 | 2871 | -169 | ULS-B-0082 / ULS-H-0013 |
| B2 | 1245 | ULS-H-0005 | 702 | ULS-H-0005 | 2398 | 331 | ULS-B-0156 / ULS-H-0013 |
| B3 | 1244 | ULS-H-0005 | 657 | ULS-H-0005 | 2685 | 423 | ULS-B-0216 / ULS-H-0013 |
| B4 | 1242 | ULS-H-0005 | 692 | ULS-H-0005 | 4572 | 342 | ULS-B-0198 / ULS-H-0013 |

## Girders (section actions; M sagging +)

| Girder | ULS M sag | at ch | ULS M hog | at ch | ULS |V| | at ch | ULS |T| | SLS M sag | gov (ULS M sag) |
|---|---|---|---|---|---|---|---|---|---|
| G1 | 10872 | 1911.27 | -3096 | 1897.33 | 2128 | 1897.33 | 1775 | 6940 | ULS-B-0084 |
| G2 | 10762 | 1911.27 | -1493 | 1895.84 | 1955 | 1895.84 | 1788 | 6905 | ULS-B-0084 |
| G3 | 10852 | 1908.47 | -1255 | 1923.14 | 1825 | 1923.14 | 1867 | 6985 | ULS-B-0084 |
| G4 | 12313 | 1908.47 | -1586 | 1921.45 | 2257 | 1921.45 | 1814 | 7867 | ULS-B-0102 |

## Sills / headstocks (member axes; s = position along the sill from its first node)

| Support | ULS My max | s | ULS My min | s | ULS Mz max | ULS Mz min | ULS |Vz| | ULS |Vy| | ULS |T| |
|---|---|---|---|---|---|---|---|---|---|
| A | 1625 | 2.08 | -1965 | 1.89 | 684 | -466 | 3228 | 672 | 1562 |
| B | 1802 | 9.01 | -772 | 1.21 | 99 | -803 | 3823 | 401 | 944 |

## Concurrent actions at the governing ULS extremes (P4.2)

Each value: the governing combination row with every envelope term replaced by the one state that gives its value (traffic: the rebuilt vehicle / lane state; vertical wind, surcharge: the governing case). Earthquake terms use the most probable concurrent values from the CQC covariance (P4.3); ⚠ marks any term that is still an envelope without a concurrent state.

### Girders

| Girder | M sag | V | T | row | M hog | V | T | row |
|---|---|---|---|---|---|---|---|---|
| G1 | 10872 | -129 | -1057 | ULS-B-0084 | -3096 | -1854 | -1683 | ULS-B-0162 |
| G2 | 10762 | -123 | -1073 | ULS-B-0084 | -1493 | -1555 | -583 | ULS-B-0432 |
| G3 | 10852 | -218 | -810 | ULS-B-0084 | -1255 | 1371 | -1095 | ULS-B-0213 |
| G4 | 12313 | 266 | -1005 | ULS-B-0102 | -1586 | 1935 | -1684 | ULS-B-0090 |

### Bearings

| Bearing | v max | tr | lon | row | v min | tr | lon | row |
|---|---|---|---|---|---|---|---|---|
| A-G1 | 3000 | 703 | -719 | ULS-B-0090 | 104 | 279 | -360 | ULS-B-0479 |
| A-G2 | 2646 | 9 | -14 | ULS-B-0108 | 215 | -158 | 185 | ULS-K-0005 |
| A-G3 | 2526 | -283 | -166 | ULS-B-0156 | 160 | 56 | 22 | ULS-K-0006 |
| A-G4 | 2202 | 495 | -250 | ULS-B-0462 | -173 | -1101 | 1130 | ULS-B-0107 |
| B-G1 | 2124 | -217 | 0 | ULS-B-0084 | 153 | -226 | 0 | ULS-B-0485 |
| B-G2 | 2097 | 101 | 0 | ULS-B-0156 | 241 | 58 | 0 | ULS-B-0359 |
| B-G3 | 2190 | 462 | 0 | ULS-B-0216 | 355 | -218 | 0 | ULS-H-0013 |
| B-G4 | 3635 | 43 | 0 | ULS-B-0090 | 360 | -9 | 0 | ULS-B-0425 |

### Piles

| Pile | extreme | Ml | Mt | N | resultant | √ envelope bound | row |
|---|---|---|---|---|---|---|---|
| A1 | max |Ml| | 1456 | -176 | 1302 | 1466 | 1686 | ULS-H-0001 |
| A1 | max |Mt| | 732 | -850 | 1871 | 1122 | 1686 | ULS-H-0005 |
| A1 | N max | 0 | -0 | 4083 | 0 | 1686 | ULS-B-0088 |
| A2 | max |Ml| | 1435 | -56 | 1508 | 1436 | 1646 | ULS-H-0001 |
| A2 | max |Mt| | 483 | -805 | 1619 | 939 | 1646 | ULS-H-0005 |
| A2 | N max | -0 | -0 | 3364 | 0 | 1646 | ULS-B-0108 |
| A3 | max |Ml| | 1437 | -1 | 1246 | 1437 | 1626 | ULS-H-0001 |
| A3 | max |Mt| | 162 | 761 | 1388 | 778 | 1626 | ULS-H-0005 |
| A3 | N max | 0 | -0 | 2998 | 0 | 1626 | ULS-B-0156 |
| A4 | max |Ml| | 1449 | 68 | 429 | 1451 | 1655 | ULS-H-0001 |
| A4 | max |Mt| | 2 | 799 | 1200 | 799 | 1655 | ULS-H-0005 |
| A4 | N max | 0 | -0 | 3154 | 0 | 1655 | ULS-B-0135 |
| B1 | max |Ml| | -1243 | -42 | 1563 | 1244 | 1426 | ULS-H-0005 |
| B1 | max |Mt| | -111 | 699 | 131 | 708 | 1426 | ULS-H-0005 |
| B1 | N max | -0 | -0 | 2871 | 0 | 1426 | ULS-B-0082 |
| B2 | max |Ml| | -1245 | -83 | 984 | 1248 | 1429 | ULS-H-0005 |
| B2 | max |Mt| | -56 | 702 | 621 | 704 | 1429 | ULS-H-0005 |
| B2 | N max | -0 | 0 | 2398 | 0 | 1429 | ULS-B-0156 |
| B3 | max |Ml| | -1244 | -116 | 893 | 1249 | 1407 | ULS-H-0005 |
| B3 | max |Mt| | -588 | -657 | 809 | 882 | 1407 | ULS-H-0005 |
| B3 | N max | -0 | -0 | 2685 | 0 | 1407 | ULS-B-0216 |
| B4 | max |Ml| | -1242 | -131 | 1123 | 1249 | 1422 | ULS-H-0005 |
| B4 | max |Mt| | -584 | -692 | 983 | 905 | 1422 | ULS-H-0005 |
| B4 | N max | -0 | -0 | 4572 | 0 | 1422 | ULS-B-0198 |

### Pile moment resultant √(Ml² + Mt²), ULS (P4.3)

Earthquake rows: the largest resultant over the CQC response ellipses of (Ml, Mt) at each element end (Menun-Der; 100 / 30 terms added linearly). Other rows: √ of their separate envelopes (conservative). Upper = the larger; compare with the √ of the full separate envelopes (the earlier approximation).

| Pile | earthquake ellipse | row | element / end | other rows √ bound | **upper** | √ full envelopes | upper / √ full |
|---|---|---|---|---|---|---|---|
| A1 | 1467 | ULS-H-0001 | 200013 / 1 | 1436 | **1467** | 1686 | 0.87 |
| A2 | 1436 | ULS-H-0001 | 200033 / 1 | 1311 | **1436** | 1646 | 0.87 |
| A3 | 1437 | ULS-H-0001 | 200052 / 1 | 1301 | **1437** | 1626 | 0.88 |
| A4 | 1451 | ULS-H-0001 | 200072 / 1 | 1365 | **1451** | 1655 | 0.88 |
| B1 | 1244 | ULS-H-0005 | 200107 / 1 | 774 | **1244** | 1426 | 0.87 |
| B2 | 1248 | ULS-H-0005 | 200125 / 1 | 726 | **1248** | 1429 | 0.87 |
| B3 | 1249 | ULS-H-0005 | 200143 / 1 | 712 | **1249** | 1407 | 0.89 |
| B4 | 1249 | ULS-H-0005 | 200161 / 1 | 780 | **1249** | 1422 | 0.88 |

### Sills

| Support | My max | Vz | Mz | T | row | My min | Vz | Mz | T | row |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 1625 | -559 | 135 | -233 | ULS-B-0352 | -1965 | 2361 | 233 | -463 | ULS-B-0162 |
| B | 1802 | -3821 | -286 | 165 | ULS-B-0090 | -772 | 439 | -0 | -111 | ULS-H-0013 |

**Bearing uplift in a combined minimum:** A-G4 (finding M-4: reported, not resolved).
