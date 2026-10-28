# BR13A — MIDAS run 2026-10-28d: all cases incl. earthquake vs platform

- File: commit a013283 (negated envelope copies for negative factors; earthquake EQ_L / EQ_T; 149 rows). Owner run 2026-10-28 13:38.
- `Results_all_incl_EQ.xlsx`: 275 load labels.

## Static, temperature, combinations
- 211 labels compared (non-earthquake); outside tolerance: TGP, TGN, ULS Envelope(max), SLS Envelope(max), ULS Envelope(min), SLS Envelope(min).
- Every combination row now matches, including the rows with negative envelope factors (fix of run c confirmed).
- TGP / TGN: the known local shear difference (3.4 %), displacements equal.
- ULS / SLS Envelope: MIDAS's envelope of rows that themselves contain envelope terms is NOT the envelope of those rows' results
  (at node 197 DZ MIDAS SLS Envelope(max) = -12.019 mm, higher than every SLS row's own max, highest -12.296 mm; no label carries
  that value). MIDAS evaluates nested envelopes in its own way. Fix: envelope actions are now expanded into plain additive rows
  (171 rows instead of 133, suffix a / b / c); the two overall envelopes contain only plain rows. Re-run needed to confirm.

## Earthquake (EQ_L, EQ_T) — OPEN
- MIDAS spectrum results are 20-30 % of the platform's (pile and girder end actions; median ratio 0.19-0.32), whether EQ_L is taken
  as L alone or L + 0.3 T — not explained by the 0.3 field, missing mass (platform 87 % modal mass in 30 modes) or lumped mass.
- Platform: T1 = 0.562 s, total mass 950 t (self weight + SDL), Sa plateau 0.400 g (site class Be row, Rf 1).
- Needed from MIDAS: the eigenvalue table (periods, mass participation) to tell a mass problem (self weight not converted
  to mass by *STRUCTYPE) from a spectrum problem (MIDAS regenerating its own curve from the code line).
