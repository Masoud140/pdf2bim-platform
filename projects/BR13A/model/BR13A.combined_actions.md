# Combined actions — AS 5100.2 ULS / SLS envelopes (P3c)

**INDICATIVE. Not design-approved.** Load factors and combination constants: code-extracted-UNVERIFIED standards entries. Load-case inputs: Assumed / Standard-verify / Model values of the description; model PROVISIONAL (proposed decisions used). Values only: no capacity check. Units kN, kN·m, m.

Run: `projects/BR13A/BR13A.bridge.0.2.json` sha256 0ece35ede0944a69…, engine `9255bed` (+ uncommitted changes), 602 ULS + 976 SLS rows; actions BRKR, CENR, DLc, EPT, EQX, EQY, M1600, S1600, SCR, SDLp, SOo, TGN, TGP, TUC, TUW, WX, WY, WZ.

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

**Bearing uplift in a combined minimum:** A-G4 (finding M-4: reported, not resolved).
