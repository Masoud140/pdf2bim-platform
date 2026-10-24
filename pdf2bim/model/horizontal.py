"""Horizontal load cases on the integrated model (stage P3c): earth pressure, traffic surcharge, braking, centrifugal.
kN, m. Characteristic (unfactored).

    from pdf2bim.model.horizontal import horizontal_cases
    H = horizontal_cases(doc, geo, mdl, std, allow_proposed=False)
    r = mdl['model'].solve(gravity=(0, 0, 0), loads=H['cases']['EP']['loads'])

As the dashboard (src/sub2.js slCases), generalised:
- EARTH PRESSURE on the back of each sill beam (supports[].backfill: gamma, phi, K = K0 | Ka, retained_height):
  K0 = 1 - sin(phi), Ka = (1 - sin phi) / (1 + sin phi); resultant per metre of sill 0.5 K gamma H^2 at H / 3 above the
  sill soffit (EP, both abutments), traffic surcharge K q H at H / 2 (EPTA behind A, EPTB behind B; q =
  loads.traffic_surcharge). Applied at the sill nodes with their tributary length along the sill, toward the span, with
  the moment of the eccentricity above the sill centroid. Retained height: supports[].backfill.retained_height if given,
  else CALCULATED = road level at the support setout point (geometry) - sill soffit there.
- BRAKING (loads.braking_force) shared equally by the deck-line nodes inside the carriageway, along the alignment
  tangent at each node: BRKp toward support B (increasing chainage), BRKm toward A.
- CENTRIFUGAL: F = W V^2 / (g R), W = the M1600 vehicle weight (12 axles x 2 wheels x wheel load, standards entry),
  V = loads.design_speed, R = the smallest radius of the alignment under the deck [Model: conservative single value];
  shared equally by the same nodes, outward (away from the centre of curvature) at each node.
"""
import math
import numpy as np
from ..description import Reader, MissingInput
from .loads import LOAD_LINE_ROLES

G_ACC = 9.80665


def _curvature(al, ch):
    i, e = al._find(ch)
    s = ch - e.ch0
    if e.kind == "tangent":
        return 0.0
    if e.kind == "arc":
        return e.k0
    return e.k0 + (e.k1 - e.k0) * s / e.L


def horizontal_cases(doc, geo, mdl, std, allow_proposed=False):
    rd = Reader(doc, allow_proposed)
    al = geo["_alignment"]
    m, nodes = mdl["model"], mdl["nodes"]
    Ld = doc.get("loads") or {}
    D = doc.get("deck") or {}
    used = []

    def v(rec, path, required=True):
        x = rd.value(rec, path, required=required)
        used.append({"path": path, "value": x, "tag": (rec or {}).get("tag")})
        return x

    cases = {}
    q_sur = v(Ld.get("traffic_surcharge"), "loads.traffic_surcharge")
    dsup = {s["id"]: s for s in doc.get("supports") or []}
    gsup = {s["id"]: s for s in geo["supports"]}
    EP, EPT = {}, {}
    geom = {}
    for sid, S_ in mdl["supports"].items():
        bf = rd.rows(dsup[sid].get("backfill"), f"supports[{sid}].backfill")[0]
        used.append({"path": f"supports[{sid}].backfill", "value": bf, "tag": (dsup[sid]["backfill"]["rows"][0]).get("tag")})
        gam, phi, kk = float(bf["gamma"]), math.radians(float(bf["phi"])), str(bf.get("K") or "K0")
        if kk == "K0":
            K = 1 - math.sin(phi)
        elif kk == "Ka":
            K = (1 - math.sin(phi)) / (1 + math.sin(phi))
        else:
            raise MissingInput(f"supports[{sid}].backfill.K: {kk!r} not K0 / Ka")
        sl = S_["sill"]
        soffit0 = sl["soffit_z0"]
        if bf.get("retained_height") not in (None, ""):
            H = float(bf["retained_height"]); Htag = "description"
        else:
            H = gsup[sid]["RL"] - soffit0; Htag = "Calculated: road level at the setout point - sill soffit there"
        d = sl["d"]
        P0 = np.array([gsup[sid]["E"], gsup[sid]["N"]])
        other = next(x for k, x in gsup.items() if k != sid)
        u = np.array([math.sin(math.radians(gsup[sid]["bearing"])), math.cos(math.radians(gsup[sid]["bearing"]))])
        n = np.array([u[1], -u[0]])
        if np.dot(np.array([other["E"], other["N"]]) - P0, n) < 0:
            n = -n                                            # toward the span
        sn = S_["sill_nodes"]
        s = [float((m.nodes[k][:2] - P0) @ u) for k in sn]
        geom[sid] = {"H": H, "H_source": Htag, "K": K, "K_kind": kk, "gamma": gam, "phi_deg": math.degrees(phi), "sill_length": s[-1] - s[0], "n": n.tolist()}
        for kind, e, zr in (("EP", 0.5 * K * gam * H * H, H / 3), ("EPT", K * q_sur * H, H / 2)):
            dz = zr - d / 2
            L = EP if kind == "EP" else EPT.setdefault(sid, {})
            for i, k in enumerate(sn):
                a = (s[i] - s[i - 1]) / 2 if i > 0 else 0.0
                b = (s[i + 1] - s[i]) / 2 if i < len(sn) - 1 else 0.0
                F = e * (a + b)
                f = np.array([F * n[0], F * n[1], 0.0])
                mm = np.cross([0.0, 0.0, dz], f)
                L[k] = L.get(k, np.zeros(6)) + np.concatenate([f, mm])
            geom[sid][kind + "_per_m"] = e; geom[sid][kind + "_lever_above_soffit"] = zr
    cases["EP"] = {"kind": "earth pressure, both abutments", "loads": EP}
    for sid, L in EPT.items():
        cases["EPT" + sid] = {"kind": f"traffic surcharge behind {sid}", "loads": L}
    # braking / centrifugal on the deck-line nodes inside the carriageway
    cl = v(D.get("carriageway_left"), "deck.carriageway_left"); cr = v(D.get("carriageway_right"), "deck.carriageway_right")
    dn = [k for k, x in nodes.items() if x.get("role") in LOAD_LINE_ROLES and "ch" in x and cl - 1e-6 <= x["o"] <= cr + 1e-6]
    if not dn:
        raise MissingInput("no deck nodes inside the carriageway")
    Fb = v(Ld.get("braking_force"), "loads.braking_force")
    V = v(Ld.get("design_speed"), "loads.design_speed")
    veh = std.get("AS5100.2:traffic:M1600").value
    W = 12 * 2 * veh["wheel_kN"]
    chs = [nodes[k]["ch"] for k in dn]
    kmax = max(abs(_curvature(al, c)) for c in np.linspace(min(chs), max(chs), 201))
    R = 1 / kmax if kmax > 0 else math.inf
    Fc = W * (V / 3.6) ** 2 / (G_ACC * R) if R < math.inf else 0.0
    Bp, Bm, Cf = {}, {}, {}
    for k in dn:
        b = math.radians(al.point(nodes[k]["ch"])[2])
        t = np.array([math.sin(b), math.cos(b), 0.0]); right = np.array([math.cos(b), -math.sin(b), 0.0])
        kc = _curvature(al, nodes[k]["ch"])
        out = right if kc < 0 else (-right if kc > 0 else None)      # left turn (k < 0): centre on the left, outward = right
        f = Fb / len(dn)
        Bp[k] = np.concatenate([f * t, np.zeros(3)]); Bm[k] = np.concatenate([-f * t, np.zeros(3)])
        if out is not None and Fc:
            Cf[k] = np.concatenate([Fc / len(dn) * out, np.zeros(3)])
    cases["BRKp"] = {"kind": "braking toward B", "loads": Bp, "total": Fb}
    cases["BRKm"] = {"kind": "braking toward A", "loads": Bm, "total": Fb}
    cases["CEN"] = {"kind": "centrifugal, outward", "loads": Cf, "total": Fc, "W": W, "V_kmh": V, "R": R}
    return {"cases": cases, "geometry": geom, "deck_nodes": len(dn), "inputs": used, "standards_status": std.result_status(),
            "standards_used": std.usage(), "provisional": rd.provisional + list(mdl.get("provisional") or [])}
