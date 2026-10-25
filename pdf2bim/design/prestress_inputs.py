"""Inputs of the prestress-loss / camber analysis built from the bridge description (P4.5 stage 5b).

    from pdf2bim.design.prestress_inputs import hog_inputs
    H = hog_inputs(doc, geo, S, "G2", std, allow_proposed=False)
    H["p"]            # the input dictionary of pdf2bim.design.prestress.run
    H["source"]       # per input: where it came from (P1 / P2 geometry, description path, standards entry, Calculated)
    H["missing"]      # refused if not empty (MissingInput raised by hog_inputs unless partial=True)

Sources, in order (nothing is invented; a value not found is missing):
- girder geometry (P1): L = girder length end to end; a = (L - bearing-to-bearing chord) / 2 (bearing offset);
- girder section (P2, open section at midspan): A, yb, I; H = depth D; drying perimeter ue = the outline perimeter;
  after the deck pour ueC = ue - flange top surfaces - half the trough interior (enclosed by the deck), as the dashboard;
- deck: slab thickness, deck width over the girder (P2 station deck widths) -> beff and the wet-deck load
  wd = beff tD gamma_deck + dform; deck concrete f'c, E; haunch -> dgap; deck drying perimeter ued = beff (top surface);
- concrete: girder f'c (supert_types[].concrete_28d or the girder concrete row), f'cp at transfer
  (supert_types[].concrete_transfer); moduli and mean strength from AS5100.5:concrete:table_3_1_2 (emod = 1);
  girder density from the girder concrete row;
- strands: supert_types[].strand_pattern (y, x, diameter, debond_left / right, on); area and MBL from
  AS5100.5:strand:table_3_3_1 by diameter (checked against materials.strand.area); Ep from materials.strand;
  jacking ratio supert_types[].jacking_ratio; transmission length from AS5100.5:prestress:transmission_length;
- bars: supert_types[].bars (y, diameter, number);
- ages: tau = supert_types[].age_at_transfer; pour = age_deck_cast - age_at_transfer (both girder AGES, as the
  field definitions say — see finding P4-3);
- basic drying shrinkage: AS5100.5:shrinkage:basic_drying;
- everything else (environment k4, chi, ts, Rb, k7, Tav, jt, rb, dhard, tsd, rd, sidl, sidlA, dform, method switches,
  report times): design.prestress_losses rows (item = the input name).
"""
import math
from ..description import Reader, MissingInput
from ..sections.supert import supert_section

LOSS_ITEMS = ("k4", "chi", "ts", "Rb", "k7", "Tav", "jt", "rb", "dhard", "tsd", "rd", "sidl", "sidlA", "dform", "meth", "rlx", "relpre", "emod", "Tcur", "hcur")


def _t312(tab, fc):
    if fc <= tab[0][0]:
        return {"fcmi": tab[0][1], "E": tab[0][2]}
    for i in range(1, len(tab)):
        if fc <= tab[i][0]:
            r = (fc - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0])
            return {"fcmi": tab[i - 1][1] + r * (tab[i][1] - tab[i - 1][1]), "E": tab[i - 1][2] + r * (tab[i][2] - tab[i - 1][2])}
    return {"fcmi": tab[-1][1], "E": tab[-1][2]}


def _ueC(outline, D, ue, tol=1e-6):
    """Drying perimeter after the deck pour, as the dashboard (ue - 2 L(R6, R7) - inner chain of its HALF section): the
    outline minus the flange top surfaces (y = D) minus HALF of the trough interior (the chain of the open outline after
    the 12 outer points) — i.e. the trough, closed by the deck, counted as an enclosed void at half its perimeter.
    Interpretation of the dashboard's rule; to verify against the clause defining ue (finding P4-4)."""
    n = len(outline)
    edges = [(outline[i], outline[(i + 1) % n]) for i in range(n)]
    cut = 0.0
    for k, (a, b) in enumerate(edges):
        top = abs(a[1] - D) < tol and abs(b[1] - D) < tol
        trough = k >= 12 and not (k == n - 1)
        if top:
            cut += math.dist(a, b)
        elif trough:
            cut += 0.5 * math.dist(a, b)
    return ue - cut


def hog_inputs(doc, geo, S, girder, std, allow_proposed=False, partial=False):
    rd = Reader(doc, allow_proposed)
    src, missing, p = {}, [], {}

    def put(k, v, where):
        p[k] = v; src[k] = where
    sup = doc.get("superstructure") or {}
    mem = next((m for m in sup.get("members") or [] if m["id"] == girder), None)
    if mem is None:
        raise MissingInput(f"superstructure.members[{girder}] not found")
    tref = rd.value(mem.get("type_ref"), f"superstructure.members[{girder}].type_ref")
    T = next(x for x in sup.get("supert_types") or [] if x["id"] == tref)
    tp = f"superstructure.supert_types[{tref}]"
    gg = next(g for g in geo["girders"] if g["id"] == girder)
    G = S["girders"][girder]
    L = gg["length_end_to_end"] * 1000.0
    put("L", L, "P1 girder length end to end")
    put("a", (gg["length_end_to_end"] - gg["chord_length_bearings"]) / 2 * 1000.0, "P1 (length - bearing chord) / 2")
    row = min(G["stations"], key=lambda r: abs(r["t"] - 0.5))
    sec = supert_section(G["params"], row["w_left"], row["w_right"], "open")
    put("A", sec["A"], "P2 girder section (open, midspan)"); put("yb", sec["yc"], "P2"); put("I", sec["Ix"], "P2"); put("H", G["params"]["D"], "P2 depth D")
    o = sec["outline"]
    ue = sum(math.dist(o[i], o[(i + 1) % len(o)]) for i in range(len(o)))
    put("ue", ue, "Calculated: P2 outline perimeter")
    put("ueC", _ueC(o, G["params"]["D"], ue), "Calculated: perimeter - flange tops - half the trough interior (as the dashboard)")
    put("uesw", abs(p["ueC"] - ue) > 1e-6, "Calculated")
    # concrete
    conc = {}
    for r in rd.rows((doc.get("materials") or {}).get("concrete"), "materials.concrete"):
        el = (r.get("element") or "").lower()
        conc["girder" if "super-t" in el else "deck" if "deck" in el else el] = r
    fc = rd.value(T.get("concrete_28d"), tp + ".concrete_28d", required=False) or (conc.get("girder") or {}).get("fc")
    fci = rd.value(T.get("concrete_transfer"), tp + ".concrete_transfer", required=False)
    if fc is None:
        missing.append(tp + ".concrete_28d")
    if fci is None:
        missing.append(tp + ".concrete_transfer")
    loss = {}
    times = []
    for r in rd.rows((doc.get("design") or {}).get("prestress_losses"), "design.prestress_losses", required=False):
        if r.get("item") == "time":
            times.append(float(r["value"]))
        elif r.get("item") is not None:
            loss[r["item"]] = r.get("value")
    for k in LOSS_ITEMS:
        if k in loss and loss[k] is not None:
            put(k, float(loss[k]), "design.prestress_losses")
        else:
            missing.append(f"design.prestress_losses[{k}]")
    if not times:
        missing.append("design.prestress_losses[time]")
    tab = std.get("AS5100.5:concrete:table_3_1_2").value
    if fc is not None and fci is not None:
        put("fc", float(fc), tp + ".concrete_28d"); put("fci", float(fci), tp + ".concrete_transfer")
        if p.get("emod", 1) != 1:
            missing.append("emod other than 1 (Table 3.1.2) is not supported by the input builder")
        a_, b_ = _t312(tab, float(fci)), _t312(tab, float(fc))
        put("Ect", a_["E"], "AS5100.5:concrete:table_3_1_2 at f'cp"); put("fcmi", a_["fcmi"], "AS5100.5:concrete:table_3_1_2 at f'cp")
        for k in ("Ec", "Ecp", "Ecs"):
            put(k, b_["E"], "AS5100.5:concrete:table_3_1_2 at f'c")
    dens = (conc.get("girder") or {}).get("density")
    if dens is None:
        missing.append("materials.concrete[girder].density")
    else:
        put("rho", float(dens), "materials.concrete[girder].density")
    put("eb", std.get("AS5100.5:shrinkage:basic_drying").value, "AS5100.5:shrinkage:basic_drying")
    # strands
    tab33 = std.get("AS5100.5:strand:table_3_3_1").value
    sm = rd.rows((doc.get("materials") or {}).get("strand"), "materials.strand", required=False)
    sm = sm[0] if sm else {}
    pat = [r for r in rd.rows(T.get("strand_pattern"), tp + ".strand_pattern", required=False) if r.get("on", True)]
    if not pat:
        missing.append(tp + ".strand_pattern")
    else:
        dias = {float(r["diameter"]) for r in pat}
        if len(dias) != 1:
            missing.append(f"{tp}.strand_pattern: one strand diameter expected (found {sorted(dias)})")
        db = dias.pop()
        key = next((k for k in tab33 if abs(float(k) - db) < 1e-9), None)
        if key is None:
            missing.append(f"strand diameter {db} not in AS5100.5:strand:table_3_3_1")
        else:
            Ap, mbl = tab33[key]
            if sm.get("area") is not None and abs(float(sm["area"]) - Ap) > 1e-9:
                missing.append(f"materials.strand.area {sm['area']} differs from Table 3.3.1 ({Ap}) for {db} mm strand")
            put("db", db, tp + ".strand_pattern diameter"); put("Ap", float(Ap), "AS5100.5:strand:table_3_3_1"); put("mbl", float(mbl), "AS5100.5:strand:table_3_3_1")
        put("sy", [float(r["y"]) for r in pat], tp + ".strand_pattern"); put("sx", [r.get("x") for r in pat], tp + ".strand_pattern")
        put("sl", [{"d": float(r.get("debond_left") or 0), "d2": float(r.get("debond_right") or 0)} for r in pat], tp + ".strand_pattern")
    if sm.get("Ep") is None:
        missing.append("materials.strand.Ep")
    else:
        put("Ep", float(sm["Ep"]), "materials.strand.Ep")
    ji = rd.value(T.get("jacking_ratio"), tp + ".jacking_ratio", required=False)
    if ji is None:
        missing.append(tp + ".jacking_ratio")
    else:
        put("ji", float(ji), tp + ".jacking_ratio")
    put("lt", std.get("AS5100.5:prestress:transmission_length").value, "AS5100.5:prestress:transmission_length")
    # bars
    bm = rd.rows((doc.get("materials") or {}).get("reinforcement"), "materials.reinforcement", required=False)
    bars = [{"y": float(r["y"]), "d": float(r["diameter"]), "A": int(r.get("number") or 1) * math.pi / 4 * float(r["diameter"]) ** 2}
            for r in rd.rows(T.get("bars"), tp + ".bars", required=False)]
    put("bars", bars, tp + ".bars")
    put("Es", float(bm[0]["Es"]) if bm else 200000.0, "materials.reinforcement.Es" if bm else "MISSING")
    if not bm:
        missing.append("materials.reinforcement")
    # ages and stages
    tau = rd.value(T.get("age_at_transfer"), tp + ".age_at_transfer", required=False)
    adc = rd.value(T.get("age_deck_cast"), tp + ".age_deck_cast", required=False)
    if tau is None:
        missing.append(tp + ".age_at_transfer")
    else:
        put("tau", float(tau), tp + ".age_at_transfer")
    if adc is None or tau is None:
        missing.append(tp + ".age_deck_cast")
    else:
        put("pour", float(adc) - float(tau), "Calculated: age_deck_cast - age_at_transfer")
    # deck
    D_ = doc.get("deck") or {}
    tD = rd.value(D_.get("slab_thickness"), "deck.slab_thickness")
    dk = conc.get("deck")
    if dk is None or dk.get("fc") is None or dk.get("E") is None or dk.get("density") is None:
        missing.append("materials.concrete[deck] fc / E / density")
    else:
        beff = row["deck_left"] + row["deck_right"]
        put("deck", 1, "deck present"); put("dth", tD, "deck.slab_thickness"); put("beff", beff, "P2 deck width over the girder (midspan)")
        put("dbw", beff, "P2"); put("dgap", float(G["haunch"]), tp + ".haunch"); put("fcd", float(dk["fc"]), "materials.concrete[deck].fc"); put("Ed", float(dk["E"]), "materials.concrete[deck].E")
        put("dgam", float(dk["density"]), "materials.concrete[deck].density"); put("ued", beff, "Calculated: deck top surface only")
        if "dform" in p:
            put("wd", tD * beff * float(dk["density"]) / 1e6 + p["dform"], "Calculated: tD beff gamma + dform")
    if missing and not partial:
        raise MissingInput("prestress-loss inputs missing: " + "; ".join(missing))
    if not missing:
        nd = p["Ed"] / p["Ecs"]; da = p["beff"] * p["dth"] * nd; yd = p["H"] + p["dgap"] + p["dth"] / 2
        yc = (p["A"] * p["yb"] + da * yd) / (p["A"] + da)
        p["Ac"], p["yc"] = p["A"] + da, yc
        p["Ic"] = p["I"] + p["A"] * (p["yb"] - yc) ** 2 + p["beff"] * nd * p["dth"] ** 3 / 12 + da * (yd - yc) ** 2
        p["k8"] = max(p["Tav"] / 20, 1.0)
        p["k3s"] = (p["hcur"] / 24) * (math.exp(13.65 - 4000 / (273 + p["Tcur"])) - math.exp(13.65 - 4000 / 293))
        tl = sorted(set(times) | {v for v in (p["pour"], p["pour"] + p["dhard"], p["sidlA"]) if v > 0})
        p["times"] = tl
        p["fl"] = {"rl": 1, "sh": 1, "cr": 1, "dk": 1, "bar": 1}
        p["asup"], p["terec"] = None, None
        src["asup"] = src["terec"] = "not used: girder stored on its bearings, erection at the deck pour (age_at_erection not used yet)"
        p["meth"] = int(p["meth"])
        if p["relpre"]:
            from .prestress import Models
            p["rel"] = Models(std).relax(dict(p, k8=max(p["Tav"] / 20, 1)), 0) / 100
            src["rel"] = "Calculated: relaxation before transfer (cl. 3.3.4.3 at j = jt)"
        else:
            missing.append("rel (relaxation before transfer) when relpre = 0")
        for k in ("Ac", "yc", "Ic", "k8", "k3s", "times", "fl"):
            src.setdefault(k, "Calculated")
    return {"p": p, "source": src, "missing": missing, "provisional": rd.provisional, "girder": girder}
