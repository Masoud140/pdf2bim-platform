#!/usr/bin/env python3
"""Run every existing test script and record what actually happened.

    python3 tools/run_suite.py [--out baseline/BR13A/test_run.md]

For each script: exit code, duration, JavaScript errors reported by the script, and the
last output lines. Most browser and engine scripts PRINT values next to targets and do not
assert; for those the outcome is 'ran' (completed without error) or 'error', never 'passed'.
Scripts that assert (schema, baseline) report PASS/FAIL themselves.
"""
import argparse, json, os, re, subprocess, sys, time, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
NODE = ["sub_t", "sl_t", "soil_t", "tm_t", "tg_t", "wd_t", "eq_t", "rx_t", "x_t", "gw_t", "dg36_t", "dgxl_t", "dgdoc_t"]
ENGINE = ["dsg_test", "dsg_t2", "dsg_t3", "dsg_t4", "dsg_t5"]
PY = [("schema", "tests/schema/test_schema.py"), ("format 0.2", "tests/schema/test_format_0_2.py"), ("standards data", "tests/standards/test_standards.py"), ("geometry P1", "tests/geometry/test_geometry.py"), ("baseline (fast)", "tests/baseline/test_baseline.py")]
NOISE = re.compile(r"agent-proxy|connect_rejected|Allowed domains|For details|^- \S+:443")


def run(cmd, timeout=1200):
    t0 = time.time()
    try:
        p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
        out, rc = p.stdout + p.stderr, p.returncode
    except subprocess.TimeoutExpired as e:
        out, rc = (e.stdout or b"").decode() if isinstance(e.stdout, bytes) else (e.stdout or ""), "timeout"
    out = "\n".join(l for l in out.splitlines() if not NOISE.search(l))
    return rc, time.time() - t0, out


ENV_ERR = re.compile(r"net::ERR_(TUNNEL_CONNECTION_FAILED|PROXY|NAME_NOT_RESOLVED|INTERNET_DISCONNECTED)")


def js_errors(out):
    """(real errors, environment errors). Environment = the sandbox blocking an external resource (e.g. a web font)."""
    m = re.findall(r"^errors (\[.*\])\s*$", out, re.M)
    if not m:
        return None, None
    try:
        e = json.loads(m[-1])
    except Exception:
        return "?", "?"
    env = [x for x in e if ENV_ERR.search(x)]
    return len(e) - len(env), len(env)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default="baseline/BR13A/test_run.md"); a = ap.parse_args()
    commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    rows, detail = [], []
    jobs = [(n, ["node", f"tests/{n}.js"], "prints") for n in NODE] + \
           [(n, ["node", f"tests/engine/{n}.js"], "prints") for n in ENGINE] + \
           [(n, ["python3", f], "asserts") for n, f in PY]
    for name, cmd, kind in jobs:
        rc, dt, out = run(cmd)
        e, envn = js_errors(out)
        if kind == "asserts":
            m = re.search(r"(\d+) passed, (\d+) failed", out) or re.search(r"(\d+) PASS, (\d+) FAIL", out)
            npass = len(re.findall(r"^PASS", out, re.M)); nfail = len(re.findall(r"^FAIL", out, re.M))
            outcome = f"{npass} PASS / {nfail} FAIL" + ("" if rc == 0 else f" (exit {rc})")
        else:
            outcome = "ran, no JS errors" if rc == 0 and (e in (None, 0)) else f"ERROR (exit {rc}, js errors {e})"
            if envn:
                outcome += f"; {envn} environment error(s): external resource blocked by sandbox"
        rows.append(f"| {name} | `{' '.join(cmd)}` | {kind} | {rc} | {dt:.0f} | {'-' if e is None else e} | {outcome} |")
        tail = "\n".join(out.strip().splitlines()[-12:])
        detail.append(f"### {name}\n\n```\n{tail}\n```\n")
        print(f"{name:16s} rc={rc} {dt:5.0f}s js_errors={e} -> {outcome}", flush=True)
    doc = [f"# Test run record — {datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')}", "",
           f"- Commit: `{commit}`", f"- Dashboard: `dist/BR13A_grillage_dashboard.html`", f"- Command: `python3 tools/run_suite.py`", "",
           "**Meaning of the outcome column.** 'prints' scripts show values next to hand/target values and do not assert; "
           "'ran, no JS errors' means only that they completed. It is NOT a pass of an engineering check. "
           "'asserts' scripts report their own PASS/FAIL. 'environment error' = the sandbox blocked an external resource "
           "(net::ERR_TUNNEL_CONNECTION_FAILED, e.g. a web font); it is listed but not counted as a software error.", "",
           "| Script | Command | Type | Exit | Time (s) | JS errors | Outcome |", "|---|---|---|---|---|---|---|"] + rows + ["", "## Last output lines", ""] + detail
    os.makedirs(os.path.dirname(os.path.join(ROOT, a.out)), exist_ok=True)
    open(os.path.join(ROOT, a.out), "w").write("\n".join(doc) + "\n")


if __name__ == "__main__":
    main()
