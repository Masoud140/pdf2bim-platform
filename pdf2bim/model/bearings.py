"""Laminated elastomeric bearing stiffness (stage P3b). kN, m.

    from pdf2bim.model.bearings import elastomer_stiffness
    k = elastomer_stiffness(item, rd, std)   # item = bearings.items[*] record, rd = description Reader, std = Standards

Method (as the dashboard, src/sub.js S.brg; NOT verified against AS 5100.4):
    A  = a * b                                (plan area of the elastomer)
    S  = A / (2 (a + b) t)                    (shape factor of one internal layer, t = layer_thickness)
    Ec = c * G * S^2                          (c: standards entry AS5100.4:elastomer:compression_modulus_factor)
    1/Eeff = 1/Ec + 1/Eb                      (Eb: standards entry AS5100.4:elastomer:bulk_modulus)
    Ks = G A / T,  Kv = Eeff A / T            (T = total elastomer thickness)
The two coefficients come from standards/data (status code-extracted-unverified), so every result carries the
UNVERIFIED label from the accessor. The bearing inputs themselves are BR13A placeholders (Assumed) until the bearing
schedule is available; their tags are returned so the caller can list them.
"""
from ..description import MissingInput

FIELDS = ("plan_a", "plan_b", "elastomer_thickness", "layer_thickness", "shear_modulus")


def elastomer_stiffness(item, rd, std):
    bid = item.get("id")
    v, tags = {}, {}
    for f in FIELDS:
        rec = item.get(f)
        v[f] = rd.value(rec, f"bearings.items[{bid}].{f}")
        tags[f] = (rec or {}).get("tag")
    a, b, T, t, G = v["plan_a"], v["plan_b"], v["elastomer_thickness"], v["layer_thickness"], v["shear_modulus"]
    if min(a, b, T, t, G) <= 0:
        raise MissingInput(f"bearings.items[{bid}]: non-positive elastomer input {v}")
    if t > T + 1e-9:
        raise MissingInput(f"bearings.items[{bid}]: layer thickness {t} mm exceeds the total {T} mm")
    c = std.get("AS5100.4:elastomer:compression_modulus_factor")
    Eb = std.get("AS5100.4:elastomer:bulk_modulus")
    A = a * b                                    # mm2
    S = A / (2 * (a + b) * t)
    Ec = c.value * G * S * S                     # MPa
    Eeff = 1 / (1 / Ec + 1 / Eb.value)
    Ks = G * A / T                               # N/mm = kN/m
    Kv = Eeff * A / T
    return {"Ks": Ks, "Kv": Kv, "A_mm2": A, "S": S, "Ec_MPa": Ec, "Eeff_MPa": Eeff, "inputs": v, "tags": tags,
            "standards": [(c.id, c.status), (Eb.id, Eb.status)], "status": std.result_status()}
