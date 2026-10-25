#!/usr/bin/env python3
"""P3c AS 5100.2 combination tests: generator rows for small registers (closed form, factors from the standards data),
rounding and merging, SLS companion subsets, earthquake orthogonal states, evaluation bounds and governing rows,
refusals, the response set (exact static values incl. fixed-end forces), and the recorded dashboard engine checks (V5)."""
import copy, itertools, json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.model.combinations import Register, generate, combine, _round4, available_actions
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


def raises(fn, exc, word=None):
    try:
        fn()
    except exc as e:
        return word is None or word in str(e)
    return False


std = Standards()
lf = lambda a: std.get(f"AS5100.2:load_factor:{a}").value
cb = lambda k: std.get(f"AS5100.2:combination:{k}").value

# --- small register: permanent + one vehicle --------------------------------------------------------------------
G = generate(Register(std, {"DLc", "M1600"}))
rows = {r["name"]: r for r in G["rows"]}
A = cb("min_strength_stability")
t("(a) minimum strength and stability: DLc x A1 and x A2 (standards entry)",
  rows["ULS-A-0001"]["t"] == [("DLc", A["max"]["DLc"])] and rows["ULS-A-0002"]["t"] == [("DLc", A["min"]["DLc"])])
t("(b) road traffic: PE max / min (ULS / relieving factors) + M1600 x its ULS factor",
  rows["ULS-B-0001"]["t"] == [("DLc", lf("DLc")["uls"]), ("M1600", lf("M1600")["uls"])] and rows["ULS-B-0002"]["t"] == [("DLc", lf("DLc")["uls_relieving"]), ("M1600", lf("M1600")["uls"])]
  and rows["ULS-B-0001"]["pe"] == "PE max" and rows["ULS-B-0002"]["pe"] == "PE min")
t("row count: 4 ULS ((a) 2, (b) 2) and 2 SLS (PE only, lead traffic); no wind / earthquake rows without those actions",
  [r["name"] for r in G["rows"]] == ["ULS-A-0001", "ULS-A-0002", "ULS-B-0001", "ULS-B-0002", "SLS-S-0001", "SLS-S-0002"])
t("SLS: PE x SLS factor; lead traffic x SLS factor", rows["SLS-S-0002"]["t"] == [("DLc", lf("DLc")["sls"]), ("M1600", lf("M1600")["sls"])])

# --- earthquake: orthogonal companion -----------------------------------------------------------------------------
G = generate(Register(std, {"DLc", "EQX", "EQY"}))
h = [r for r in G["rows"] if r["col"] == "h"]
q = cb("earthquake_orthogonal")
exp = [[("DLc", f), (a, s1), (b, round(q * s2, 4))] for f in (lf("DLc")["uls"], lf("DLc")["uls_relieving"]) for a, b in (("EQX", "EQY"), ("EQY", "EQX")) for s1 in (1, -1) for s2 in (1, -1)]
t("(h) earthquake: 2 PE sets x {EQX +-1 with EQY +-f, EQY +-1 with EQX +-f} = 16 rows, f from the standards entry", [r["t"] for r in h] == exp, f"{len(h)} rows, f = {q}")

# --- SLS companion subsets ------------------------------------------------------------------------------------------
G = generate(Register(std, {"DLc", "M1600", "TUW", "WX"}))
sls = [r for r in G["rows"] if r["ls"] == "SLS"]
k = cb("sls_companion")
# groups: traffic (1 state), thermal (TUW alone: 1 state), wind (WX_S +-1: 2 states); each lead with every subset of the others
n_exp = 1 + sum(len(L) * math.prod(len(x) for x in sub) for L, others in ((["tr"], [["th"], ["w+", "w-"]]), (["th"], [["tr"], ["w+", "w-"]]), (["w+", "w-"], [["tr"], ["th"]]))
                for r_ in range(3) for sub in itertools.combinations(others, r_))
t("SLS: PE only + each lead group with every subset of the others (count)", len(sls) == n_exp, f"{len(sls)} vs {n_exp}")
one = next(r for r in sls if r["type"].endswith("lead traffic + k=" + str(k["k1"]) + " × thermal"))
two = next(r for r in sls if r["type"].endswith("lead traffic + k=" + str(k["k2"]) + " × thermal, wind"))
t("SLS companions: k1 for one other group, k2 for two or more (standards entry)",
  dict(one["t"])["TUW"] == round(k["k1"] * lf("TUW")["sls"], 4) and dict(two["t"])["TUW"] == round(k["k2"] * lf("TUW")["sls"], 4) and abs(dict(two["t"])["WX_S"]) == round(k["k2"] * lf("WX")["sls"], 4))
w = [r for r in G["rows"] if r["col"] == "j" and r["type"].endswith("wind alone")]
t("(j) wind alone at the ULS speed (+-WX_U), with traffic at the 35 m/s speed (WX_35)",
  sorted(dict(r["t"])["WX_U"] for r in w) == [-lf("WX")["uls"]] * 2 + [lf("WX")["uls"]] * 2 and any("WX_35" in dict(r["t"]) for r in G["rows"] if r["col"] == "b"))

# --- options --------------------------------------------------------------------------------------------------------
G2 = generate(Register(std, {"DLc", "SDLp", "M1600"}), {"pm": "m"})
pe = sorted({r["pe"] for r in G2["rows"] if r["col"] == "b"})
t("pm = 'm': every mixed permanent set (2 actions -> 4 sets)", pe == ["PE max", "PE min", "PE mixed (DLc max)", "PE mixed (SDLp max)"], str(pe))
G3 = generate(Register(std, {"DLc", "M1600", "WX", "WY", "WZ"}), {"wm": "a"})
wa = [r for r in G3["rows"] if r["col"] == "j" and r["type"].endswith("wind alone")]
t("wm = 'a': transverse x longitudinal x vertical (8 states x 2 PE sets)", len(wa) == 16 and all(len(r["t"]) == 4 for r in wa))
t("cap: rows stop at the cap and the result says so", generate(Register(std, {"DLc", "M1600", "WX", "WY", "WZ", "TUW", "TGP"}), {"cap": 100})["capped"])

# --- rounding, merging, refusals ------------------------------------------------------------------------------------
t("factor rounding as JS Math.round(f x 1e4) / 1e4 (half toward +inf; -0.00005 -> 0)", _round4(0.00005) == 0.0001 and _round4(-0.00005) == 0.0 and _round4(1.80004) == 1.8)
t("unknown action id refused", raises(lambda: Register(std, {"DLc", "XYZ"}), ValueError, "XYZ"))
t("(a) refused when an adverse-set action has no relieving factor (dashboard: NaN)", raises(lambda: generate(Register(std, {"DLc", "SDLr"})), ValueError, "SDLr"))
t("wind ids without the speed suffix in the available actions", available_actions({"WX_U": 0, "WX_35": 0, "DLc": 0}) == {"WX", "DLc"})

# --- evaluation -----------------------------------------------------------------------------------------------------
rows = [{"name": "R1", "ls": "ULS", "t": [("A", 2.0), ("E", 1.0)]}, {"name": "R2", "ls": "ULS", "t": [("A", 1.0), ("E", -1.0), ("X", 5.0)]},
        {"name": "S1", "ls": "SLS", "t": [("A", 1.0)]}]
prim = {"A": {"s": np.array([1.0, -2.0])}, "E": {"max": np.array([3.0, 0.5]), "min": np.array([-1.0, -4.0])}}
C = combine(rows, prim)
# R1: [2+3, -4+0.5] hi; [2-1, -4-4] lo. R2: E x -1 -> (1, -3) / (4, -0.5): hi [1+1, -2+4], lo [1-3, -2-0.5]
t("evaluation: static f v added to both bounds; envelope f max / f min sorted into the bounds (negative factor swaps them)",
  np.allclose(C["ULS"]["max"], [5.0, 2.0]) and np.allclose(C["ULS"]["min"], [-2.0, -8.0]) and C["ULS"]["gmax"] == ["R1", "R2"] and C["ULS"]["gmin"] == ["R2", "R1"])
t("evaluation: a term without a primitive is counted as missing and adds nothing; limit states kept apart",
  C["missing"] == {"X": 1} and C["ULS"]["n"] == 2 and C["SLS"]["n"] == 1 and np.allclose(C["SLS"]["max"], [1, -2]))

# --- response set on the BR13A integrated model ------------------------------------------------------------------
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.responses import ResponseSet
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, std, allow_proposed=True)
RS = ResponseSet(M)
m = M["model"]
v = RS.static(gravity=(0.0, 0.0, -1.0))
def link_local(b):
    L_, Rm_, T_, Kl_, fl_, d_ = m._el[("link", b["link"])]
    return Kl_ @ T_ @ m._u[d_]
ok_b = all(abs(v[RS.index[("B", bid, "FZ")]] - m.link_force(b["link"])[1][2]) < 1e-6 and abs(v[RS.index[("BL", bid, "v")]] - link_local(b)[0]) < 1e-6
           and abs(v[RS.index[("BL", bid, "lon")]] + link_local(b)[2]) < 1e-6 for bid, b in M["bearings"].items())
pn = next(n for n in RS.names if n[0] == "P" and n[2] == "My2")
f = m.end_forces(pn[1][1])
t("response set, self weight: bearing global FZ = link_force; pile end moment = solver end force incl. fixed-end forces (1e-6)",
  ok_b and abs(v[RS.index[pn]] - f[10]) < 1e-6 and abs(v[RS.index[pn[:2] + ("N2",)]] + f[6]) < 1e-6)
t("response set: bearing FZ under self weight sums to the superstructure weight carried (all compression, > 0)", all(v[RS.index[("B", b, "FZ")]] > 0 for b in M["bearings"]))
node = next(k for k, x in M["nodes"].items() if x.get("role") == "girder")
L1 = {node: np.array([0, 0, -100.0, 0, 0, 0])}
v1 = RS.static(loads=L1)
t("response set: for a nodal load the matrix alone equals the exact static values (no member loads)", np.allclose(v1, RS.from_u(m._u), atol=1e-9))
u2 = 2 * m._u
t("response set: linear (2 u -> 2 x response)", np.allclose(RS.from_u(u2), 2 * v1, atol=1e-9))
ux = next(n for n in RS.names if n[0] == "P" and n[2] == "Ml1")
Rm = m._el[ux[1][1]][1]
f = m.end_forces(ux[1][1]); g = Rm.T @ (-f[3:6])
pid = ux[1][0]; sid = next(s for s, x in M["supports"].items() if any(p["id"] == pid for p in x["piles"]))
from pdf2bim.model.responses import _sill_axes
uax, nax = _sill_axes(M)[sid]
t("response set: Ml / Mt = section moment at the end in global axes projected on the sill axis / its normal",
  abs(v1[RS.index[ux]] - g[:2] @ uax) < 1e-6 and abs(v1[RS.index[ux[:2] + ("Mt1",)]] - g[:2] @ nax) < 1e-6)

# --- recorded comparison (tools/compare_frozen_combinations.py) ---------------------------------------------------
z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.combinations_vs_frozen.json")))
t("engine check: generated rows equal the dashboard's genAll rows for all 9 recorded sets (SHA-256, count, cap)",
  len(z["generator"]) == 9 and all(v["sha_equal"] and v["n"][0] == v["n"][1] and v["capped"][0] == v["capped"][1] for v in z["generator"].values()))
t("engine check: combining the dashboard's primitives reproduces rxCombine exactly (envelopes 0 difference, same governing rows)",
  all(z["evaluation"][ls]["max_diff"] == 0 and z["evaluation"][ls]["min_diff"] == 0 and z["evaluation"][ls]["governing_differ"] == 0 for ls in ("ULS", "SLS")))
t("platform default: actions without an analysed case are reported as not combined (pedestrian, flood, collision)",
  {a for a, _ in z["platform_default"]["not_combined"]} == {"PED", "FLH", "COLX"} and "PED" not in z["platform_default"]["on"] and not z["platform_default"]["missing"])
t("P3c vs dashboard bearings (V5, recorded): every bearing matched within 0.1 m; ULS max v within a factor 1.7 (traffic findings H-4, H-5)",
  all(b["dist"] < 0.1 and 1 / 1.7 < b["p3c"][0] / b["dash"][0] < 1.7 for b in z["bearings"].values()))
t("P3c vs dashboard piles (V5, recorded): ULS |Ml| within 10 %, |Mt| within 20 %",
  all(abs(p["p3c"]["Ml"] / p["dash"]["Ml"] - 1) < 0.1 and abs(p["p3c"]["Mt"] / p["dash"]["Mt"] - 1) < 0.2 for p in z["piles"].values()))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
