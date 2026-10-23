# What is still tied to BR13A

This is the input for roadmap steps B to D (bridge description file, library, model generator). Each item below must become data in the bridge description, or a rule that works for any single-span Super-T or plank bridge.

## Model source
- **Frozen MIDAS model:** the analysis model is a frozen BR13A MCT text embedded in the base (`<script id="an_mct_src">`). `SUBM.build()` (src/sub.js) patches it: column subdivision, springs, bearing stiffness, toe supports. Nothing generates a grillage from parameters yet.
- **Section-name matching:** members are recognised by their section names in that MCT:
  - `Pile` → pile/column;
  - `^SB_` → sill beam;
  - `composite` and `^G(\d+)-` → girders;
  - `RIG` → rigid offset;
  - `DUM` → dummy;
  - `TD\d+` → deck strips;
  - `XG` → cross girder.
- **Abutment matching:** abutments are recognised by the group names `AbutA` / `AbutB` (bearing links, toe constraints).
- **Girder order:** bearing links are paired A↔B by their order in the file (link i at A ↔ link i at B = girder i).
- **Deck mesh:** `ldDeck()` matches the dashboard mesh to the MCT nodes by plan position. A mesh change "no longer matches the frozen MCT".

## Values in code
- **Girder depth:** read from the one Super-T definition (`gdDepth()`, v45). It used to be hard-coded at 1.515 m.
- **Pile data** is read from the BR13A takeoff rows (`DATA.LIVE`, `PIR`, `PIO`) by row keys `dia`, `sock`, `rlA`, `rlB`.
- **Hog Calculator section:** since v45 it is "Girder definition", built from the Section designer shape. Strands and bars are the TfNSW T4 standard layout as a placeholder. Before v45 it was the workbook template (1825 Super-T, 34950 / 530 mm).
- **Combos builder:** its register (`const R=[…]`) is scoped. It is exposed by a string replacement in `build_v23.py` (`window.CBX`, with SOo and SCR switched on).
- **Design factors:** `dgFac()` reads the design load factors by regex from the register script text.
- **Earthquake spectrum:** the AS 1170.4 spectral shape table is transcribed in sub5.js (`EQ_CH`). It must be checked against the Standard.

## Placeholders
- All the assumed placeholders sit in state objects: `SUBM`, `SL`, `TM`, `TG`, `WD`, `EQ`, `RX`, `DG.temp`. Their defaults are BR13A choices made so the model runs. They are listed by `rxAssumed()` → Needs Review.

## Structure types
- Super-T only. There is no plank section library, plank grillage pattern or plank design check.
