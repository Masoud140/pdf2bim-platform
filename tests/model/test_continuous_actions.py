#!/usr/bin/env python3
"""Continuous spans stage 2b: combination primitives and envelopes on the joined SB41 WB model (pdf2bim/model/continuous.py).
Run: python3 tests/model/test_continuous_actions.py   (coarse traffic grid to keep it to a few minutes)"""
import json, os, sys
import numpy as np
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.responses import ResponseSet
from pdf2bim.model.loads import sdl_case
from pdf2bim.model import continuous as C
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


std, spans = Standards(), []
for s in (1, 2):
    d = json.load(open(os.path.join(R, f"projects/B12459-S{s}/B12459-S{s}.bridge.0.2.json")))
    g = build_geometry(d, allow_proposed=True); S = build_sections(d, g, allow_proposed=True)
    spans.append((d, g, S, build_integrated(d, g, S, std, allow_proposed=True)))
J = C.join([x[3] for x in spans])
CA = C.combined_actions(spans, J, std, allow_proposed=True, traffic_kw={"dc": 1.0, "sweep_step": 1.0, "lateral": False})
P, N = CA["primitives"]["prim"], CA["names"]
RS = CA["primitives"]["response_set"]
ix = {n: i for i, n in enumerate(N)}
fz = [ix[("B", k, "FZ")] for k in J["bearings"]]

t("no combination term missing; earthquake combined (RSA on the joined model)", not CA["missing_terms"] and not CA["not_combined"] and "EQX" in CA["primitives"]["prim"],
  f"{CA['missing_terms']} {CA['not_combined']}")
Q = CA["primitives"]["cases"]["earthquake"]
t("earthquake on the joined model: longitudinal and transverse modal effective mass fractions above 50 % (L and T)",
  all(Q["resp"][d_]["effective_mass_fraction"] > 0.5 for d_ in ("L", "T")), str({d_: round(Q["resp"][d_]["effective_mass_fraction"], 3) for d_ in ("L", "T")}))
from pdf2bim.model.horizontal import horizontal_cases
Fb = max(horizontal_cases(d, g, sup, std, allow_proposed=True)["cases"]["BRKp"]["total"] for d, g, S, sup in spans)
fx = [ix[("B", k, c)] for k in J["bearings"] for c in ("FX", "FY")]
brk_long = np.hypot(sum(P["BRKR"]["s"][ix[("B", k, "FX")]] for k in J["bearings"]), sum(P["BRKR"]["s"][ix[("B", k, "FY")]] for k in J["bearings"]))
t("braking: the bridge force once over the whole deck (bearing horizontal resultant <= the braking force, not twice it)",
  brk_long <= Fb * 1.001 + 1e-6, f"{brk_long:.1f} vs {Fb}")
sdl = sum(sum(f[2] for f in sdl_case(d, g, sup, allow_proposed=True, part="SDLp")["loads"].values()) for d, g, S, sup in spans)
t("SDLp on the joined model: bearing reactions carry the two spans' SDL exactly", abs(P["SDLp"]["s"][fz].sum() + sdl) < 1e-6 * abs(sdl), f"{P['SDLp']['s'][fz].sum():.2f} vs {-sdl:.2f}")
stg = CA["primitives"]["staging"]
t("staging read from the description: custom.continuity_staging = girder (0575 notes)", stg["kind"] == "girder")
parts = [(k, RS_, C._gravity_part(RS_, "girder")) for k, RS_ in ((k, ResponseSet(x[3])) for k, x in enumerate(spans))]
t("DLc staged: girder self weight carried over from the simply supported spans + the rest on the joined model",
  np.allclose(P["DLc"]["s"], C.from_spans(J, RS, parts) + C._gravity_part(RS, "rest")) and np.allclose(stg["simply_supported"], C.from_spans(J, RS, parts)))
full = [(k, RS_, RS_.static(gravity=(0, 0, -1))) for k, RS_ in ((k, ResponseSet(x[3])) for k, x in enumerate(spans))]
pierfz = [ix[("B", k, "FZ")] for k, b in J["bearings"].items() if b["support"] == "P1"]
t("staged self weight on the bearings = the joined model's own self weight there (only its distribution changes)",
  abs(P["DLc"]["s"][fz].sum() - RS.static(gravity=(0, 0, -1))[fz].sum()) < 1e-6 * abs(P["DLc"]["s"][fz].sum()))
t("deck cast on the continuous girders: pier bearings carry more than with all self weight simply supported",
  P["DLc"]["s"][pierfz].sum() > C.from_spans(J, RS, full)[pierfz].sum(), f"{P['DLc']['s'][pierfz].sum():.0f} vs {C.from_spans(J, RS, full)[pierfz].sum():.0f}")
gm = [i for i, n in enumerate(N) if n[0] == "G" and n[1][0] == "41B-S1-09" and n[2][0] == "M"]
t("SDLp continuous: girder 41B-S1-09 hogs over the pier", min(P["SDLp"]["s"][gm]) < 0, f"{min(P['SDLp']['s'][gm]):.1f}")
t("positive gradient on the continuous structure: restraint moments in the girder (non-zero)", "TGP" in P and np.abs(P["TGP"]["s"][gm]).max() > 1.0)
U = CA["envelopes"]["ULS"]
t("ULS envelope: 41B-S1-09 sags and hogs (M max > 0 > M min)", max(U["max"][gm]) > 0 > min(U["min"][gm]), f"{max(U['max'][gm]):.0f} / {min(U['min'][gm]):.0f}")
mv = [k for k in ("M1600", "S1600") if k in P]
t("moving loads over the joined deck give pier hogging", mv and min(P[mv[0]]["min"][gm]) < 0)
from pdf2bim.model.traffic import Influence, platform_effect
hv = std.get("AS5100.2:traffic:HLP400").value
sel = [i for i, n in enumerate(N) if n[0] == "G" and n[2][0] == "M"]
Tr = CA["primitives"]["cases"]["traffic"]
oc = Tr["carriageway_centre"]
inf = Influence(J, responses=RS)
import math as _m
grid = inf.c0 + 1.0 * np.arange(int(_m.floor((inf.c1 - inf.c0) / 1.0)) + 1)
one = platform_effect(inf, grid, 1.0, dict(hv, split=False), oc)
two = platform_effect(inf, grid, 1.0, dict(hv, split=True), oc)
t("HLP on the joined deck: central-gap variants give at least the one-train hogging and more at some girder response",
  np.all(two[1][sel] <= one[1][sel] + 1e-9) and np.any(two[1][sel] < one[1][sel] - 1.0), f"{min(two[1][sel]):.0f} vs {min(one[1][sel]):.0f}")
from pdf2bim.design.girder_design import checks_along
pier = {}
for k, gid in ((0, "41B-S1-09"), (1, "41B-S2-09"), (1, "41B-S2-01")):
    d, g, S, _ = spans[k]
    CA["primitives"]["cases"]["thermal"] = CA["primitives"]["cases"]["thermal_spans"][k]
    Rg = checks_along(d, g, S, CA, J, std, gid, allow_proposed=True, stations=[0, 0.9, 1.0] if k == 0 else [0, 0.1, 1.0])
    pier[gid] = {r["t"]: r for r in Rg["rows"]}
q1, q2 = pier["41B-S1-09"][1.0].get("pier_hog"), pier["41B-S2-09"][0].get("pier_hog")
t("pier hogging check only at the girder ends over P1 (S1 end B, S2 end A)", q1 and q2 and "pier_hog" not in pier["41B-S1-09"][0] and "pier_hog" not in pier["41B-S2-09"][1.0])
t("pier hogging M* taken at the bearing node, not the free end stub", q1["Mu"] < -1000 and q2["Mu"] < -1000, f"{q1['Mu']:.0f} / {q2['Mu']:.0f}")
t("stress bars at lock-off raise the section capacity (Mu_cap) over the deck bars alone", abs(q1["at_lockoff"]["Mu_cap"]) > abs(q1["no_bars"]["Mu_cap"]))
t("bar force required reported (0 when the deck bars suffice) and the UTS flagged missing", q1["F_required_kN"] is not None and q1["uts_kN"] in (None, "") and q1["why"])
t("skewed pier: the far girder 41B-S2-01 (bearing chainage several m from the pier CL) still gets its pier check at end A",
  pier["41B-S2-01"][0].get("pier_hog") is not None)
h9 = pier["41B-S1-09"][0.9]["hog"]
t("open station 0.9 on the continuous run: deck bars in the section give a hogging capacity well above the strands-only value (~1,400)", abs(h9["phiMu"]) > 5000, f"{h9['phiMu']:.0f}")
print(f"     41B-S1-09 over P1: M* {q1['Mu']:,.0f}, phi Mu {q1['no_bars']['phiMu']:,.0f} (deck bars) / {q1['at_lockoff']['phiMu']:,.0f} (+ bars at lock-off), report phi Mu 14,698")
print(f"     41B-S1-09 ULS (coarse traffic grid): sag {max(U['max'][gm]):,.0f} kNm, hog {min(U['min'][gm]):,.0f} kNm")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
