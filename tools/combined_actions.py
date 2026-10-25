#!/usr/bin/env python3
"""Combined-action schedule (AS 5100.2 ULS / SLS envelopes) of a bridge description on the integrated model (P3c).

    python3 tools/combined_actions.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed --out projects/BR13A/model/BR13A.combined_actions.md

Writes the schedule (.md) and the full data (.json): bearings (v, tr, lon), piles (|Ml|, |Mt|, N), girders (sagging /
hogging M, |V|, |T| with chainage) and sills (My, Mz, |Vz|, |Vy|, |T| with the position along the sill), each with the
governing combination row. Values only — no capacity check; factors and constants are unverified standards data;
load-case inputs carry their own tags (Assumed / Standard-verify / Model)."""
import argparse, datetime, hashlib, json, math, os, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--allow-proposed", action="store_true"); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from pdf2bim.model.combinations import combined_actions, schedule, concurrent_schedule
    from standards.accessor import Standards
    std = Standards()
    raw = open(a.description, "rb").read()
    doc = json.loads(raw)
    geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    S = build_sections(doc, geo, allow_proposed=a.allow_proposed)
    M = build_integrated(doc, geo, S, std, allow_proposed=a.allow_proposed)
    CA = combined_actions(doc, geo, S, M, std, allow_proposed=a.allow_proposed)
    Z = schedule(CA)
    ZC = concurrent_schedule(CA, "ULS")
    try:
        commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        dirty = bool(subprocess.run(["git", "status", "--porcelain", "pdf2bim", "standards"], cwd=ROOT, capture_output=True, text=True).stdout.strip())
    except Exception:
        commit, dirty = None, None
    run = {"description": os.path.relpath(a.description, ROOT), "description_sha256": hashlib.sha256(raw).hexdigest(), "engine_commit": commit,
           "engine_uncommitted_changes": dirty, "allow_proposed": a.allow_proposed, "options": CA["options"], "on": CA["on"],
           "rows": {"ULS": sum(r["ls"] == "ULS" for r in CA["rows"]), "SLS": sum(r["ls"] == "SLS" for r in CA["rows"])},
           "standards_status": CA["standards_status"], "run_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")}
    f0 = lambda x: f"{x:.0f}"
    L = ["# Combined actions — AS 5100.2 ULS / SLS envelopes (P3c)", "",
         "**INDICATIVE. Not design-approved.** Load factors and combination constants: code-extracted-UNVERIFIED standards entries. "
         f"Load-case inputs: Assumed / Standard-verify / Model values of the description; model {'PROVISIONAL (proposed decisions used)' if a.allow_proposed else 'from accepted values'}. "
         "Values only: no capacity check. Units kN, kN·m, m.", "",
         f"Run: `{run['description']}` sha256 {run['description_sha256'][:16]}…, engine `{commit}`{' (+ uncommitted changes)' if dirty else ''}, "
         f"{run['rows']['ULS']} ULS + {run['rows']['SLS']} SLS rows; actions {', '.join(CA['on'])}.", "",
         "Not combined (no analysed case): " + ("; ".join(f"{k} — {w}" for k, w in CA["not_combined"]) or "none") + ".", "",
         f"Provisional inputs used: {len(CA['provisional'])} (listed in the .json). Governing row names refer to the rows in the .json.", "",
         "## Bearings (link axes: v vertical, compression +; tr transverse; lon longitudinal)", "",
         "| Bearing | ULS v max | ULS v min | SLS v max | SLS v min | ULS |tr| | ULS |lon| | Governing (ULS v max / min) |", "|---|---|---|---|---|---|---|---|"]
    for b in sorted(Z["bearings"]):
        d, s_ = Z["bearings"][b]["ULS"], Z["bearings"][b]["SLS"]
        tr = max(abs(d["tr"]["max"]), abs(d["tr"]["min"])); lo = max(abs(d["lon"]["max"]), abs(d["lon"]["min"]))
        flag = " **uplift**" if b in Z["uplift"] else ""
        L.append(f"| {b}{flag} | {f0(d['v']['max'])} | {f0(d['v']['min'])} | {f0(s_['v']['max'])} | {f0(s_['v']['min'])} | {f0(tr)} | {f0(lo)} | {d['v']['gmax']} / {d['v']['gmin']} |")
    L += ["", "## Piles (ULS; largest over the pile's element ends)", "",
          "| Pile | |Ml| (about sill axis) | gov | |Mt| (about its normal) | gov | N max (compr.) | N min | gov (N max / min) |", "|---|---|---|---|---|---|---|---|---|"]
    for p in sorted(Z["piles"]):
        d = Z["piles"][p]["ULS"]
        L.append(f"| {p} | {f0(d['Ml']['abs'])} | {d['Ml']['gov']} | {f0(d['Mt']['abs'])} | {d['Mt']['gov']} | {f0(d['N']['max'])} | {f0(d['N']['min'])} | {d['N']['gmax']} / {d['N']['gmin']} |")
    L += ["", "## Girders (section actions; M sagging +)", "",
          "| Girder | ULS M sag | at ch | ULS M hog | at ch | ULS |V| | at ch | ULS |T| | SLS M sag | gov (ULS M sag) |", "|---|---|---|---|---|---|---|---|---|---|"]
    for g in sorted(Z["girders"]):
        d, s_ = Z["girders"][g]["ULS"], Z["girders"][g]["SLS"]
        L.append(f"| {g} | {f0(d['M_sag']['value'])} | {d['M_sag']['ch']:.2f} | {f0(d['M_hog']['value'])} | {d['M_hog']['ch']:.2f} | {f0(d['V']['abs'])} | {d['V']['ch']:.2f} | {f0(d['T']['abs'])} | {f0(s_['M_sag']['value'])} | {d['M_sag']['gov']} |")
    L += ["", "## Sills / headstocks (member axes; s = position along the sill from its first node)", "",
          "| Support | ULS My max | s | ULS My min | s | ULS Mz max | ULS Mz min | ULS |Vz| | ULS |Vy| | ULS |T| |", "|---|---|---|---|---|---|---|---|---|---|"]
    for sid in sorted(Z["sills"]):
        d = Z["sills"][sid]["ULS"]
        L.append(f"| {sid} | {f0(d['My_max']['value'])} | {d['My_max']['s']:.2f} | {f0(d['My_min']['value'])} | {d['My_min']['s']:.2f} | {f0(d['Mz_max']['value'])} | {f0(d['Mz_min']['value'])} | {f0(d['Vz']['abs'])} | {f0(d['Vy']['abs'])} | {f0(d['T']['abs'])} |")
    fl = lambda d: " ⚠ EQ envelope" if d["flags"] else ""
    L += ["", "## Concurrent actions at the governing ULS extremes (P4.2)", "",
          "Each value: the governing combination row with every envelope term replaced by the one state that gives its value (traffic: the rebuilt vehicle / lane state; vertical wind, surcharge: the governing case). "
          "**⚠ EQ envelope:** the row contains an earthquake term, which is still the unsigned RSA envelope of each response (not a concurrent state) until P4.3 — those concurrent values are not physical.", "",
          "### Girders", "", "| Girder | M sag | V | T | row | M hog | V | T | row |", "|---|---|---|---|---|---|---|---|---|"]
    for g, d in sorted(ZC["girders"].items()):
        a_, b_ = d["M_sag"], d["M_hog"]
        L.append(f"| {g} | {f0(a_['value'])} | {f0(a_['V'])} | {f0(a_['T'])} | {a_['row']}{fl(a_)} | {f0(b_['value'])} | {f0(b_['V'])} | {f0(b_['T'])} | {b_['row']}{fl(b_)} |")
    L += ["", "### Bearings", "", "| Bearing | v max | tr | lon | row | v min | tr | lon | row |", "|---|---|---|---|---|---|---|---|---|"]
    for bb, d in sorted(ZC["bearings"].items()):
        a_, b_ = d["max"], d["min"]
        L.append(f"| {bb} | {f0(a_['value'])} | {f0(a_['tr'])} | {f0(a_['lon'])} | {a_['row']}{fl(a_)} | {f0(b_['value'])} | {f0(b_['tr'])} | {f0(b_['lon'])} | {b_['row']}{fl(b_)} |")
    L += ["", "### Piles", "", "| Pile | extreme | Ml | Mt | N | resultant | √ envelope bound | row |", "|---|---|---|---|---|---|---|---|"]
    for pid, d in sorted(ZC["piles"].items()):
        for k in ("max |Ml|", "max |Mt|"):
            x = d[k]
            L.append(f"| {pid} | {k} | {f0(x['Ml'])} | {f0(x['Mt'])} | {f0(x['N'])} | {f0(x['resultant'])} | {f0(d['bound'])} | {x['row']}{fl(x)} |")
        x = d["N max"]
        L.append(f"| {pid} | N max | {f0(x['Ml'])} | {f0(x['Mt'])} | {f0(x['value'])} | {f0(math.hypot(x['Ml'], x['Mt']))} | {f0(d['bound'])} | {x['row']}{fl(x)} |")
    L += ["", "### Sills", "", "| Support | My max | Vz | Mz | T | row | My min | Vz | Mz | T | row |", "|---|---|---|---|---|---|---|---|---|---|---|"]
    for sid, d in sorted(ZC["sills"].items()):
        a_, b_ = d["My_max"], d["My_min"]
        L.append(f"| {sid} | {f0(a_['value'])} | {f0(a_['Vz'])} | {f0(a_['Mz'])} | {f0(a_['T'])} | {a_['row']}{fl(a_)} | {f0(b_['value'])} | {f0(b_['Vz'])} | {f0(b_['Mz'])} | {f0(b_['T'])} | {b_['row']}{fl(b_)} |")
    if Z["uplift"]:
        L += ["", f"**Bearing uplift in a combined minimum:** {', '.join(Z['uplift'])} (finding M-4: reported, not resolved)."]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w").write("\n".join(L) + "\n")
    rows_used = sorted({v for blk in Z.values() if isinstance(blk, dict) for e in blk.values() for ls in e.values() for q in ls.values()
                        for k_, v in q.items() if k_ in ("gov", "gmax", "gmin") and v})
    json.dump({"run": run, "schedule": Z, "concurrent": ZC, "governing_rows": [r for r in CA["rows"] if r["name"] in set(rows_used)], "not_combined": CA["not_combined"],
               "provisional": CA["provisional"], "sources": CA["sources"], "standards_used": CA["standards_used"]},
              open(a.out.replace(".md", ".json"), "w"), indent=1, default=lambda x: x.tolist() if hasattr(x, "tolist") else str(x))
    print("\n".join(L))


if __name__ == "__main__":
    main()
