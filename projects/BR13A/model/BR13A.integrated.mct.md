# MIDAS import checklist — `BR13A.integrated.mct`

**Status: NEEDS ENGINEER IMPORT TEST — contains UNVERIFIED syntax: *ELASTICLINK, *SPRING.** Generated from revision 44 of `projects/BR13A/BR13A.bridge.0.2.json`.

Contents: 459 nodes, 696 beam elements, 49 materials, 60 sections, 8 elastic links, 148 point springs, 8 supported nodes. Base point E 300098.513, N 6249478.409.

Checked without MIDAS (not an import): re-read by the platform and re-solved (self weight equal; displacements to 1e-6), and read by the dashboard's own .mct parser (same counts, no warnings, same self weight). See `tests/model/test_mct.py`.

## Please check on import (engineer)

1. The file imports without errors or warnings (send the MIDAS message log if not).
2. **Elastic links (UNVERIFIED syntax):** 8 links listed; display the link local axes — local z must run along each girder; SDx = vertical stiffness.
3. **Point springs (UNVERIFIED syntax):** 148 nodes on the piles; check one spring value (kN/m, global X and Y).
4. Self weight (load case SW) total reaction ≈ the platform's value in the report (`BR13A.integrated_vs_frozen.md`).
5. Composite girders are COMPOSITE-GEN (girder + deck polygons; drawing = nearest station, stiffness = interpolated). In Section Properties confirm MIDAS kept the written A, Iyy, Izz, J (not recalculated from the polygons) and that self weight still totals the SW reaction in the report. Piles = DBUSER SR; deck strips = DBUSER SB + *SECT-SCALE (J).
6. Section offset (CT / CC) and the node line: confirm the girders are not shifted vertically (MCT_EXPORT_METHOD §2 rule 7).
7. Load cases: SW + SDL, earth pressure (EP, EPTA, EPTB), braking (BRKp / BRKm), centrifugal (CEN, type USER) and 10 wind cases as *CONLOAD nodal loads (native BR13B syntax; + / - in names spelled p / m); uniform temperature TUp / TUm and shrinkage SCR as *ELTEMPER (dT = strain / alpha on every superstructure beam), gradients TGP / TGN as one *BSTEMPER band per girder element (force and moment equal the platform's E A e0 / E I phi). **Check the gradient cases against the platform** (band integration by MIDAS is the one unverified assumption).
8. Combinations: the platform's AS 5100.2 rows that use only exported cases, as plain additive *LOADCOMB rows; rows with vertical wind (up / down) or traffic surcharge (A / B / none) are expanded into one row per alternative (suffix a, b, c ...), never nested envelopes (MIDAS evaluates nested envelopes in its own way). No envelope combination is written: MIDAS's envelope of the rows ignored 63 of 145 members (run 2026-10-28e) — envelope with MIDAS's own tools or use the platform's envelopes. Factors are code-extracted-UNVERIFIED standards entries. Rows with traffic are not written yet (traffic is not in the file).
9. Earthquake: spectrum cases EQ_L / EQ_T (one direction each; the 1.0 / 0.3 directional combination is in the combination rows) with the platform's Sa(T) points; masses = SDL + member self weight, both through *LOADTOMASS (SW_mass = self weight as beam loads, a mass-only case: do NOT combine it), lumped (native setting; the platform uses consistent mass, and adds a missing-mass term). **Check:** (a) the *SPLDCASE last field 0.3 (copied from the native file) must NOT add an orthogonal 30 % — compare EQ_L results with the platform's longitudinal-alone results; (b) MIDAS uses the listed spectrum points, not its own AS 5100.2 'Be' curve (the native BR13B 'Be' values equal the platform's Ae row — owner to confirm which is right).

