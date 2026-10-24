# Test run record — 2026-10-24T00:54:14+00:00

- Commit: `5e91a8f6667029a1b51b83387f7740f83d6cf36b`
- Dashboard: `dist/BR13A_grillage_dashboard.html`
- Command: `python3 tools/run_suite.py`

**Meaning of the outcome column.** 'prints' scripts show values next to hand/target values and do not assert; 'ran, no JS errors' means only that they completed. It is NOT a pass of an engineering check. 'asserts' scripts report their own PASS/FAIL. 'environment error' = the sandbox blocked an external resource (net::ERR_TUNNEL_CONNECTION_FAILED, e.g. a web font); it is listed but not counted as a software error.

| Script | Command | Type | Exit | Time (s) | JS errors | Outcome |
|---|---|---|---|---|---|---|
| sub_t | `node tests/sub_t.js` | prints | 0 | 24 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| sl_t | `node tests/sl_t.js` | prints | 0 | 20 | 0 | ran, no JS errors |
| soil_t | `node tests/soil_t.js` | prints | 0 | 36 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| tm_t | `node tests/tm_t.js` | prints | 0 | 57 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| tg_t | `node tests/tg_t.js` | prints | 0 | 137 | 0 | ran, no JS errors |
| wd_t | `node tests/wd_t.js` | prints | 0 | 29 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| eq_t | `node tests/eq_t.js` | prints | 0 | 89 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| rx_t | `node tests/rx_t.js` | prints | 0 | 89 | 0 | ran, no JS errors; 1 environment error(s): external resource blocked by sandbox |
| x_t | `node tests/x_t.js` | prints | 0 | 131 | 0 | ran, no JS errors |
| gw_t | `node tests/gw_t.js` | prints | 0 | 78 | 0 | ran, no JS errors |
| dg36_t | `node tests/dg36_t.js` | prints | 0 | 103 | 0 | ran, no JS errors |
| dgxl_t | `node tests/dgxl_t.js` | prints | 0 | 82 | 0 | ran, no JS errors |
| dgdoc_t | `node tests/dgdoc_t.js` | prints | 0 | 77 | 0 | ran, no JS errors |
| dsg_test | `node tests/engine/dsg_test.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t2 | `node tests/engine/dsg_t2.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t3 | `node tests/engine/dsg_t3.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t4 | `node tests/engine/dsg_t4.js` | prints | 0 | 0 | - | ran, no JS errors |
| dsg_t5 | `node tests/engine/dsg_t5.js` | prints | 0 | 0 | - | ran, no JS errors |
| schema | `python3 tests/schema/test_schema.py` | asserts | 0 | 0 | - | 17 PASS / 0 FAIL |
| format 0.2 | `python3 tests/schema/test_format_0_2.py` | asserts | 0 | 1 | - | 47 PASS / 0 FAIL |
| standards data | `python3 tests/standards/test_standards.py` | asserts | 0 | 1 | - | 28 PASS / 0 FAIL |
| geometry P1 | `python3 tests/geometry/test_geometry.py` | asserts | 0 | 0 | - | 36 PASS / 0 FAIL |
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
9276ms [{"id":"TU+","nH":513,"brg":[["A",-407.7,635.9,-0.04,0.06],["A",-131.6,194.2,-0.01,0.02],["A",106.7,-186,0.01,-0.02],["A",425.1,-639.2,0.04,-0.06],["B",0,59.6,-8.67,0.01],["B",0,13.9,-7.62,0],["B",0,-12.5,-6.55,0],["B",0,-70.7,-5.51,-0.01]],"hc":[[29.03,7.26,7.29],[28.95,7.24,7.23],[28.87,7.22,7.2],[28.79,7.2,7.18]],"pm":[182,60,72,192,91,30,23,84],"spr":[0,0],"gN":["-83","76"]},{"id":"TU−","nH":513,"brg":[["A",244.6,-381.6,0.02,-0.04],["A",79,-116.5,0.01,-0.01],["A",-64,111.6,-0.01,0.01],["A",-255.1,383.5,-0.03,0.04],["B",0,-35.8,5.2,0],["B",0,-8.3,4.57,0],["B",0,7.5,3.93,0],["B",0,42.4,3.31,0]],"hc":[[29.03,-4.35,-4.38],[28.95,-4.34,-4.34],[28.87,-4.33,-4.32],[28.79,-4.32,-4.31]],"pm":[109,36,43,115,55,18,14,50],"spr":[0,0],"gN":["-46","50"]}]
[[290,44,"Brg_AbutA_fixed"],[300,101,"Brg_AbutA_fixed"],[319,157,"Brg_AbutA_fixed"],[329,212,"Brg_AbutA_fixed"],[340,55,"Brg_AbutB_freeLong"],[350,112,"Brg_AbutB_freeLong"],[369,168,"Brg_AbutB_freeLong"],[379,223,"Brg_AbutB_freeLong"]]
view:v3d,mesh,h,v,abA,abB,dk,pl,nr | bnd:bd | stage:cs | prop:mat,srf,props | load:cb,ld,sl,tm,wd,eq,tr | an:an,hog,pr,stf | des:rx,dg,bb
errors ["c:Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"]
```

### tg_t

```
{"temp":{"alpha":10,"pos":"0:32.00, 100:20.71, 200:12.86, 300:7.59, 400:4.21, 500:2.16, 600:1.00, 700:0.40, 800:0.13, 900:0.03, 1000:0.00, 1100:0.00, 1200:0.00","neg":"0:-16.00, 100:-10.36, 200:-6.43, 300:-3.80, 400:-2.11, 500:-1.08, 600:-0.50, 700:-0.20, 800:-0.07, 900:-0.02, 1000:-0.00, 1100:-0.00, 1200:0.00","auto":true},"fp":{"e0":0.00010688478283150398,"phi":0.0001445416978604964,"yc":616.5969230230096,"EA":35698453564.24459,"EI":13285077892505760,"N":3815621.4566348125,"M":-1920247714.7917278},"fn":{"e0":-0.000053459646330103225,"phi":-0.00007228827298061668,"yc":616.5969230230096,"EA":35698453564.24459,"EI":13285077892505760,"N":-1908426.7020761287,"M":960355337.262212}}
Solved 00:40:51 [["TGP","13.88",[["A","-55.5","-0.01"],["A","5.8","0.00"],["A","36.1","0.00"],["A","12.9","0.00"],["B","0.0","0.23"],["B","0.0","0.25"],["B","0.0","0.32"],["B","0.0","0.42"]]],["TGN","-6.94",[["A","27.7","0.00"],["A","-2.9","-0.00"],["A","-18.0","-0.00"],["A","-6.5","-0.00"],["B","0.0","-0.11"],["B","0.0","-0.13"],["B","0.0","-0.16"],["B","0.0","-0.21"]]],["SCR","1.24",[["A","489.3","0.05"],["A","157.9","0.02"],["A","-128.1","-0.01"],["A","-510.1","-0.05"],["B","0.0","10.40"],["B","0.0","9.14"],["B","0.0","7.86"],["B","0.0","6.62"]]]]
Positive gradient lifts the span (camber up) and lengthens it; the fixed bearings at A and the piles restrain only the end rotation offset and the elongation, so the forces are small. Hand check of the camber of a simply supported span: φL²/8 with L = mean bearing-to-bearing chord = 144.5×10⁻⁶ × 28.91² / 8 = 15.10 mm (model 13.88 mm).
Done in 77 s — 512 ULS and 803 SLS combinations from the Combos tab miss {"PED":1142}
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
Solved 00:44:47 in 41.8 s on the integrated model
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
tD 220 [ 220, '18600' ] Design checks re-run 00:51:04.
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
PASS rejects: wrong parent hash
PASS accepts: superseding OV-1 by OV-2 (append) and marking OV-1 superseded
PASS BR13A 0.1 file still valid under the 0.1 schema
PASS BR13A 0.1 file unchanged by P0.2 (same as at P0.1 commit 0d36579)
PASS BR13A 0.2 file valid (schema + rules)
PASS BR13A round trip: all 928 records keep value / unit / tag / status
PASS BR13A: only the D-6 girder lengths get reconstructed originals (key matches the record path exactly)
PASS BR13A: reconstructed originals keep unit = null (not recorded in 0.1, not guessed)
PASS BR13A: no significance invented
PASS migration refuses a non-0.1 input

47 passed, 0 failed
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

28 passed, 0 failed
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

