"""Pretensioned girder checks at transfer and in the end zones (Tier 1 item 1; rules in PRESTRESS_DESIGN_RULES.md).

    from pdf2bim.design.prestress_checks import prestress_checks
    out = prestress_checks(p, r, std, client=None, stations_m=None)
    # p, r: the losses-analysis inputs and results (prestress_inputs.hog_inputs()["p"], prestress.run(p, std))

1. Transfer stresses of the girder alone (stresses of the losses analysis at transfer: strand forces after elastic
   shortening, self weight on the bearings). Compression <= k f'cp, k = 0.5 for a uniform and 0.6 for a triangular
   distribution, interpolated linearly on the ratio of the smaller to the larger face stress (AS5100.5:transfer:
   compression_limit). Tension <= 0.25 sqrt(f'cp) (AS5100.5:crack_control:uncracked_tension_limit with f'cp), and
   <= 0.5 sqrt(f'cp) where bonded steel is within 200 mm of the tension face (AS5100.5:crack_control:tension_limit_bonded_steel).
2. Debonding (TfNSW BTD 2011/06, applies when the client is TfNSW or a former NSW road authority): debonded strands
   <= 50 % of the strands at any section; no debonded strand next to another debonded strand in the same row or
   column. "Next to" = the next grid position: same level and |dx| <= the smallest strand pitch in the pattern, or same
   x and |dy| <= the smallest row spacing (interpretation, provisional).
3. Development length (AS5100.5:prestress:development_length): Lp = 0.145 (fpb - 0.67 sigma_pe) db >= 60 db per strand,
   2 Lp for a debonded strand (the SLS checks allow tension in the precompressed zone, so the doubled length applies),
   measured from the bonded point. A ULS station inside Lp of any strand it counts at full capacity is flagged.
Every limit is read from the standards data (status below 'checked': results UNVERIFIED). N, mm, MPa, kN.
"""
import math

NSW = ("transport for nsw", "tfnsw", "roads and maritime", "rms", "roads & maritime", "rta")


def _transfer(p, r, std):
    kc = std.get("AS5100.5:transfer:compression_limit").value
    kt = std.get("AS5100.5:crack_control:uncracked_tension_limit").value
    ka = std.get("AS5100.5:crack_control:tension_limit_bonded_steel").value
    fci = p["fci"]
    ft, fa = kt * math.sqrt(fci), ka * math.sqrt(fci)
    rows, worst = [], {"uC": 0.0, "uT": 0.0, "uTa": 0.0}
    for s in r["st"]:
        top, bot = s["top"], s["bot"]          # compression +
        hi, lo = max(top, bot), min(top, bot)
        ratio = max(0.0, lo / hi) if hi > 0 else 0.0
        k = kc["triangular"] + (kc["uniform"] - kc["triangular"]) * ratio
        uC = hi / (k * fci) if hi > 0 else 0.0
        uT, uTa = (-lo / ft, -lo / fa) if lo < 0 else (0.0, 0.0)
        rows.append({"x_m": s["x"] / 1000.0, "top": top, "bot": bot, "k": k, "limitC": k * fci, "limitT": -ft, "limitTa": -fa, "uC": uC, "uT": uT, "uTa": uTa})
        for q in ("uC", "uT", "uTa"):
            if rows[-1][q] > worst[q]:
                worst[q], worst[q + "_x_m"] = rows[-1][q], s["x"] / 1000.0
    return {"fci": fci, "ft": ft, "fta": fa, "rows": rows, "worst": worst, "ok": worst["uC"] <= 1 and worst["uT"] <= 1, "ok_bonded": worst["uC"] <= 1 and worst["uTa"] <= 1,
            "note": "girder alone at transfer, self weight on the bearings (losses analysis); k between 0.5 (uniform) and 0.6 (triangular) on the face-stress ratio; "
                    "tension against 0.25 sqrt(f'cp) and, where bonded steel is within 200 mm of the tension face, 0.5 sqrt(f'cp)"}


def _debonding(p, std, client):
    rule = std.get("TfNSW:BTD2011-06:debonding").value
    c = (client or "").lower()
    applies = any(n in c for n in NSW)
    sx, sy, sl, n = p.get("sx") or [], p["sy"], p["sl"], len(p["sy"])
    if any(x is None for x in sx) or len(sx) != n:
        return {"applies": applies, "client": client, "why": "strand x positions missing in the strand pattern"}
    ys = sorted(set(sy))
    dy = min((b - a for a, b in zip(ys, ys[1:])), default=math.inf)
    dx = min((abs(sx[i] - sx[j]) for i in range(n) for j in range(i + 1, n) if sy[i] == sy[j] and sx[i] != sx[j]), default=math.inf)
    out = {"applies": applies, "client": client, "max_fraction": rule["max_fraction"], "pitch_x": dx, "pitch_y": dy, "ends": {}}
    for end, key in (("A", "d"), ("B", "d2")):
        deb = [i for i in range(n) if sl[i][key] > 0]
        lens = sorted({sl[i][key] for i in deb})
        frac = [{"from_end_m": 0.0, "n": len(deb), "fraction": len(deb) / n}]
        for L_ in lens[:-1]:                                       # sections just past each debond length
            k = sum(1 for i in deb if sl[i][key] > L_)
            frac.append({"from_end_m": L_ / 1000.0, "n": k, "fraction": k / n})
        adj = [(i, j) for a_, i in enumerate(deb) for j in deb[a_ + 1:]
               if (sy[i] == sy[j] and abs(sx[i] - sx[j]) <= dx + 1e-6) or (sx[i] == sx[j] and abs(sy[i] - sy[j]) <= dy + 1e-6)]
        out["ends"][end] = {"n_debonded": len(deb), "n": n, "fraction": frac, "worst_fraction": frac[0]["fraction"],
                            "adjacent_pairs": [{"a": i, "b": j, "a_xy": [sx[i], sy[i]], "b_xy": [sx[j], sy[j]]} for i, j in adj],
                            "ok": frac[0]["fraction"] <= rule["max_fraction"] + 1e-9 and not adj}
    out["ok"] = all(e["ok"] for e in out["ends"].values())
    return out


def _development(p, r, std, stations_m):
    q = std.get("AS5100.5:prestress:development_length").value
    db, Ap, L = p["db"], p["Ap"], p["L"]
    fpb = p["mbl"] * 1e3 / Ap
    from .prestress import strand_forces_at
    Pm = strand_forces_at(r, L / 2)                                 # last reported time, midspan
    strands = []
    for i, s in enumerate(p["sl"]):
        spe = Pm[i] * 1e3 / Ap if Pm[i] > 0 else (p["ji"] * p["mbl"] * 1e3 / Ap)
        Lp = max(q["k"] * (fpb - q["kpe"] * spe) * db, q["min_db"] * db)
        strands.append({"i": i, "sigma_pe": spe, "Lp": Lp, "factor": q["debonded_factor"] if (s["d"] or s["d2"]) else 1.0,
                        "devA": s["d"] + Lp * (q["debonded_factor"] if s["d"] else 1.0), "devB": L - s["d2"] - Lp * (q["debonded_factor"] if s["d2"] else 1.0),
                        "startA": s["d"], "startB": L - s["d2"]})
    flagged = []
    for x_m in stations_m or []:
        x = x_m * 1000.0
        part = [s["i"] for s in strands if (s["startA"] < x < s["devA"]) or (s["devB"] < x < s["startB"])]
        if part:
            flagged.append({"x_m": x_m, "n_partial": len(part), "strands": part})
    return {"fpb": fpb, "db": db, "Lp_min": min(s["Lp"] for s in strands), "Lp_max": max(s["Lp"] for s in strands),
            "full_from_A_m": max(s["devA"] for s in strands) / 1000.0, "full_from_B_m": (L - min(s["devB"] for s in strands)) / 1000.0,
            "strands": strands, "flagged_stations": flagged,
            "note": "at a flagged station ULS bending caps those strands at strand_stress_cap (sigma_pe at the transmission length rising linearly to fpb at Lp)"}


def strand_stress_cap(s, x, fpb, Lt):
    """Largest stress strand s (a _development strand) can develop at x (mm from end A): sigma_pe up to the transmission
    length Lt from the bonded start, rising linearly to fpb at the development length, fpb beyond (AS 5100.5 Cl 13.3.2.2,
    verify). Inside Lt the force itself is already reduced by the transmission (strand_forces_at)."""
    Ld = s["Lp"] * s["factor"]                                     # debonded strands: debonded_factor x Lp
    xb = min(x - s["startA"], s["startB"] - x)                     # bonded length to the nearer bond start
    if xb >= Ld:
        return fpb
    if xb <= Lt or Ld <= Lt:
        return s["sigma_pe"]
    return s["sigma_pe"] + (fpb - s["sigma_pe"]) * (xb - Lt) / (Ld - Lt)


def prestress_checks(p, r, std, client=None, stations_m=None):
    tr = _transfer(p, r, std)
    deb = _debonding(p, std, client)
    dev = _development(p, r, std, stations_m)
    return {"transfer": tr, "debonding": deb, "development": dev, "standards_status": std.result_status()}
