# Platform results in the .mct numbering (P4.4)

Description revision 11; load case `SW` = self weight (the only case in the .mct); 10 modes (consistent beam mass, links / springs massless).

Files: `platform_reactions.csv`, `platform_beam_forces.csv`, `platform_modes.csv`, `platform_mode_shapes.csv` (MIDAS-style headers).

Conventions (UNCONFIRMED: expected MIDAS Civil result-table headers; confirm with the first export and correct here):

- reactions: global axes of the .mct; force of the support on the structure (gravity case: FZ > 0)
- beam_forces: element local axes of the .mct (beta = 0); section forces on the +x face at I and J (I = -f_I, J = +f_J)
- part: I-end labels start with 'I' (e.g. I[12]), J-end with 'J'

After the MIDAS run, export the same tables as CSV into a folder as `reactions.csv`, `beam_forces.csv`, `modes.csv`, `mode_shapes.csv` and run `tools/midas_compare.py ... --midas <folder>`.
MIDAS must use the same mass source for the modes (self weight converted to mass, consistent mass) — otherwise periods differ by idealisation (T7).
