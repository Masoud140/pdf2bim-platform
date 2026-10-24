# Geometry — BR13A.bridge.0.2.json

- Built by `tools/build_geometry.py` (P1 engine `pdf2bim/geometry`). Input hash `sha256:dd0a6b4588aef289836b0fe24cba0cd33f336875327162bcd49286f33b13a320` (pdf2bim.bridge/0.2).
- Coordinates: MGA (as in the description), metres; offsets + right of increasing chainage.
- **Status: PROVISIONAL — uses proposed values**. Geometry is Calculated from the description; it is not independently surveyed.

## Provisional inputs (proposed, not yet accepted by the engineer)

- `alignment.support_lines.rows[0]` ← OV-1 (D-34, by AI)
- `alignment.support_lines.rows[1]` ← OV-1 (D-34, by AI)

## Checks

| Check | Value | Limit | Result |
|---|---|---|---|
| integrated vs tabulated start point of element 1 (ch 1897.507) | 0.000572 m | 0.005 m | PASS |
| integrated vs tabulated start point of element 2 (ch 2036.438) | 0.002198 m | 0.005 m | PASS |
| integrated vs tabulated start point of element 3 (ch 2091.438) | 0.00209 m | 0.005 m | PASS |
| |bearing − normal to the support-to-support chord| vs the skew given | 0.002077 ° | 0.01 ° | PASS |
| |bearing − normal to the support-to-support chord| vs the skew given | 0.002077 ° | 0.01 ° | PASS |

- Start bearing (Calculated): 285.224886° — bearing(TS->next point) − deflection of the chord in element 0.

## Supports

| Support | Ch | E | N | RL (control line) | Bearing | Skew to chord normal | Skew to local normal |
|---|---|---|---|---|---|---|---|
| A | 1895.300 | 300098.5127 | 6249478.4091 | 130.5314 | 44.029166° | 34.4979° | 32.4336° |
| B | 1924.210 | 300070.0080 | 6249483.1951 | 129.5237 | 44.029166° | 34.4979° | 36.5683° |

## Girders (straight chords between bearing centres)

| Girder | Bearing A (E, N) | Bearing B (E, N) | Chord A–B (m) | End to end (m) | Chord offset at midspan vs line offset (m) |
|---|---|---|---|---|---|
| G1 | 300095.9018, 6249475.7082 | 300067.2625, 6249480.3550 | 29.0138 | 30.1598 | -0.2653 |
| G2 | 300097.8082, 6249477.6802 | 300069.2675, 6249482.4291 | 28.9331 | 30.0761 | -0.2622 |
| G3 | 300099.7102, 6249479.6478 | 300071.2660, 6249484.4965 | 28.8545 | 29.9935 | -0.2592 |
| G4 | 300101.6081, 6249481.6111 | 300073.2583, 6249486.5575 | 28.7780 | 29.9150 | -0.2561 |

## Flange edges along each chord (mm, square to the chord; ADR-004)

| Girder | t | left | right | width |
|---|---|---|---|---|
| G1 | 0.0 | 1135.2 (deck edge left) | 1114.1 (G2) | 2249.3 |
| G1 | 0.5 | 869.1 (deck edge left) | 1143.3 (G2) | 2012.5 |
| G1 | 1.0 | 1135.2 (deck edge left) | 1172.5 (G2) | 2307.7 |
| G2 | 0.0 | 1111.0 (G1) | 1114.6 (G3) | 2225.6 |
| G2 | 0.5 | 1140.1 (G1) | 1143.3 (G3) | 2283.4 |
| G2 | 1.0 | 1169.2 (G1) | 1172.0 (G3) | 2341.2 |
| G3 | 0.0 | 1111.6 (G2) | 1115.2 (G4) | 2226.7 |
| G3 | 0.5 | 1140.1 (G2) | 1143.3 (G4) | 2283.4 |
| G3 | 1.0 | 1168.7 (G2) | 1171.4 (G4) | 2340.1 |
| G4 | 0.0 | 1112.2 (G3) | 1135.1 (deck edge right) | 2247.3 |
| G4 | 0.5 | 1140.2 (G3) | 1390.5 (deck edge right) | 2530.7 |
| G4 | 1.0 | 1168.2 (G3) | 1135.1 (deck edge right) | 2303.4 |

## Not produced (missing in the description)

- deck end lines (position of the deck end relative to the support line is not in the description)

## Comparison with the dashboard model (cross-implementation, V5 — not a benchmark)

Dashboard geometry captured from build `710b259d2c71` (MCT local coordinates + documented base point E 300098.513, N 6249478.409).

| Girder | Bearing A Δ (mm) | Bearing B Δ (mm) | Dashboard girder path length (m) | P1 end-to-end chord (m) | Δ (mm) |
|---|---|---|---|---|---|
| G1 | 18.8 | 23.3 | 30.1616 | 30.1598 | -1.7 |
| G2 | 1.4 | 1.5 | 30.0825 | 30.0761 | -6.4 |
| G3 | 3.9 | 4.6 | 29.9999 | 29.9935 | -6.5 |
| G4 | 25.4 | 32.9 | 29.9130 | 29.9150 | +2.0 |

**Explanation (F-4).**
- The dashboard's frozen model places the bearing nodes up to about 26 mm off the straight printed support line.
- Its four bearing nodes at a support are not collinear: G2 and G3 are 16–20 mm off the G1–G4 line.
- P1 uses the exact intersection of the girder line with the straight support line.
- The dashboard's 'girder length' is the polyline length along the curved girder mesh, not a chord.
- **No P1 error is indicated.** The dashboard model is the approximation.

