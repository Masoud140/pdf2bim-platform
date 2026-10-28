#!/usr/bin/env python3
"""P3b MIDAS .mct writer tests. These check the CONTENT of the file and its reading by two independent parsers (the
platform's reader and the dashboard's AN.parseMCT). They do NOT prove that MIDAS imports it: that needs the engineer's
import test (MCT_EXPORT_METHOD §0)."""
import copy, json, os, re, shutil, subprocess, sys, tempfile
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.model.mct import write_mct, read_mct
from pdf2bim.model.solver import Model
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.builder import build_superstructure
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


def rebuild(Rd, base):
    m = Model()
    for n, (x, y, z) in Rd["nodes"].items():
        m.node(n, x + base[0], y + base[1], z)
    for e, (mt, sc, n1, n2) in Rd["els"].items():
        a, s = Rd["mats"][mt], Rd["secs"][sc]
        m.beam(e, n1, n2, a["E"], a["nu"], s["A"], s["Iy"], s["Iz"], s["J"], s["Asy"] or None, s["Asz"] or None, w=a["den"] * s["A"],
               off=((0, 0, s["dz"]), (0, 0, s["dz"])) if s.get("dz") else None, rel=Rd["rels"].get(e))
    for i, l in enumerate(Rd["links"], 1):
        m.link(i, l["n1"], l["n2"], l["k"], beta=l["beta"], dry=l["dry"], drz=l["drz"])
    for n, k in Rd["springs"]:
        m.spring(n, k)
    for ids, f in Rd["cons"]:
        for n in ids:
            m.fix(n, f[:6])
    return m


doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
txt, rep = write_mct(M, doc, title="test")
Rd = read_mct(txt)
base = rep["base_point"]
bp = next(r["cells"] for r in doc["project"]["base_point"]["rows"])
t("coordinates shifted by the documented project base point (no arbitrary origin)", base == (float(bp["E"]), float(bp["N"])))
inv = {v: k for k, v in rep["node_map"].items()}
dxy = max(max(abs(Rd["nodes"][i][0] + base[0] - M["model"].nodes[inv[i]][0]), abs(Rd["nodes"][i][1] + base[1] - M["model"].nodes[inv[i]][1]),
              abs(Rd["nodes"][i][2] - M["model"].nodes[inv[i]][2])) for i in Rd["nodes"])
t("every node written to 0.01 mm (5 decimals in m)", dxy <= 5e-6 + 1e-9, f"{dxy * 1000:.4f} mm")
t("counts: nodes, elements, links, springs, supports equal the model", (len(Rd["nodes"]), len(Rd["els"]), len(Rd["links"]), len(Rd["springs"]), sum(len(i) for i, _ in Rd["cons"]))
  == (len(M["model"].nodes), len(M["model"].beams), len(M["model"].links), len(M["model"].springs), len(M["model"].fixed)))
names = [m_["name"] for m_ in Rd["mats"].values()] + re.findall(r"^\s+\d+, (?:VALUE|DBUSER), ([^,]+),", txt, re.M) + re.findall(r"SECT= *\d+, COMPOSITE-GEN, ([^,]+),", txt)
t("material and section names at most 16 characters (MIDAS limit)", all(len(n.strip()) <= 16 for n in names), str(max(len(n.strip()) for n in names)))
t("piles written as DBUSER SR solid circle (native BR13B syntax), not VALUE", re.search(r"DBUSER, [^,]+, CC, 0, 0, 0, 0, 0, 0, YES, NO, SR , 2, 1.05, 0, 0, 0, 0, 0, 0, 0, 0, 0$", txt, re.M) is not None)
sl = [i for i, x in enumerate(M["members"]) if x.get("role") == "slab"]
t("deck strips drawn (DBUSER SB) with J kept by *SECT-SCALE: read-back J = written J",
  sl and all(abs(Rd["secs"][Rd["els"][rep["element_map"][M["members"][i]["id"]]][1]]["J"] / M["model"].beams[M["members"][i]["id"]]["J"] - 1) < 1e-5 for i in sl)
  and "*SECT-SCALE" in txt and not re.search(r"VALUE, S\d+_slab", txt))
t("composite girders written as COMPOSITE-GEN (girder + deck polygons), none left as VALUE",
  txt.count("COMPOSITE-GEN, S") == len({rep["element_map"][x["id"]] for x in M["members"] if x["role"] == "girder"} and {Rd["els"][rep["element_map"][x["id"]]][1] for x in M["members"] if x["role"] == "girder"})
  and not re.search(r"VALUE, S\d+_girder", txt) and txt.count("OPOLY=") == 2 * txt.count("COMPOSITE-GEN, S"))
t("file is plain ASCII", all(ord(c) < 128 for c in txt))
t("unverified blocks are marked in the file and listed in the report", rep["unverified_blocks"] == ["*ELASTICLINK", "*SPRING"]
  and txt.count("UNVERIFIED SYNTAX") == 2 and "*BEAMEND" not in txt and "NEEDS ENGINEER IMPORT TEST" in rep["status"])
m2 = rebuild(Rd, base)
r1 = M["model"].solve(); r2 = m2.solve(gravity=Rd["selfweight"])
U1 = np.concatenate([r1["u"][inv[n]] for n in sorted(inv)]); U2 = np.concatenate([r2["u"][n] for n in sorted(inv)])
t("round trip (write -> read -> solve): self weight equal to 1e-6 relative", abs(r1["applied"][2] / r2["applied"][2] - 1) < 1e-6, f"{r1['applied'][2]:.4f} vs {r2['applied'][2]:.4f}")
Tr = np.tile([1, 1, 1, 0, 0, 0], len(inv)).astype(bool)
t("round trip: every translation equal to 1e-5 of the largest (written precision)", abs(U1 - U2)[Tr].max() <= 1e-5 * abs(U1[Tr]).max(), f"{abs(U1 - U2)[Tr].max() / abs(U1[Tr]).max():.1e}")
# rotations: 1e-3 — with rigid-arm releases (ADR-042) the web-line nodes' rotation about the line is held only by the nominal
# web member's torsion (girder-alone x 1e-3), so it is ill-conditioned and meaningless; translations are what the model is read for
t("round trip: every rotation equal to 1e-3 of the largest", abs(U1 - U2)[~Tr].max() <= 1e-3 * abs(U1[~Tr]).max(), f"{abs(U1 - U2)[~Tr].max() / abs(U1[~Tr]).max():.1e}")
gw = [b for i, b in M["model"].beams.items() if M["members"] and next((x for x in M["members"] if x["id"] == i), {}).get("role") == "girder"]
t("composite girders keep the GROSS weight on the transformed section (density = w / A per material)",
  all(abs(Rd["mats"][Rd["els"][rep["element_map"][i]][0]]["den"] * Rd["secs"][Rd["els"][rep["element_map"][i]][1]]["A"] - b["w"]) < 1e-5 * b["w"]
      for i, b in M["model"].beams.items() if b["w"] > 0))
mass0 = [i for i, b in M["model"].beams.items() if b["w"] == 0]
t("massless members (dummies, deck strips, rigid) get a density-0 material", all(Rd["mats"][Rd["els"][rep["element_map"][i]][0]]["den"] == 0 for i in mass0), f"{len(mass0)} members")
txt2, rep2 = write_mct(M, doc, title="test", include_unverified=False)
t("verified-only mode omits links and springs and says the model is then incomplete",
  "*ELASTICLINK" not in txt2 and "*SPRING" not in txt2
  and set(rep2["not_written"]) == {"*ELASTICLINK", "*SPRING"} and "incomplete" in txt2)
Mg = build_superstructure(doc, geo, S, allow_proposed=True)
try:
    write_mct(Mg, doc); ok = False
except ValueError as e:
    ok = "explicit axes" in str(e)
t("links with explicit axes (P3a ground links) are refused, not written with a guessed angle", ok)
m3 = copy.deepcopy(M); m3["model"].load(next(iter(m3["model"].nodes)), (0, 0, -1, 0, 0, 0))
t3, r3 = write_mct(m3, doc)
t("nodal loads stored on the model itself are not written (they go in as a load case) and the report says so", not re.search(r"^\*CONLOAD", t3, re.M) and any("cases=" in x for x in r3["not_written"]))

# dashboard's own parser (independent reading of the same syntax)
node = shutil.which("node")
if node:
    d = tempfile.mkdtemp()
    fp = os.path.join(d, "t.mct"); open(fp, "w").write(txt)
    env = dict(os.environ, NODE_PATH=os.environ.get("NODE_PATH", "/opt/npm-tools/node_modules"))
    out = subprocess.run([node, os.path.join(R, "tools/check_mct_dashboard.js"), fp], capture_output=True, text=True, env=env, timeout=240)
    try:
        D = json.loads(out.stdout)
        t("dashboard parser: same counts (nodes, elements, materials, sections, links), no warnings",
          (D["nodes"], D["els"], D["mats"], D["secs"], D["links"], D["warn"]) == (rep["nodes"], rep["elements"], rep["materials"], rep["sections"], rep["links"], []), str(D["warn"][:3]))
        t("dashboard parser: same self weight (density x area x length) to 1e-6", abs(D["weight"] / -r1["applied"][2] - 1) < 1e-6, f"{D['weight']:.3f}")
        lk = sorted((l["n1"], l["n2"]) for l in D["links_k"]) == sorted((l["n1"], l["n2"]) for l in Rd["links"])
        t("dashboard parser: links read with the same nodes and stiffness vector", lk and all(abs(a - b) <= 1e-4 * max(abs(b), 1) for l, q in zip(sorted(D["links_k"], key=lambda x: x["n1"]), sorted(Rd["links"], key=lambda x: x["n1"])) for a, b in zip(l["k"], q["k"])))
    except Exception as e:
        t("dashboard parser ran", False, f"{e}; {out.stderr[-300:]}")
else:
    t("dashboard parser check: node not available (NOT RUN)", False)
# load cases as *CONLOAD (native BR13B syntax): every case solves the same from the file as from the model
from pdf2bim.model.loads import sdl_case
from pdf2bim.model.horizontal import horizontal_cases
from pdf2bim.model.wind import wind_cases
Cs = {"SDL": {"type": "D", "loads": sdl_case(doc, geo, M, allow_proposed=True)["loads"]}}
Hc = horizontal_cases(doc, geo, M, Standards(), allow_proposed=True)["cases"]
Wc = wind_cases(doc, geo, S, M, allow_proposed=True)["cases"]
Cs.update({"BRK+": {"type": "BRK", "loads": Hc["BRKp"]["loads"]}, "EP": {"type": "EP", "loads": Hc["EP"]["loads"]}, "WT+": {"type": "W", "loads": Wc["WT+"]["loads"]}})
txt3, rep3 = write_mct(M, doc, title="test", cases=Cs)
Rd3 = read_mct(txt3); m3 = rebuild(Rd3, base)
ok, worst = True, 0.0
for k, v in Cs.items():
    nm_ = k.replace("+", "p").replace("-", "m")
    fl = {inv[n]: f for n, f in Rd3["cases"][nm_].items()}
    tot = lambda L: np.sum([np.asarray(f)[:3] for f in L.values()], axis=0)
    ok &= np.allclose(tot(fl), tot(v["loads"]), atol=1e-6)
    ra = M["model"].solve(gravity=(0, 0, 0), loads=v["loads"]); rb = m3.solve(gravity=(0, 0, 0), loads={n: f for n, f in Rd3["cases"][nm_].items()})
    Ua = np.concatenate([ra["u"][inv[n]][:3] for n in sorted(inv)]); Ub = np.concatenate([rb["u"][n][:3] for n in sorted(inv)])
    worst = max(worst, abs(Ua - Ub).max() / abs(Ua).max())
t("load cases (SDL, braking, earth pressure, wind) written as *CONLOAD: totals equal, every translation equal to 1e-5 from the file",
  ok and worst < 1e-5 and rep3["load_cases"] == ["SDL", "BRKp", "EP", "WTp"] and txt3.count("*USE-STLD") == 5, f"{worst:.1e}")
# temperature / shrinkage (native *ELTEMPER, *BSTEMPER): read back -> same imposed strains -> same response
from pdf2bim.model.thermal import thermal_cases
Th = thermal_cases(doc, geo, S, M, allow_proposed=True)
al = Th["inputs"]["temperature"]["alpha"]
strain = lambda imp: {e: (u[6] / np.linalg.norm(M["model"].nodes[M["model"].beams[e]["n2"]] - M["model"].nodes[M["model"].beams[e]["n1"]]),
                          u[10] / np.linalg.norm(M["model"].nodes[M["model"].beams[e]["n2"]] - M["model"].nodes[M["model"].beams[e]["n1"]])) for e, u in imp.items()}
Ct = {k: {"type": "T", "strain": strain(v["imposed"])} for k, v in Th["cases"].items()}
txt4, rep4 = write_mct(M, doc, title="test", cases=Ct, alpha=al)
Rd4 = read_mct(txt4); m4 = rebuild(Rd4, base)
einv4 = {v: k for k, v in rep4["element_map"].items()}
worst4, blocks4 = 0.0, set()
for k, v in Th["cases"].items():
    imp = {}
    for e, tt in Rd4["temps"][k.replace("+", "p").replace("-", "m")].items():
        ms, sc = Rd4["mats"][Rd4["els"][e][0]], Rd4["secs"][Rd4["els"][e][1]]
        n1, n2 = Rd4["els"][e][2], Rd4["els"][e][3]; Le = np.linalg.norm(m4.nodes[n2] - m4.nodes[n1])
        if tt[0] == "T":
            e0, ph = ms["alpha"] * tt[1], 0.0; blocks4.add("ELTEMPER")
        else:
            B, H1, T1, H2, T2 = tt[1:]; yt, yb = sc["H"] - sc["czb"], -sc["czb"]
            bb = (T2 - T1) / (yb - yt); aa = T1 - bb * yt
            e0 = ms["alpha"] * B * (aa * (yt - yb) + bb * (yt ** 2 - yb ** 2) / 2) / sc["A"]
            ph = ms["alpha"] * B * (aa * (yt ** 2 - yb ** 2) / 2 + bb * (yt ** 3 - yb ** 3) / 3) / sc["Iy"]; blocks4.add("BSTEMPER")
        u = np.zeros(12); u[6] = e0 * Le; u[8] = -ph * Le * Le / 2; u[10] = ph * Le; imp[e] = u
    ra = M["model"].solve(gravity=(0, 0, 0), loads={}, imposed=v["imposed"]); rb = m4.solve(gravity=(0, 0, 0), loads={}, imposed=imp)
    Ua = np.concatenate([ra["u"][inv[n]][:3] for n in sorted(inv)]); Ub = np.concatenate([rb["u"][n][:3] for n in sorted(inv)])
    worst4 = max(worst4, abs(Ua - Ub).max() / abs(Ua).max())
t("temperature (TU+/-), shrinkage (SCR) as *ELTEMPER and gradients (TGP/TGN) as one *BSTEMPER band: same response from the file to 1e-5",
  worst4 < 1e-5 and blocks4 == {"ELTEMPER", "BSTEMPER"} and f"{al:.6g}" in txt4.split("*MATERIAL")[1].split("*")[0], f"{worst4:.1e}")
# combinations (*LOADCOMB, native syntax): re-evaluated from the FILE TEXT with MIDAS semantics as observed in the owner's run
# (add: sum, envelope: max / min, CB: nested combination, max / min scaled by the factor WITHOUT swapping) must give the
# platform's combine() envelopes, on nodal translations
from pdf2bim.model.combinations import Register, generate, combine
from pdf2bim.model.mct import midas_combinations
Wsc = wind_cases(doc, geo, S, M, allow_proposed=True)["scale"]; r35, rS = Wsc["with_traffic"], Wsc["sls"]
uc = lambda L: np.concatenate([u[:3] for _, u in sorted(M["model"].solve(gravity=(0, 0, 0), loads=L)["u"].items())])
Hall = horizontal_cases(doc, geo, M, Standards(), allow_proposed=True)["cases"]
resp = {"SW": np.concatenate([u[:3] for _, u in sorted(M["model"].solve()["u"].items())]), "SDL": uc(Cs["SDL"]["loads"])}
resp.update({k: uc(Hall[h]["loads"]) for k, h in (("EP", "EP"), ("EPTA", "EPTA"), ("EPTB", "EPTB"), ("BRKp", "BRKp"), ("CEN", "CEN"))})
resp.update({k: uc(Wc[w]["loads"]) for k, w in (("WLp", "WL+"), ("WTp", "WT+"), ("WTVp", "WTV+"), ("WVUp", "WVU+"), ("WVUm", "WVU-"))})
for k, c in (("TUp", "TU+"), ("TUm", "TU-"), ("TGP", "TGP"), ("TGN", "TGN"), ("SCR", "SCR")):
    resp[k] = np.concatenate([u[:3] for _, u in sorted(M["model"].solve(gravity=(0, 0, 0), loads={}, imposed=Th["cases"][c]["imposed"])["u"].items())])
resp["NIL"] = np.zeros_like(resp["SW"])
P = {"DLc": {"s": resp["SW"]}, "SDLp": {"s": resp["SDL"]}, "SOo": {"s": resp["EP"]}, "BRKR": {"s": resp["BRKp"]}, "CENR": {"s": resp["CEN"]},
     "TUW": {"s": resp["TUp"]}, "TUC": {"s": resp["TUm"]}, "TGP": {"s": resp["TGP"]}, "TGN": {"s": resp["TGN"]}, "SCR": {"s": resp["SCR"]},
     "EPT": {"max": np.maximum.reduce([resp["EPTA"], resp["EPTB"], resp["NIL"]]), "min": np.minimum.reduce([resp["EPTA"], resp["EPTB"], resp["NIL"]])}}
for sx, rr in (("U", 1.0), ("35", r35), ("S", rS)):
    P["WX_" + sx] = {"s": resp["WLp"] * rr}; P["WY_" + sx] = {"s": resp["WTp"] * rr + (resp["WTVp"] if sx == "35" else 0.0)}
    P["WZ_" + sx] = {"max": np.maximum(resp["WVUp"], resp["WVUm"]) * rr, "min": np.minimum(resp["WVUp"], resp["WVUm"]) * rr}
rows5 = generate(Register(Standards(), {"DLc", "SDLp", "SOo", "EPT", "BRKR", "CENR", "TUW", "TUC", "TGP", "TGN", "SCR", "WX", "WY", "WZ"}), None)["rows"]
cb5, sk5 = midas_combinations(rows5, r35, rS)
txt5, _ = write_mct(M, doc, title="test", cases={**Cs, "NIL": {"type": "USER", "loads": {}}}, combos=cb5)
CBs = {c["name"]: c for c in read_mct(txt5)["combos"]}
def ev(name):
    c = CBs[name]; hi = lo = None
    for kind, n, f in c["terms"]:
        if kind == "ST":
            a = b = f * resp[n]
        else:
            h, l = ev(n); a, b = f * h, f * l   # MIDAS: max / min scaled WITHOUT swapping (owner run 2026-10-28c)
        if hi is None:
            hi, lo = a, b
        elif c["type"] == 0:
            hi, lo = hi + a, lo + b
        else:
            hi, lo = np.maximum(hi, a), np.minimum(lo, b)
    return hi, lo
Cmb = combine(rows5, P)
dmax = max(max(abs(ev(f"{ls} Envelope")[0] - Cmb[ls]["max"]).max(), abs(ev(f"{ls} Envelope")[1] - Cmb[ls]["min"]).max()) for ls in ("ULS", "SLS"))
t("combinations: every exportable AS 5100.2 row written; the file's ULS / SLS envelopes equal the platform's combine() (nodal translations)",
  not sk5 and len([c for c in cb5 if c.get("ls")]) == len(rows5) == 133 and dmax < 1e-9, f"{dmax:.1e} m")
# earthquake (native *SFUNCTION / *SPLDCASE / *LOADTOMASS): written by tools/export_mct.py; spectrum = platform Sa(T),
# every AS 5100.2 earthquake row present with RS terms
import subprocess, tempfile as _tf
from pdf2bim.model.earthquake import ch_factor
_out = os.path.join(_tf.mkdtemp(), "x.mct")
subprocess.run([sys.executable, os.path.join(R, "tools/export_mct.py"), os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json"), "--allow-proposed", "--out", _out], check=True, capture_output=True)
tx6 = open(_out).read()
eqi = {r["cells"]["item"]: r["cells"]["value"] for r in doc["loads"]["earthquake"]["rows"]}
chrow = Standards().get("AS1170.4:spectral_shape:Ch").value["rows"][eqi["site_class"]]
blk = tx6.split("*SFUNCTION")[1].split("*SPLDCASE")[0].splitlines()[4:]
pts6 = [float(x) for l in blk if l.strip() for x in l.split(",")]
sa_err = max(abs(v - float(eqi["kp"]) * float(eqi["Z"]) * ch_factor(T, chrow) / float(eqi["Rf"])) for T, v in zip(pts6[::2], pts6[1::2]))
eqrows = [b for b in tx6.split("NAME=") if "RS, EQ_L" in b or "RS, EQ_T" in b]
t("earthquake: spectrum points equal the platform Sa(T); EQ_L / EQ_T spectrum cases; all 16 AS 5100.2 earthquake rows with RS terms; SDL as mass",
  sa_err < 1e-9 and len(pts6) > 100 and tx6.count("NAME=EQ_") == 2 and len(eqrows) == 16 and "*LOADTOMASS" in tx6 and "*STRUCTYPE" in tx6, f"Sa err {sa_err:.1e}, rows {len(eqrows)}")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
