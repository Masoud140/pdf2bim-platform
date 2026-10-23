# Project status dashboard

**Open:** double-click `status/index.html`. It is one self-contained file; no server or internet needed.

**What it shows:**
- stage status (roadmap);
- latest commit and whether it is on GitHub;
- the real 3D model screenshot and a link to the application;
- BR13A results with source and verification status;
- test counts by real status (passed / failed / blocked / no assertions);
- risks and the next task.

**How it is built** (`python3 status/build_status.py`): nothing on the page is typed in by hand except `stages.json`. The page is assembled from these sources:

| Source | Content |
|---|---|
| `status/stages.json` | Stage status, risks, next task. Hand-maintained project data; every completed stage names its evidence files, and the build warns if a file is missing |
| `baseline/BR13A/snapshot.json` | Results, run record, consistency checks |
| `baseline/BR13A/test_run.md` | Latest full test run. Marked **OUTDATED** automatically if test or engine files changed since the recorded commit |
| `baseline/BR13A/live_run.txt` | Latest live baseline test |
| `status/model_3d.png` + `.json` | Screenshot of the application's own 3D tab (`node status/capture_model.js`, needs a built `dist/`) |
| git | Branch, commit, GitHub check (`--no-remote` skips the network check) |

**Link to the application:** `dist/BR13A_grillage_dashboard.html` exists only after `./build.sh`; it is not stored in git.

**Rebuild order** (end of each session):

```bash
./build.sh
python3 tools/run_suite.py
node status/capture_model.js
python3 status/build_status.py
```

Commit and push the result, then run the build once more, so the page names the pushed commit.
