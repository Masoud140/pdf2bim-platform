"""AS 5100.2 load combinations and combined actions (stage P3c). kN, m.

    from pdf2bim.model.combinations import generate, combine, Register
    reg = Register(std, on={"DLc", "SDLp", ...})          # actions taking part; factors from the standards data
    G = generate(reg, options)                              # combination rows (port of the dashboard's genAll)
    C = combine(G["rows"], prim)                            # ULS / SLS envelopes of the primitives (port of rxCombine)

GENERATOR (as the dashboard Combos tab, src: base/... genAll, traffic modelling "one moving-load case per vehicle model"
— lane factors are applied inside the traffic envelope; the per-lane mode is not ported):
  ULS (a) 23.2 minimum strength and stability (A1 / A2 permanent factors); (b) PE + road (+ rail) traffic with
  companions (pedestrians, thermal 0/1, wind at the with-traffic speed); (c) PE + pedestrians + thermal; (d) minimum
  restraint; (e) collision with companion traffic; (f) barriers; (g) earth pressure from traffic; (h) earthquake;
  (i) water flow; (j) wind alone and with traffic; (k) thermal; transfer (19.2); SLS 23.4: one lead transient group
  with every subset of the others at the companion factors k1 (one other) / k2 (two or more).
  PE sets: "2" = all adverse / all relieving; "m" = also every mixed set.
  Wind directions: "s" = +-X, +-Y, +-Z each alone; "v" = one horizontal + vertical up / down; "a" = transverse x
  longitudinal (x vertical).
Rows: name, limit state, clause key, type, PE label, terms [(action id, factor)] (factors rounded to 1e-4 as the
dashboard; repeated ids summed; zero terms dropped). Wind actions carry a speed suffix: _U (ULS), _35 (with traffic),
_S (SLS).

EVALUATION (as rxCombine): every primitive is either static {"s": v} (factor x v) or an envelope {"max": a, "min": b}
(per response, the factor x max and factor x min are sorted into the row's upper and lower bound). A row's upper and
lower bounds update the limit state's max / min, with the governing row name. A term whose action has no primitive is
counted in "missing" and contributes nothing (the dashboard's rule; the platform reports it).

ALL FACTORS are code-extracted-UNVERIFIED standards entries (AS5100.2:load_factor:*, AS5100.2:combination:*)."""
import math
import numpy as np

# the dashboard's action register: (id, group), in register order (order fixes row order and names)
ACTIONS = [("DLc", "P"), ("DLs", "P"), ("DLt", "P"), ("SDLp", "P"), ("SDLr", "P"), ("SDLs", "P"), ("SOc", "P"), ("SOo", "P"), ("GW", "P"),
           ("BAL", "P"), ("TRN", "P"), ("PS", "P"), ("SCR", "P"), ("SET", "P"), ("BRG", "P"),
           ("M1600", "RT"), ("S1600", "RT"), ("HLP", "RT"), ("A160", "RT"), ("W80", "RT"), ("BRKR", "RT"), ("CENR", "RT"),
           ("LA300", "RL"), ("BRKT", "RL"), ("NOS", "RL"), ("CENT", "RL"), ("PED", "PD"), ("MRLH", "MR"), ("MRLV", "MR"),
           ("COLX", "CO"), ("COLY", "CO"), ("COLS", "CO"), ("DERA", "CO"), ("DERB", "CO"), ("BAR", "BA"), ("BARA", "BA"), ("BARD", "BA"), ("PBAR", "BA"),
           ("EPT", "EP"), ("EQX", "EQ"), ("EQY", "EQ"), ("FLH", "FL"), ("FLVU", "FL"), ("FLVD", "FL"), ("BUOY", "FL"),
           ("WX", "WN"), ("WY", "WN"), ("WZ", "WN"), ("TUW", "TH"), ("TUC", "TH"), ("TGP", "TH"), ("TGN", "TH")]
TYP = {"a": ("23.2", "Minimum strength and stability"), "b": ("23.3 (b)", "PE + road / rail traffic"), "c": ("23.3 (c)", "PE + pedestrian"),
       "d": ("23.3 (d)", "PE + minimum restraint"), "e": ("23.3 (e)", "PE + collision"), "f": ("23.3 (f)", "PE + barrier"),
       "g": ("23.3 (g)", "PE + earth pressure from traffic"), "h": ("23.3 (h)", "PE + earthquake"), "i": ("23.3 (i)", "PE + water flow"),
       "j": ("23.3 (j)", "PE + wind"), "k": ("23.3 (k)", "PE + thermal"), "t": ("19.2", "Transfer of prestress"), "s": ("23.4", "Serviceability")}
DEFAULTS = {"pm": "2", "wm": "s", "pw": True, "td": False, "cap": 20000}


class Register:
    """Actions taking part (`on`) and their factors (u: ULS adverse, b: ULS relieving, s: SLS) from the standards data."""

    def __init__(self, std, on):
        unknown = set(on) - {a for a, _ in ACTIONS}
        if unknown:
            raise ValueError(f"unknown action ids: {sorted(unknown)}")
        self.rows = []
        for aid, g in ACTIONS:
            v = std.get(f"AS5100.2:load_factor:{aid}").value
            self.rows.append({"id": aid, "g": g, "u": v["uls"], "b": v["uls_relieving"], "s": v["sls"], "on": aid in on})
        c = lambda k: std.get(f"AS5100.2:combination:{k}").value
        ab = c("min_strength_stability")
        self.A1, self.A2 = ab["max"], ab["min"]
        self.transfer = c("transfer")
        self.ped_with_traffic = c("pedestrian_with_road_traffic")
        sc = c("sls_companion")
        self.k1, self.k2 = sc["k1"], sc["k2"]
        self.rf = c("rail_with_wind")
        self.eq_orth = c("earthquake_orthogonal")
        self.by = {r["id"]: r for r in self.rows}
        self.std = std

    def on(self, aid):
        r = self.by.get(aid)
        return bool(r and r["on"])

    def reg(self, aid):
        r = self.by.get(aid)
        if r is None:
            r = next(x for x in self.rows if aid.startswith(x["id"] + "_"))
        return r


def _round4(f):
    return math.floor(f * 1e4 + 0.5) / 1e4              # JS Math.round(f * 1e4) / 1e4


def _st(t, p=None):
    return {"t": list(t), "p": p}


S0 = {"t": [], "p": None}


def _cross(*ls):
    out = [S0]
    for l in ls:
        out = [{"t": x["t"] + y["t"], "p": x["p"] or y["p"]} for x in out for y in l]
    return out


def _mul(ls, f):
    return [{"t": [(i, m * (f(i) if callable(f) else f)) for i, m in s["t"]], "p": s["p"]} for s in ls]


def _sgn(aid):
    return [_st([(aid, 1)]), _st([(aid, -1)])]


def _subs(n, k):
    out = []

    def r(s, c):
        if len(c) == k:
            out.append(c)
        else:
            for i in range(s, n):
                r(i + 1, c + [i])
    r(0, [])
    return out


def generate(reg, options=None):
    o = dict(DEFAULTS, k1=reg.k1, k2=reg.k2, rf=reg.rf)
    o.update(options or {})
    on, gU, gS = reg.on, (lambda i: reg.reg(i)["u"]), (lambda i: reg.reg(i)["s"])
    rows, cnt, seq, summ = [], {"ULS": 0, "SLS": 0}, {}, {}
    state = {"capped": False}

    def push(ls, col, sub, pe, terms):
        if cnt[ls] >= o["cap"]:
            state["capped"] = True
            return
        m = {}
        for i, f in terms:
            m[i] = m.get(i, 0) + f
        t = [(i, _round4(f)) for i, f in m.items()]
        t = [x for x in t if x[1] != 0]
        if not t:
            return
        cnt[ls] += 1
        k = ls + col
        seq[k] = seq.get(k, 0) + 1
        key = ls + "|" + col
        s = summ.setdefault(key, {"ls": ls, "col": col, "n": 0, "subs": []})
        s["n"] += 1
        if sub and sub not in s["subs"]:
            s["subs"].append(sub)
        rows.append({"name": f"{ls}-{col.upper()}-{seq[k]:04d}", "ls": ls, "col": col, "clause": TYP[col][0],
                     "type": TYP[col][1] + (" – " + sub if sub else ""), "pe": pe, "t": t})

    def run(ls, col, sub, sets):
        for s in sets:
            push(ls, col, sub, s["p"], s["t"])

    R = reg.rows

    def pe_sets(ls):
        P = [r for r in R if r["on"] and r["g"] == "P"]
        if not P:
            return [{"t": [], "p": "—"}]
        if ls == "SLS":
            return [{"t": [(r["id"], r["s"]) for r in P], "p": "PE"}]
        mx = {"t": [(r["id"], r["u"]) for r in P], "p": "PE max"}
        mn = {"t": [(r["id"], r["b"]) for r in P], "p": "PE min"}
        if o["pm"] != "m":
            return [mx, mn]
        acc = [[]]
        for r in P:                     # as the JS reduce: each existing set is followed by its two extensions
            acc = [y for x in acc for y in (x + [(r["id"], r["u"], 1)], x + [(r["id"], r["b"], 0)])]
        out, seen = [], set()
        for c in acc:
            k = ",".join(_js_num(x[1]) for x in c)
            if k in seen:
                continue
            seen.add(k)
            a1, a0 = all(x[2] for x in c), not any(x[2] for x in c)
            out.append({"t": [(x[0], x[1]) for x in c],
                        "p": "PE max" if a1 else "PE min" if a0 else "PE mixed (" + "+".join(x[0] for x in c if x[2]) + " max)"})
        return out

    def veh(aid):
        return [_st([(aid, 1)])]

    def road_states(withH):
        out = []
        for L in [x for x in ("M1600", "S1600", "HLP", "A160", "W80") if on(x)]:
            hz = [S0]
            if withH and L == "M1600":
                if on("BRKR"):
                    hz += _sgn("BRKR")
                if on("CENR"):
                    hz.append(_st([("CENR", 1)]))
            out += _cross(veh(L), hz)
        return out

    def rail_states(withH):
        if not on("LA300"):
            return []
        base = veh("LA300")
        if not withH:
            return base
        lo = [S0] + (_sgn("BRKT") if on("BRKT") else [])
        la = [S0] + (_sgn("NOS") if on("NOS") else []) + ([_st([("CENT", 1)])] if on("CENT") else [])
        return _cross(base, lo, la)

    comp_road = lambda: [s for L in ("M1600", "S1600") if on(L) for s in veh(L)]

    def wind_dirs(sx):
        H = [h for h in ("WX", "WY") if on(h)]
        z = on("WZ")
        pm = lambda i: [_st([(i + "_" + sx, 1)]), _st([(i + "_" + sx, -1)])]
        if o["wm"] == "s":
            return [s for i in H + (["WZ"] if z else []) for s in pm(i)]
        if o["wm"] == "a" and len(H) == 2:
            return _cross(pm("WY"), pm("WX"), pm("WZ") if z else [S0])
        hs = [[(h + "_" + sx, sg)] for h in H for sg in (1, -1)]
        if not hs:
            return [_st([("WZ_" + sx, 1)]), _st([("WZ_" + sx, -1)])] if z else []
        if z:
            return [_st(h + [("WZ_" + sx, sg)]) for h in hs for sg in (1, -1)]
        return [_st(h) for h in hs]

    def therm01():
        U = [S0] + [_st([(i, 1)]) for i in ("TUW", "TUC") if on(i)]
        G = [S0] + [_st([(i, 1)]) for i in ("TGP", "TGN") if on(i)]
        return _cross(U, G)

    def therm_k():
        U = [i for i in ("TUW", "TUC") if on(i)]
        G = [i for i in ("TGP", "TGN") if on(i)]
        if U and G:
            return [_st([(u, 1), (g, 1)]) for u in U for g in G]
        return [_st([(i, 1)]) for i in U + G]

    def eq_states():
        x, y = on("EQX"), on("EQY")
        if x and y:
            return [_st([(a, s1), (b, reg.eq_orth * s2)]) for a, b in (("EQX", "EQY"), ("EQY", "EQX")) for s1 in (1, -1) for s2 in (1, -1)]
        return (_sgn("EQX") if x else []) + (_sgn("EQY") if y else [])

    def fl_states():
        fl = (_sgn("FLH") if o["td"] else [_st([("FLH", 1)])]) if on("FLH") else [S0]
        lift = [_st([(i, 1)]) for i in ("FLVU", "FLVD") if on(i)]
        bu = [_st([("BUOY", 1)])] if on("BUOY") else [S0]
        return [s for s in _cross(fl, lift or [S0], bu) if s["t"]]

    P = pe_sets("ULS")
    # (a)
    Pa = [r for r in R if r["on"] and r["g"] == "P" and r["id"] in reg.A1]
    if Pa:
        push("ULS", "a", "", "PE (a) max", [(r["id"], reg.A1[r["id"]]) for r in Pa])
        lack = [r["id"] for r in Pa if r["id"] not in reg.A2]
        if lack:
            raise ValueError(f"combination (a): no relieving factor for {lack} in AS5100.2:combination:min_strength_stability (the dashboard would produce NaN)")
        push("ULS", "a", "", "PE (a) min", [(r["id"], reg.A2[r["id"]]) for r in Pa])
    T01, W35, WU, WS = therm01(), wind_dirs("35"), wind_dirs("U"), wind_dirs("S")
    # (b)
    rd = _mul(road_states(True), gU)
    rl = _mul(rail_states(True), gU)
    ped = [_st([("PED", reg.ped_with_traffic)])] if on("PED") and o["pw"] else [S0]
    run("ULS", "b", "road traffic", _cross(P, rd, ped, T01, W35 or [S0]))
    run("ULS", "b", "rail traffic", _cross(P, rl, T01, W35 or [S0]))
    # (c)
    if on("PED"):
        run("ULS", "c", "", _cross(P, [_st([("PED", gU("PED"))])], T01))
    # (d)
    run("ULS", "d", "", _cross(P, _mul((_sgn("MRLH") if on("MRLH") else []) + ([_st([("MRLV", 1)])] if on("MRLV") else []), gU)))
    # (e)
    CO = _mul((_sgn("COLX") if on("COLX") else []) + (_sgn("COLY") if on("COLY") else []) + [_st([(i, 1)]) for i in ("COLS", "DERA", "DERB") if on(i)], gU)
    cR, cT = comp_road(), rail_states(False)
    comp = [S0] + cR + cT
    if CO:
        run("ULS", "e", "", _cross(P, CO, comp, [S0, _st([("PED", 1)])] if on("PED") else [S0]))
    # (f) (g)
    run("ULS", "f", "", _cross(P, _mul([_st([(i, 1)]) for i in ("BAR", "BARA", "BARD", "PBAR") if on(i)], gU)))
    if on("EPT") and gU("EPT") > 0:
        run("ULS", "g", "", _cross(P, [_st([("EPT", gU("EPT"))])]))
    # (h)
    run("ULS", "h", "", _cross(P, eq_states()))
    # (i)
    FL = fl_states()
    if FL:
        run("ULS", "i", "", _cross(P, _mul(FL, gU), T01, comp))
    # (j)
    run("ULS", "j", "wind alone", _cross(P, WU))
    if W35 and cR:
        run("ULS", "j", "with road traffic", _cross(P, W35, cR))
    if W35 and cT:
        run("ULS", "j", "with rail traffic", _cross(P, W35, _mul(cT, o["rf"])))
    # (k)
    TK = _mul(therm_k(), gU)
    if TK:
        run("ULS", "k", "", _cross(P, TK, [S0] + cT))
    # transfer
    if on("DLc") and on("PS"):
        for f in reg.transfer["DLc"]:
            push("ULS", "t", "", "—", [("DLc", f), ("PS", reg.transfer["PS"])])
    # SLS
    PS_ = pe_sets("SLS")
    push("SLS", "s", "PE only", "PE", PS_[0]["t"])
    G = []
    trS = _mul(_cross(road_states(True), [_st([("PED", 1)])] if on("PED") and o["pw"] else [S0]) + rail_states(True), gS)
    if trS:
        G.append(("traffic", trS))
    elif on("PED"):
        G.append(("pedestrian", [_st([("PED", gS("PED"))])]))
    th = [s for s in T01 if s["t"]]
    if th:
        G.append(("thermal", _mul(th, gS)))
    if WS:
        G.append(("wind", _mul(WS, gS)))
    if FL:
        G.append(("water flow", _mul(FL, gS)))
    has_rail = lambda s: any(i.startswith("LA300") for i, _ in s["t"])
    for L, ls in G:
        O = [x for x in G if x[0] != L]
        for r in range(len(O) + 1):
            for ix in _subs(len(O), r):
                k = 1 if r == 0 else o["k1"] if r == 1 else o["k2"]
                oth = [O[i] for i in ix]
                parts = [ls] + [[{"t": [(i, m * (o["rf"] if (L == "wind" and n == "traffic" and has_rail(s)) else k)) for i, m in s["t"]], "p": None} for s in l2]
                                for n, l2 in oth]
                label = "lead " + L + ((" + k=" + _js_num(k) + " × " + ", ".join(x[0] for x in oth)) if oth else "")
                for s in _cross(PS_, *parts):
                    push("SLS", "s", label, "PE", s["t"])
    return {"rows": rows, "capped": state["capped"], "summary": list(summ.values()), "options": o}


def _js_num(x):
    """Number as JavaScript's String(x) prints it (for labels / keys)."""
    return str(int(x)) if float(x).is_integer() else repr(float(x))


def combine(rows, prim):
    """rows: generate()["rows"]; prim: {action id: {"s": v} | {"max": a, "min": b}} (numpy arrays, one value per
    response). Returns {"ULS": {...}, "SLS": {...}, "missing": {id: n terms}}; per limit state max, min (arrays),
    gmax, gmin (governing row names), n (rows)."""
    nq = len(next(iter(prim.values()))["s" if "s" in next(iter(prim.values())) else "max"])
    P = {k: ({"s": np.asarray(v["s"], float)} if "s" in v else {"max": np.asarray(v["max"], float), "min": np.asarray(v["min"], float)}) for k, v in prim.items()}
    out = {ls: {"max": np.full(nq, -np.inf), "min": np.full(nq, np.inf), "gmax": [None] * nq, "gmin": [None] * nq, "n": 0} for ls in ("ULS", "SLS")}
    miss = {}
    for r in rows:
        O = out.get(r["ls"])
        if O is None:
            continue
        lo = np.zeros(nq); hi = np.zeros(nq)
        for aid, f in r["t"]:
            p = P.get(aid)
            if p is None:
                miss[aid] = miss.get(aid, 0) + 1
                continue
            if "s" in p:
                v = f * p["s"]; lo += v; hi += v
            else:
                a, b = f * p["max"], f * p["min"]
                hi += np.where(a > b, a, b); lo += np.where(a > b, b, a)
        O["n"] += 1
        up = hi > O["max"]; dn = lo < O["min"]
        O["max"] = np.where(up, hi, O["max"]); O["min"] = np.where(dn, lo, O["min"])
        for i in np.nonzero(up)[0]:
            O["gmax"][i] = r["name"]
        for i in np.nonzero(dn)[0]:
            O["gmin"][i] = r["name"]
    out["missing"] = miss
    return out


# ----------------------------------------------------------------------------------------------------------------
# platform: every P3c case on one response set, mapped to the register actions (as the dashboard's rxPrim)
SOIL_ACTIONS = ("SOo", "SOc")


def primitives(doc, geo, S, mdl, std, allow_proposed=False, soil_action="SOo", traffic_kw=None, eq_kw=None):
    """All P3c load cases evaluated on the response set of pdf2bim.model.responses, as combination primitives.
    Returns {"prim": {action id: {"s"} | {"max","min"}}, "names": response names, "sources": {id: text}, "not_combined":
    [(id, why)], "provisional": [...]}. soil_action: the register action that carries the earth pressure case (SOo
    other fills / SOc controlled fill) — the fill category is not in the bridge description: a provisional input."""
    from .responses import ResponseSet
    from .loads import sdl_case
    from .horizontal import horizontal_cases
    from .thermal import thermal_cases
    from .wind import wind_cases
    from .earthquake import earthquake_rsa
    from .traffic import traffic_envelope, Influence
    from ..description import Reader
    if soil_action not in SOIL_ACTIONS:
        raise ValueError(f"soil_action {soil_action!r}: one of {SOIL_ACTIONS}")
    RS = ResponseSet(mdl)
    st = lambda **kw: RS.static(**kw)
    P, src, prov, notc = {}, {}, [], []
    P["DLc"] = {"s": st(gravity=(0.0, 0.0, -1.0))}; src["DLc"] = "self weight of every member (integrated model)"
    C = sdl_case(doc, geo, mdl, allow_proposed=allow_proposed)
    P["SDLp"] = {"s": st(loads=C["loads"])}; src["SDLp"] = "SDL case (surfacing, barriers, other line loads)"
    H = horizontal_cases(doc, geo, mdl, std, allow_proposed=allow_proposed)
    hc = {k: st(loads=v["loads"]) for k, v in H["cases"].items()}
    P[soil_action] = {"s": hc["EP"]}; src[soil_action] = "earth pressure on both headstocks (EP)"
    prov.append({"path": "loads (earth pressure fill category)", "value": soil_action, "author": "AI", "decision": None,
                 "reason": "fill category (controlled fill SOc / other SOo) not in the description; SOo has the larger ULS factor and the smaller relieving factor"})
    z = np.zeros(len(RS.names))
    P["EPT"] = {"max": np.maximum.reduce([hc["EPTA"], hc["EPTB"], z]), "min": np.minimum.reduce([hc["EPTA"], hc["EPTB"], z])}
    src["EPT"] = "traffic surcharge behind A or behind B (envelope with zero)"
    P["BRKR"] = {"s": hc["BRKp"]}; src["BRKR"] = "braking toward B (negative factor = toward A)"
    P["CENR"] = {"s": hc["CEN"]}; src["CENR"] = "centrifugal, outward"
    T = thermal_cases(doc, geo, S, mdl, allow_proposed=allow_proposed)
    for aid, cid in (("TUW", "TU+"), ("TUC", "TU-"), ("TGP", "TGP"), ("TGN", "TGN"), ("SCR", "SCR")):
        if cid in T["cases"]:
            P[aid] = {"s": st(imposed=T["cases"][cid]["imposed"])}; src[aid] = f"thermal case {cid}"
    W = wind_cases(doc, geo, S, mdl, allow_proposed=allow_proposed)
    wc = {k: st(loads=v["loads"]) for k, v in W["cases"].items()}
    r35, rS = W["scale"]["with_traffic"], W["scale"]["sls"]
    for sx, r in (("U", 1.0), ("35", r35), ("S", rS)):
        P["WX_" + sx] = {"s": wc["WL+"] * r}
        P["WY_" + sx] = {"s": wc["WT+"] * r + (wc["WTV+"] if sx == "35" else 0.0)}
        P["WZ_" + sx] = {"max": np.maximum(wc["WVU+"], wc["WVU-"]) * r, "min": np.minimum(wc["WVU+"], wc["WVU-"]) * r}
    src["WX"] = "WL+ (x (V/V_uls)^2 at the with-traffic / SLS speeds)"; src["WY"] = "WT+ (+ WTV+ with traffic)"; src["WZ"] = "uplift WVU+ / WVU- envelope"
    Q = earthquake_rsa(doc, geo, mdl, std, sdl_loads=C["loads"], allow_proposed=allow_proposed, **(eq_kw or {}))
    if Q["names"] != RS.names:
        raise ValueError("earthquake responses and the response set differ")
    P["EQX"] = {"max": Q["resp"]["L"]["R"], "min": -Q["resp"]["L"]["R"]}; P["EQY"] = {"max": Q["resp"]["T"]["R"], "min": -Q["resp"]["T"]["R"]}
    src["EQX"] = "RSA, longitudinal direction alone"; src["EQY"] = "RSA, transverse direction alone"
    Tr = traffic_envelope(doc, geo, mdl, std, allow_proposed=allow_proposed, inf=Influence(mdl, responses=RS), **(traffic_kw or {}))
    for mn, e in Tr["env"].items():
        P[mn] = {"max": e["max"], "min": e["min"]}; src[mn] = f"{mn} moving-load envelope (DLA, lane factors)"
    rd = Reader(doc, allow_proposed)
    Ld = doc.get("loads") or {}
    for key, aid in (("pedestrian", "PED"), ("flood", "FLH"), ("collision", "COLX")):
        rec = Ld.get(key)
        if rec is None or (isinstance(rec, dict) and rec.get("value") is None and "rows" not in rec):
            notc.append((aid, f"loads.{key}: {(rec or {}).get('tag', 'absent')} — not analysed, not combined"))
    return {"prim": P, "names": RS.names, "meta": RS.meta, "sources": src, "not_combined": notc,
            "provisional": rd.provisional + prov + list(H.get("provisional") or []) + list(W.get("provisional") or []) + list(Q.get("provisional") or [])
                           + list(Tr.get("provisional") or []) + list(T.get("provisional") or []) + list(C.get("provisional") or []),
            "cases": {"horizontal": H, "thermal": T, "wind": W, "earthquake": Q, "traffic": Tr, "sdl": C}}


def available_actions(prim):
    """Register actions that have a primitive (wind ids without the speed suffix)."""
    return {k.split("_")[0] if k.split("_")[0] in ("WX", "WY", "WZ") else k for k in prim}


def combined_actions(doc, geo, S, mdl, std, allow_proposed=False, options=None, on=None, **kw):
    """Primitives + generated rows + ULS / SLS envelopes. on: the actions taking part (default: every action with a
    primitive). Returns the envelopes with the governing rows, the rows, the response names and the flags."""
    Pr = primitives(doc, geo, S, mdl, std, allow_proposed=allow_proposed, **kw)
    on = set(on) if on is not None else available_actions(Pr["prim"])
    reg = Register(std, on)
    G = generate(reg, options)
    Cb = combine(G["rows"], Pr["prim"])
    dedup = []
    for p in Pr["provisional"]:
        if p not in dedup:
            dedup.append(p)
    return {"case": "AS 5100.2 combined actions", "kind": "ULS / SLS envelopes of the P3c load cases", "names": Pr["names"], "envelopes": Cb,
            "rows": G["rows"], "capped": G["capped"], "on": sorted(on), "options": G["options"], "sources": Pr["sources"],
            "not_combined": Pr["not_combined"], "missing_terms": Cb["missing"], "standards_status": std.result_status(), "standards_used": std.usage(),
            "provisional": dedup, "primitives": Pr}


def _abs_gov(E, i):
    """(|value|, signed value, governing row) of the larger of max / min at response i."""
    a, b = E["max"][i], E["min"][i]
    return (abs(a), a, E["gmax"][i]) if abs(a) >= abs(b) else (abs(b), b, E["gmin"][i])


def schedule(CA):
    """Combined-action schedule from combined_actions(): per bearing, pile, girder line and sill, the ULS / SLS extremes
    with the governing rows (and positions). Values only — no capacity check, nothing design-approved."""
    names, Env = CA["names"], CA["envelopes"]
    meta = CA["primitives"]["meta"]
    ix = {n: i for i, n in enumerate(names)}
    out = {"bearings": {}, "piles": {}, "girders": {}, "sills": {}}
    for ls in ("ULS", "SLS"):
        E = Env[ls]
        for n, i in ix.items():
            if n[0] == "BL":
                d = out["bearings"].setdefault(n[1], {}).setdefault(ls, {})
                d[n[2]] = {"max": float(E["max"][i]), "gmax": E["gmax"][i], "min": float(E["min"][i]), "gmin": E["gmin"][i]}
            elif n[0] == "P" and n[2][:-1] in ("Ml", "Mt", "N") and n[2][-1] in "12":
                d = out["piles"].setdefault(n[1][0], {}).setdefault(ls, {})
                q = n[2][:-1]
                if q == "N":
                    cur = d.setdefault("N", {"max": -np.inf, "gmax": None, "min": np.inf, "gmin": None})
                    if E["max"][i] > cur["max"]:
                        cur["max"], cur["gmax"] = float(E["max"][i]), E["gmax"][i]
                    if E["min"][i] < cur["min"]:
                        cur["min"], cur["gmin"] = float(E["min"][i]), E["gmin"][i]
                else:
                    a, v, g = _abs_gov(E, i)
                    if a > d.get(q, {"abs": -1})["abs"]:
                        d[q] = {"abs": float(a), "value": float(v), "gov": g, "element": n[1][1], "end": int(n[2][-1])}
            elif n[0] == "G":
                line, eid = n[1]; q = n[2][0]; end = int(n[2][1])
                ch = meta[("G", n[1])]["ch"][end - 1]
                d = out["girders"].setdefault(line, {}).setdefault(ls, {})
                if q == "M":
                    for k, val, g, better in (("M_sag", E["max"][i], E["gmax"][i], lambda x, y: x > y), ("M_hog", E["min"][i], E["gmin"][i], lambda x, y: x < y)):
                        if k not in d or better(val, d[k]["value"]):
                            d[k] = {"value": float(val), "gov": g, "ch": ch, "element": eid}
                else:
                    a, v, g = _abs_gov(E, i)
                    k = {"V": "V", "T": "T", "N": "N"}[q]
                    if a > d.get(k, {"abs": -1})["abs"]:
                        d[k] = {"abs": float(a), "value": float(v), "gov": g, "ch": ch, "element": eid}
            elif n[0] == "HS":
                sid, eid = n[1]; q = n[2][:-1]; end = int(n[2][-1])
                s_ = meta[("HS", n[1])]["s"][end - 1]
                d = out["sills"].setdefault(sid, {}).setdefault(ls, {})
                if q in ("My", "Mz"):
                    for k, val, g, better in ((q + "_max", E["max"][i], E["gmax"][i], lambda x, y: x > y), (q + "_min", E["min"][i], E["gmin"][i], lambda x, y: x < y)):
                        if k not in d or better(val, d[k]["value"]):
                            d[k] = {"value": float(val), "gov": g, "s": s_, "element": eid}
                else:
                    a, v, g = _abs_gov(E, i)
                    if a > d.get(q, {"abs": -1})["abs"]:
                        d[q] = {"abs": float(a), "value": float(v), "gov": g, "s": s_, "element": eid}
    out["uplift"] = sorted(b for b, d in out["bearings"].items() if min(d["ULS"]["v"]["min"], d["SLS"]["v"]["min"]) < 0)
    return out
