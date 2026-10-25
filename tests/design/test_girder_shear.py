#!/usr/bin/env python3
"""P4.5 stage 8 tests: closed-box torsion geometry (port of the dashboard's dgGeo), shear section data at a station,
and the shear / torsion results recorded in BR13A.girder_checks.json."""
import json, math, os, subprocess, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.design.girder_shear import box_params, box_geometry, shear_inputs
from pdf2bim.design.flexure import Section

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


p2 = {"D": 1515.0, "bw": 757.0, "tw": 100.0, "S": 10.556, "ttf": 90.0, "ifD": 75.0, "d1": 58.0, "d2": 265.0}
P = box_params(p2)
cases = [(200.0, 0.0, 40.0, 45.0, 12.0), (180.0, 20.0, 35.0, 50.0, 16.0)]
js = r"""
const s=require('fs').readFileSync(process.argv[1]+'/dist/BR13A_grillage_dashboard.html','utf8'); const i=s.indexOf('function dgGeo('); const j=s.indexOf('\n}\n',i)+2;
global.DG={det:{},detS:{}}; eval(s.slice(i,j).replace('function dgGeo(','global.dgGeo=function('));
const q=JSON.parse(require('fs').readFileSync(0,'utf8'));
console.log(JSON.stringify(q.cases.map(c=>{ DG.det={cs:c[2],ct:c[3],tvd:c[4]}; const X={P:q.P,info:{H:q.P.D,tD:c[0]+c[1]},solid:false}; const g=dgGeo(X,c[0]+c[1]+q.P.D); return {Ao:g.Ao,Aoh:g.Aoh,uh:g.uh,y1:g.y1,Acp:g.Acp,uc:g.uc,bv:g.bv,ok:g.ok}; })));
"""
J = json.loads(subprocess.run(["node", "-e", js, R], input=json.dumps({"P": P, "cases": cases}), capture_output=True, text=True, check=True).stdout)
worst = 0.0
for (tD, h, cs, ct, d), ref in zip(cases, J):
    g = box_geometry(P, tD, h, cs, ct, d)
    for k in ("Aoh", "uh", "y1", "Acp", "uc", "bv"):
        worst = max(worst, abs(g[k] - ref[k]) / max(1.0, abs(ref[k])))
    if h == 0:
        worst = max(worst, abs(g["Ao"] - ref["Ao"]) / ref["Ao"])
t("box geometry = the dashboard's dgGeo (Aoh, uh, y1, Acp, uc, bv; Ao without haunch; 1e-12)", worst < 1e-12 and all(r["ok"] for r in J), f"{worst:.1e}")
g = box_geometry(dict(P, n=1e12), 200.0, 0.0, 40.0, 45.0, 12.0)
t("vertical webs (n -> infinity): Acp = Bb Dc, uc = 2 (Bb + Dc) (closed form)", abs(g["Acp"] - P["Bb"] * g["Dc"]) < 1e-6 * g["Acp"] and abs(g["uc"] - 2 * (P["Bb"] + g["Dc"])) < 1e-6 * g["uc"])
gh = box_geometry(P, 200.0, 50.0, 40.0, 45.0, 12.0); g0 = box_geometry(P, 200.0, 0.0, 40.0, 45.0, 12.0)
t("a haunch lifts the deck mid-plane: Ao grows, the tie height y1 grows by the haunch", gh["Ao"] > g0["Ao"] and abs(gh["y1"] - g0["y1"] - 50.0) < 1e-9)
conc = [{"y": 50.0 + 100 * i, "h": 100.0, "b": 500.0, "E": 30000.0, "fc": 50.0} for i in range(20)]
sec = Section(conc, [{"y": 1950.0, "A": 400.0, "E": 200000.0, "fsy": 500.0}], [{"y": 1900.0, "A": 1000.0, "E": 195000.0, "fpb": 1800.0}])
fit = {"d": 12.0, "legs": 2, "s": 200.0, "tie_d": 12.0, "tie_legs": 1, "tie_s": 200.0, "fsyf": 500.0, "dg": 20.0}
Q = shear_inputs(sec, g0, {"Dtot": 2000.0, "fcg": 50.0, "Eg": 34800.0}, fit, {"fsy": 500.0, "Es": 200000.0, "Ep": 195000.0}, [0.005])
dres = (400 * 500 * 1950 + 1000 * 1800 * 1900) / (400 * 500 + 1000 * 1800)
t("section data: dv = max(0.72 D, 0.9 d_res) (yield-force weighted), Asv/s = legs pi d^2 / 4 / s, tension-half Ast, Apt, Act, spo = Ep pre0",
  abs(Q["dv"] - max(1440.0, 0.9 * dres)) < 1e-9 and abs(Q["AsvS"] - 2 * math.pi * 36 / 200) < 1e-12 and Q["Ast"] == 400 and Q["Apt"] == 1000 and abs(Q["Act"] - 500 * 100 * 10) < 1e-9 and abs(Q["spo"] - 195000 * 0.005) < 1e-9)
Z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.girder_checks.json"))); Z.pop("run_record", None)
rows = [r for G in Z.values() for r in G["rows"]]
sh = [r["shear"] for r in rows if "u" in r.get("shear", {})]
t("BR13A record: every open station has a shear / torsion result, u = max(uCr, uV, uT, uL)", len(sh) == len(rows) and all(abs(s["u"] - max(s["uCr"], s["uV"], s["uT"], s["uL"])) < 1e-12 for s in sh), f"{len(sh)} stations")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
