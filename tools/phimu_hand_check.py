#!/usr/bin/env python3
"""Independent hand check of a Super-T girder's mid-span flexural strength (no platform section engine).

    python3 tools/phimu_hand_check.py DESCRIPTION [--width B_m] [--haunch mm ...]

AS 5100.5:2017 approximate method: rectangular stress block in the deck slab, tendon stress at ultimate by Cl 8.1.8
(sigma_pu = fpb (1 - k1 k2 / gamma), k1 = 0.4, k2 = Apt fpb / (b dp f'c)), phi = 1.19 - 13 kuo / 12 within 0.6 .. 0.8
(Table 2.3.2). Every input is read from the description (strand pattern, girder depth, slab, deck f'c, strand area and
fpb); the effective flange width and haunch are arguments. Bonded strands below mid-depth only (top strands ignored:
they sit near the compression zone). Coefficients are the platform's transcription of AS 5100.5 (UNVERIFIED)."""
import argparse, json


def val(rec):
    return rec["value"] if "value" in rec else rec


def check(desc, width, haunch):
    d = json.load(open(desc))
    T = d["superstructure"]["supert_types"][0]
    D = float(val(T["depth"]))
    st = [r["cells"] for r in T["strand_pattern"]["rows"] if r["cells"].get("on", True) and r["cells"]["y"] < D / 2]
    s = d["materials"]["strand"]["rows"][0]["cells"]
    Ap, fpb = float(s["area"]), float(s["fpb"])
    deck = next(r["cells"] for r in d["materials"]["concrete"]["rows"] if r["cells"]["element"] == "deck")
    fc = float(deck["fc"])
    t = float(val(d["deck"]["slab_thickness"]))
    n = len(st)
    yc = sum(c["y"] for c in st) / n                              # strand centroid above the soffit, mm
    Apt = n * Ap
    a2, g = max(0.67, min(0.85, 0.85 - 0.0015 * fc)), max(0.67, min(0.85, 0.97 - 0.0025 * fc))
    out = []
    for h in haunch:
        dp = D + h + t - yc
        b = width * 1000
        k2 = Apt * fpb / (b * dp * fc)
        spu = fpb * (1 - 0.4 * k2 / g)
        Tn = Apt * spu
        dn = Tn / (a2 * fc * b * g)                               # neutral axis depth (block a = g dn)
        Mu = Tn * (dp - g * dn / 2) / 1e6
        kuo = dn / dp
        phi = max(0.6, min(0.8, 1.19 - 13 * kuo / 12))
        out.append({"haunch": h, "n": n, "Apt": Apt, "dp": dp, "sigma_pu": spu, "dn": dn, "block_in_slab": g * dn <= t, "kuo": kuo, "Mu": Mu, "phi": phi, "phiMu": phi * Mu})
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("description")
    ap.add_argument("--width", type=float, default=2.0, help="effective deck width, m")
    ap.add_argument("--haunch", type=float, nargs="+", default=[0.0])
    a = ap.parse_args()
    for r in check(a.description, a.width, a.haunch):
        print(f"haunch {r['haunch']:4.0f} mm: {r['n']} bonded bottom strands, Apt {r['Apt']:.0f} mm2, dp {r['dp']:.0f}, sigma_pu {r['sigma_pu']:.0f} MPa, "
              f"block {'in' if r['block_in_slab'] else 'BELOW'} the slab, kuo {r['kuo']:.3f}, Mu {r['Mu']:,.0f} kNm, phi {r['phi']:.2f}, phi Mu {r['phiMu']:,.0f} kNm")
