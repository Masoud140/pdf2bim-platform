# Prestressing and debonding rules for pretensioned Super-T girders

2026-11-10. These rules come from an owner-supplied reference note (seven requirements), fact-checked against public sources.

**Status of every value: Standard - verify.** The AS 5100.5 clause text could not be checked against a licensed copy here. Before any value becomes a `verified` standards entry, check it against the licensed AS 5100.5:2017 incorporating Amendments 1–3. Amendment 3 (2025) exists ([Standards Australia store](https://store.standards.org.au/product/as-5100-5-2017-amd-3-2025)).

## How to use this file

- Keep AS 5100.5 rules separate from authority rules (TfNSW, TMR). Every check row must name its source.
  - An authority rule applies only when the project's authority is that authority, or when the owner says it applies.
- Values printed on a project's drawings come first: release strength, jacking force, debonding, cover. The rules here are the design checks of those values. They are never a source of input.

## Rules

| # | Item | Rule | Source | Check |
|---|---|---|---|---|
| 1 | Max jacking force, pretensioned | ≤ 0.80 fpb Ap | AS 5100.5 Cl 17.5.4.6 (verify) | owner note; matches the existing Studio limit `jackMax` 0.8 |
| 1a | Minimum prestress | None in AS 5100.5. It follows from the SLS, ULS, transfer, deflection and crack checks. | — | consistent |
| 1b | Stressing accuracy | Force ±3 %. Investigate if the measured extension differs from the calculated one by more than 10 %. | AS 5100.5 Cl 17.5.4.5 (verify) | construction item; not a platform check |
| 2 | Release strength f'cp | Specified by the designer; AS 5100.5 sets no universal value. | AS 5100.5 Cl 1.8.2(i) (verify) | consistent |
| 2a | f'cp, NSW | Not above 40 MPa without approval. | TfNSW BTD 2010/03 (TS 02018) | owner note; source not opened here |
| 2b | f'cp, Queensland | 35 ≤ f'cp ≤ 40 MPa for Super-T and deck units. | TMR DCBOS Feb 2024 Cl 4.9.1.5 | owner note; not confirmed here |
| 3 | Transfer compression | 0.5 f'cp for a rectangular stress distribution; 0.6 f'cp for a triangular one. Transfer combinations with φ 0.6. | AS 5100.5 Cl 8.1.6.2 (verify) | **Studio uses 0.6 f'cp only (`lim.cT`)**: correct only for a triangular distribution (girder ends after release) |
| 3a | Compression, TMR | 0.6 f'cp at transfer; 0.4 f'c at other times. | TMR additional requirements | authority rule; not in the platform |
| 4 | Tension and crack control | Default: tension ≤ 0.25√f'c (at transfer 0.25√f'cp). Otherwise, bonded steel at ≤ 200 mm near the tension face, plus (a) tension ≤ 0.5√f'c (0.5√f'cp), or (b) steel stress increment from decompression ≤ Table 8.6.2.1 (bonded tendons 200 MPa). | AS 5100.5 Cl 8.6.2.1 (verify) | **implemented** in Studio (ADR-063, options u / a / b) and in the platform's `crack_control` entries. The owner note's labels "Option A / B" are the clause's items (a) / (b). |
| 5 | Placement cover, tendons | Not less than the greatest of 1.5 × max aggregate, 2 db and 40 mm. Durability cover per Cl 4.14.3 (exposure, f'c). Exposed strand ends are sealed. | AS 5100.5 Cl 4.14.2 (verify) | owner note. The 40 mm absolute minimum is not confirmed. Studio `lim.cover` 45 mm is an illustrative input. |
| 5a | Strand spacing | No universal number: placement and compaction (Cl 17.3.3). | AS 5100.5 Cl 8.1.9.1 (verify) | consistent |
| 5b | Grouping | Deflected pretensioned tendons may be grouped in the middle third. The two-in-contact rule applies to ducts, not to strands. | AS 5100.5 Cl 8.1.9.2 (verify) | not checked |
| 5c | Super-T cover basis, NSW | TfNSW standard drawings use exposure B1 and f'c 50 MPa. For more severe exposure, increase the cover and flange thickness. | BTD 2011/06 Rev 1 | **confirmed** ([BTD 2011/06](https://studylib.net/doc/26232132/provisions-for-the-design-of-super--t-girder-bridges)) |
| 6 | Debonded strands, NSW Super-T | ≤ 50 % of the strands debonded at any section. A strand horizontally or vertically adjacent to a debonded strand must not be debonded. | TfNSW BTD 2011/06 Rev 1 | **confirmed** (same source). **Studio uses 25 % total / 40 % per row, an AASHTO-style rule, and has no adjacency check.** |
| 6a | Debonding, AS 5100.5 | No percentage limit. Length and arrangement follow from the design checks. | — | consistent |
| 7 | Transmission length | Ordinary and compact 7-wire strand: Lpt = 60 db (912 mm for 15.2 mm). Unstressed end zone 0.1 Lpt. | AS 5100.5 Cl 13.3.2.1 (verify) | matches `AS5100.5:prestress:transmission_length`. The 0.1 Lpt dead zone is not modelled (the engines ramp linearly from the end). |
| 7a | Development length | Lp = 0.145 (σpu − 0.67 σp.ef) db ≥ 60 db. Debonded strand: 2 Lp where the design allows tension (Cl 8.6.2 / 9.4.2) within that length. | AS 5100.5 Cl 13.3.2.2 (verify) | **not checked** by the platform or Studio. ULS φMu near the ends uses full strand capacity once the strand is transmitted. |

## Corrections to the owner note

- Austroads ATS 5326: the current edition is **1.2, ATS-5326-25, published 16 December 2025** ([Austroads](https://austroads.gov.au/publications/test-methods/ats-5326)). The note says 1.3 of 1 October 2026, which could not be confirmed.
- 15.2 mm strand: the note's 140 mm² and 1750 MPa are its own illustrative numbers. Use the certified strand data or the project drawings. The engines' table holds 140 mm² / 250 kN for 15.2 mm (HOG `STR`); check it against AS/NZS 4672.1 before it is relied on.
- BTD 2011/06 also gives:
  - at least 400 mm from the girder end to the bearing centreline;
  - span limits T1–T5 for SM1600;
  - skew above 25° needs a finite element deck analysis, and above 35° needs approval;
  - the soffit must be above the 50-year ARI flood level.

## Rules for the next calculation

1. Report the transfer compression check against 0.5 f'cp or 0.6 f'cp, naming the stress distribution used.
2. NSW Super-T: check debonding at ≤ 50 % per section plus horizontal and vertical adjacency (BTD 2011/06). Keep the AASHTO-style 25 / 40 % only as an optional rule, labelled as such.
3. Check the development length near the girder ends: Lp ≥ 60 db, and 2 Lp for debonded strands where tension is allowed. Where the ULS check uses strand capacity within Lp of the bonded point, reduce it, or flag the station.
4. Placement cover: check max(1.5 × aggregate, 2 db, 40 mm). The aggregate size is often Missing-Flagged (SB42: TfNSW B80 reference only).
5. Cite each limit with its clause or authority document and the tag `Standard - verify`, until it has been checked against the licensed edition.

Items 1–3 are platform and Studio work (P4 verification backlog). They are recorded in `docs/NEXT_SESSION.md`.
