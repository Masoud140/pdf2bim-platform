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

**Resolved (same day):** the transverse differences were a platform solver bug, not MIDAS. Since ADR-042 the builder recorded the
rigid-arm moment releases and the .mct wrote them (*FRAME-RLS), but the solver never applied them. MIDAS section properties were
confirmed equal to the written values (owner screenshots: S16 composite, S53 slab, S57 cross girder). After adding releases to the
solver (static condensation):

| Check (SW, all 459 nodes / 696 elements) | Result |
|---|---|
| Worst nodal translation difference | 0.013 mm (max deflection 19.10 mm both) |
| Worst element end-force difference, any component | 12.3 kN·m on 2793 (girder My, 0.4 %); all others ≤ 5 kN |
| Sign convention | MIDAS local My = − solver My; all other components equal |

Regression test: `tests/model/test_midas_run.py` (fails, by design, whenever the model changes: re-run MIDAS and replace the evidence).
