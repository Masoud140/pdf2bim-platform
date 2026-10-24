# BR13A imposed-strain cases (uniform temperature, gradient, shrinkage + creep): P3c vs the dashboard

Characteristic, unfactored. **Cross-implementation comparison (V5), not verification.** Inputs (BR13A, Assumed): T_max 45.0, T_min 5.0, T_set 20.0 °C, α 1e-05, shrinkage + creep 300e-6, gradient profiles as in the description (= the dashboard's assumed profiles). Status: PROVISIONAL (D-37, D-39, D-40, D-41).

## Isolation: the P3c imposition on the dashboard's frozen model (dashboard free strain / curvature for the gradient)

| Case | largest bearing-force difference vs the dashboard (kN) | largest dashboard bearing force (kN) |
|---|---|---|
| TU+ | 1.69e-07 | 639.2 |
| TU- | 1.03e-07 | 383.5 |
| SCR | 2.05e-07 | 767.0 |
| TGP | 3.38e-07 | 153.0 |
| TGN | 1.69e-07 | 76.5 |

## Free strain and curvature of the composite section, G1 midspan (gradient)

| Case | P3c e0 | Dashboard e0 | P3c φ (1/m) | Dashboard φ (1/m) |
|---|---|---|---|---|
| TGP | 1.014e-04 | 1.069e-04 (-5.1 %) | 1.431e-04 | 1.445e-04 (-1.0 %) |
| TGN | -5.071e-05 | -5.346e-05 (-5.1 %) | -7.158e-05 | -7.229e-05 (-1.0 %) |

The dashboard integrates over one design section (its design girder, its deck width) for every girder element; P3c uses each element's own section (P2: flared flanges, tributary deck width, solid ends).

## P3c on the P3b model vs the dashboard (bearing forces: vertical; horizontal resultant in plan)

### TU+

| Bearing | P3c Rz | Dashboard v | P3c H | Dashboard H |
|---|---|---|---|---|
| A-G1 | 249.3 | 185.4 | 523.1 | 755.4 |
| A-G2 | -213.2 | -132.0 | 192.1 | 234.6 |
| A-G3 | -232.0 | -162.1 | 170.3 | 214.4 |
| A-G4 | 196.2 | 108.9 | 539.2 | 767.7 |
| B-G1 | 48.6 | 32.1 | 58.1 | 59.6 |
| B-G2 | -36.9 | -20.7 | 23.7 | 13.9 |
| B-G3 | -44.3 | -27.6 | 17.3 | 12.5 |
| B-G4 | 32.2 | 15.9 | 71.8 | 70.7 |

### TU-

| Bearing | P3c Rz | Dashboard v | P3c H | Dashboard H |
|---|---|---|---|---|
| A-G1 | -149.6 | -111.3 | 313.9 | 453.3 |
| A-G2 | 127.9 | 79.2 | 115.3 | 140.8 |
| A-G3 | 139.2 | 97.3 | 102.2 | 128.7 |
| A-G4 | -117.7 | -65.3 | 323.5 | 460.6 |
| B-G1 | -29.2 | -19.3 | 34.9 | 35.8 |
| B-G2 | 22.1 | 12.4 | 14.2 | 8.3 |
| B-G3 | 26.6 | 16.6 | 10.4 | 7.5 |
| B-G4 | -19.3 | -9.5 | 43.1 | 42.4 |

### SCR

| Bearing | P3c Rz | Dashboard v | P3c H | Dashboard H |
|---|---|---|---|---|
| A-G1 | -299.2 | -222.5 | 627.8 | 906.5 |
| A-G2 | 255.8 | 158.4 | 230.5 | 281.5 |
| A-G3 | 278.3 | 194.5 | 204.3 | 257.3 |
| A-G4 | -235.4 | -130.7 | 647.0 | 921.2 |
| B-G1 | -58.3 | -38.5 | 69.7 | 71.5 |
| B-G2 | 44.2 | 24.8 | 28.5 | 16.6 |
| B-G3 | 53.2 | 33.1 | 20.7 | 15.0 |
| B-G4 | -38.6 | -19.1 | 86.2 | 84.8 |

### TGP

| Bearing | P3c Rz | Dashboard v | P3c H | Dashboard H |
|---|---|---|---|---|
| A-G1 | -138.8 | -140.8 | 101.0 | 101.3 |
| A-G2 | -36.6 | -25.3 | 55.5 | 63.2 |
| A-G3 | 28.4 | 18.4 | 78.8 | 70.8 |
| A-G4 | 146.3 | 147.2 | 37.1 | 32.1 |
| B-G1 | 124.7 | 125.1 | 68.1 | 64.1 |
| B-G2 | 38.9 | 33.3 | 46.6 | 39.4 |
| B-G3 | -8.7 | -4.8 | 49.9 | 60.5 |
| B-G4 | -154.3 | -153.0 | 15.3 | 26.5 |

### TGN

| Bearing | P3c Rz | Dashboard v | P3c H | Dashboard H |
|---|---|---|---|---|
| A-G1 | 69.4 | 70.4 | 50.5 | 50.6 |
| A-G2 | 18.3 | 12.6 | 27.8 | 31.6 |
| A-G3 | -14.2 | -9.2 | 39.4 | 35.4 |
| A-G4 | -73.2 | -73.6 | 18.6 | 16.1 |
| B-G1 | -62.4 | -62.5 | 34.1 | 32.1 |
| B-G2 | -19.5 | -16.6 | 23.3 | 19.7 |
| B-G3 | 4.3 | 2.4 | 25.0 | 30.2 |
| B-G4 | 77.2 | 76.5 | 7.6 | 13.3 |

Differences on the P3b model come from the models (`BR13A.integrated_vs_frozen.md`): the fixed bearings at A restrain the deck's expansion / shortening, so the horizontal forces depend on the bearing-link idealisation, the pile and sill stiffness and the bearing positions; the vertical forces from the girder geometry and sections.
