"""Ask Claude to read ONE drawing page against the field catalogue. Claude only proposes; verify.py decides.

The API key comes from the caller (environment ANTHROPIC_API_KEY or the app's local settings), never from the repo."""
import base64, json, re, urllib.request

from .catalogue import lines

API = "https://api.anthropic.com/v1/messages"
DEFAULT_MODEL = "claude-opus-5-5"

RULES = """You read ONE page of a bridge drawing set (or design report) and report the values printed on it that fill
fields of the bridge description catalogue below.

Rules — the engineer's absolute rule is that every value comes from the drawings; nothing is assumed:
1. Report only values PRINTED on this page. Never give typical, assumed, standard or remembered values. If a field is
   not on this page, leave it out. An empty "values" list is a correct answer.
2. For every value give "quote": the exact characters on the page that state it, copied from the page text provided
   (same spelling, numbers and units). Keep it short (the label and the number).
3. tag "Direct" = the value is printed. tag "Calculated" = simple arithmetic on numbers printed on this page (e.g. a
   width as the sum of printed dimensions, mm to m); then also give "expression": the arithmetic with the printed
   numbers only (e.g. "779 + 571"), and "quotes": the printed numbers' quotes.
4. Use the catalogue unit. A printed 1050 (mm) for a field in m is Calculated with expression "1050 / 1000".
5. List items need an id: use the id printed on the drawing (girder G02-01, pile A-01, bearing A02-01, support A/B).
   Table rows: give "cells" (column -> value) instead of "value", one object per printed row.
6. Fields the catalogue does not have: use "custom.<snake_name>" only for project data an engineer would need (loads,
   design criteria), as Direct with a quote.
7. Say where on the page: "view" (e.g. "section 1", "table 2", "title block").

Answer with JSON only, no prose:
{"document": {"number": "...", "revision": "...", "title": "..."},
 "values": [{"path": "...", "value": ..., "unit": "...", "tag": "Direct", "quote": "...", "view": "..."},
            {"path": "...", "cells": {...}, "tag": "Direct", "quote": "...", "view": "..."},
            {"path": "...", "value": ..., "unit": "...", "tag": "Calculated", "expression": "...", "quotes": ["...", "..."], "view": "..."}]}

Catalogue (path | type | unit | meaning):
"""


def system_prompt():
    return RULES + "\n".join(lines())


def http_call(body, key, timeout=300):
    req = urllib.request.Request(API, data=json.dumps(body).encode(), method="POST", headers={
        "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def read_page(png, text, key, model=DEFAULT_MODEL, call=None, max_tokens=16000):
    """-> (parsed JSON or None, raw text, usage). `call` is injectable for tests."""
    body = {"model": model, "max_tokens": max_tokens,
            "system": [{"type": "text", "text": system_prompt(), "cache_control": {"type": "ephemeral"}}],
            "messages": [{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": base64.b64encode(png).decode()}},
                {"type": "text", "text": "Page text layer (copy quotes from here):\n" + (text[:60000] or "(no text layer: scanned page)")}]}]}
    r = (call or http_call)(body, key)
    raw = "".join(b.get("text", "") for b in r.get("content", []) if b.get("type") == "text")
    m = re.search(r"\{.*\}", raw, re.S)
    try:
        return (json.loads(m.group(0)) if m else None), raw, r.get("usage", {})
    except json.JSONDecodeError:
        return None, raw, r.get("usage", {})
