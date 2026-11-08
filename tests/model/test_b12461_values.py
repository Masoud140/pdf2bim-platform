"""SB42 (B12461) extraction: the control line and bearing geometry reproduce the printed coordinates (ADR-062)."""
import json, math, os, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EX = os.path.join(ROOT, "projects", "B12461", "extraction")
sys.path.insert(0, EX)
import values as V  # noqa: E402


def test_mcr0_reproduces_printed_points():
    for ch, E, N in ((557.402, 330951.852, 6244938.811), (589.580, 330921.799, 6244927.489), (614.198, 330900.514, 6244915.158),
                     (590.000, 330921.422, 6244927.304), (610.000, 330904.021, 6244917.465)):
        P = V.AL.point(ch)
        assert math.hypot(P[0] - E, P[1] - N) < 0.002, (ch, P)


def test_vertical_matches_design_surface_at_pier():
    assert abs(V.AL.vertical.rl(589.580) - 10.595) < 0.002          # 0111 design surface level on MCR0 at the pier


def test_pier_bearings_agree_with_girder_lengths():
    assert max(d for *_, d in V.CHECK) < 35                       # mm: abutment bearing + girder length vs 0406 pier dims


def test_span_values_files():
    for s in (1, 2):
        fn = V.build(s)
        d = json.load(open(fn))
        paths = [v["path"] for v in d["values"]]
        n = sum(1 for p in paths if p.startswith("superstructure.supert_types[ST1].strand_pattern.rows["))
        assert n == (40 if s == 1 else 38)
        assert sum(1 for p in paths if p.endswith(".line_offset_A")) == 5
        sups = [v["cells"]["support"] for v in d["values"] if v["path"].startswith("alignment.support_lines.rows[")]
        assert sups == (["A", "P1"] if s == 1 else ["P1", "B"])
