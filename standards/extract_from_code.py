#!/usr/bin/env python3
"""Inventory the standards values that are currently hard-coded in the dashboard, as standards-data entries.

    python3 standards/extract_from_code.py      # writes standards/data/*.json (regenerates; review fields preserved)

Every entry is created with status "code-extracted-unverified" and the exact code location it came from.
Nothing here is checked against a Standard. The edition / amendment are NOT recorded in the code, so they are
left null and flagged; nothing is guessed. No clause text is copied: only clause numbers and numbers the code uses.

If a data file already exists, review fields (status, review, reference.authorised_source, edition, amendment,
interpretation) of matching ids are kept, but a value that changed in code is reported and its status is reset to
code-extracted-unverified (a reviewed value no longer matches what the code uses).
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "standards", "data")
IMPL_VERSION = "dashboard v45 (src/, base/ at P0.3)"


def find(path, pattern, flags=0):
    """(line number, match) of the first match of pattern in file path."""
    txt = open(os.path.join(ROOT, path), encoding="utf-8").read()
    m = re.search(pattern, txt, flags)
    if not m:
        raise SystemExit(f"pattern not found in {path}: {pattern[:60]}")
    return txt.count("\n", 0, m.start()) + 1, m


def entry(id_, standard, clause, quantity, units, value, applicability, context, used_by, interp=None, specialist=False, table=None):
    return {"id": id_, "standard": standard, "edition": None, "amendment": None,
            "reference": {"clause": clause, "table": table, "figure": None, "authorised_source": None},
            "quantity": quantity, "units": units, "value": value, "applicability": applicability, "context": context,
            "implementation": {"used_by": used_by, "version": IMPL_VERSION},
            "status": "code-extracted-unverified",
            "review": {"reviewer": None, "date": None, "method": None, "notes": None},
            "interpretation": {"open": True, "note": interp or "Edition and amendment not recorded in the code; value not checked against an authorised copy.", "specialist_review": specialist}}


def load_factors():
    path = "base/BR13A_grillage_dashboard_v15.html"
    txt = open(os.path.join(ROOT, path), encoding="utf-8").read()
    rx = re.compile(r"\['([A-Za-z0-9]+)','([^']*)','([A-Z]+)','([^']*)',([\d.]+),([\d.]+),([\d.]+),'([A-Z]+)',([01]),'([^']*)'\]")
    out = []
    for m in rx.finditer(txt):
        line = txt.count("\n", 0, m.start()) + 1
        lid, name, grp, clause, u, b, s = m.group(1), m.group(2), m.group(3), m.group(4), float(m.group(5)), float(m.group(6)), float(m.group(7))
        spec = grp in ("RT", "RL", "EQ", "CO") or lid in ("EPT", "SDLp", "SDLr")
        out.append(entry(f"AS5100.2:load_factor:{lid}", "AS 5100.2", clause, f"load factors for '{name}' (ULS, ULS relieving, SLS)", "-",
                         {"uls": u, "uls_relieving": b, "sls": s},
                         f"action group {grp}; dashboard switch on={m.group(9)}", "combination register (Combos tab, window.CBX) and Super-T design dgFac()",
                         [f"{path}:{line}", "src/dsg2_ui.js:35 (dgFac reads these by regex)"],
                         interp=("Edition / amendment not recorded in the code. " + ("EPT factor is 0 in code: AS 5100.3 governs, not set. " if lid == "EPT" else "")
                                 + "Not checked against an authorised copy."), specialist=spec))
    if len(out) < 40:
        raise SystemExit(f"expected about 50 load-factor rows, found {len(out)}")
    return out


def earthquake():
    line, m = find("src/sub5.js", r"var EQ_CH=\{(.*?)\};")
    tab = {k: [float(x) for x in v.split(",")] for k, v in re.findall(r"(\w+):\[([^\]]+)\]", m.group(1))}
    e = [entry("AS1170.4:spectral_shape:Ch", "AS 1170.4", None, "spectral shape factor Ch(T) — piecewise parameters per site class", "-",
               {"type": "piecewise", "columns": ["Ch(0)", "slope 0-0.1 s", "plateau", "c (T<=1.5 s: c/T)", "c2 (T>1.5 s: c2/T^2)"], "rows": tab},
               "site sub-soil classes Ae-Ee", "earthquake response spectrum (Loads -> Earthquake)", [f"src/sub5.js:{line}", "src/sub5.js:9 eqCh()"],
               interp="Transcribed earlier from memory, not from an authorised copy (gap F-2). Clause / table number not recorded in code. Must be checked.",
               specialist=True)]
    line, m = find("src/sub5.js", r"var EQ=\{kp:([\d.]+), Z:([\d.]+)")
    e.append(entry("AS1170.4:probability_factor:kp_default", "AS 1170.4", None, "probability factor kp used as default (1/2000 annual probability)", "-",
                   float(m.group(1)), "default only; the design return period follows the bridge importance level (AS 5100.2) — project input",
                   "earthquake spectrum", [f"src/sub5.js:{line}"], interp="Default in code; return period and importance level not in the drawing set.", specialist=True))
    return e


def design():
    e = []
    line, m = find("src/dsg_engine.js", r"function gam\(fc\)\{ return Math\.max\(([\d.]+), Math\.min\(([\d.]+), ([\d.]+)-([\d.]+)\*fc\)\); \}")
    e.append(entry("AS5100.5:stress_block:gamma", "AS 5100.5", None, "rectangular stress block depth factor γ = clamp(a − b·f'c, min, max)", "-",
                   {"a": float(m.group(3)), "b": float(m.group(4)), "min": float(m.group(1)), "max": float(m.group(2))}, "f'c in MPa",
                   "ULS bending (fibre engine)", [f"src/dsg_engine.js:{line}"], interp="Form and limits as coded; engine discrepancy E-1 open.", specialist=False))
    line, m = find("src/dsg_engine.js", r"function a2\(fc\)\{ return Math\.max\(([\d.]+), Math\.min\(([\d.]+), ([\d.]+)-([\d.]+)\*fc\)\); \}")
    e.append(entry("AS5100.5:stress_block:alpha2", "AS 5100.5", None, "rectangular stress block intensity factor α2 = clamp(a − b·f'c, min, max)", "-",
                   {"a": float(m.group(3)), "b": float(m.group(4)), "min": float(m.group(1)), "max": float(m.group(2))}, "f'c in MPa",
                   "ULS bending (fibre engine; pdf2bim/design/flexure.py)", [f"src/dsg_engine.js:{line}", "pdf2bim/design/flexure.py"]))
    line, m = find("src/dsg_engine.js", r"var phi=Math\.max\(([\d.]+),Math\.min\(([\d.]+),([\d.]+)-([\d.]+)\*kuo/([\d.]+)\)\)")
    e.append(entry("AS5100.5:capacity_factor:phi_bending", "AS 5100.5", None, "capacity reduction factor in bending without axial force φ = clamp(a − b·kuo / c, min, max)", "-",
                   {"a": float(m.group(3)), "b": float(m.group(4)), "c": float(m.group(5)), "min": float(m.group(1)), "max": float(m.group(2))}, "kuo = dn / d of the deepest tension steel (as coded)",
                   "ULS bending (fibre engine; pdf2bim/design/flexure.py)", [f"src/dsg_engine.js:{line}", "pdf2bim/design/flexure.py"],
                   interp="Form and limits as coded; d taken as the deepest bar or tendon (as coded) — the definition of d for kuo not reviewed. Not checked against an authorised copy.", specialist=True))
    line, m = find("src/dsg_engine.js", r"var s=Math\.abs\(e\), A=([\d.]+), B=([\d.]+), C=([\d.]+);")
    e.append(entry("AS5100.5:strand:stress_strain_mattock", "PCI (as coded; not AS 5100.5)", None, "prestressing strand stress-strain curve f = E e (A + (1 − A) / (1 + (B e)^C)^(1/C)) ≤ fpb (modified Ramberg-Osgood, low-relaxation strand)", "-",
                   {"A": float(m.group(1)), "B": float(m.group(2)), "C": float(m.group(3))}, "low-relaxation 7-wire strand; strain e total (effective prestrain + ULS increment)",
                   "ULS bending, strain compatibility (fibre engine; pdf2bim/design/flexure.py)", [f"src/dsg_engine.js:{line}", "pdf2bim/design/flexure.py"],
                   interp="A material model from US practice (PCI), not a value from AS 5100.5; the strand supplier's curve or the AS 5100.5 approximate tendon stress may be required instead. Not checked.", specialist=True))
    line, m = find("src/dsg_engine.js", r"var ecu=([\d.]+)")
    e.append(entry("AS5100.5:strain:ecu", "AS 5100.5", None, "ultimate concrete compressive strain", "-", float(m.group(1)), "ULS strain compatibility",
                   "ULS bending (both engines)", [f"src/dsg_engine.js:{line}", "src/dsg_engine2.js:4"]))
    line, m = find("src/dsg_engine2.js", r"var dnb=ecu/\(ecu\+([\d.]+)\)\*dmax")
    e.append(entry("AS5100.5:strain:balanced_steel", "AS 5100.5", None, "steel strain at the balanced point of the N-M diagram (dn_b = ecu / (ecu + e) d)", "-",
                   float(m.group(1)), "N-M interaction (balanced load Nub for the φ transition)", "N-M interaction (src/dsg_engine2.js; pdf2bim/design/nm.py)",
                   [f"src/dsg_engine2.js:{line}", "pdf2bim/design/nm.py"], interp="Value as coded (≈ fsy / Es for 500 MPa bars); not checked against an authorised copy.", specialist=True))
    line, m = find("src/dsg_engine2.js", r"ph=\(r\.N<=Nub\)\?([\d.]+):([\d.]+)\+\(phiB\(r\.kuo\)-([\d.]+)\)\*\(1-r\.N/Nub\)")
    e.append(entry("AS5100.5:capacity_factor:phi_compression", "AS 5100.5", "Table 2.3.2 (as labelled in the code)", "capacity reduction factor for compression at and above the balanced load; linear to the bending value between the balanced load and N = 0", "-",
                   float(m.group(1)), "N-M interaction, compression side", "N-M interaction (src/dsg_engine2.js; pdf2bim/design/nm.py)",
                   [f"src/dsg_engine2.js:{line}", "pdf2bim/design/nm.py"], interp="Value and the linear transition as coded; not checked against an authorised copy.", specialist=True))
    # shear and torsion, general method (src/dsg_engine2.js shear()): one entry, each coefficient read by its own pattern
    pats = {"sqrt_fc_max": r"var sf=Math\.min\(Math\.sqrt\(Q\.fc\),([\d.]+)\)",
            "torsion_equivalent_shear": r"o\.Teq=Q\.Ao>0\?([\d.]+)\*T\*Q\.uh/\(2\*Q\.Ao\)",
            "axial_in_ex": r"o\.num=M/Q\.dv\+o\.Veff\+([\d.]+)\*N-Q\.Apt\*Q\.spo",
            "ex_min": r"o\.ex=Math\.max\((-[\d.e-]+),Math\.min\(([\d.e-]+),o\.ex\)\)",
            "theta_a": r"o\.th=([\d.]+)\+([\d.]+)\*o\.ex",
            "asv_min": r"o\.AsvMin=([\d.]+)\*Math\.sqrt\(Q\.fc\)\*Q\.bv/Q\.fsyf",
            "kdg": r"o\.kdg=Math\.max\(([\d.]+),([\d.]+)/\(([\d.]+)\+Q\.dg\)\)",
            "kv": r"o\.kv=([\d.]+)/\(1\+([\d.]+)\*o\.ex\)\*\(o\.minV\?1:([\d.]+)/\(([\d.]+)\+o\.kdg\*Q\.dv\)\)",
            "vu_max": r"o\.Vumax=([\d.]+)\*Q\.fc\*Q\.bv\*Q\.dv\*ct/\(1\+ct\*ct\)",
            "asw_min": r"o\.AswMin=([\d.]+)\*Q\.y1/Q\.fsyf",
            "tcr": r"o\.Tcr=([\d.]+)\*Math\.sqrt\(Q\.fc\)\*Q\.Acp\*Q\.Acp/Q\.uc",
            "long_tension": r"o\.Ftd=M/\(([\d.]+)\*Q\.dv\)\+([\d.]+)\*N/phi\+ct\*Math\.sqrt\(Math\.pow\(Math\.max\(V/phi-Q\.Pv-([\d.]+)\*o\.Vus,0\),2\)\+Math\.pow\(([\d.]+)\*Q\.uh\*T/\(2\*Q\.Ao\*phi\),2\)\)"}
    g = {}
    lines = []
    for k, pat in pats.items():
        line, m = find("src/dsg_engine2.js", pat)
        lines.append(line)
        v = [float(x) for x in m.groups()]
        g[k] = v[0] if len(v) == 1 else v
    val = {"sqrt_fc_max": g["sqrt_fc_max"], "torsion_equivalent_shear": g["torsion_equivalent_shear"], "axial_in_ex": g["axial_in_ex"],
           "ex_min": g["ex_min"][0], "ex_max": g["ex_min"][1], "theta_deg": {"a": g["theta_a"][0], "b": g["theta_a"][1]}, "asv_min": g["asv_min"],
           "kdg": {"min": g["kdg"][0], "a": g["kdg"][1], "b": g["kdg"][2]}, "kv": {"a": g["kv"][0], "b": g["kv"][1], "c": g["kv"][2], "d": g["kv"][3]},
           "vu_max": g["vu_max"], "asw_min": g["asw_min"], "tcr": g["tcr"],
           "long_tension": {"lever": g["long_tension"][0], "axial": g["long_tension"][1], "vus": g["long_tension"][2], "torsion": g["long_tension"][3]}}
    e.append(entry("AS5100.5:shear:general_method", "AS 5100.5", "Section 8.2 general method (as labelled in the code)",
                   "shear and torsion, general method: sqrt(f'c) cap; torsion as equivalent wall shear; ex = (M/dv + Veff + a N - Apt spo) / (2 (Es Ast + Ep Apt [+ Ec Act])) clamped; theta = a + b ex (deg); kv = a / (1 + b ex) x (min. steel ? 1 : c / (d + kdg dv)); kdg = max(min, a / (b + dg)); Asv,min = k sqrt(f'c) bv / fsy.f; Vu,max = k f'c bv dv cot / (1 + cot^2); Asw,min = k y1 / fsy.f; Tcr = k sqrt(f'c) Acp^2 / uc; longitudinal tension M / (lever dv) + axial N / phi + cot sqrt((V/phi - Pv - vus Vus)^2 + (torsion uh T / (2 Ao phi))^2)", "-",
                   val, "Super-T shear / torsion checks per station", "ULS shear and torsion (src/dsg_engine2.js; pdf2bim/design/shear.py)",
                   [f"src/dsg_engine2.js:{min(lines)}", "pdf2bim/design/shear.py"], specialist=True,
                   interp="Coefficients as coded; the clause numbers, the εx denominator switch, how torsion and shear steel are shared, and the V-M interaction are interpretations of the code, not checked against an authorised copy."))
    line, m = find("src/dsg_engine2.js", r"phi:([\d.]+), dn:0")
    e.append(entry("AS5100.5:capacity_factor:phi_tension_point", "AS 5100.5", None, "capacity reduction factor at the pure-tension point of the N-M diagram", "-",
                   float(m.group(1)), "N-M interaction", "ULS bending + axial", [f"src/dsg_engine2.js:{line}"],
                   interp="Value as coded; how φ varies along the N-M curve not reviewed.", specialist=True))
    line, m = find("src/dsg_engine2.js", r"phi=([\d.]+), o=\{\}")
    e.append(entry("AS5100.5:capacity_factor:phi_shear_torsion", "AS 5100.5", None, "capacity reduction factor, shear and torsion", "-",
                   float(m.group(1)), "shear / torsion checks", "ULS shear and torsion", [f"src/dsg_engine2.js:{line}"]))
    return e


def environment():
    e = []
    line, m = find("src/sub4.js", r"var WD=\{V:([\d.]+), rho:([\d.]+), Cd:([\d.]+), hBar:([\d.]+), CL:([\d.]+), eL:([\d.]+), fLon:([\d.]+)")
    e.append(entry("AS1170.2:air_density", "AS/NZS 1170.2", None, "air density ρ", "kg/m3", float(m.group(2)), "wind pressure q = 0.5 ρ V²",
                   "wind (Loads -> Wind)", [f"src/sub4.js:{line}", "src/sub4.js:13 wdQ()"]))
    e.append(entry("AS5100.2:wind:Cd_default", "AS 5100.2", None, "drag coefficient default (should come from the chart for b/d)", "-", float(m.group(3)),
                   "default only — to be read from the chart for the section's b/d", "transverse wind", [f"src/sub4.js:{line}"],
                   interp="Code uses a fixed default instead of the chart value.", specialist=True))
    e.append(entry("AS5100.2:wind:CL_default", "AS 5100.2", None, "lift coefficient default", "-", float(m.group(5)), "vertical wind", "vertical wind",
                   [f"src/sub4.js:{line}"], specialist=True))
    e.append(entry("AS5100.2:wind:longitudinal_fraction", "AS 5100.2", None, "longitudinal wind as a fraction of transverse", "-", float(m.group(7)),
                   "longitudinal wind", "longitudinal wind", [f"src/sub4.js:{line}"], specialist=True))
    line, m = find("src/sub3.js", r"alpha:([\d.e-]+)")
    e.append(entry("AS5100.5:concrete:thermal_expansion", "AS 5100.5", None, "coefficient of thermal expansion of concrete", "1/°C", float(m.group(1)),
                   "uniform temperature and gradient", "temperature (Loads -> Temperature)", [f"src/sub3.js:{line}", "src/sub7.js:10"]))
    return e


def bearings():
    line, m = find("src/sub.js", r"Ec=([\d.]+)\*S\.eG\*Sf\*Sf, Eeff=1/\(1/Ec\+1/([\d.]+)\)")
    e = [entry("AS5100.4:elastomer:compression_modulus_factor", "AS 5100.4", None,
               "laminated elastomeric bearing: compression modulus Ec = c * G * S^2 (S = shape factor of one internal layer); value = c", "-",
               float(m.group(1)), "rectangular laminated elastomeric bearings; vertical stiffness Kv = Eeff * A / T",
               "bearing vertical stiffness (Boundary tab; P3 model builder)", [f"src/sub.js:{line}", "pdf2bim/model/bearings.py"],
               interp="Form and coefficient as coded; not checked against an authorised copy of AS 5100.4 (the Standard's own compression-stiffness method may differ). Edition not recorded.",
               specialist=True),
         entry("AS5100.4:elastomer:bulk_modulus", "AS 5100.4", None, "bulk modulus of the elastomer, combined in series with Ec: 1/Eeff = 1/Ec + 1/Eb", "MPa",
               float(m.group(2)), "laminated elastomeric bearings", "bearing vertical stiffness", [f"src/sub.js:{line}", "pdf2bim/model/bearings.py"],
               interp="Value as coded; not checked against AS 5100.4 or supplier data.", specialist=True)]
    return e


def traffic():
    path = "base/BR13A_grillage_dashboard_v15.html"
    line, m = find(path, r"laneW:\{v:([\d.]+),u:'m',t:'Standard',src:'([^']*)'\}")
    e = [entry("AS5100.2:traffic:lane_width", "AS 5100.2", "Section 7", "standard design lane width", "m", float(m.group(1)),
               "road traffic lanes; number of lanes = floor(carriageway width / lane width) as coded (trNcode)", "traffic (Traffic tab; P3c traffic engine)",
               [f"{path}:{line}", "pdf2bim/model/traffic.py"],
               interp="Value and the lane-count rule as coded; not checked against an authorised copy. Edition not recorded.", specialist=True)]
    for mn, cl in (("M1600", "Cl 7.2.4"), ("S1600", "Cl 7.2.5")):
        line, m = find(path, mn + r":\{wheel:([\d.]+),track:([\d.]+),axle:([\d.]+),g12:([\d.]+),g23:([\d.]+),g34:([\d.]+),udl:([\d.]+),dla:([\d.]+),wW:([\d.]+),cl:'([^']*)'\}")
        v = dict(zip(("wheel_kN", "track_m", "axle_spacing_m", "gap_12_m", "gap_23_min_m", "gap_34_m", "udl_kN_per_m", "dla", "wheel_width_m"), (float(x) for x in m.groups()[:9])))
        e.append(entry(f"AS5100.2:traffic:{mn}", "AS 5100.2", m.group(10).split(",")[0].strip() or cl,
                       f"{mn} load model: wheel load, wheel-line track, axle spacing in a tri-axle group, clear gaps between the four groups (middle gap variable, minimum), lane UDL, dynamic load allowance on the wheels, wheel width",
                       "kN, m, -", v, f"{mn} road traffic; four tri-axle groups, UDL over the {float(find(path, r'laneW:\{v:([\d.]+)')[1].group(1))} m lane width",
                       "traffic (Traffic tab; P3c traffic engine)", [f"{path}:{line}", "pdf2bim/model/traffic.py"],
                       interp="Geometry, loads and DLA as coded; the figure itself was not checked against an authorised copy. Edition not recorded.", specialist=True))
        e[-1]["reference"]["figure"] = m.group(10).split(",")[1].strip() if "," in m.group(10) else None
    line, m = find(path, r"function trLF\(\)\{ var s=\(\$\('cb_lf'\)&&\$\('cb_lf'\)\.value\)\|\|'([\d., ]+)'")
    e.append(entry("AS5100.2:traffic:accompanying_lane_factors", "AS 5100.2", None,
                   "accompanying lane factors applied to the lane effects ranked from largest (lane 1, 2, 3 and more)", "-",
                   [float(x) for x in m.group(1).replace(",", " ").split()], "multi-lane road traffic (M1600, S1600)", "traffic envelope (Traffic tab; P3c traffic engine)",
                   [f"{path}:{line}", "pdf2bim/model/traffic.py"], interp="Default as coded (editable in the dashboard); clause and edition not recorded.", specialist=True))
    return e


def combinations():
    """Constants of the AS 5100.2 combination generator (Combos tab genAll) other than the per-action load factors."""
    path = "base/BR13A_grillage_dashboard_v15.html"
    e = []
    line, m = find(path, r"const A1=\{([^}]*)\},A2=\{([^}]*)\};")
    pf = lambda t: {k: float(v) for k, v in (x.split(":") for x in t.split(","))}
    e.append(entry("AS5100.2:combination:min_strength_stability", "AS 5100.2", "Cl 23.2",
                   "permanent-action factors of the minimum strength and stability combination: adverse set (max) and relieving set (min) per action id", "-",
                   {"max": pf(m.group(1)), "min": pf(m.group(2))}, "combination (a); only the actions listed take part (others are not in the combination)",
                   "combination generator (Combos tab genAll; pdf2bim/model/combinations.py)", [f"{path}:{line}", "pdf2bim/model/combinations.py"]))
    line, m = find(path, r"push\('ULS','t','','.',\[\['DLc',([\d.]+)\],\['PS',1\]\]\);push\('ULS','t','','.',\[\['DLc',([\d.]+)\],\['PS',1\]\]\)")
    e.append(entry("AS5100.2:combination:transfer", "AS 5100.2", "Cl 19.2", "dead-load factors (max, min) at transfer of prestress, with prestress secondary effects x 1", "-",
                   {"DLc": [float(m.group(1)), float(m.group(2))], "PS": 1.0}, "only when DLc and PS are both in the register", "combination generator (transfer rows)",
                   [f"{path}:{line}", "pdf2bim/model/combinations.py"]))
    line, m = find(path, r"ped=on\('PED'\)&&o\.pw\?\[st\(\[\['PED',([\d.]+)\]\]\)\]")
    e.append(entry("AS5100.2:combination:pedestrian_with_road_traffic", "AS 5100.2", "Cl 23.3 (b)", "pedestrian load factor in the ULS road-traffic combination (when pedestrians are taken with traffic)", "-",
                   float(m.group(1)), "ULS (b) road traffic; the dashboard option 'pedestrians with traffic' (pw)", "combination generator", [f"{path}:{line}", "pdf2bim/model/combinations.py"]))
    l1, m1 = find(path, r'id="cb_k1" value="([\d.]+)"'); l2, m2 = find(path, r'id="cb_k2" value="([\d.]+)"')
    e.append(entry("AS5100.2:combination:sls_companion", "AS 5100.2", "Cl 23.4", "SLS companion factors on the other transient actions: one other action (k1), two or more (k2)", "-",
                   {"k1": float(m1.group(1)), "k2": float(m2.group(1))}, "SLS: one lead transient action group with every subset of the others", "combination generator (SLS rows)",
                   [f"{path}:{l1}", f"{path}:{l2}", "pdf2bim/model/combinations.py"], interp="Defaults as coded (editable in the dashboard). Edition not recorded; not checked against an authorised copy.", specialist=True))
    line, m = find(path, r'id="cb_rf" value="([\d.]+)"')
    e.append(entry("AS5100.2:combination:rail_with_wind", "AS 5100.2", "Table D3 Note 8 (as labelled in the code)", "rail traffic factor in combination with wind", "-",
                   float(m.group(1)), "rail traffic with wind (ULS (j), SLS lead wind)", "combination generator", [f"{path}:{line}", "pdf2bim/model/combinations.py"],
                   interp="Default as coded; the reference is the code's label. Not used for road-only bridges. Not checked against an authorised copy."))
    line, m = find(path, r"o\.push\(st\(\[\[a,s1\],\[b,([\d.]+)\*s2\]\]\)\)")
    e.append(entry("AS5100.2:combination:earthquake_orthogonal", "AS 5100.2", "Section 15 (as coded)", "companion factor on the orthogonal earthquake direction in the ULS earthquake combination (EQX +/- f EQY, EQY +/- f EQX)", "-",
                   float(m.group(1)), "ULS (h) when both horizontal earthquake directions are in the register", "combination generator (eqStates)",
                   [f"{path}:{line}", "pdf2bim/model/combinations.py"], specialist=True,
                   interp="As coded: the EQX / EQY primitives are the single-direction RSA responses (sign either way), so this factor makes the 100 / 30 orthogonal combination. Not checked against an authorised copy."))
    return e


# project inputs found next to the standards values: NOT standards data (they belong in the bridge description)
PROJECT_DEFAULTS = [
    ("src/sub4.js", "WD.V = 45 m/s", "design wind speed — site-specific (region, terrain, return period)"),
    ("src/sub5.js", "EQ.Z = 0.08, site 'Ce'", "hazard factor and site class — site-specific"),
    ("src/sub3.js", "TM.Tmax / Tmin / Tset", "shade air temperatures and set temperature — site-specific"),
    ("src/sub7.js", "TG.T0 = 32, eps = 300e-6", "gradient top temperature and shrinkage/creep strain — project / material inputs"),
    ("src/sub.js", "S.brg internal layer thickness about 12 mm (n = round(T/12))", "bearing layer thickness — bearing schedule / supplier (BR13A: bearings.items[*].layer_thickness, D-40)"),
]


def main():
    groups = {"AS5100.2": load_factors() + [x for x in environment() if x["standard"] == "AS 5100.2"] + traffic() + combinations(),
              "AS1170.4": earthquake(),
              "AS5100.5": design() + [x for x in environment() if x["standard"] == "AS 5100.5"],
              "AS1170.2": [x for x in environment() if x["standard"] == "AS/NZS 1170.2"],
              "AS5100.4": bearings()}
    os.makedirs(OUT, exist_ok=True)
    keep = ("status", "review", "edition", "amendment", "interpretation")
    report = []
    for name, entries in groups.items():
        f = os.path.join(OUT, f"{name}.json")
        old = {x["id"]: x for x in json.load(open(f))["entries"]} if os.path.exists(f) else {}
        for x in entries:
            o = old.get(x["id"])
            if o:
                if json.dumps(o["value"], sort_keys=True) == json.dumps(x["value"], sort_keys=True):
                    for k in keep:
                        x[k] = o[k]
                    x["reference"]["authorised_source"] = o["reference"].get("authorised_source")
                else:
                    report.append(f"{x['id']}: value changed in code ({o['value']} -> {x['value']}); status reset to code-extracted-unverified")
        json.dump({"format": "pdf2bim.standards/0.1", "group": name,
                   "note": "Inventory of values hard-coded in the software. NOT verified. See docs/STANDARDS_DATA_SPEC.md.",
                   "entries": sorted(entries, key=lambda e: e["id"])}, open(f, "w"), indent=1, ensure_ascii=False)
    json.dump({"note": "Project-specific inputs found in code next to standards values. They are NOT standards data and belong in the bridge description.",
               "items": [{"file": a, "item": b, "why": c} for a, b, c in PROJECT_DEFAULTS]}, open(os.path.join(OUT, "_project_defaults_not_standards.json"), "w"), indent=1)
    n = sum(len(v) for v in groups.values())
    print(f"standards/data: {n} entries in {len(groups)} files, all code-extracted-unverified unless previously reviewed")
    for r in report:
        print("NOTE", r)


if __name__ == "__main__":
    main()
