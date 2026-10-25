# Concurrent traffic actions (P4.1) — characteristic, DLA and lane factors included, no load factor

Each row: the load state (lane layout, lane ranking, vehicle position, patterned UDL) that produces the extreme in the first column, and the other actions under **that same state**. Standards values (M1600 / S1600, lane width, lane factors) are code-extracted-UNVERIFIED; model PROVISIONAL. Values only. Units kN, kN·m.

## M1600

### Girders: largest sagging moment and concurrent actions at the same section

| Girder | M sag | at ch | V concurrent | V envelope (same section) | T concurrent | T envelope | Lanes loaded (offset: factor) |
|---|---|---|---|---|---|---|---|
| G1 | 3383 | 1911.27 | -71 | 201 | -374 | 395 | -3.9: 1, -0.7: 0.8 |
| G2 | 3282 | 1911.27 | 110 | 229 | -262 | 456 | -3.9: 1, -0.7: 0.8 |
| G3 | 3274 | 1908.47 | -107 | 221 | -267 | 437 | 1.3: 1, -1.9: 0.8 |
| G4 | 3825 | 1908.47 | 114 | 250 | -417 | 453 | 1.3: 1, -1.9: 0.8 |

### Bearings: largest vertical force and concurrent horizontal forces

| Bearing | v max | tr concurrent | |tr| envelope | lon concurrent | |lon| envelope |
|---|---|---|---|---|---|
| A-G1 | 1064 | 149 | 237 | -125 | 271 |
| A-G2 | 733 | -118 | 192 | -77 | 153 |
| A-G3 | 679 | 49 | 151 | -145 | 234 |
| A-G4 | 784 | 65 | 217 | 0 | 62 |
| B-G1 | 673 | -25 | 141 | 0 | 0 |
| B-G2 | 753 | 37 | 101 | 0 | 0 |
| B-G3 | 767 | 158 | 184 | 0 | 0 |
| B-G4 | 1199 | -54 | 81 | 0 | 0 |

### Piles: concurrent moment resultant vs the separate-envelope bound

| Pile | state | Ml | Mt | N | concurrent resultant | bound √(Ml_env² + Mt_env²) | ratio |
|---|---|---|---|---|---|---|---|
| A1 | max |Ml| (element 200011, end 1) | 115 | 19 | 940 | 117 | 119 | 0.98 |
| A1 | max |Mt| (element 200011, end 1) | 97 | 32 | 985 | 102 | 119 | 0.85 |
| A2 | max |Ml| (element 200030, end 1) | 30 | 22 | 532 | 37 | 41 | 0.90 |
| A2 | max |Mt| (element 200030, end 2) | 11 | 29 | 670 | 31 | 41 | 0.74 |
| A3 | max |Ml| (element 200049, end 1) | -37 | 21 | 293 | 43 | 50 | 0.85 |
| A3 | max |Mt| (element 200049, end 1) | -26 | 33 | 122 | 42 | 50 | 0.84 |
| A4 | max |Ml| (element 200068, end 1) | -124 | 19 | -77 | 125 | 130 | 0.96 |
| A4 | max |Mt| (element 200068, end 1) | 13 | -41 | 836 | 43 | 130 | 0.33 |
| B1 | max |Ml| (element 200104, end 1) | 103 | -3 | 247 | 103 | 113 | 0.91 |
| B1 | max |Mt| (element 200104, end 1) | -14 | 47 | 683 | 49 | 113 | 0.44 |
| B2 | max |Ml| (element 200122, end 1) | 33 | -3 | 434 | 33 | 40 | 0.82 |
| B2 | max |Mt| (element 200122, end 1) | -8 | 23 | 410 | 24 | 40 | 0.61 |
| B3 | max |Ml| (element 200140, end 1) | -23 | -12 | 624 | 26 | 58 | 0.45 |
| B3 | max |Mt| (element 200140, end 1) | -8 | -54 | 422 | 54 | 58 | 0.93 |
| B4 | max |Ml| (element 200158, end 1) | -94 | -18 | 825 | 96 | 138 | 0.70 |
| B4 | max |Mt| (element 200158, end 1) | -30 | -100 | 1081 | 104 | 138 | 0.76 |

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
| A-G1 | 808 | 93 | 164 | -78 | 194 |
| A-G2 | 563 | -92 | 142 | -54 | 111 |
| A-G3 | 519 | 35 | 103 | -110 | 175 |
| A-G4 | 574 | 70 | 160 | -4 | 44 |
| B-G1 | 481 | -28 | 107 | 0 | 0 |
| B-G2 | 572 | 35 | 84 | 0 | 0 |
| B-G3 | 585 | 110 | 143 | 0 | 0 |
| B-G4 | 910 | -34 | 52 | 0 | 0 |

### Piles: concurrent moment resultant vs the separate-envelope bound

| Pile | state | Ml | Mt | N | concurrent resultant | bound √(Ml_env² + Mt_env²) | ratio |
|---|---|---|---|---|---|---|---|
| A1 | max |Ml| (element 200011, end 1) | 90 | 16 | 734 | 91 | 93 | 0.98 |
| A1 | max |Mt| (element 200011, end 2) | 45 | 24 | 778 | 51 | 93 | 0.55 |
| A2 | max |Ml| (element 200030, end 1) | 23 | 16 | 414 | 28 | 31 | 0.91 |
| A2 | max |Mt| (element 200030, end 2) | 9 | 21 | 478 | 23 | 31 | 0.73 |
| A3 | max |Ml| (element 200049, end 1) | -30 | 14 | 240 | 33 | 38 | 0.86 |
| A3 | max |Mt| (element 200049, end 1) | -21 | 24 | 99 | 32 | 38 | 0.84 |
| A4 | max |Ml| (element 200068, end 1) | -97 | 14 | -55 | 98 | 102 | 0.96 |
| A4 | max |Mt| (element 200068, end 1) | 6 | -31 | 618 | 32 | 102 | 0.31 |
| B1 | max |Ml| (element 200104, end 1) | 78 | -1 | 153 | 78 | 85 | 0.92 |
| B1 | max |Mt| (element 200104, end 1) | -3 | 32 | 501 | 33 | 85 | 0.38 |
| B2 | max |Ml| (element 200122, end 1) | 25 | -2 | 336 | 25 | 30 | 0.85 |
| B2 | max |Mt| (element 200122, end 1) | -2 | 16 | 326 | 16 | 30 | 0.53 |
| B3 | max |Ml| (element 200140, end 1) | -18 | -11 | 488 | 21 | 44 | 0.49 |
| B3 | max |Mt| (element 200140, end 1) | -7 | -40 | 318 | 40 | 44 | 0.93 |
| B4 | max |Ml| (element 200158, end 1) | -72 | -19 | 678 | 75 | 104 | 0.72 |
| B4 | max |Mt| (element 200158, end 1) | -28 | -75 | 821 | 80 | 104 | 0.77 |

Notes:
- Every state reproduces its envelope value exactly (`tests/model/test_concurrent.py`); concurrent values lie within their own envelopes.
- The pile resultant from one state is a lower bound of the true largest resultant over all states; the √ of separate envelopes is an upper bound. The true value lies between them (P4.3 refines it).

