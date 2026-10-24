"""Super-T girder outline and properties from the product library + project overrides (one definition, ADR-004).

    sec = supert_section(params, w_left, w_right, conf)   # mm
      params : dict of shape parameters (D, bw, tw, d1, d2, ttf, S, fW, fD, r, ifW, ifD, ch) — product type values
               with the project's drawing overrides applied (see resolve_params)
      w_left, w_right : flange-tip distances from the girder centreline (mm); asymmetric for flared edge girders
      conf   : 'open' (open top flange with recesses, trough open to the deck), 'closed' (closed top flange, void),
               'solid' (end block: outer outline, no void)
    -> {'outline': [...], 'void': [...], 'A', 'yc' (from soffit), 'xc', 'Ix', 'Iy', ...}

Geometry is a port of the dashboard's secGeom() (Section designer, itself a port of the workbook SectionDesigner tab),
generalised to unequal left / right flange widths. The left and right halves differ only in the flange tip position.
"""
import json, os
from .polygon import props, Part

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(HERE, "..", "..", "library", "products", "supert.json")
KEYS = ("D", "bw", "tw", "d1", "d2", "ttf", "S", "fW", "fD", "r", "ifW", "ifD", "ch")


def library(path=None):
    return json.load(open(path or LIB))


def resolve_params(type_key, overrides=None, lib=None):
    """Type dimensions <- shared defaults <- project overrides. Returns (params, provenance per key)."""
    lib = lib or library()
    if type_key not in lib["types"]:
        raise KeyError(f"Super-T type {type_key!r} not in the product library")
    p, src = {}, {}
    for k in KEYS:
        if overrides and overrides.get(k) is not None:
            p[k], src[k] = float(overrides[k]), "project override"
        elif k in lib["types"][type_key]:
            p[k], src[k] = float(lib["types"][type_key][k]), f"library {type_key}"
        elif k in lib["defaults"]:
            p[k], src[k] = float(lib["defaults"][k]), "library default"
        else:
            raise KeyError(f"Super-T parameter {k} not defined for {type_key}")
    return p, src


def outline(p, w_left, w_right, conf):
    D, bw, tw, d1, d2, ttf, S = (p[k] for k in ("D", "bw", "tw", "d1", "d2", "ttf", "S"))
    fW, fD, r, ifW, ifD, ch = (p[k] for k in ("fW", "fD", "r", "ifW", "ifD", "ch"))
    th = tw * (1 + 1 / (S * S)) ** 0.5          # horizontal web thickness
    yfu, yf = D - ttf, d2 + d1                   # flange underside, void floor at the web
    xo = lambda y: bw / 2 + y / S                # outer web face
    xi = lambda y: xo(y) - th                    # inner web face
    b1 = xi(yf)
    if w_left < xo(yfu) + fW or w_right < xo(yfu) + fW:
        raise ValueError(f"flange tip inside the outer fillet: need >= {xo(yfu) + fW:.1f} mm each side")
    base = [(w_right, D), (w_right, yfu), (xo(yfu) + fW, yfu), (xo(yfu - fD), yfu - fD), (xo(ch), ch), (bw / 2 - ch, 0),
            (-(bw / 2 - ch), 0), (-xo(ch), ch), (-xo(yfu - fD), yfu - fD), (-(xo(yfu) + fW), yfu), (-w_left, yfu), (-w_left, D)]
    void = []
    if conf == "solid":
        o = base
    elif conf == "open":
        xr = xi(D - r)
        o = base + [(-(xr + r), D), (-(xr + r), D - r), (-xr, D - r), (-b1, yf), (0, d2), (b1, yf), (xr, D - r), (xr + r, D - r), (xr + r, D)]
    elif conf == "closed":
        o = base
        void = [(xi(yfu) - ifW, yfu), (xi(yfu - ifD), yfu - ifD), (b1, yf), (0, d2), (-b1, yf), (-xi(yfu - ifD), yfu - ifD), (-(xi(yfu) - ifW), yfu)]
    else:
        raise ValueError(f"conf must be open / closed / solid, not {conf!r}")
    return o, void, {"th": th, "yfu": yfu, "yf": yf, "b1": b1, "web_outer_top": xo(yfu), "trough_half_top": xi(D - r) + r if conf == "open" else None}


def supert_section(p, w_left, w_right, conf="open"):
    o, v, aux = outline(p, w_left, w_right, conf)
    parts = [Part(o)] + ([Part(v, void=True)] if v else [])
    pr = props(parts)
    D = p["D"]
    return {"conf": conf, "outline": o, "void": v, "A": pr["A"], "yc": pr["yc"], "xc": pr["xc"], "Ix": pr["Ix"], "Iy": pr["Iy"],
            "Zb": pr["Ix"] / pr["yc"], "Zt": pr["Ix"] / (D - pr["yc"]), "w_left": w_left, "w_right": w_right, **aux}
