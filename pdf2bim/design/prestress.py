"""Time-dependent prestress losses and camber of a pretensioned girder (P4.5 stage 5). N, mm, MPa, kN, days.

    from pdf2bim.design.prestress import Models, run
    r = run(p, std)        # p: the Hog input dictionary (see below); same results as the dashboard's Hog engine

Port of the dashboard's Hog engine (base/..._v15.html "//ENGINE": shrink, relaxD, creep, shG, phG, k9f, run, runDet),
unchanged in method, with every code coefficient read from the standards data (code-extracted-UNVERIFIED):
AS5100.5:shrinkage:model, :creep:model, :creep:basic_coefficient, :creep:nonlinear_k9, :relaxation:k6, :losses:simplified.
p (the dashboard's Hog inputs; project / product values, not standards data): L, a (bearing offset), A, yb, I, H, ue
(girder section, drying perimeter), rho (density), fc, fci, fcmi, Ect, Ec, Ecp, Ecs (moduli), tau (age at transfer),
ts (start of drying), eb (basic drying shrinkage, 1e-6), k4 (environment), chi (ageing), db, lt (transmission
length / db), ji (jacking ratio), rel (relaxation before transfer, fraction), Ep, Ap, mbl (kN), Rb, k7, k8, jt, rlx,
rb (reinforcement ratio), sy / sl (strand levels from the soffit and debonding {d, d2} per strand), times (days after
transfer), fl {rl, sh, cr, dk, bar, shd} switches, deck (1: deck stages), pour, dhard, sidlA, dth, dgap, beff, fcd, Ed,
ued, tsd, rd, wd, sidl, Ac, yc, Ic, ueC, uesw, meth (0 simplified / 1 detailed time-step), bars [{y, A}], Es, asup,
terec, k3s, k9off, frz, subr, emodel, mcs, secN.
Results (as the dashboard): X (stations, mm), st (per station: strand forces after transfer Pr, kN; T; Mn; moments),
res (per reported time: label, t, phi, eps, hog (mm, + up) per station, Pm = midspan strand forces kN), mi, P0, tcR, k9.
"""
import math


class Models:
    """Material models with the standards coefficients."""

    def __init__(self, std):
        g = lambda k: std.get(k).value
        self.sh, self.cr, self.ccb = g("AS5100.5:shrinkage:model"), g("AS5100.5:creep:model"), g("AS5100.5:creep:basic_coefficient")
        self.k9c, self.k6c, self.loss = g("AS5100.5:creep:nonlinear_k9"), g("AS5100.5:relaxation:k6"), g("AS5100.5:losses:simplified")
        self.status = std.result_status()

    def interp(self, x):
        t = self.ccb
        if x <= t[0][0]:
            return t[0][1]
        for i in range(1, len(t)):
            if x <= t[i][0]:
                return t[i - 1][1] + (t[i][1] - t[i - 1][1]) * (x - t[i - 1][0]) / (t[i][0] - t[i - 1][0])
        return t[-1][1]

    def shrink(self, age, p):
        c = self.sh
        tA, tD = max(age, 0.0), max(age - p["ts"], 0.0)
        th = 2 * p["A"] / p["ue"]
        lo, hi = c["auto_lo"], c["auto_hi"]
        fse = ((lo[0] * p["fc"] - lo[1]) if p["fc"] <= c["fc_split"] else (hi[0] * p["fc"] - hi[1])) * c["auto_scale"]
        ecse = fse * (1 - math.exp(-c["auto_rate"] * tA))
        a1 = c["alpha1"][0] + c["alpha1"][1] * math.exp(-c["alpha1"][2] * th)
        k1 = a1 * tD ** c["k1_exp"] / (tD ** c["k1_exp"] + c["k1_th"] * th)
        ecsdb = (c["basic"][0] - c["basic"][1] * p["fc"]) * p["eb"] * 1e-6
        return ecse + k1 * p["k4"] * ecsdb

    def relax(self, p, td):
        j = p["jt"] + td
        k6 = math.log10(self.k6c["a"] * j ** (1 / self.k6c["b"]))
        return k6 * p["k7"] * p["k8"] * p["Rb"]

    def creep(self, age, p):
        c = self.cr
        t = max(age - p["tau"], 0.0)
        th = 2 * p["A"] / p["ue"]
        a2 = c["alpha2"][0] + c["alpha2"][1] * math.exp(-c["alpha2"][2] * th)
        k2 = a2 * t ** c["k2_exp"] / (t ** c["k2_exp"] + c["k2_th"] * th)
        k3 = c["k3"] / (1 + math.log10(p["tau"] + (p.get("k3s") or 0)))
        a3 = c["alpha3"] / (p["k4"] * a2)
        k5 = 1.0 if p["fc"] <= c["fc_split"] else (c["k5"][0] - a3) - c["k5"][1] * (1 - a3) * p["fc"]
        return k2 * k3 * p["k4"] * k5 * self.interp(p["fc"])

    def shG(self, age, p):
        ap = p["tau"] + p["pour"]
        if not p.get("uesw") or not p["fl"]["dk"] or age <= ap:
            return self.shrink(age, p)
        q = dict(p, ue=p["ueC"])
        return self.shrink(ap, p) + self.shrink(age, q) - self.shrink(ap, q)

    def phG(self, age, p):
        ap = p["tau"] + p["pour"]
        q = dict(p, ue=p["ueC"])
        if not p.get("uesw") or not p["fl"]["dk"] or age <= ap:
            return self.creep(age, p)
        if p["tau"] >= ap:
            return self.creep(age, q)
        return self.creep(ap, p) + self.creep(age, q) - self.creep(ap, q)

    def k9(self, so, fcmi):
        c = self.k9c
        return math.exp(c["a"] * (so / fcmi - c["lim"])) if so > c["lim"] * fcmi else 1.0


def _fin(v, default):
    return v if (v is not None and isinstance(v, (int, float)) and math.isfinite(v)) else default


def run(p, std, M=None):
    M = M or Models(std)
    p = dict(p)
    N = 100
    xa, xb = p["a"], p["L"] - p["a"]
    lt = p["lt"] * p["db"]
    S = {0.0, float(p["L"]), float(xa), float(xb), p["L"] / 2}
    for i in range(N + 1):
        S.add(p["L"] * i / N)
    for s in p["sl"]:
        for v in (s["d"], s["d"] + lt, p["L"] - s["d2"], p["L"] - s["d2"] - lt):
            S.add(float(v))
    X = sorted(x for x in S if 0 <= x <= p["L"])
    Ai, P0 = p["Ap"], p["ji"] * p["mbl"] * (1 - p["rel"])

    def Mb(w, x, sa):
        l, r = sa, p["L"] - sa
        if x < l:
            return -w * (l - x) ** 2 / 2e6
        if x > r:
            return -w * (x - r) ** 2 / 2e6
        return (w * (x - l) * (r - x) - w * sa * sa) / 2e6
    Msw = lambda x: Mb(p["rho"] * p["A"] / 1e6, x, xa)
    sas = _fin(p.get("asup"), xa)
    gs = {"A": p["A"], "y": p["yb"], "I": p["I"]}
    st = []
    for x in X:
        f = [min(max(x - s["d"], 0), lt) / lt * min(max(p["L"] - x - s["d2"], 0), lt) / lt for s in p["sl"]]
        w = [v * Ai for v in f]; P = [v * P0 for v in f]; Mx = Msw(x)
        Pr = list(P)
        for _ in range(40):
            T = sum(Pr)
            Mn = Mx - sum(b * (gs["y"] - p["sy"][i]) for i, b in enumerate(Pr)) / 1e3
            Pr = [(v - w[i] * p["Ep"] / p["Ect"] * (T * 1e3 / gs["A"] + Mn * 1e6 * (p["sy"][i] - gs["y"]) / gs["I"]) / 1e3) if w[i] else 0.0 for i, v in enumerate(P)]
        T = sum(Pr)
        Mn = Mx - sum(b * (gs["y"] - p["sy"][i]) for i, b in enumerate(Pr)) / 1e3
        st.append({"x": x, "w": w, "Pr": Pr, "M": Mx, "Mst": Mb(p["rho"] * p["A"] / 1e6, x, sas), "Md": Mb(p["wd"], x, xa), "Ms": Mb(p["sidl"], x, xa),
                   "s0": dict(gs), "Mn": Mn, "T": T, "Ti": sum(P), "top": T * 1e3 / gs["A"] + Mn * 1e6 * (p["H"] - gs["y"]) / gs["I"], "bot": T * 1e3 / gs["A"] - Mn * 1e6 * gs["y"] / gs["I"]})
    mi, ia, ib = X.index(p["L"] / 2), X.index(xa), X.index(xb)

    def defl(kap):
        th = d = 0.0
        D = [0.0]
        for i in range(1, len(X)):
            h = X[i] - X[i - 1]
            th1 = th + (kap[i] + kap[i - 1]) / 2 * h
            d += (th + th1) / 2 * h
            th = th1
            D.append(d)
        return [v - D[ia] - (D[ib] - D[ia]) * (X[i] - xa) / (xb - xa) for i, v in enumerate(D)]
    if p.get("meth"):
        return _run_det(p, M, X, st, mi, defl, P0)
    return _run_simple(p, M, X, st, mi, defl, P0)


def _run_simple(p, M, X, st, mi, defl, P0):
    m0 = st[mi]
    Ect, Ec, Ag, yb, Ig = p["Ect"], p["Ec"], p["A"], p["yb"], p["I"]
    res = [{"label": "Transfer", "t": 0, "phi": 0, "eps": None, "hog": defl([s["Mn"] * 1e6 / (Ect * s["s0"]["I"]) for s in st]), "Pm": None, "P_st": [list(s["Pr"]) for s in st]}]
    prev = [{"P": list(s["Pr"])} for s in st]
    rP = M.relax(p, 0)
    es0 = p["fl"]["sh"] * M.shrink(p["tau"], p)
    R0 = M.relax(p, 0)
    eS, ph0 = es0, 0.0
    sigo = 0.0
    for s in st:
        W = sum(s["w"])
        if W:
            y = sum(b * p["sy"][i] for i, b in enumerate(s["w"])) / W
            sigo = max(sigo, s["T"] * 1e3 / Ag + s["Mn"] * 1e6 * (y - yb) / Ig)
    k9 = M.k9(sigo, p["fcmi"])
    cp = bool(p.get("deck") and p["fl"]["dk"])
    tcR = p["pour"] + p["dhard"] if cp else math.inf
    Adk = p["beff"] * p["dth"] if cp else 0.0
    ydk = p["H"] + p["dgap"] + p["dth"] / 2 if cp else 0.0
    Idk = p["beff"] * p["dth"] ** 3 / 12 if cp else 0.0
    pd = dict(p, A=Adk, ue=p["ued"], fc=p["fcd"], ts=p["tsd"], tau=p["dhard"]) if cp else None
    rf = M.loss["restraint"]; cf = M.loss["creep_factor"]

    def solve(Eg, Ed, Nn, M0, ag, bg, ad):
        K11 = Eg * Ag + Ed * Adk; K12 = Eg * Ag * yb + Ed * Adk * ydk; K22 = Eg * (Ig + Ag * yb * yb) + Ed * (Idk + Adk * ydk * ydk)
        R1 = Nn + Eg * ag * Ag + Ed * ad * Adk; R2 = M0 + Eg * (ag * Ag * yb + bg * Ig) + Ed * ad * Adk * ydk
        D = K11 * K22 - K12 * K12
        return {"e0": (R1 * K22 - R2 * K12) / D, "psi": (K11 * R2 - K12 * R1) / D}
    C = {}
    tP = 0
    for td in p["times"]:
        age = p["tau"] + td
        es = p["fl"]["sh"] * M.shG(age, p)
        ph = p["fl"]["cr"] * M.phG(age, p) * k9
        dk = 1 if (cp and td >= p["pour"]) else 0
        sk = 1 if (cp and td >= p["sidlA"]) else 0
        comp = cp and td > tcR
        phd = p["fl"]["cr"] * M.phG(age, dict(p, tau=p["tau"] + p["pour"])) if dk else 0.0
        phs = p["fl"]["cr"] * M.phG(age, dict(p, tau=p["tau"] + p["sidlA"])) if sk else 0.0
        rx = M.relax(p, td)
        dRc = max(rx - R0, 0) * p["fl"]["rl"] * p["rlx"]
        da_ = td - p["pour"]
        kap = []
        Z = None
        if comp:
            phgc = p["fl"]["cr"] * M.phG(age, dict(p, tau=p["tau"] + tcR))
            phdk = p["fl"]["cr"] * M.creep(da_, pd)
            shd = p["fl"]["sh"] * M.shrink(da_, pd) / (1 + rf * (p.get("rd") or 0))
            Z = {"dph": ph - C["ph"], "dphp": phd - C["phd"], "dsg": es - C["es"], "dsd": shd - C["shd"], "Eg": 1 / (1 / p["Ecp"] + p["chi"] * phgc / p["Ec"]), "Ed": p["Ed"] / (1 + p["chi"] * phdk)}
            if sk:
                pgs = p["fl"]["cr"] * M.phG(age, dict(p, tau=p["tau"] + p["sidlA"]))
                pds = p["fl"]["cr"] * M.creep(da_, dict(pd, tau=p["sidlA"] - p["pour"]))
                Z["Egs"] = 1 / (1 / p["Ecs"] + pgs / p["Ec"]); Z["Eds"] = p["Ed"] / (1 + pds)
        for k, s in enumerate(st):
            Wb = sum(s["w"])
            yg = sum(b * p["sy"][i] for i, b in enumerate(s["w"])) / Wb if Wb else yb
            sc0 = s["T"] * 1e3 / Ag + s["Mn"] * 1e6 * (yg - yb) / Ig
            scd = dk * s["Md"] * 1e6 * (yg - yb) / Ig
            scs = s["Ms"] * 1e6 * (yg - p["yc"]) / p["Ic"] if (sk and p.get("Ic")) else 0.0
            ecc = cf * (sc0 * ph + scd * phd + scs * phs) / Ec
            dsh = es - es0
            P2 = []
            for i, v in enumerate(s["Pr"]):
                if not s["w"][i]:
                    P2.append(0.0); continue
                a = s["w"][i] * p["Ep"] * dsh / (1 + rf * p["rb"]) / 1e3
                b = s["w"][i] * p["Ep"] * ecc / 1e3
                cs = a + b
                c = v * dRc / 100 * max(0.0, 1 - cs / v)
                P2.append(max(v - cs - c, 0.0))
            T2 = sum(P2)
            M2 = s["M"] + dk * s["Md"] - sum(b * (yb - p["sy"][i]) for i, b in enumerate(P2)) / 1e3
            Mp = M2 - dk * s["Md"]
            N0, Np = -s["T"], -T2
            if not comp:
                kk = (s["Mn"] * (1 / Ect + ph / Ec) + (Mp - s["Mn"]) * (1 / Ect + p["chi"] * ph / Ec)) * 1e6 / Ig + ((s["Md"] * (1 / p["Ecp"] + phd / Ec) * 1e6 / Ig) if dk else 0.0)
                if cp and td == tcR:
                    C[k] = {"Mp": Mp, "Np": Np, "P": list(P2), "kc": kk}
            else:
                c_ = C[k]
                ag = (N0 + (c_["Np"] - N0) * p["chi"]) * Z["dph"] * 1e3 / (Ec * Ag) - Z["dsg"]
                ksf = ((s["Mn"] + (c_["Mp"] - s["Mn"]) * p["chi"]) * Z["dph"] + s["Md"] * Z["dphp"]) * 1e6 / (Ec * Ig)
                ad = -Z["dsd"]
                dP = [v - c_["P"][i] for i, v in enumerate(P2)]
                Nn = -sum(dP) * 1e3
                M0 = -sum(b * p["sy"][i] for i, b in enumerate(dP)) * 1e3
                r1 = solve(Z["Eg"], Z["Ed"], Nn, M0, ag, -ksf, ad)
                ks = -solve(Z["Egs"], Z["Eds"], 0, -s["Ms"] * 1e6, 0, 0, 0)["psi"] if sk else 0.0
                kk = c_["kc"] - r1["psi"] + ks
            kap.append(kk)
            prev[k] = {"P": P2}
        if cp and td == tcR:
            C["ph"], C["phd"], C["es"] = ph, phd, es
            C["shd"] = p["fl"]["sh"] * M.shrink(p["dhard"], pd) / (1 + rf * (p.get("rd") or 0))
        res.append({"label": f"{_fmt(td)} d", "t": td, "phi": ph, "eps": es, "hog": defl(kap), "Pm": list(prev[mi]["P"]), "P_st": [list(q["P"]) for q in prev]})
        tP = td
    return {"X": X, "st": st, "res": res, "mi": mi, "P0": P0, "tcR": tcR, "k9": k9, "sigo": sigo, "standards_status": M.status, "method": "simplified"}


def _fmt(v):
    return str(int(v)) if float(v).is_integer() else repr(float(v))


def _run_det(p, M, X, st, mi, defl, P0):
    Nst = len(X)
    cp = bool(p.get("deck") and p["fl"]["dk"])
    tcR = p["pour"] + p["dhard"] if cp else math.inf
    usebar = p["fl"].get("bar", 1) != 0
    bars = list(p.get("bars") or []) if usebar else []
    sA = sum(p["Ap"] for _ in p["sy"]) + sum(b["A"] for b in bars)
    sB = sum(p["Ap"] * y for y in p["sy"]) + sum(b["A"] * b["y"] for b in bars)
    sI = sum(p["Ap"] * y * y for y in p["sy"]) + sum(b["A"] * b["y"] ** 2 for b in bars)
    Ag = p["A"] - sA; yb = (p["A"] * p["yb"] - sB) / Ag; Ig = p["I"] + p["A"] * p["yb"] ** 2 - sI - Ag * yb * yb
    Adk = p["beff"] * p["dth"] if cp else 0.0
    ydk = p["H"] + p["dgap"] + p["dth"] / 2 if cp else 0.0
    Idk = p["beff"] * p["dth"] ** 3 / 12 if cp else 0.0
    pd = dict(p, A=Adk, ue=p["ued"], fc=p["fcd"], ts=p["tsd"]) if cp else None
    rf = M.loss["restraint"]
    keys = {0.0} | {float(t) for t in p["times"]}
    if cp:
        keys |= {float(p["pour"]), float(tcR), float(p["sidlA"])}
    tmax = max(keys)
    t_ = 0.25
    while t_ < tmax:
        keys.add(float(f"{t_:.3f}"))
        t_ *= (p.get("subr") or 1.15)
    T = sorted(t for t in keys if 0 <= t <= tmax)
    K = len(T)
    age = lambda t: p["tau"] + t
    kn = [[p["tau"], p["Ect"]]]
    if p["tau"] < 28:
        kn.append([28, p["Ec"]])
    if cp:
        kn.append([age(p["pour"]), p["Ecp"]]); kn.append([age(p["sidlA"]), p["Ecs"]])
    kn.sort(key=lambda q: q[0])

    def Eg0(a):
        if a <= kn[0][0]:
            return kn[0][1]
        for i in range(1, len(kn)):
            if a <= kn[i][0]:
                a0, e0 = kn[i - 1]; a1, e1 = kn[i]
                return e0 + (e1 - e0) * math.log(a / a0) / math.log(a1 / a0) if a1 > a0 else e1
        return kn[-1][1]

    def Egf(a):
        if p.get("emodel") == 2:
            s_ = p.get("mcs") or 0.25
            return p["Ec"] * math.exp(s_ * (1 - math.sqrt(28 / a))) ** 0.3
        if p.get("emodel") == 1:
            e = kn[0][1]
            for ka, ke in kn:
                if a >= ka:
                    e = ke
            return e
        return Eg0(a)
    shGa = [p["fl"]["sh"] * M.shG(age(t), p) for t in T]
    shD = [(p["fl"]["sh"] * (0 if p["fl"].get("shd") == 0 else 1) * M.shrink(t - p["pour"], pd) / (1 + rf * (p.get("rd") or 0))) if (cp and t >= tcR) else 0.0 for t in T]
    Rc = [max(M.relax(p, t) - M.relax(p, 0), 0) * p["fl"]["rl"] * p["rlx"] for t in T]
    tE = _fin(p.get("terec"), -1)

    def Msag(s, k):
        return (s["M"] if T[k] >= tE else s["Mst"]) + (s["Md"] if cp and T[k] >= p["pour"] else 0.0) + (s["Ms"] if cp and T[k] >= p["sidlA"] else 0.0)

    def steel(s):
        o = []
        for i, y in enumerate(p["sy"]):
            if s["w"][i]:
                o.append({"y": y, "k": p["Ep"] * s["w"][i], "F0": P0 * 1e3 * s["w"][i] / p["Ap"], "i": i, "bar": 0})
        for b in bars:
            o.append({"y": b["y"], "k": p["Es"] * b["A"], "F0": 0.0, "bar": 1})
        return o

    def sol(a, b, c, r1, r2):
        D = a * c - b * b
        return (r1 * c - r2 * b) / D, (a * r2 - b * r1) / D
    sigo = 0.0
    k9s = []
    for s in st:
        Sx = steel(s); E = p["Ect"]
        a = E * Ag; b = E * Ag * yb; c = E * (Ig + Ag * yb * yb); r1 = 0.0; r2 = -Msag(s, 0) * 1e6
        for q in Sx:
            a += q["k"]; b += q["k"] * q["y"]; c += q["k"] * q["y"] ** 2; r1 -= q["F0"]; r2 -= q["F0"] * q["y"]
        e, ps = sol(a, b, c, r1, r2)
        W = sum(s["w"])
        if not W:
            k9s.append(1.0); continue
        y = sum(v * p["sy"][i] for i, v in enumerate(s["w"])) / W
        so = -E * (e + ps * y)
        sigo = max(sigo, so)
        k9s.append(1.0 if p.get("k9off") else M.k9(so, p["fcmi"]))
    k9 = 1.0 if p.get("k9off") else M.k9(sigo, p["fcmi"])
    Jg = [[0.0 if j > k else 1 / Egf(age(tj)) + (p["fl"]["cr"] * M.phG(age(t), dict(p, tau=age(tj))) / p["Ec"] if j < k else 0.0) for j, tj in enumerate(T)] for k, t in enumerate(T)]
    dOn = [cp and t > tcR for t in T]
    Jd = [[0.0 if (j > k or not dOn[j]) else 1 / p["Ed"] + (p["fl"]["cr"] * M.creep(t - p["pour"], dict(pd, tau=tj - p["pour"])) / p["Ed"] if j < k else 0.0)
           for j, tj in enumerate(T)] for k, t in enumerate(T)] if cp else None
    kap = [[0.0] * Nst for _ in T]
    MS = {}
    Pst = {}
    rep = {float(x) for x in p["times"]}
    frz = p.get("frz")
    for n, s in enumerate(st):
        Sx = steel(s)
        gn, gm, dn, dm = [0.0] * K, [0.0] * K, [0.0] * K, [0.0] * K
        F = [q["F0"] for q in Sx]; Lr = [0.0] * len(Sx); k9n = k9s[n]
        e0 = ps = e00 = ps0 = eEl = pEl = 0.0
        Fpi = None
        for k in range(K):
            Ek = 1 / Jg[k][k]; on = dOn[k]; Edk = 1 / Jd[k][k] if on else 0.0
            ag = -(shGa[k] - shGa[k - 1]) if k else 0.0; bg = 0.0
            for j in range(k):
                dJ = (Jg[k][j] - Jg[k - 1][j]) * (k9n if j == 0 else 1)
                ag += gn[j] * dJ; bg += gm[j] * dJ
            ad = bd = 0.0
            if on:
                ad = -(shD[k] - shD[k - 1]) if T[k - 1] >= tcR else 0.0
                for j in range(k):
                    if dOn[j]:
                        dJ = Jd[k][j] - Jd[k - 1][j]
                        ad += dn[j] * dJ; bd += dm[j] * dJ
            dR = []
            for i, q in enumerate(Sx):
                if q["bar"] or not k:
                    dR.append(0.0); continue
                lcs = max(0.0, -q["k"] * ((e0 + ps * q["y"]) - (e00 + ps0 * q["y"]) - (eEl + pEl * q["y"])))
                L_ = Fpi[i] * Rc[k] / 100 * max(0.0, 1 - lcs / Fpi[i])
                dR.append(L_ - Lr[i]); Lr[i] = L_
            a = Ek * Ag + Edk * Adk; b = Ek * Ag * yb + Edk * Adk * ydk; c = Ek * (Ig + Ag * yb * yb) + Edk * (Idk + Adk * ydk * ydk)
            r1 = Ek * ag * Ag + Edk * ad * Adk
            r2 = -(Msag(s, k) - (Msag(s, k - 1) if k else 0.0)) * 1e6 + Ek * (ag * Ag * yb + bg * Ig) + Edk * (ad * Adk * ydk + bd * Idk)
            for i, q in enumerate(Sx):
                kq = 0.0 if (frz and k and not q["bar"]) else q["k"]
                a += kq; b += kq * q["y"]; c += kq * q["y"] ** 2
                f = ((0.0 if frz else dR[i]) if k else -q["F0"])
                r1 += f; r2 += f * q["y"]
            de, dp = sol(a, b, c, r1, r2)
            e0 += de; ps += dp
            dM = Msag(s, k) - Msag(s, k - 1) if k else 0.0
            if dM:
                ee, pe = sol(a, b, c, 0, -dM * 1e6)
                eEl += ee; pEl += pe
            gn[k] = Ek * (de + dp * yb - ag); gm[k] = Ek * (dp - bg)
            if on:
                dn[k] = Edk * (de + dp * ydk - ad); dm[k] = Edk * (dp - bd)
            for i, q in enumerate(Sx):
                F[i] += (0.0 if (frz and k and not q["bar"]) else q["k"]) * (de + dp * q["y"]) - (dR[i] if (k and not frz) else 0.0)
            if not k:
                e00, ps0 = e0, ps
                Fpi = list(F)
                Pv = [0.0] * len(p["sy"])
                for i, q in enumerate(Sx):
                    if not q["bar"]:
                        Pv[q["i"]] = F[i] / 1e3
                s["Pr"] = Pv; s["T"] = sum(Pv); s["Mn"] = s["M"] - sum(v * (yb - p["sy"][i]) for i, v in enumerate(Pv)) / 1e3
            kap[k][n] = -ps
            if k == 0 or T[k] in rep:
                Pst.setdefault(k, [None] * Nst)
                Ps_ = [0.0] * len(p["sy"])
                for i, q in enumerate(Sx):
                    if not q["bar"]:
                        Ps_[q["i"]] = F[i] / 1e3
                Pst[k][n] = Ps_
            if n == mi:
                Ps = [0.0] * len(p["sy"])
                for i, q in enumerate(Sx):
                    if not q["bar"]:
                        Ps[q["i"]] = F[i] / 1e3
                MS[k] = {"Pm": Ps, "T": sum(Ps)}
    res = []
    for k, t in enumerate(T):
        if k and t not in [float(x) for x in p["times"]]:
            continue
        ph = p["fl"]["cr"] * k9s[mi] * M.creep(age(t), p) if k else 0.0
        res.append({"label": f"{_fmt(t)} d" if k else "Transfer", "t": t, "phi": ph, "eps": p["fl"]["sh"] * M.shG(age(t), p) if k else None,
                    "hog": defl(kap[k]), "Pm": MS[k]["Pm"], "P_st": Pst[k]})
    return {"X": X, "st": st, "res": res, "mi": mi, "P0": P0, "tcR": tcR, "k9": k9, "sigo": sigo, "net": {"A": Ag, "y": yb, "I": Ig, "sA": sA},
            "nsub": K, "standards_status": M.status, "method": "detailed"}


def effective_prestrain(r, p, t=None):
    """Effective prestrain per strand at the midspan station at time t (days after transfer; default the last reported
    time): F / (Ap Ep). Returns (time, [epe per strand])."""
    res = r["res"]
    q = res[-1] if t is None else next(x for x in res if abs(x["t"] - t) < 1e-9)
    return q["t"], [F * 1e3 / (p["Ap"] * p["Ep"]) for F in q["Pm"]]


def strand_forces_at(r, x, t=None):
    """Strand forces (kN, per strand of p["sy"]) at distance x (mm from girder end A) and time t (default the last
    reported time), interpolated linearly between the analysis stations."""
    q = r["res"][-1] if t is None else next(z for z in r["res"] if abs(z["t"] - t) < 1e-9)
    X, P = r["X"], q["P_st"]
    if x <= X[0]:
        return list(P[0])
    if x >= X[-1]:
        return list(P[-1])
    i = next(k for k in range(1, len(X)) if X[k] >= x)
    w = (x - X[i - 1]) / (X[i] - X[i - 1])
    return [a + w * (b - a) for a, b in zip(P[i - 1], P[i])]


def stage_moments_at(r, x):
    """Girder moments (kN m, sagging +) of the losses analysis at distance x (mm from end A), interpolated linearly
    between its stations: self weight on the bearings (Msw), wet deck (Mwet), superimposed dead load (Msdl) — the
    simple-span moments of the loads the losses analysis uses (w = rho A, wd, sidl)."""
    X, st = r["X"], r["st"]
    keys = (("Msw", "M"), ("Mwet", "Md"), ("Msdl", "Ms"))
    if x <= X[0]:
        return {k: st[0][q] for k, q in keys}
    if x >= X[-1]:
        return {k: st[-1][q] for k, q in keys}
    i = next(k for k in range(1, len(X)) if X[k] >= x)
    w = (x - X[i - 1]) / (X[i] - X[i - 1])
    return {k: st[i - 1][q] + w * (st[i][q] - st[i - 1][q]) for k, q in keys}
