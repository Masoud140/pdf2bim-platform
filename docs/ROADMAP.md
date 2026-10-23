# Roadmap (re-sequenced 2026-10-23) — see docs/REVIEW_BRIEF.md section 7 for the acceptance tests

- **Done:**
  - **A:** sources, build and tests in the repository.
  - **B1:** bridge description format.
  - **B2:** BR13A described in the format.
  - **v45:** one Super-T definition; flange widths per girder.
- **R0:** review and merge B2 + v45.
- **R1 Geometry engine:** everything geometric, from the bridge description only.
- **R2 Section engine:** Super-T T1–T5 + overrides, open / solid, flared flanges, composite, closed-cell torsion; product library.
- **R3 Model builder:** grillage, bearings, substructure, piles and springs from the description. Members are tagged by role; MIDAS .mct is written out. Replaces the fixed BR13A .mct.
- **R4 Callable library:** solver, loads, combinations, design and reports without the browser. The dashboard becomes a viewer / editor of a bridge file.
- **R5 Standards file and product library:** each value checked once against the licensed Standards.
- **R6 Extraction:** writes the bridge description and the Query Register; decisions in the dashboard.
- **R7 Plank module.**
- **R8 Pilot on a second, different bridge**, with no code change.
- **R9 Agent skills per stage**, with engineer checkpoints.
- **Throughout:** pass/fail tests, the BR13A regression kept green, Assumed values replaced as data arrive.
