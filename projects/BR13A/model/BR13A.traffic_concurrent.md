# Concurrent traffic actions (P4.1) — characteristic, DLA and lane factors included, no load factor

Each row: the load state (lane layout, lane ranking, vehicle position, patterned UDL) that produces the extreme in the first column, and the other actions under **that same state**. Standards values (M1600 / S1600, lane width, lane factors) are code-extracted-UNVERIFIED; model PROVISIONAL. Values only. Units kN, kN·m.

## M1600

### Girders: largest sagging moment and concurrent actions at the same section

| Girder | M sag | at ch | V concurrent | V envelope (same section) | T concurrent | T envelope | Lanes loaded (offset: factor) |
|---|---|---|---|---|---|---|---|
| G1 | 3383 | 1911.27 | -72 | 201 | -374 | 395 | -3.9: 1, -0.7: 0.8 |
| G2 | 3282 | 1911.27 | 110 | 228 | -262 | 456 | -3.9: 1, -0.7: 0.8 |
| G3 | 3274 | 1908.47 | -107 | 221 | -267 | 437 | 1.3: 1, -1.9: 0.8 |
| G4 | 3825 | 1908.47 | 114 | 250 | -417 | 453 | 1.3: 1, -1.9: 0.8 |

### Bearings: largest vertical force and concurrent horizontal forces

| Bearing | v max | tr concurrent | |tr| envelope | lon concurrent | |lon| envelope |
|---|---|---|---|---|---|
| A-G1 | 1064 | 146 | 234 | -125 | 272 |
| A-G2 | 733 | -118 | 192 | -78 | 154 |
| A-G3 | 677 | 48 | 150 | -146 | 235 |
| A-G4 | 785 | 65 | 215 | 1 | 63 |
| B-G1 | 673 | -25 | 141 | 0 | 0 |
| B-G2 | 751 | 37 | 101 | 0 | 0 |
| B-G3 | 766 | 157 | 183 | 0 | 0 |
| B-G4 | 1200 | -52 | 79 | 0 | 0 |

### Piles: concurrent moment resultant vs the separate-envelope bound

| Pile | state | Ml | Mt | N | concurrent resultant | bound √(Ml_env² + Mt_env²) | ratio |
|---|---|---|---|---|---|---|---|
| A1 | max |Ml| (element 200011, end 1) | 118 | 19 | 940 | 120 | 122 | 0.98 |
| A1 | max |Mt| (element 200011, end 1) | 100 | 31 | 986 | 104 | 122 | 0.85 |
| A2 | max |Ml| (element 200030, end 1) | 31 | 22 | 533 | 38 | 42 | 0.91 |
| A2 | max |Mt| (element 200030, end 2) | 12 | 28 | 667 | 31 | 42 | 0.73 |
| A3 | max |Ml| (element 200049, end 1) | -39 | 20 | 292 | 44 | 51 | 0.86 |
| A3 | max |Mt| (element 200049, end 1) | -27 | 33 | 121 | 42 | 51 | 0.83 |
| A4 | max |Ml| (element 200068, end 1) | -127 | 19 | -77 | 129 | 133 | 0.96 |
| A4 | max |Mt| (element 200068, end 1) | 16 | -40 | 848 | 44 | 133 | 0.33 |
| B1 | max |Ml| (element 200104, end 1) | 105 | -3 | 247 | 105 | 115 | 0.91 |
| B1 | max |Mt| (element 200104, end 1) | -14 | 47 | 682 | 49 | 115 | 0.43 |
| B2 | max |Ml| (element 200122, end 1) | 33 | -3 | 434 | 34 | 41 | 0.82 |
| B2 | max |Mt| (element 200122, end 1) | 0 | 23 | 473 | 23 | 41 | 0.57 |
| B3 | max |Ml| (element 200140, end 1) | -24 | -12 | 623 | 27 | 59 | 0.46 |
| B3 | max |Mt| (element 200140, end 1) | -8 | -54 | 418 | 54 | 59 | 0.92 |
| B4 | max |Ml| (element 200158, end 1) | -96 | -18 | 826 | 98 | 139 | 0.71 |
| B4 | max |Mt| (element 200158, end 1) | -31 | -100 | 1081 | 105 | 139 | 0.75 |

## S1600

### Girders: largest sagging moment and concurrent actions at the same section

| Girder | M sag | at ch | V concurrent | V envelope (same section) | T concurrent | T envelope | Lanes loaded (offset: factor) |
|---|---|---|---|---|---|---|---|
| G1 | 2715 | 1911.27 | -48 | 145 | -300 | 311 | -3.9: 1, -0.7: 0.8 |
| G2 | 2663 | 1911.27 | 75 | 168 | -231 | 368 | -3.9: 1, -0.7: 0.8 |
| G3 | 2656 | 1908.47 | -68 | 161 | -234 | 352 | 1.3: 1, -1.9: 0.8 |
| G4 | 3066 | 1908.47 | 80 | 182 | -334 | 353 | 1.3: 1, -1.9: 0.8 |

### Bearings: largest vertical force and concurrent horizontal forces

| Bearing | v max | tr concurrent | |tr| envelope | lon concurrent | |lon| envelope |
|---|---|---|---|---|---|
| A-G1 | 808 | 91 | 161 | -78 | 195 |
| A-G2 | 563 | -92 | 141 | -55 | 112 |
| A-G3 | 517 | 35 | 102 | -110 | 176 |
| A-G4 | 575 | 69 | 159 | -4 | 46 |
| B-G1 | 481 | -28 | 107 | 0 | 0 |
| B-G2 | 571 | 34 | 83 | 0 | 0 |
| B-G3 | 583 | 110 | 142 | 0 | 0 |
| B-G4 | 911 | -33 | 51 | 0 | 0 |

### Piles: concurrent moment resultant vs the separate-envelope bound

| Pile | state | Ml | Mt | N | concurrent resultant | bound √(Ml_env² + Mt_env²) | ratio |
|---|---|---|---|---|---|---|---|
| A1 | max |Ml| (element 200011, end 1) | 93 | 16 | 733 | 94 | 95 | 0.98 |
| A1 | max |Mt| (element 200011, end 2) | 46 | 23 | 778 | 52 | 95 | 0.55 |
| A2 | max |Ml| (element 200030, end 1) | 24 | 16 | 418 | 29 | 32 | 0.91 |
| A2 | max |Mt| (element 200030, end 2) | 10 | 21 | 468 | 23 | 32 | 0.72 |
| A3 | max |Ml| (element 200049, end 1) | -31 | 14 | 239 | 33 | 39 | 0.86 |
| A3 | max |Mt| (element 200050, end 1) | -13 | 24 | 98 | 27 | 39 | 0.71 |
| A4 | max |Ml| (element 200068, end 1) | -100 | 13 | -54 | 101 | 104 | 0.96 |
| A4 | max |Mt| (element 200068, end 1) | 7 | -31 | 623 | 32 | 104 | 0.31 |
| B1 | max |Ml| (element 200104, end 1) | 80 | -1 | 153 | 80 | 86 | 0.93 |
| B1 | max |Mt| (element 200104, end 1) | -2 | 32 | 501 | 33 | 86 | 0.38 |
| B2 | max |Ml| (element 200122, end 1) | 26 | -2 | 335 | 26 | 30 | 0.85 |
| B2 | max |Mt| (element 200122, end 1) | 2 | 16 | 360 | 16 | 30 | 0.53 |
| B3 | max |Ml| (element 200140, end 1) | -19 | -11 | 488 | 22 | 44 | 0.49 |
| B3 | max |Mt| (element 200140, end 1) | -7 | -40 | 316 | 40 | 44 | 0.92 |
| B4 | max |Ml| (element 200158, end 1) | -74 | -20 | 679 | 76 | 105 | 0.72 |
| B4 | max |Mt| (element 200158, end 1) | -29 | -75 | 821 | 80 | 105 | 0.76 |

Notes:
- Every state reproduces its envelope value exactly (`tests/model/test_concurrent.py`); concurrent values lie within their own envelopes.
- The pile resultant from one state is a lower bound of the true largest resultant over all states; the √ of separate envelopes is an upper bound. The true value lies between them (P4.3 refines it).

