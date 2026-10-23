#!/usr/bin/env python3
"""
Patch BR13A grillage dashboard HTML:
  1. Fix Abutment B bearing constraint: 0010000 → 0110000 → split into:
       bearing nodes: horizontal only (Dx+Dy at A, Dy at B)
       pile toes:    vertical only (Dz)
  2. Add new nodes 280-295 (pile heads at RL_B, pile toes at RL_A)
  3. Add new sections 30 (sill beam 1700x1520) and 31 (pile/col D1050)
  4. Add new elements 516-537 (sill beams, column extensions, pile shafts)
  5. Add pile-toe support constraints

All data sourced from DATA.ABT / DATA.PIL already embedded in the dashboard.
Units: kN, m (as per *UNIT block in MCT).
"""

SRC = '/mnt/user-data/uploads/BR13A_grillage_dashboard__3_.html'
DST = '/home/claude/BR13A_grillage_dashboard_v4.html'

print("Reading source file...")
with open(SRC, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"  {len(html):,} chars read.")

changes = []

# ─────────────────────────────────────────────────────────────────────────────
# 1.  Fix the support-block header comment
# ─────────────────────────────────────────────────────────────────────────────
OLD1 = (
    '; Left  = Abutment A (low chainage): G1 node 44, G2 101, G3 157, G4 212 -> Dx, Dy, Dz fixed (pinned)\n'
    '; Right = Abutment B (high chainage): G1 node 55, G2 112, G3 168, G4 223 -> Dz fixed only (roller, free in plan)'
)
NEW1 = (
    '; Left  = Abutment A (low chainage): G1 node 44, G2 101, G3 157, G4 212 -> Dx+Dy fixed (bearing horiz)\n'
    '; Right = Abutment B (high chainage): G1 node 55, G2 112, G3 168, G4 223 -> Dy fixed (guided roller horiz)\n'
    '; Vertical (Dz) reaction taken by pile toes 284-287 (Abut A) and 292-295 (Abut B).'
)
assert OLD1 in html, "FAIL: comment block 1 not found"
html = html.replace(OLD1, NEW1, 1)
changes.append("Fixed Abut-B comment + support-block header")

# ─────────────────────────────────────────────────────────────────────────────
# 2.  Replace the *CONSTRAINT block wholesale
#     Old: Abut A  1110000, Abut B  0010000 (WRONG)
#     New: Abut A  1100000 (horiz fixed), Abut B 0100000 (guided/horiz)
#          + pile toes 0010000 (Dz only, vertical)
# ─────────────────────────────────────────────────────────────────────────────
OLD2 = (
    '*CONSTRAINT    ; Supports\n'
    '; NODE_LIST, CONST(Dx,Dy,Dz,Rx,Ry,Rz,Rw), GROUP\n'
    '   44 101 157 212, 1110000, Brg_AbutA_pinned\n'
    '   55 112 168 223, 0010000, Brg_AbutB_roller'
)
NEW2 = (
    '*CONSTRAINT    ; Supports\n'
    '; NODE_LIST, CONST(Dx,Dy,Dz,Rx,Ry,Rz,Rw), GROUP\n'
    '; Bearing nodes: horizontal restraint only — Dz (vertical) carried by pile toes below.\n'
    '; [Direct] Abut A = Fixed (Dx+Dy); Abut B = Guided roller (Dy only, free longitudinal X)\n'
    '   44 101 157 212, 1100000, Brg_AbutA_fixed_horiz\n'
    '   55 112 168 223, 0100000, Brg_AbutB_guided_horiz\n'
    '; Pile toes — vertical only (Phase 1: no lateral pile-soil stiffness; geotech TBC)\n'
    '; [Model] Pinned-head simplification per grillage reference §3.4\n'
    '   284 285 286 287, 0010000, PileToe_AbutA_Dz\n'
    '   292 293 294 295, 0010000, PileToe_AbutB_Dz'
)
assert OLD2 in html, "FAIL: *CONSTRAINT block not found"
html = html.replace(OLD2, NEW2, 1)
changes.append("Replaced *CONSTRAINT block (bearing horiz + pile-toe Dz)")

# ─────────────────────────────────────────────────────────────────────────────
# 3.  Add new nodes 280–295 before *ELEMENT
#     Pile-head nodes at RL_B; pile-toe nodes at RL_A.
#     XY = same as corresponding bearing node (piles directly below girders).
#     Bearing node coordinates (from existing MCT):
#       Abut A: 44(-2.59276,-2.70435) 101(-0.70344,-0.72881)
#               157(1.20103,1.23831)  212(3.11998,3.19721)
#       Abut B:  55(-31.22727,1.94394) 112(-29.24423,4.02074)
#               168(-27.24239,6.08773) 223(-25.22201,8.14480)
#     RL_B: Abut A=116.270, Abut B=116.484 [Direct DRG 202050/202070]
#     RL_A: Abut A=109.770, Abut B=109.984 [Direct DRG 202050/202070]
# ─────────────────────────────────────────────────────────────────────────────
NEW_NODES = (
    '; --- New substructure nodes (280-295) added for sill beam / column / pile ---\n'
    '; Pile-head nodes at RL_B (top of pile / base of column extension) [Direct DRG 202050/202070]\n'
    '; Abut A RL_B=116.270 m   Abut B RL_B=116.484 m\n'
    '   280, -2.59276, -2.70435, 116.270\n'   # Abut A G1
    '   281, -0.70344, -0.72881, 116.270\n'   # Abut A G2
    '   282, 1.20103, 1.23831, 116.270\n'     # Abut A G3
    '   283, 3.11998, 3.19721, 116.270\n'     # Abut A G4
    '; Pile-toe nodes at RL_A (founding level) [Direct DRG 202050/202070]\n'
    '; Abut A RL_A=109.770 m   Abut B RL_A=109.984 m\n'
    '   284, -2.59276, -2.70435, 109.770\n'   # Abut A G1
    '   285, -0.70344, -0.72881, 109.770\n'   # Abut A G2
    '   286, 1.20103, 1.23831, 109.770\n'     # Abut A G3
    '   287, 3.11998, 3.19721, 109.770\n'     # Abut A G4
    '; Abut B pile heads\n'
    '   288, -31.22727, 1.94394, 116.484\n'   # Abut B G1
    '   289, -29.24423, 4.02074, 116.484\n'   # Abut B G2
    '   290, -27.24239, 6.08773, 116.484\n'   # Abut B G3
    '   291, -25.22201, 8.14480, 116.484\n'   # Abut B G4
    '; Abut B pile toes\n'
    '   292, -31.22727, 1.94394, 109.984\n'   # Abut B G1
    '   293, -29.24423, 4.02074, 109.984\n'   # Abut B G2
    '   294, -27.24239, 6.08773, 109.984\n'   # Abut B G3
    '   295, -25.22201, 8.14480, 109.984\n'   # Abut B G4
)
# Anchor: last node line (279) immediately before *ELEMENT
OLD_NODE_ANCHOR = '   279, -29.54660, 4.37622, 129.18597\n*ELEMENT'
NEW_NODE_ANCHOR = '   279, -29.54660, 4.37622, 129.18597\n' + NEW_NODES + '*ELEMENT'
assert OLD_NODE_ANCHOR in html, "FAIL: node-279/*ELEMENT boundary not found"
html = html.replace(OLD_NODE_ANCHOR, NEW_NODE_ANCHOR, 1)
changes.append("Added 16 substructure nodes (280-295)")

# ─────────────────────────────────────────────────────────────────────────────
# 4.  Add new sections 30 (sill beam) and 31 (pile/column) before *STLDCASE
#
#     Section 30 — Sill beam, rectangular 1700 mm wide × 1520 mm deep
#       b=1700 [Calculated: 350+515+835 from DRG 202103]
#       d=1520 [Direct DRG 202103 Sec 3]
#       Material M2 (fc=40 MPa) — confirm grade from structural spec
#       MIDAS DBUSER SB: h=depth (1.520 m), b=width (1.700 m)
#
#     Section 31 — ∅1050 bored pile / column extension
#       D=1050 mm [Direct DRG 202050/202070]
#       Material M2 (fc=40 MPa) — confirm from pile spec
#       Properties: A=π×D²/4, Asy=Asz=0.9A, J=π×D⁴/32, Iyy=Izz=J/2
#         A    = π×1.050²/4          = 0.86590 m²
#         Asy  = Asz = 0.9×0.86590   = 0.77931 m²
#         J    = π×1.050⁴/32         = 0.11932 m⁴
#         Iyy  = Izz = J/2           = 0.05966 m⁴
# ─────────────────────────────────────────────────────────────────────────────
NEW_SECTIONS = (
    '; SB_SILL [Direct/Calculated] 1700×1520 mm rect; b=350+515+835 Calc DRG202103, d=1520 Direct DRG202103 Sec3\n'
    ';          Material M2 (fc=40 MPa) assumed same grade as deck — CONFIRM from structural spec\n'
    '   30, DBUSER    , SB_sill_beam       , CT, 0, 0, 0, 0, 0, 0, YES, NO, SB , 2, 1.520, 1.700, 0, 0, 0, 0, 0, 0, 0, 0\n'
    '; PIL_COL [Direct] D=1050 mm bored pile + column extension, DRG 202050 / 202070\n'
    ';         Material M2 (fc=40 MPa) assumed — CONFIRM concrete grade from geotech/pile spec\n'
    ';         A=0.86590 m2, Asy=Asz=0.9A=0.77931 m2, J=0.11932 m4, Iyy=Izz=0.05966 m4\n'
    '   31, VALUE, Pile_Col_D1050, CC, 0, 0, 0, 0, 0, 0, YES, NO, SB, ROLL\n'
    '        8.65903e-1, 7.79313e-1, 7.79313e-1, 1.19322e-1, 5.96610e-2, 5.96610e-2\n'
    '        0, 0, 0, 0, 0, 0, 0, 0, 0, 0\n'
    '        0, 0, 0, 0, 0, 0, 0, 0\n'
)
# Anchor: the separator line before the LOAD CASE comment
OLD_STLD_ANCHOR = (
    '; ---------------------------------------------------------------------------\n'
    '; LOAD CASE + SUPPORTS (simple, as instructed)'
)
NEW_STLD_ANCHOR = (
    '; ---------------------------------------------------------------------------\n'
    + NEW_SECTIONS
    + '; ---------------------------------------------------------------------------\n'
    '; LOAD CASE + SUPPORTS (simple, as instructed)'
)
assert OLD_STLD_ANCHOR in html, "FAIL: STLDCASE separator not found"
html = html.replace(OLD_STLD_ANCHOR, NEW_STLD_ANCHOR, 1)
changes.append("Added sections 30 (sill beam 1700x1520) and 31 (pile/col D1050)")

# ─────────────────────────────────────────────────────────────────────────────
# 5.  Add new elements 516–537 before *MATERIAL
#
#     Sill beam elements (sect 30, mat 2):
#       516-518: Abut A — transverse between bearing nodes 44→101→157→212
#       519-521: Abut B — transverse between bearing nodes 55→112→168→223
#
#     Column/sill-to-head elements (sect 31, mat 2):
#       522-525: Abut A — vertical from bearing node to pile head (RL_B)
#       526-529: Abut B — vertical from bearing node to pile head (RL_B)
#       (These elements span the full height from girder NA level to RL_B,
#        encompassing the sill beam region as a simplification for Phase 1.)
#
#     Pile shaft elements (sect 31, mat 2):
#       530-533: Abut A — pile head (RL_B) to pile toe (RL_A), L=6500 mm [Direct]
#       534-537: Abut B — pile head (RL_B) to pile toe (RL_A), L=6500 mm [Direct]
# ─────────────────────────────────────────────────────────────────────────────
NEW_ELEMENTS = (
    '; --- Substructure elements (516-537) ---\n'
    '; Sill beam elements [Direct] 1700×1520 rect, M2 fc=40MPa, transverse at each abutment\n'
    '   516, BEAM, 2, 30, 44, 101, 0, 0\n'
    '   517, BEAM, 2, 30, 101, 157, 0, 0\n'
    '   518, BEAM, 2, 30, 157, 212, 0, 0\n'
    '   519, BEAM, 2, 30, 55, 112, 0, 0\n'
    '   520, BEAM, 2, 30, 112, 168, 0, 0\n'
    '   521, BEAM, 2, 30, 168, 223, 0, 0\n'
    '; Column elements [Calculated] D=1050mm circ, bearing node → pile head (RL_B)\n'
    '; Abut A RL_B=116.270; Abut B RL_B=116.484 [Direct DRG 202050/202070]\n'
    '; Phase 1 simplification: single element from girder-centroid level to RL_B\n'
    '   522, BEAM, 2, 31, 44, 280, 0, 0\n'
    '   523, BEAM, 2, 31, 101, 281, 0, 0\n'
    '   524, BEAM, 2, 31, 157, 282, 0, 0\n'
    '   525, BEAM, 2, 31, 212, 283, 0, 0\n'
    '   526, BEAM, 2, 31, 55, 288, 0, 0\n'
    '   527, BEAM, 2, 31, 112, 289, 0, 0\n'
    '   528, BEAM, 2, 31, 168, 290, 0, 0\n'
    '   529, BEAM, 2, 31, 223, 291, 0, 0\n'
    '; Pile shaft elements [Direct] D=1050mm, L=6500mm [DRG 202050/202070]\n'
    '; Abut A RL_A=109.770; Abut B RL_A=109.984\n'
    '   530, BEAM, 2, 31, 280, 284, 0, 0\n'
    '   531, BEAM, 2, 31, 281, 285, 0, 0\n'
    '   532, BEAM, 2, 31, 282, 286, 0, 0\n'
    '   533, BEAM, 2, 31, 283, 287, 0, 0\n'
    '   534, BEAM, 2, 31, 288, 292, 0, 0\n'
    '   535, BEAM, 2, 31, 289, 293, 0, 0\n'
    '   536, BEAM, 2, 31, 290, 294, 0, 0\n'
    '   537, BEAM, 2, 31, 291, 295, 0, 0\n'
)
OLD_MAT_ANCHOR = '*MATERIAL\n; iMAT, TYPE, MNAME'
NEW_MAT_ANCHOR = NEW_ELEMENTS + '*MATERIAL\n; iMAT, TYPE, MNAME'
assert OLD_MAT_ANCHOR in html, "FAIL: *MATERIAL anchor not found"
html = html.replace(OLD_MAT_ANCHOR, NEW_MAT_ANCHOR, 1)
changes.append("Added 22 substructure elements (516-537): sill beams, column extensions, pile shafts")

# ─────────────────────────────────────────────────────────────────────────────
# Write output
# ─────────────────────────────────────────────────────────────────────────────
print(f"\nWriting output to {DST} ...")
with open(DST, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"  {len(html):,} chars written.\n")
print("Changes applied:")
for i, c in enumerate(changes, 1):
    print(f"  {i}. {c}")

# ─────────────────────────────────────────────────────────────────────────────
# Verification
# ─────────────────────────────────────────────────────────────────────────────
print("\nVerification:")
checks = [
    ('Abut A horiz constraint',  '1100000, Brg_AbutA_fixed_horiz' in html),
    ('Abut B guided constraint', '0100000, Brg_AbutB_guided_horiz' in html),
    ('Pile-toe Abut A Dz',       '284 285 286 287, 0010000, PileToe_AbutA_Dz' in html),
    ('Pile-toe Abut B Dz',       '292 293 294 295, 0010000, PileToe_AbutB_Dz' in html),
    ('Old wrong constraint gone','0010000, Brg_AbutB_roller' not in html),
    ('Node 280 present',         '   280, -2.59276, -2.70435, 116.270' in html),
    ('Node 295 present',         '   295, -25.22201, 8.14480, 109.984' in html),
    ('Section 30 sill beam',     'SB_sill_beam' in html),
    ('Section 31 pile/col',      'Pile_Col_D1050' in html),
    ('Element 516 sill A',       '   516, BEAM, 2, 30, 44, 101, 0, 0' in html),
    ('Element 521 sill B',       '   521, BEAM, 2, 30, 168, 223, 0, 0' in html),
    ('Element 522 col A G1',     '   522, BEAM, 2, 31, 44, 280, 0, 0' in html),
    ('Element 537 pile B G4',    '   537, BEAM, 2, 31, 291, 295, 0, 0' in html),
    ('*ENDDATA still present',   '*ENDDATA' in html),
]
all_ok = True
for label, result in checks:
    status = "OK" if result else "FAIL"
    if not result:
        all_ok = False
    print(f"  [{status}] {label}")

if all_ok:
    print("\nAll checks passed. File ready.")
else:
    print("\nSome checks FAILED — review output before using.")
