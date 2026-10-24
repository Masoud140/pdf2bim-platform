# Migration report — BR13A.bridge.json → BR13A.bridge.0.2.json

- Records migrated: 928
- Originals reconstructed from the decision log: 4
- Revision 1, created 2026-10-24T11:30:00+11:00, hash `sha256:55f5510b5880fc67d9686a3ed96e43d4341dcb0531dc2b312979a3ff6ae34154`
- Decision log sha256: `sha256:ecd2c92b719eead47e3bd57cc79b16ec89f04d198710feb3a5d3c504be0855d2`

## Reconstructed originals (current = OV-1)

| Path | Decision | Original value (tag) | Current value (tag) |
|---|---|---|---|
| `superstructure.members[G1].length` | D-6 | 34950 (Assumed) | 30.162 (Calculated) |
| `superstructure.members[G2].length` | D-6 | 34950 (Assumed) | 30.082 (Calculated) |
| `superstructure.members[G3].length` | D-6 | 34950 (Assumed) | 30.0 (Calculated) |
| `superstructure.members[G4].length` | D-6 | 34950 (Assumed) | 29.913 (Calculated) |

## Needs engineer input

- **Original unit unknown** for 4 reconstructed originals (format 0.1 did not record it). Left `null`, not guessed: `superstructure.members[G1].length`, `superstructure.members[G2].length`, `superstructure.members[G3].length`, `superstructure.members[G4].length`
- **Significance** not set on any value (not guessed). To be set by the engineer, high-impact values first.
- Decisions with a previous value that were NOT assigned to a single field (the decision key does not equal the record path; e.g. it names a parent object). The record keeps its first recorded state as original; the earlier value stays only in the decision log: `superstructure.supert_types[ST1].section` ← D-8 (key `superstructure.supert_types[ST1]`); `superstructure.supert_types[ST1].depth` ← D-8 (key `superstructure.supert_types[ST1]`)
- Decisions with a previous value that no record links to (history stays in the log): D-7, D-8

## Decision links found on records

D-1×32, D-2×68, D-3×3, D-4×2, D-5×4, D-6×4, D-8×2, D-9×45, D-10×1, D-11×16, D-12×12, D-13×2, D-14×1, D-15×1, D-16×1, D-17×1, D-18×1, D-19×1, D-20×1, D-21×1, D-22×1, D-23×1, D-24×1, D-25×1, D-26×1, D-27×1, D-28×1, D-29×1, D-30×1, D-31×1, D-32×1, D-33×1
