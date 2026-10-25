#!/usr/bin/env python3
"""P4.5 stage 5c tests: girder ULS flexure along the girder — effective prestrain per strand from the losses analysis
at the station position, fpb from Table 3.3.1, the recorded result reproduced live at midspan, action mapping to the
nearest girder element end, symmetry / monotonic checks of the strength profile."""
import json, math, os, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.design.stations import station_section
from pdf2bim.design.prestress_inputs import hog_inputs
from pdf2bim.design.prestress import run, strand_forces_at
from pdf2bim.design.flexure import uls_bend
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
Z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.girder_flexure.json")))
g = "G2"
H = hog_inputs(doc, geo, S, g, std, allow_proposed=True)
p = H["p"]; r = run(p, std)
st = station_section(doc, geo, S, g, 0.5, allow_proposed=True)
F = strand_forces_at(r, st["x_m"] * 1000.0)
for td in st["section"].tend:
    td["epe"] = F[td["k_on"]] * 1e3 / (td["A"] * td["E"])
    td["fpb"] = p["mbl"] * 1e3 / p["Ap"]
u = uls_bend(st["section"], std)
rec = next(x for x in Z[g]["rows"] if x["t"] == 0.5)
t("midspan G2: the recorded phi Mu is reproduced live (effective prestrain from the losses run, fpb = MBL / area; 1e-9)", abs(u["phiMu"] - rec["phiMu"]) < 1e-9 * rec["phiMu"], f"{u['phiMu']:.1f} kN m")
t("effective prestress at midspan within the jacking stress and above the long-term range lower bound (0.4 fpb)",
  all(0.4 * p["mbl"] * 1e3 / p["Ap"] < td["epe"] * td["E"] < p["ji"] * p["mbl"] * 1e3 / p["Ap"] for td in st["section"].tend))
t("each tendon's prestrain comes from its own strand of the losses analysis (pattern order)", sorted(td["k_on"] for td in st["section"].tend) == list(range(len(p["sy"]))))
rows_all = [x for G in Z.values() for x in G["rows"]]
t("action mapping: M* interpolated between the two girder element ends bracketing each station (bracket contains the station, nearer end within 1.6 m)",
  all(x["bracket_m"][0] - 1e-9 <= x["x_m"] <= x["bracket_m"][1] + 1e-9 and x["dist_to_station_m"] < 1.6 for x in rows_all), f"max {max(x['dist_to_station_m'] for x in rows_all):.2f} m")
t("every station has M* > 0 (sagging), phi Mu > 0 and u = M* / phi Mu", all(x["M_sag"] > 0 and x["phiMu"] > 0 and abs(x["u_sag"] - x["M_sag"] / x["phiMu"]) < 1e-12 for x in rows_all))
mid = {G: max(R_["rows"], key=lambda x: x["u_sag"]) for G, R_ in Z.items()}
t("the governing station of each girder lies in the middle half of the span", all(0.25 <= m_["t"] <= 0.75 for m_ in mid.values()), str({k: v["t"] for k, v in mid.items()}))
t("phi Mu varies little along the girder (same strands, effective prestress near the plateau: within 2 %)",
  all(max(x["phiMu"] for x in R_["rows"]) / min(x["phiMu"] for x in R_["rows"]) - 1 < 0.02 for R_ in Z.values()))
t("record carries the provisional inputs and the unverified-standards label", all(R_["provisional"] and str(R_["standards_status"]).startswith("UNVERIFIED") for R_ in Z.values()))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
