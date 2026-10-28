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
7. Load cases: SW + SDL, earth pressure (EP, EPTA, EPTB), braking (BRKp / BRKm), centrifugal (CEN, type USER) and 10 wind cases as *CONLOAD nodal loads (native BR13B syntax; + / - in names spelled p / m). Not yet in the file: temperature / shrinkage, traffic (moving load), earthquake, combinations.

