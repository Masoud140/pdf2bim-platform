#!/usr/bin/env python3
"""Standards-data framework tests (docs/STANDARDS_DATA_SPEC.md §4).  Run: python3 tests/standards/test_standards.py

Prints PASS/FAIL per assertion; exit code 1 if any fails. These test the FRAMEWORK and that the inventory matches
the code. They do not (and cannot) verify any value against a Standard.
"""
import copy, glob, json, os, re, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from standards.accessor import Standards, StandardsError, validate_entry, UNVERIFIED
import standards.extract_from_code as X

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


def raises(f, exc):
    try:
        f()
    except exc:
        return True
    except Exception:
        return False
    return False


S = Standards()
E = S.entries
t("standards data loads and validates", len(E) > 0)
t("every entry is code-extracted-unverified (nothing reviewed yet; agents may not upgrade)", all(e["status"] == "code-extracted-unverified" for e in E.values()))
t("edition and amendment are null (not recorded in code; not guessed)", all(e["edition"] is None and e["amendment"] is None for e in E.values()))
t("every entry names at least one code location", all(e["implementation"]["used_by"] for e in E.values()))

# ---- inventory matches the code, by an independent method (Node evaluates the JS literals) ----
html = open(os.path.join(R, "base/BR13A_grillage_dashboard_v15.html"), encoding="utf-8").read()
i = html.index("R=[\n['DLc'"); j = html.index("].map(a=>({id:a[0]", i)
js = "const R=" + html[i + 2:j] + "]; console.log(JSON.stringify(R.map(a=>[a[0],a[3],a[4],a[5],a[6]])))"
reg = json.loads(subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True).stdout)
lf = {k.split(":")[-1]: v for k, v in E.items() if ":load_factor:" in k}
t(f"load-factor register: all {len(reg)} code rows inventoried (independent count)", len(reg) == len(lf) and {r[0] for r in reg} == set(lf), f"{len(reg)} vs {len(lf)}")
mism = [r[0] for r in reg if r[0] in lf and (lf[r[0]]["value"] != {"uls": r[2], "uls_relieving": r[3], "sls": r[4]} or lf[r[0]]["reference"]["clause"] != r[1])]
t("load-factor register: every factor and clause equals the code", not mism, str(mism[:5]))
sub5 = open(os.path.join(R, "src/sub5.js")).read()
ch_js = re.search(r"var EQ_CH=(\{.*?\});", sub5).group(1)
ch = json.loads(subprocess.run(["node", "-e", f"console.log(JSON.stringify({ch_js}))"], capture_output=True, text=True, check=True).stdout)
t("AS 1170.4 Ch table equals the code (node-evaluated)", E["AS1170.4:spectral_shape:Ch"]["value"]["rows"] == ch)
trv_js = re.search(r"var TRV=(\{.*?\n\});", html, re.S).group(1)
trv = json.loads(subprocess.run(["node", "-e", f"console.log(JSON.stringify({trv_js}))"], capture_output=True, text=True, check=True).stdout)
keys = (("wheel_kN", "wheel"), ("track_m", "track"), ("axle_spacing_m", "axle"), ("gap_12_m", "g12"), ("gap_23_min_m", "g23"), ("gap_34_m", "g34"),
        ("udl_kN_per_m", "udl"), ("dla", "dla"), ("wheel_width_m", "wW"))
t("traffic models M1600 / S1600 and lane width equal the code (node-evaluated TRV)",
  all(E[f"AS5100.2:traffic:{mn}"]["value"][a] == trv[mn][b] for mn in ("M1600", "S1600") for a, b in keys) and E["AS5100.2:traffic:lane_width"]["value"] == trv["laneW"]["v"]
  and E["AS5100.2:traffic:M1600"]["reference"]["clause"] == trv["M1600"]["cl"].split(",")[0])
bad_loc = []
for e in E.values():
    path, line = e["implementation"]["used_by"][0].split(" ")[0].rsplit(":", 1)
    src = open(os.path.join(R, path), encoding="utf-8").read().split("\n")
    if not (0 < int(line) <= len(src)):
        bad_loc.append(e["id"]); continue
    key = e["id"].split(":")[-1]
    txt = src[int(line) - 1]
    if ":load_factor:" in e["id"] and f"['{key}'," not in txt:
        bad_loc.append(e["id"])
t("every code location points at an existing line (load factors: the line holds that row)", not bad_loc, str(bad_loc[:5]))
t("project inputs (wind speed, hazard Z, temperatures) are not standards entries",
  not any(k.endswith(s) for k in E for s in (":V", ":Z", ":Tmax", ":design_wind_speed")) and os.path.exists(os.path.join(R, "standards/data/_project_defaults_not_standards.json")))

# ---- accessor ----
v = S.get("AS5100.2:load_factor:DLc")
t("get() returns value and status", v.value == {"uls": 1.2, "uls_relieving": 0.85, "sls": 1.0} and v.status == "code-extracted-unverified")
t("get() of an unknown id raises (no silent default)", raises(lambda: S.get("AS5100.2:does_not_exist"), KeyError))
t("a result that used an unapproved entry is flagged UNVERIFIED", S.result_status() == UNVERIFIED)
t("usage() lists each entry used with its status (for the run record)", S.usage() == [("AS5100.2:load_factor:DLc", "code-extracted-unverified")])
base = copy.deepcopy(E["AS5100.2:load_factor:DLc"])


def reviewed(**kw):
    e = copy.deepcopy(base)
    e.update(status="approved", edition="20xx (example)", amendment="none")
    e["reference"]["authorised_source"] = "example authorised copy"
    e["review"] = {"reviewer": "Engineer A", "date": "2026-10-24", "method": "checked against Table (example)", "notes": None}
    for k, val in kw.items():
        if "." in k:
            a, b = k.split("."); e[a][b] = val
        else:
            e[k] = val
    return e


S2 = Standards(entries=[reviewed()])
S2.get(base["id"])
t("a result using only approved entries is labelled approved", S2.result_status() == "approved standards data")
S3 = Standards(entries=[reviewed(), dict(copy.deepcopy(E["AS5100.5:strain:ecu"]))])
S3.get(base["id"]); S3.get("AS5100.5:strain:ecu")
t("one unapproved entry among approved ones still makes the result UNVERIFIED", S3.result_status() == UNVERIFIED)

# ---- validation rejects ----
CASES = [
    ("approved without reviewer", reviewed(**{"review.reviewer": None})),
    ("approved without review date", reviewed(**{"review.date": None})),
    ("approved without review method", reviewed(**{"review.method": None})),
    ("approved without authorised source", reviewed(**{"reference.authorised_source": None})),
    ("approved by an AI agent", reviewed(**{"review.reviewer": "Claude"})),
    ("approved without edition", reviewed(edition=None)),
    ("approved without amendment", reviewed(amendment=None)),
    ("checked without reviewer", reviewed(status="checked", **{"review.reviewer": None})),
    ("unknown status", reviewed(status="verified")),
]
for name, e in CASES:
    t("rejects: " + name, validate_entry(e) != [] and raises(lambda: Standards(entries=[e]), StandardsError))
t("rejects: duplicate id", raises(lambda: Standards(entries=[copy.deepcopy(base), copy.deepcopy(base)]), StandardsError))

# ---- extractor keeps reviews, resets them when the code value changes ----
tmp = tempfile.mkdtemp()
X.OUT = tmp
for f in glob.glob(os.path.join(R, "standards/data/*.json")):
    open(os.path.join(tmp, os.path.basename(f)), "w").write(open(f).read())
d = json.load(open(os.path.join(tmp, "AS5100.2.json")))
for e in d["entries"]:
    if e["id"] == base["id"]:
        e.update(reviewed())
    if e["id"] == "AS5100.2:load_factor:SDLp":
        e.update(reviewed(id=e["id"], value={"uls": 9.9, "uls_relieving": 0.7, "sls": 1.3}))  # pretend code later differs
json.dump(d, open(os.path.join(tmp, "AS5100.2.json"), "w"))
import io, contextlib
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    X.main()
d2 = {e["id"]: e for e in json.load(open(os.path.join(tmp, "AS5100.2.json")))["entries"]}
t("extractor re-run keeps the review of an unchanged value", d2[base["id"]]["status"] == "approved" and d2[base["id"]]["review"]["reviewer"] == "Engineer A")
t("extractor re-run resets the status when the code value differs from the reviewed one",
  d2["AS5100.2:load_factor:SDLp"]["status"] == "code-extracted-unverified" and "SDLp: value changed" in buf.getvalue())
def fresh_equals_committed():
    out = tempfile.mkdtemp()
    X.OUT = out
    with contextlib.redirect_stdout(io.StringIO()):
        X.main()
    files = sorted(glob.glob(os.path.join(R, "standards/data/*.json")))
    return files and all(json.load(open(os.path.join(out, os.path.basename(f)))) == json.load(open(f)) for f in files)


t("committed data files equal a fresh extraction (inventory not edited by hand)", fresh_equals_committed())

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
