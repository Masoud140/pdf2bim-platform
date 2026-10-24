"""Canonical JSON (pdf2bim-c14n/1) and content hash for bridge descriptions.

pdf2bim-c14n/1 follows RFC 8785 (JSON Canonicalization Scheme):
- object members sorted by the UTF-16 code units of their keys; arrays keep their order;
- no insignificant whitespace;
- numbers in the ECMAScript shortest round-trip form (Number.prototype.toString):
  integers without a decimal point, exponent form only for magnitude >= 1e21 or < 1e-6;
- strings with minimal escaping (\\" \\\\ \\b \\f \\n \\r \\t, other control characters \\u00xx), UTF-8 output.
NaN and Infinity are rejected.

The hash covers the whole document with the top-level "hash" member removed.
It identifies content and detects change. It is NOT evidence that the data are correct or approved,
and it is not a signature (anyone can recompute it).
"""
import hashlib, json, math

ALGORITHM = "sha256"
CANON = "pdf2bim-c14n/1"
COVERS = "document-without-hash"


def _num(x):
    if isinstance(x, bool):
        raise TypeError("bool is not a number")
    if isinstance(x, int):
        return str(x)
    if not math.isfinite(x):
        raise ValueError("NaN / Infinity are not allowed in canonical JSON")
    if x == 0:
        return "0"
    # shortest round-trip digits and exponent, then ECMAScript layout
    s = repr(abs(x))
    if "e" in s or "E" in s:
        mant, exp = s.lower().split("e")
        exp = int(exp)
    else:
        mant, exp = s, 0
    if "." in mant:
        ip, fp = mant.split(".")
    else:
        ip, fp = mant, ""
    digits = (ip + fp).lstrip("0")
    # n = position of the decimal point relative to the first significant digit
    lead_zeros = len(ip + fp) - len((ip + fp).lstrip("0"))
    n = len(ip) - lead_zeros + exp
    digits = digits.rstrip("0") or "0"
    k = len(digits)
    sign = "-" if x < 0 else ""
    if k <= n <= 21:
        out = digits + "0" * (n - k)
    elif 0 < n <= 21:
        out = digits[:n] + "." + digits[n:]
    elif -6 < n <= 0:
        out = "0." + "0" * (-n) + digits
    else:
        e = n - 1
        es = ("+" if e >= 0 else "-") + str(abs(e))
        out = digits[0] + ("." + digits[1:] if k > 1 else "") + "e" + es
    return sign + out


def _str(s):
    return json.dumps(s, ensure_ascii=False)


def canonical(o):
    """Canonical JSON text of o."""
    if o is None:
        return "null"
    if o is True:
        return "true"
    if o is False:
        return "false"
    if isinstance(o, (int, float)):
        return _num(o)
    if isinstance(o, str):
        return _str(o)
    if isinstance(o, (list, tuple)):
        return "[" + ",".join(canonical(v) for v in o) + "]"
    if isinstance(o, dict):
        keys = sorted(o.keys(), key=lambda k: k.encode("utf-16-be"))
        return "{" + ",".join(_str(k) + ":" + canonical(o[k]) for k in keys) + "}"
    raise TypeError(f"not JSON: {type(o).__name__}")


def content_hash(doc):
    """'sha256:<hex>' of the canonical document without its top-level 'hash' member."""
    body = {k: v for k, v in doc.items() if k != "hash"}
    return "sha256:" + hashlib.sha256(canonical(body).encode("utf-8")).hexdigest()


def stamp(doc):
    """Set doc['hash'] (algorithm, coverage, canonicalisation, value). Returns the hash value."""
    h = content_hash(doc)
    doc["hash"] = {"algorithm": ALGORITHM, "covers": COVERS, "canonicalisation": CANON, "value": h}
    return h


def file_sha256(path):
    return "sha256:" + hashlib.sha256(open(path, "rb").read()).hexdigest()
