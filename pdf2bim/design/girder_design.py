"""Super-T girder ULS flexure along the girder (P4.5 stage 5c). kN, kN m.

    from pdf2bim.design.girder_design import flexure_along
    out = flexure_along(doc, geo, S, CA, std, girder="G2", allow_proposed=False)

For every P2 station of the girder with an open section (solid end zones excluded):
- the design section (pdf2bim.design.stations) with each bonded strand's EFFECTIVE prestrain from the prestress-loss
  analysis at that position and the last reported time (pdf2bim.design.prestress, inputs from
  pdf2bim.design.prestress_inputs); fpb = MBL / area from AS5100.5:strand:table_3_3_1 when materials.strand.fpb is empty;
- the design actions: the ULS sagging maximum and hogging minimum of the composite girder, interpolated linearly
  between the two girder element ends that bracket the station (combined_actions envelopes; the governing row of the
  nearer end is reported);
- phi Mu (pdf2bim.design.flexure.uls_bend) and the utilisation M* / phi Mu (sagging).
NOT included yet (stage 6): staged SLS stresses, cracking moment / minimum strength, hogging capacity, shear and torsion
(fitments missing in the example description), strand development in the transmission zone. Results are INDICATIVE: inputs Assumed,
standards values unverified, strand / bar layout a placeholder (D-1).
"""
import math
import numpy as np
from ..description import MissingInput
from .stations import station_section
from .flexure import uls_bend
from .prestress import run as hog_run, strand_forces_at
from .prestress_inputs import hog_inputs


def _element_ends(CA, mdl, geo, girder):
    """[(distance from girder end A along the chord (m), response index of M (end), (line, eid), end)] for the girder."""
    gg = next(g for g in geo["girders"] if g["id"] == girder)
    E0 = np.array([gg["end_A"]["E"], gg["end_A"]["N"]]); u = np.array(gg["unit_t"])
    m = mdl["model"]
    ix = {n: i for i, n in enumerate(CA["names"])}
    out = []
    for x in mdl["members"]:
        if x["role"] != "girder" or x["line"] != girder:
            continue
        for end, nid in ((1, x["n1"]), (2, x["n2"])):
            d = float((np.asarray(m.nodes[nid][:2]) - E0) @ u)
            out.append((d, ix[("G", (girder, x["id"]), f"M{end}")], (girder, x["id"]), end))
    return out


def flexure_along(doc, geo, S, CA, mdl, std, girder, allow_proposed=False, time=None):
    H = hog_inputs(doc, geo, S, girder, std, allow_proposed)
    p = H["p"]
    r = hog_run(p, std)
    Lm = p["L"] / 1000.0
    ends = _element_ends(CA, mdl, geo, girder)
    E = CA["envelopes"]["ULS"]
    fpb_tab = p["mbl"] * 1e3 / p["Ap"]
    rows, notes = [], []
    for st_row in S["girders"][girder]["stations"]:
        t = st_row["t"]
        st = station_section(doc, geo, S, girder, t, allow_proposed)
        if st["conf"] != "open":
            continue
        sec = st["section"]
        F = strand_forces_at(r, st["x_m"] * 1000.0, time)
        ok = True
        for td in sec.tend:
            Fk = F[td["k_on"]]
            if Fk <= 0:
                ok = False
            td["epe"] = Fk * 1e3 / (td["A"] * td["E"]) if Fk > 0 else 0.0
            if td.get("fpb") is None:
                td["fpb"] = fpb_tab
        sec.tend = [td for td in sec.tend if td["epe"] > 0]          # strands without force here (debonded / not yet transmitted) carry nothing
        u = uls_bend(sec, std)
        x0 = st["x_m"]
        lo = max((q for q in ends if q[0] <= x0), key=lambda q: q[0], default=None)
        hi = min((q for q in ends if q[0] >= x0), key=lambda q: q[0], default=None)
        lo, hi = lo or hi, hi or lo
        w = 0.0 if hi[0] == lo[0] else (x0 - lo[0]) / (hi[0] - lo[0])
        Ms = float((1 - w) * E["max"][lo[1]] + w * E["max"][hi[1]]); Mh = float((1 - w) * E["min"][lo[1]] + w * E["min"][hi[1]])
        near = lo if w < 0.5 else hi
        rows.append({"t": t, "x_m": x0, "element": near[2][1], "end": near[3], "bracket_m": [lo[0], hi[0]], "dist_to_station_m": abs(near[0] - x0),
                     "M_sag": Ms, "row_sag": E["gmax"][near[1]], "M_hog": Mh, "row_hog": E["gmin"][near[1]],
                     "phiMu": u["phiMu"], "Mu": u["Mu"], "phi": u["phi"], "dn": u["dn"], "kuo": u["kuo"], "n_strands": len(sec.tend),
                     "sigma_pe_mean": float(np.mean([td["epe"] * td["E"] for td in sec.tend])) if sec.tend else 0.0,
                     "u_sag": Ms / u["phiMu"] if u["phiMu"] > 0 else math.inf})
    if not rows:
        raise MissingInput(f"girder {girder}: no open-section station")
    if p.get("mbl") and (doc.get("materials") or {}).get("strand"):
        notes.append(f"fpb = MBL / area = {fpb_tab:.0f} MPa from AS5100.5:strand:table_3_3_1 (materials.strand.fpb empty)")
    return {"girder": girder, "rows": rows, "time_days": r["res"][-1]["t"] if time is None else time, "hog_method": r["method"],
            "notes": notes + ["sagging only; hogging capacity, SLS staged stresses, minimum strength, shear / torsion and strand development not yet checked"],
            "provisional": H["provisional"], "standards_status": std.result_status()}
