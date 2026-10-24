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
        m.beam(e, n1, n2, a["E"], a["nu"], s["A"], s["Iy"], s["Iz"], s["J"], s["Asy"] or None, s["Asz"] or None, w=a["den"] * s["A"])
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
names = [m_["name"] for m_ in Rd["mats"].values()] + re.findall(r"^\s+\d+, (?:VALUE|DBUSER), ([^,]+),", txt, re.M)
t("material and section names at most 16 characters (MIDAS limit)", all(len(n.strip()) <= 16 for n in names), str(max(len(n.strip()) for n in names)))
t("file is plain ASCII", all(ord(c) < 128 for c in txt))
t("unverified blocks are marked in the file and listed in the report", rep["unverified_blocks"] == ["*ELASTICLINK", "*SPRING"]
  and txt.count("UNVERIFIED SYNTAX") == 2 and "NEEDS ENGINEER IMPORT TEST" in rep["status"])
m2 = rebuild(Rd, base)
r1 = M["model"].solve(); r2 = m2.solve(gravity=Rd["selfweight"])
U1 = np.concatenate([r1["u"][inv[n]] for n in sorted(inv)]); U2 = np.concatenate([r2["u"][n] for n in sorted(inv)])
t("round trip (write -> read -> solve): self weight equal to 1e-6 relative", abs(r1["applied"][2] / r2["applied"][2] - 1) < 1e-6, f"{r1['applied'][2]:.4f} vs {r2['applied'][2]:.4f}")
t("round trip: every displacement equal to 1e-5 of the largest (written precision)", abs(U1 - U2).max() <= 1e-5 * abs(U1).max(), f"{abs(U1 - U2).max() / abs(U1).max():.1e}")
gw = [b for i, b in M["model"].beams.items() if M["members"] and next((x for x in M["members"] if x["id"] == i), {}).get("role") == "girder"]
t("composite girders keep the GROSS weight on the transformed section (density = w / A per material)",
  all(abs(Rd["mats"][Rd["els"][rep["element_map"][i]][0]]["den"] * Rd["secs"][Rd["els"][rep["element_map"][i]][1]]["A"] - b["w"]) < 1e-5 * b["w"]
      for i, b in M["model"].beams.items() if b["w"] > 0))
mass0 = [i for i, b in M["model"].beams.items() if b["w"] == 0]
t("massless members (dummies, deck strips, rigid) get a density-0 material", all(Rd["mats"][Rd["els"][rep["element_map"][i]][0]]["den"] == 0 for i in mass0), f"{len(mass0)} members")
txt2, rep2 = write_mct(M, doc, title="test", include_unverified=False)
t("verified-only mode omits links and springs and says the model is then incomplete",
  "*ELASTICLINK" not in txt2 and "*SPRING" not in txt2 and set(rep2["not_written"]) == {"*ELASTICLINK", "*SPRING"} and "incomplete" in txt2)
Mg = build_superstructure(doc, geo, S, allow_proposed=True)
try:
    write_mct(Mg, doc); ok = False
except ValueError as e:
    ok = "explicit axes" in str(e)
t("links with explicit axes (P3a ground links) are refused, not written with a guessed angle", ok)
m3 = copy.deepcopy(M); m3["model"].load(next(iter(m3["model"].nodes)), (0, 0, -1, 0, 0, 0))
t3, r3 = write_mct(m3, doc)
t("nodal loads are not written (no documented *CONLOAD syntax) and the report says so", not re.search(r"^\*CONLOAD", t3, re.M) and any("CONLOAD" in x for x in r3["not_written"]))

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
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
