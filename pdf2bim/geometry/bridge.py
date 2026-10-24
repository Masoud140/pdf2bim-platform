"""Bridge geometry from a bridge description (format 0.1 or 0.2): supports, bearing points, straight girder chords,
deck edges, flange edges. MGA metres; stable ids (support 'A', girder 'G1', bearing 'A-G1').

    from pdf2bim.geometry.bridge import build_geometry
    geo = build_geometry(doc, allow_proposed=False)

Definitions (docs/P1_GEOMETRY_METHOD.md):
- Support line: straight, through the control line at its chainage, direction = its whole-circle bearing.
- Bearing centre of girder m at support S: where girder m's line (control line offset by line_offset_S, measured
  square to the control line) crosses support line S.
- Girder: STRAIGHT chord between its two bearing centres (ADR-003), extended past each bearing by bearing_offset.
- Deck edge: control line offset by deck.edge_left / edge_right.
- Flange edges (ADR-004): measured square to the chord. Inner edge = half the clear distance to the neighbour chord
  minus flange_gap/2; outer edge of the first / last girder = the deck edge minus edge_flange_setback.
Inputs that are missing raise GeometryInputError, naming the field. Nothing is defaulted.
With allow_proposed=True a PROPOSED override is used instead of the current value; every such use is listed in
geo['provisional'] and the result must be treated as provisional.
"""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "schema"))
from c14n import content_hash
from .alignment import Alignment, GeometryInputError


class Reader:
    """Reads effective values from a description, recording every proposed value used."""

    def __init__(self, doc, allow_proposed=False):
        self.doc, self.allow, self.provisional = doc, allow_proposed, []

    def rec(self, rec, path):
        if rec is None:
            raise GeometryInputError(f"{path}: missing")
        if self.allow:
            prop = [o for o in rec.get("overrides", []) if o["approval"]["status"] == "proposed"]
            if prop:
                o = prop[-1]
                self.provisional.append({"path": path, "override": o["id"], "decision": o.get("decision"), "author": o.get("author"),
                                         "value": o["value"], "reason": o.get("reason", "")[:200]})
                return o["value"], o.get("tag")
        if "cells" in rec and "value" not in rec:
            return rec["cells"], rec.get("tag")
        return rec.get("value"), rec.get("tag")

    def value(self, rec, path, required=True):
        v, _ = self.rec(rec, path) if rec is not None else (None, None)
        if v is None and required:
            raise GeometryInputError(f"{path}: value missing (tag {rec.get('tag') if rec else None})")
        return v

    def rows(self, table, path):
        if not table or "rows" not in table:
            raise GeometryInputError(f"{path}: table missing")
        return [self.rec(r, f"{path}.rows[{i}]")[0] for i, r in enumerate(table["rows"])]


def _line_offset_curve_intersection(al, C, u, offset, guess):
    """Chainage where the offset curve (offset from the control line) crosses the line C + t*u. Secant iteration."""
    f = lambda ch: (lambda P: (P[0] - C[0]) * u[1] - (P[1] - C[1]) * u[0])(al.point(ch, offset))
    a, b = guess - 1.0, guess + 1.0
    fa, fb = f(a), f(b)
    for _ in range(80):
        if fb == fa:
            break
        c = b - fb * (b - a) / (fb - fa)
        a, fa, b, fb = b, fb, c, f(c)
        if abs(fb) < 1e-11:
            break
    if abs(fb) > 1e-7:
        raise GeometryInputError(f"support line does not cross the offset curve {offset} near ch {guess}")
    return b


def _ray_to_offset(al, P, n, target, ch_guess, lam_max=20.0):
    """Distance lam >= 0 along unit vector n from P to the offset curve `target`. Bisection on station offset."""
    g = lambda lam: al.station(P[0] + lam * n[0], P[1] + lam * n[1], guess=ch_guess)[1] - target
    lo, hi = 0.0, lam_max
    glo, ghi = g(lo), g(hi)
    if glo * ghi > 0:
        return None
    for _ in range(100):
        mid = (lo + hi) / 2
        gm = g(mid)
        if glo * gm <= 0:
            hi, ghi = mid, gm
        else:
            lo, glo = mid, gm
        if hi - lo < 1e-9:
            break
    return (lo + hi) / 2


def _ray_to_line(P, n, A, B):
    """Distance along n from P to the infinite line AB (None if parallel)."""
    e = (B[0] - A[0], B[1] - A[1])
    den = n[0] * e[1] - n[1] * e[0]
    if abs(den) < 1e-12:
        return None
    return ((A[0] - P[0]) * e[1] - (A[1] - P[1]) * e[0]) / den


def build_geometry(doc, allow_proposed=False, stations=(0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0)):
    rd = Reader(doc, allow_proposed)
    A = doc.get("alignment") or {}
    hrows = rd.rows(A.get("horizontal"), "alignment.horizontal")
    vrows = rd.rows(A.get("vertical"), "alignment.vertical") if A.get("vertical") else None
    al = Alignment(hrows, vrows)
    checks = []
    for m in al.misclosure():
        checks.append({"id": f"alignment.misclosure.row{m['row']}", "what": f"integrated vs tabulated start point of element {m['row']} (ch {m['ch']})",
                       "value_m": m["dist"], "limit_m": 0.005, "pass": m["dist"] <= 0.005, "basis": "CONTROL_LINE_RECONSTRUCTION_METHOD §5 (<5 mm)"})

    # ---- supports ----
    sup = {}
    srows = rd.rows(A.get("support_lines"), "alignment.support_lines")
    for i, c in enumerate(srows):
        sid = c.get("support")
        if c.get("ch") is None:
            raise GeometryInputError(f"alignment.support_lines.rows[{i}].ch missing")
        if c.get("bearing") is None:
            raise GeometryInputError(f"alignment.support_lines.rows[{i}].bearing missing: the support-line direction is needed "
                                     "(skew alone has no sign convention). Add the bearing printed on the skew diagram.")
        E, N, b = al.point(c["ch"])
        sup[sid] = {"id": sid, "ch": c["ch"], "E": E, "N": N, "RL": al.vertical.rl(c["ch"]) if al.vertical else None,
                    "bearing": c["bearing"] % 180, "control_line_bearing": b, "skew_input": c.get("skew"), "u": (math.sin(math.radians(c["bearing"])), math.cos(math.radians(c["bearing"])))}
    ids = sorted(sup, key=lambda k: sup[k]["ch"])
    if len(ids) >= 2:
        a, z = sup[ids[0]], sup[ids[-1]]
        chord = math.degrees(math.atan2(z["E"] - a["E"], z["N"] - a["N"]))
        for s in sup.values():
            nrm = (chord + 90) % 180
            sk_chord = ((s["bearing"] - nrm + 90) % 180) - 90
            sk_local = ((s["bearing"] - (s["control_line_bearing"] + 90) + 90) % 180) - 90
            s["skew_to_chord_normal"], s["skew_to_local_normal"] = sk_chord, sk_local
            if s["skew_input"] is not None:
                d = abs(abs(sk_chord) - abs(s["skew_input"]))
                checks.append({"id": f"support.{s['id']}.skew_consistency", "what": "|bearing − normal to the support-to-support chord| vs the skew given",
                               "value_deg": d, "limit_deg": 0.01, "pass": d <= 0.01, "basis": "independent cross-check of two drawing values",
                               "note": f"skew to chord normal {sk_chord:.4f}°, to the local normal {sk_local:.4f}°"})

    # ---- girders ----
    S = doc.get("superstructure") or {}
    members = S.get("members") or []
    if not members:
        raise GeometryInputError("superstructure.members: none")
    sa, sb = ids[0], ids[-1]
    girders = []
    for m in members:
        gid = m["id"]
        p = f"superstructure.members[{gid}]"
        oA = rd.value(m.get("line_offset_A"), p + ".line_offset_A")
        oB = rd.value(m.get("line_offset_B"), p + ".line_offset_B")
        straight = rd.value(m.get("straight"), p + ".straight", required=False)
        if straight is False:
            raise GeometryInputError(f"{p}.straight is false: only straight chords are implemented (ADR-003)")
        pts = {}
        for sid, o in ((sa, oA), (sb, oB)):
            s = sup[sid]
            ch = _line_offset_curve_intersection(al, (s["E"], s["N"]), s["u"], o, s["ch"])
            E, N, _ = al.point(ch, o)
            pts[sid] = {"E": E, "N": N, "ch": ch, "offset": o}
        PA, PB = pts[sa], pts[sb]
        d = (PB["E"] - PA["E"], PB["N"] - PA["N"])
        L = math.hypot(*d)
        t = (d[0] / L, d[1] / L)
        bo_a = rd.value(m.get("bearing_offset_A"), p + ".bearing_offset_A", required=False)
        bo_b = rd.value(m.get("bearing_offset_B"), p + ".bearing_offset_B", required=False)
        g = {"id": gid, "bearing_A": PA, "bearing_B": PB, "chord_length_bearings": L, "chord_bearing": math.degrees(math.atan2(*t)) % 360,
             "unit_t": t}
        if bo_a is not None and bo_b is not None:
            g["end_A"] = {"E": PA["E"] - t[0] * bo_a / 1000, "N": PA["N"] - t[1] * bo_a / 1000}
            g["end_B"] = {"E": PB["E"] + t[0] * bo_b / 1000, "N": PB["N"] + t[1] * bo_b / 1000}
            g["length_end_to_end"] = L + (bo_a + bo_b) / 1000
        else:
            g["missing"] = ["bearing_offset_A/B (girder ends not placed)"]
        # mid-chord offset from the control line (shows chord vs curve)
        mid = ((PA["E"] + PB["E"]) / 2, (PA["N"] + PB["N"]) / 2)
        g["midchord_station"] = al.station(*mid, guess=(PA["ch"] + PB["ch"]) / 2)
        if al.vertical:
            for P in (PA, PB):
                P["RL_control_line"] = al.vertical.rl(P["ch"])
        girders.append(g)
    girders.sort(key=lambda g: (g["bearing_A"]["offset"] + g["bearing_B"]["offset"]) / 2)

    # ---- deck edges ----
    D = doc.get("deck") or {}
    eL = rd.value(D.get("edge_left"), "deck.edge_left")
    eR = rd.value(D.get("edge_right"), "deck.edge_right")
    deck = {"edge_left_offset": eL, "edge_right_offset": eR, "edges": {}}
    for name, o in (("left", eL), ("right", eR)):
        pts = []
        for sid in (sa, sb):
            s = sup[sid]
            ch = _line_offset_curve_intersection(al, (s["E"], s["N"]), s["u"], o, s["ch"])
            E, N, _ = al.point(ch, o)
            pts.append({"support": sid, "E": E, "N": N, "ch": ch})
        deck["edges"][name] = pts
    deck["missing"] = ["deck end lines (position of the deck end relative to the support line is not in the description)"]

    # ---- flange edges along each chord (ADR-004) ----
    gap = rd.value(S.get("flange_gap"), "superstructure.flange_gap")
    setback = rd.value(S.get("edge_flange_setback"), "superstructure.edge_flange_setback")
    for j, g in enumerate(girders):
        PA, PB, t = g["bearing_A"], g["bearing_B"], g["unit_t"]
        nR = (t[1], -t[0])  # right of the chord direction (A -> B)
        rows = []
        for f in stations:
            P = (PA["E"] + f * (PB["E"] - PA["E"]), PA["N"] + f * (PB["N"] - PA["N"]))
            chg = PA["ch"] + f * (PB["ch"] - PA["ch"])
            out = {"t": f}
            for side, n, nb in (("right", nR, girders[j + 1] if j + 1 < len(girders) else None), ("left", (-nR[0], -nR[1]), girders[j - 1] if j > 0 else None)):
                if nb is not None:
                    dist = _ray_to_line(P, n, (nb["bearing_A"]["E"], nb["bearing_A"]["N"]), (nb["bearing_B"]["E"], nb["bearing_B"]["N"]))
                    out[side] = dist / 2 * 1000 - gap / 2 if dist is not None else None
                    out[side + "_to"] = nb["id"]
                else:
                    dist = _ray_to_offset(al, P, n, eR if side == "right" else eL, chg)
                    out[side] = dist * 1000 - setback if dist is not None else None
                    out[side + "_to"] = "deck edge " + side
            out["width"] = (out["left"] or 0) + (out["right"] or 0) if out["left"] is not None and out["right"] is not None else None
            rows.append(out)
        g["flange"] = rows

    return {"format": "pdf2bim.geometry/0.1", "coordinates": "MGA (as in the description), metres; offsets + right of increasing chainage",
            "input_hash": content_hash(doc), "input_format": doc.get("format"), "allow_proposed": allow_proposed,
            "provisional": rd.provisional,
            "alignment": {"seed_bearing": al.seed_bearing, "seed_derivation": al.seed_derivation, "misclosure": al.misclosure()},
            "supports": [{k: v for k, v in sup[k].items() if k != "u"} for k in ids], "girders": girders, "deck": deck, "checks": checks,
            "_alignment": al}
