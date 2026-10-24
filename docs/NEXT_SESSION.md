# Next session — resume here

**Last updated:** 2026-10-24 (P0.2, P0.3, P1 done; P2 next).

**Rule:** read this file first, then `CURRENT_STATUS.md`. Then:
1. `git fetch`;
2. compare the branch heads below with the remote;
3. check for uncommitted work;
4. resume from the last verified checkpoint.

If this file and the repository disagree, the repository wins: fix this file. **Working mode:** autonomous (ADR-018). Ask the owner only about safety, validity, licensing or irreversible actions.

## 1. Last verified checkpoint

| Item | Value | Verified by |
|---|---|---|
| Working branch | `p1-geometry` (from `p0.3-standards` @ `ff93af7`); P2 goes on `p2-sections` from it | `git branch -vv` |
| Head | `git log -1 origin/p1-geometry`; must equal the local HEAD | `git ls-remote` |
| Tests (executed 2026-10-24) | schema 17 / 17; format 0.2 47 / 47; standards 28 / 28; geometry 36 / 36; baseline 8 / 8 | the commands in §6 |
| Dashboard build | unchanged since v45 (sha256 `710b259d2c7117d0…`) | no `src` / `base` change |
| Full suite record | `baseline/BR13A/test_run.md` from `2811b27`. A re-run on the P0.2 head was started in the session of 2026-10-24; if no newer record is committed, re-run it | — |

**Branch stack (none merged; the owner controls `main`):** `main` 8a60b74 → `step-b2-br13a` 42dcec7 → `docs/p0-architecture` 7d00263 → `p0.1-baseline` 0d36579 → `p0.2-format` f1fdc7a → `p0.3-standards` ff93af7 → `p1-geometry` → (`p2-sections`).

## 2. Stage status

- **P0, P0.1:** done; awaiting owner review (non-blocking, ADR-018).
- **P0.2 format 0.2:** DONE (ADR-017).
- **P0.3 standards framework:** DONE (ADR-019). **Content is NOT approved:** 63 entries `code-extracted-unverified`.
- **P1 geometry:** DONE (`P1_GEOMETRY_METHOD.md`, ADR-020). **BR13A geometry is PROVISIONAL** (uses the proposed D-34).
- **P2 sections:** next.

## 3. Next actions

1. **P2**, on branch `p2-sections`:
   - read `claude/MEMBER_PROPERTIES_METHOD.md` (project docs) and `src/gdef.js` / `secGeom` (the dashboard's Super-T definition);
   - write a Python section module: Super-T product types + drawing overrides, open / solid zones, flared flange from the P1 flange widths, composite with the deck;
   - check against independent calculations: hand polygon properties (T5), FD torsion `claude/torsion_fd.py` (T6), and the dashboard's own section properties (V5).
2. Refresh the full test record and the status page.
3. If the engineer accepts D-34, record the approval in a new 0.2 revision and rebuild the BR13A geometry without `--allow-proposed`.

## 4. Do not

- Do not mark any standards value `checked` / `approved`. Only the owner or the reviewers they nominate may, with an authorised copy (ADR-009).
- Do not copy clause text from the Standards. Store clause references and the minimum numbers only.
- Do not change dashboard engine code without re-running the baseline (T1 exact).
- Do not merge, force-push or delete branches.

## 5. Open items for the owner (non-blocking)

- **D-3:** girder end region (uB 1.17, uL 3.97 at x = 0.75 m; no solid-end zone defined).
- **BR13A 0.2 migration:**
  - the unit of D-6's original 34950 (probably mm);
  - significance levels for high-impact values.
- **H-2:** plots drawn with NaN coordinates (fix now or later).
- **D-34:** accept the BR13A support-line bearing 44.029166° (from DRG 202012), so the geometry is no longer provisional.

## 6. Setup (cloud workspace)

```bash
git clone https://github.com/Masoud140/pdf2bim-platform.git && cd pdf2bim-platform
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' && git fetch origin && git checkout p1-geometry   # or p2-sections if it exists
./build.sh && sha256sum dist/BR13A_grillage_dashboard.html      # 710b259d2c7117d0...
export NODE_PATH=/opt/npm-tools/node_modules
python3 tests/schema/test_schema.py && python3 tests/schema/test_format_0_2.py && python3 tests/standards/test_standards.py && python3 tests/geometry/test_geometry.py && python3 tests/baseline/test_baseline.py
```
