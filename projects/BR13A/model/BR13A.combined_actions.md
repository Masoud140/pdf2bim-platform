# Combined actions — AS 5100.2 ULS / SLS envelopes (P3c)

**INDICATIVE. Not design-approved.** Load factors and combination constants: code-extracted-UNVERIFIED standards entries. Load-case inputs: Assumed / Standard-verify / Model values of the description; model PROVISIONAL (proposed decisions used). Values only: no capacity check. Units kN, kN·m, m.

Run: `projects/BR13A/BR13A.bridge.0.2.json` sha256 f8091406362ac688…, engine `931c8e3`, 602 ULS + 976 SLS rows; actions BRKR, CENR, DLc, EPT, EQX, EQY, M1600, S1600, SCR, SDLp, SOo, TGN, TGP, TUC, TUW, WX, WY, WZ.

Not combined (no analysed case): PED — loads.pedestrian: Missing-Flagged — not analysed, not combined; FLH — loads.flood: Missing-Flagged — not analysed, not combined; COLX — loads.collision: Missing-Flagged — not analysed, not combined.

Provisional inputs used: 30 (listed in the .json). Governing row names refer to the rows in the .json.

## Bearings (link axes: v vertical, compression +; tr transverse; lon longitudinal)

| Bearing | ULS v max | ULS v min | SLS v max | SLS v min | ULS |tr| | ULS |lon| | Governing (ULS v max / min) |
|---|---|---|---|---|---|---|---|
| A-G1 | 3002 | 105 | 1830 | 174 | 1563 | 1825 | ULS-B-0090 / ULS-B-0479 |
| A-G2 | 2643 | 216 | 1759 | 657 | 604 | 666 | ULS-B-0108 / ULS-K-0005 |
| A-G3 | 2526 | 161 | 1681 | 603 | 805 | 1100 | ULS-B-0156 / ULS-K-0006 |
| A-G4 **uplift** | 2199 | -162 | 1312 | -37 | 1230 | 1183 | ULS-B-0462 / ULS-B-0107 |
| B-G1 | 2123 | 152 | 1335 | 377 | 536 | 0 | ULS-B-0084 / ULS-B-0485 |
| B-G2 | 2100 | 245 | 1320 | 432 | 413 | 0 | ULS-B-0156 / ULS-B-0359 |
| B-G3 | 2193 | 357 | 1401 | 537 | 560 | 0 | ULS-B-0216 / ULS-H-0013 |
| B-G4 | 3629 | 361 | 2277 | 741 | 276 | 0 | ULS-B-0090 / ULS-B-0425 |

## Piles (ULS; largest over the pile's element ends)

| Pile | |Ml| (about sill axis) | gov | |Mt| (about its normal) | gov | N max (compr.) | N min | gov (N max / min) |
|---|---|---|---|---|---|---|---|---|
| A1 | 1459 | ULS-H-0001 | 857 | ULS-H-0005 | 4079 | 85 | ULS-B-0088 / ULS-H-0013 |
| A2 | 1438 | ULS-H-0001 | 806 | ULS-H-0005 | 3379 | 369 | ULS-B-0108 / ULS-B-0407 |
| A3 | 1441 | ULS-H-0001 | 762 | ULS-H-0005 | 3011 | 277 | ULS-B-0156 / ULS-B-0359 |
| A4 | 1452 | ULS-H-0001 | 804 | ULS-H-0005 | 3152 | -504 | ULS-B-0135 / ULS-B-0106 |
| B1 | 1246 | ULS-H-0005 | 698 | ULS-H-0005 | 2872 | -166 | ULS-B-0082 / ULS-H-0013 |
| B2 | 1248 | ULS-H-0005 | 700 | ULS-H-0005 | 2398 | 332 | ULS-B-0156 / ULS-H-0013 |
| B3 | 1246 | ULS-H-0005 | 656 | ULS-H-0005 | 2686 | 424 | ULS-B-0216 / ULS-H-0013 |
| B4 | 1244 | ULS-H-0005 | 691 | ULS-H-0005 | 4571 | 345 | ULS-B-0198 / ULS-H-0013 |

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
| A | 1666 | 2.08 | -2082 | 1.89 | 680 | -464 | 3230 | 670 | 1562 |
| B | 1799 | 9.01 | -770 | 1.21 | 101 | -808 | 3817 | 403 | 949 |

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
| B-G1 | 2123 | -219 | 0 | ULS-B-0084 | 152 | -227 | 0 | ULS-B-0485 |
| B-G2 | 2100 | 102 | 0 | ULS-B-0156 | 245 | 60 | 0 | ULS-B-0359 |
| B-G3 | 2193 | 463 | 0 | ULS-B-0216 | 357 | -218 | 0 | ULS-H-0013 |
| B-G4 | 3629 | 40 | 0 | ULS-B-0090 | 361 | -8 | 0 | ULS-B-0425 |

### Piles

| Pile | extreme | Ml | Mt | N | resultant | √ envelope bound | row |
|---|---|---|---|---|---|---|---|
| A1 | max |Ml| | 1459 | -180 | 1294 | 1470 | 1692 | ULS-H-0001 |
| A1 | max |Mt| | 729 | -857 | 1859 | 1125 | 1692 | ULS-H-0005 |
| A1 | N max | 0 | 0 | 4079 | 0 | 1692 | ULS-B-0088 |
| A2 | max |Ml| | 1438 | -57 | 1518 | 1440 | 1649 | ULS-H-0001 |
| A2 | max |Mt| | 483 | -806 | 1628 | 940 | 1649 | ULS-H-0005 |
| A2 | N max | 0 | 0 | 3379 | 0 | 1649 | ULS-B-0108 |
| A3 | max |Ml| | 1441 | 0 | 1255 | 1441 | 1630 | ULS-H-0001 |
| A3 | max |Mt| | 162 | 762 | 1397 | 779 | 1630 | ULS-H-0005 |
| A3 | N max | 0 | -0 | 3011 | 0 | 1630 | ULS-B-0156 |
| A4 | max |Ml| | 1452 | 70 | 418 | 1454 | 1660 | ULS-H-0001 |
| A4 | max |Mt| | 2 | 804 | 1190 | 804 | 1660 | ULS-H-0005 |
| A4 | N max | -0 | 0 | 3152 | 0 | 1660 | ULS-B-0135 |
| B1 | max |Ml| | -1246 | -41 | 1561 | 1247 | 1429 | ULS-H-0005 |
| B1 | max |Mt| | -106 | 698 | 135 | 706 | 1429 | ULS-H-0005 |
| B1 | N max | -0 | 0 | 2872 | 0 | 1429 | ULS-B-0082 |
| B2 | max |Ml| | -1248 | -83 | 983 | 1251 | 1431 | ULS-H-0005 |
| B2 | max |Mt| | -51 | 700 | 622 | 702 | 1431 | ULS-H-0005 |
| B2 | N max | -0 | 0 | 2398 | 0 | 1431 | ULS-B-0156 |
| B3 | max |Ml| | -1246 | -116 | 893 | 1252 | 1409 | ULS-H-0005 |
| B3 | max |Mt| | -593 | -656 | 809 | 885 | 1409 | ULS-H-0005 |
| B3 | N max | -0 | -0 | 2686 | 0 | 1409 | ULS-B-0216 |
| B4 | max |Ml| | -1244 | -131 | 1125 | 1251 | 1424 | ULS-H-0005 |
| B4 | max |Mt| | -590 | -691 | 985 | 909 | 1424 | ULS-H-0005 |
| B4 | N max | -0 | 0 | 4571 | 0 | 1424 | ULS-B-0198 |

### Pile moment resultant √(Ml² + Mt²), ULS (P4.3)

Earthquake rows: the largest resultant over the CQC response ellipses of (Ml, Mt) at each element end (Menun-Der; 100 / 30 terms added linearly). Other rows: √ of their separate envelopes (conservative). Upper = the larger; compare with the √ of the full separate envelopes (the earlier approximation).

| Pile | earthquake ellipse | row | element / end | other rows √ bound | **upper** | √ full envelopes | upper / √ full |
|---|---|---|---|---|---|---|---|
| A1 | 1471 | ULS-H-0001 | 200013 / 1 | 1441 | **1471** | 1692 | 0.87 |
| A2 | 1440 | ULS-H-0001 | 200033 / 1 | 1318 | **1440** | 1649 | 0.87 |
| A3 | 1441 | ULS-H-0001 | 200052 / 1 | 1308 | **1441** | 1630 | 0.88 |
| A4 | 1454 | ULS-H-0001 | 200072 / 1 | 1373 | **1454** | 1660 | 0.88 |
| B1 | 1247 | ULS-H-0005 | 200107 / 1 | 773 | **1247** | 1429 | 0.87 |
| B2 | 1251 | ULS-H-0005 | 200125 / 1 | 726 | **1251** | 1431 | 0.87 |
| B3 | 1252 | ULS-H-0005 | 200143 / 1 | 713 | **1252** | 1409 | 0.89 |
| B4 | 1251 | ULS-H-0005 | 200161 / 1 | 780 | **1251** | 1424 | 0.88 |

### Sills

| Support | My max | Vz | Mz | T | row | My min | Vz | Mz | T | row |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 1666 | -573 | 134 | -233 | ULS-B-0352 | -2082 | 2367 | 235 | -481 | ULS-B-0162 |
| B | 1799 | -3816 | -287 | 165 | ULS-B-0090 | -770 | 441 | -0 | -114 | ULS-H-0013 |

**Bearing uplift in a combined minimum:** A-G4 (finding M-4: reported, not resolved).
