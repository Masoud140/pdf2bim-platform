#!/usr/bin/env python3
"""P4.5 stage 6 tests: staged SLS stresses, decompression / allowable / cracking moments, minimum strength and the
composite ULS bending of a Super-T section (pdf2bim/design/girder_sls.py).

Closed forms / internal consistency: stage 1 reproduces each strand's effective prestress under prestress + Mnc; the
soffit stress is 0 at Mdec and f'ct.f at Mcr; an uncracked increment changes the soffit stress by dM (D - yc) / I;
Muo,min = k Mcr; Table 8.6.2.1 limits picked from the bar diameters. Port = the dashboard's dgLC (evaluated in Node
from the built dashboard with its own engines) on the example girder's midspan station, four load cases (sagging,
sagging with axial force and free strains, hogging, compression)."""
import copy, json, math, os, subprocess, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.design.stations import station_section
from pdf2bim.design.prestress_inputs import hog_inputs
from pdf2bim.design.prestress import run, strand_forces_at, stage_moments_at
from pdf2bim.design.flexure import elastic
from pdf2bim.design.sls import solve
from pdf2bim.design.girder_sls import staged, crack_limits
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
g = "G2"
H = hog_inputs(doc, geo, S, g, std, allow_proposed=True)
p = H["p"]; r = run(p, std)
st = station_section(doc, geo, S, g, 0.5, allow_proposed=True)
sec = st["section"]
F = strand_forces_at(r, st["x_m"] * 1000.0)
fpb = p["mbl"] * 1e3 / p["Ap"]
for td in sec.tend:
    td["sp"] = F[td["k_on"]] * 1e3 / td["A"]; td["fpb"] = fpb
mt = st["materials"]
lv = {"y_deck_bot": S["deck_thickness"], "y_gir_top": st["y_girder_top"], "Dtot": st["Dtot"], "Eg": mt["E_girder"], "Ed": mt["E_deck"], "fcg": mt["fc_girder"], "fcd": mt["fc_deck"]}
SM = stage_moments_at(r, st["x_m"] * 1000.0)
Mnc = SM["Msw"] + SM["Mwet"]
lim = crack_limits(sec, std)
T = std.get("AS5100.5:crack_control:table_8_6_2_1").value
dbot = max(b["d"] for b in sec.bars if b["y"] > (lv["y_gir_top"] + lv["Dtot"]) / 2)
t("Table 8.6.2.1 limits: fscr from the largest girder bar in the lower half (next listed diameter), ftcr the tendon value",
  lim["fscr"] == next(v for d, v in T["bars"] if dbot <= d) and lim["ftcr"] == T["tendons"], f"db {dbot:g} -> fscr {lim['fscr']:g}, fscrT {lim['fscrT']:g}, ftcr {lim['ftcr']:g}")
fr_T = lambda y: 1.0e-4 * max(0.0, 1.0 - y / 300.0)          # test free strain: linear over the top 300 mm (tension +)
CASES = [{"Ms": 3000.0, "Ns": 0.0, "Mu": 10000.0, "Nu": 0.0},
         {"Ms": 2500.0, "Ns": 150.0, "Mu": 9000.0, "Nu": 300.0, "free": True},
         {"Ms": -800.0, "Ns": 0.0, "Mu": -2500.0, "Nu": 0.0},
         {"Ms": 3000.0, "Ns": -400.0, "Mu": 10000.0, "Nu": -2000.0}]
O = []
for c in CASES:
    O.append(staged(sec, lv, Mnc, c["Ms"], c["Ns"], c["Mu"], c["Nu"], std, lim["fscr"], lim["ftcr"], lim["fscrT"],
                    free={"T": fr_T, "sh": -1.5e-4} if c.get("free") else None))
o = O[0]
t("stage 1: each strand carries its effective prestress (losses analysis) under prestress + Mnc, girder alone (1e-3 MPa)",
  max(abs(a - b["sp"]) for a, b in zip(o["girder_alone"]["tend"], sec.tend)) < 1e-3, f"Mnc {Mnc:.0f} kN m")
t("soffit stress is 0 at the decompression moment and f'ct.f at the cracking moment (1e-6 MPa)",
  abs(o["at"](o["Mdec"], False)["girBot"]) < 1e-6 and abs(o["at"](o["Mcr"] - Mnc, False)["girBot"] - o["fctf_girder"]) < 1e-6
  and abs(o["at"](o["McrH"] - Mnc, False)["deckTop"] - o["fctf_deck"]) < 1e-6)
# direct checks on the returned quantities
ec = elastic(sec, lv["Eg"])
dM = 500.0
a1 = o["sv"]["girBot"]
o2 = staged(sec, lv, Mnc, CASES[0]["Ms"] + dM, 0.0, 10000.0, 0.0, std, lim["fscr"], lim["ftcr"], lim["fscrT"])
exp = dM * 1e6 * (lv["Dtot"] - ec["yc"]) / ec["I"]
t("uncracked composite increment: soffit stress changes by dM (D - yc) / I (transformed, girder modulus; 1e-3)",
  abs((o2["sv"]["girBot"] - a1) / exp - 1) < 1e-3, f"{o2['sv']['girBot'] - a1:.4f} vs {exp:.4f} MPa")
kmin = std.get("AS5100.5:flexure:minimum_strength_factor").value
t("Muo,min = k Mcr (sagging) / k McrH (hogging); Mcr > Mdec > Mnc-free decompression ordering (Mdec < Mcr - Mnc)",
  abs(o["Muo_min"] - kmin * o["Mcr"]) < 1e-9 and abs(O[2]["Muo_min"] - kmin * O[2]["McrH"]) < 1e-9 and o["Mdec"] < o["Mcr"] - Mnc, f"Mdec {o['Mdec']:.0f}, Mcr {o['Mcr']:.0f}, McrH {o['McrH']:.0f} kN m")
t("allowable moment above decompression; increments at Mal at the limit (one of fscr / ftcr reached within 0.5 MPa)",
  o["Mal"] > o["Mdec"] and (abs(o["qa"]["b"] - lim["fscr"]) < 0.5 or abs(o["qa"]["t"] - lim["ftcr"]) < 0.5), f"Mal {o['Mal']:.0f}; dsb {o['qa']['b']:.1f}, dsp {o['qa']['t']:.1f}")

# --- the dashboard's dgLC (Node) on the same section and load cases ---
X = {"info": {"tD": lv["y_gir_top"], "H": lv["Dtot"] - lv["y_gir_top"], "Eg": lv["Eg"], "Ed": lv["Ed"], "fcg": lv["fcg"], "fcd": lv["fcd"], "Es": 200000, "Ep": sec.tend[0]["E"], "fsy": 500, "fpb": fpb},
     "S": {"conc": [dict(c, e0=0.0, grp="g" if c["grp"] == "girder" else "d") for c in sec.conc],
           "bars": [{"y": b["y"], "A": b["A"], "E": b["E"], "fsy": b["fsy"], "grp": "g" if b["grp"] == "girder" else "d"} for b in sec.bars],
           "tend": [{"y": x["y"], "A": x["A"], "E": x["E"], "fpb": x["fpb"], "eu": 0.035, "sp": x["sp"], "grp": "g"} for x in sec.tend]}, "solid": False}
LC = [dict(c, Mnc=Mnc, fscr=lim["fscr"], ftcr=lim["ftcr"], fscrT=lim["fscrT"], Vu=0, Tu=0) for c in CASES]
js = r"""
global.DSG=require(process.argv[1]+'/src/dsg_engine.js'); global.DSG2=require(process.argv[1]+'/src/dsg_engine2.js');
global.DG={nb:80, det:{}, detS:{}};
const s=require('fs').readFileSync(process.argv[1]+'/dist/BR13A_grillage_dashboard.html','utf8'); const i=s.indexOf('function dgLC(X, B, lc){'); const j=s.indexOf('\n}\n',i)+2;
eval(s.slice(i,j).replace('function dgLC(X, B, lc){','global.dgLC=function(X, B, lc){'));
const inp=JSON.parse(require('fs').readFileSync(0,'utf8')), X=inp.X, I=X.info, S=X.S;
const Sg={conc:S.conc.filter(c=>c.grp==='g'), bars:S.bars.filter(b=>b.grp==='g'), tend:S.tend};
const B={I:I, D:I.tD+I.H, eg:DSG.elastic(Sg,I.Eg), ec:DSG.elastic(S,I.Eg), fctfg:0.6*Math.sqrt(I.fcg), fctfd:0.6*Math.sqrt(I.fcd), fct25:0.25*Math.sqrt(I.fcg), dv:()=>0, dres:()=>0, geo:{ok:false, why:'n/a'}};
const fT=y=>1.0e-4*Math.max(0,1-y/300);
const out=inp.LC.map(lc=>{ if(lc.free) lc.free={T:fT, sh:-1.5e-4}; const o=dgLC(X,B,lc);
  return {Mdec:o.Mdec, Mal:o.Mal, MdecT:o.MdecT, MalT:o.MalT, Mcr:o.Mcr, McrH:o.McrH, uS:o.uS, uST:o.uST, uncr:o.uncr, Muomin:o.Muomin, phiMu:o.phiMu, Muo:o.Muo, phi:o.phi, kuo:o.kuo, Nub:o.Nub,
    g1top:o.g1top, g1bot:o.g1bot, sv:[o.sv.deckTop,o.sv.deckBot,o.sv.girTop,o.sv.girBot], sc:[o.sc.deckTop,o.sc.deckBot,o.sc.girTop,o.sc.girBot], incb:o.inc.b, inct:o.inc.t, dna:o.dna}; });
console.log(JSON.stringify(out));
"""
J = json.loads(subprocess.run(["node", "-e", js, R], input=json.dumps({"X": X, "LC": LC}), capture_output=True, text=True, check=True).stdout)
mom = ["Mdec", "Mal", "MdecT", "MalT", "Mcr", "McrH", "phiMu", "Muo"]
worst, where = 0.0, ""
for k, (py, d) in enumerate(zip(O, J)):
    P = {"Mdec": py["Mdec"], "Mal": py["Mal"], "MdecT": py["MdecT"], "MalT": py["MalT"], "Mcr": py["Mcr"], "McrH": py["McrH"], "phiMu": py.get("phiMu"), "Muo": py.get("Muo")}
    for m in mom:
        e = abs(P[m] - d[m])
        if e > worst:
            worst, where = e, f"LC{k + 1} {m}"
t("port = dashboard dgLC: Mdec, Mal, MdecT, MalT, Mcr, McrH, phi Mu, Muo on 4 load cases (sagging, axial + free strains, hogging, compression; 0.05 kN m)",
  worst < 0.05, f"max diff {worst:.2e} kN m ({where})")
ds = max(max(abs(a - b) for a, b in zip([py["sv"][q] for q in ("deckTop", "deckBot", "girTop", "girBot")], d["sv"])) for py, d in zip(O, J))
dc = max(max(abs(a - b) for a, b in zip([py["sc"][q] for q in ("deckTop", "deckBot", "girTop", "girBot")], d["sc"])) for py, d in zip(O, J))
dg = max(max(abs(py["girder_alone"]["top"] - d["g1top"]), abs(py["girder_alone"]["bot"] - d["g1bot"])) for py, d in zip(O, J))
t("port = dashboard: stage-1 girder stresses, uncracked and cracked composite fibre stresses at Ms (1e-4 MPa)", max(ds, dc, dg) < 1e-4, f"{dg:.1e} / {ds:.1e} / {dc:.1e} MPa")
t("port = dashboard: uncracked flag, uS, uST, Muo,min, phi, kuo, Nub, increments at Ms",
  all(py["uncracked"] == d["uncr"] and abs(py["uS"] - d["uS"]) < 1e-6 and abs(py["uST"] - d["uST"]) < 1e-6 and abs(py["Muo_min"] - d["Muomin"]) < 0.05
      and abs(py["phi"] - d["phi"]) < 1e-9 and abs(py["kuo"] - d["kuo"]) < 1e-6 and abs(py["Nub"] - d["Nub"]) < 1e-3
      and abs(py["inc"]["b"] - d["incb"]) < 1e-3 and abs(py["inc"]["t"] - d["inct"]) < 1e-3 for py, d in zip(O, J)))
pc = std.get("AS5100.5:capacity_factor:phi_compression").value
t("phi: compression load case between phi_compression and its bending phi; no axial force -> bending phi of kuo", pc <= O[3]["phi"] <= O[0]["phi"] + 1e-12 and abs(O[0]["phi"] - __import__("pdf2bim.design.flexure", fromlist=["Coefficients"]).Coefficients(std).phi(O[0]["kuo"])) < 1e-12,
  f"{O[0]['phi']:.3f} / {O[1]['phi']:.3f} / {O[3]['phi']:.3f}")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
