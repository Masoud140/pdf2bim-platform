# BR13A — MIDAS run 2026-10-28e: plain combination rows; earthquake diagnosis

- File: commit 3af8d75 (envelope actions expanded into 171 plain rows + 16 earthquake rows; ULS / SLS envelope combinations).
- Owner run 2026-10-28 13:52, `Results_plain_combinations.xlsx` (forces sheet named "Results").

## Static, temperature, combination rows
- Every load case and every combination row matches the platform (198 labels; only TGP / TGN with the known 3.4 % local shear).
- **MIDAS's envelope combination is not the envelope of its member rows:** of the 145 SLS rows, 63 are not reflected in
  "SLS Envelope" (leaving exactly those 63 out reproduces MIDAS's envelope to 0.002 mm). No rule found (not negative factors,
  not order, not a term limit, not the resultant / absolute-value criteria). Decision: no envelope combinations are written;
  the user envelopes the rows with MIDAS's own tools, or uses the platform's envelopes.

## Earthquake — cause found
- MIDAS EQ_L / EQ_T = 0.19-0.32 x the platform (same as run d).
- The platform RSA with **SDL mass only** (member self weight not converted to mass) reproduces MIDAS: median ratio 1.007 (L),
  1.009 (T); T1 = 0.226 s instead of 0.562 s. So MIDAS did not convert the self weight into mass: the *STRUCTYPE line copied
  from the native BR13B file (`0, 1, 1, YES, NO, ...`) does not do it — that model used "NoMass" materials (DEN 0) and
  *LOADTOMASS, so it never relied on the conversion. The iSMAS code for "convert self weight to X, Y, Z" is still to confirm.
