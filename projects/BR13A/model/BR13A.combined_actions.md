# Combined actions — AS 5100.2 ULS / SLS envelopes (P3c)

**INDICATIVE. Not design-approved.** Load factors and combination constants: code-extracted-UNVERIFIED standards entries. Load-case inputs: Assumed / Standard-verify / Model values of the description; model PROVISIONAL (proposed decisions used). Values only: no capacity check. Units kN, kN·m, m.

Run: `projects/BR13A/BR13A.bridge.0.2.json` sha256 0ece35ede0944a69…, engine `64f2912` (+ uncommitted changes), 602 ULS + 976 SLS rows; actions BRKR, CENR, DLc, EPT, EQX, EQY, M1600, S1600, SCR, SDLp, SOo, TGN, TGP, TUC, TUW, WX, WY, WZ.

Not combined (no analysed case): PED — loads.pedestrian: Missing-Flagged — not analysed, not combined; FLH — loads.flood: Missing-Flagged — not analysed, not combined; COLX — loads.collision: Missing-Flagged — not analysed, not combined.

Provisional inputs used: 27 (listed in the .json). Governing row names refer to the rows in the .json.

## Bearings (link axes: v vertical, compression +; tr transverse; lon longitudinal)

| Bearing | ULS v max | ULS v min | SLS v max | SLS v min | ULS |tr| | ULS |lon| | Governing (ULS v max / min) |
|---|---|---|---|---|---|---|---|
| A-G1 | 3002 | 105 | 1830 | 174 | 1563 | 1825 | ULS-B-0090 / ULS-B-0479 |
| A-G2 | 2643 | 216 | 1759 | 657 | 604 | 666 | ULS-B-0108 / ULS-K-0005 |
| A-G3 | 2526 | 161 | 1681 | 603 | 805 | 1100 | ULS-B-0156 / ULS-K-0006 |
| A-G4 **uplift** | 2199 | -162 | 1312 | -37 | 1230 | 1183 | ULS-B-0462 / ULS-B-0107 |
| B-G1 | 2123 | 115 | 1335 | 377 | 536 | 0 | ULS-B-0084 / ULS-H-0013 |
| B-G2 | 2100 | 245 | 1320 | 432 | 555 | 0 | ULS-B-0156 / ULS-B-0359 |
| B-G3 | 2193 | 316 | 1401 | 537 | 586 | 0 | ULS-B-0216 / ULS-H-0013 |
| B-G4 | 3629 | 361 | 2277 | 741 | 276 | 0 | ULS-B-0090 / ULS-B-0425 |

## Piles (ULS; largest over the pile's element ends)

| Pile | |Ml| (about sill axis) | gov | |Mt| (about its normal) | gov | N max (compr.) | N min | gov (N max / min) |
|---|---|---|---|---|---|---|---|---|
| A1 | 1789 | ULS-H-0001 | 1103 | ULS-H-0005 | 4079 | -198 | ULS-B-0088 / ULS-H-0013 |
| A2 | 1775 | ULS-H-0001 | 1068 | ULS-H-0005 | 3379 | 369 | ULS-B-0108 / ULS-B-0407 |
| A3 | 1777 | ULS-H-0001 | 1025 | ULS-H-0005 | 3011 | 277 | ULS-B-0156 / ULS-B-0359 |
| A4 | 1782 | ULS-H-0001 | 1050 | ULS-H-0005 | 3152 | -522 | ULS-B-0135 / ULS-H-0005 |
| B1 | 1478 | ULS-H-0005 | 925 | ULS-H-0005 | 2872 | -449 | ULS-B-0082 / ULS-H-0013 |
| B2 | 1483 | ULS-H-0005 | 947 | ULS-H-0005 | 2398 | 269 | ULS-B-0156 / ULS-H-0013 |
| B3 | 1481 | ULS-H-0005 | 904 | ULS-H-0005 | 2686 | 344 | ULS-B-0216 / ULS-H-0013 |
| B4 | 1479 | ULS-H-0005 | 922 | ULS-H-0005 | 4571 | 74 | ULS-B-0198 / ULS-H-0013 |

## Girders (section actions; M sagging +)

| Girder | ULS M sag | at ch | ULS M hog | at ch | ULS |V| | at ch | ULS |T| | SLS M sag | gov (ULS M sag) |
|---|---|---|---|---|---|---|---|---|---|
| G1 | 10871 | 1911.27 | -3063 | 1897.33 | 2125 | 1897.33 | 1776 | 6940 | ULS-B-0084 |
| G2 | 10761 | 1911.27 | -1474 | 1895.84 | 1952 | 1895.84 | 1789 | 6905 | ULS-B-0084 |
| G3 | 10849 | 1908.47 | -1250 | 1923.14 | 1824 | 1923.14 | 1867 | 6983 | ULS-B-0084 |
| G4 | 12309 | 1908.47 | -1582 | 1921.45 | 2256 | 1921.45 | 1814 | 7866 | ULS-B-0102 |

## Sills / headstocks (member axes; s = position along the sill from its first node)

| Support | ULS My max | s | ULS My min | s | ULS Mz max | ULS Mz min | ULS |Vz| | ULS |Vy| | ULS |T| |
|---|---|---|---|---|---|---|---|---|---|
| A | 1666 | 2.08 | -2153 | 7.29 | 680 | -464 | 3230 | 670 | 1562 |
| B | 2032 | 9.01 | -1161 | 1.21 | 101 | -808 | 3817 | 431 | 949 |

## Concurrent actions at the governing ULS extremes (P4.2)

Each value: the governing combination row with every envelope term replaced by the one state that gives its value (traffic: the rebuilt vehicle / lane state; vertical wind, surcharge: the governing case). Earthquake terms use the most probable concurrent values from the CQC covariance (P4.3); ⚠ marks any term that is still an envelope without a concurrent state.

### Girders

| Girder | M sag | V | T | row | M hog | V | T | row |
|---|---|---|---|---|---|---|---|---|
| G1 | 10871 | -129 | -1056 | ULS-B-0084 | -3063 | -1851 | -1688 | ULS-B-0162 |
| G2 | 10761 | -124 | -1072 | ULS-B-0084 | -1474 | -1552 | -587 | ULS-B-0432 |
| G3 | 10849 | -218 | -810 | ULS-B-0084 | -1250 | 1371 | -1098 | ULS-B-0213 |
| G4 | 12309 | 265 | -1004 | ULS-B-0102 | -1582 | 1935 | -1684 | ULS-B-0090 |

### Bearings

| Bearing | v max | tr | lon | row | v min | tr | lon | row |
|---|---|---|---|---|---|---|---|---|
| A-G1 | 3002 | 716 | -724 | ULS-B-0090 | 105 | 285 | -366 | ULS-B-0479 |
| A-G2 | 2643 | 10 | -11 | ULS-B-0108 | 216 | -160 | 188 | ULS-K-0005 |
| A-G3 | 2526 | -286 | -163 | ULS-B-0156 | 161 | 58 | 20 | ULS-K-0006 |
| A-G4 | 2199 | 506 | -258 | ULS-B-0462 | -162 | -1124 | 1145 | ULS-B-0107 |
| B-G1 | 2123 | -219 | 0 | ULS-B-0084 | 115 | 146 | 0 | ULS-H-0013 |
| B-G2 | 2100 | 102 | 0 | ULS-B-0156 | 245 | 60 | 0 | ULS-B-0359 |
| B-G3 | 2193 | 463 | 0 | ULS-B-0216 | 316 | -343 | 0 | ULS-H-0013 |
| B-G4 | 3629 | 40 | 0 | ULS-B-0090 | 361 | -8 | 0 | ULS-B-0425 |

### Piles

| Pile | extreme | Ml | Mt | N | resultant | √ envelope bound | row |
|---|---|---|---|---|---|---|---|
| A1 | max |Ml| | 1789 | -220 | 1370 | 1803 | 2102 | ULS-H-0001 |
| A1 | max |Mt| | 815 | -1103 | 2140 | 1371 | 2102 | ULS-H-0005 |
| A1 | N max | 0 | 0 | 4079 | 0 | 2102 | ULS-B-0088 |
| A2 | max |Ml| | 1775 | -74 | 1532 | 1776 | 2072 | ULS-H-0001 |
| A2 | max |Mt| | 538 | -1068 | 1707 | 1196 | 2072 | ULS-H-0005 |
| A2 | N max | 0 | 0 | 3379 | 0 | 2072 | ULS-B-0108 |
| A3 | max |Ml| | 1777 | -16 | 1238 | 1777 | 2051 | ULS-H-0001 |
| A3 | max |Mt| | 134 | 1025 | 1463 | 1033 | 2051 | ULS-H-0005 |
| A3 | N max | 0 | -0 | 3011 | 0 | 2051 | ULS-B-0156 |
| A4 | max |Ml| | 1782 | 74 | 343 | 1783 | 2068 | ULS-H-0001 |
| A4 | max |Mt| | 6 | 1050 | 1452 | 1050 | 2068 | ULS-H-0005 |
| A4 | N max | -0 | 0 | 3152 | 0 | 2068 | ULS-B-0135 |
| B1 | max |Ml| | -1478 | -73 | 1832 | 1480 | 1744 | ULS-H-0005 |
| B1 | max |Mt| | -5 | 925 | -147 | 925 | 1744 | ULS-H-0005 |
| B1 | N max | -0 | 0 | 2872 | 0 | 1744 | ULS-B-0082 |
| B2 | max |Ml| | -1483 | -122 | 1041 | 1488 | 1759 | ULS-H-0005 |
| B2 | max |Mt| | 62 | 947 | 560 | 949 | 1759 | ULS-H-0005 |
| B2 | N max | -0 | 0 | 2398 | 0 | 1759 | ULS-B-0156 |
| B3 | max |Ml| | -1481 | -154 | 816 | 1489 | 1736 | ULS-H-0005 |
| B3 | max |Mt| | -715 | -904 | 730 | 1153 | 1736 | ULS-H-0005 |
| B3 | N max | -0 | -0 | 2686 | 0 | 1736 | ULS-B-0216 |
| B4 | max |Ml| | -1479 | -160 | 870 | 1488 | 1743 | ULS-H-0005 |
| B4 | max |Mt| | -721 | -922 | 719 | 1171 | 1743 | ULS-H-0005 |
| B4 | N max | -0 | 0 | 4571 | 0 | 1743 | ULS-B-0198 |

### Pile moment resultant √(Ml² + Mt²), ULS (P4.3)

Earthquake rows: the largest resultant over the CQC response ellipses of (Ml, Mt) at each element end (Menun-Der; 100 / 30 terms added linearly). Other rows: √ of their separate envelopes (conservative). Upper = the larger; compare with the √ of the full separate envelopes (the earlier approximation).

| Pile | earthquake ellipse | row | element / end | other rows √ bound | **upper** | √ full envelopes | upper / √ full |
|---|---|---|---|---|---|---|---|
| A1 | 1803 | ULS-H-0001 | 200013 / 1 | 1441 | **1803** | 2102 | 0.86 |
| A2 | 1776 | ULS-H-0001 | 200033 / 1 | 1318 | **1776** | 2072 | 0.86 |
| A3 | 1777 | ULS-H-0001 | 200052 / 1 | 1308 | **1777** | 2051 | 0.87 |
| A4 | 1783 | ULS-H-0001 | 200072 / 1 | 1373 | **1783** | 2068 | 0.86 |
| B1 | 1480 | ULS-H-0005 | 200107 / 1 | 773 | **1480** | 1744 | 0.85 |
| B2 | 1488 | ULS-H-0005 | 200125 / 1 | 726 | **1488** | 1759 | 0.85 |
| B3 | 1489 | ULS-H-0005 | 200143 / 1 | 713 | **1489** | 1736 | 0.86 |
| B4 | 1488 | ULS-H-0005 | 200161 / 1 | 780 | **1488** | 1743 | 0.85 |

### Sills

| Support | My max | Vz | Mz | T | row | My min | Vz | Mz | T | row |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 1666 | -573 | 134 | -233 | ULS-B-0352 | -2153 | -912 | 64 | -1014 | ULS-H-0005 |
| B | 2032 | 885 | -198 | 220 | ULS-H-0005 | -1161 | 633 | 21 | -107 | ULS-H-0013 |

**Bearing uplift in a combined minimum:** A-G4 (finding M-4: reported, not resolved).
