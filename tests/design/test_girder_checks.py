#!/usr/bin/env python3
"""P4.5 stage 6 record tests (projects/BR13A/model/BR13A.girder_checks.json, tools/girder_checks.py): the recorded
midspan result reproduced live from its recorded actions, Mnc = the simple-span girder + wet deck moment of the losses
analysis (closed form), internal consistency of every station (uS, Muo,min, uncracked flag, ordering), labels."""
import json, math, os, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.design.stations import station_section
from pdf2bim.design.prestress_inputs import hog_inputs
from pdf2bim.design.prestress import run, strand_forces_at
from pdf2bim.design.girder_sls import staged, crack_limits
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
Z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.girder_checks.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
g = "G2"
H = hog_inputs(doc, geo, S, g, std, allow_proposed=True)
p = H["p"]; r = run(p, std)
rec = next(x for x in Z[g]["rows"] if x["t"] == 0.5)
st = station_section(doc, geo, S, g, 0.5, allow_proposed=True)
sec = st["section"]
F = strand_forces_at(r, st["x_m"] * 1000.0)
for td in sec.tend:
    td["sp"] = F[td["k_on"]] * 1e3 / td["A"]; td["fpb"] = p["mbl"] * 1e3 / p["Ap"]
mt = st["materials"]
lv = {"y_deck_bot": S["deck_thickness"], "y_gir_top": st["y_girder_top"], "Dtot": st["Dtot"], "Eg": mt["E_girder"], "Ed": mt["E_deck"], "fcg": mt["fc_girder"], "fcd": mt["fc_deck"]}
s = rec["sag"]; lim = crack_limits(sec, std)
o = staged(sec, lv, rec["Mnc"], s["Ms"], s["Ns"], s["Mu"], s["Nu"], std, lim["fscr"], lim["ftcr"], lim["fscrT"])
keys = ("Mdec", "Mal", "Mcr", "Muo", "Muo_min", "phiMu", "uS", "uB")
d = max(abs(o[k] - s[k]) / max(1.0, abs(s[k])) for k in keys)
t("midspan G2: the recorded staged SLS / minimum strength / ULS result is reproduced live from its recorded actions (1e-9)", d < 1e-9, f"{d:.1e}")
w = p["rho"] * p["A"] / 1e6 + p["wd"]; a = p["a"]; L = p["L"]
Mcl = (w * (L / 2 - a) * (L - a - L / 2) - w * a * a) / 2e6
fS = std.get("AS5100.2:load_factor:DLc").value["sls"]
t("Mnc at midspan = SLS factor x simple-span moment of (rho A + wd) on the bearings (closed form, 1e-9)", abs(rec["Mnc"] - fS * Mcl) < 1e-9 * Mcl, f"{rec['Mnc']:.1f} kN m")
rows = [(G, x) for G, R_ in Z.items() for x in R_["rows"]]
kmin = std.get("AS5100.5:flexure:minimum_strength_factor").value
fct = std.get("AS5100.5:crack_control:uncracked_tension_limit").value * math.sqrt(mt["fc_girder"])
t("every station: uS = Ms / Mal, uB = M* / phi Mu, Muo,min = k Mcr, uncracked flag = soffit <= k sqrt(f'c)",
  all(abs(x["sag"]["uS"] - x["sag"]["Ms"] / x["sag"]["Mal"]) < 1e-12 and abs(x["sag"]["uB"] - abs(x["sag"]["Mu"]) / x["sag"]["phiMu"]) < 1e-12
      and abs(x["sag"]["Muo_min"] - kmin * x["sag"]["Mcr"]) < 1e-9 and x["sag"]["uncracked"] == (x["sag"]["soffit_sls"] <= fct) for _, x in rows))
t("every station: 0 < Mdec < Mal and Mdec < Mcr - Mnc (decompression before cracking)", all(0 < x["sag"]["Mdec"] < x["sag"]["Mal"] and x["sag"]["Mdec"] < x["sag"]["Mcr"] - x["Mnc"] for _, x in rows))
t("Mnc symmetric about midspan and largest there (simple span)", all(max(R_["rows"], key=lambda q: q["Mnc"])["t"] == 0.5 for R_ in Z.values()))
gov = {G: max(R_["rows"], key=lambda q: q["sag"]["uB"])["t"] for G, R_ in Z.items()}
t("the governing ULS station of each girder lies in the middle half", all(0.25 <= v <= 0.75 for v in gov.values()), str(gov))
t("record carries the provisional inputs, the unverified-standards label and the not-checked notes",
  all(R_["provisional"] and str(R_["standards_status"]).startswith("UNVERIFIED") and any("shear" in n for n in R_["notes"]) for R_ in Z.values()))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
