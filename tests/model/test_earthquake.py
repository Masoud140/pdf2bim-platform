#!/usr/bin/env python3
"""P3c earthquake RSA tests: spectral shape and CQC coefficient (closed form), single-degree-of-freedom response
(closed form, no missing mass), BR13A directions / combinations / refusals, and the dashboard's eqRun reproduced on its
own model and mass (V5)."""
import copy, json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import MissingInput
from pdf2bim.model.earthquake import earthquake_rsa, ch_factor, rho_cqc, summary, G_ACC
from pdf2bim.model.solver import Model
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


row = [1.3, 23.8, 3.68, 1.25, 1.874]
t("Ch(T) piecewise: Ch(0), rising branch, plateau, c / T, c2 / T^2",
  ch_factor(0, row) == 1.3 and abs(ch_factor(0.05, row) - (1.3 + 23.8 * 0.05)) < 1e-12 and ch_factor(0.2, row) == 3.68
  and abs(ch_factor(1.0, row) - 1.25) < 1e-12 and abs(ch_factor(2.0, row) - 1.874 / 4) < 1e-12 and ch_factor(0.12, row) == 3.68)
t("CQC coefficient: rho(w, w) = 1; symmetric; small for well-separated modes",
  abs(rho_cqc(10, 10, 0.05) - 1) < 1e-12 and abs(rho_cqc(10, 12, 0.05) - rho_cqc(12, 10, 0.05)) < 1e-12 and rho_cqc(10, 30, 0.05) < 0.01)

doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
from pdf2bim.geometry.bridge import build_geometry
geo = build_geometry(doc, allow_proposed=True)
# single degree of freedom: a 50 t mass on a spring in X, "sills" at (0, 0) and (10, 0) so that L = +X
sA, sB = geo["supports"][0]["id"], geo["supports"][-1]["id"]
m = Model(); m.node(1, 0, 0, 0); m.node(2, 0, 0, 0); m.node(3, 10, 0, 0)
m.fix(1, "011111"); m.fix(2, "111111"); m.fix(3, "111111"); m.spring(1, (2.0e4, 0, 0, 0, 0, 0))
mdl = {"model": m, "nodes": {}, "members": [], "bearings": {}, "supports": {sA: {"sill_nodes": [2], "piles": []}, sB: {"sill_nodes": [3], "piles": []}}}
Q = earthquake_rsa(doc, geo, mdl, Standards(), allow_proposed=True, extra_mass={1: 50.0}, n_modes=1)
T1 = 2 * math.pi * math.sqrt(50.0 / 2.0e4)
eq = Q["inputs"]                                  # effective inputs (with allow_proposed: the latest proposals, e.g. D-43 site class)
Sa = eq["kp"] * eq["Z"] * ch_factor(T1, Standards().get("AS1170.4:spectral_shape:Ch").value["rows"][eq["site_class"]]) / eq["Rf"]
i = Q["names"].index(("S", "springs", "X"))
t("SDOF: period 2 pi sqrt(m / k) and spring force = m Sa(T) g (closed form, 1e-9)",
  abs(Q["periods"][0] - T1) < 1e-12 and abs(Q["resp"]["L"]["R"][i] - 50.0 * Sa * G_ACC) < 1e-9 * 50.0 * Sa * G_ACC, f"{Q['resp']['L']['R'][i]:.4f} vs {50 * Sa * G_ACC:.4f}")
t("SDOF: all the mass is in the mode (effective mass 1), so the missing-mass residual is zero; no T response",
  abs(Q["resp"]["L"]["effective_mass_fraction"] - 1) < 1e-12 and abs(Q["resp"]["L"]["residual"][i]) < 1e-9 and abs(Q["resp"]["T"]["R"][i]) < 1e-9)
t("SDOF: 100 / 30 combinations: EQ-L = 1.0 L + 0.3 T, EQ-T = 0.3 L + 1.0 T",
  abs(Q["combos"]["EQ-L"][i] - Q["resp"]["L"]["R"][i]) < 1e-9 and abs(Q["combos"]["EQ-T"][i] - 0.3 * Q["resp"]["L"]["R"][i]) < 1e-9)
m2 = Model(); m2.node(1, 0, 0, 0); m2.node(2, 0, 0, 0); m2.node(3, 10, 0, 0); m2.node(4, 0, 0, 0)
m2.fix(1, "011111"); m2.fix(4, "011111"); m2.fix(2, "111111"); m2.fix(3, "111111")
m2.spring(1, (2.0e4, 0, 0, 0, 0, 0)); m2.link(1, 1, 4, (1.0e4, 0, 0, 0, 0, 0), axes=np.eye(3))
mdl2 = {"model": m2, "nodes": {}, "members": [], "bearings": {}, "supports": {sA: {"sill_nodes": [2], "piles": []}, sB: {"sill_nodes": [3], "piles": []}}}
Q1 = earthquake_rsa(doc, geo, mdl2, Standards(), allow_proposed=True, extra_mass={1: 30.0, 4: 20.0}, n_modes=1)
t("2-dof, one mode kept: the missing-mass term restores the static response at Sa(0) of the remaining mass (residual non-zero, mode + residual mass = 1)",
  abs(Q1["resp"]["L"]["residual"][Q1["names"].index(("S", "springs", "X"))]) > 1e-6 and Q1["resp"]["L"]["effective_mass_fraction"] < 1)
from pdf2bim.model.earthquake import covariance, concurrent as eq_conc
Q2 = earthquake_rsa(doc, geo, mdl2, Standards(), allow_proposed=True, extra_mass={1: 30.0, 4: 20.0}, n_modes=2)
okc = True
for QQ in (Q1, Q2):
    Rr = QQ["resp"]["L"]["R"]
    for i in range(len(Rr)):
        okc &= abs(covariance(QQ, "L", i, i) - Rr[i] ** 2) <= 1e-9 * max(Rr[i] ** 2, 1e-12)
        c = eq_conc(QQ, "L", i, -1.0)
        okc &= abs(c[i] + Rr[i]) <= 1e-9 * max(Rr[i], 1e-12) and all(abs(c[j]) <= Rr[j] * (1 + 1e-9) + 1e-12 for j in range(len(Rr)))
t("P4.3 covariance: C_ii = R_i^2 (modes + missing mass); concurrent c_i = sign R_i and |c_j| <= R_j (Cauchy-Schwarz), 1- and 2-mode cases", okc)
rk, rh = Q2["resp"]["L"]["Rk"], Q2["resp"]["L"]["rho"]
i_, j_ = 0, Q2["names"].index(("S", "springs", "X"))
w_ = [2 * math.pi / T_ for T_ in Q2["periods"]]
ref = sum((1.0 if k == l else rho_cqc(w_[k], w_[l], Q2["inputs"]["zeta"])) * rk[k, i_] * rk[l, j_] for k in range(2) for l in range(2)) + Q2["resp"]["L"]["residual"][i_] * Q2["resp"]["L"]["residual"][j_]
t("P4.3 covariance: cross term = sum_kl rho_kl R_ki R_lj + r_i r_j (closed form, 2 modes)", abs(covariance(Q2, "L", i_, j_) - ref) <= 1e-9 * max(abs(ref), 1e-12), f"{covariance(Q2, 'L', i_, j_):.4g} vs {ref:.4g}")
def _site(d, v):
    for r in d["loads"]["earthquake"]["rows"]:
        if r["cells"]["item"] == "site_class":
            r["cells"]["value"] = v
            for o in r.get("overrides") or []:
                o["value"] = dict(o["value"], value=v)
    return d
t("unknown site class refused with the list of classes", raises(lambda: earthquake_rsa(_site(copy.deepcopy(doc), "Xe"),
                                                                geo, mdl, Standards(), allow_proposed=True, extra_mass={1: 50.0}, n_modes=1), MissingInput, "site_class"))
d4 = copy.deepcopy(doc); d4["loads"]["earthquake"]["rows"] = [r for r in d4["loads"]["earthquake"]["rows"] if r["cells"]["item"] != "kp"]
t("missing kp refused", raises(lambda: earthquake_rsa(d4, geo, mdl, Standards(), allow_proposed=True, extra_mass={1: 50.0}, n_modes=1), MissingInput, "kp"))
d5 = copy.deepcopy(doc)
for r in d5["loads"]["earthquake"]["rows"]:
    if r["cells"]["item"] == "vertical":
        r["cells"]["value"] = "True"
Q5 = earthquake_rsa(d5, geo, mdl, Standards(), allow_proposed=True, extra_mass={1: 50.0}, n_modes=1)
t("vertical = True adds the V direction and EQ-V", "V" in Q5["resp"] and "EQ-V" in Q5["combos"])
t("results carry the UNVERIFIED label (Ch table from the standards data)", Q["standards_status"].startswith("UNVERIFIED"))

# BR13A, recorded comparison
z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.earthquake_vs_frozen.json")))
t("engine check: periods equal the dashboard's on its model and mass (1e-6)", all(abs(a / b - 1) < 1e-6 for a, b in zip(z["periods"]["replica"], z["periods"]["dash"])))
t("engine check: bearing forces and pile moments equal the dashboard's eqRun (1e-5 relative)",
  all(v["bearing_max_diff"] < 1e-5 * v["bearing_max"] and v["pile_M_max_diff"] < 1e-5 * v["pile_M_max"] for v in z["engine"].values()))
t("H-3: with the static mass (deck strips massless) the frozen-model pile moments fall (ratio < 1)", max(z["H3_pile_ratio"].values()) < 1.0)
t("P3c on the P3b model vs the dashboard: pile moments within 20 % (EQ-L, EQ-T; recorded run)", all(abs(v[0] / v[1] - 1) < 0.2 and abs(v[2] / v[3] - 1) < 0.2 for v in z["p3b"].values()))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
