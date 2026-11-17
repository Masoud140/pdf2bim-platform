# Barrier Bolt Check — Design Basis and Open Items

> Status note 2026-11-17: historical (BR13A dashboard v18, parked). Not ported to the platform. The coefficient and validity findings below still stand if the check is revived.

**Status: calculator implemented (dashboard v18). Code coefficients NOT verified — see §2.**
Bridge BR13A, precast Type MAO medium performance level barrier, hold-down bolts to the deck.

## 1. What the drawings give (Direct)

| Item | Value | Sheet |
|---|---|---|
| Bolt | M24 × 330 high strength structural, property class 8.8, AS/NZS 1252, 120 thread | DRG 202103 |
| Bolt (deck detail) | M24 × 300, class 8.8 | DRG 202402 |
| Embedment | **155 mm** | DRG 202103 / 202402 |
| Anchor plate | 100 × 100 × 10 PL, Ø26 hole central (two plates, one not galvanised) | DRG 202103 |
| Nut / washer | M24 hex nut class 8, M24 flat round washer, AS/NZS 1252 | DRG 202103 |
| Wingwall assemblies | 8 No required | DRG 202103 |
| Deck hold-down bolts | HDB-01 to HDB-24, eastings and northings tabulated | DRG 202401 Table 3 |
| Stitch pour | 40 MPa continuous, shrinkage ≤ 500 microstrain at 56 days | DRG 202403 |
| Deck slab | 200 MIN thick, 40 MPa | DRG 202400 |
| Barrier | Type MAO medium performance level, precast parapet with twin steel rails | DRG 202011 |

**Calculated from the HDB coordinates:** spacing within a pair **1219 mm**, spacing between pairs
**3857 mm**, implying **12 barrier units at 2 bolts each**. These feed the calculator directly.

**Flagged:** HDB-12 and HDB-13 share a northing of 6249482.355 in the extracted table. That reads as a
transcription artefact rather than real setout — confirm both against the sheet.

## 2. The coefficient problem — read before using any result

AS 3850.1:2024 Appendix B and AS 5216 are both paywalled and could not be obtained. Published
secondary sources **disagree on the cast-in concrete cone breakout factor**:

| Source | k cracked | k uncracked | Basis |
|---|---|---|---|
| IDEA StatiCa AS implementation | 8.9 | 12.7 | cast-in washer plate, SA TS 101:2015 |
| AEFAC Technical Note 13 worked example | 10.0 | 12.5 | ACI 318 Ch.17, described there as aligned with AS 3850.1 |
| EN 1992-4 / AS 5216 | 7.7 | 11.0 | post-installed |

That is roughly a **12 % spread on cast-in**, and it falls straight through to the governing capacity.

AEFAC TN13 also states that **EN 1992-4 and AS 5216 are "only applicable for cast-in channels"**, and
that AS 3850.1 Appendix B is the cast-in route. Both use the Concrete Capacity Design method. So the
split — AS 3850.1 for cast-in, AS 5216 for post-installed — is correct, but the coefficients are not
interchangeable between them.

**Consequence for the tool:** every code coefficient (k, k_p, k_8, k_9, φ_Mc) is an **editable input
carrying its own provenance note**, not a built-in constant. Defaults are offered and labelled with
where they came from. Nothing is presented as authoritative. Confirm each against your own copy of the
standard before relying on an answer.

## 3. Method implemented

Concrete Capacity Design, per the structure common to AS 3850.1 App B, AS 5216 and EN 1992-4:

- Steel tension `N_Rk,s = A_s · f_uf`, with `φ_Ms = 5f_yf/(6f_uf) ≤ 1/1.4`
- Concrete cone `N_Rk,c = k·√f'c·h_ef^1.5 · (A_c,N/A⁰_c,N) · ψ_s,N · ψ_re,N`, with `s_cr,N = 3h_ef`,
  `c_cr,N = 1.5h_ef`, `A⁰_c,N = s_cr,N²`
- Headed pull-out (cast-in only) `N_Rk,p = k_p·A_h·f'c`, `A_h = a_wp² − πd²/4`
- Steel shear `V_Rk,s = 0.62·f_uf·A_s`
- Pry-out `V_Rk,cp = k_8·N_Rk,c`
- Concrete edge breakout `V_Rk,c` with the α/β exponent form
- Interaction: steel squared, concrete to the power 1.5

Actions come from the AS 5100.2 barrier load cases already in the Combination Builder tab
(BARA cl 12.2 γ=1.05, BAR cl 12.2 γ=1.00, BARD cl 12.3 γ=1.10, PBAR cl 12.5 γ=1.80). Tension per bolt
is taken from overturning about the far bolt of the pair.

## 4. The finding that matters most

**The breakout cone cannot develop.** `h_ef = 155 mm` in a `200 mm` deck gives
`h / h_ef = 1.29`, against the `1.5 h_ef = 233 mm` the cone equation assumes. The cone will break
through the soffit, so the standard cone expression is **outside its validity range** for this detail.

This is not a coefficient question and no choice of k fixes it. Resolve before the capacity numbers
mean anything. Possible routes: the bolt may sit in a thickened region (the 300 wide deck upstand or
the stitch pour), supplementary reinforcement may be relied on to carry the tension, or the anchorage
may be designed as reinforced rather than as plain concrete breakout.

Secondary: the 100 × 100 plate has a diagonal of 141 mm against a head-size limit of
`6t_h + d = 84 mm`, so it may not act as a rigid head for the pull-out expression.

## 5. Needs review

| Item | Why | Action |
|---|---|---|
| Cone breakout factor k | ~12 % spread between sources; AS 3850.1:2024 App B not sighted | Confirm from the standard |
| Capacity factor φ_Mc | 1/1.5 assumed | Confirm against project design criteria |
| Edge distances c₁, c₂ | Not dimensioned in the extracted sheets | Scale or confirm from DRG 202403 / 505 |
| Barrier ultimate capacity | Anchorage action should follow from the barrier capacity, not the impact load | Supply from the barrier type approval |
| Barrier hold-down bracket | Referred to sheet 505, not in this set | Obtain DRG 202505 |
| Cast-in vs post-installed | Drawing shows a bolt with a plate washer cast into the pour | Confirm with the detailer |
| h/h_ef = 1.29 | Cone cannot develop in a 200 mm slab | Resolve before relying on capacities |
