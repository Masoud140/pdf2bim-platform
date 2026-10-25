# Test run record — 2026-10-25T13:51:51+00:00

- Commit: `6a770425d936ea1ada73135456a1367803a4b911`
- Dashboard: `dist/BR13A_grillage_dashboard.html`
- Command: `python3 tools/run_suite.py`

**Meaning of the outcome column.** 'prints' scripts show values next to hand/target values and do not assert; 'ran, no JS errors' means only that they completed. It is NOT a pass of an engineering check. 'asserts' scripts report their own PASS/FAIL. 'environment error' = the sandbox blocked an external resource (net::ERR_TUNNEL_CONNECTION_FAILED, e.g. a web font); it is listed but not counted as a software error.

| Script | Command | Type | Exit | Time (s) | JS errors | Outcome |
|---|---|---|---|---|---|---|
| sub_t | `node tests/sub_t.js` | prints | 0 | 23 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| sl_t | `node tests/sl_t.js` | prints | 0 | 18 | 0 | ran, no JS errors |
| soil_t | `node tests/soil_t.js` | prints | 0 | 29 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| tm_t | `node tests/tm_t.js` | prints | 0 | 56 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| tg_t | `node tests/tg_t.js` | prints | 0 | 114 | 0 | ran, no JS errors |
| wd_t | `node tests/wd_t.js` | prints | 0 | 24 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| eq_t | `node tests/eq_t.js` | prints | 0 | 68 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| rx_t | `node tests/rx_t.js` | prints | 0 | 70 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| x_t | `node tests/x_t.js` | prints | 0 | 101 | 0 | ran, no JS errors |
| gw_t | `node tests/gw_t.js` | prints | 0 | 61 | 0 | ran, no JS errors |
| dg36_t | `node tests/dg36_t.js` | prints | 0 | 86 | 0 | ran, no JS errors |
| dgxl_t | `node tests/dgxl_t.js` | prints | 0 | 68 | 0 | ran, no JS errors |
| dgdoc_t | `node tests/dgdoc_t.js` | prints | 0 | 63 | 0 | ran, no JS errors |
| dsg_test | `node tests/engine/dsg_test.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t2 | `node tests/engine/dsg_t2.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t3 | `node tests/engine/dsg_t3.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t4 | `node tests/engine/dsg_t4.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t5 | `node tests/engine/dsg_t5.js` | prints | 0 | 0 | - | ran, no JS errors |
| schema | `python3 tests/schema/test_schema.py` | asserts | 0 | 0 | - | 17 PASS / 0 FAIL |
| format 0.2 | `python3 tests/schema/test_format_0_2.py` | asserts | 0 | 2 | - | 48 PASS / 0 FAIL |
| standards data | `python3 tests/standards/test_standards.py` | asserts | 0 | 1 | - | 30 PASS / 0 FAIL |
| geometry P1 | `python3 tests/geometry/test_geometry.py` | asserts | 0 | 0 | - | 36 PASS / 0 FAIL |
| sections P2 | `python3 tests/sections/test_sections.py` | asserts | 0 | 17 | - | 26 PASS / 0 FAIL |
| solver P3 | `python3 tests/model/test_solver.py` | asserts | 0 | 1 | - | 11 PASS / 0 FAIL |
| model builder P3 | `python3 tests/model/test_builder.py` | asserts | 0 | 75 | - | 17 PASS / 0 FAIL |
| substructure P3b | `python3 tests/model/test_substructure.py` | asserts | 0 | 40 | - | 35 PASS / 0 FAIL |
| loads P3b | `python3 tests/model/test_loads.py` | asserts | 0 | 56 | - | 25 PASS / 0 FAIL |
| mct writer P3b | `python3 tests/model/test_mct.py` | asserts | 0 | 44 | - | 16 PASS / 0 FAIL |
| modes P3b | `python3 tests/model/test_modes.py` | asserts | 0 | 1 | - | 10 PASS / 0 FAIL |
| traffic P3c | `python3 tests/model/test_traffic.py` | asserts | 0 | 41 | - | 20 PASS / 0 FAIL |
| thermal P3c | `python3 tests/model/test_thermal.py` | asserts | 0 | 38 | - | 20 PASS / 0 FAIL |
| horizontal P3c | `python3 tests/model/test_horizontal.py` | asserts | 0 | 38 | - | 22 PASS / 0 FAIL |
| wind P3c | `python3 tests/model/test_wind.py` | asserts | 0 | 37 | - | 14 PASS / 0 FAIL |
| earthquake P3c | `python3 tests/model/test_earthquake.py` | asserts | 0 | 1 | - | 16 PASS / 0 FAIL |
| combinations P3c | `python3 tests/model/test_combinations.py` | asserts | 0 | 38 | - | 35 PASS / 0 FAIL |
| concurrent P4.1-P4.3 | `python3 tests/model/test_concurrent.py` | asserts | 0 | 107 | - | 17 PASS / 0 FAIL |
| MIDAS compare P4.4 | `python3 tests/model/test_midas_compare.py` | asserts | 0 | 38 | - | 10 PASS / 0 FAIL |
| run records P5.1 | `python3 tests/schema/test_runrecord.py` | asserts | 0 | 3 | - | 12 PASS / 0 FAIL |
| query register P5.2 | `python3 tests/schema/test_register.py` | asserts | 0 | 0 | - | 8 PASS / 0 FAIL |
| takeoff import P5.3 | `python3 tests/schema/test_takeoff.py` | asserts | 0 | 1 | - | 10 PASS / 0 FAIL |
| decisions P5.4 | `python3 tests/schema/test_accept.py` | asserts | 0 | 3 | - | 11 PASS / 0 FAIL |
| flexure P4.5 | `python3 tests/design/test_flexure.py` | asserts | 0 | 0 | - | 13 PASS / 0 FAIL |
| SLS + N-M P4.5 | `python3 tests/design/test_sls_nm.py` | asserts | 0 | 1 | - | 13 PASS / 0 FAIL |
| shear P4.5 | `python3 tests/design/test_shear.py` | asserts | 0 | 0 | - | 11 PASS / 0 FAIL |
| design benchmark P4.5 | `python3 tests/design/test_benchmark.py` | asserts | 0 | 1 | - | 4 PASS / 0 FAIL |
| design stations P4.5 | `python3 tests/design/test_stations.py` | asserts | 0 | 70 | - | 10 PASS / 0 FAIL |
| prestress losses P4.5 | `python3 tests/design/test_prestress.py` | asserts | 0 | 2 | - | 13 PASS / 0 FAIL |
| prestress inputs P4.5 | `python3 tests/design/test_prestress_inputs.py` | asserts | 0 | 36 | - | 12 PASS / 0 FAIL |
| girder flexure P4.5 | `python3 tests/design/test_girder_flexure.py` | asserts | 0 | 36 | - | 8 PASS / 0 FAIL |
| girder SLS P4.5 | `python3 tests/design/test_girder_sls.py` | asserts | 0 | 56 | - | 11 PASS / 0 FAIL |
| girder checks P4.5 | `python3 tests/design/test_girder_checks.py` | asserts | 0 | 38 | - | 8 PASS / 0 FAIL |
| baseline (fast) | `python3 tests/baseline/test_baseline.py` | asserts | 0 | 0 | - | 8 PASS / 0 FAIL |

## Last output lines

### sub_t

```
{"spr":156,"sprNodes":156,"cons":[{"nodes":[299,309,318,328],"f":[0,0,1,0,0,0,0],"group":"PileToe_AbutA_pinZ"},{"nodes":[349,359,368,378],"f":[0,0,1,0,0,0,0],"group":"PileToe_AbutB_pinZ"}],"links":[["Brg_AbutA_fixed",[1000000,10000000,10000000]],["Brg_AbutA_fixed",[1000000,10000000,10000000]],["Brg_AbutA_fixed",[1000000,10000000,10000000]],["Brg_AbutA_fixed",[1000000,10000000,10000000]],["Brg_AbutB_freeLong",[1000000,10000000,0]],["Brg_AbutB_freeLong",[1000000,10000000,0]],["Brg_AbutB_freeLong",[1000000,10000000,0]],["Brg_AbutB_freeLong",[1000000,10000000,0]]],"info":[["A",19,116.27,126.739,109.77],["A",19,116.27,126.892,109.77]],"warn":[]}
check {"model":2740.3482133724765,"all":28050.4195914639,"fill":true,"hand":2700.137289228817,"beta":0.4047144705108917,"bL":2.630644058320796,"Lc":10.469000000000008,"Ls":6.5,"EI":1956880.8,"k":210000}
anres {"keys":["P","S","modes","fac"],"spr":312,"sprSum":"-0.000"}
errors ["c:Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"]
```

### sl_t

```
[{"id":"EP","tot":[22.2,-21.5,0],"spr":[-22.2,21.5],"brgA":[1.8,56.8],"brgB":[0,-55.8],"pileM":"411.5","d":"8.00"},{"id":"EPTA","tot":[-135.9,131.4,0],"spr":[135.9,-131.4],"brgA":[0.4,8.6],"brgB":[0,-8.4],"pileM":"135.5","d":"2.37"},{"id":"EPTB","tot":[142.4,-137.6,0],"spr":[-142.4,137.6],"brgA":[0.2,9.1],"brgB":[0,-9],"pileM":"141.8","d":"2.41"},{"id":"BRKp","tot":[-492.9,83.2,0],"spr":[492.9,-83.2],"brgA":[-499.6,22],"brgB":[0,-3.7],"pileM":"367.7","d":"5.90"},{"id":"BRKm","tot":[492.9,-83.2,0],"spr":[-492.9,83.2],"brgA":[499.6,-22],"brgB":[0,3.7],"pileM":"367.7","d":"5.90"},{"id":"CEN","tot":[17.1,100.5,0],"spr":[-17.1,-100.5],"brgA":[0.1,-51.5],"brgB":[0,-50.5],"pileM":"31.6","d":"0.44"}]
{"H":[3.46,3.46,10.92799492014889],"n":[[-0.7189864249948745,0.6950241151737758],[0.7189860619519421,-0.6950244907331238]],"Fc":101.97162129779284,"nDeck":219,"K":0.5}
errors []
```

### soil_t

```
default {"nSpr":156,"head":2740,"all":28050,"piles":[["A1",126.74,19,[[0,126.74,116.27]],109925],["A2",126.89,19,[[0,126.89,116.27]],111531],["A3",127.05,19,[[0,127.05,116.27]],113138],["A4",127.2,19,[[0,127.2,116.27]],114755],["B1",125.72,18,[[0,125.72,116.48]],97010],["B2",125.88,18,[[0,125.88,116.48]],98658],["B3",126.04,18,[[0,126.04,116.48]],100307],["B4",126.19,18,[[0,126.19,116.48]],101955]]}
sl default [["EP",22.2,-22.2,411],["EPTA",-135.9,135.9,136],["EPTB",142.4,-142.4,142],["BRKp",-492.9,492.9,368],["BRKm",492.9,-492.9,368],["CEN",17.1,-17.1,32]]
custom 1 {"nSpr":116,"head":2740,"all":4765,"piles":[["A1",121,19,[[0,121,118],[1,118,116.27]],122325],["A2",121,20,[[0,121,118],[1,118,116.27]],122325],["A3",121,20,[[0,121,118],[1,118,116.27]],122325],["A4",123.5,20,[[0,123.5,118],[1,118,116.27]],148575],["B1",120,18,[[0,120,116.48]],36918],["B2",120,18,[[0,120,116.48]],36918],["B3",120,19,[[0,120,116.48]],36918],["B4",120,19,[[0,120,116.48]],36918]]}
sl custom [["EP",22.2,-22.2,1479],["EPTA",-135.9,135.9,382],["EPTB",142.4,-142.4,446],["BRKp",-492.9,492.9,926],["BRKm",492.9,-492.9,926],["CEN",17.1,-17.1,76]]
109.77 110.27 111.27 112.27 113.27 114.27 115.27 116.27 117.14 118.00 119.00 120.00 121.00 121.96 122.91 123.87 124.83 125.78 126.74 | 109.77:52500rock 110.27:157500rock 111.27:210000rock 112.27:210000rock 113.27:210000rock 114.27:210000rock 115.27:210000rock 116.27:105000rock 116.27:22706L2 117.14:45412L2 118.00:5250L1 118.00:22706L2 119.00:10500L1 120.00:10500L1 121.00:5250L1
errors ["c:Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"]
```

### tm_t

```
8470ms [{"id":"TU+","nH":513,"brg":[["A",-407.7,635.9,-0.04,0.06],["A",-131.6,194.2,-0.01,0.02],["A",106.7,-186,0.01,-0.02],["A",425.1,-639.2,0.04,-0.06],["B",0,59.6,-8.67,0.01],["B",0,13.9,-7.62,0],["B",0,-12.5,-6.55,0],["B",0,-70.7,-5.51,-0.01]],"hc":[[29.03,7.26,7.29],[28.95,7.24,7.23],[28.87,7.22,7.2],[28.79,7.2,7.18]],"pm":[182,60,72,192,91,30,23,84],"spr":[0,0],"gN":["-83","76"]},{"id":"TU−","nH":513,"brg":[["A",244.6,-381.6,0.02,-0.04],["A",79,-116.5,0.01,-0.01],["A",-64,111.6,-0.01,0.01],["A",-255.1,383.5,-0.03,0.04],["B",0,-35.8,5.2,0],["B",0,-8.3,4.57,0],["B",0,7.5,3.93,0],["B",0,42.4,3.31,0]],"hc":[[29.03,-4.35,-4.38],[28.95,-4.34,-4.34],[28.87,-4.33,-4.32],[28.79,-4.32,-4.31]],"pm":[109,36,43,115,55,18,14,50],"spr":[0,0],"gN":["-46","50"]}]
[[290,44,"Brg_AbutA_fixed"],[300,101,"Brg_AbutA_fixed"],[319,157,"Brg_AbutA_fixed"],[329,212,"Brg_AbutA_fixed"],[340,55,"Brg_AbutB_freeLong"],[350,112,"Brg_AbutB_freeLong"],[369,168,"Brg_AbutB_freeLong"],[379,223,"Brg_AbutB_freeLong"]]
view:v3d,mesh,h,v,abA,abB,dk,pl,nr | bnd:bd | stage:cs | prop:mat,srf,props | load:cb,ld,sl,tm,wd,eq,tr | an:an,hog,pr,stf | des:rx,dg,bb
errors ["c:Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"]
```

### tg_t

```
{"temp":{"alpha":10,"pos":"0:32.00, 100:20.71, 200:12.86, 300:7.59, 400:4.21, 500:2.16, 600:1.00, 700:0.40, 800:0.13, 900:0.03, 1000:0.00, 1100:0.00, 1200:0.00","neg":"0:-16.00, 100:-10.36, 200:-6.43, 300:-3.80, 400:-2.11, 500:-1.08, 600:-0.50, 700:-0.20, 800:-0.07, 900:-0.02, 1000:-0.00, 1100:-0.00, 1200:0.00","auto":true},"fp":{"e0":0.00010688478283150398,"phi":0.0001445416978604964,"yc":616.5969230230096,"EA":35698453564.24459,"EI":13285077892505760,"N":3815621.4566348125,"M":-1920247714.7917278},"fn":{"e0":-0.000053459646330103225,"phi":-0.00007228827298061668,"yc":616.5969230230096,"EA":35698453564.24459,"EI":13285077892505760,"N":-1908426.7020761287,"M":960355337.262212}}
Solved 13:27:28 [["TGP","13.88",[["A","-55.5","-0.01"],["A","5.8","0.00"],["A","36.1","0.00"],["A","12.9","0.00"],["B","0.0","0.23"],["B","0.0","0.25"],["B","0.0","0.32"],["B","0.0","0.42"]]],["TGN","-6.94",[["A","27.7","0.00"],["A","-2.9","-0.00"],["A","-18.0","-0.00"],["A","-6.5","-0.00"],["B","0.0","-0.11"],["B","0.0","-0.13"],["B","0.0","-0.16"],["B","0.0","-0.21"]]],["SCR","1.24",[["A","489.3","0.05"],["A","157.9","0.02"],["A","-128.1","-0.01"],["A","-510.1","-0.05"],["B","0.0","10.40"],["B","0.0","9.14"],["B","0.0","7.86"],["B","0.0","6.62"]]]]
Positive gradient lifts the span (camber up) and lengthens it; the fixed bearings at A and the piles restrain only the end rotation offset and the elongation, so the forces are small. Hand check of the camber of a simply supported span: φL²/8 with L = mean bearing-to-bearing chord = 144.5×10⁻⁶ × 28.91² / 8 = 15.10 mm (model 13.88 mm).
Done in 63 s — 512 ULS and 803 SLS combinations from the Combos tab miss {"PED":1142}
B L5 SLS -33.1 to -3.4 TGP 0.23 SCR 10.40
B L6 SLS -34.2 to -5.6 TGP 0.25 SCR 9.14
B L7 SLS -35.4 to -7.8 TGP 0.32 SCR 7.86
B L8 SLS -36.9 to -10.3 TGP 0.42 SCR 6.62
b: Mu 10010 uB 0.683 uS 0.418 | a: Mu 4114 uB 0.281 uS 0.012 | b+: Mu 10010 uB 0.683 uS 0.410 | t+: Mu 8169 uB 0.557 uS 0.288 | b-: Mu 10010 uB 0.683 uS 0.423 | t-: Mu 8169 uB 0.557 uS 0.301 | x: Mu 10106 uB 0.695 uS 0.443
errors []
```

### wd_t

```
WT+ tot 25.6,151.8,0.0 spr -25.6,-151.8 brgV -5.4 -4.6 2.8 5.0 -4.6 -3.5 3.6 6.6 pileM 48 dh 1.02
WT− tot -25.6,-151.8,0.0 spr 25.6,151.8 brgV 5.4 4.6 -2.8 -5.0 4.6 3.5 -3.6 -6.6 pileM 48 dh 1.02
WTV+ tot 7.5,44.4,0.0 spr -7.5,-44.4 brgV -9.9 -2.8 1.8 7.7 -6.9 -2.5 1.8 10.9 pileM 14 dh 0.31
WTV− tot -7.5,-44.4,0.0 spr 7.5,44.4 brgV 9.9 2.8 -1.8 -7.7 6.9 2.5 -1.8 -10.9 pileM 14 dh 0.31
WVU+ tot 0.0,0.0,253.8 spr 0.0,0.0 brgV -81.5 -39.5 -16.0 11.2 -50.0 -46.9 -31.0 -0.1 pileM 6 dh 0.20
WVU− tot 0.0,0.0,249.5 spr 0.0,-0.0 brgV 3.6 -27.0 -44.6 -55.7 9.8 -10.2 -33.7 -91.7 pileM 8 dh 0.20
WVD+ tot 0.0,0.0,-253.8 spr -0.0,-0.0 brgV 81.5 39.5 16.0 -11.2 50.0 46.9 31.0 0.1 pileM 6 dh 0.20
WVD− tot 0.0,0.0,-249.5 spr -0.0,0.0 brgV -3.6 27.0 44.6 55.7 -9.8 10.2 33.7 91.7 pileM 8 dh 0.20
WL+ tot -38.0,6.4,0.0 spr 38.0,-6.4 brgV 0.4 0.5 -1.2 0.3 0.3 -0.5 -0.4 0.6 pileM 28 dh 0.71
WL− tot 38.0,-6.4,0.0 spr -38.0,6.4 brgV -0.4 -0.5 1.2 -0.3 -0.3 0.5 0.4 -0.6 pileM 28 dh 0.71
ld:Loads (SDL) | tm:Temperature | wd:Wind
errors ["c:Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"]
```

### eq_t

```
6 T 0.163 L 9.4 T 3.4 V 0.0
7 T 0.091 L 0.0 T 0.0 V 0.0
8 T 0.085 L 0.2 T 0.1 V 0.0
9 T 0.077 L 1.0 T 1.8 V 0.1
10 T 0.074 L 2.8 T 1.6 V 0.0
11 T 0.072 L 0.4 T 0.2 V 0.0
12 T 0.069 L 0.0 T 0.6 V 0.1
meff L 0.879 T 0.883
L S 1681.7,919.6,0.0 brgLonA 231.4,415.5,436.9,345.4 brgTr 68.1,193.6,179.4,121.1,91.6,87.5,112.3,112.1 pileM 1231,1213,1206,1198,345,329,321,322 dlonB 25.0,25.3,25.6,25.9
T S 1126.5,2839.5,0.0 brgLonA 87.5,256.0,293.5,145.1 brgTr 126.8,433.8,395.8,83.6,287.6,501.7,488.9,107.8 pileM 885,905,903,874,923,969,1002,993 dlonB 19.5,19.9,20.2,20.4
Solved 13:30:39 in 30.5 s on the integrated model
errors ["c:Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"]
```

### rx_t

```
B L5 dl DL -4 SDL -1 M1600 0/-4 ULS 15/-50 SLS -3.4/-33.1
B L6 V DL 573 SDL 63 M1600 1003/-0 ULS 2689/427 SLS 1686.6/593.8
B L6 Hl DL 0 SDL 0 M1600 0/0 ULS 0/0 SLS 0.0/0.0
B L6 dl DL -4 SDL -1 M1600 0/-4 ULS 15/-53 SLS -5.6/-34.2
B L7 V DL 641 SDL 62 M1600 743/-11 ULS 2273/458 SLS 1483.7/671.7
B L7 Hl DL 0 SDL 0 M1600 0/0 ULS 0/0 SLS 0.0/0.0
B L7 dl DL -4 SDL -1 M1600 0/-4 ULS 15/-56 SLS -7.8/-35.4
B L8 V DL 849 SDL 205 M1600 476/-56 ULS 2474/549 SLS 1685.1/916.2
B L8 Hl DL 0 SDL 0 M1600 0/0 ULS 0/0 SLS 0.0/0.0
B L8 dl DL -5 SDL -1 M1600 0/-4 ULS 15/-59 SLS -10.3/-36.9
sum DL brg 4967 SDL 894 sdlTot 894
errors ["c:Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"]
```

### x_t

```
LC3 Support + dv b: Mu 2305 Vu 1752 Tu 1175 Nu 19 Ms 786 | x: Mu 2492 Vu 1814 Tu 1372 Nu 139 Mnc 549/549 Ms 985 gov {"M":"ULS-B-0084","V":"ULS-B-0162","T":"ULS-B-0324","Ms":"SLS-S-0017","nU":512,"nS":803}
LC4 End block at bearing b: Mu -48 Vu 238 Tu 99 Nu 2 Ms -2 | x: Mu -112 Vu 240 Tu 100 Nu 7 Mnc -37/-37 Ms 0 gov {"M":"ULS-B-0144","V":"ULS-B-0162","T":"ULS-B-0316","Ms":"SLS-S-0287","nU":512,"nS":803}
46 stations, x on 46
0.6 -48 -112 0.044 0.103
3.0 3599 3854 0.244 0.262
7.5 7868 8158 0.535 0.558
12.1 9870 10070 0.673 0.692
16.6 9940 10017 0.678 0.689
21.1 8138 8129 0.553 0.558
25.7 4579 4595 0.310 0.314
29.3 417 578 0.056 0.078
errors []
```

### gw_t

```
{"G":[{"k":1,"o":-3.1656000000000004,"L":"30.162","sA":"0.566","sB":"29.581","chord":"29.009"},{"k":2,"o":-0.8552,"L":"30.082","sA":"0.565","sB":"29.504","chord":"28.933"},{"k":3,"o":1.4552,"L":"30.000","sA":"0.563","sB":"29.423","chord":"28.854"},{"k":4,"o":3.7656,"L":"29.913","sA":"0.562","sB":"29.338","chord":"28.771"}],"eL":-4.3,"eR":4.9,"W":[["1135/1129/2265","871/1158/2029","1137/1187/2324"],["1126/1130/2256","1155/1158/2313","1184/1187/2371"],["1127/1130/2256","1155/1158/2314","1184/1187/2371"],["1127/1134/2261","1155/1388/2543","1184/1135/2319"]],"mdl":["2290","2310","2310","2290"],"hog":{"L":30162,"a":566,"a2":580,"k":1,"was":{"L":34950,"a":530}},"hogL":"30162"}
Wd sec 2289.5999999999995 | 0.0:2265:-: 1.8:2226:2226:0.141 5.3:2132:2132:0.408 9.1:2063:2064:0.601 12.8:2033:2032:0.680 16.6:2038:2038:0.678 20.4:2077:2076:0.585 24.1:2153:2152:0.402 27.9:2265:2266:0.145 29.6:2324:2324:0.161 | LC 2030 uB 0.686, 2084 uB 0.549, 2222 uB 0.156, 2264 uB 0.044
errors []
```

### dg36_t

```
pre gird [ false, 1014 ]
pre shape [ false, 5227 ]
pre zone [ false, 4346 ]
pre tend [ false, 887 ]
pre reinf [ false, 965 ]
pre fit [ false, 1607 ]
Ld 1500
run [ 1, '18326', '0.383' ]
tD 220 [ 220, '18600' ] Design checks re-run 13:35:35.
errors []
```

### dgxl_t

```
errors []
```

### dgdoc_t

```
errors []
```

### dsg_test

```
Eref 34800 A 2769809 yc 990.28 I 2.09331e+12
Eref 37400 A 2577255 yc 990.28 I 1.94778e+12
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
```

### dsg_t2

```
Eref 37400 A 2577255 yc 990.28 I 1.94778e+12
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
gamma 0.845 dn 220.96 kuo 0.09347 Mu 68970.7 tendon 1762.8/1766.1/1769.4/1772.8/1769.3
gamma 0.8075 dn 229.71 kuo 0.09717 Mu 68778.7 tendon 1757.4/1760.6/1763.8/1767.0/1763.7
gamma 0.775 dn 237.97 kuo 0.10067 Mu 68610.4 tendon 1752.7/1755.8/1758.9/1762.0/1758.8
gamma 0.7 dn 259.90 kuo 0.10994 Mu 68214.6 tendon 1741.7/1744.5/1747.3/1750.2/1747.2
target   dn 240.90 kuo 0.10190 Mu 68978.9 ; DH73/74 = 1759.56 / 1763.72
```

### dsg_t3

```
Eref 34800 A 2769809 yc 990.28 I 2.09331e+12
Eref 37400 A 2577255 yc 990.28 I 1.94778e+12
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
M=15000: top -3.709 bot -8.915 tendons 865.4/862.9/859.3/856.8/855.3 | target top -3.709 bot -8.915 tendons 865.4..856.8
M=0    : top 3.387 bot -19.772 tendons 819.6/815.1/809.6/805.0/805.6
Mdec 27318 kNm; allowable Ms 39591 (bar incr 200.0 , tendon incr 186.3 ) | target Ms 39590.6 (bar 200.0, tendon 186.3), dna 823.2
neutral axis at Ms (cracked): 823.2 mm
```

### dsg_t4

```
Eref 34800 A 2769809 yc 990.28 I 2.09331e+12
Eref 37400 A 2577255 yc 990.28 I 1.94778e+12
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
code gamma: dn 220.7 kuo 0.0933 Mu 68886 phiMu 55109 tendons 1760.5/1763.8/1767.0/1770.3/1766.9
target    : dn 240.9 kuo 0.1019 Mu 68979 phiMu 55183 tendons 1759.6..1763.7
Mcr 34002 kNm, 1.2 Mcr 40802  | target Muo.min 40802
```

### dsg_t5

```
target   A 2769809  yc 961.59  I 2.63408e13
check tendon stress at zero load 909.0 907.0 904.0 902.0 900.0
M=15000 uncracked: top -3.317 bot -11.202  target -3.709 / -8.915
M=15000 cracked-solver: top -3.317 bot -11.202
ULS dn 221.0 kuo 0.0935 Mu 68971 phi 0.8 phiMu 55177 gamma 0.845  target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183
tendon stresses 1763@0.0311 1766@0.0318 1769@0.0325 1773@0.0331 1769@0.0324
general ULS N=0: dn 220.7 Mu 68886  (ulsBend gave 220.7 / 68886)
hogging Mu -13683 dn 301
d (tension resultant) 2208.0 dv 1987.2 Ast 4423 Apt 17160 spo 904.2 Act 952555
ex -1.4116e-4 theta 28.01 kv 0.5074 phiVuc 1694.1 phiVus 10085.7 phiVumax 6185.8 phiTus 8840.7 phiTcr 3613.8 AsvMin/s 387.0 AswMin/s 916.8
util crush 0.686 shear 0.360 tors 0.158 long 0.057
target: dv 2124.5 ex -1.6152e-4 theta 27.87 kv 0.5279 phiVuc 1884.2 phiVus 10853.3 phiVumax 5931.9 phiTus(at loads) 1400 phiTcr 3332.3 AsvMin 387.0 AswMin 916.8 | util crush 0.705 shear 0.388 tors 0.245 long 0.993
```

### schema

```
PASS rejects: Missing-Flagged marked accepted
PASS rejects: Input-user without a decision id
PASS rejects: bare number instead of a tagged value
PASS rejects: unknown field
PASS rejects: wrong unit
PASS rejects: enum outside the list
PASS rejects: custom item without a source (Direct)
PASS rejects: table row without a tag
PASS project file valid: projects/BR13A/BR13A.bridge.json
PASS project decision log valid: projects/BR13A/BR13A.decisions.jsonl
PASS rejects: overruling a Direct value without evidence
PASS rejects: accepted decision without approver
```

### format 0.2

```
PASS accepts: superseding OV-1 by OV-2 (append) and marking OV-1 superseded
PASS BR13A 0.1 file still valid under the 0.1 schema
PASS BR13A 0.1 file unchanged by P0.2 (same as at P0.1 commit 0d36579)
PASS BR13A 0.2 file valid (schema + rules)
PASS BR13A round trip: all 928 records of the 0.1 file keep value / unit / tag / status
PASS BR13A: records added after migration (71) are all PROPOSED with a decision id (not accepted by the agent)
PASS BR13A: only the D-6 girder lengths get reconstructed originals (key matches the record path exactly)
PASS BR13A: reconstructed originals keep unit = null (not recorded in 0.1, not guessed)
PASS BR13A: no significance invented
PASS migration refuses a non-0.1 input

48 passed, 0 failed
```

### standards data

```
PASS rejects: approved without authorised source
PASS rejects: approved by an AI agent
PASS rejects: approved without edition
PASS rejects: approved without amendment
PASS rejects: checked without reviewer
PASS rejects: unknown status
PASS rejects: duplicate id
PASS extractor re-run keeps the review of an unchanged value
PASS extractor re-run resets the status when the code value differs from the reviewed one
PASS committed data files equal a fresh extraction (inventory not edited by hand)

30 passed, 0 failed
```

### geometry P1

```
PASS BR13A: alignment misclosure at SC, CS, ST < 5 mm (method §5)
PASS BR13A: control line at support A within 1 mm of the documented MCT base point (independent value)
PASS BR13A: support bearing 44.029166° is within 0.01° of 34.5° from the chord normal (skew D-4)
PASS BR13A: every bearing centre lies on its girder line offset (to 1e-6 m)
PASS BR13A vs dashboard model: bearing centres within 35 mm (explained difference F-4: frozen mesh nodes are not on the straight support line)
PASS BR13A vs dashboard model: G2 (closest to the control line) bearing centres within 2 mm
PASS BR13A: straight chords sit about 0.265 m inside the girder-line curve at midspan (known gap C-2 confirmed)
PASS BR13A vs dashboard gwWidth: deck width per girder at all 44 stations within 3 mm (independent implementation)
PASS BR13A: inner girder flange width grows from A to B (non-parallel chords between parallel skew lines on a curve)
PASS engine code contains no BR13A constants

36 passed, 0 failed
```

### sections P2

```
PASS BR13A: one definition used — ttf 90 from the drawing, not the library 75
PASS BR13A: girder-alone section at G2 midspan equals the dashboard one definition within 0.5 % (W varies 2280 -> 2283)
PASS BR13A G2 midspan composite vs the frozen model's G2-M_composite (V5): A, I within 1 %, J within 2 %
PASS BR13A G3 midspan composite vs the frozen model's G3-M_composite (V5): A, I within 1 %, J within 2 %
PASS BR13A edge girders vs the frozen model differ in the direction of the flare (model has none, gap D-2): G1 smaller, G4 larger at midspan
PASS BR13A: edge-girder flare enters the section (G4 composite area at midspan > at the ends by > 5 %)
PASS BR13A: solid end zones from D-38 (proposed) placed at 0–2.0 m from each girder end
PASS BR13A: solid end block — girder A > open girder, J much larger (solid St-Venant, not thin-walled)
PASS BR13A: solid end composite vs the frozen model's G2-E_composite (V5): A, I within 2 %, J within 5 %
PASS BR13A: closed-cell composite J ≫ girder-alone J (> 20x)

26 passed, 0 failed
```

### solver P3

```
PASS SS beam: midspan deflection 5wL⁴/384EI
PASS SS beam: midspan moment wL²/8 (end force of the element starting at midspan)
PASS SS beam: equilibrium residual < 1e-9 of the load
PASS cantilever (along Y), tip load: PL³/3EI and root moment PL
PASS Timoshenko cantilever: PL³/3EI + PL/(G·As)
PASS ground spring: u = F/k and spring force balances the load
PASS zero-length elastic link: u = F/k
PASS unsupported structure is refused (mechanism), not solved
PASS BR13A integrated model (2730 dof, links, springs): displacements equal the dashboard solver to 1e-8 relative (V5)
PASS BR13A integrated model: equilibrium residual < 1e-6 of the self weight

11 passed, 0 failed
```

### model builder P3

```
PASS only girders and cross girders carry weight (deck strips 0: deck is inside the composite girders)
PASS 8 bearings (4 girders x 2 supports), each on its girder's bearing-centre node
PASS transverse spacing within 1 % of the target (uniform stations between the skewed deck ends)
PASS solid-zone boundaries are nodes on every girder (no mesh quantisation)
PASS cross girders form a continuous line across the deck on each support line
PASS web lines at the dashboard web offset (web centreline at the girder top) 0.4718 m
PASS vs frozen: total self weight within 2 %
PASS vs frozen: every bearing reaction within 15 % (explained model differences)
PASS vs frozen: midspan deflection of every girder within 5 %
PASS both models carry the most load at the obtuse corners (A-G1, B-G4): skew behaviour reproduced

17 passed, 0 failed
```

### substructure P3b

```
PASS bearing links: stiffness vector = (Kv, across, along) in link axes x, y, z
PASS sill centroid line = pile-head (soffit) RL + depth / 2 at every pile (within 1 mm)
PASS bearing links: local x vertical (seat -> bearing top), local z along the girder chord A -> B
PASS bearing links: seat at the seat RL, top at the girder soffit (girder line node - D)
PASS geometry check flags the seat-to-soffit gap that disagrees with the Assumed bearing height (F-6)
PASS inputs record keeps the tags (rock_kh and bearing plan size are Assumed)  [{'Assumed'}]
PASS pile head lateral stiffness (rock springs only) within 3 % of the Hetenyi hand value (provisional tolerance)  [2731 vs 2700]
PASS Hetenyi hand formula: column length 0 gives k / (2 beta) (closed form)
PASS no rock / soil stiffness: the model is refused as a mechanism (not solved)
PASS vs frozen integrated model: bearing Rz within 10 %, pile toe Rz within 5 %, midspan uz within 1 mm (recorded run)

35 passed, 0 failed
```

### loads P3b

```
PASS plan resultant of the nodal loads within 5 mm of the resultant of the load points  [1.42 mm]
PASS load points moved onto the node hull: at most 1 mm  [1 points, 0.073 mm]
PASS SDL on the integrated model: pile-toe reactions = SDL total; residual < 1e-6
PASS SDL on the integrated model: bearing forces = SDL total
PASS solving SDL does not apply self weight (gravity off) and leaves the model's own loads untouched
PASS missing surfacing thickness is refused with the field name
PASS a barrier outside the deck is refused (no grillage there), not silently dropped
PASS vs dashboard: SDL total within 0.5 %  [897.2 vs 894.5]
PASS vs dashboard, distribution only (P3b loads on the frozen model): every bearing within 10 %
PASS vs dashboard: pile toes within 10 %, midspan within 0.6 mm (recorded run)

25 passed, 0 failed
```

### mct writer P3b

```
PASS round trip (write -> read -> solve): self weight equal to 1e-6 relative  [-8487.9690 vs -8487.9688]
PASS round trip: every displacement equal to 1e-5 of the largest (written precision)  [1.1e-06]
PASS composite girders keep the GROSS weight on the transformed section (density = w / A per material)
PASS massless members (dummies, deck strips, rigid) get a density-0 material  [446 members]
PASS verified-only mode omits links and springs and says the model is then incomplete
PASS links with explicit axes (P3a ground links) are refused, not written with a guessed angle
PASS nodal loads are not written (no documented *CONLOAD syntax) and the report says so
PASS dashboard parser: same counts (nodes, elements, materials, sections, links), no warnings  [[]]
PASS dashboard parser: same self weight (density x area x length) to 1e-6  [8487.969]
PASS dashboard parser: links read with the same nodes and stiffness vector

16 passed, 0 failed
```

### modes P3b

```
PASS simply supported beam: f1 and f2 = (n pi)^2 / (2 pi L^2) sqrt(EI / m) within 1e-6  [4.233634 vs 4.233634; 16.934544 vs 16.934537]
PASS simply supported beam: the two bending planes give equal frequencies (Iy = Iz)
PASS cantilever: f1 = 1.8751^2 / (2 pi L^2) sqrt(EI / m) within 1e-6  [1.508219 vs 1.508219]
PASS spring + lumped mass: w = sqrt(k / m); effective mass 1 in X  [40.000000]
PASS 3-dof chain: effective mass fractions in X sum to 1 over all modes  [1.000000000000]
PASS unsupported structure: modal analysis refused (mechanism), not solved
PASS BR13A frozen model: Python periods equal the dashboard's AN.modal to 1e-6 (8 modes, same mass)  [4.5e-08]
PASS BR13A frozen model: horizontal effective masses equal the dashboard's to 1e-3  [6.0e-06]
PASS vs frozen: main vertical mode within 3 %, main horizontal modes within 10 % (recorded run, V5 — not T7)  [X -8.0 %, Y -5.4 %, Z +0.6 %]
PASS vs frozen: total translational mass within 1 % (same mass rules)

10 passed, 0 failed
```

### traffic P3c

```
PASS lane factors: the last factor repeats for more lanes
PASS BR13A: 2 lanes of 3.2 m on the 8.4 m carriageway; sweep has 21 positions (0.1 m)  [2, 21]
PASS BR13A: the sweep envelope contains the left-packed layout (every response, both signs)
PASS BR13A: results carry the UNVERIFIED standards label and list the traffic entries used
PASS BR13A: bearing traffic reactions are compressive maxima (max > 0) and M1600 > S1600 at every bearing
PASS BR13A: the result carries the model's provisional inputs (D-39 ... D-41 etc.), so it is labelled provisional
PASS no traffic model switched on: refused with the field name
PASS engine check: with the dashboard's distribution rule the P3c engine reproduces the dashboard (girder M 0.1 %, bearings 1 %)
PASS H-5: without the one-node bearing lines the dashboard rule agrees with the P3c triangulation (bearings within 1 %)
PASS P3c on the P3b model vs the dashboard (sweep): girder max M within 10 % (recorded run)  [G1 -2.2 %, G2 +1.4 %, G3 +0.5 %, G4 +5.6 %]

20 passed, 0 failed
```

### thermal P3c

```
PASS BR13A G1 composite: exact band integration equals a 1 mm brute-force fibre integration (1e-6)  [1.012895e-04 vs 1.012895e-04]
PASS BR13A: every imposed-strain case is self-equilibrated (toe reactions and spring forces sum to zero)  [TU+ 2.5e-06, TU- 1.5e-06, SCR 3.0e-06, TGP 4.7e-05, TGN 2.4e-05]
PASS TU+: relative movement B - A along each girder chord within 5 % of free expansion alpha dT L  [1.005, 1.000, 0.997, 0.998]
PASS TGP (top hotter): every girder cambers UPWARD at midspan, peak within 10 % of the dashboard's (13.9 mm)  [13.62, 13.49, 13.59, 13.68 mm vs 13.88]
PASS TGP imposition is pure bending + axial on every girder element: K u0 has no end shear (|V| L / |M| < 1e-9)  [3.3e-16]
PASS missing T_max is refused with the item name
PASS a gradient profile with one point is refused
PASS results carry the model's provisional inputs
PASS isolation: P3c imposition on the dashboard's frozen model reproduces all five dashboard cases (bearing forces to 1e-5 kN)  [3.4e-07]
PASS gradient: P3c free strain / curvature of G1 within 10 % of the dashboard's design section (different deck width)

20 passed, 0 failed
```

### horizontal P3c

```
PASS braking toward B: every force along the local alignment tangent, increasing chainage; BRKm = -BRKp
PASS curvature: arc -> its k; spiral linear in s; tangent 0
PASS centrifugal: F = W V^2 / (g R) with W = 24 wheels of the M1600 entry and the smallest radius under the deck  [101.972 kN, R 400.0 m]
PASS centrifugal outward: on this left-hand curve every force points to the right of the direction of travel
PASS every horizontal case in equilibrium on the integrated model (residual < 1e-6 of the load)
PASS unknown earth-pressure coefficient kind refused
PASS no deck nodes inside the carriageway: refused
PASS results carry the model's provisional inputs and the UNVERIFIED label (M1600 weight)
PASS vs dashboard: with the dashboard's retained height every load total equals the dashboard's (0.3 kN)
PASS vs dashboard: retained height calculated from the levels within 5 % of the dashboard's built-up height

22 passed, 0 failed
```

### wind P3c

```
PASS WT nodal moments = lever x force at every node (resultant at the middle of the exposed depth)
PASS WT+ acts toward +offset (normal to the alignment at each node); WT- is its reverse
PASS WVU+: total uplift = wV x mean line length and resultant exactly at the windward eccentricity (1e-9)  [251.685 kN at -2.0000 (target -2.0000)]
PASS WVU-: total uplift = wV x mean line length and resultant exactly at the windward eccentricity (1e-9)  [251.685 kN at 2.6000 (target 2.6000)]
PASS WVD = -WVU (downward), mirrored cases equal in magnitude
PASS SLS and with-traffic scale factors = (V / V_uls)^2
PASS equilibrium on the integrated model (WVU+): bearing forces = -uplift (1e-6 relative)
PASS missing wind item refused with its name
PASS lever datum other than node / slab_top refused
PASS vs dashboard: horizontal totals equal (0.05 kN); vertical totals within 1 % (H-7: the dashboard's are off by ±0.9 %)

14 passed, 0 failed
```

### earthquake P3c

```
PASS P4.3 covariance: C_ii = R_i^2 (modes + missing mass); concurrent c_i = sign R_i and |c_j| <= R_j (Cauchy-Schwarz), 1- and 2-mode cases
PASS P4.3 covariance: cross term = sum_kl rho_kl R_ki R_lj + r_i r_j (closed form, 2 modes)  [1.861e+04 vs 1.861e+04]
PASS unknown site class refused with the list of classes
PASS missing kp refused
PASS vertical = True adds the V direction and EQ-V
PASS results carry the UNVERIFIED label (Ch table from the standards data)
PASS engine check: periods equal the dashboard's on its model and mass (1e-6)
PASS engine check: bearing forces and pile moments equal the dashboard's eqRun (1e-5 relative)
PASS H-3: with the static mass (deck strips massless) the frozen-model pile moments fall (ratio < 1)
PASS P3c on the P3b model vs the dashboard: pile moments within 20 % (EQ-L, EQ-T; recorded run)

16 passed, 0 failed
```

### combinations P3c

```
PASS schedule: girder sagging max / hogging min with the chainage of the governing end; |V|, |T| the larger of max / min
PASS schedule: bearing extremes, pile |Ml| and N, sill My / |Vz| with positions; uplift when a minimum v < 0
PASS engine check: generated rows equal the dashboard's genAll rows for all 9 recorded sets (SHA-256, count, cap)
PASS engine check: combining the dashboard's primitives reproduces rxCombine exactly (envelopes 0 difference, same governing rows)
PASS platform default: actions without an analysed case are reported as not combined (pedestrian, flood, collision)
PASS P3c vs dashboard bearings (V5, recorded): every bearing matched within 0.1 m; ULS max v within a factor 1.7 (traffic findings H-4, H-5)
PASS P3c vs dashboard piles (V5, recorded): ULS |Ml| within 10 %, |Mt| within 20 %
PASS P3c vs dashboard girders (V5, recorded): ULS sagging M within 15 % (G4 above: traffic sweep H-4)
PASS P3c vs dashboard sills (V5, recorded): shears |Vz| within 45 %; fixed-abutment |My| lower in P3c (restraint couple, M-3)
PASS schedule record: every governing row of the bearings is listed; uplift list matches the bearing minima; run record carries the input hash

35 passed, 0 failed
```

### concurrent P4.1-P4.3

```
PASS P4.2 concurrent row: a 'parts' term uses the whole governing part (negative factor picks the smaller part for the max)
PASS P4.3 concurrent row with earthquake terms: value = envelope, admissible, no flag (most probable concurrent values)
PASS P4.3 ellipse resultant: max |s0 + x| over the Minkowski sum of the direction ellipses = brute force (1e-4)  [15.45000 vs 15.45000]
PASS P4.3 ellipse resultant: refused (None) for a row with a non-earthquake envelope term
PASS BR13A (M1600, S1600; 13 responses incl. a bearing, max and min): the rebuilt state reproduces the envelope (1e-9)  [9.5e-16]
PASS BR13A: concurrent responses within their own envelopes (1e-9 relative)  [9.5e-16]
PASS BR13A: equilibrium of each state — total bearing force = load on the deck (1e-6, T4)  [2.1e-08]
PASS record (tools/concurrent_traffic.py): each state reproduces its extreme; concurrent V, T within the section envelopes; concurrent pile resultant <= the separate-envelope bound
PASS record (tools/combined_actions.py): every concurrent item reproduces its envelope value (1e-9); earthquake-governed items flagged  [52 items]
PASS record: pile concurrent items no longer flagged; ellipse resultant <= sqrt bound and >= every earthquake-row concurrent resultant (1e-5: angle grid)

17 passed, 0 failed
```

### MIDAS compare P4.4

```
PASS platform tables: total vertical reaction = model self weight (1e-6)  [8488.0 kN]
PASS round trip through MIDAS-style CSV: every reaction, member end force and paired period identical, pass  [888 reaction / 8352 force values]
PASS a reaction 5 % off is caught (outside the 2 % tolerance), comparison fails
PASS a member moment 5 % off is caught
PASS MAC pairing: reordered MIDAS modes (one with flipped sign) are paired to the right platform modes, periods identical
PASS a mode missing in MIDAS is reported unpaired (a finding, not a pass by order)
PASS a paired period 5 % off is outside the 3 % tolerance
PASS without MIDAS mode shapes nothing is paired; periods listed by order only, not assessed
PASS unknown headers stop the reader, naming the headers found and the unconfirmed column map
PASS numbering guard: a sidecar whose node / element sets differ from the model is refused

10 passed, 0 failed
```

### run records P5.1

```
]
PASS a decision affecting the output's layers makes it stale, naming the decision  [r15 D-99 affects ['design.supert']]
PASS an output whose layers the decision does not affect stays current (reason recorded)
PASS a revision not explained by a decision makes every later-revision output stale  [revision r15: no history copy, change unknown; revision r16: not explained by a decision ('hand edit')]
PASS a changed description without a later revision number is stale
PASS changed standards data makes the output stale
PASS an output without a run record is 'unknown'
PASS an older engine commit is reported as engine changed (state unaffected)
PASS every tool layer set uses decision 'affects' values of the decision schema
PASS tools/stale.py lists the example project's outputs with a state each  [5 current, 0 stale, 13 without a run record.]

12 passed, 0 failed
```

### query register P5.2

```
PASS counts equal the description's: missing = Missing-Flagged, assumed = Assumed, standard = Standard-verify, proposed = values with status proposed  [{'missing': 53, 'assumed': 206, 'standard': 65, 'proposed': 76}]
PASS every item has a path, a 'needed from', affects from the decision schema and outputs from the run-record layers
PASS a proposed record (D-42 loss inputs) carries its decision, reason, affects and the outputs it touches (girder checks, not geometry)  [29 rows]
PASS no item without an open category (Direct / Calculated accepted values are not listed)
PASS deterministic: built twice, identical
PASS HTML is standalone (no external script or stylesheet) and holds every item
PASS Markdown lists every item once per category
PASS tools/query_register.py writes the register equal to build() (JSON items)

8 passed, 0 failed
```

### takeoff import P5.3

```

## Refused rows


## Paths not in the description


Applied: 1 proposal(s) under D-98 (status proposed).

]

10 passed, 0 failed
```

### decisions P5.4

```
PASS the girder-check record (layers incl. design.supert) is now stale, the geometry record is not  [r15 D-42 affects ['design.supert']]
PASS the Query Register drops the accepted proposals (D-42 rows no longer 'proposed')
PASS a decision already accepted cannot be decided again
PASS accept D-34 (override proposal): the override becomes current (value, tag), approval recorded, rules pass  [/tmp/tmpsnj2sjvf/BR13A.bridge.0.2.json: revision 16: D-34 accepted by Test Engineer (2 override(s), 0 record(s)); previous kept at ../../../tmp/tmpsnj2sjvf/history/BR13A.bridge.0.2.r15.json
]
PASS reject D-39: approval rejected, current value unchanged, log entry rejected  [/tmp/tmpsnj2sjvf/BR13A.bridge.0.2.json: revision 17: D-39 rejected by Test Engineer (0 override(s), 8 record(s)); previous kept at ../../../tmp/tmpsnj2sjvf/history/BR13A.bridge.0.2.r16.json
]
PASS register after the decisions: no item proposed under D-34 / D-39 / D-42
PASS history keeps every previous revision
PASS decision review page: lists the proposed decisions with their values and accept / reject commands; decided ones drop out  [10 -> 7]

11 passed, 0 failed
```

### flexure P4.5

```
PASS T section, block within the flange: gamma from the top strip, alpha2 from the flange concrete (1e-9)
PASS polygon strips: a rectangle gives b x H exactly and starts at its top depth
PASS strand curve (Mattock form, coefficients from the standards data), capped at fpb; elastic-plastic option
PASS refusal: a section without concrete strips; a section without steel
PASS port = dashboard engine on its worked-example section: dn, kuo, Mu, phi (1e-9)  [dn 220.958, Mu 68970.7]
PASS port = dashboard engine: every bar and tendon stress (1e-9 relative)
PASS port = dashboard engine with its options (compression bars ignored; gamma override)
PASS port = dashboard engine: transformed elastic properties (A, yc, I)
PASS port = dashboard engine: strand curve at 4 strains
INFO E-1: worked-example targets dn 240.9, kuo 0.1019, Mu 68979 vs port dn 221.0 (-8.3%), kuo 0.0935, Mu 68971 (-0.01%)

13 passed, 0 failed
```

### SLS + N-M P4.5

```
PASS N-M at N = 0 (compression at the top, M about the top) = the ULS bending result (dn, Mu; 1e-6)  [dn 85.676 vs 85.676, M 2160.2 vs 2160.2]
PASS N-M symmetric section: hogging capacity = - sagging capacity about mid-depth (1e-9)
PASS N-M tension point: every bar at fsy, phi = phi_tension_point; curve has 92 points
PASS N-M phi: phi_compression at and above the balanced load, between it and the bending phi below (linear in N)
PASS N-M at a given axial force: the state found carries that force (1e-6 relative)
PASS N-M beyond the squash load / tension capacity: None
PASS port = dashboard engine: SLS top / bottom stresses at 15 000 kN m (uncracked, cracked) and 40 000 kN m cracked (1e-6 MPa)
PASS prestress state: each tendon at its effective stress at N = M = 0 (solver tolerance: 1e-3 MPa), prestrain = the dashboard's (1e-9)
PASS port = dashboard engine: N-M curves, both faces (92 points: N, M, phi; balanced load; 1e-9)
PASS port = dashboard engine: state at N = -3000 kN (dn, M; 1e-9)

13 passed, 0 failed
```

### shear P4.5

```
PASS hand chain: Teq, Veff, ex, theta, kv (min. steel provided), Vuc, Vus (1e-12 relative)  [ex 1.040e-03, theta 36.28, Vuc 413 kN, Vus 858 kN]
PASS utilisations: uV = Veff / (phi (Vuc + Vus)), uCr = Veff / (phi Vu,max), u = max of the four
PASS ex < 0 branch: concrete tension-side term added to the denominator, then the lower clamp
PASS ex upper clamp
PASS below minimum shear steel: kv x c / (d + kdg dv); no ties and T > 0 -> uT infinite
PASS torsion steel is taken out of the shear steel: Vus falls as T rises (same V, M, N)
PASS more stirrups -> lower uV; larger T -> higher uT and Veff
PASS no torsion cell (Ao = 0): T = 0 -> uT 0 and a finite uL (dashboard: NaN, H-9); T > 0 -> uT and uL infinite
PASS port = dashboard engine: every output of shear() on 180 cases (5 section variants x 36 action sets; 1e-9)  [[]]
PASS port = dashboard engine: V-M curve (41 points, 1e-9)

11 passed, 0 failed
```

### design benchmark P4.5

```
INFO differs from the spreadsheet (documented in the dashboard): th 28.012 vs 27.87 (+0.5%)
INFO differs from the spreadsheet (documented in the dashboard): kv 0.50745 vs 0.5279 (-3.9%)
INFO differs from the spreadsheet (documented in the dashboard): phiVuc 1694.1 vs 1884 (-10.1%)
INFO differs from the spreadsheet (documented in the dashboard): phiVus 10086 vs 10853 (-7.1%)
INFO differs from the spreadsheet (documented in the dashboard): phiVumax 6185.8 vs 5932 (+4.3%)
INFO differs from the spreadsheet (documented in the dashboard): phiTcr 3613.8 vs 3332 (+8.5%)
INFO differs from the spreadsheet (documented in the dashboard): uCr 0.68596 vs 0.705 (-2.7%)
INFO differs from the spreadsheet (documented in the dashboard): uV 0.36021 vs 0.388 (-7.2%)
INFO differs from the spreadsheet (documented in the dashboard): uT 0.15836 vs 0.245 (-35.4%)
INFO differs from the spreadsheet (documented in the dashboard): uL 0.057308 vs 0.993 (-94.2%)

4 passed, 0 failed
```

### design stations P4.5

```
PASS open stations, every girder: strip A, centroid and I (deck transformed by E) = the P2 composite properties (2 mm strips: 2e-4)  [1.2e-04]
PASS solid-end station (inside the end-A zone): solid outline; strip properties = the P2 solid composite (2e-4)
PASS strands: every 'on' strand at depth Dtot - y (y from the soffit), area from the strand material
PASS bars: area = number x pi d^2 / 4 at depth Dtot - y; fsy, Es from the reinforcement material
PASS debonding: a strand debonded 3 m from end A is absent at the end A station, present at midspan; an 'off' strand is absent everywhere
PASS BR13A missing inputs reported: strand fpb, effective prestress (no losses analysis yet), fitments, deck bars
PASS design checks refuse a station without effective prestress / fpb (no guessed values)
PASS station not built in P2 refused with the nearest station
PASS readiness: one entry per girder with strands, bars and the missing list
PASS provisional inputs carried (proposed decisions used)

10 passed, 0 failed
```

### prestress losses P4.5

```
PASS port = dashboard Hog engine, simple_nodeck: stations, labels, midspan hog and strand forces at every time, transfer forces (1e-9)  [hog 8.5e-14 mm, P 2.8e-14 kN]
PASS port = dashboard Hog engine, detailed: stations, labels, midspan hog and strand forces at every time, transfer forces (1e-9)  [hog 7.1e-14 mm, P 5.7e-14 kN]
PASS elastic shortening, concentric strand: Pr = P0 / (1 + n Ap / A) at midspan (1e-9)  [183.9248 vs 183.9248 kN]
PASS transmission: strand force zero at the girder end, full beyond the transmission length lt db
PASS no shrinkage, creep or relaxation: no time-dependent loss (simplified)
PASS each of shrinkage, creep, relaxation alone reduces the force  [{'sh': 11.67, 'cr': 0.59, 'rl': 1.63}]
PASS relaxation alone: loss = P (R(t) - R(0)) / 100 (simplified, 1e-9)  [1.6309 vs 1.6309]
PASS detailed method on the concentric strand: transfer force = the elastic-shortening closed form with the net section (1e-6)
PASS effective prestrain per strand at the last time = F / (Ap Ep), positive, below the jacking strain
PASS deck differential shrinkage (detailed method) = the dashboard's per reported time (sd, sg, phd, chi; 1e-12); eps = -(sd - sg) / (1 + chi phd)  [eps -82.6e-6]

13 passed, 0 failed
```

### prestress inputs P4.5

```
PASS moduli and mean strength from Table 3.1.2 (standards entry) at f'cp and f'c
PASS strand area and MBL from Table 3.3.1 by diameter; jacking ratio, ages from the description
PASS strand levels and debonding from the strand pattern; bars from the bar table
PASS environment / stage / relaxation inputs from design.prestress_losses (D-42)
PASS wet deck load = tD beff gamma + dform; composite properties from the deck width
PASS without accepting the proposals the builder refuses, naming the missing design.prestress_losses items
PASS V5 vs the dashboard's Hog inputs: every scalar equal except the documented geometry / density / age differences  [46 equal; differ: ['A', 'Ac', 'I', 'Ic', 'L', 'a', 'beff', 'dbw', 'dgam', 'pour', 'rho', 'ue', 'ueC', 'ued', 'wd', 'yb', 'yc']]
PASS documented differences are small where they are the same quantity: section A, I, yb, ue within 0.3 %; ueC within 0.1 %; L, a within 0.3 % / 1 %  [A +0.05%; Ac -6.58%; I +0.08%; Ic -4.54%; L -0.28%; a +0.97%; beff -14.32%; dbw -14.32%; dgam +2.00%; pour -11.67%; rho -1.92%; ue +0.07%; ueC +0.06%; ued -14.32%; wd -11.74%; yb +0.05%; yc -2.99%]
PASS with the dashboard's values substituted for the differing inputs, the run equals the dashboard's Hog run (hog, strand forces; 1e-9)  [7.1e-14 mm, 5.7e-14 kN]
PASS BR13A run from the description: effective prestrain at the last time for every strand, below the jacking strain  [mean sigma_pe 938 MPa at 3650 d]

12 passed, 0 failed
```

### girder flexure P4.5

```
PASS midspan G2: the recorded phi Mu is reproduced live (effective prestrain from the losses run, fpb = MBL / area; 1e-9)  [14877.6 kN m]
PASS effective prestress at midspan within the jacking stress and above the long-term range lower bound (0.4 fpb)
PASS each tendon's prestrain comes from its own strand of the losses analysis (pattern order)
PASS action mapping: M* interpolated between the two girder element ends bracketing each station (bracket contains the station, nearer end within 1.6 m)  [max 1.37 m]
PASS every station has M* > 0 (sagging), phi Mu > 0 and u = M* / phi Mu
PASS the governing station of each girder lies in the middle half of the span  [{'G1': 0.5, 'G2': 0.5, 'G3': 0.5, 'G4': 0.5}]
PASS phi Mu varies little along the girder (same strands, effective prestress near the plateau: within 2 %)
PASS record carries the provisional inputs and the unverified-standards label

8 passed, 0 failed
```

### girder SLS P4.5

```
PASS stage 1: each strand carries its effective prestress (losses analysis) under prestress + Mnc, girder alone (1e-3 MPa)  [Mnc 2921 kN m]
PASS soffit stress is 0 at the decompression moment and f'ct.f at the cracking moment (1e-6 MPa)
PASS uncracked composite increment: soffit stress changes by dM (D - yc) / I (transformed, girder modulus; 1e-3)  [1.2744 vs 1.2744 MPa]
PASS Muo,min = k Mcr (sagging) / k McrH (hogging); Mcr > Mdec > Mnc-free decompression ordering (Mdec < Mcr - Mnc)  [Mdec 4637, Mcr 9222, McrH 322 kN m]
PASS allowable moment above decompression; increments at Mal at the limit (one of fscr / ftcr reached within 0.5 MPa)  [Mal 8322; dsb 200.0, dsp 200.0]
PASS port = dashboard dgLC: Mdec, Mal, MdecT, MalT, Mcr, McrH, phi Mu, Muo on 4 load cases (sagging, axial + free strains, hogging, compression; 0.05 kN m)  [max diff 2.07e-02 kN m (LC4 Mal)]
PASS port = dashboard: stage-1 girder stresses, uncracked and cracked composite fibre stresses at Ms (1e-4 MPa)  [2.0e-09 / 5.5e-09 / 1.6e-08 MPa]
PASS port = dashboard: uncracked flag, uS, uST, Muo,min, phi, kuo, Nub, increments at Ms
PASS phi: compression load case between phi_compression and its bending phi; no axial force -> bending phi of kuo  [0.800 / 0.800 / 0.771]
PASS gradient profile lookup = the dashboard's dgProfAt (linear, 0 outside, repeated depth)  [[0, 32, 23.25, 14.5, 9.75, 5, 2.997, 1.263, 0, 0]]

11 passed, 0 failed
```

### girder checks P4.5

```
PASS free strains of the record: deck differential shrinkage = the losses analysis value; gradient factor from the governing SLS row (TGP > 0)  [eps -79.6e-6, f_TGP 0.5]
PASS midspan G2: the recorded staged SLS / minimum strength / ULS result is reproduced live from its recorded actions (1e-9)  [0.0e+00]
PASS Mnc at midspan = SLS factor x simple-span moment of (rho A + wd) on the bearings (closed form, 1e-9)  [2920.8 kN m]
PASS every station: uS = Ms / Mal, uB = M* / phi Mu, Muo,min = k Mcr, uncracked flag = soffit <= k sqrt(f'c)
PASS every station: 0 < Mdec < Mal and Mdec < Mcr - Mnc (decompression before cracking)
PASS Mnc symmetric about midspan and largest there (simple span)
PASS the governing ULS station of each girder lies in the middle half  [{'G1': 0.5, 'G2': 0.5, 'G3': 0.5, 'G4': 0.5}]
PASS record carries the provisional inputs, the unverified-standards label and the not-checked notes

8 passed, 0 failed
```

### baseline (fast)

```
PASS reference has quantities, checks and a run record
PASS every quantity is tagged indicative with reasons
PASS reference compared with itself: no differences
PASS a 0.01 % change of one bearing reaction is detected (exact mode)  [[{'id': 'brg.A_L1.V.DLc', 'kind': 'value', 'ref': 738.657495448, 'new': 738.7313611975447, 'rel': 9.999999999997245e-05, 'tolerance': 'exact regression'}]]
PASS the same change is within the provisional engineering tolerance
PASS a 2 mm chord change fails engineering mode (1 mm tolerance)
PASS a removed quantity is detected
PASS a change in a consistency check's pass/fail is detected

8 passed, 0 failed
```

