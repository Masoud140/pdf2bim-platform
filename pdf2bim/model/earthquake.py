"""Earthquake response spectrum analysis of the integrated model (stage P3c). kN, m. Characteristic (unfactored).

    from pdf2bim.model.earthquake import earthquake_rsa
    Q = earthquake_rsa(doc, geo, mdl, std, sdl_loads, allow_proposed=False)

Method (as the dashboard, src/sub5.js eqRun, generalised):
- MASS: member self weight as in the static analysis (deck strips, dummies, rigid members massless; composite girders
  carry the gross deck + girder weight) + the SDL case as lumped translational mass |Fz| / g at its nodes (the dashboard
  weights every member instead: finding H-3; `mass_rule="dashboard"` is NOT offered here — the comparison tool builds
  the dashboard's mass itself). Consistent beam mass (Model.modes), analysis.modes modes.
- SPECTRUM: Sa(T) = kp Z Ch(T) / Rf (in g), Ch from standards entry AS1170.4:spectral_shape:Ch for the site class
  (code-extracted-UNVERIFIED): T <= 0: Ch(0); T <= 0.1 s: min(Ch(0) + slope T, plateau); T <= 0.3 s: plateau;
  T <= 1.5 s: min(plateau, c / T); T > 1.5 s: c2 / T^2. kp, Z, site class, Rf, zeta from loads.earthquake.
- DIRECTIONS: L = horizontal, from the support-A sill centroid to the support-B sill centroid; T = horizontal normal;
  V (vertical) only if loads.earthquake.vertical is true.
- MODAL RESPONSE per direction d: u_k = Sa(T_k) g Gamma_kd / w_k^2 phi_k; combined by CQC (zeta); plus the MISSING
  MASS: the static response to the rigid-body acceleration of the mass not in the modes, at Sa(0), added by SRSS.
- DIRECTIONAL COMBINATIONS: EQ-L = 1.0 L + 0.3 T (+ 0.3 V), EQ-T = 0.3 L + 1.0 T (+ 0.3 V) (+ EQ-V), of the absolute
  directional responses (as the dashboard).
RESPONSES (each combined separately — not concurrent, as the dashboard): bearing forces (global X, Y, Z on the bearing
top; and in link axes: v vertical, tr, lon), pile element end actions (local My, Mz at both ends, Vy, Vz), pile-head displacement X, Y, total spring force X, Y.
"""
import math
import numpy as np
import scipy.sparse.linalg as spl
from ..description import Reader, MissingInput

G_ACC = 9.80665
DOF = 6


def ch_factor(T, row):
    c0, sl, pl, c, c2 = row
    if T <= 0:
        return c0
    if T <= 0.1:
        return min(c0 + sl * T, pl)
    if T <= 0.3:
        return pl
    if T <= 1.5:
        return min(pl, c / T)
    return c2 / (T * T)


def rho_cqc(wi, wj, z):
    r = wj / wi
    return 8 * z * z * (1 + r) * r ** 1.5 / ((1 - r * r) ** 2 + 4 * z * z * r * (1 + r) ** 2)


def _response_rows(mdl, idx, nd):
    """Linear response functionals (rows over all dofs): bearing global forces, pile element end actions, pile-head
    displacements, spring force totals."""
    m = mdl["model"]
    names, rows = [], []
    for bid, b in sorted(mdl["bearings"].items()):
        L, Rm, T, Kl, fl, dofs = m._el[("link", b["link"])]
        KT = (Kl @ T)[6:9]
        G = -(Rm.T @ KT)
        for c, lab in enumerate("XYZ"):
            names.append(("B", bid, "F" + lab)); rows.append((dofs, G[c]))
        KT1 = (Kl @ T)[0:3]                                 # link-local end-1 forces: v = f0 (compression +), tr = -f1, lon = -f2
        for c, lab, sg in ((0, "v", 1.0), (1, "tr", -1.0), (2, "lon", -1.0)):
            names.append(("BL", bid, lab)); rows.append((dofs, sg * KT1[c]))
    piles = []
    for sid, s in mdl["supports"].items():
        for p in s["piles"]:
            ch = set(p["chain"])
            for eid, bm in m.beams.items():
                if bm["n1"] in ch and bm["n2"] in ch:
                    L, Rm, T, K, fl, dofs = m._el[eid]
                    KT = K @ T
                    for j, lab in ((4, "My1"), (5, "Mz1"), (10, "My2"), (11, "Mz2"), (1, "Vy"), (2, "Vz")):
                        names.append(("P", (p["id"], eid), lab)); rows.append((dofs, KT[j]))
            for c, lab in ((0, "ux"), (1, "uy")):
                names.append(("H", p["id"], lab)); rows.append(([DOF * idx[p["head"]] + c], np.array([1.0])))
            piles.append(p)
    for c, lab in ((0, "X"), (1, "Y")):
        dofs, vals = [], []
        for n, k in m.springs.items():
            if k[c]:
                dofs.append(DOF * idx[n] + c); vals.append(-k[c])      # force the springs exert on the structure
        names.append(("S", "springs", lab)); rows.append((dofs, np.array(vals)))
    import scipy.sparse as sp
    r_, c_, v_ = [], [], []
    for i, (dofs, row) in enumerate(rows):
        r_ += [i] * len(dofs); c_ += list(dofs); v_ += list(row)
    return names, sp.csr_matrix((v_, (r_, c_)), shape=(len(rows), nd)), piles


def earthquake_rsa(doc, geo, mdl, std, sdl_loads=None, allow_proposed=False, extra_mass=None, n_modes=None):
    rd = Reader(doc, allow_proposed)
    Ld = doc.get("loads") or {}
    eq = {r["item"]: r["value"] for r in rd.rows(Ld.get("earthquake"), "loads.earthquake")}
    for k in ("kp", "Z", "site_class", "Rf", "zeta"):
        if k not in eq:
            raise MissingInput(f"loads.earthquake: item {k!r} missing")
    kp, Z, Rf, zeta = float(eq["kp"]), float(eq["Z"]), float(eq["Rf"]), float(eq["zeta"])
    site = str(eq["site_class"]).strip()
    vert = str(eq.get("vertical", "False")).strip().lower() in ("true", "1", "yes")
    chv = std.get("AS1170.4:spectral_shape:Ch").value
    if site not in chv["rows"]:
        raise MissingInput(f"loads.earthquake.site_class {site!r} not in the spectral-shape table ({', '.join(chv['rows'])})")
    row = chv["rows"][site]
    Sa = lambda T: kp * Z * ch_factor(T, row) / Rf
    nm = n_modes or int(rd.value((doc.get("analysis") or {}).get("modes"), "analysis.modes"))
    m = mdl["model"]
    mass = dict(extra_mass) if extra_mass is not None else {k: -f[2] / G_ACC for k, f in (sdl_loads or {}).items() if f[2] < 0}
    MD = m.modes(nm, extra_mass=mass, matrices=True)
    K, Mm, free, idx, Phi, w2 = MD["K"], MD["M"], MD["free"], MD["idx"], MD["Phi"], MD["w2"]
    nd = DOF * len(m.nodes)
    pos = -np.ones(nd, int); pos[free] = np.arange(len(free))
    names, Rm, piles = _response_rows(mdl, idx, nd)
    Rf_ = Rm[:, free]                                      # responses from free-dof displacements
    # directions
    cA = np.mean([m.nodes[k][:2] for k in mdl["supports"][geo["supports"][0]["id"]]["sill_nodes"]], axis=0)
    cB = np.mean([m.nodes[k][:2] for k in mdl["supports"][geo["supports"][-1]["id"]]["sill_nodes"]], axis=0)
    d = (cB - cA) / np.linalg.norm(cB - cA)
    dirs = {"L": np.array([d[0], d[1], 0.0]), "T": np.array([-d[1], d[0], 0.0])}
    if vert:
        dirs["V"] = np.array([0.0, 0.0, 1.0])
    lu = spl.splu(K.tocsc())
    w = np.sqrt(w2); Tn = 2 * math.pi / w
    resp, gam, meff = {}, {}, {}
    for dn, dv in dirs.items():
        r = np.zeros(len(free))
        for n_, i in idx.items():
            for c in range(3):
                p = pos[DOF * i + c]
                if p >= 0:
                    r[p] = dv[c]
        Mr = Mm @ r
        G = Phi.T @ Mr                                     # participation factors (mass-normalised shapes)
        mt = float(r @ Mr)
        gam[dn] = G; meff[dn] = float((G * G).sum() / mt) if mt > 0 else 0.0
        Rk = np.array([np.asarray(Rf_ @ (Sa(Tn[k]) * G_ACC * G[k] / w2[k] * Phi[:, k])).ravel() for k in range(len(w2))])
        cqc = np.zeros(Rf_.shape[0])
        for i in range(len(w2)):
            for j in range(len(w2)):
                rho = 1.0 if i == j else rho_cqc(w[i], w[j], zeta)
                if rho < 1e-4:
                    continue
                cqc += rho * Rk[i] * Rk[j]
        us = lu.solve(Mr) - Phi @ (G / w2)                 # missing-mass shape
        Rres = np.asarray(Rf_ @ (Sa(0.0) * G_ACC * us)).ravel()
        resp[dn] = {"R": np.sqrt(np.maximum(cqc, 0) + Rres ** 2), "modal": np.sqrt(np.maximum(cqc, 0)), "residual": Rres,
                    "mass_t": mt, "effective_mass_fraction": meff[dn]}
    combos = [("EQ-L", {"L": 1.0, "T": 0.3, "V": 0.3}), ("EQ-T", {"L": 0.3, "T": 1.0, "V": 0.3})] + ([("EQ-V", {"L": 0.3, "T": 0.3, "V": 1.0})] if vert else [])
    comb = {cid: sum(wts[dn] * resp[dn]["R"] for dn in dirs) for cid, wts in combos}
    return {"case": "earthquake RSA", "names": names, "directions": {k: v.tolist() for k, v in dirs.items()}, "resp": resp, "combos": comb,
            "periods": Tn.tolist(), "Sa_g": [Sa(T) for T in Tn], "Sa0_g": Sa(0.0), "participation": {k: v.tolist() for k, v in gam.items()},
            "inputs": {"kp": kp, "Z": Z, "site_class": site, "Rf": Rf, "zeta": zeta, "vertical": vert, "modes": nm},
            "mass_rule": "static self weight + SDL lumped" if extra_mass is None else "given", "standards_status": std.result_status(),
            "standards_used": std.usage(), "provisional": rd.provisional + list(mdl.get("provisional") or [])}


def summary(Q, R):
    """Bearing forces and pile maxima (resultant of the two moment / shear components, as the dashboard) of a response vector."""
    ix = {n: i for i, n in enumerate(Q["names"])}
    br = {}
    for n, i in ix.items():
        if n[0] in ("B", "BL"):
            br.setdefault(n[1], {})[n[2]] = R[i]
    pm = {}
    for n, i in ix.items():
        if n[0] == "P":
            pid, eid = n[1]
            pm.setdefault(pid, {}).setdefault(eid, {})[n[2]] = R[i]
    piles = {pid: {"M": max(max(math.hypot(e["My1"], e["Mz1"]), math.hypot(e["My2"], e["Mz2"])) for e in els.values()),
                   "V": max(math.hypot(e["Vy"], e["Vz"]) for e in els.values())} for pid, els in pm.items()}
    return {"bearings": br, "piles": piles, "springs": (R[ix[("S", "springs", "X")]], R[ix[("S", "springs", "Y")]])}
