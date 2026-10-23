# Current status — 2026-10-23

**Stage:** P0 (audit, architecture, verification plan). No code refactor has started.

## Branches

| Branch | Commit | Content | State |
|---|---|---|---|
| `main` | 8a60b74 | Step A (sources, build, tests) + B1 (format) | protected by rule: merge only after review |
| `step-b1-format` | 8a60b74 | same as main | merged |
| `step-b2-br13a` | 42dcec7 | B2 BR13A description, v45 one Super-T definition, review brief | **awaiting review / merge** |
| `docs/p0-architecture` | (this branch) | P0 docs: architecture, principles, verification, decisions, status | awaiting review |

## What works today (BR13A)

- An offline dashboard (v45, about 3.5 MB HTML, reproducible build) runs the complete chain in the browser:
  - takeoff → grillage → integrated substructure → stages → traffic → loads (earth pressure, braking, centrifugal, temperature, gradient, shrinkage / creep, wind, earthquake RSA) → AS 5100.2 combinations → bearing / pile / headstock actions → Super-T AS 5100.5 checks → Hog → Word / Excel / MIDAS exports.
- BR13A is described in the bridge format:
  - 928 tagged values. Catalogue values: Assumed 177, Calculated 92, Direct 70, Standard-verify 62, Model 50, Input-user 24, Missing 10, Confirmed 4.
  - 33 decisions: 32 accepted, 1 superseded.

## Known issues and gaps (ids used in the roadmap)

| Id | Issue | Layer |
|---|---|---|
| B-1 | The dashboard does not read or write the bridge description; it reads its own embedded data | B / H |
| B-2 | No revision / hash in the description; no run records; no "significance"; original value kept only in the log (ADR-008) | B |
| C-1 | No geometry engine on the description; geometry is spread across dashboard JavaScript | C |
| C-2 | The mesh puts girders on offset curves, not straight chords (up to 265 mm at BR13A midspan) | C / E |
| D-1 | Strands and bars are placeholders (TfNSW T4 standard layout); BR13A strand drawings are not in the set | D |
| D-2 | Flared flange widths are not applied to model stiffness or design | D / E |
| E-1 | Design engine: neutral-axis depth 8 % off the worked example, although Mu agrees (VERIFICATION §5) | F |
| E-2 | No model builder: a frozen BR13A MIDAS .mct is patched; members are found by BR13A names and file order | E |
| F-1 | Approximations: separate traffic M/V/T envelopes; unsigned earthquake; pile √(Ml²+Mt²); pedestrian 0; stage roll restraint (ARCHITECTURE §4) | F |
| F-2 | Standards values are constants in code (AS 1170.4 spectral shape transcribed; dynamic factor by regex); no standards file (ADR-009) | F |
| F-3 | Node-line / section-offset level question (MEMBER_PROPERTIES_METHOD §12) unresolved | E |
| G-1 | Tests print instead of asserting; no regression snapshot; no independent MIDAS model of the integrated structure | G |
| A-1 | Extraction (agent spec, Excel takeoff) is not connected to the bridge description | A |
| H-1 | No decision UI; decisions are written by hand / script | H |
| R-1 | 177 Assumed values in BR13A need engineer decisions or data | data |
| X-1 | `schema/__pycache__` was committed (removed on this branch) | repo |

## Next task (proposed, awaiting agreement)

**P0.1 BR13A baseline regression snapshot.** See `ROADMAP.md`.
