# Roadmap — from the BR13A dashboard to a reusable single-span platform

- **A. Done:** sources, reproducible build, tests and notes in one repository.
- **B. Bridge description file and decision log.**
  - **Description file:** one JSON file holds every value with its tag (Direct / Calculated / Assumed / Engineer / Standard), source sheet and status.
  - **Decision log:** every change records who, what, from and to, why, when, and which results went out of date.
  - **First example:** BR13A.
- **C. Callable library.** Split the engines (solver, loads, combinations, design, reports) into a library an agent can call without the browser. The dashboard becomes a viewer of the library.
- **D. Model generator.** Build the grillage and substructure from the description (span, skew, curve, girder count and type, bearings, piles, soil), replacing the frozen MCT.
- **E. Plank module.** Plank section library, grillage pattern (shear keys, transverse stressing) and design checks.
- **F. Agent skills, one per stage.** Extract → describe → queries → model → analyse → combine → design → report. Engineer checkpoints sit between stages, with the Query Register as the gate.
- **G. Pilot on a second bridge.** Preferably a plank bridge, to expose the remaining BR13A-specific rules.
- **Throughout:**
  - turn the tests into pass/fail assertions (hand checks, the ASBD comparison, the MIDAS round trip);
  - keep one reviewed standards-parameters file checked against the licensed Standards.
