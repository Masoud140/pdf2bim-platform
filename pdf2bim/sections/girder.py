"""Section properties of every girder along its length, from the bridge description + the P1 geometry (one Super-T
definition, ADR-004). Girder alone and composite with the deck slab, open / closed / solid.

    from pdf2bim.sections.girder import build_sections
    S = build_sections(doc, geo, allow_proposed=False, torsion_h=5.0)

Per girder, at the P1 flange stations (t = 0 … 1 between bearing centres):
- girder outline with asymmetric flange tips w_left / w_right = P1 flange edges (mm, square to the chord);
- composite: girder (E_g) + deck slab of width = deck tributary width (P1: flange edges + flange_gap/2 to each
  neighbour; to the deck edge on the outer side), thickness deck.slab_thickness, placed on the top flange
  (haunch = superstructure.supert_types[].haunch, default: MISSING -> stop), transformed by n = E_deck / E_girder;
- torsion J of the composite by FD on the actual geometry (single-material figure: the deck is not transformed for J;
  stated in the output), and of the girder alone.
Solid end zones are taken from supert_types[].zones; if that table is empty the output says so and only the open
section is produced along the whole length (nothing is assumed).
"""
import math
from ..description import Reader, MissingInput
from .supert import resolve_params, supert_section, library
from .polygon import props, Part
from .torsion import torsion_J


def _type_key(ref):
    if not ref or not str(ref).startswith("lib:supert/"):
        raise MissingInput(f"supert_types[].section must reference the product library (lib:supert/<type>), got {ref!r}")
    return str(ref).split("/", 1)[1]


def _material(rd, doc, which):
    rows = rd.rows((doc.get("materials") or {}).get("concrete"), "materials.concrete")
    for r in rows:
        el = (r.get("element") or "").lower()
        if (which == "girder" and "super-t" in el) or (which == "deck" and "deck" in el):
            if r.get("E") is None:
                raise MissingInput(f"materials.concrete[{r.get('element')}].E missing")
            return float(r["E"]), r
    raise MissingInput(f"materials.concrete: no row for the {which}")


def build_sections(doc, geo, allow_proposed=False, torsion_h=5.0, stations=None):
    rd = Reader(doc, allow_proposed)
    S = doc.get("superstructure") or {}
    types = {t["id"]: t for t in (S.get("supert_types") or [])}
    lib = library()
    tD = rd.value((doc.get("deck") or {}).get("slab_thickness"), "deck.slab_thickness")
    Eg, _ = _material(rd, doc, "girder")
    Ed, _ = _material(rd, doc, "deck")
    n = Ed / Eg
    gap = rd.value(S.get("flange_gap"), "superstructure.flange_gap")
    flags, out = [], {}
    members = {m["id"]: m for m in S.get("members") or []}
    for g in geo["girders"]:
        m = members[g["id"]]
        tref = rd.value(m.get("type_ref"), f"superstructure.members[{g['id']}].type_ref")
        T = types.get(tref)
        if T is None:
            raise MissingInput(f"superstructure.supert_types[{tref}] not found")
        tp = f"superstructure.supert_types[{tref}]"
        tkey = _type_key(rd.value(T.get("section"), tp + ".section"))
        shape = {r["key"]: r["value"] for r in rd.rows(T.get("shape"), tp + ".shape", required=False)} if T.get("shape") else {}
        if not shape:
            msg = f"{tp}.shape: no drawing overrides — product type {tkey} dimensions used unchanged"
            flags.append(msg) if msg not in flags else None
        depth = rd.value(T.get("depth"), tp + ".depth", required=False)
        if depth is not None and shape.get("D") not in (None, depth):
            raise MissingInput(f"{tp}: depth {depth} differs from shape D {shape.get('D')}")
        if depth is not None:
            shape.setdefault("D", depth)
        haunch = rd.value(T.get("haunch"), tp + ".haunch")
        p, prov = resolve_params(tkey, shape, lib)
        zones = rd.rows(T.get("zones"), tp + ".zones", required=False)
        if not zones:
            msg = f"{tp}.zones empty: solid end blocks not defined — open section used over the whole girder (not assumed)"
            flags.append(msg) if msg not in flags else None
        rows = []
        for f in g["flange"]:
            if stations is not None and not any(abs(f["t"] - s) < 1e-9 for s in stations):
                continue
            wl, wr = f["left"], f["right"]
            dl = wl + (gap / 2 if f["left_to"].startswith("G") else 0.0)
            dr = wr + (gap / 2 if f["right_to"].startswith("G") else 0.0)
            gs = supert_section(p, wl, wr, "open")
            y0 = p["D"] + haunch
            deck = [(-dl, y0), (dr, y0), (dr, y0 + tD), (-dl, y0 + tD)]
            comp = props([Part(gs["outline"]), Part(deck, n=n)])
            J_g = torsion_J([gs["outline"]], [], torsion_h)
            J_c = torsion_J([gs["outline"], deck] + ([[(-gs["trough_half_top"], p["D"]), (gs["trough_half_top"], p["D"]), (gs["trough_half_top"], y0), (-gs["trough_half_top"], y0)]] if haunch > 0 else []), [], torsion_h)
            rows.append({"t": f["t"], "w_left": wl, "w_right": wr, "deck_left": dl, "deck_right": dr,
                         "girder": {"A": gs["A"], "yc": gs["yc"], "Ix": gs["Ix"], "Iy": gs["Iy"], "J": J_g},
                         "composite": {"A_transformed": comp["A"], "yc": comp["yc"], "xc": comp["xc"], "Ix": comp["Ix"], "Iy": comp["Iy"], "J_geometric": J_c},
                         "outline": gs["outline"], "deck": deck})
        # solid end blocks (zones): positions along the girder and the solid sections at each end
        Lg = g.get("length_end_to_end")
        zl = []
        for z in zones:
            kind = z.get("kind")
            if kind not in ("solid_end_A", "solid_end_B", "solid", "open"):
                raise MissingInput(f"{tp}.zones: unknown kind {kind!r}")
            if kind == "solid_end_A":
                zl.append({"kind": "solid", "end": "A", "from_end_A": z["from"], "to_end_A": z["to"]})
            elif kind == "solid_end_B":
                if Lg is None:
                    raise MissingInput(f"{tp}.zones: solid_end_B needs the girder length (bearing offsets)")
                zl.append({"kind": "solid", "end": "B", "from_end_A": Lg - z["to"], "to_end_A": Lg - z["from"]})
            else:
                zl.append({"kind": kind, "end": None, "from_end_A": z["from"], "to_end_A": z["to"]})
        solid = {}
        for end, f in (("A", g["flange"][0]), ("B", g["flange"][-1])):
            if not any(z["kind"] == "solid" and z["end"] == end for z in zl):
                continue
            wl, wr = f["left"], f["right"]
            dl = wl + (gap / 2 if f["left_to"].startswith("G") else 0.0)
            dr = wr + (gap / 2 if f["right_to"].startswith("G") else 0.0)
            ss = supert_section(p, wl, wr, "solid")
            y0 = p["D"] + haunch
            deck = [(-dl, y0), (dr, y0), (dr, y0 + tD), (-dl, y0 + tD)]
            comp = props([Part(ss["outline"]), Part(deck, n=n)])
            solid[end] = {"girder": {"A": ss["A"], "yc": ss["yc"], "Ix": ss["Ix"], "Iy": ss["Iy"], "J": torsion_J([ss["outline"]], [], torsion_h)},
                          "composite": {"A_transformed": comp["A"], "yc": comp["yc"], "xc": comp["xc"], "Ix": comp["Ix"], "Iy": comp["Iy"],
                                        "J_geometric": torsion_J([ss["outline"], deck], [], torsion_h)},
                          "deck_left": dl, "deck_right": dr, "w_left": wl, "w_right": wr, "outline": ss["outline"], "deck": deck}
        out[g["id"]] = {"type": tkey, "type_ref": tref, "params": p, "param_source": prov, "haunch": haunch, "stations": rows,
                        "zones": zl, "solid_end": solid, "length_end_to_end": Lg}
    return {"format": "pdf2bim.sections/0.1", "units": "mm, mm^2, mm^4; y from the girder soffit; x from the girder centreline (+ right)",
            "modular_ratio_deck": n, "E_girder_MPa": Eg, "E_deck_MPa": Ed, "deck_thickness": tD, "torsion_h": torsion_h,
            "notes": ["Composite J is computed on the actual geometry as one material (deck not transformed); n = %.4f." % n,
                      "Section properties are Calculated from the description; they are not verified against an independent section program."],
            "flags": flags, "provisional": rd.provisional, "girders": out}
