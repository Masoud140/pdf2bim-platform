# BR13A superstructure: P3 model vs the dashboard's frozen superstructure (self weight)

Both models are solved by the same Python solver, with the same bearing scheme (A fixed along / across the girder, B free along, fixed across; vertical fixed).
**Differences therefore come from the models themselves.** This is a cross-implementation comparison (V5), not a benchmark.

- P3 model: 275 nodes, 514 members. Status: PROVISIONAL (proposed inputs).
- Total self weight: P3 4081.2 kN; frozen 4130.5 kN (-1.19 %).
- Equilibrium residual: P3 2.11e-05 kN; frozen 3.26e-07 kN.

| Bearing | P3 Rz (kN) | Frozen Rz (kN) | Δ |
|---|---|---|---|
| A-G1 | 699.1 | 672.0 | +4.0 % |
| A-G2 | 409.1 | 444.0 | -7.9 % |
| A-G3 | 555.2 | 579.8 | -4.2 % |
| A-G4 | 363.4 | 369.8 | -1.8 % |
| B-G1 | 341.7 | 328.9 | +3.9 % |
| B-G2 | 561.5 | 578.9 | -3.0 % |
| B-G3 | 423.2 | 380.8 | +11.1 % |
| B-G4 | 728.0 | 776.3 | -6.2 % |
| Sum A | 2026.8 | 2065.6 | -1.9 % |
| Sum B | 2054.5 | 2064.9 | -0.5 % |

| Girder | P3 midspan uz (mm) | Frozen midspan uz (mm) |
|---|---|---|
| G1 | -17.52 | -17.20 |
| G2 | -17.33 | -17.29 |
| G3 | -17.43 | -17.46 |
| G4 | -17.48 | -17.72 |

**Known model differences (by design):**
- P3 girders are straight chords; the frozen girders follow the curve (up to 265 mm apart at midspan).
- P3 girder sections vary along the girder with the flare (P2); the frozen model uses one section per girder.
- P3 solid end blocks are 2.0 m from each girder end (D-38, proposed), on nodes; the frozen ones are quantised to the mesh.
- P3 bearing centres are on the straight support line; the frozen ones are up to 26 mm off it (F-4).
- Deck-strip tributary at the first / last station: P3 uses a half-step. The per-element tributary to the skewed end (Stage A) is not yet implemented.
