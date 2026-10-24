# BR13A horizontal load cases: P3c vs the dashboard (characteristic)

Earth pressure (K0, γ 20, φ 30°, Assumed), traffic surcharge 10 kPa (Assumed), braking 500 kN (Assumed), centrifugal W V²/(g R) (W = M1600 1440 kN from the unverified standards entry, V 60 km/h Assumed, R = 400 m). **V5 comparison, not verification.**

## Retained height

| Support | P3c (Calculated: road level at the setout point − sill soffit) | Dashboard (sill depth + 0.15 bearing zone + girder + deck + surfacing) |
|---|---|---|
| A | 3.583 m | 3.460 m (+3.5 %) |
| B | 3.587 m | 3.460 m (+3.7 %) |

## Load totals (kN, global X, Y)

| Case | P3c | P3c with the dashboard's H | Dashboard |
|---|---|---|---|
| EP | 25.0, -24.2 | 22.3, -21.5 | 22.2, -21.5 |
| EPTA | -140.7, 136.1 | -135.9, 131.4 | -135.9, 131.4 |
| EPTB | 147.6, -142.7 | 142.4, -137.6 | 142.4, -137.6 |
| BRKp | -492.9, 83.1 | -492.9, 83.1 | -492.9, 83.2 |
| BRKm | 492.9, -83.1 | 492.9, -83.1 | 492.9, -83.2 |
| CEN | 16.9, 100.5 | 16.9, 100.5 | 17.1, 100.5 |

## Pile maximum moment (kN·m) and bearing horizontal forces (kN)

### EP

| Pile | P3c M | Dashboard M |
|---|---|---|
| A1 | 423 | 375 |
| A2 | 420 | 378 |
| A3 | 422 | 384 |
| A4 | 431 | 397 |
| B1 | 448 | 411 |
| B2 | 442 | 403 |
| B3 | 441 | 396 |
| B4 | 442 | 394 |

Sum of bearing horizontal forces: P3c 645.4 kN, dashboard 613.7 kN.

### EPTA

| Pile | P3c M | Dashboard M |
|---|---|---|
| A1 | 144 | 134 |
| A2 | 143 | 135 |
| A3 | 143 | 136 |
| A4 | 143 | 135 |
| B1 | 18 | 20 |
| B2 | 8 | 9 |
| B3 | 4 | 5 |
| B4 | 13 | 14 |

Sum of bearing horizontal forces: P3c 85.3 kN, dashboard 87.2 kN.

### EPTB

| Pile | P3c M | Dashboard M |
|---|---|---|
| A1 | 19 | 18 |
| A2 | 6 | 6 |
| A3 | 9 | 10 |
| A4 | 23 | 24 |
| B1 | 150 | 141 |
| B2 | 150 | 142 |
| B3 | 150 | 141 |
| B4 | 150 | 140 |

Sum of bearing horizontal forces: P3c 109.1 kN, dashboard 105.7 kN.

### BRKp

| Pile | P3c M | Dashboard M |
|---|---|---|
| A1 | 306 | 368 |
| A2 | 305 | 362 |
| A3 | 304 | 358 |
| A4 | 303 | 356 |
| B1 | 22 | 33 |
| B2 | 7 | 11 |
| B3 | 7 | 8 |
| B4 | 22 | 30 |

Sum of bearing horizontal forces: P3c 545.3 kN, dashboard 567.2 kN.

### BRKm

| Pile | P3c M | Dashboard M |
|---|---|---|
| A1 | 306 | 368 |
| A2 | 305 | 362 |
| A3 | 304 | 358 |
| A4 | 303 | 356 |
| B1 | 22 | 33 |
| B2 | 7 | 11 |
| B3 | 7 | 8 |
| B4 | 22 | 30 |

Sum of bearing horizontal forces: P3c 545.3 kN, dashboard 567.2 kN.

### CEN

| Pile | P3c M | Dashboard M |
|---|---|---|
| A1 | 27 | 29 |
| A2 | 28 | 31 |
| A3 | 29 | 31 |
| A4 | 28 | 31 |
| B1 | 28 | 30 |
| B2 | 29 | 32 |
| B3 | 29 | 31 |
| B4 | 26 | 29 |

Sum of bearing horizontal forces: P3c 103.5 kN, dashboard 103.6 kN.

Differences: the retained height (above) for EP / EPT; for all cases the models (`BR13A.integrated_vs_frozen.md`, M-2: the P3b model is stiffer horizontally, so the split between the bearings / sills and the piles differs).
