# BR13A integrated model — first MIDAS run vs platform solver (self weight)

- File: `BR13A.integrated.mct` at commit 7645e0c (deck-top reference D-48, composite girders, SR piles, FRAME-RLS, no cross girder outside edge Super-Ts).
- MIDAS Civil NX (MEC V2.0.0, Jun 2026), owner run 2026-10-28: **imported and analysed with 0 errors, 0 warnings** (`analysis.log`).
  MIDAS internal model 915 nodes / 1307 elements vs 459 / 696 written: internal offset nodes (section offsets CT) — not a discrepancy.
- Results: `Results_SW.xlsx` (sheet "Reaction" = beam end forces; "Displacement" = all 459 nodes).

| Quantity (SW) | MIDAS | Platform | Difference |
|---|---|---|---|
| Max vertical deflection | 19.10 mm | 18.80 mm | +1.6 % |
| Worst nodal ΔZ, substructure (piles, sills, rigid links) | — | — | ≤ 0.016 mm |
| Worst nodal ΔZ, superstructure | — | — | 0.83 mm (edge line; MIDAS edges stiffer, webs softer) |
| Worst nodal ΔX / ΔY | — | — | 0.10 / 0.16 mm |
| Max girder My | 2793 kNm | 2734 kNm | +2.2 % |
| Max sill My | 458 kNm | 453 kNm | +1.0 % |
| Max pile My | 52.7 kNm | 53.6 kNm | −1.7 % |
| Max cross-girder My | 272 kNm | 188 kNm | +44 % |
| Max slab-strip My | 11.6 kNm | 38.8 kNm | −70 % (small absolute values) |

**Verified by this run:** MCT syntax of every block written (incl. *ELASTICLINK, *SPRING, *FRAME-RLS, *SECT-SCALE, COMPOSITE-GEN, DBUSER SR, section offset CT); geometry, supports, links, springs, self weight and the substructure response.

**Open (superstructure transverse distribution):** the cross-girder / slab moments and the edge-vs-web deflection pattern differ more than the global response. Likely cause: MIDAS recalculating section stiffness itself (composite J / shear areas from the polygons, or DBUSER J / shear areas for the deck strips and cross girders) rather than using the written values. Next check: MIDAS section property table for one composite girder, the deck strip (S53) and the cross girder (S57) vs `BR13A.integrated.mct`.
