# B12453 (SB02) — platform vs design report RPT-000001 rev E

Run `20261104-084337`; INDICATIVE: development inputs D-1 PROPOSED (soil springs, bearing elastomer, temperatures and wind as BR13A — Appendix J not supplied); standards entries unverified; **HLP400 not modelled** (SM1600 only); report values are the critical element over the three bridges unless marked per abutment.

| Item | Report / drawing | Source | Platform | Where (governing row) | Difference |
|---|---|---|---|---|---|
| Girder ULS sagging moment M* (kNm) | 15,924 | report table 4-6 | 13,565 | G02-01 ULS-B-0102 | -14.8 % |
| Girder SLS moment (kNm) | 10,528 | report table 4-4 | 8,870 | G02-01 SLS-S-0058 | -15.8 % |
| Girder ULS shear V* (kN) | 2,157 | report table 4-6 ('equivalent shear', incl. torsion) | 1,966 | G02-01 | -8.9 % |
| Girder ULS capacity φMu at midspan (kNm) | 17,057 | report table 4-6 | 14,001 | G02-02 | -17.9 % |
| Bearing SLS N max (kN) | 2,015 | report table 4-10 | 1,664 | A-01 | -17.4 % |
| Bearing SLS N min (kN) | 946 | report table 4-10 | 454 | A-04 | -52.0 % |
| Pile SLS N max, abutment A2 (kN) | 2,713 | drawing 0201 table 1 (report 5-5: 3281) | 2,502 | A-01 | -7.8 % |
| Pile ULS N max, abutment A2 (kN) | 3,524 | drawing 0201 table 1 / report 5-5 | 3,764 | A-01 | +6.8 % |
| Pile ULS moment, abutment A2 (kNm) | 2,049 | drawing 0201 table 1 (report 4-15: 2053) | 968 | A-03 | -52.7 % |
| Pile SLS N max, abutment B2 (kN) | 2,885 | drawing 0201 table 1 (report 5-5: 3281) | 2,565 | B-03 | -11.1 % |
| Pile ULS N max, abutment B2 (kN) | 3,524 | drawing 0201 table 1 / report 5-5 | 3,837 | B-03 | +8.9 % |
| Pile ULS moment, abutment B2 (kNm) | 2,031 | drawing 0201 table 1 (report 4-15: 2053) | 998 | B-01 | -50.9 % |
| Pile SLS moment (kNm) | 952 | report table 4-14 (with N 2358) | 674 | B-02 | -29.2 % |

## Reading the differences (what is known, not a pass/fail)

- **Scope.** Report tables 4-4..4-15 give the *critical* element over SB01/SB02/SB03; only SB02 is modelled here. The per-abutment pile values on drawing 0201 are the only SB02-specific benchmarks.
- **HLP400 not modelled.** The girder M/V (−9 to −16 %) and bearing N max (−17 %) are low in the direction expected when the governing heavy-load platform is missing. The next engine stage adds it, then this table is rerun.
- **Capacity φMu −18 %.** The platform gives Muo 17,503 kNm and φ 0.80, so φMu = 14,001 kNm. The report gives a design capacity of 17,057 kNm, which is about the platform's *un-factored* Muo (−2.6 %). Possible causes: the report's critical girder belongs to SB01 or SB03 (different strands), or the φ basis differs. **Query for the designer**; nothing has been changed.
- **Pile moments −51 to −53 %, pile SLS M −29 %.** Soil springs are proposed placeholders because Appendix J was not supplied. B12626 showed the same sensitivity. Pile M can't be benchmarked until the springs come from the report.
- **Pile ULS N +7 to +9 %, SLS N −8 to −11 %.** These are inside the range the placeholder inputs allow. The report's table 5-5 SLS 3,281 also differs from drawing 0201 (2,713 / 2,885), and that query is already on the register.
- **Bearing N min −52 %.** Under the platform's combinations the minimum comes from a different load arrangement. This needs the report's combination for N min (not printed) and is recorded as an open item.
- **Shear check not run.** `design.girder_options.aggregate_size` was not on the drawings, and the platform leaves it blank rather than assuming a value.
