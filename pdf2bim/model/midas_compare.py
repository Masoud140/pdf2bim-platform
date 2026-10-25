"""Comparison of the platform's integrated model with MIDAS Civil results (P4.4, agent part). kN, m, s.

    from pdf2bim.model.midas_compare import platform_tables, read_table, write_table, compare
    P = platform_tables(mdl, sidecar)                     # the platform's results in MIDAS numbering (self-weight case)
    write_table(P["reactions"], "reactions.csv", "reactions")   # MIDAS-style CSV for the engineer
    Mi = {"reactions": read_table("midas_reactions.csv", "reactions"), ...}
    R = compare(P, Mi)                                    # per table: rows compared, worst differences, pass / fail

The engineer runs MIDAS on the exported .mct (pdf2bim.model.mct; numbering in its sidecar .mct.json) and exports the
result tables as CSV. Nothing about MIDAS's table layout is assumed silently: the expected headers and sign
conventions are the data below (COLUMNS, CONVENTIONS), marked UNCONFIRMED until the owner's first export confirms them;
a header that cannot be matched stops the comparison with the list of headers found.

Tables (the .mct carries one load case, self weight "SW"):
- reactions: node, FX, FY, FZ, MX, MY, MZ (global; force of the support / spring on the structure);
- beam_forces: element, part (I / J), axial, shear_y, shear_z, torsion, moment_y, moment_z (element local axes of the
  .mct; section forces on the +x face: end I = -f_I, end J = +f_J of the nodal end forces f);
- modes: mode, period; mode_shapes (optional): mode, node, UX, UY, UZ (RX, RY, RZ ignored).
Tolerances (VERIFICATION_STRATEGY): reactions and member actions T10 2 % of the larger value (with a floor of 1 % of
the largest value of that component in the table, so near-zero values are compared absolutely); periods T7 3 %, modes
paired by MAC >= 0.9 on the translational shapes — mode order alone is not pairing, unpaired modes are findings.
"""
import csv, math, re
import numpy as np

UNCONFIRMED = "UNCONFIRMED: expected MIDAS Civil result-table headers; confirm with the first export and correct here"
COLUMNS = {
    "reactions": {"node": ["node"], "load": ["load", "loadcase", "lcase"], "FX": ["fx"], "FY": ["fy"], "FZ": ["fz"], "MX": ["mx"], "MY": ["my"], "MZ": ["mz"]},
    "beam_forces": {"element": ["elem", "element"], "load": ["load", "loadcase", "lcase"], "part": ["part"], "axial": ["axial"],
                    "shear_y": ["sheary", "shear y"], "shear_z": ["shearz", "shear z"], "torsion": ["torsion"], "moment_y": ["momenty", "moment y"], "moment_z": ["momentz", "moment z"]},
    "modes": {"mode": ["mode", "modeno", "mode no"], "period": ["period"]},
    "mode_shapes": {"mode": ["mode", "modeno", "mode no"], "node": ["node"], "UX": ["ux"], "UY": ["uy"], "UZ": ["uz"]},
}
CONVENTIONS = {"status": UNCONFIRMED,
               "reactions": "global axes of the .mct; force of the support on the structure (gravity case: FZ > 0)",
               "beam_forces": "element local axes of the .mct (beta = 0); section forces on the +x face at I and J (I = -f_I, J = +f_J)",
               "part": "I-end labels start with 'I' (e.g. I[12]), J-end with 'J'"}
TOL = {"reactions": 0.02, "beam_forces": 0.02, "period": 0.03, "mac": 0.9, "floor": 0.01}
COMPONENTS = {"reactions": ["FX", "FY", "FZ", "MX", "MY", "MZ"], "beam_forces": ["axial", "shear_y", "shear_z", "torsion", "moment_y", "moment_z"]}


def _norm(h):
    h = re.sub(r"\(.*?\)|\[.*?\]", "", str(h)).strip().lower()
    return re.sub(r"[\s_\-\.]+", " ", h).strip()


def _match(headers, kind, columns=None):
    spec = (columns or COLUMNS)[kind]
    nh = {_norm(h): h for h in headers}
    out, miss = {}, []
    for key, alts in spec.items():
        hit = next((nh[a] for a in alts if a in nh), None)
        if hit is None:
            hit = next((nh[n] for n in nh for a in alts if n.replace(" ", "") == a.replace(" ", "")), None)
        if hit is None:
            if key == "load":
                continue
            miss.append(key)
        else:
            out[key] = hit
    if miss:
        raise ValueError(f"{kind}: columns {miss} not found; headers in the file: {list(headers)} ({UNCONFIRMED})")
    return out


def read_table(path, kind, columns=None, load=None):
    """Rows of a MIDAS result table exported as CSV (first row = headers; units in brackets ignored). load: keep only
    rows of this load case (when the table has a load column)."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        rd = csv.reader(f)
        rows = [r for r in rd if any(c.strip() for c in r)]
    hdr, body = rows[0], rows[1:]
    m = _match(hdr, kind, columns)
    col = {k: hdr.index(h) for k, h in m.items()}
    out = []
    for r in body:
        d = {}
        for k, j in col.items():
            v = r[j].strip() if j < len(r) else ""
            if k in ("load", "part"):
                d[k] = v
            elif k in ("node", "element", "mode"):
                d[k] = int(float(v))
            else:
                d[k] = float(v.replace(",", "")) if v else 0.0
        if load is not None and "load" in d and d["load"] != load:
            continue
        out.append(d)
    return out


HEADERS = {"reactions": ["Node", "Load", "FX (kN)", "FY (kN)", "FZ (kN)", "MX (kN*m)", "MY (kN*m)", "MZ (kN*m)"],
           "beam_forces": ["Elem", "Load", "Part", "Axial (kN)", "Shear-y (kN)", "Shear-z (kN)", "Torsion (kN*m)", "Moment-y (kN*m)", "Moment-z (kN*m)"],
           "modes": ["Mode", "Period (sec)"], "mode_shapes": ["Mode", "Node", "UX", "UY", "UZ"]}


def write_table(rows, path, kind):
    keys = {"reactions": ["node", "load", "FX", "FY", "FZ", "MX", "MY", "MZ"], "beam_forces": ["element", "load", "part", "axial", "shear_y", "shear_z", "torsion", "moment_y", "moment_z"],
            "modes": ["mode", "period"], "mode_shapes": ["mode", "node", "UX", "UY", "UZ"]}[kind]
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(HEADERS[kind])
        for r in rows:
            w.writerow([r.get(k, "") if isinstance(r.get(k), (str, int)) else repr(float(r.get(k, 0.0))) for k in keys])


def platform_tables(mdl, sidecar, n_modes=10, case="SW"):
    """The platform's self-weight results and modes of the model written to the .mct, in the .mct numbering
    (sidecar = the .mct.json of the same model: node_map / element_map)."""
    m = mdl["model"]
    nmap = {int(k): v for k, v in sidecar["node_map"].items()}
    emap = {int(k): v for k, v in sidecar["element_map"].items()}
    if set(nmap) != set(m.nodes) or set(emap) != set(m.beams):
        raise ValueError("the sidecar numbering does not belong to this model (node / element sets differ): re-export the .mct")
    res = m.solve(gravity=(0.0, 0.0, -1.0), loads={})
    reac = {}
    for n, r in res["reactions"].items():
        reac[n] = reac.get(n, np.zeros(6)) + r
    for n, s in res["spring_forces"].items():
        reac[n] = reac.get(n, np.zeros(6)) + s
    R = [dict(node=nmap[n], load=case, **dict(zip(COMPONENTS["reactions"], map(float, v)))) for n, v in sorted(reac.items(), key=lambda q: nmap[q[0]])]
    B = []
    for eid in sorted(m.beams, key=lambda e: emap[e]):
        f = m.end_forces(eid)
        for part, v in (("I", -f[:6]), ("J", f[6:])):
            B.append(dict(element=emap[eid], load=case, part=f"{part}[{emap[eid]}]", **dict(zip(COMPONENTS["beam_forces"], map(float, v)))))
    Q = m.modes(n_modes)
    Mo = [{"mode": i + 1, "period": float(q["T"])} for i, q in enumerate(Q["modes"])]
    Sh = []
    for i, q in enumerate(Q["modes"]):
        for n, v in sorted(q["shape"].items(), key=lambda z: nmap[z[0]]):
            Sh.append({"mode": i + 1, "node": nmap[n], "UX": float(v[0]), "UY": float(v[1]), "UZ": float(v[2])})
    return {"reactions": R, "beam_forces": B, "modes": Mo, "mode_shapes": Sh, "case": case,
            "equilibrium_residual": [float(x) for x in res["equilibrium_residual"]]}


def _cmp_rows(P, M, kind, keyf, tol, floor):
    comps = COMPONENTS[kind]
    pm = {keyf(r): r for r in P}; mm = {keyf(r): r for r in M}
    only_p = sorted(set(pm) - set(mm)); only_m = sorted(set(mm) - set(pm))
    scale = {c: max([abs(r[c]) for r in P] + [abs(r[c]) for r in M] + [0.0]) for c in comps}
    worst, bad, n = {c: (0.0, None) for c in comps}, [], 0
    for k in sorted(set(pm) & set(mm)):
        for c in comps:
            a, b = pm[k][c], mm[k][c]
            den = max(abs(a), abs(b), floor * scale[c], 1e-12)
            d = abs(a - b) / den
            n += 1
            if d > worst[c][0]:
                worst[c] = (d, k)
            if d > tol:
                bad.append({"key": k, "component": c, "platform": a, "midas": b, "rel": d})
    return {"compared": n, "worst": {c: {"rel": v[0], "at": v[1]} for c, v in worst.items()}, "outside_tolerance": bad,
            "only_platform": only_p, "only_midas": only_m, "tolerance": tol,
            "pass": not bad and not only_p and not only_m and n > 0}


def _mac(a, b):
    return float((a @ b) ** 2 / ((a @ a) * (b @ b))) if (a @ a) > 0 and (b @ b) > 0 else 0.0


def _shapes(rows):
    S = {}
    for r in rows:
        S.setdefault(r["mode"], {})[r["node"]] = (r["UX"], r["UY"], r["UZ"])
    return S


def compare_modes(P, M, tol=TOL["period"], mac_min=TOL["mac"]):
    """Pair modes by MAC on the common nodes' translations; compare the periods of paired modes. Without MIDAS shapes
    nothing is paired (order alone is not pairing): the periods are listed by order, not assessed."""
    Tp = {r["mode"]: r["period"] for r in P["modes"]}; Tm = {r["mode"]: r["period"] for r in M.get("modes", [])}
    if not M.get("mode_shapes"):
        return {"paired": [], "pass": None, "by_order": [{"mode": k, "platform": Tp[k], "midas": Tm.get(k)} for k in sorted(Tp)],
                "note": "no MIDAS mode shapes: modes not paired (T7 needs MAC pairing); periods listed by order only"}
    Sp, Sm = _shapes(P["mode_shapes"]), _shapes(M["mode_shapes"])
    nodes = sorted(set.intersection(*[set(v) for v in list(Sp.values()) + list(Sm.values())]))
    vec = lambda S, k: np.array([c for n in nodes for c in S[k][n]], float)
    pairs, used, bad = [], set(), []
    for i in sorted(Sp):
        best = max(((_mac(vec(Sp, i), vec(Sm, j)), j) for j in Sm if j not in used), default=(0.0, None))
        if best[1] is not None and best[0] >= mac_min:
            used.add(best[1]); d = abs(Tp[i] - Tm[best[1]]) / Tm[best[1]]
            pairs.append({"platform_mode": i, "midas_mode": best[1], "mac": best[0], "T_platform": Tp[i], "T_midas": Tm[best[1]], "rel": d})
            if d > tol:
                bad.append(i)
    unp_p = [i for i in sorted(Sp) if i not in {q["platform_mode"] for q in pairs}]
    unp_m = [j for j in sorted(Sm) if j not in used]
    return {"paired": pairs, "unpaired_platform": unp_p, "unpaired_midas": unp_m, "outside_tolerance": bad, "nodes_used": len(nodes),
            "pass": bool(pairs) and not bad, "tolerance": tol, "mac_min": mac_min,
            "note": "unpaired modes are findings to explain, not tolerance passes"}


def compare(P, M, tol=None):
    """P: platform_tables(); M: {"reactions": rows, "beam_forces": rows, "modes": rows, "mode_shapes": rows} (any subset)."""
    T = dict(TOL, **(tol or {}))
    out = {"conventions": CONVENTIONS, "tolerances": T}
    if M.get("reactions") is not None:
        out["reactions"] = _cmp_rows(P["reactions"], M["reactions"], "reactions", lambda r: r["node"], T["reactions"], T["floor"])
        sp = np.array([sum(r[c] for r in P["reactions"]) for c in ("FX", "FY", "FZ")]); sm = np.array([sum(r[c] for r in M["reactions"]) for c in ("FX", "FY", "FZ")])
        out["reactions"]["total"] = {"platform": sp.tolist(), "midas": sm.tolist(), "rel_FZ": float(abs(sp[2] - sm[2]) / max(abs(sm[2]), 1e-12))}
    if M.get("beam_forces") is not None:
        key = lambda r: (r["element"], r["part"][:1].upper())
        out["beam_forces"] = _cmp_rows(P["beam_forces"], M["beam_forces"], "beam_forces", key, T["beam_forces"], T["floor"])
    if M.get("modes") is not None:
        out["modes"] = compare_modes(P, M, T["period"], T["mac"])
    out["pass"] = all(v.get("pass") is not False for k, v in out.items() if isinstance(v, dict) and "pass" in v)
    return out
