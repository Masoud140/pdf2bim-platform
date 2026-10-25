"""Design sections at stations along a Super-T girder (P4.5 stage 4a). N, mm, MPa.

    from pdf2bim.design.stations import station_section, readiness
    st = station_section(doc, geo, S, "G2", t=0.5, allow_proposed=False)   # S = pdf2bim.sections.build_sections(...)
    st["section"]        # pdf2bim.design.flexure.Section: deck + girder strips, bars, strands (y DOWN from the deck top)
    st["missing"]        # inputs the design checks still need (refusals are raised by the checks, not guessed here)
    readiness(doc, ...)  # per girder type: what is present / Assumed / missing for the design checks

Geometry from P2 (one definition): the girder outline of `supert_section` with the station's flange widths
(conf "open", or "solid" inside a solid-end zone), the deck slab over the station's deck widths at the girder top +
haunch, both as strips (strips_from_polygon). Materials from the description (girder / deck concrete f'c, E; strand
area, Ep, fpb; bar fsy, Es). Strands from supert_types[].strand_pattern (on, not debonded at the station: debond lengths
measured from each girder end), bars from supert_types[].bars (from / to if given). Effective prestress is NOT
computed here (time-dependent losses are not in the platform yet): tendons carry epe = None and the checks that need
it must refuse. Depths are measured down from the deck top; strand / bar y in the description is from the girder soffit.
"""
import math
from ..description import Reader, MissingInput
from ..sections.supert import supert_section
from .flexure import Section, strips_from_polygon


def _concrete(rd, doc):
    out = {}
    for r in rd.rows((doc.get("materials") or {}).get("concrete"), "materials.concrete"):
        el = (r.get("element") or "").lower()
        if "super-t" in el:
            out["girder"] = r
        elif "deck" in el:
            out["deck"] = r
    for k in ("girder", "deck"):
        if k not in out:
            raise MissingInput(f"materials.concrete: no row for the {k}")
        for q in ("fc", "E"):
            if out[k].get(q) is None:
                raise MissingInput(f"materials.concrete[{out[k].get('element')}].{q} missing")
    return out


def _one(rd, doc, key):
    rows = rd.rows((doc.get("materials") or {}).get(key), f"materials.{key}", required=False)
    return rows[0] if rows else None


def station_section(doc, geo, S, girder, t, allow_proposed=False, dz=2.0):
    """Design section of girder `girder` at normalised position t (0 = end A, 1 = end B) along its length."""
    rd = Reader(doc, allow_proposed)
    G = S["girders"].get(girder)
    if G is None:
        raise MissingInput(f"sections: girder {girder!r} not built")
    rows = G["stations"]
    st = min(rows, key=lambda r: abs(r["t"] - t))
    if abs(st["t"] - t) > 1e-9:
        raise MissingInput(f"sections: girder {girder} has no station at t = {t} (nearest {st['t']}); build the sections at the design stations")
    sup = doc.get("superstructure") or {}
    mem = next(m for m in sup.get("members") or [] if m["id"] == girder)
    tref = rd.value(mem.get("type_ref"), f"superstructure.members[{girder}].type_ref")
    T = next(x for x in sup.get("supert_types") or [] if x["id"] == tref)
    tp = f"superstructure.supert_types[{tref}]"
    p, haunch, tD = G["params"], G["haunch"], S["deck_thickness"]
    Lg = G["length_end_to_end"]
    x_m = t * Lg if Lg is not None else None                       # m from end A along the girder
    conf = "open"
    for z in G["zones"]:
        if z["kind"] == "solid" and x_m is not None and z["from_end_A"] - 1e-9 <= x_m <= z["to_end_A"] + 1e-9:
            conf = "solid"
    C = _concrete(rd, doc)
    fcg, Eg, fcd, Ed = float(C["girder"]["fc"]), float(C["girder"]["E"]), float(C["deck"]["fc"]), float(C["deck"]["E"])
    gs = supert_section(p, st["w_left"], st["w_right"], conf)
    D = p["D"]
    Dtot = tD + haunch + D
    dl, dr = st["deck_left"], st["deck_right"]
    deck = [(-dl, 0.0), (dr, 0.0), (dr, tD), (-dl, tD)]
    conc = strips_from_polygon(deck, tD, 0.0, Ed, fcd, "deck", dz) + strips_from_polygon(gs["outline"], D, tD + haunch, Eg, fcg, "girder", dz)
    if gs["void"]:
        raise MissingInput("closed Super-T sections (void) are not supported by the strip builder yet")
    missing, notes = [], []
    # strands
    sm = _one(rd, doc, "strand")
    tend = []
    pat = rd.rows(T.get("strand_pattern"), tp + ".strand_pattern", required=False)
    if not pat:
        missing.append(f"{tp}.strand_pattern")
    if sm is None:
        missing.append("materials.strand")
    else:
        for q in ("area", "Ep", "fpb"):
            if sm.get(q) is None:
                missing.append(f"materials.strand.{q}")
    k_on = -1
    for r in pat:
        if not r.get("on", True):
            continue
        k_on += 1
        if x_m is not None:
            dlb, drb = (r.get("debond_left") or 0) / 1000.0, (r.get("debond_right") or 0) / 1000.0
            if x_m < dlb or x_m > Lg - drb:
                continue
        A = float(sm["area"]) if sm and sm.get("area") is not None else math.pi / 4 * float(r["diameter"]) ** 2
        tend.append({"y": Dtot - float(r["y"]), "x": r.get("x"), "k_on": k_on, "A": A, "E": float(sm["Ep"]) if sm and sm.get("Ep") else None,
                     "fpb": float(sm["fpb"]) if sm and sm.get("fpb") is not None else None, "epe": None, "pre": None})
    missing.append("effective prestress (time-dependent losses are not in the platform yet)")
    # bars
    bm = _one(rd, doc, "reinforcement")
    bars = []
    for r in rd.rows(T.get("bars"), tp + ".bars", required=False):
        if x_m is not None and r.get("from") is not None and r.get("to") is not None and not (r["from"] - 1e-9 <= x_m <= r["to"] + 1e-9):
            continue
        n = int(r.get("number") or 1)
        bars.append({"y": Dtot - float(r["y"]), "A": n * math.pi / 4 * float(r["diameter"]) ** 2, "E": float(bm["Es"]), "fsy": float(bm["fsy"]), "grp": "girder", "d": float(r["diameter"]), "n": n})
    if bm is None and bars:
        raise MissingInput("materials.reinforcement missing")
    if not rd.rows(T.get("fitments"), tp + ".fitments", required=False):
        missing.append(f"{tp}.fitments (shear / torsion reinforcement)")
    if not [r for r in rd.rows(T.get("deck_bars"), tp + ".deck_bars", required=False) if r.get("diameter") is not None]:
        missing.append(f"{tp}.deck_bars")
    return {"section": Section(conc, bars, tend), "girder": girder, "t": t, "x_m": x_m, "conf": conf, "Dtot": Dtot, "y_girder_top": tD + haunch,
            "materials": {"fc_girder": fcg, "E_girder": Eg, "fc_deck": fcd, "E_deck": Ed}, "n_strands": len(tend), "n_bars": len(bars),
            "missing": missing, "provisional": rd.provisional + list(S.get("provisional") or [])}


def readiness(doc, geo, S, allow_proposed=False):
    """What the design checks have and still need, per girder (station t = 0.5)."""
    out = {}
    for g in S["girders"]:
        try:
            st = station_section(doc, geo, S, g, 0.5, allow_proposed)
            out[g] = {"strands": st["n_strands"], "bars": st["n_bars"], "missing": st["missing"]}
        except MissingInput as e:
            out[g] = {"error": str(e)}
    return out
