#!/usr/bin/env python3
"""P4.5 stage 4a tests: design sections at stations, built from the P2 geometry and the description — strip properties
equal the P2 composite properties (open and solid-end), steel from the strand pattern and bars (depth conversion,
debonding, on / off), and refusals / missing-input reporting (BR13A: strand fpb, effective prestress, fitments, deck
bars)."""
import copy, json, math, os, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import MissingInput
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.design.stations import station_section, readiness
from pdf2bim.design.flexure import Section, elastic, uls_bend
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


doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
worst = 0.0
for g in S["girders"]:
    G = S["girders"][g]
    for row in G["stations"]:
        st = station_section(doc, geo, S, g, row["t"], allow_proposed=True)
        if st["conf"] != "open":
            continue
        e = elastic(Section(st["section"].conc), st["materials"]["E_girder"])
        c = row["composite"]
        worst = max(worst, abs(e["A"] / c["A_transformed"] - 1), abs((st["Dtot"] - e["yc"]) - c["yc"]) / st["Dtot"], abs(e["I"] / c["Ix"] - 1))
t("open stations, every girder: strip A, centroid and I (deck transformed by E) = the P2 composite properties (2 mm strips: 2e-4)", worst < 2e-4, f"{worst:.1e}")
G = S["girders"]["G2"]
st0 = station_section(doc, geo, S, "G2", 0.0, allow_proposed=True)
c0 = G["solid_end"]["A"]["composite"]
e0 = elastic(Section(st0["section"].conc), st0["materials"]["E_girder"])
t("solid-end station (inside the end-A zone): solid outline; strip properties = the P2 solid composite (2e-4)",
  st0["conf"] == "solid" and abs(e0["A"] / c0["A_transformed"] - 1) < 2e-4 and abs((st0["Dtot"] - e0["yc"]) - c0["yc"]) < 2e-4 * st0["Dtot"] and abs(e0["I"] / c0["Ix"] - 1) < 2e-4)
st = station_section(doc, geo, S, "G2", 0.5, allow_proposed=True)
T = doc["superstructure"]["supert_types"][0]
on = [r["cells"] for r in T["strand_pattern"]["rows"] if r["cells"]["on"]]
area = doc["materials"]["strand"]["rows"][0]["cells"]["area"]
t("strands: every 'on' strand at depth Dtot - y (y from the soffit), area from the strand material",
  st["n_strands"] == len(on) and sorted(round(x["y"], 6) for x in st["section"].tend) == sorted(round(st["Dtot"] - r["y"], 6) for r in on) and all(x["A"] == area for x in st["section"].tend))
nb = sum(r["cells"]["number"] * math.pi / 4 * r["cells"]["diameter"] ** 2 for r in T["bars"]["rows"])
t("bars: area = number x pi d^2 / 4 at depth Dtot - y; fsy, Es from the reinforcement material", abs(sum(b["A"] for b in st["section"].bars) - nb) < 1e-6 and all(b["fsy"] == 500 for b in st["section"].bars))
d2 = copy.deepcopy(doc)
rows = d2["superstructure"]["supert_types"][0]["strand_pattern"]["rows"]
rows[0]["cells"]["debond_left"] = 3000; rows[1]["cells"]["on"] = False
S2 = build_sections(d2, geo, allow_proposed=True)
a1 = station_section(d2, geo, S2, "G2", 0.0, allow_proposed=True); a2 = station_section(d2, geo, S2, "G2", 0.5, allow_proposed=True)
t("debonding: a strand debonded 3 m from end A is absent at the end A station, present at midspan; an 'off' strand is absent everywhere",
  a1["n_strands"] == len(on) - 2 and a2["n_strands"] == len(on) - 1)
miss = st["missing"]
t("BR13A missing inputs reported: strand fpb, effective prestress (no losses analysis yet), fitments, deck bars",
  any("strand.fpb" in m for m in miss) and any("effective prestress" in m for m in miss) and any("fitments" in m for m in miss) and any("deck_bars" in m for m in miss))
t("design checks refuse a station without effective prestress / fpb (no guessed values)", raises(lambda: uls_bend(st["section"], Standards()), ValueError, "effective prestrain"))
t("station not built in P2 refused with the nearest station", raises(lambda: station_section(doc, geo, S, "G2", 0.55, allow_proposed=True), MissingInput, "nearest"))
rdy = readiness(doc, geo, S, allow_proposed=True)
t("readiness: one entry per girder with strands, bars and the missing list", set(rdy) == set(S["girders"]) and all("missing" in v for v in rdy.values()))
t("provisional inputs carried (proposed decisions used)", len(st["provisional"]) > 0)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
