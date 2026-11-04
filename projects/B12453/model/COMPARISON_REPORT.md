# B12453 (SB02) — platform vs design report RPT-000001 rev E

Run `20261105-071140`; INDICATIVE: development inputs D-1 PROPOSED (soil springs, bearing elastomer, temperatures and wind as BR13A — Appendix J not supplied); standards entries unverified; **HLP400 modelled with a placeholder-unverified vehicle** (AS5100.2:traffic:HLP400, agent recollection of Fig 7.3 — to be checked); report values are the critical element over the three bridges unless marked per abutment.

| Item | Report / drawing | Source | Platform | Where (governing row) | Difference |
|---|---|---|---|---|---|
| Girder ULS sagging moment M* (kNm) | 15,924 | report table 4-6 | 14,281 | G02-01 ULS-B-0318 | -10.3 % |
| Girder SLS moment (kNm) | 10,528 | report table 4-4 | 10,217 | G02-01 SLS-S-0091 | -3.0 % |
| Girder ULS shear V* (kN) | 2,157 | report table 4-6 ('equivalent shear', incl. torsion) | 2,006 | G02-01 | -7.0 % |
| Girder ULS capacity φMu at midspan (kNm) | 17,057 | report table 4-6 | 14,002 | G02-02 | -17.9 % |
| Bearing SLS N max (kN) | 2,015 | report table 4-10 | 1,866 | A-01 | -7.4 % |
| Bearing SLS N min (kN) | 946 | report table 4-10 | 482 | A-04 | -49.0 % |
| Pile SLS N max, abutment A2 (kN) | 2,713 | drawing 0201 table 1 (report 5-5: 3281) | 2,738 | A-01 | +0.9 % |
| Pile ULS N max, abutment A2 (kN) | 3,524 | drawing 0201 table 1 / report 5-5 | 3,816 | A-01 | +8.3 % |
| Pile ULS moment, abutment A2 (kNm) | 2,049 | drawing 0201 table 1 (report 4-15: 2053) | 967 | A-03 | -52.8 % |
| Pile SLS N max, abutment B2 (kN) | 2,885 | drawing 0201 table 1 (report 5-5: 3281) | 2,812 | B-03 | -2.5 % |
| Pile ULS N max, abutment B2 (kN) | 3,524 | drawing 0201 table 1 / report 5-5 | 3,889 | B-03 | +10.4 % |
| Pile ULS moment, abutment B2 (kNm) | 2,031 | drawing 0201 table 1 (report 4-15: 2053) | 997 | B-01 | -50.9 % |
| Pile SLS moment (kNm) | 952 | report table 4-14 (with N 2358) | 673 | B-02 | -29.3 % |

## Reading the differences (what is known, not a pass/fail)

- **Scope.** Report tables 4-4..4-15 give the *critical* element over SB01/SB02/SB03; only SB02 is modelled. SB01 is wider (14 girders, 6 marked lanes, HLP400 in two lanes per direction + 0.5 SM1600 alongside), so the report's critical girder is probably on SB01. Only the per-abutment pile values on drawing 0201 are SB02-specific.
- **HLP400 (P8.2).** Vehicle from AS 5100.7-2004 App A (A2.2.4, Fig A3, A2.2.10.3) and confirmed by the MIDAS HLP400 library vehicle: 16 axle rows × 250 kN at 1.8 m, 4 dual wheels at ±1.1 / ±2.0 m, DLA 0.1; no central gap on a single span; ±1 m about the carriageway centreline (report table 2-7); ULS 1.5 / SLS 1.0 (report table 2-9). With the compact 27 m platform HLP400 now governs SLS: girder SLS M −15.6 % → **−5.0 %**, bearing N max −15 % → **−9 %**, pile SLS N → **−0.4 % / −3.8 %** against drawing 0201. Girder ULS M −12 % (governing row now HLP-led); the rest of the gap is consistent with the report's critical girder being on SB01 (scope above).
- **Barriers and haunch (ADR-054/055).** Barrier line load from the 0909 section (precast PB-1 + in-situ stitch pour) 11.47 kN/m at 252 mm outside the inside face (was 8.78 kN/m from the unit mass, offset assumed); haunch concrete 0.18 kN/m per girder as SDL. Girder ULS M −11.9 → −10.3 %, SLS −4.7 → −3.0 %.
- **Capacity φMu −18 %.** Platform Muo 17,503 kNm, φ 0.80 → φMu 14,001; the report's design capacity 17,057 is close to the platform's *un-factored* Muo (−2.6 %). Either the critical girder (SB01) has more strands or the φ basis differs. **Query for the designer**; nothing changed.
- **Pile moments −51 / −53 %, pile SLS M −29 %.** Soil springs are proposed placeholders (Appendix J not supplied); B12626 showed the same sensitivity. Pile M is not benchmarkable until the springs come from the report.
- **Pile N.** ULS +7 / +9 %, SLS −6 / −9 % — inside what the placeholder inputs allow. Report table 5-5 SLS 3,281 also differs from drawing 0201 (2,713 / 2,885): query on the register.
- **Bearing N min −52 %.** The minimum comes from a different arrangement in the platform combinations; the report does not print its N-min combination. Open item.
- **Shear check not run.** `design.girder_options.aggregate_size` is not on the drawings; left blank, not assumed.
