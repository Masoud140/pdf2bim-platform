"""Reinforced concrete plank design along a plank line (ADR-085 stage 3a). N, mm, MPa; actions kN, kN m.

    from pdf2bim.design.plank_design import plank_section_design, plank_checks
    sec, lv = plank_section_design(doc, S, "P1", allow_proposed)      # flexure.Section, y DOWN from the deck top
    out = plank_checks(doc, geo, S, CA, mdl, std, "P1", allow_proposed)

Section: the plank outline less its voids (strip widths cut at each strip's mid depth) and the topping over the plank's
deck strip (P2 station widths), as strips; bars from plank_types[].bars (y from the plank soffit; a bar above the plank
top is a topping / deck bar, so the hogging steel over an integral support is entered there); materials "Planks" and
"Deck" rows, materials.reinforcement.
Checks at every plank element end (the plank is prismatic, so the section is the same everywhere):
- ULS sagging phi Mu (flexure.uls_bend, compression at the deck top) against the ULS envelope maximum;
- ULS hogging phi Mu (the same routine on the section turned upside down: compression at the plank soffit) against
  the envelope minimum (integral abutments, continuity);
- SLS bar stress on the cracked section (sls.solve, no concrete tension) under the SLS envelope maximum / minimum,
  against AS5100.5:crack_control:table_8_6_2_1 by the bar diameter at the tension face (girder_sls.crack_limits). An RC
  plank has no prestress, so the stress increment above decompression is the stress itself.
NOT here (stage 3b / 3c): prestressed planks (strand_pattern given -> refused), shear and torsion, interface
(longitudinal) shear, minimum strength, deck slab transverse design. Standards values code-extracted-unverified.
"""
import copy, math
from ..description import Reader, MissingInput
from .flexure import Section, uls_bend
from .sls import solve
from .girder_sls import crack_limits
from .girder_design import _element_ends


def _width_at(P, y):
    xs = []
    for k in range(len(P)):
        a, b = P[k], P[(k + 1) % len(P)]
        if (a[1] <= y < b[1]) or (b[1] <= y < a[1]):
            xs.append(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]))
    xs.sort()
    return sum(xs[j + 1] - xs[j] for j in range(0, len(xs) - 1, 2))


def _conc(rd, doc, word):
    for r in rd.rows((doc.get("materials") or {}).get("concrete"), "materials.concrete"):
        if word in (r.get("element") or "").lower():
            if r.get("fc") is None or r.get("E") is None:
                raise MissingInput(f"materials.concrete[{r.get('element')}]: fc and E needed")
            return float(r["fc"]), float(r["E"])
    raise MissingInput(f"materials.concrete: no row for the {word}")


def plank_section_design(doc, S, plank, allow_proposed=False, dz=2.0):
    rd = Reader(doc, allow_proposed)
    G = S["girders"].get(plank)
    if G is None or G["type"] != "plank":
        raise MissingInput(f"sections: {plank!r} is not a plank line")
    sup = doc.get("superstructure") or {}
    mem = next(m for m in sup.get("members") or [] if m["id"] == plank)
    tref = rd.value(mem.get("type_ref"), f"superstructure.members[{plank}].type_ref")
    T = next(x for x in sup.get("plank_types") or [] if x["id"] == tref)
    tp = f"superstructure.plank_types[{tref}]"
    if rd.rows(T.get("strand_pattern"), tp + ".strand_pattern", required=False):
        raise MissingInput(f"{tp}: prestressed planks are not designed yet (ADR-085 stage 3b)")
    st = G["stations"][len(G["stations"]) // 2]
    h = G["params"]["depth"]
    tD = S["deck_thickness"] if st["deck"] else 0.0
    fcp, Ep = _conc(rd, doc, "plank")
    conc = []
    if tD:
        fcd, Ed = _conc(rd, doc, "deck")
        n = math.ceil(tD / dz); d = tD / n
        conc += [{"y": (i + 0.5) * d, "h": d, "b": st["deck_left"] + st["deck_right"], "E": Ed, "fc": fcd, "grp": "deck"} for i in range(n)]
    n = math.ceil(h / dz); d = h / n
    for i in range(n):
        yu = h - (i + 0.5) * d                                  # up from the plank soffit
        b = _width_at(st["outline"], yu) - sum(_width_at(v, yu) for v in st["voids"])
        if b > 0:
            conc.append({"y": tD + (i + 0.5) * d, "h": d, "b": b, "E": Ep, "fc": fcp, "grp": "girder"})
    rows = rd.rows(T.get("bars"), tp + ".bars", required=False)
    if not rows:
        raise MissingInput(f"{tp}.bars: no reinforcement")
    bm = rd.rows((doc.get("materials") or {}).get("reinforcement"), "materials.reinforcement")[0]
    bars = []
    for r in rows:
        y = float(r["y"])
        if not 0 < y < h + tD:
            raise MissingInput(f"{tp}.bars: bar at y {y} mm is outside the plank + topping")
        k = int(r.get("number") or 1)
        bars.append({"y": tD + h - y, "A": k * math.pi / 4 * float(r["diameter"]) ** 2, "E": float(bm["Es"]), "fsy": float(bm["fsy"]),
                     "grp": "girder" if y <= h else "deck", "d": float(r["diameter"]), "n": k})
    return Section(conc, bars), {"Dtot": tD + h, "tD": tD, "h": h, "provisional": rd.provisional}


def _flip(sec, H):
    c = [dict(q, y=H - q["y"]) for q in sec.conc]
    c.sort(key=lambda q: q["y"])
    return Section(c, [dict(b, y=H - b["y"]) for b in sec.bars])


def bar_stress(sec, M):
    """Largest bar tension (MPa) on the cracked section under M (kN m, sagging +), and the bar diameter there."""
    if abs(M) < 1e-9:
        return 0.0, None
    pl = solve(sec, 0.0, M * 1e6, 0.0, cracked=True)
    if not pl["converged"]:
        raise ValueError(f"cracked section solve did not converge at M = {M:.1f} kN m")
    s = [(b["E"] * (pl["e0"] + pl["k"] * b["y"]), b.get("d")) for b in sec.bars]
    return max(s)


def plank_checks(doc, geo, S, CA, mdl, std, plank, allow_proposed=False):
    sec, lv = plank_section_design(doc, S, plank, allow_proposed)
    H = lv["Dtot"]
    sag = uls_bend(sec, std)
    hog = uls_bend(_flip(sec, H), std)
    lim = crack_limits(sec, std)
    ends = _element_ends(CA, mdl, geo, plank)
    U, Sv = CA["envelopes"]["ULS"], CA["envelopes"]["SLS"]
    rows = []
    for d, i, (_, eid), end in sorted(ends):
        Ms, Mh = float(U["max"][i]), float(U["min"][i])
        Ss, Sh = float(Sv["max"][i]), float(Sv["min"][i])
        fs_s, _ = bar_stress(sec, max(Ss, 0.0))
        fs_h, _ = bar_stress(sec, min(Sh, 0.0))
        rows.append({"x_m": d, "element": eid, "end": end, "M_sag": Ms, "row_sag": U["gmax"][i], "M_hog": Mh, "row_hog": U["gmin"][i],
                     "u_sag": max(Ms, 0.0) / sag["phiMu"], "u_hog": max(-Mh, 0.0) / hog["phiMu"],
                     "Ms_sls": Ss, "Mh_sls": Sh, "fs_sag": fs_s, "fs_hog": fs_h,
                     "u_sls_sag": fs_s / lim["fscr"], "u_sls_hog": fs_h / lim["fscrT"]})
    return {"plank": plank, "phiMu_sag": sag["phiMu"], "phiMu_hog": hog["phiMu"], "kuo_sag": sag["kuo"], "kuo_hog": hog["kuo"],
            "fscr": lim["fscr"], "fscrT": lim["fscrT"], "why": lim["why"], "rows": rows,
            "governing": {k: max(r[k] for r in rows) for k in ("u_sag", "u_hog", "u_sls_sag", "u_sls_hog")},
            "notes": ["RC planks: ULS flexure (sagging / hogging) and SLS cracked bar stress only; shear, torsion, interface shear, "
                      "prestressed planks and minimum strength not yet checked (ADR-085 stage 3b / 3c)"],
            "provisional": lv["provisional"], "standards_status": std.result_status()}
