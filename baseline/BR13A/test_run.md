# Test run record — 2026-10-28 (suite on 50fae83; format_0_2 + takeoff fixed post-run)

- Suite run commit: `50fae83a4b9253245ae526a7f1c2ba6207502cf0` (pre-fix)
- Fix commit: adds D-47 + corrects girder_J_factor record source structure in BR13A.bridge.0.2.json
- Dashboard: `dist/BR13A_grillage_dashboard.html`
- Command: `python3 tools/run_suite.py`
- **Post-fix re-run (format 0.2, takeoff import):** 48/48 PASS, 10/10 PASS (both regressions fixed)

**Meaning of the outcome column.** 'prints' scripts show values next to hand/target values and do not assert; 'ran, no JS errors' means only that they completed. It is NOT a pass of an engineering check. 'asserts' scripts report their own PASS/FAIL. 'environment error' = the sandbox blocked an external resource (net::ERR_TUNNEL_CONNECTION_FAILED, e.g. a web font); it is listed but not counted as a software error.

| Script | Command | Type | Exit | Time (s) | JS errors | Outcome |
|---|---|---|---|---|---|---|
| sub_t | `node tests/sub_t.js` | prints | 1 | 2 | - | ERROR (exit 1, js errors None) |
| sl_t | `node tests/sl_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| soil_t | `node tests/soil_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| tm_t | `node tests/tm_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| tg_t | `node tests/tg_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| wd_t | `node tests/wd_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| eq_t | `node tests/eq_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| rx_t | `node tests/rx_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| x_t | `node tests/x_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| gw_t | `node tests/gw_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| dg36_t | `node tests/dg36_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| dgxl_t | `node tests/dgxl_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| dgdoc_t | `node tests/dgdoc_t.js` | prints | 1 | 1 | - | ERROR (exit 1, js errors None) |
| dsg_test | `node tests/engine/dsg_test.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t2 | `node tests/engine/dsg_t2.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t3 | `node tests/engine/dsg_t3.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t4 | `node tests/engine/dsg_t4.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t5 | `node tests/engine/dsg_t5.js` | prints | 0 | 0 | - | ran, no JS errors |
| schema | `python3 tests/schema/test_schema.py` | asserts | 0 | 0 | - | 17 PASS / 0 FAIL |
| format 0.2 | `python3 tests/schema/test_format_0_2.py` | asserts | 1 | 1 | - | 46 PASS / 2 FAIL (exit 1) |
| standards data | `python3 tests/standards/test_standards.py` | asserts | 0 | 1 | - | 30 PASS / 0 FAIL |
| geometry P1 | `python3 tests/geometry/test_geometry.py` | asserts | 0 | 0 | - | 37 PASS / 0 FAIL |
| sections P2 | `python3 tests/sections/test_sections.py` | asserts | 0 | 29 | - | 26 PASS / 0 FAIL |
| solver P3 | `python3 tests/model/test_solver.py` | asserts | 0 | 1 | - | 11 PASS / 0 FAIL |
| model builder P3 | `python3 tests/model/test_builder.py` | asserts | 0 | 70 | - | 17 PASS / 0 FAIL |
| substructure P3b | `python3 tests/model/test_substructure.py` | asserts | 0 | 68 | - | 37 PASS / 0 FAIL |
| loads P3b | `python3 tests/model/test_loads.py` | asserts | 0 | 52 | - | 25 PASS / 0 FAIL |
| mct writer P3b | `python3 tests/model/test_mct.py` | asserts | 1 | 35 | - | 13 PASS / 1 FAIL (exit 1) |
| modes P3b | `python3 tests/model/test_modes.py` | asserts | 0 | 1 | - | 10 PASS / 0 FAIL |
| traffic P3c | `python3 tests/model/test_traffic.py` | asserts | 0 | 38 | - | 20 PASS / 0 FAIL |
| thermal P3c | `python3 tests/model/test_thermal.py` | asserts | 0 | 36 | - | 20 PASS / 0 FAIL |
| horizontal P3c | `python3 tests/model/test_horizontal.py` | asserts | 0 | 35 | - | 22 PASS / 0 FAIL |
| wind P3c | `python3 tests/model/test_wind.py` | asserts | 0 | 33 | - | 14 PASS / 0 FAIL |
| earthquake P3c | `python3 tests/model/test_earthquake.py` | asserts | 0 | 1 | - | 16 PASS / 0 FAIL |
| combinations P3c | `python3 tests/model/test_combinations.py` | asserts | 0 | 34 | - | 35 PASS / 0 FAIL |
| concurrent P4.1-P4.3 | `python3 tests/model/test_concurrent.py` | asserts | 0 | 87 | - | 17 PASS / 0 FAIL |
| MIDAS compare P4.4 | `python3 tests/model/test_midas_compare.py` | asserts | 0 | 33 | - | 10 PASS / 0 FAIL |
| run records P5.1 | `python3 tests/schema/test_runrecord.py` | asserts | 0 | 3 | - | 12 PASS / 0 FAIL |
| query register P5.2 | `python3 tests/schema/test_register.py` | asserts | 0 | 0 | - | 8 PASS / 0 FAIL |
| takeoff import P5.3 | `python3 tests/schema/test_takeoff.py` | asserts | 1 | 1 | - | 9 PASS / 1 FAIL (exit 1) |
| decisions P5.4 | `python3 tests/schema/test_accept.py` | asserts | 0 | 3 | - | 11 PASS / 0 FAIL |
| flexure P4.5 | `python3 tests/design/test_flexure.py` | asserts | 0 | 0 | - | 13 PASS / 0 FAIL |
| SLS + N-M P4.5 | `python3 tests/design/test_sls_nm.py` | asserts | 0 | 1 | - | 13 PASS / 0 FAIL |
| shear P4.5 | `python3 tests/design/test_shear.py` | asserts | 0 | 0 | - | 11 PASS / 0 FAIL |
| design benchmark P4.5 | `python3 tests/design/test_benchmark.py` | asserts | 0 | 1 | - | 4 PASS / 0 FAIL |
| design stations P4.5 | `python3 tests/design/test_stations.py` | asserts | 0 | 97 | - | 11 PASS / 0 FAIL |
| prestress losses P4.5 | `python3 tests/design/test_prestress.py` | asserts | 0 | 2 | - | 13 PASS / 0 FAIL |
| prestress inputs P4.5 | `python3 tests/design/test_prestress_inputs.py` | asserts | 0 | 65 | - | 12 PASS / 0 FAIL |
| girder flexure P4.5 | `python3 tests/design/test_girder_flexure.py` | asserts | 0 | 33 | - | 8 PASS / 0 FAIL |
| girder SLS P4.5 | `python3 tests/design/test_girder_sls.py` | asserts | 1 | 49 | - | 6 PASS / 0 FAIL (exit 1) |
| girder checks P4.5 | `python3 tests/design/test_girder_checks.py` | asserts | 1 | 36 | - | 3 PASS / 0 FAIL (exit 1) |
| girder shear P4.5 | `python3 tests/design/test_girder_shear.py` | asserts | 1 | 0 | - | 0 PASS / 0 FAIL (exit 1) |
| baseline (fast) | `python3 tests/baseline/test_baseline.py` | asserts | 0 | 0 | - | 8 PASS / 0 FAIL |

## Last output lines

### sub_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/sub_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### sl_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/sl_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### soil_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/soil_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### tm_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/tm_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### tg_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/tg_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### wd_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/wd_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### eq_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/eq_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### rx_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/rx_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### x_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/x_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### gw_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/gw_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### dg36_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/dg36_t.js:6:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### dgxl_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/dgxl_t.js:8:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### dgdoc_t

```
page.goto: net::ERR_FILE_NOT_FOUND at file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html
Call log:
[2m  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tests/dgdoc_t.js:7:11 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}

Node.js v22.23.4
```

### dsg_test

```
Eref 34800 A 2769809 yc 990.28 I 2.09331e+12
Eref 37400 A 2577255 yc 990.28 I 1.94778e+12
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
```

### dsg_t2

```
Eref 37400 A 2577255 yc 990.28 I 1.94778e+12
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
gamma 0.845 dn 220.96 kuo 0.09347 Mu 68970.7 tendon 1762.8/1766.1/1769.4/1772.8/1769.3
gamma 0.8075 dn 229.71 kuo 0.09717 Mu 68778.7 tendon 1757.4/1760.6/1763.8/1767.0/1763.7
gamma 0.775 dn 237.97 kuo 0.10067 Mu 68610.4 tendon 1752.7/1755.8/1758.9/1762.0/1758.8
gamma 0.7 dn 259.90 kuo 0.10994 Mu 68214.6 tendon 1741.7/1744.5/1747.3/1750.2/1747.2
target   dn 240.90 kuo 0.10190 Mu 68978.9 ; DH73/74 = 1759.56 / 1763.72
```

### dsg_t3

```
Eref 34800 A 2769809 yc 990.28 I 2.09331e+12
Eref 37400 A 2577255 yc 990.28 I 1.94778e+12
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
M=15000: top -3.709 bot -8.915 tendons 865.4/862.9/859.3/856.8/855.3 | target top -3.709 bot -8.915 tendons 865.4..856.8
M=0    : top 3.387 bot -19.772 tendons 819.6/815.1/809.6/805.0/805.6
Mdec 27318 kNm; allowable Ms 39591 (bar incr 200.0 , tendon incr 186.3 ) | target Ms 39590.6 (bar 200.0, tendon 186.3), dna 823.2
neutral axis at Ms (cracked): 823.2 mm
```

### dsg_t4

```
Eref 34800 A 2769809 yc 990.28 I 2.09331e+12
Eref 37400 A 2577255 yc 990.28 I 1.94778e+12
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
code gamma: dn 220.7 kuo 0.0933 Mu 68886 phiMu 55109 tendons 1760.5/1763.8/1767.0/1770.3/1766.9
target    : dn 240.9 kuo 0.1019 Mu 68979 phiMu 55183 tendons 1759.6..1763.7
Mcr 34002 kNm, 1.2 Mcr 40802  | target Muo.min 40802
```

### dsg_t5

```
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
general ULS N=0: dn 220.7 Mu 68886  (ulsBend gave 220.7 / 68886)
hogging Mu -13683 dn 301
d (tension resultant) 2208.0 dv 1987.2 Ast 4423 Apt 17160 spo 904.2 Act 952555
ex -1.4116e-4 theta 28.01 kv 0.5074 phiVuc 1694.1 phiVus 10085.7 phiVumax 6185.8 phiTus 8840.7 phiTcr 3613.8 AsvMin/s 387.0 AswMin/s 916.8
util crush 0.686 shear 0.360 tors 0.158 long 0.057
target: dv 2124.5 ex -1.6152e-4 theta 27.87 kv 0.5279 phiVuc 1884.2 phiVus 10853.3 phiVumax 5931.9 phiTus(at loads) 1400 phiTcr 3332.3 AsvMin 387.0 AswMin 916.8 | util crush 0.705 shear 0.388 tors 0.245 long 0.993
```

### schema

```
PASS rejects: Missing-Flagged marked accepted
PASS rejects: Input-user without a decision id
PASS rejects: bare number instead of a tagged value
PASS rejects: unknown field
PASS rejects: wrong unit
PASS rejects: enum outside the list
PASS rejects: custom item without a source (Direct)
PASS rejects: table row without a tag
PASS project file valid: projects/BR13A/BR13A.bridge.json
PASS project decision log valid: projects/BR13A/BR13A.decisions.jsonl
PASS rejects: overruling a Direct value without evidence
PASS rejects: accepted decision without approver
```

### format 0.2

```
PASS accepts: superseding OV-1 by OV-2 (append) and marking OV-1 superseded
PASS BR13A 0.1 file still valid under the 0.1 schema
PASS BR13A 0.1 file unchanged by P0.2 (same as at P0.1 commit 0d36579)
FAIL BR13A 0.2 file valid (schema + rules)  [[<ValidationError: "Additional properties are not allowed ('replace_with' was unexpected)">]['hash: value does not match the canonical content (document changed after stamping, or not stamped)', 'analysis.grillage.rows[4]: R3: record source does not belong to the current entry original']]
PASS BR13A round trip: all 928 records of the 0.1 file keep value / unit / tag / status
FAIL BR13A: records added after migration (95) all carry a decision id, and none was accepted by the agent (proposed, or accepted by a named person)  [['analysis.grillage.rows[4]']]
PASS BR13A migration: only the D-6 girder lengths get reconstructed originals (key matches the record path exactly)
PASS BR13A: reconstructed originals keep unit = null (not recorded in 0.1, not guessed)
PASS BR13A: no significance invented
PASS migration refuses a non-0.1 input

46 passed, 2 failed
```

### standards data

```
PASS rejects: approved without authorised source
PASS rejects: approved by an AI agent
PASS rejects: approved without edition
PASS rejects: approved without amendment
PASS rejects: checked without reviewer
PASS rejects: unknown status
PASS rejects: duplicate id
PASS extractor re-run keeps the review of an unchanged value
PASS extractor re-run resets the status when the code value differs from the reviewed one
PASS committed data files equal a fresh extraction (inventory not edited by hand)

30 passed, 0 failed
```

### geometry P1

```
PASS BR13A: alignment misclosure at SC, CS, ST < 5 mm (method §5)
PASS BR13A: control line at support A within 1 mm of the documented MCT base point (independent value)
PASS BR13A: support bearing 44.029166° is within 0.01° of 34.5° from the chord normal (skew D-4)
PASS BR13A: every bearing centre lies on its girder line offset (to 1e-6 m)
PASS BR13A vs dashboard model: bearing centres within 35 mm (explained difference F-4: frozen mesh nodes are not on the straight support line)
PASS BR13A vs dashboard model: G2 (closest to the control line) bearing centres within 2 mm
PASS BR13A: straight chords sit about 0.265 m inside the girder-line curve at midspan (known gap C-2 confirmed)
PASS BR13A vs dashboard gwWidth: deck width per girder at all 44 stations within 3 mm (independent implementation)
PASS BR13A: inner girder flange width grows from A to B (non-parallel chords between parallel skew lines on a curve)
PASS engine code contains no BR13A constants

37 passed, 0 failed
```

### sections P2

```
PASS BR13A: one definition used — ttf 90 from the drawing, not the library 75
PASS BR13A: girder-alone section at G2 midspan equals the dashboard one definition within 0.5 % (W varies 2280 -> 2283)
PASS BR13A G2 midspan composite vs the frozen model's G2-M_composite (V5): A, I within 1 %, J within 2 %
PASS BR13A G3 midspan composite vs the frozen model's G3-M_composite (V5): A, I within 1 %, J within 2 %
PASS BR13A edge girders vs the frozen model differ in the direction of the flare (model has none, gap D-2): G1 smaller, G4 larger at midspan
PASS BR13A: edge-girder flare enters the section (G4 composite area at midspan > at the ends by > 5 %)
PASS BR13A: solid end zones from D-38 (accepted) placed at 0–2.0 m from each girder end
PASS BR13A: solid end block — girder A > open girder, J much larger (solid St-Venant, not thin-walled)
PASS BR13A: solid end composite vs the frozen model's G2-E_composite (V5): A, I within 2 %, J within 5 %
PASS BR13A: closed-cell composite J ≫ girder-alone J (> 20x)

26 passed, 0 failed
```

### solver P3

```
PASS SS beam: midspan deflection 5wL⁴/384EI
PASS SS beam: midspan moment wL²/8 (end force of the element starting at midspan)
PASS SS beam: equilibrium residual < 1e-9 of the load
PASS cantilever (along Y), tip load: PL³/3EI and root moment PL
PASS Timoshenko cantilever: PL³/3EI + PL/(G·As)
PASS ground spring: u = F/k and spring force balances the load
PASS zero-length elastic link: u = F/k
PASS unsupported structure is refused (mechanism), not solved
PASS BR13A integrated model (2730 dof, links, springs): displacements equal the dashboard solver to 1e-8 relative (V5)
PASS BR13A integrated model: equilibrium residual < 1e-6 of the self weight

11 passed, 0 failed
```

### model builder P3

```
PASS only girders and cross girders carry weight (deck strips 0: deck is inside the composite girders)
PASS 8 bearings (4 girders x 2 supports), each on its girder's bearing-centre node
PASS transverse spacing within 1 % of the target (uniform stations between the skewed deck ends)
PASS solid-zone boundaries are nodes on every girder (no mesh quantisation)
PASS cross girders form a continuous line across the deck on each support line
PASS web lines at the dashboard web offset (web centreline at the girder top) 0.4718 m
PASS vs frozen: total self weight within 2 %
PASS vs frozen: every bearing reaction within 15 % (explained model differences)
PASS vs frozen: midspan deflection of every girder within 5 %
PASS both models carry the most load at the obtuse corners (A-G1, B-G4): skew behaviour reproduced

17 passed, 0 failed
```

### substructure P3b

```
PASS sill centroid line = pile-head (soffit) RL + depth / 2 at every pile (within 1 mm)
PASS bearing links: local x vertical (seat -> bearing top), local z along the girder chord A -> B
PASS bearing links: seat at the seat RL, top at the girder soffit (girder line node - D)
PASS r14: geometry check flags the seat-to-soffit gap that disagrees with the Assumed bearing height (F-6)
PASS current revision (F-6 resolved, RL X = top of bearing): 8 top-of-bearing checks, all below the soffit  [[125, 119, 100, 109, 118, 121, 110, 127]]
PASS inputs record keeps the tags (rock_kh and bearing plan size are Assumed)  [{'Assumed'}]
PASS pile head lateral stiffness (rock springs only) within 3 % of the Hetenyi hand value (provisional tolerance)  [2731 vs 2700]
PASS Hetenyi hand formula: column length 0 gives k / (2 beta) (closed form)
PASS no rock / soil stiffness: the model is refused as a mechanism (not solved)
PASS vs frozen integrated model: bearing Rz within 10 %, pile toe Rz within 5 %, midspan uz within 1 mm (recorded run)

37 passed, 0 failed
```

### loads P3b

```
PASS plan resultant of the nodal loads within 5 mm of the resultant of the load points  [1.42 mm]
PASS load points moved onto the node hull: at most 1 mm  [1 points, 0.073 mm]
PASS SDL on the integrated model: pile-toe reactions = SDL total; residual < 1e-6
PASS SDL on the integrated model: bearing forces = SDL total
PASS solving SDL does not apply self weight (gravity off) and leaves the model's own loads untouched
PASS missing surfacing thickness is refused with the field name
PASS a barrier outside the deck is refused (no grillage there), not silently dropped
PASS vs dashboard: SDL total within 0.5 %  [897.2 vs 894.5]
PASS vs dashboard, distribution only (P3b loads on the frozen model): every bearing within 10 %
PASS vs dashboard: pile toes within 10 %, midspan within 0.6 mm (recorded run)

25 passed, 0 failed
```

### mct writer P3b

```
PASS nodal loads are not written (no documented *CONLOAD syntax) and the report says so
FAIL dashboard parser ran  [Expecting value: line 1 column 1 (char 0); -platform/dist/BR13A_grillage_dashboard.html", waiting until "load"[22m

    at /home/claude/pdf2bim-platform/tools/check_mct_dashboard.js:12:40 {
  log: [
    '  - navigating to "file:///home/claude/pdf2bim-platform/dist/BR13A_grillage_dashboard.html", waiting until "load"'
  ],
  name: 'Error'
}
]

13 passed, 1 failed
```

### modes P3b

```
PASS simply supported beam: f1 and f2 = (n pi)^2 / (2 pi L^2) sqrt(EI / m) within 1e-6  [4.233634 vs 4.233634; 16.934544 vs 16.934537]
PASS simply supported beam: the two bending planes give equal frequencies (Iy = Iz)
PASS cantilever: f1 = 1.8751^2 / (2 pi L^2) sqrt(EI / m) within 1e-6  [1.508219 vs 1.508219]
PASS spring + lumped mass: w = sqrt(k / m); effective mass 1 in X  [40.000000]
PASS 3-dof chain: effective mass fractions in X sum to 1 over all modes  [1.000000000000]
PASS unsupported structure: modal analysis refused (mechanism), not solved
PASS BR13A frozen model: Python periods equal the dashboard's AN.modal to 1e-6 (8 modes, same mass)  [4.5e-08]
PASS BR13A frozen model: horizontal effective masses equal the dashboard's to 1e-3  [6.0e-06]
PASS vs frozen: main vertical mode within 3 %, main horizontal modes within 10 % (recorded run, V5 — not T7)  [X -8.0 %, Y -5.4 %, Z +0.6 %]
PASS vs frozen: total translational mass within 1 % (same mass rules)

10 passed, 0 failed
```

### traffic P3c

```
PASS lane factors: the last factor repeats for more lanes
PASS BR13A: 2 lanes of 3.2 m on the 8.4 m carriageway; sweep has 21 positions (0.1 m)  [2, 21]
PASS BR13A: the sweep envelope contains the left-packed layout (every response, both signs)
PASS BR13A: results carry the UNVERIFIED standards label and list the traffic entries used
PASS BR13A: bearing traffic reactions are compressive maxima (max > 0) and M1600 > S1600 at every bearing
PASS BR13A: the result carries the model's provisional list (empty: D-39 ... D-41 accepted, ADR-040)
PASS no traffic model switched on: refused with the field name
PASS engine check: with the dashboard's distribution rule the P3c engine reproduces the dashboard (girder M 0.1 %, bearings 1 %)
PASS H-5: without the one-node bearing lines the dashboard rule agrees with the P3c triangulation (bearings within 1 %)
PASS P3c on the P3b model vs the dashboard (sweep): girder max M within 10 % (recorded run)  [G1 -2.2 %, G2 +1.4 %, G3 +0.5 %, G4 +5.6 %]

20 passed, 0 failed
```

### thermal P3c

```
PASS BR13A G1 composite: exact band integration equals a 1 mm brute-force fibre integration (1e-6)  [1.012895e-04 vs 1.012895e-04]
PASS BR13A: every imposed-strain case is self-equilibrated (toe reactions and spring forces sum to zero)  [TU+ 2.1e-06, TU- 1.3e-06, SCR 2.6e-06, TGP 8.8e-06, TGN 4.3e-06]
PASS TU+: relative movement B - A along each girder chord within 5 % of free expansion alpha dT L  [1.005, 1.000, 0.997, 0.998]
PASS TGP (top hotter): every girder cambers UPWARD at midspan, peak within 10 % of the dashboard's (13.9 mm)  [13.63, 13.51, 13.61, 13.70 mm vs 13.88]
PASS TGP imposition is pure bending + axial on every girder element: K u0 has no end shear (|V| L / |M| < 1e-9)  [3.3e-16]
PASS missing T_max is refused with the item name
PASS a gradient profile with one point is refused
PASS results carry the model's provisional list (empty: decisions accepted, ADR-040)
PASS isolation: P3c imposition on the dashboard's frozen model reproduces all five dashboard cases (bearing forces to 1e-5 kN)  [3.4e-07]
PASS gradient: P3c free strain / curvature of G1 within 10 % of the dashboard's design section (different deck width)

20 passed, 0 failed
```

### horizontal P3c

```
PASS braking toward B: every force along the local alignment tangent, increasing chainage; BRKm = -BRKp
PASS curvature: arc -> its k; spiral linear in s; tangent 0
PASS centrifugal: F = W V^2 / (g R) with W = 24 wheels of the M1600 entry and the smallest radius under the deck  [101.972 kN, R 400.0 m]
PASS centrifugal outward: on this left-hand curve every force points to the right of the direction of travel
PASS every horizontal case in equilibrium on the integrated model (residual < 1e-6 of the load)
PASS unknown earth-pressure coefficient kind refused
PASS no deck nodes inside the carriageway: refused
PASS results carry the model's provisional list (empty: D-34 ... D-46 accepted, ADR-040) and the UNVERIFIED label (M1600 weight)
PASS vs dashboard: with the dashboard's retained height every load total equals the dashboard's (0.3 kN)
PASS vs dashboard: retained height calculated from the levels within 5 % of the dashboard's built-up height

22 passed, 0 failed
```

### wind P3c

```
PASS WT nodal moments = lever x force at every node (resultant at the middle of the exposed depth)
PASS WT+ acts toward +offset (normal to the alignment at each node); WT- is its reverse
PASS WVU+: total uplift = wV x mean line length and resultant exactly at the windward eccentricity (1e-9)  [251.685 kN at -2.0000 (target -2.0000)]
PASS WVU-: total uplift = wV x mean line length and resultant exactly at the windward eccentricity (1e-9)  [251.685 kN at 2.6000 (target 2.6000)]
PASS WVD = -WVU (downward), mirrored cases equal in magnitude
PASS SLS and with-traffic scale factors = (V / V_uls)^2
PASS equilibrium on the integrated model (WVU+): bearing forces = -uplift (1e-6 relative)
PASS missing wind item refused with its name
PASS lever datum other than node / slab_top refused
PASS vs dashboard: horizontal totals equal (0.05 kN); vertical totals within 1 % (H-7: the dashboard's are off by ±0.9 %)

14 passed, 0 failed
```

### earthquake P3c

```
PASS P4.3 covariance: C_ii = R_i^2 (modes + missing mass); concurrent c_i = sign R_i and |c_j| <= R_j (Cauchy-Schwarz), 1- and 2-mode cases
PASS P4.3 covariance: cross term = sum_kl rho_kl R_ki R_lj + r_i r_j (closed form, 2 modes)  [1.861e+04 vs 1.861e+04]
PASS unknown site class refused with the list of classes
PASS missing kp refused
PASS vertical = True adds the V direction and EQ-V
PASS results carry the UNVERIFIED label (Ch table from the standards data)
PASS engine check: periods equal the dashboard's on its model and mass (1e-6)
PASS engine check: bearing forces and pile moments equal the dashboard's eqRun (1e-5 relative)
PASS H-3: with the static mass (deck strips massless) the frozen-model pile moments fall (ratio < 1)
PASS P3c on the P3b model vs the dashboard: pile moments within 20 % (EQ-L, EQ-T; recorded run)

16 passed, 0 failed
```

### combinations P3c

```
PASS schedule: girder sagging max / hogging min with the chainage of the governing end; |V|, |T| the larger of max / min
PASS schedule: bearing extremes, pile |Ml| and N, sill My / |Vz| with positions; uplift when a minimum v < 0
PASS engine check: generated rows equal the dashboard's genAll rows for all 9 recorded sets (SHA-256, count, cap)
PASS engine check: combining the dashboard's primitives reproduces rxCombine exactly (envelopes 0 difference, same governing rows)
PASS platform default: actions without an analysed case are reported as not combined (pedestrian, flood, collision)
PASS P3c vs dashboard bearings (V5, recorded): every bearing matched within 0.1 m; ULS max v within a factor 1.7 (traffic findings H-4, H-5)
PASS P3c vs dashboard piles (V5, recorded): ULS |Ml| within 10 %, |Mt| within 20 %
PASS P3c vs dashboard girders (V5, recorded): ULS sagging M within 15 % (G4 above: traffic sweep H-4)
PASS P3c vs dashboard sills (V5, recorded): shears |Vz| within 45 %; fixed-abutment |My| lower in P3c (restraint couple, M-3)
PASS schedule record: every governing row of the bearings is listed; uplift list matches the bearing minima; run record carries the input hash

35 passed, 0 failed
```

### concurrent P4.1-P4.3

```
PASS P4.2 concurrent row: a 'parts' term uses the whole governing part (negative factor picks the smaller part for the max)
PASS P4.3 concurrent row with earthquake terms: value = envelope, admissible, no flag (most probable concurrent values)
PASS P4.3 ellipse resultant: max |s0 + x| over the Minkowski sum of the direction ellipses = brute force (1e-4)  [15.45000 vs 15.45000]
PASS P4.3 ellipse resultant: refused (None) for a row with a non-earthquake envelope term
PASS BR13A (M1600, S1600; 13 responses incl. a bearing, max and min): the rebuilt state reproduces the envelope (1e-9)  [1.1e-15]
PASS BR13A: concurrent responses within their own envelopes (1e-9 relative)  [1.1e-15]
PASS BR13A: equilibrium of each state — total bearing force = load on the deck (1e-6, T4)  [8.8e-09]
PASS record (tools/concurrent_traffic.py): each state reproduces its extreme; concurrent V, T within the section envelopes; concurrent pile resultant <= the separate-envelope bound
PASS record (tools/combined_actions.py): every concurrent item reproduces its envelope value (1e-9); earthquake-governed items flagged  [52 items]
PASS record: pile concurrent items no longer flagged; ellipse resultant <= sqrt bound and >= every earthquake-row concurrent resultant (1e-5: angle grid)

17 passed, 0 failed
```

### MIDAS compare P4.4

```
PASS platform tables: total vertical reaction = model self weight (1e-6)  [8488.0 kN]
PASS round trip through MIDAS-style CSV: every reaction, member end force and paired period identical, pass  [888 reaction / 8352 force values]
PASS a reaction 5 % off is caught (outside the 2 % tolerance), comparison fails
PASS a member moment 5 % off is caught
PASS MAC pairing: reordered MIDAS modes (one with flipped sign) are paired to the right platform modes, periods identical
PASS a mode missing in MIDAS is reported unpaired (a finding, not a pass by order)
PASS a paired period 5 % off is outside the 3 % tolerance
PASS without MIDAS mode shapes nothing is paired; periods listed by order only, not assessed
PASS unknown headers stop the reader, naming the headers found and the unconfirmed column map
PASS numbering guard: a sidecar whose node / element sets differ from the model is refused

10 passed, 0 failed
```

### run records P5.1

```
]
PASS a decision affecting the output's layers makes it stale, naming the decision  [r15 D-99 affects ['design.supert']]
PASS an output whose layers the decision does not affect stays current (reason recorded)
PASS a revision not explained by a decision makes every later-revision output stale  [revision r15: no history copy, change unknown; revision r16: not explained by a decision ('hand edit')]
PASS a changed description without a later revision number is stale
PASS changed standards data makes the output stale
PASS an output without a run record is 'unknown'
PASS an older engine commit is reported as engine changed (state unaffected)
PASS every tool layer set uses decision 'affects' values of the decision schema
PASS tools/stale.py lists the example project's outputs with a state each  [1 current, 4 stale, 14 without a run record.]

12 passed, 0 failed
```

### query register P5.2

```
PASS counts equal the description's: missing = Missing-Flagged, assumed = Assumed, standard = Standard-verify, proposed = values with status proposed  [{'missing': 51, 'assumed': 222, 'standard': 64, 'proposed': 0}]
PASS every item has a path, a 'needed from', affects from the decision schema and outputs from the run-record layers
PASS a proposed record (D-42 loss inputs) carries its decision, reason, affects and the outputs it touches (girder checks, not geometry)  [29 rows]
PASS no item without an open category (Direct / Calculated accepted values are not listed)
PASS deterministic: built twice, identical
PASS HTML is standalone (no external script or stylesheet) and holds every item
PASS Markdown lists every item once per category
PASS tools/query_register.py writes the register equal to build() (JSON items)

8 passed, 0 failed
```

### takeoff import P5.3

```
PASS the same value found on the drawing for an Assumed field: tag upgrade proposal (Assumed -> Direct)
PASS refused: Direct without source ref, Calculated without derivation, Missing with a value, unknown Data Source  [Direct value without a source ref; Calculated value without its derivation in Notes; Missing — Flagged with a value; unknown Data Source 'guess']
PASS Missing — Flagged ("NOT FOUND") where the description has a Direct value: a query
PASS a unit different from the description's is refused (no silent conversion)
PASS an unknown path is listed as a new path for the engineer, not written
PASS a workbook without the Values sheet is refused, naming its sheets
FAIL --apply: the override is proposed through propose_override (next revision, decision D-98 proposed); the current value is unchanged  [ schema: Additional properties are not allowed ('replace_with' was unexpected) at analysis/grillage/rows/4/original/source
  schema: 'replace_with' is a required property at analysis/grillage/rows/4

]

9 passed, 1 failed
```

### decisions P5.4

```
PASS the girder-check record (layers incl. design.supert) is now stale, the geometry record is not  [r15 D-42 affects ['design.supert']]
PASS the Query Register drops the accepted proposals (D-42 rows no longer 'proposed')
PASS a decision already accepted cannot be decided again
PASS accept D-34 (override proposal): the override becomes current (value, tag), approval recorded, rules pass  [/tmp/tmp2f3641ul/BR13A.bridge.0.2.json: revision 16: D-34 accepted by Test Engineer (2 override(s), 0 record(s)); previous kept at ../../../tmp/tmp2f3641ul/history/BR13A.bridge.0.2.r15.json
]
PASS reject D-39: approval rejected, current value unchanged, log entry rejected  [/tmp/tmp2f3641ul/BR13A.bridge.0.2.json: revision 17: D-39 rejected by Test Engineer (0 override(s), 8 record(s)); previous kept at ../../../tmp/tmp2f3641ul/history/BR13A.bridge.0.2.r16.json
]
PASS register after the decisions: no item proposed under D-34 / D-39 / D-42
PASS history keeps every previous revision
PASS decision review page: lists the proposed decisions with their values and accept / reject commands; decided ones drop out  [10 -> 7]

11 passed, 0 failed
```

### flexure P4.5

```
PASS T section, block within the flange: gamma from the top strip, alpha2 from the flange concrete (1e-9)
PASS polygon strips: a rectangle gives b x H exactly and starts at its top depth
PASS strand curve (Mattock form, coefficients from the standards data), capped at fpb; elastic-plastic option
PASS refusal: a section without concrete strips; a section without steel
PASS port = dashboard engine on its worked-example section: dn, kuo, Mu, phi (1e-9)  [dn 220.958, Mu 68970.7]
PASS port = dashboard engine: every bar and tendon stress (1e-9 relative)
PASS port = dashboard engine with its options (compression bars ignored; gamma override)
PASS port = dashboard engine: transformed elastic properties (A, yc, I)
PASS port = dashboard engine: strand curve at 4 strains
INFO E-1: worked-example targets dn 240.9, kuo 0.1019, Mu 68979 vs port dn 221.0 (-8.3%), kuo 0.0935, Mu 68971 (-0.01%)

13 passed, 0 failed
```

### SLS + N-M P4.5

```
PASS N-M at N = 0 (compression at the top, M about the top) = the ULS bending result (dn, Mu; 1e-6)  [dn 85.676 vs 85.676, M 2160.2 vs 2160.2]
PASS N-M symmetric section: hogging capacity = - sagging capacity about mid-depth (1e-9)
PASS N-M tension point: every bar at fsy, phi = phi_tension_point; curve has 92 points
PASS N-M phi: phi_compression at and above the balanced load, between it and the bending phi below (linear in N)
PASS N-M at a given axial force: the state found carries that force (1e-6 relative)
PASS N-M beyond the squash load / tension capacity: None
PASS port = dashboard engine: SLS top / bottom stresses at 15 000 kN m (uncracked, cracked) and 40 000 kN m cracked (1e-6 MPa)
PASS prestress state: each tendon at its effective stress at N = M = 0 (solver tolerance: 1e-3 MPa), prestrain = the dashboard's (1e-9)
PASS port = dashboard engine: N-M curves, both faces (92 points: N, M, phi; balanced load; 1e-9)
PASS port = dashboard engine: state at N = -3000 kN (dn, M; 1e-9)

13 passed, 0 failed
```

### shear P4.5

```
PASS hand chain: Teq, Veff, ex, theta, kv (min. steel provided), Vuc, Vus (1e-12 relative)  [ex 1.040e-03, theta 36.28, Vuc 413 kN, Vus 858 kN]
PASS utilisations: uV = Veff / (phi (Vuc + Vus)), uCr = Veff / (phi Vu,max), u = max of the four
PASS ex < 0 branch: concrete tension-side term added to the denominator, then the lower clamp
PASS ex upper clamp
PASS below minimum shear steel: kv x c / (d + kdg dv); no ties and T > 0 -> uT infinite
PASS torsion steel is taken out of the shear steel: Vus falls as T rises (same V, M, N)
PASS more stirrups -> lower uV; larger T -> higher uT and Veff
PASS no torsion cell (Ao = 0): T = 0 -> uT 0 and a finite uL (dashboard: NaN, H-9); T > 0 -> uT and uL infinite
PASS port = dashboard engine: every output of shear() on 180 cases (5 section variants x 36 action sets; 1e-9)  [[]]
PASS port = dashboard engine: V-M curve (41 points, 1e-9)

11 passed, 0 failed
```

### design benchmark P4.5

```
INFO differs from the spreadsheet (documented in the dashboard): th 28.012 vs 27.87 (+0.5%)
INFO differs from the spreadsheet (documented in the dashboard): kv 0.50745 vs 0.5279 (-3.9%)
INFO differs from the spreadsheet (documented in the dashboard): phiVuc 1694.1 vs 1884 (-10.1%)
INFO differs from the spreadsheet (documented in the dashboard): phiVus 10086 vs 10853 (-7.1%)
INFO differs from the spreadsheet (documented in the dashboard): phiVumax 6185.8 vs 5932 (+4.3%)
INFO differs from the spreadsheet (documented in the dashboard): phiTcr 3613.8 vs 3332 (+8.5%)
INFO differs from the spreadsheet (documented in the dashboard): uCr 0.68596 vs 0.705 (-2.7%)
INFO differs from the spreadsheet (documented in the dashboard): uV 0.36021 vs 0.388 (-7.2%)
INFO differs from the spreadsheet (documented in the dashboard): uT 0.15836 vs 0.245 (-35.4%)
INFO differs from the spreadsheet (documented in the dashboard): uL 0.057308 vs 0.993 (-94.2%)

4 passed, 0 failed
```

### design stations P4.5

```
PASS solid-end station (inside the end-A zone): solid outline; strip properties = the P2 solid composite (2e-4)
PASS strands: every 'on' strand at depth Dtot - y (y from the soffit), area from the strand material
PASS bars: area = number x pi d^2 / 4 at depth Dtot - y; fsy, Es from the reinforcement material
PASS debonding: a strand debonded 3 m from end A is absent at the end A station, present at midspan; an 'off' strand is absent everywhere
PASS BR13A missing inputs reported: strand fpb, effective prestress (fitments, deck bars supplied by D-43 / D-44)  [['materials.strand.fpb', 'effective prestress (time-dependent losses are not in the platform yet)']]
PASS design checks refuse a station without effective prestress / fpb (no guessed values)
PASS station not built in P2 refused with the nearest station
PASS readiness: one entry per girder with strands, bars and the missing list
PASS r14: provisional inputs carried (proposed decisions used)
PASS current revision: no proposed decision used

11 passed, 0 failed
```

### prestress losses P4.5

```
PASS port = dashboard Hog engine, simple_nodeck: stations, labels, midspan hog and strand forces at every time, transfer forces (1e-9)  [hog 8.5e-14 mm, P 2.8e-14 kN]
PASS port = dashboard Hog engine, detailed: stations, labels, midspan hog and strand forces at every time, transfer forces (1e-9)  [hog 7.1e-14 mm, P 5.7e-14 kN]
PASS elastic shortening, concentric strand: Pr = P0 / (1 + n Ap / A) at midspan (1e-9)  [183.9248 vs 183.9248 kN]
PASS transmission: strand force zero at the girder end, full beyond the transmission length lt db
PASS no shrinkage, creep or relaxation: no time-dependent loss (simplified)
PASS each of shrinkage, creep, relaxation alone reduces the force  [{'sh': 11.67, 'cr': 0.59, 'rl': 1.63}]
PASS relaxation alone: loss = P (R(t) - R(0)) / 100 (simplified, 1e-9)  [1.6309 vs 1.6309]
PASS detailed method on the concentric strand: transfer force = the elastic-shortening closed form with the net section (1e-6)
PASS effective prestrain per strand at the last time = F / (Ap Ep), positive, below the jacking strain
PASS deck differential shrinkage (detailed method) = the dashboard's per reported time (sd, sg, phd, chi; 1e-12); eps = -(sd - sg) / (1 + chi phd)  [eps -82.6e-6]

13 passed, 0 failed
```

### prestress inputs P4.5

```
PASS moduli and mean strength from Table 3.1.2 (standards entry) at f'cp and f'c
PASS strand area and MBL from Table 3.3.1 by diameter; jacking ratio, ages from the description
PASS strand levels and debonding from the strand pattern; bars from the bar table
PASS environment / stage / relaxation inputs from design.prestress_losses (D-42)
PASS wet deck load = tD beff gamma + dform; composite properties from the deck width
PASS r14: without accepting the proposals the builder refuses, naming the missing design.prestress_losses items
PASS V5 vs the dashboard's Hog inputs: every scalar equal except the documented geometry / density / age differences  [46 equal; differ: ['A', 'Ac', 'I', 'Ic', 'L', 'a', 'beff', 'dbw', 'dgam', 'pour', 'rho', 'ue', 'ueC', 'ued', 'wd', 'yb', 'yc']]
PASS documented differences are small where they are the same quantity: section A, I, yb, ue within 0.3 %; ueC within 0.1 %; L, a within 0.3 % / 1 %  [A +0.05%; Ac -6.58%; I +0.08%; Ic -4.54%; L -0.28%; a +0.97%; beff -14.32%; dbw -14.32%; dgam +2.00%; pour -11.67%; rho -1.92%; ue +0.07%; ueC +0.06%; ued -14.32%; wd -11.74%; yb +0.05%; yc -2.99%]
PASS with the dashboard's values substituted for the differing inputs, the run equals the dashboard's Hog run (hog, strand forces; 1e-9)  [7.1e-14 mm, 5.7e-14 kN]
PASS BR13A run from the description: effective prestrain at the last time for every strand, below the jacking strain  [mean sigma_pe 938 MPa at 3650 d]

12 passed, 0 failed
```

### girder flexure P4.5

```
PASS midspan G2: the recorded phi Mu is reproduced live (effective prestrain from the losses run, fpb = MBL / area; 1e-9)  [14877.6 kN m]
PASS effective prestress at midspan within the jacking stress and above the long-term range lower bound (0.4 fpb)
PASS each tendon's prestrain comes from its own strand of the losses analysis (pattern order)
PASS action mapping: M* interpolated between the two girder element ends bracketing each station (bracket contains the station, nearer end within 1.6 m)  [max 1.37 m]
PASS every station has M* > 0 (sagging), phi Mu > 0 and u = M* / phi Mu
PASS the governing station of each girder lies in the middle half of the span  [{'G1': 0.5, 'G2': 0.5, 'G3': 0.5, 'G4': 0.5}]
PASS phi Mu varies little along the girder (same strands, effective prestress near the plateau: within 2 %)
PASS record carries the provisional inputs and the unverified-standards label

8 passed, 0 failed
```

### girder SLS P4.5

```
PASS soffit stress is 0 at the decompression moment and f'ct.f at the cracking moment (1e-6 MPa)
PASS uncracked composite increment: soffit stress changes by dM (D - yc) / I (transformed, girder modulus; 1e-3)  [1.2744 vs 1.2744 MPa]
PASS Muo,min = k Mcr (sagging) / k McrH (hogging); Mcr > Mdec > Mnc-free decompression ordering (Mdec < Mcr - Mnc)  [Mdec 4637, Mcr 9222, McrH 322 kN m]
PASS allowable moment above decompression; increments at Mal at the limit (one of fscr / ftcr reached within 0.5 MPa)  [Mal 8322; dsb 200.0, dsp 200.0]
Traceback (most recent call last):
  File "/home/claude/pdf2bim-platform/tests/design/test_girder_sls.py", line 102, in <module>
    J = json.loads(subprocess.run(["node", "-e", js, R], input=json.dumps({"X": X, "LC": LC}), capture_output=True, text=True, check=True).stdout)
                   ~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.13/subprocess.py", line 578, in run
    raise CalledProcessError(retcode, process.args,
                             output=stdout, stderr=stderr)
subprocess.CalledProcessError: Command '['node', '-e', "\nglobal.DSG=require(process.argv[1]+'/src/dsg_engine.js'); global.DSG2=require(process.argv[1]+'/src/dsg_engine2.js');\nglobal.DG={nb:80, det:{}, detS:{}};\nconst s=require('fs').readFileSync(process.argv[1]+'/dist/BR13A_grillage_dashboard.html','utf8'); const i=s.indexOf('function dgLC(X, B, lc){'); const j=s.indexOf('\\n}\\n',i)+2;\neval(s.slice(i,j).replace('function dgLC(X, B, lc){','global.dgLC=function(X, B, lc){'));\nconst inp=JSON.parse(require('fs').readFileSync(0,'utf8')), X=inp.X, I=X.info, S=X.S;\nconst Sg={conc:S.conc.filter(c=>c.grp==='g'), bars:S.bars.filter(b=>b.grp==='g'), tend:S.tend};\nconst B={I:I, D:I.tD+I.H, eg:DSG.elastic(Sg,I.Eg), ec:DSG.elastic(S,I.Eg), fctfg:0.6*Math.sqrt(I.fcg), fctfd:0.6*Math.sqrt(I.fcd), fct25:0.25*Math.sqrt(I.fcg), dv:()=>0, dres:()=>0, geo:{ok:false, why:'n/a'}};\nconst fT=y=>1.0e-4*Math.max(0,1-y/300);\nconst out=inp.LC.map(lc=>{ if(lc.free) lc.free={T:fT, sh:-1.5e-4}; const o=dgLC(X,B,lc);\n  return {Mdec:o.Mdec, Mal:o.Mal, MdecT:o.MdecT, MalT:o.MalT, Mcr:o.Mcr, McrH:o.McrH, uS:o.uS, uST:o.uST, uncr:o.uncr, Muomin:o.Muomin, phiMu:o.phiMu, Muo:o.Muo, phi:o.phi, kuo:o.kuo, Nub:o.Nub,\n    g1top:o.g1top, g1bot:o.g1bot, sv:[o.sv.deckTop,o.sv.deckBot,o.sv.girTop,o.sv.girBot], sc:[o.sc.deckTop,o.sc.deckBot,o.sc.girTop,o.sc.girBot], incb:o.inc.b, inct:o.inc.t, dna:o.dna}; });\nconsole.log(JSON.stringify(out));\n", '/home/claude/pdf2bim-platform']' returned non-zero exit status 1.
```

### girder checks P4.5

```
PASS midspan G2: the recorded staged SLS / minimum strength / ULS result is reproduced live from its recorded actions (1e-9)  [0.0e+00]
PASS Mnc at midspan = SLS factor x simple-span moment of (rho A + wd) on the bearings (closed form, 1e-9)  [2920.8 kN m]
Traceback (most recent call last):
  File "/home/claude/pdf2bim-platform/tests/design/test_girder_checks.py", line 66, in <module>
    all(abs(x["sag"]["uS"] - x["sag"]["Ms"] / x["sag"]["Mal"]) < 1e-12 and abs(x["sag"]["uB"] - abs(x["sag"]["Mu"]) / x["sag"]["phiMu"]) < 1e-12
    ~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        and abs(x["sag"]["Muo_min"] - kmin * x["sag"]["Mcr"]) < 1e-9 and x["sag"]["uncracked"] == (x["sag"]["soffit_sls"] <= fct) for _, x in rows))
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/claude/pdf2bim-platform/tests/design/test_girder_checks.py", line 66, in <genexpr>
    all(abs(x["sag"]["uS"] - x["sag"]["Ms"] / x["sag"]["Mal"]) < 1e-12 and abs(x["sag"]["uB"] - abs(x["sag"]["Mu"]) / x["sag"]["phiMu"]) < 1e-12
            ~~~~~~~~^^^^^^
KeyError: 'uS'
```

### girder shear P4.5

```
Traceback (most recent call last):
  File "/home/claude/pdf2bim-platform/tests/design/test_girder_shear.py", line 27, in <module>
    J = json.loads(subprocess.run(["node", "-e", js, R], input=json.dumps({"P": P, "cases": cases}), capture_output=True, text=True, check=True).stdout)
                   ~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.13/subprocess.py", line 578, in run
    raise CalledProcessError(retcode, process.args,
                             output=stdout, stderr=stderr)
subprocess.CalledProcessError: Command '['node', '-e', "\nconst s=require('fs').readFileSync(process.argv[1]+'/dist/BR13A_grillage_dashboard.html','utf8'); const i=s.indexOf('function dgGeo('); const j=s.indexOf('\\n}\\n',i)+2;\nglobal.DG={det:{},detS:{}}; eval(s.slice(i,j).replace('function dgGeo(','global.dgGeo=function('));\nconst q=JSON.parse(require('fs').readFileSync(0,'utf8'));\nconsole.log(JSON.stringify(q.cases.map(c=>{ DG.det={cs:c[2],ct:c[3],tvd:c[4]}; const X={P:q.P,info:{H:q.P.D,tD:c[0]+c[1]},solid:false}; const g=dgGeo(X,c[0]+c[1]+q.P.D); return {Ao:g.Ao,Aoh:g.Aoh,uh:g.uh,y1:g.y1,Acp:g.Acp,uc:g.uc,bv:g.bv,ok:g.ok}; })));\n", '/home/claude/pdf2bim-platform']' returned non-zero exit status 1.
```

### baseline (fast)

```
PASS reference has quantities, checks and a run record
PASS every quantity is tagged indicative with reasons
PASS reference compared with itself: no differences
PASS a 0.01 % change of one bearing reaction is detected (exact mode)  [[{'id': 'brg.A_L1.V.DLc', 'kind': 'value', 'ref': 738.657495448, 'new': 738.7313611975447, 'rel': 9.999999999997245e-05, 'tolerance': 'exact regression'}]]
PASS the same change is within the provisional engineering tolerance
PASS a 2 mm chord change fails engineering mode (1 mm tolerance)
PASS a removed quantity is detected
PASS a change in a consistency check's pass/fail is detected

8 passed, 0 failed
```

