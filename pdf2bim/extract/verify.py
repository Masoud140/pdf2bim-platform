"""Deterministic checks on what Claude proposed for one page. Claude's answer is never trusted on its own:

- the path must be a catalogue field (or custom.<name>);
- Direct: the quote must be on the page (text layer) and the number must be in the quote;
- Calculated: the expression is re-evaluated here from numbers that are in quotes on the page;
- a word value not literally in the quote (an enum or yes/no read from a drawing) becomes tag Model with the quote as note;
- a scanned page (no text layer) cannot be checked: its values are rejected (listed for the engineer).

Returns (accepted values in the new_description input format, rejected [(item, reason)])."""
import ast, operator, re, unicodedata

from .catalogue import spec_of

NUM = re.compile(r"(?<![\w.])[-−]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|(?<![\w.])[-−]?\d+(?:\.\d+)?")


def norm(s):
    s = unicodedata.normalize("NFKC", str(s)).replace("−", "-").replace("–", "-").replace("—", "-")
    return re.sub(r"[\s.,:;'\"`′″°()]+", "", s).upper()   # layout and punctuation differ between text layers; numbers are checked separately


def numbers(s):
    out = []
    for m in NUM.finditer(unicodedata.normalize("NFKC", str(s))):
        try:
            out.append(float(m.group(0).replace(",", "").replace("−", "-")))
        except ValueError:
            pass
    return out


def same(a, b):
    return abs(a - b) <= max(1e-9, 1e-6 * max(abs(a), abs(b)))


OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv}


def evaluate(expr):
    """Arithmetic only: numbers, + - * /, brackets, unary minus. Anything else raises ValueError."""
    def ev(n):
        if isinstance(n, ast.Expression):
            return ev(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)) and not isinstance(n.value, bool):
            return float(n.value)
        if isinstance(n, ast.BinOp) and type(n.op) in OPS:
            return OPS[type(n.op)](ev(n.left), ev(n.right))
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.USub, ast.UAdd)):
            return -ev(n.operand) if isinstance(n.op, ast.USub) else ev(n.operand)
        raise ValueError(f"not plain arithmetic: {ast.dump(n)[:60]}")
    return ev(ast.parse(str(expr).replace("×", "*").replace("−", "-"), mode="eval"))


def check_page(proposed, page_text, doc_id, page_no):
    acc, rej = [], []
    P = norm(page_text)
    PN = sorted(set(numbers(page_text)))           # every number really printed on the page (decimal points kept)

    def printed(x):
        import bisect
        i = bisect.bisect_left(PN, x - max(1e-9, 1e-6 * abs(x)))
        return i < len(PN) and same(PN[i], x)
    if not P:
        return [], [(v, "scanned page: no text layer to check against") for v in proposed]

    def on_page(q):
        return bool(q) and norm(q) in P

    for v in proposed:
        if not isinstance(v, dict) or not isinstance(v.get("path"), str):
            rej.append((v, "not a value object")); continue
        path, tag = v["path"].strip(), v.get("tag")
        sp = spec_of(path)
        if sp is None:
            rej.append((v, "path is not a catalogue field")); continue
        src = {"doc": doc_id, "view": str(v.get("view") or f"page {page_no}")[:120]}
        base = {"path": path, "source": src}
        if v.get("unit") and sp[1] and sp[0] != "table" and v["unit"] != sp[1]:
            rej.append((v, f"unit {v['unit']!r}: the field is in {sp[1]!r}")); continue
        if sp[1] and sp[0] not in ("table", "any"):
            base["unit"] = sp[1]

        if sp[0] == "table":                               # a table row: every number in it must be printed in the quote(s)
            cells = v.get("cells")
            qs = [q for q in ([v.get("quote")] + list(v.get("quotes") or [])) if q]
            if not isinstance(cells, dict) or not cells or not qs or not all(on_page(q) for q in qs):
                rej.append((v, "table row without cells or with a quote not on the page")); continue
            nums = [x for q in qs for x in numbers(q)]
            bad = [c for c, x in cells.items() if isinstance(x, (int, float)) and not isinstance(x, bool) and not (any(same(x, y) for y in nums) and printed(x))]
            unknown = [c for c in cells if c not in sp[3]]
            if bad or unknown:
                rej.append((v, f"cells {bad or unknown} not printed in the quote / not table columns")); continue
            src["text"] = " | ".join(qs)[:400]
            acc.append(dict(base, tag="Direct", cells=cells)); continue

        val = v.get("value")
        if val is None:
            rej.append((v, "no value")); continue
        if tag == "Calculated":
            expr, qs = v.get("expression"), [q for q in (v.get("quotes") or [v.get("quote")]) if q]
            if not expr or not qs or not all(on_page(q) for q in qs):
                rej.append((v, "Calculated without an expression or with quotes not on the page")); continue
            try:
                r = evaluate(expr)
            except (ValueError, SyntaxError, ZeroDivisionError) as e:
                rej.append((v, f"expression not evaluable: {e}")); continue
            qnums = [x for q in qs for x in numbers(q)]
            used = numbers(expr)
            extra = [x for x in used if not (any(same(abs(x), abs(y)) for y in qnums) and (printed(x) or printed(-x))) and x not in (1000.0, 100.0, 2.0)]
            if extra:
                rej.append((v, f"expression uses numbers not printed in the quotes: {extra}")); continue
            if not isinstance(val, (int, float)) or abs(r - val) > max(1e-6, 5e-4 * abs(r)):
                rej.append((v, f"value {val} does not equal {expr} = {r:g}")); continue
            src["text"] = " | ".join(qs)[:400]
            acc.append(dict(base, tag="Calculated", value=val, derivation={"formula": f"{expr} = {r:g} (printed: {' | '.join(qs)[:200]})", "inputs": []}))
            continue

        q = v.get("quote")
        if not on_page(q):
            rej.append((v, "quote not found on the page")); continue
        src["text"] = str(q)[:400]
        if isinstance(val, (int, float)) and not isinstance(val, bool):
            if sp[0] not in ("num", "int", "any"):
                rej.append((v, f"a number for a {sp[0]} field")); continue
            if not (any(same(val, y) for y in numbers(q)) and printed(val)):
                rej.append((v, f"{val} is not printed in the quote")); continue
            if sp[0] == "int" and val != int(val):
                rej.append((v, "integer field")); continue
            acc.append(dict(base, tag="Direct", value=val)); continue
        if sp[0] in ("num", "int"):
            rej.append((v, "not a number")); continue
        if isinstance(val, str) and norm(val) in norm(q):
            acc.append(dict(base, tag="Direct", value=val)); continue
        src["note"] = f"read from the drawing (not a printed literal): {str(q)[:200]}"   # enum / yes-no / wording
        acc.append(dict(base, tag="Model", value=val))
    return acc, rej
