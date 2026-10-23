# Roadmap (P0–P7, agreed 2026-10-23; replaces R0–R9)

- **Rule:** each stage follows the 10-step process in `DEVELOPMENT_PRINCIPLES.md` §2 and stops for engineer review.
- **Status and gaps:** `CURRENT_STATUS.md`. Verification levels V1–V6: `VERIFICATION_STRATEGY.md`.

**Done before P0:**
- A: sources, build and tests in the repository;
- B1: bridge description format;
- B2: BR13A described in the format;
- v45: one Super-T definition and flange widths per girder.

| Stage | Goal | Main outputs | Acceptance | Was |
|---|---|---|---|---|
| **P0** Audit, architecture, verification | Agreed target and test plan; known baseline | `ARCHITECTURE`, `DEVELOPMENT_PRINCIPLES`, `VERIFICATION_STRATEGY`, `DECISIONS`, `CURRENT_STATUS`; **P0.1 regression snapshot** | Docs reviewed; snapshot runs twice identically; the test fails on a changed value | R0 |
| **P1** Geometry engine | All geometry from the bridge description only | Python module: alignment, support lines, bearings, straight girder chords, deck edges, flange edges, headstocks, piles (MGA, stable ids) | 4 validation cases (VERIFICATION §3) to 1 mm; BR13A chords equal the dashboard to 1 mm | R1 |
| **P2** Sections and products | One definition → properties per member segment | Super-T T1–T5 + overrides, open / solid zones, flared flanges, composite, torsion; product library file | Properties to 0.5 % of hand / independent values; FD torsion to 2 % | R2, part of R5 |
| **P3** Model builder + callable core | Model from the description; engine callable without a browser | Grillage, transverse members (not assumed perpendicular), bearings, substructure, springs; members by role; MIDAS .mct writer; Python interface to solver, loads and combinations | V2 model checks pass; BR13A reactions and modes equal the frozen model within tolerance; .mct opens in MIDAS | R3, R4 |
| **P4** Structural verification | Trustworthy actions and checks | Concurrent traffic actions, signed earthquake, pile resultants, stage assumptions resolved; standards data file (ADR-009); design engine E-1 fixed | Independent MIDAS model and benchmarks within tolerance; standards entries checked | R5 |
| **P5** Extraction + decision workflow | PDF → description → decisions in the app | Extraction writes the description and the Query Register; decision review UI; run records; stale marking | A new GA produces a valid description; every value is source-linked | R6, R9 |
| **P6** Second-bridge pilot | Prove it is generic | A different single-span Super-T from PDFs, without code changes | Full chain runs; only data and decisions differ | R8 |
| **P7** Productisation + planks | Web application; plank module | TypeScript front end, API, database, users; precast planks in the product library | Agreed with the owner at the time | R7 |

## P0.1 — first implementation task (proposed)

**BR13A baseline regression snapshot.**

- **What:** a headless script (Playwright on the built dashboard) that captures key outputs into versioned JSON with a run record (input hash, git commit, build sha256, settings):
  - G2 section A and I;
  - pile head stiffness;
  - SDL bearing reactions;
  - temperature chord ratio;
  - first modal periods;
  - the bearing schedule summary;
  - midspan design utilisations.
- **Test:** a comparison test with tolerances (VERIFICATION §4).
- **Acceptance:**
  - two runs give identical snapshots;
  - changing one input makes the test fail;
  - the test is listed in the README.
- **Why first:** every later stage (P1–P4) is checked against it. It changes no engine code.
