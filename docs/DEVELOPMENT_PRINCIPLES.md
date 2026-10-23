# Development principles

These rules apply to every change in this repository, whether a person or an AI agent makes it. Approved 2026-10-23 (master instruction). The rationale is in `DECISIONS.md`.

## 1. Engineering rules

1. **AI assists; deterministic software calculates.**
   - The AI reads documents, proposes values, explains, spots conflicts and drafts reports.
   - Every structural number used in a check comes from versioned, tested code. It never comes from free-text AI reasoning.
2. **Every value is traceable.** Each value carries one tag (Direct, Calculated, Missing-Flagged, Standard-verify, Input-user, Confirmed-Engineer, Assumed, Model). It also carries its source (sheet / view / note), its derivation, or its decision id. See `BRIDGE_DESCRIPTION_FORMAT.md`.
3. **No invented values.**
   - A placeholder is allowed only to let the model run.
   - Every placeholder is tagged **Assumed**, is shown next to its input, and is rolled up in Needs Review.
   - **Missing** values are never accepted.
4. **Overrides keep the original.** When an engineer changes a drawing value, both the original (with its source) and the new value are kept, with the reason. Today the original lives in the decision log; ADR-008 adds an `original` field.
5. **Approval policy** (ADR-005):
   - The AI may accept its own **Calculated** values only.
   - The engineer must accept every **Assumed** or **Model** value and every override of a **Direct** value.
   - The AI never approves its own assumptions.
6. **Bridge-generic code.**
   - No BR13A name, number, file order or node id in engine code.
   - Members are found by role and stable id.
   - BR13A-only rules are listed in `BR13A_SPECIFIC.md` until they are removed.
7. **Standards are data.**
   - Clause values, tables and factors live in a versioned standards file. Each entry has a status: implemented → checked against the licensed Standard → approved.
   - Copyrighted Standard text is not copied into the repository; only values and clause references go in.
   - Licence review is required before any commercial release.
8. **State the approximation.** When a calculation is conservative or simplified, the result says so (for example, separate traffic M/V/T envelopes, unsigned earthquake). The list is kept in `ARCHITECTURE.md` §4.

## 2. Process for each stage

Every stage of the roadmap follows these 10 steps:

1. Restate the objective and the acceptance criteria.
2. Inspect the code and data it touches.
3. Write or update the design note (interfaces, units, ids).
4. Write the tests first, or with the change: unit, regression and benchmark.
5. Implement in small commits on a feature branch.
6. Run the tests. Record the exact command and result.
7. Compare with the BR13A regression snapshot; explain every difference.
8. Update the docs (`CURRENT_STATUS.md`, `DECISIONS.md`, method notes).
9. Report: files, commit, test results, open questions.
10. **Stop for the engineer's review** before the next stage.

## 3. Repository rules

- Work on a feature branch. **Never push to `main` directly**; `main` changes only by reviewed merge.
- Do not overwrite or delete a known-good branch or working feature without a written migration plan.
- **Report only what was executed.** A test is reported as passed only if it was run and passed in this change.
- Tests assert (pass / fail). Printing a value next to its target is a diagnostic, not a test.
- No credentials, tokens, client documents or private drawings in commits. Drawing values in `projects/<bridge>/` are allowed only for bridges the owner has cleared.
- Generated files (`dsg3_ui.js`, `dsg5_ui.js`, `__pycache__`, `dist/*.html`) are not committed.
- Builds are reproducible: the same commit gives the same sha256.
- Units: SI throughout (m, kN, kPa, MPa only where stated in the field catalogue). Coordinates are MGA (true survey), with no arbitrary local origin.

## 4. Definition of done for a module

A module is done when:
- it has a defined interface and units;
- its tests pass (unit + BR13A regression + at least one independent benchmark);
- it does not depend on BR13A names;
- its results carry a run record (`ARCHITECTURE.md` §2);
- its documentation is updated.

## 5. Progress saving and recovery (approved 2026-10-23, ADR-016)

**Purpose:** any session can stop at any time, and the next session resumes from the last verified checkpoint without the owner repeating history.

1. **Save incrementally.** During every substantial task, commit and push the working branch at each checkpoint: a completed step, a passing test, a written document, or before any long run. Do not keep more than about one hour of work only on the local disk.
2. **What a checkpoint contains:**
   - the code / docs;
   - the test results actually executed (command + outcome), recorded in the repository;
   - an updated `docs/CURRENT_STATUS.md`.
3. **Verify the save.** After a push, confirm that `git ls-remote origin <branch>` equals the local `HEAD`. Only then report that something is saved to GitHub. If the push fails, say so and keep the work on the local branch.
4. **End of session:**
   - update `docs/NEXT_SESSION.md` (last verified checkpoint, stage status, next action, open questions, setup commands);
   - update `docs/CURRENT_STATUS.md` and `status/stages.json`, and rebuild the status dashboard (`python3 status/build_status.py`);
   - commit and push them;
   - update the Claude Project memory (`areas/platform-architecture.md`) and the project doc `claude/SOURCE_REPOSITORY.md` with the branch and commit.
5. **Start of session:**
   - read `docs/NEXT_SESSION.md` and `CURRENT_STATUS.md`;
   - `git fetch` and check the branch heads against them;
   - check for uncommitted work;
   - rebuild and run the fast tests before changing anything.
6. **Never discard work.**
   - No `reset --hard`, no force-push, no deleting branches.
   - Unfinished work is committed on its branch with "WIP:" in the message rather than lost.
7. **Long runs:** results of long test runs are written to files in the repository (for example `baseline/BR13A/test_run.md`) and committed, so they survive the session.
