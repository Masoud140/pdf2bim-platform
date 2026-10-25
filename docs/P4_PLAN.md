# P4 plan — structural verification (draft for owner review, 2026-10-25)

**Goal (ROADMAP):** trustworthy actions and checks. **Acceptance:** independent MIDAS model and benchmarks within tolerance (T7, T9, T10, T11); standards entries checked by the owner's reviewers.

**Starting point:** P3 gives the integrated model, every P3c load case, the AS 5100.2 combinations and a combined-action schedule (`P3_MODEL_METHOD.md` §9). All factors are unverified standards data; BR13A inputs are largely Assumed; the model is provisional (D-34…D-41).

**Rule:** each sub-stage follows `DEVELOPMENT_PRINCIPLES.md` §2; work proceeds autonomously (ADR-018) except where marked **owner**.

## Sub-stages

| # | Sub-stage | What changes | Acceptance (provisional) | Who |
|---|---|---|---|---|
| P4.1 | **Concurrent traffic actions** | For each governing traffic response, keep the vehicle / lane state (lane layout, vehicle position, direction, lateral shift, patterned UDL spans) instead of only the envelope value; re-apply that state as nodal loads and evaluate every response, so each extreme has its concurrent actions (girder M with V, T; bearing v with tr, lon; pile N with Ml, Mt) | The state reproduces the governing envelope value exactly (1e-9 relative); single-girder closed form; equilibrium T4 for each state | agent |
| P4.2 | **Concurrent combinations** | `combine` returns, for each governing row, the full concurrent response vector (static primitives + the chosen traffic / wind / surcharge states); earthquake kept as ± envelopes until P4.3 | Concurrent vector of the governing response equals the envelope value; schedule shows concurrent columns | agent |
| P4.3 | **Earthquake signs and pile resultants** | Concurrent earthquake actions from the modal covariance (CQC correlation of response pairs) instead of independent envelopes; pile moment resultant from concurrent Ml, Mt (not √ of separate envelopes) | Closed-form 2-dof cases; resultant ≤ the √ bound; documented method choice (ADR) | agent |
| P4.4 | **Independent MIDAS model** (T7, T9, T10) | Engineer imports the .mct (or builds an independent model from the description); platform tool reads MIDAS result tables (CSV) and compares reactions, member actions, periods per case | T7 3 %, T9 5 %, T10 2 % / 3 % or explained | **owner** (MIDAS run); agent (tool, comparison) |
| P4.5 | **Design engine** | Port the Super-T AS 5100.5 checks (flexure, shear, torsion, stresses) to Python, fix E-1 (neutral-axis depth), use the schedule's concurrent actions | T11 on referenced worked examples, intermediate quantities included | agent; worked examples from the owner if available |
| P4.6 | **Standards entries checked** | Owner-nominated reviewers check the inventoried values against authorised copies (`standards/review/`) | Entries marked checked by a named reviewer | **owner** |

## Open items that affect P4 results (owner, non-blocking for the software)

- **M-3 / M-4:** the fixed-abutment restraint (bearing / dowel / restraint-block detail) governs temperature and shrinkage actions, the sill moment and the A-G4 uplift.
- **Earth-pressure fill category** (SOo / SOc), pedestrian load (Missing), flood and collision (not addressed).
- **D-34…D-41, F-5, F-6:** geometry / bearing inputs; until accepted, every P4 BR13A number stays provisional.

## Order

P4.1 → P4.2 → P4.3 (autonomous, BR13A as the regression case), with P4.4 as soon as the owner can run MIDAS; P4.5 after P4.2 (needs concurrent actions); P4.6 in parallel, owner-driven.
