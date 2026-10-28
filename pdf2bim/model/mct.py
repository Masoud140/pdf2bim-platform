"""MIDAS Civil .mct writer for a P3 model (stage P3b). NEEDS AN ENGINEER IMPORT TEST before any use.

    from pdf2bim.model.mct import write_mct
    text, report = write_mct(mdl, doc, title="...")

Syntax policy (claude/MCT_EXPORT_METHOD.md §0-§1): only syntax VERIFIED by a MIDAS import (error log) or by the engineer's
native file is written as verified. Blocks whose syntax is not verified are written ONLY when include_unverified=True,
each preceded by an "UNVERIFIED SYNTAX" comment, and listed in report['unverified_blocks'].

| Block | Status | Source |
|---|---|---|
| *UNIT, *NODE, *ELEMENT BEAM, *MATERIAL USER (name <= 16 chars) | verified | MCT_EXPORT_METHOD §1 |
| *SECTION DBUSER SB rectangle (H, B) | verified | §1 |
| *FRAME-RLS (2 lines per element, boundary group) | from the engineer's native BR13B model (2026-10-28) after MIDAS rejected *BEAMEND; import not yet confirmed | — |
| *SECTION DBUSER SR solid circle (D) | from the engineer's native BR13B model (2026-10-28); import of a generated file not yet confirmed | §1 |
| *SECT-PSCVALUE COMPOSITE-GEN (girder + deck, polygons) | from the engineer's native BR13B model (2026-10-28); import not yet confirmed | §1, §1c |
| *SECT-SCALE (IXX_SF only; group in *BNDR-GROUP) | from the engineer's native BR13B model (2026-10-28); import not yet confirmed | §1 |
| *SECTION VALUE (4 lines, ..., YES, NO, SB, ROLL) | import-verified, shape not drawn | §1 error log; first-case v8 file |
| *BNDR-GROUP, *LOAD-GROUP | UNVERIFIED | added 2026-10-26 after the engineer's import gave a run error on the first *CONSTRAINT line (group not declared); awaits re-import |
| *STLDCASE, *CONSTRAINT, *USE-STLD, *SELFWEIGHT | from the engineer's native model, import of a generated file not yet confirmed | §1b |
| *ELASTICLINK (GEN, angle, SDx..SRz, bSHEAR, DRy, DRz, group) | UNVERIFIED | dashboard export (src/sub.js) / first-case v8 header |
| *SPRING (LINEAR) | UNVERIFIED | field order corrected from the engineer's MIDAS import error report (2026-10-26: the dashboard order failed, 8 errors per line); awaits a clean re-import |
| *CONLOAD per *USE-STLD case, one load group per case | from the engineer's native BR13B model (2026-10-28); import not yet confirmed | — |

Content rules:
- coordinates: X = E - E0, Y = N - N0 with the documented project base point (project.base_point), Z unchanged;
- node and element numbers are renumbered 1..n (map in the report);
- self weight: MIDAS computes density x section area. Members whose weight differs from (density x area) — composite
  girders carry the GROSS weight on a transformed section; dummies, deck strips and rigid members are massless — get a
  material whose density = w / A (one material per distinct (E, density));
- sections: members with shape ('rect', H, B) -> DBUSER SB, ('circle', D) -> DBUSER SR (MIDAS computes A, I, J, shear areas itself; its J and shear
  areas can differ slightly from the solver's); every other member -> VALUE with the solver's A, Asy, Asz, J, Iy, Iz
  (stiffness only: no stress recovery points; composite girders -> *SECT-PSCVALUE COMPOSITE-GEN, girder + deck polygons, sum-of-parts = solver values);
- section offset: CC for all sections (both DBUSER and VALUE). The grillage is planar; CT (top-of-section) would add an
  eccentricity that the model does not intend. Changed DBUSER to CC 2026-10-26.
"""
import math
import numpy as np


def _num(v):
    if v is None:
        return "0"
    if v == 0:
        return "0"
    return f"{v:.6e}"


def _node_list(ids):
    return " ".join(str(i) for i in ids)


def _composite_gen(i, nm, shp, b, ofs="CC"):
    """One COMPOSITE-GEN section: girder (part 1, main) + deck (part 2). Sum-of-parts stiffness = the solver's values."""
    from pdf2bim.sections.polygon import Part, props
    from .builder import _rect_J
    _, girder, deck, Ed, Jg, asz_g = shp
    nu = b["E"] / (2 * b["G"]) - 1
    g = [(x / 1000, y / 1000) for x, y in girder]
    d = [(x / 1000, y / 1000) for x, y in deck]
    xs, ys = [q[0] for q in g + d], [q[1] for q in g + d]
    x0, y0 = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    xl, zb = min(xs), min(ys)
    ccw = lambda P: P if sum(P[k][0] * P[k - 1][1] - P[k - 1][0] * P[k][1] for k in range(len(P))) <= 0 else P[::-1]
    g, d = ccw([(x - x0, y - y0) for x, y in g]), ccw([(x - x0, y - y0) for x, y in d])
    f = lambda *v: ", ".join(f"{x:.9g}" for x in v)

    def fibres(P, cx, cz):   # STIFF2 / STIFF3 of the part extents about (cx, cz) in polygon coordinates
        px, pz = [q[0] for q in P], [q[1] for q in P]
        per = sum(math.dist(P[k], P[k - 1]) for k in range(len(P)))
        cyp, cym, czp, czm = max(px) - cx, cx - min(px), max(pz) - cz, cz - min(pz)
        return ([cyp, cym, czp, czm, 0, 0, per, 0, cx + x0 - xl, cz + y0 - zb],
                [-cym, cyp, cyp, -cym, czp, czp, -czm, -czm])

    pg, pd = props([Part(g)]), props([Part(d)])
    Ag, Ad = pg["A"], pd["A"]
    hd, bd = max(q[1] for q in d) - min(q[1] for q in d), max(q[0] for q in d) - min(q[0] for q in d)
    s1g = [Ag, Ag, asz_g, asz_g, Jg, pg["Ix"], pg["Iy"]]
    s1d = [Ad, Ad, 5 / 6 * Ad, 5 / 6 * Ad, _rect_J(bd, hd), pd["Ix"], pd["Iy"]]
    s1c = [b["A"], b["A"], b["Asy"] or 0, b["Asz"] or 0, b["J"], b["Iy"], b["Iz"]]
    n = Ed / b["E"]
    cz = (Ag * pg["yc"] + n * Ad * pd["yc"]) / (Ag + n * Ad)
    cx = (Ag * pg["xc"] + n * Ad * pd["xc"]) / (Ag + n * Ad)
    a2g, a3g = fibres(g, pg["xc"], pg["yc"]); a2d, a3d = fibres(d, pd["xc"], pd["yc"]); a2c, a3c = fibres(g, cx, cz)

    def poly(P):
        flat = [f"{x:.9g}, {y:.9g}" for x, y in P]   # 9 digits: polygon area to < 1 mm2 (MCT_EXPORT_METHOD §2 rule 5)
        rows = [flat[:6]] + [flat[k:k + 4] for k in range(6, len(flat), 4)]
        return ["       OPOLY=" + ", ".join(rows[0])] + ["             " + ", ".join(r) for r in rows[1:]]

    _composite_gen.geom[i] = (max(ys) - min(ys), cz + y0 - zb)   # depth, centroid above the bottom (m): MIDAS band reference
    W = lambda r: "       " + f(*r)
    L = [f" SECT= {i}, COMPOSITE-GEN, {nm}, {ofs}, 0, 0, 0, 0, 0, 0, YES, NO, CP_G, YES, YES, 1",
         "       PART=1", W(s1g), W(a2g), W(a3g), W(s1g), W(a2g), W(a3g), f"       1, YES, YES, {b['E']:.6g}, {nu:g}"] + poly(g)
    L += ["       PART=2", W(s1d), W(a2d), W(a3d), W(s1c), W(a2c), W(a3c), f"       1, NO, YES, {Ed:.6g}, {nu:g}"] + poly(d)
    return L


_composite_gen.geom = {}


def _band(A, I, H, czb, e0, phi, alpha):
    """One linear temperature band over the full depth (width 1 m, *BSTEMPER TYPE ELEMENT) whose force and moment about the
    centroid equal E A e0 and E I phi: returns (T_top, T_bottom). y up from the centroid; top hotter = phi > 0."""
    yt, yb = H - czb, -czb
    a11, a12, a22 = H, (yt ** 2 - yb ** 2) / 2, (yt ** 3 - yb ** 3) / 3
    a, b = np.linalg.solve([[a11, a12], [a12, a22]], [A * e0 / alpha, I * phi / alpha])
    return a + b * yt, a + b * yb


# platform combination action -> exported static load case (export_mct case names, + / - spelled p / m)
COMBO_CASE = {"DLc": "SW", "SDLp": "SDL", "SOo": "EP", "SOc": "EP", "BRKR": "BRKp", "CENR": "CEN", "TUW": "TUp", "TUC": "TUm",
              "TGP": "TGP", "TGN": "TGN", "SCR": "SCR"}


def midas_combinations(rows, r35, rS, eq_cases=False):
    """Platform combination rows (combinations.generate) -> MIDAS *LOADCOMB entries, for rows whose actions are all exported.
    Wind as primitives(): WX = WL+ x r, WY = WT+ x r (+ WTV+ unscaled with traffic), r = 1 (_U), r35 (_35), rS (_S).
    Envelope actions are EXPANDED, never nested: a row with WZ (vertical wind up / down) or EPT (surcharge behind A / B / none)
    becomes one additive row per alternative (suffix a, b, ...). MIDAS evaluates nested envelopes in its own way (owner runs
    2026-10-28c / d: negative factors not swapped; an envelope of rows holding envelopes exceeds every row), so only plain
    additive rows are written (no envelope combinations at all); the envelope of the expanded rows equals combine().
    Returns (combos, skipped rows): combos = [{"name", "type" (0 add / 1 envelope), "desc", "terms": [(ST|RS|CB, name, f)]}]."""
    import itertools
    r = {"U": 1.0, "35": r35, "S": rS}
    out, skipped = [], []
    for row in rows:
        alts = []   # per action: list of alternative term lists
        for aid, f in row["t"]:
            base, _, sx = aid.partition("_")
            if aid in COMBO_CASE:
                alts.append([[("ST", COMBO_CASE[aid], f)]])
            elif aid == "EPT":
                alts.append([[("ST", "EPTA", f)], [("ST", "EPTB", f)], []])
            elif base == "WX" and sx in r:
                alts.append([[("ST", "WLp", f * r[sx])]])
            elif base == "WY" and sx in r:
                alts.append([[("ST", "WTp", f * r[sx])] + ([("ST", "WTVp", f)] if sx == "35" else [])])
            elif base == "WZ" and sx in r:
                alts.append([[("ST", "WVUp", f * r[sx])], [("ST", "WVUm", f * r[sx])]])
            elif aid in ("EQX", "EQY") and eq_cases:
                alts.append([[("RS", {"EQX": "EQ_L", "EQY": "EQ_T"}[aid], f)]])
            else:
                skipped.append(row["name"]); break
        else:
            variants = list(itertools.product(*alts))
            for k, v in enumerate(variants):
                nm = row["name"] + ("abcdefghijklmnopqrstuvwxyz"[k] if len(variants) > 1 else "")
                out.append({"name": nm, "type": 0, "desc": f"{row['clause']} {row['pe']}", "terms": [t for part in v for t in part],
                            "ls": row["ls"], "row": row["name"]})
    # No overall ULS / SLS envelope combination: in the owner's run 2026-10-28e MIDAS's envelope of these plain rows ignored 63 of its
    # 145 member rows (the rows themselves all match the platform). Envelope in MIDAS's own tools, or use the platform's envelopes.
    return out, skipped


def _lc_name(name):
    """MIDAS load-case / group name: letters, digits, space, _ : ( ) only (native names use these); + / - spelled out."""
    import re
    return re.sub(r"[^A-Za-z0-9 _:()]", "", str(name).replace("+", "p").replace("-", "m"))[:20]


def write_mct(mdl, doc, title="P3 model", include_unverified=True, gravity=True, cases=None, alpha=1.0e-5, combos=None, eq=None):
    """cases: {name: {"type": MIDAS LCTYPE (D, DW, EP, BRK, W, USER ...), "loads": {model node: (Fx, Fy, Fz, Mx, My, Mz)}}}
    written as static load cases of nodal loads (*CONLOAD, native BR13B syntax), one load group per case.
    eq: {"points": [(T, Sa g)], "kp", "Z", "site", "zeta", "angle_L" (deg from X), "modes", "mass_cases": [case names]} ->
    *STRUCTYPE, *LOADTOMASS, *EIGEN-CTRL, *SFUNCTION and spectrum cases EQ_L / EQ_T (*SPLDCASE), native BR13B syntax.
    A case may instead carry "strain": {model beam: (e0, phi)} (free axial strain, free curvature + = top hotter): phi = 0 ->
    *ELTEMPER dT = e0 / alpha; else one *BSTEMPER band reproducing both (native BR13B syntax). alpha = material THERMAL."""
    cases = {_lc_name(k): v for k, v in (cases or {}).items()}
    _composite_gen.geom.clear()
    if len(cases) != len({k for k in cases}):
        raise ValueError("load case names collide after MIDAS sanitising")
    m = mdl["model"]
    bp = next(r["cells"] for r in doc["project"]["base_point"]["rows"])
    E0, N0 = float(bp["E"]), float(bp["N"])
    members = {x["id"]: x for x in mdl["members"]}
    # ---- renumber ----
    nmap = {n: i + 1 for i, n in enumerate(sorted(m.nodes))}
    emap = {e: i + 1 for i, e in enumerate(sorted(m.beams))}
    # ---- materials: one per (E, nu, density) ----
    mats, mat_of = {}, {}
    for eid, b in m.beams.items():
        dens = b["w"] / b["A"] if b["w"] else 0.0
        key = (round(b["E"], 3), round(b["E"] / (2 * b["G"]) - 1, 6), float(f"{dens:.6g}"))
        if key not in mats:
            mats[key] = len(mats) + 1
        mat_of[eid] = mats[key]
    # ---- sections ----
    secs, sec_of, sec_def, comp_of = {}, {}, {}, {}
    for eid, b in m.beams.items():
        mem = members.get(eid, {})
        shp = mem.get("shape")
        ofs = "CT" if mem.get("off") else "CC"   # deck-top reference (D-48): top of section on the node = the solver's offset
        if shp and shp[0] == "rect":
            H, B = shp[1], shp[2]
            from .builder import _rect_J
            sf = round(b["J"] / _rect_J(B, H), 6)   # MIDAS computes J itself; a J other than St-Venant goes via *SECT-SCALE
            key = ("rect", round(H, 6), round(B, 6), 1.0 if abs(sf - 1) < 1e-6 else sf, ofs)
        elif shp and shp[0] == "circle":   # ("circle", D) or a filled steel tube ("circle", D, area scale, inertia scale on the gross circle)
            key = ("circle", round(shp[1], 6)) + (tuple(shp[2:4]) if len(shp) > 2 else ())
        elif shp and shp[0] == "composite":
            key = ("comp",) + tuple(_num(x) for x in (b["A"], b["Asy"], b["Asz"], b["J"], b["Iy"], b["Iz"])) + (id(shp[1]), id(shp[2]), ofs)
            comp_of[key] = (shp, b)
        else:
            key = ("value",) + tuple(_num(x) for x in (b["A"], b["Asy"], b["Asz"], b["J"], b["Iy"], b["Iz"]))   # as written
        if key not in secs:
            secs[key] = len(secs) + 1
            sec_def[secs[key]] = (key, mem.get("role", b.get("role", "")))
        sec_of[eid] = secs[key]
    L = [f"; {title}", "; Generated by pdf2bim (P3 model builder). NEEDS AN ENGINEER IMPORT TEST BEFORE USE.",
         f"; LOCAL COORDINATES: X = Easting - {E0:.3f}, Y = Northing - {N0:.3f}, Z = unchanged (level). Base point = project.base_point.",
         f";   To recover MGA: E = X + {E0:.3f}, N = Y + {N0:.3f}.",
         "; AXES: Iyy = vertical bending (strong), Izz = horizontal; Asy horizontal shear, Asz vertical shear. Beta 0 on every element.",
         "; Node / element numbers are renumbered 1..n; the map to the model ids is in the sidecar report.",
         "*UNIT", "   KN, M, KJ, C"]
    if eq:   # native BR13B values: lumped masses (iMASS 1), self weight converted to mass (iSMAS 1), g as below
        L += ["*STRUCTYPE    ; Structure Type", "; iSTYP, iMASS, iSMAS, bMASSOFFSET, bSELFWEIGHT, GRAV, TEMPER, bALIGNBEAM, bALIGNSLAB, bROTRIGID, nMassAtNode",
              "     0, 1, 1, YES, NO, 9.80665, 0, NO, NO, NO, 0"]
    L += ["*NODE", "; iNO, X, Y, Z"]
    for n in sorted(m.nodes):
        x, y, z = m.nodes[n]
        L.append(f"   {nmap[n]}, {x - E0:.5f}, {y - N0:.5f}, {z:.5f}")
    L += ["*ELEMENT", "; iEL, TYPE, iMAT, iPRO, iN1, iN2, ANGLE, iSUB"]
    for eid in sorted(m.beams):
        b = m.beams[eid]
        L.append(f"   {emap[eid]}, BEAM, {mat_of[eid]}, {sec_of[eid]}, {nmap[b['n1']]}, {nmap[b['n2']]}, 0, 0   ; {members.get(eid, {}).get('role', b.get('role', ''))}")
    # *FRAME-RLS — moment releases at web/nominal-member ends of rigid arms (grillage reference §4; ADR-042).
    # Flags Fx Fy Fz Mx My Mz; My = MIDAS local-y bending = solver Iy (vertical, strong axis) -> "000010".
    # Syntax from the engineer's native BR13B model (2026-10-28; *BEAMEND was rejected by MIDAS: "Invalid command").
    _DOF_CODE = {"Iy": "000010"}
    _beamend_rows = []
    for eid, mem in members.items():
        rel = mem.get("releases")
        if not rel:
            continue
        i_code = _DOF_CODE.get(rel.get("i"), "000000")
        j_code = _DOF_CODE.get(rel.get("j"), "000000")
        if i_code != "000000" or j_code != "000000":
            _beamend_rows.append((emap[eid], i_code, j_code))
    L += ["*MATERIAL", "; iMAT, TYPE, MNAME, SPHEAT, HEATCO, PLAST, TUNIT, bMASS, DAMPRATIO, [DATA1] = ELAST, POISN, THERMAL, DEN, MASS",
          "; Density = member weight / section area (kN/m3): gross-weight composite girders, massless dummies / deck strips / rigid members."]
    for (E, nu, dens), i in sorted(mats.items(), key=lambda q: q[1]):
        name = f"M{i}_E{E / 1e6:.1f}_d{dens:.1f}"[:16]
        L.append(f"   {i}, USER, {name}, 0, 0, , C, NO, 0.05, 2, {E:.0f}, {nu:g}, {alpha:.6g}, {dens:.6g}, 0")
    cs = [(i, k) for i, (k, _) in sorted(sec_def.items()) if k[0] == "comp"]
    if cs:   # syntax from the engineer's native BR13B model (2026-10-28); generated-file import not yet confirmed
        L += ["*SECT-PSCVALUE    ; Composite General: part 1 girder (main), part 2 deck; m, kN/m2",
              "; per part: STIFF1 (A, WAREA, Asy, Asz, Ixx, Iyy, Izz) / STIFF2 / STIFF3 for the part, then the same for the sum of parts,",
              ";   then iMAT-type, bMAIN, YES, E, POISN, OPOLY. Sum-of-parts STIFF1 = the solver's section exactly (WAREA = A so",
              ";   self weight = density x A whichever area MIDAS uses). Polygons: about the bounding-box centre of all parts."]
        for i, k in cs:
            shp, b = comp_of[k]
            L += _composite_gen(i, f"S{i}_girder"[:16], shp, b, k[-1])
        L.append("")
    L += ["*SECTION", "; iSEC, TYPE, SNAME, [OFFSET], bSD, bWE, SHAPE, [DATA1]",
          "; VALUE = 4 lines: header / Area, Asy, Asz, Ixx(torsion J), Iyy, Izz (m2, m4) / CyP..Cz / Y1..Z4 (stress points not populated)"]
    for i in sorted(sec_def):
        key, role = sec_def[i]
        nm = f"S{i}_{role}"[:16]
        if key[0] == "comp":
            continue   # written in *SECT-PSCVALUE, not repeated here
        if key[0] == "rect":
            L.append(f"   {i}, DBUSER, {nm}, {key[4]}, 0, 0, 0, 0, 0, 0, YES, NO, SB , 2, {key[1]:.6g}, {key[2]:.6g}, 0, 0, 0, 0, 0, 0, 0, 0")
        elif key[0] == "circle":   # solid round, D; syntax from the engineer's native BR13B export (2026-10-28)
            L.append(f"   {i}, DBUSER, {nm}, CC, 0, 0, 0, 0, 0, 0, YES, NO, SR , 2, {key[1]:.6g}, 0, 0, 0, 0, 0, 0, 0, 0, 0")
        else:
            A, Asy, Asz, J, Iy, Iz = key[1:]
            L += [f"   {i}, VALUE, {nm}, CC, 0, 0, 0, 0, 0, 0, YES, NO, SB, ROLL",
                  "        " + ", ".join((A, Asy, Asz, J, Iy, Iz)),
                  "        0, 0, 0, 0, 0, 0, 0, 0, 0, 0", "        0, 0, 0, 0, 0, 0, 0, 0"]
    # *SECT-SCALE rows (AREA, ASY, ASZ, IXX, IYY, IZZ, WGT): rect J other than St-Venant; filled steel tube piles (transformed to concrete)
    scl = [(i, (1, 1, 1, k[3], 1, 1, 1)) for i, (k, _) in sorted(sec_def.items()) if k[0] == "rect" and k[3] != 1.0]
    # weight: MIDAS = density (= member weight / transformed A) x gross A x WGT_SF, so WGT_SF = the area scale (UNVERIFIED: no native example)
    scl += [(i, (k[2], k[2], k[2], k[3], k[3], k[3], k[2])) for i, (k, _) in sorted(sec_def.items()) if k[0] == "circle" and len(k) > 2]
    L += ["*STLDCASE    ; Static Load Cases", "; LCNAME, LCTYPE, DESC", "   SW   , D , Self weight"] + [f"   {k}, {v.get('type', 'USER')}, " for k, v in cases.items()] + [""]
    groups = {}
    for n, ds in m.fixed.items():
        f = "".join("1" if d in ds else "0" for d in range(6)) + "0"
        groups.setdefault(f, []).append(nmap[n])
    # Boundary / load groups declared before use: the engineer's second MIDAS import (2026-10-26) gave
    # "Run Error : command in line ..." on the first *CONSTRAINT line, whose group was not defined (provisional fix).
    bg = [f"Support_{f}" for f in groups] + (["bearing"] if m.links and include_unverified else []) + (["Springs"] if m.springs and include_unverified else []) + (["J_scale"] if scl else []) + (["Releases"] if _beamend_rows else [])
    L += ["*BNDR-GROUP    ; Boundary Group", "; NAME, AUTOTYPE"] + [f"   {g}, 0" for g in bg] + [""]
    if gravity:
        L += ["*LOAD-GROUP    ; Load Group", "; NAME", "   SelfWeight"] + [f"   {k}" for k in cases] + [""]
    elif cases:
        L += ["*LOAD-GROUP    ; Load Group", "; NAME"] + [f"   {k}" for k in cases] + [""]
    L += ["*CONSTRAINT    ; Supports", "; NODE_LIST, CONST(Dx,Dy,Dz,Rx,Ry,Rz,Rw), GROUP"]
    for f, ids in groups.items():
        L.append(f"   {_node_list(sorted(ids))}, {f}, Support_{f}")
    if scl:   # native BR13B syntax; after *BNDR-GROUP, which declares J_scale (as the native file orders them)
        L += ["", "*SECT-SCALE    ; Section Stiffness Scale Factor", "; iSEC, AREA_SF, ASY_SF, ASZ_SF, IXX_SF, IYY_SF, IZZ_SF, WGT_SF, GROUP, iPart, bDiffIJ"]
        L += [f"   {i}, " + ", ".join(f"{x:.6g}" for x in f) + ", J_scale, 1, NO" for i, f in scl]
    if _beamend_rows:   # after *BNDR-GROUP, which declares Releases
        L += ["", "*FRAME-RLS    ; Beam End Release (Ry at the web/nominal-member ends of rigid arms, ADR-042)",
              "; ELEM_LIST, bVALUE, FLAG-i, Fxi, Fyi, Fzi, Mxi, Myi, Mzi / FLAG-j, Fxj, Fyj, Fzj, Mxj, Myj, Mzj, GROUP"]
        for eid_n, ic, jc in sorted(_beamend_rows):
            L += [f"   {eid_n}, NO, {ic}, 0, 0, 0, 0, 0, 0", f"             {jc}, 0, 0, 0, 0, 0, 0, Releases"]
    unverified = []
    if m.links:
        if include_unverified:
            unverified.append("*ELASTICLINK")
            L += ["", "; UNVERIFIED SYNTAX (dashboard export format, not yet confirmed by a MIDAS import): elastic links.",
                  ";   N1 = bearing seat (lower), N2 = bearing top; ANGLE = beta about the link axis; SDx = axial (vertical), SDy = across, SDz = along the girder.",
                  "*ELASTICLINK    ; Elastic Link",
                  "; iNO, iNODE1, iNODE2, LINK, ANGLE, R_SDx, R_SDy, R_SDz, R_SRx, R_SRy, R_SRz, SDx, SDy, SDz, SRx, SRy, SRz, bSHEAR, DRy, DRz, GROUP"]
            for i, (lid, l) in enumerate(sorted(m.links.items()), 1):
                if l["R"] is not None:
                    raise ValueError(f"link {lid}: explicit axes cannot be written (needs a beta angle)")
                k = l["k"]
                L.append(f"   {i}, {nmap[l['n1']]}, {nmap[l['n2']]}, GEN, {l['beta'] or 0:.4f}, NO, NO, NO, NO, NO, NO, "
                         + ", ".join(f"{v:.4e}" for v in k) + f", YES, {l['dry']}, {l['drz']}, {l.get('role', 'link')}")
        else:
            L.append("; elastic links NOT written (unverified syntax); the model is incomplete without them")
    if m.springs:
        if include_unverified:
            unverified.append("*SPRING")
            # Field order from the engineer's MIDAS Civil import of revision 44 (2026-10-26): the dashboard order (stiffness
            # straight after Type) gave 6 x "YES or No must be entered" + 2 x "The Real Number is invalid" per line, i.e.
            # MIDAS expects six YES/NO flags (F_SDx ... F_SRz; NO written, meaning not yet confirmed) before the six stiffnesses,
            # then DAMPING (YES/NO) and six damping coefficients before GROUP. Still UNVERIFIED until a clean re-import.
            L += ["", "; UNVERIFIED SYNTAX (field order from a MIDAS import error report, 2026-10-26; re-import to confirm): point springs, kN/m, global axes.",
                  "*SPRING    ; Point Spring Supports", "; NODE_LIST, Type, F_SDx, F_SDy, F_SDz, F_SRx, F_SRy, F_SRz, SDx, SDy, SDz, SRx, SRy, SRz, DAMPING, Cx, Cy, Cz, CRx, CRy, CRz, GROUP"]
            for n, k in sorted(m.springs.items()):
                L.append(f"   {nmap[n]}, LINEAR, NO, NO, NO, NO, NO, NO, " + ", ".join(f"{v:.4e}" if v else "0" for v in k) + ", NO, 0, 0, 0, 0, 0, 0, Springs")
        else:
            L.append("; point springs NOT written (unverified syntax); the model is incomplete without them")
    if m.loads:
        L.append("; nodal loads stored on the model itself are NOT written: pass them as a load case (cases=)")
    if gravity:
        L += ["", "*USE-STLD, SW", "", "*SELFWEIGHT    ; Self Weight", "; X, Y, Z, GROUP", "0, 0, -1, SelfWeight"]
    for k, v in cases.items():   # syntax from the engineer's native BR13B model (2026-10-28)
        if "beam" in v:   # uniform beam loads, global -Z, kN/m (native *BEAMLOAD UNILOAD GZ)
            L += ["", f"*USE-STLD, {k}", "", "*BEAMLOAD    ; Element Beam Loads", "; ELEM_LIST, CMD, TYPE, DIR, bPROJ, [ECCEN], [VALUE], GROUP"]
            L += [f"   {emap[e]}, BEAM   , UNILOAD, GZ, NO , NO, LY, , , , 0, {-w:.9g}, 1, {-w:.9g}, 0, 0, 0, 0, {k}, NO, 0, 0, NO, "
                  for e, w in sorted(v["beam"].items(), key=lambda q: emap[q[0]]) if w]
            continue
        if "strain" in v:
            el = sorted(v["strain"].items(), key=lambda q: emap[q[0]])
            L += ["", f"*USE-STLD, {k}"]
            unif = [(e, s_) for e, s_ in el if s_[1] == 0]
            grad = [(e, s_) for e, s_ in el if s_[1] != 0]
            if unif:
                L += ["", "*ELTEMPER    ; Element Temperatures", "; ELEM_LIST, TEMPER, GROUP"]
                L += [f"   {emap[e]}, {s_[0] / alpha:.9g}, " for e, s_ in unif]
            if grad:
                L += ["", "*BSTEMPER    ; Beam Section Temperature", "; ELEM_LIST, DIR, REF, NUM, GROUP, bPSC / TYPE, ELAST, THERMAL, B, H1, T1, H2, T2",
                      "; one band over the full depth, width 1 m, chosen so MIDAS's force / moment = E A e0 / E I phi of the platform"]
                for e, (e0, phi) in grad:
                    b = m.beams[e]; key, _ = sec_def[sec_of[e]]
                    H, czb = _composite_gen.geom[sec_of[e]] if key[0] == "comp" else ((key[1], key[1] / 2) if key[0] == "rect" else (None, None))
                    if H is None:
                        raise ValueError(f"temperature gradient on a section without a shape (beam {e})")
                    t1, t2 = _band(b["A"], b["Iy"], H, czb, e0, phi, alpha)
                    L += [f"   {emap[e]}, LZ, Top, 1, , NO", f"     ELEMENT, 0, 0, 1, 0, {t1:.9g}, {H:.9g}, {t2:.9g}"]
            continue
        if not any(any(abs(x) > 0 for x in f) for f in v["loads"].values()):
            continue   # empty case (NIL): declared in *STLDCASE only
        L += ["", f"*USE-STLD, {k}", "", "*CONLOAD    ; Nodal Loads", "; NODE_LIST, FX, FY, FZ, MX, MY, MZ, GROUP,STRTYPENAME"]
        for n, f in sorted(v["loads"].items(), key=lambda q: nmap[q[0]]):
            if any(abs(x) > 0 for x in f):
                L.append(f"   {nmap[n]}, " + ", ".join(f"{x:.9g}" for x in f) + f", {k},")
    if eq:   # native BR13B syntax; spectrum = the platform's Sa(T) points (code line copied from the native file)
        L += ["", "*LOADTOMASS    ; Load to Mass", "; DIR, bNODAL, bBEAM, bFLOOR, bPRES, GRAV",
              "   XYZ, YES, YES, YES, YES, 9.80665",   # X, Y, Z: owner choice 2026-10-28 (run g); token unverified until re-import (XY verified)
              "   " + ", ".join(f"{c}, 1" for c in eq["mass_cases"]),
              "", "*EIGEN-CTRL    ; Eigenvalue Analysis Control", f"   LANCZOS, {eq['modes']}, 20, 1, 1e-10, NO, 0, 0, NO",
              "", "*SFUNCTION    ; Spectrum Function", "; FUNC=NAME, iTYPE, iMETHOD, SCALE/MAX, GRAV, DRATIO, DESC, RMF / SPEC_CODE, [CODE_DATA] / PERIOD, VALUE ...",
              f"   FUNC=EQ_spectrum, 1, 0, 1, 9.80665, {eq['zeta']:g}, \"platform Sa(T): site {eq['site']} kp={eq['kp']:g} Z={eq['Z']:g}\", 1.000000",
              f"   AS 5100.2(2017), 1, {eq['kp']:g}, {eq['Z']:g}, 1.25, 6"]
        pts = [f"{T:.6f}, {v:.10g}" for T, v in eq["points"]]
        L += ["          " + ", ".join(pts[j:j + 2]) for j in range(0, len(pts), 2)]
        L += ["", "*SPLDCASE    ; Spectrum Load Cases", "; NAME=NAME, DIR, ANGLE, SCALE, PMFT, bDAMP, bECC, INTERP, DESC, ANGLTYPE, dCQC / COMTYPE, bADDSIGN, iSIGNTYPE, bMODE / FUNC / modes"]
        for nm, ang in (("EQ_L", eq["angle_L"]), ("EQ_T", eq["angle_L"] + 90.0)):
            L += [f"   NAME={nm}, XY, {ang:.6f}, 1, 1, NO, NO, LOG, , ANGLE, 0.3", "        CQC, NO, 0, YES", "        EQ_spectrum",
                  "        " + ",".join("YES, 1" for _ in range(eq["modes"]))]
    if combos:   # syntax from the engineer's native BR13B model (2026-10-28); factors: code-extracted-UNVERIFIED standards entries
        L += ["", "; Load combinations generated by the platform (AS 5100.2 rows). Factors are code-extracted-UNVERIFIED standards data.",
              "*LOADCOMB    ; Combinations", "; NAME=NAME, KIND, ACTIVE, bES, iTYPE, DESC, iSERV-TYPE, nLCOMTYPE, nSEISTYPE, LcomFactor ; line 1",
              ";      ANAL1, LCNAME1, FACT1, ...                                                         ; from line 2"]
        clean = lambda x: str(x).replace(",", " ")
        for c in combos:
            L.append(f"   NAME={clean(c['name'])}, GEN, ACTIVE, 0, {c['type']}, {clean(c['desc'])}, 0, 0, 0, 1")
            tl = [f"{k}, {n}, {f:.6g}" for k, n, f in c["terms"]]
            L += ["        " + ", ".join(tl[j:j + 3]) for j in range(0, len(tl), 3)]
    L += ["", "*ENDDATA"]
    rep = {"nodes": len(nmap), "elements": len(emap), "materials": len(mats), "sections": len(secs), "links": len(m.links), "springs": len(m.springs),
           "supports": sum(len(v) for v in groups.values()), "unverified_blocks": unverified,
           "load_cases": list(cases), "not_written": (["model nodal loads (pass as cases=)"] if m.loads else []) + ([] if include_unverified else ["*ELASTICLINK", "*SPRING"]),
           "node_map": nmap, "element_map": emap, "base_point": (E0, N0),
           "status": "NEEDS ENGINEER IMPORT TEST" + (" — contains UNVERIFIED syntax: " + ", ".join(unverified) if unverified else "")}
    text = "\n".join(L) + "\n"
    # MIDAS text input: keep the file ASCII (titles / names may carry typographic characters)
    text = text.replace("\u2013", "-").replace("\u2014", "-").replace("\u00d7", "x")
    text = text.encode("ascii", "replace").decode("ascii")
    return text, rep


def read_mct(text):
    """Minimal reader of the blocks write_mct produces (for round-trip tests). Returns plain dicts."""
    from .builder import _rect_J
    blocks, cur = {}, None
    for l in text.splitlines():
        if l.startswith("*"):
            cur = l.split()[0].split(";")[0].rstrip(",").upper()
            blocks.setdefault(cur, [])
            continue
        if cur and l.strip() and not l.strip().startswith(";"):
            blocks[cur].append(l.split(";")[0])
    sp = lambda l: [x.strip() for x in l.split(",")]
    out = {"nodes": {}, "els": {}, "mats": {}, "secs": {}, "cons": [], "links": [], "springs": [], "selfweight": None}
    for l in blocks.get("*NODE", []):
        p = sp(l); out["nodes"][int(p[0])] = tuple(float(x) for x in p[1:4])
    for l in blocks.get("*ELEMENT", []):
        p = sp(l); out["els"][int(p[0])] = (int(p[2]), int(p[3]), int(p[4]), int(p[5]))
    for l in blocks.get("*MATERIAL", []):
        p = sp(l); out["mats"][int(p[0])] = {"E": float(p[10]), "nu": float(p[11]), "alpha": float(p[12]), "den": float(p[13]), "name": p[2]}
    b = blocks.get("*SECTION", []); i = 0
    while i < len(b):
        p = sp(b[i])
        if p[1] == "VALUE":
            v = [float(x) for x in sp(b[i + 1])]
            out["secs"][int(p[0])] = dict(zip(("A", "Asy", "Asz", "J", "Iy", "Iz"), v)); i += 4
        elif p[1] == "DBUSER" and p[12] == "SB":
            H, B = float(p[14]), float(p[15]); A = H * B
            out["secs"][int(p[0])] = {"A": A, "Asy": 5 / 6 * A, "Asz": 5 / 6 * A, "J": _rect_J(B, H), "Iy": B * H ** 3 / 12, "Iz": H * B ** 3 / 12}; i += 1
            out["secs"][int(p[0])].update(H=H, czb=H / 2)
            if p[3] == "CT":
                out["secs"][int(p[0])]["dz"] = -H / 2
        elif p[1] == "DBUSER" and p[12] == "SR":
            D = float(p[14]); A = math.pi * D ** 2 / 4; I = math.pi * D ** 4 / 64
            out["secs"][int(p[0])] = {"A": A, "Asy": 0.9 * A, "Asz": 0.9 * A, "J": 2 * I, "Iy": I, "Iz": I}; i += 1   # 0.9 = substructure.PILE_ASHEAR
        else:
            raise ValueError(f"section line not understood: {b[i]}")
    fr = blocks.get("*FRAME-RLS", [])
    out["rels"] = {}
    for k in range(0, len(fr), 2):   # two lines per element: i flags, j flags + group
        e, fi, fj = int(sp(fr[k])[0]), sp(fr[k])[2], sp(fr[k + 1])[0]
        out["rels"][e] = tuple([j for j, c in enumerate(fi) if c == "1"] + [6 + j for j, c in enumerate(fj) if c == "1"])
    pv = blocks.get("*SECT-PSCVALUE", [])
    for k, l in enumerate(pv):   # COMPOSITE-GEN: the sum-of-parts STIFF1 follows the last PART's 3 part lines
        if l.strip().startswith("SECT="):
            sid = int(sp(l.split("=", 1)[1])[0])
            j = k + 1
            while j < len(pv) and not pv[j].strip().startswith("SECT="):
                if pv[j].strip().startswith("PART="):
                    last = j
                j += 1
            v = [float(x) for x in sp(pv[last + 4])]
            out["secs"][sid] = dict(zip(("A", "Asy", "Asz", "J", "Iy", "Iz"), (v[0],) + tuple(v[2:7])))
            zs, inpoly = [], False
            for q in pv[k + 1:j]:
                t_ = q.strip()
                inpoly = t_.startswith("OPOLY=") or (inpoly and not t_.startswith("PART="))
                if inpoly:
                    zs += [float(x) for x in sp(t_.replace("OPOLY=", ""))][1::2]
            out["secs"][sid].update(H=max(zs) - min(zs), czb=float(sp(pv[last + 5])[9]))
            if sp(l.split("=", 1)[1])[3] == "CT":   # top of all parts on the node: dz = -(bbox height - sum Cz)
                out["secs"][sid]["dz"] = -(max(zs) - min(zs) - float(sp(pv[last + 5])[9]))
    for l in blocks.get("*SECT-SCALE", []):
        p = sp(l)
        sec = out["secs"][int(p[0])]
        for k, f in zip(("A", "Asy", "Asz", "J", "Iy", "Iz"), p[1:7]):
            sec[k] *= float(f)
    for l in blocks.get("*CONSTRAINT", []):
        p = sp(l); out["cons"].append(([int(x) for x in p[0].split()], p[1]))
    for l in blocks.get("*ELASTICLINK", []):
        p = sp(l); out["links"].append({"n1": int(p[1]), "n2": int(p[2]), "beta": float(p[4]), "k": [float(x) for x in p[11:17]], "dry": float(p[18]), "drz": float(p[19])})
    for l in blocks.get("*SPRING", []):
        p = sp(l); o = 8 if p[2].upper() in ("YES", "NO") else 2   # F_ flags before the stiffnesses (current) or the older order
        out["springs"].append((int(p[0]), [float(x) for x in p[o:o + 6]]))
    out["cases"], cur_lc, cur_blk = {}, None, None
    for l in text.splitlines():
        if l.startswith("*USE-STLD"):
            cur_lc = l.split(",", 1)[1].strip()
        elif l.startswith("*"):
            cur_blk = l.split()[0].upper()
        elif cur_blk == "*CONLOAD" and l.strip() and not l.strip().startswith(";"):
            p = sp(l)
            out["cases"].setdefault(cur_lc, {})[int(p[0])] = tuple(float(x) for x in p[1:7])
        elif cur_blk == "*BEAMLOAD" and l.strip() and not l.strip().startswith(";"):
            p = sp(l)
            out.setdefault("beamloads", {}).setdefault(cur_lc, {})[int(p[0])] = -float(p[11])
        elif cur_blk == "*ELTEMPER" and l.strip() and not l.strip().startswith(";"):
            p = sp(l)
            out.setdefault("temps", {}).setdefault(cur_lc, {})[int(p[0])] = ("T", float(p[1]))
        elif cur_blk == "*BSTEMPER" and l.strip() and not l.strip().startswith(";"):
            p = sp(l)
            if p[0] == "ELEMENT":   # band line of the element above: B, H1, T1, H2, T2
                out["temps"][cur_lc][bs_el] = ("B",) + tuple(float(x) for x in p[3:8])
            else:
                bs_el = int(p[0]); out.setdefault("temps", {}).setdefault(cur_lc, {})
    out["combos"], cb = [], None
    for l in blocks.get("*LOADCOMB", []):
        q = l.strip()
        if q.startswith("NAME="):
            p = sp(q[5:]); cb = {"name": p[0], "type": int(p[4]), "terms": []}; out["combos"].append(cb)
        else:
            p = sp(q); cb["terms"] += [(p[j], p[j + 1], float(p[j + 2])) for j in range(0, len(p) - 2, 3)]
    sw = blocks.get("*SELFWEIGHT", [])
    if sw:
        out["selfweight"] = tuple(float(x) for x in sp(sw[0])[:3])
    return out
