# BR13A SDL (superimposed dead load): P3b vs the dashboard (unfactored)

P3b: `sdl_case` on the P3b integrated model. Dashboard: its own SDL nodal loads (rxSDL) on the frozen integrated model.
Both are solved by the same Python solver, without self weight. **Cross-implementation comparison (V5), not verification.**

- Status: **PROVISIONAL** (model inputs D-37, D-39, D-40, D-41). Load inputs by tag: Assumed: deck.barriers[barrier_left].weight, deck.barriers[barrier_right].weight; Calculated: deck.barriers[barrier_left].offset, deck.barriers[barrier_right].offset; Direct: deck.surfacing_thickness, deck.carriageway_left, deck.carriageway_right; Missing-Flagged: deck.other_sdl; Standard-verify: deck.surfacing_density.
- Not applied: deck.other_sdl (Missing-Flagged).
- Discretisation: 13090 load points (cells 0.2 × 0.1 m, clipped at the skewed deck ends); 1 point(s) moved onto the node hull by at most 0.07 mm.
- Equilibrium residual: P3b 1.7e-05 kN; frozen 3.1e-08 kN.

## Totals (kN, downward)

| Component | P3b | Basis |
|---|---|---|
| surfacing | 416.4 | 1.650 kPa × 252.37 m² (offsets -3.9 … 4.5 m) |
| barrier barrier_left | 241.6 | 8 kN/m × 30.203 m (offset -4.1 m) |
| barrier barrier_right | 239.1 | 8 kN/m × 29.891 m (offset 4.7 m) |
| **total** | **897.2** | dashboard: **894.5** (+0.30 %) |

## Bearing reactions (kN, upward on the girder)

Isolation column: the P3b load points placed on the FROZEN model's deck nodes (same triangulation method) and solved on the frozen model, so it differs from the dashboard column only by the load discretisation / distribution (33 points moved ≤ 38 mm onto its mesh-quantised deck ends).

| Bearing | P3b model + P3b loads | Frozen + dashboard loads | Δ | Frozen + P3b loads (isolation) | Δ distribution only |
|---|---|---|---|---|---|
| A-G1 | 150.1 | 168.1 | -10.7 % | 166.2 | -1.1 % |
| A-G2 | 91.7 | 73.2 | +25.1 % | 72.7 | -0.7 % |
| A-G3 | 89.8 | 77.7 | +15.7 % | 77.8 | +0.1 % |
| A-G4 | 112.8 | 121.4 | -7.1 % | 127.1 | +4.7 % |
| B-G1 | 118.8 | 124.0 | -4.2 % | 125.5 | +1.2 % |
| B-G2 | 64.4 | 63.1 | +2.1 % | 60.3 | -4.5 % |
| B-G3 | 66.1 | 62.3 | +6.1 % | 57.2 | -8.1 % |
| B-G4 | 203.5 | 204.7 | -0.6 % | 210.4 | +2.8 % |

## Pile toe reactions (kN)

| Pile | P3b | Dashboard (frozen) | Δ |
|---|---|---|---|
| A1 | 130.8 | 128.5 | +1.8 % |
| A2 | 122.0 | 126.8 | -3.8 % |
| A3 | 103.7 | 104.3 | -0.6 % |
| A4 | 87.9 | 80.9 | +8.7 % |
| B1 | 101.8 | 104.8 | -2.9 % |
| B2 | 71.0 | 71.1 | -0.1 % |
| B3 | 95.0 | 92.9 | +2.2 % |
| B4 | 185.0 | 185.2 | -0.1 % |

## Girder midspan deflection (mm)

| Girder | P3b | Dashboard (frozen) |
|---|---|---|
| G1 | -5.14 | -5.03 |
| G2 | -4.66 | -4.41 |
| G3 | -4.75 | -4.35 |
| G4 | -5.39 | -4.91 |

## Known differences
- Dashboard: point loads on a 0.2 × 0.1 m grid kept only where the cell centre is inside the deck (partial cells at the skewed ends are dropped); barrier pieces of 0.2 m chainage. P3b: cells clipped exactly at the end lines; barrier pieces measured along the offset curve.
- Distribution: dashboard trW() transverse weights; P3b barycentric weights on a triangulation of the deck nodes (exact force and first moments).
- Models: as `BR13A.integrated_vs_frozen.md` (straight chords, sections, bearing links).
