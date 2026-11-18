#!/usr/bin/env python3
"""Tier 1 item 1: transfer stresses, debonding (TfNSW BTD 2011/06) and development length (pdf2bim.design.prestress_checks)
on small hand-checkable inputs, plus one real description (B12452) for the debonding count."""
import json, math, os, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.design.prestress_checks import prestress_checks
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
# 2 x 3 strand grid at 50 mm, two strands debonded 2 m at end A only; 20 m girder
sx = [-50, 0, 50, -50, 0, 50]; sy = [60, 60, 60, 110, 110, 110]
sl = [{"d": 2000, "d2": 0}, {"d": 0, "d2": 0}, {"d": 2000, "d2": 0}, {"d": 0, "d2": 0}, {"d": 0, "d2": 0}, {"d": 0, "d2": 0}]
p = {"fci": 40.0, "sx": sx, "sy": sy, "sl": sl, "db": 15.2, "Ap": 143.0, "mbl": 261.0, "L": 20000.0, "ji": 0.75}
X = [0.0, 10000.0, 20000.0]
Pfin = [150.0] * 6                                     # kN per strand after losses: sigma_pe = 1049 MPa
r = {"X": X, "res": [{"t": 0, "P_st": [Pfin] * 3}],
     "st": [{"x": 0.0, "top": 10.0, "bot": 10.0}, {"x": 10000.0, "top": 0.0, "bot": 24.0}, {"x": 20000.0, "top": -2.0, "bot": 20.0}]}
o = prestress_checks(p, r, std, "Transport for NSW", [1.0, 5.0, 10.0])
T = o["transfer"]["rows"]
t("transfer: uniform stress uses 0.5 f'cp", abs(T[0]["k"] - 0.5) < 1e-12 and abs(T[0]["uC"] - 10 / 20) < 1e-12)
t("transfer: triangular stress uses 0.6 f'cp", abs(T[1]["k"] - 0.6) < 1e-12 and abs(T[1]["uC"] - 24 / 24) < 1e-12)
t("transfer: tension against 0.25 sqrt(f'cp)", abs(T[2]["uT"] - 2 / (0.25 * math.sqrt(40))) < 1e-12, f"{T[2]['uT']:.3f}")
t("transfer: tension also against 0.5 sqrt(f'cp) (bonded steel near the tension face)", abs(T[2]["uTa"] - 2 / (0.5 * math.sqrt(40))) < 1e-12 and o["transfer"]["ok_bonded"] and not o["transfer"]["ok"])
D = o["debonding"]
t("debonding: applies for a TfNSW client; 2 of 6 at end A, none at end B", D["applies"] and D["ends"]["A"]["n_debonded"] == 2 and D["ends"]["B"]["n_debonded"] == 0
  and abs(D["ends"]["A"]["worst_fraction"] - 1 / 3) < 1e-12)
t("debonding: strands 100 mm apart in a 50 mm grid are not adjacent", D["ends"]["A"]["adjacent_pairs"] == [] and D["ok"])
sl2 = [dict(q) for q in sl]; sl2[3]["d"] = 2000                         # strand above the first debonded one
p2 = dict(p, sl=sl2)
D2 = prestress_checks(p2, r, std, "Transport for NSW")["debonding"]["ends"]["A"]
t("debonding: vertically adjacent debonded pair is caught", len(D2["adjacent_pairs"]) == 1 and D2["adjacent_pairs"][0]["a"] == 0 and D2["adjacent_pairs"][0]["b"] == 3 and not D2["ok"])
sl3 = [dict(q) for q in sl]; sl3[1]["d"] = 1000; sl3[4]["d"] = 1000; sl3[5]["d"] = 3000
D3 = prestress_checks(dict(p, sl=sl3), r, std, "Transport for NSW")["debonding"]["ends"]["A"]
t("debonding: over 50 % at the end fails; fraction steps down past each debond length", not D3["ok"] and [round(q["fraction"], 4) for q in D3["fraction"]] == [round(5 / 6, 4), round(3 / 6, 4), round(1 / 6, 4)])
t("debonding: not applicable for another authority", not prestress_checks(p, r, std, "Department of Transport and Main Roads")["debonding"]["applies"])
V = o["development"]
fpb = 261e3 / 143.0; spe = 150e3 / 143.0; Lp = max(0.145 * (fpb - 0.67 * spe) * 15.2, 60 * 15.2)
s0 = V["strands"][0]; s1 = V["strands"][1]
t("development: Lp = 0.145 (fpb - 0.67 sigma_pe) db, doubled for a debonded strand", abs(s1["Lp"] - Lp) < 1e-9 and abs(s1["devA"] - Lp) < 1e-9 and abs(s0["devA"] - (2000 + 2 * Lp)) < 1e-9, f"Lp {Lp:.0f} mm")
fl = {q["x_m"]: q["n_partial"] for q in V["flagged_stations"]}
t("development: stations inside a development length are flagged with the right strand count", fl.get(1.0) == 4 and fl.get(5.0) == 2 and 10.0 not in fl, str(fl))
from pdf2bim.design.prestress_checks import strand_stress_cap
Lt = 60 * 15.2
c = [strand_stress_cap(s1, x, fpb, Lt) for x in (Lt / 2, Lt, (Lt + Lp) / 2, Lp + 1, 10000.0)]
t("capacity cap: sigma_pe within the transmission length, linear to fpb at Lp, fpb beyond",
  abs(c[0] - spe) < 1e-9 and abs(c[1] - spe) < 1e-9 and abs(c[2] - (spe + fpb) / 2) < 1e-6 and c[3] == fpb and c[4] == fpb, str([round(v) for v in c]))
t("capacity cap: debonded strand measured from its bond start, over 2 Lp", abs(strand_stress_cap(s0, 2000 + Lt + (2 * Lp - Lt) / 2, fpb, Lt) - (spe + fpb) / 2) < 1e-6)
C = o["cover"]
t("cover: no outline -> not checked", C["ok"] is None)
pc_ = dict(p, outline=[[-200, 0], [200, 0], [200, 300], [-200, 300]])        # 400 x 300 rectangle, strands 60 above the soffit
C = prestress_checks(pc_, r, std)["cover"]
t("cover: clear = 60 - db/2 to the soffit; required max(2 db, 40) without aggregate, flagged", abs(C["min_clear"] - (60 - 7.6)) < 1e-9 and C["required"] == 40
  and C["ok"] and C["aggregate_missing"], f"{C['min_clear']:.1f} >= {C['required']}")
C = prestress_checks(pc_, r, std, aggregate=40)["cover"]
t("cover: 1.5 x 40 mm aggregate = 60 governs and fails", C["required"] == 60 and not C["ok"])
pc2 = dict(pc_, sx=[-195] + sx[1:])
t("cover: strand 5 mm from a side face fails", not prestress_checks(pc2, r, std)["cover"]["rows"][0]["ok"])
t("results carry the unverified-standards status", o["standards_status"].startswith("UNVERIFIED"))

# real description: B12452 debonding count from its strand pattern
doc = json.load(open(os.path.join(R, "projects/B12452/B12452.bridge.0.2.json")))
T0 = doc["superstructure"]["supert_types"][0]
from pdf2bim.description import Reader
rows = [q for q in Reader(doc, True).rows(T0["strand_pattern"], "strand_pattern") if q.get("on", True) not in (False, 0)]
nd = sum(1 for q in rows if (q.get("debond_left") or 0) > 0)
pb = {"fci": 40.0, "sx": [q["x"] for q in rows], "sy": [q["y"] for q in rows], "sl": [{"d": q.get("debond_left") or 0, "d2": q.get("debond_right") or 0} for q in rows],
      "db": 15.7, "Ap": 150.0, "mbl": 279.0, "L": 33000.0, "ji": 0.75}
rb = {"X": [0.0, 33000.0], "res": [{"t": 0, "P_st": [[150.0] * len(rows)] * 2}], "st": []}
Db = prestress_checks(pb, rb, std, "Transport for NSW")["debonding"]["ends"]["A"]
t("B12452: debonded count and fraction from the drawing's strand pattern; no adjacent pairs", Db["n_debonded"] == nd and abs(Db["worst_fraction"] - nd / len(rows)) < 1e-12 and not Db["adjacent_pairs"],
  f"{nd} of {len(rows)}")

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
