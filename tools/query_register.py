#!/usr/bin/env python3
"""Query Register of a bridge description (P5.2): Markdown, JSON and a standalone HTML page next to the description.

    python3 tools/query_register.py projects/BR13A/BR13A.bridge.0.2.json      # writes projects/BR13A/QUERY_REGISTER.{md,json,html}
"""
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def main():
    from pdf2bim.register import build, to_markdown, to_html
    from pdf2bim.runrecord import decision_log, make
    f = sys.argv[1]
    doc = json.load(open(f))
    Q = build(doc, decision_log(f))
    base = os.path.join(os.path.dirname(os.path.abspath(f)), "QUERY_REGISTER")
    title = f"{os.path.basename(f)} revision {doc['revision']['number']}"
    open(base + ".md", "w").write(to_markdown(Q, title))
    open(base + ".html", "w").write(to_html(Q, title))
    json.dump(dict(Q, run_record=make(f, doc, "query_register", layers=["extraction"])), open(base + ".json", "w"), indent=1, ensure_ascii=False, default=str)
    print(f"{base}.md / .json / .html: " + ", ".join(f"{k} {n}" for k, n in Q["counts"].items()))


if __name__ == "__main__":
    main()
