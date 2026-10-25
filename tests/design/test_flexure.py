#!/usr/bin/env python3
"""P4.5 stage 1 flexural strength tests: closed forms (tension- and compression-controlled rectangular sections, block
in a flange), polygon strips, coefficients from the standards data, and the port against the dashboard's engine on its
worked-example section (Node-evaluated, V5). The worked-example targets (E-1) are reported, not asserted."""
import json, math, os, subprocess, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.design.flexure import Section, strips_from_layers, strips_from_polygon, elastic, uls_bend, Coefficients
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
K = Coefficients(std)
v = lambda k: std.get(k).value
al, ga, ph = v("AS5100.5:stress_block:alpha2"), v("AS5100.5:stress_block:gamma"), v("AS5100.5:capacity_factor:phi_bending")
t("coefficients read from the standards data: alpha2, gamma clamp(a - b f'c); phi clamp(a - b kuo / c)",
  abs(K.alpha2(40) - min(al["max"], max(al["min"], al["a"] - al["b"] * 40))) < 1e-15 and abs(K.gamma(200) - ga["min"]) < 1e-15 and abs(K.gamma(100) - (ga["a"] - ga["b"] * 100)) < 1e-15
  and abs(K.phi(0.1) - min(ph["max"], max(ph["min"], ph["a"] - ph["b"] * 0.1 / ph["c"]))) < 1e-15 and K.status.startswith("UNVERIFIED"))

# closed form 1: rectangular section, one bar layer, tension controlled
b, h, fc, d, As, Es, fsy = 1000.0, 600.0, 40.0, 550.0, 3000.0, 200000.0, 500.0
S = Section(strips_from_layers([{"h": h, "b1": b, "b2": b, "E": 32000, "fc": fc}], dz=7.3), bars=[{"y": d, "A": As, "E": Es, "fsy": fsy}])
r = uls_bend(S, std)
a2, g = K.alpha2(fc), K.gamma(fc)
dn = As * fsy / (a2 * fc * b * g)
Mu = As * fsy * (d - g * dn / 2) / 1e6
t("rectangular, tension controlled: dn = As fsy / (alpha2 f'c b gamma), Mu = As fsy (d - gamma dn / 2) (exact block integration, 1e-9)",
  abs(r["dn"] / dn - 1) < 1e-9 and abs(r["Mu"] / Mu - 1) < 1e-9 and r["steel"][0]["s"] == fsy, f"dn {r['dn']:.4f} vs {dn:.4f}, Mu {r['Mu']:.3f} vs {Mu:.3f}")
t("phi from kuo = dn / d", abs(r["phi"] - K.phi(dn / d)) < 1e-12 and abs(r["kuo"] - dn / d) < 1e-9)
# closed form 2: compression controlled (steel elastic): alpha2 f'c b gamma dn = As Es ecu (d - dn) / dn
As2 = 30000.0
S2 = Section(S.conc, bars=[{"y": d, "A": As2, "E": Es, "fsy": fsy}])
r2 = uls_bend(S2, std)
A_, B_, C_ = a2 * fc * b * g, As2 * Es * K.ecu, -As2 * Es * K.ecu * d
dn2 = (-B_ + math.sqrt(B_ * B_ - 4 * A_ * C_)) / (2 * A_)
s2 = Es * K.ecu * (d - dn2) / dn2
t("rectangular, compression controlled (steel elastic): quadratic closed form for dn, Mu (1e-9)",
  s2 < fsy and abs(r2["dn"] / dn2 - 1) < 1e-9 and abs(r2["Mu"] / (As2 * s2 * (d - g * dn2 / 2) / 1e6) - 1) < 1e-9, f"dn {r2['dn']:.3f} vs {dn2:.3f}")
# closed form 3: block inside a flange of a different concrete (T section): alpha2 of each strip from its own f'c
L = [{"h": 200, "b1": 2000, "b2": 2000, "E": 30000, "fc": 32}, {"h": 800, "b1": 400, "b2": 400, "E": 36000, "fc": 65}]
S3 = Section(strips_from_layers(L, dz=3), bars=[{"y": 950, "A": 4000, "E": Es, "fsy": fsy}])
r3 = uls_bend(S3, std)
g3 = K.gamma(32); dn3 = 4000 * fsy / (K.alpha2(32) * 32 * 2000 * g3)
t("T section, block within the flange: gamma from the top strip, alpha2 from the flange concrete (1e-9)", g3 * dn3 < 200 and abs(r3["dn"] / dn3 - 1) < 1e-9)
# polygon strips
P = [[0, 0], [300, 0], [300, 500], [0, 500]]
st = strips_from_polygon(P, 500, 100, 30000, 40, dz=5)
t("polygon strips: a rectangle gives b x H exactly and starts at its top depth", abs(sum(c["b"] * c["h"] for c in st) - 300 * 500) < 1e-6 and abs(st[0]["y"] - 102.5) < 1e-12)
# strand curve
T0 = {"E": 195000, "fpb": 1830}
mt = v("AS5100.5:strand:stress_strain_mattock")
e_ = 0.012
f_ = 195000 * e_ * (mt["A"] + (1 - mt["A"]) / (1 + (mt["B"] * e_) ** mt["C"]) ** (1 / mt["C"]))
t("strand curve (Mattock form, coefficients from the standards data), capped at fpb; elastic-plastic option",
  abs(K.strand(T0, e_) - f_) < 1e-9 and K.strand(T0, 0.05) <= 1830 and K.strand(T0, -e_) == -K.strand(T0, e_) and K.strand(dict(T0, bil=True), 0.004) == 780.0)


def _try(f, e):
    try:
        f()
    except e:
        return True
    return False


t("refusal: a section without concrete strips; a section without steel", _try(lambda: Section([]), ValueError) and _try(lambda: uls_bend(Section(S.conc), std), ValueError))

# the dashboard's engine on its worked-example section (Node), against the port
js = r"""
const D=require(process.argv[1]+'/src/dsg_engine.js'); const log=console.log; console.log=()=>{}; const {S}=require(process.argv[1]+'/tests/engine/dsg_test.js'); console.log=log;
const out={conc:S.conc,bars:S.bars,tend:S.tend.map(t=>Object.assign({},t))};
const u=D.ulsBend(S,{}), un=D.ulsBend(S,{noComp:true}), ug=D.ulsBend(S,{gamma:0.775}), e=D.elastic(S,37400);
const fp=[0.005,0.01,0.02,0.03].map(x=>D.fp({E:195000,fpb:1830},x));
console.log(JSON.stringify({S:out,u:{dn:u.dn,kuo:u.kuo,Mu:u.Mu,phi:u.phi,det:u.det},un:{dn:un.dn,Mu:un.Mu},ug:{dn:ug.dn,Mu:ug.Mu},e,fp}));
"""
J = json.loads(subprocess.run(["node", "-e", js, R], capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])
SW = Section(J["S"]["conc"], J["S"]["bars"], J["S"]["tend"])
p = uls_bend(SW, std)
rel = lambda a, b: abs(a - b) / max(abs(b), 1e-12)
t("port = dashboard engine on its worked-example section: dn, kuo, Mu, phi (1e-9)",
  rel(p["dn"], J["u"]["dn"]) < 1e-9 and rel(p["kuo"], J["u"]["kuo"]) < 1e-9 and rel(p["Mu"], J["u"]["Mu"]) < 1e-9 and p["phi"] == J["u"]["phi"], f"dn {p['dn']:.3f}, Mu {p['Mu']:.1f}")
t("port = dashboard engine: every bar and tendon stress (1e-9 relative)", all(abs(a["s"] - b["s"]) <= 1e-9 * max(abs(b["s"]), 1) for a, b in zip(p["steel"], J["u"]["det"])))
pn, pg = uls_bend(SW, std, no_comp_bars=True), uls_bend(SW, std, gamma=0.775)
t("port = dashboard engine with its options (compression bars ignored; gamma override)", rel(pn["dn"], J["un"]["dn"]) < 1e-9 and rel(pn["Mu"], J["un"]["Mu"]) < 1e-9 and rel(pg["dn"], J["ug"]["dn"]) < 1e-9 and rel(pg["Mu"], J["ug"]["Mu"]) < 1e-9)
e = elastic(SW, 37400)
t("port = dashboard engine: transformed elastic properties (A, yc, I)", rel(e["A"], J["e"]["A"]) < 1e-12 and rel(e["yc"], J["e"]["yc"]) < 1e-12 and rel(e["I"], J["e"]["I"]) < 1e-12)
t("port = dashboard engine: strand curve at 4 strains", all(abs(K.strand({"E": 195000, "fpb": 1830}, x) - y) < 1e-9 for x, y in zip([0.005, 0.01, 0.02, 0.03], J["fp"])))
# E-1: reported against the dashboard's hard-coded targets (provenance not recorded): not asserted
tg = {"dn": 240.9, "kuo": 0.1019, "Mu": 68979}
print(f"INFO E-1: worked-example targets dn {tg['dn']}, kuo {tg['kuo']}, Mu {tg['Mu']} vs port dn {p['dn']:.1f} ({p['dn'] / tg['dn'] - 1:+.1%}), kuo {p['kuo']:.4f}, Mu {p['Mu']:.0f} ({p['Mu'] / tg['Mu'] - 1:+.2%})")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
