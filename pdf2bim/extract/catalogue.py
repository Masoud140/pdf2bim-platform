"""The description field catalogue (schema/fields.py) as prompt text and as a path -> spec lookup."""
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "schema"))
from fields import SECTIONS  # noqa: E402


def lines():
    """One line per field: path | type | unit | description; list items as [<id>], table columns listed."""
    out = []

    def walk(spec, p):
        for k, v in spec.items():
            if isinstance(v, dict):
                walk(v, f"{p}{k}.")
                continue
            t = v[0]
            if t == "list":
                walk(v[1], f"{p}{k}[<id>].")
                continue
            desc = v[2] if len(v) > 2 and isinstance(v[2], str) else ""
            if t == "table":
                cols = ", ".join(f"{c}{' (' + cs[1] + ')' if cs[1] else ''}" for c, cs in v[3].items())
                out.append(f"{p}{k}.rows[] | table | columns: {cols} | {desc}")
            else:
                opts = f" one of {v[3]}" if t == "enum" and len(v) > 3 and isinstance(v[3], list) else ""
                out.append(f"{p}{k} | {t}{opts} | {v[1] or '-'} | {desc}")

    walk(SECTIONS, "")
    return out


SEG = re.compile(r"([^.\[\]]+)(?:\[([^\]]*)\])?")


def spec_of(path):
    """Catalogue spec of a path (list ids and row indices ignored), or None if the catalogue has no such field.
    custom.<name> is accepted (project items with no field) and returns ('any', '')."""
    if path.startswith("custom.") and len(path) > 7:
        return ("any", "")
    sp = SECTIONS
    parts = [m.groups() for m in SEG.finditer(path)]
    for i, (name, _) in enumerate(parts):
        if name == "rows" and isinstance(sp, tuple) and sp[0] == "table":
            return sp if i == len(parts) - 1 else None
        if not isinstance(sp, dict) or name not in sp:
            return None
        sp = sp[name]
        if isinstance(sp, tuple) and sp[0] == "list":
            sp = sp[1]
    return sp if isinstance(sp, tuple) else None
