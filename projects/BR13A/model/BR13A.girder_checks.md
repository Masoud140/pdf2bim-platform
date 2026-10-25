# Super-T girder checks along the girders (P4.5 stage 6) — INDICATIVE

Staged SLS (girder alone under prestress + Mnc, then composite), decompression Mdec, allowable moment Mal (Table 8.6.2.1 increments), cracking moment Mcr and minimum strength Muo >= 1.2 Mcr, ULS bending with the concurrent axial force. Effective prestress from the ported losses analysis (D-42 Assumed inputs); strand / bar layout an Assumed placeholder (D-1); standards values code-extracted-UNVERIFIED. **Not design-approved.** Free strains on the composite section: temperature-gradient primary strains (factors of the governing SLS row) and deck differential shrinkage (losses analysis). Shear / torsion by the general method with Assumed fitments (D-45 / D-46). Not checked: solid end blocks, strand development.

## G1

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.02 | 836 | 1500 (SLS-S-0018) | -13.67 | yes | 6824 | 9844 | **0.15** | 9312 | 18459 | 11175 | 3807 (ULS-B-0084) | 206 | 14700 | **0.26** |
| 0.2 | 6.03 | 1659 | 2978 (SLS-S-0018) | -7.81 | yes | 6007 | 9280 | **0.32** | 9313 | 18399 | 11175 | 7355 (ULS-B-0084) | 143 | 14672 | **0.50** |
| 0.3 | 9.05 | 2248 | 3937 (SLS-S-0148) | -3.42 | yes | 5260 | 8786 | **0.45** | 9148 | 18355 | 10978 | 9648 (ULS-B-0084) | 204 | 14616 | **0.66** |
| 0.4 | 12.06 | 2601 | 4385 (SLS-S-0148) | -1.27 | yes | 4875 | 8497 | **0.52** | 9114 | 18327 | 10937 | 10697 (ULS-B-0084) | 248 | 14582 | **0.73** |
| 0.5 | 15.08 | 2719 | 4442 (SLS-S-0148) | -0.78 | yes | 4744 | 8396 | **0.53** | 9101 | 18322 | 10921 | 10790 (ULS-B-0084) | 273 | 14570 | **0.74** |
| 0.6 | 18.10 | 2601 | 4237 (SLS-S-0148) | -1.63 | yes | 4867 | 8479 | **0.50** | 9107 | 18341 | 10929 | 10178 (ULS-B-0084) | 302 | 14574 | **0.70** |
| 0.7 | 21.11 | 2248 | 3657 (SLS-S-0148) | -4.09 | yes | 5241 | 8748 | **0.42** | 9133 | 18380 | 10959 | 8682 (ULS-B-0084) | 311 | 14600 | **0.59** |
| 0.8 | 24.13 | 1659 | 2745 (SLS-S-0018) | -8.32 | yes | 5979 | 9221 | **0.30** | 9287 | 18434 | 11145 | 6398 (ULS-B-0084) | 290 | 14652 | **0.44** |
| 0.9 | 27.14 | 836 | 1478 (SLS-S-0018) | -13.75 | yes | 6848 | 9853 | **0.15** | 9340 | 18505 | 11208 | 3329 (ULS-B-0084) | 105 | 14770 | **0.23** |

### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)

| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -1933 | -1580 | 2789 | -600 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 28.8 | 0.417 | 1.49 | 2.14 | 1.77 | 0.58 | **2.14** FAIL |
| 0.2 | -1404 | -1661 | 6247 | -343 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 32.0 | 0.244 | 1.35 | 2.66 | 2.12 | 0.74 | **2.66** FAIL |
| 0.3 | -981 | -1621 | 8113 | -191 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 34.0 | 0.193 | 1.21 | 2.79 | 2.23 | 0.82 | **2.79** FAIL |
| 0.4 | -652 | -1473 | 8670 | -109 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 34.0 | 0.193 | 1.08 | 2.47 | 2.03 | 0.83 | **2.47** FAIL |
| 0.5 | -397 | -1269 | 8446 | -62 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 32.8 | 0.220 | 0.93 | 1.96 | 1.67 | 0.79 | **1.96** FAIL |
| 0.6 | 471 | -703 | 7904 | 271 | ULS-B-0084 | N12 x 2 legs @ 200 | 1407 | 30.5 | 0.304 | 0.57 | 0.88 | 0.84 | 0.70 | **0.88** |
| 0.7 | 675 | -695 | 7585 | 233 | ULS-B-0102 | N12 x 2 legs @ 200 | 1407 | 30.3 | 0.311 | 0.60 | 0.91 | 0.83 | 0.67 | **0.91** |
| 0.8 | 1068 | -370 | 4410 | 214 | ULS-B-0102 | N12 x 2 legs @ 200 | 1407 | 28.6 | 0.438 | 0.55 | 0.56 | 0.41 | 0.41 | **0.56** |
| 0.9 | 1231 | -99 | 1891 | 41 | ULS-B-0102 | N12 x 2 legs @ 100 | 1407 | 28.2 | 0.486 | 0.55 | 0.26 | 0.05 | 0.15 | **0.55** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -516 (SLS-S-0030) | 1069 | -1744 | 0.56 | -12 (ULS-B-0431) | -1626 | 0.01 | -674 | -1709 |
| 0.2 | 119 (SLS-S-0639) | 1555 | -2282 | 0.37 | 1175 (ULS-B-0431) | 14725 | 0.08 | 10379 | 18399 |
| 0.3 | 437 (SLS-S-0219) | 928 | -2772 | 0.13 | 1782 (ULS-B-0431) | 14683 | 0.12 | 10515 | 18355 |
| 0.4 | 600 (SLS-S-0920) | 971 | -3009 | 0.09 | 2085 (ULS-B-0431) | 14659 | 0.14 | 10452 | 18327 |
| 0.5 | 646 (SLS-S-0920) | 986 | -3088 | 0.08 | 2139 (ULS-B-0431) | 14656 | 0.15 | 10433 | 18322 |
| 0.6 | 615 (SLS-S-0920) | 1002 | -2973 | 0.10 | 1967 (ULS-B-0431) | 14672 | 0.13 | 10442 | 18341 |
| 0.7 | 516 (SLS-S-0920) | 1022 | -2655 | 0.14 | 1598 (ULS-H-0013) | 14705 | 0.11 | 10467 | 18380 |
| 0.8 | 354 (SLS-S-0639) | 1704 | -2106 | 0.35 | 1082 (ULS-H-0013) | 14753 | 0.07 | 10304 | 18434 |
| 0.9 | 128 (SLS-S-0362) | 1790 | -1318 | 0.53 | 433 (ULS-B-0431) | 14795 | 0.03 | 10274 | 18505 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion: general method at each open station, governing |V*| row with concurrent T*, M*, N*; closed-box geometry mapped from the P2 parameters (ADR-039, provisional); stations inside the solid end blocks and strand development are not checked

## G2

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.01 | 898 | 1868 (SLS-S-0021) | -12.40 | yes | 6722 | 9710 | **0.19** | 9280 | 18549 | 11136 | 4213 (ULS-B-0102) | 376 | 14719 | **0.29** |
| 0.2 | 6.02 | 1783 | 2846 (SLS-S-0021) | -7.85 | yes | 5921 | 9158 | **0.31** | 9366 | 18569 | 11239 | 6905 (ULS-B-0102) | 213 | 14787 | **0.47** |
| 0.3 | 9.02 | 2415 | 3640 (SLS-S-0018) | -4.34 | yes | 5341 | 8744 | **0.42** | 9419 | 18585 | 11302 | 9003 (ULS-B-0084) | 103 | 14836 | **0.61** |
| 0.4 | 12.03 | 2794 | 4153 (SLS-S-0148) | -1.75 | yes | 4838 | 8414 | **0.49** | 9296 | 18600 | 11156 | 10315 (ULS-B-0084) | 100 | 14848 | **0.69** |
| 0.5 | 15.04 | 2921 | 4323 (SLS-S-0148) | -1.02 | yes | 4725 | 8328 | **0.52** | 9310 | 18612 | 11172 | 10728 (ULS-B-0084) | 81 | 14864 | **0.72** |
| 0.6 | 18.05 | 2794 | 4225 (SLS-S-0148) | -1.62 | yes | 4861 | 8431 | **0.50** | 9321 | 18621 | 11186 | 10390 (ULS-B-0084) | 59 | 14878 | **0.70** |
| 0.7 | 21.05 | 2415 | 3763 (SLS-S-0018) | -4.15 | yes | 5392 | 8785 | **0.43** | 9473 | 18628 | 11368 | 9142 (ULS-B-0084) | -1 | 14903 | **0.61** |
| 0.8 | 24.06 | 1783 | 2967 (SLS-S-0018) | -7.78 | yes | 6025 | 9261 | **0.32** | 9476 | 18633 | 11371 | 7037 (ULS-B-0084) | -69 | 14910 | **0.47** |
| 0.9 | 27.07 | 898 | 1746 (SLS-S-0018) | -13.09 | yes | 6893 | 9900 | **0.18** | 9459 | 18635 | 11351 | 3927 (ULS-B-0084) | -162 | 14917 | **0.26** |

### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)

| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -1870 | 28 | 1710 | -300 | ULS-B-0156 | N12 x 2 legs @ 200 | 1407 | 28.3 | 0.475 | 0.83 | 0.69 | 0.03 | 0.28 | **0.83** |
| 0.2 | -1322 | -999 | 4739 | -50 | ULS-B-0144 | N12 x 2 legs @ 200 | 1407 | 28.9 | 0.412 | 0.97 | 1.40 | 1.12 | 0.58 | **1.40** FAIL |
| 0.3 | -819 | -1535 | 8224 | -23 | ULS-B-0144 | N12 x 2 legs @ 200 | 1407 | 33.9 | 0.195 | 1.14 | 2.60 | 2.10 | 0.82 | **2.60** FAIL |
| 0.4 | -577 | -1037 | 9011 | -139 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 32.8 | 0.220 | 0.78 | 1.66 | 1.36 | 0.79 | **1.66** FAIL |
| 0.5 | 376 | -1218 | 7235 | 148 | ULS-B-0107 | N12 x 2 legs @ 200 | 1407 | 31.0 | 0.279 | 0.92 | 1.67 | 1.49 | 0.73 | **1.67** FAIL |
| 0.6 | 585 | -1270 | 7343 | 140 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 31.5 | 0.260 | 0.97 | 1.84 | 1.59 | 0.74 | **1.84** FAIL |
| 0.7 | 809 | -1240 | 6586 | 124 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 30.7 | 0.295 | 0.99 | 1.74 | 1.50 | 0.70 | **1.74** FAIL |
| 0.8 | 1034 | -1064 | 5026 | 94 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 28.9 | 0.407 | 0.94 | 1.37 | 1.20 | 0.58 | **1.37** FAIL |
| 0.9 | 1258 | -821 | 2650 | 44 | ULS-B-0108 | N12 x 2 legs @ 100 | 1407 | 28.5 | 0.449 | 0.85 | 0.51 | 0.45 | 0.34 | **0.85** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -5 (SLS-S-0027) | 1388 | -1407 | 0.50 | 227 (ULS-B-0413) | 14845 | 0.02 | 10399 | 18549 |
| 0.2 | 247 (SLS-S-0201) | 1105 | -2235 | 0.26 | 1104 (ULS-B-0413) | 14860 | 0.07 | 10536 | 18569 |
| 0.3 | 426 (SLS-S-0219) | 1071 | -2857 | 0.16 | 1710 (ULS-B-0431) | 14872 | 0.12 | 10591 | 18585 |
| 0.4 | 551 (SLS-S-0639) | 1806 | -3117 | 0.25 | 2076 (ULS-B-0431) | 14883 | 0.14 | 10387 | 18600 |
| 0.5 | 603 (SLS-S-0639) | 1815 | -3228 | 0.24 | 2206 (ULS-B-0431) | 14892 | 0.15 | 10397 | 18612 |
| 0.6 | 577 (SLS-S-0639) | 1826 | -3110 | 0.25 | 2102 (ULS-B-0431) | 14899 | 0.14 | 10400 | 18621 |
| 0.7 | 473 (SLS-S-0639) | 1839 | -2765 | 0.30 | 1770 (ULS-B-0431) | 14904 | 0.12 | 10395 | 18628 |
| 0.8 | 296 (SLS-S-0639) | 1852 | -2190 | 0.38 | 1208 (ULS-H-0013) | 14913 | 0.08 | 10374 | 18633 |
| 0.9 | 58 (SLS-S-0645) | 1870 | -1375 | 0.56 | 439 (ULS-H-0013) | 14913 | 0.03 | 10319 | 18635 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion: general method at each open station, governing |V*| row with concurrent T*, M*, N*; closed-box geometry mapped from the P2 parameters (ADR-039, provisional); stations inside the solid end blocks and strand development are not checked

## G3

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.00 | 893 | 2031 (SLS-S-0021) | -12.02 | yes | 6735 | 9725 | **0.21** | 9289 | 18550 | 11147 | 4393 (ULS-B-0102) | 285 | 14749 | **0.30** |
| 0.2 | 6.00 | 1773 | 3182 (SLS-S-0021) | -6.94 | yes | 5902 | 9127 | **0.35** | 9337 | 18569 | 11204 | 7390 (ULS-B-0102) | 291 | 14763 | **0.50** |
| 0.3 | 9.00 | 2402 | 3922 (SLS-S-0166) | -3.22 | yes | 5184 | 8659 | **0.45** | 9249 | 18586 | 11098 | 9415 (ULS-B-0102) | 229 | 14796 | **0.64** |
| 0.4 | 12.00 | 2779 | 4322 (SLS-S-0166) | -1.32 | yes | 4838 | 8405 | **0.51** | 9281 | 18600 | 11137 | 10566 (ULS-B-0102) | 169 | 14826 | **0.71** |
| 0.5 | 15.00 | 2905 | 4370 (SLS-S-0148) | -0.94 | yes | 4738 | 8336 | **0.52** | 9307 | 18611 | 11169 | 10820 (ULS-B-0084) | 103 | 14857 | **0.73** |
| 0.6 | 18.00 | 2779 | 4165 (SLS-S-0148) | -1.82 | yes | 4879 | 8446 | **0.49** | 9324 | 18621 | 11189 | 10350 (ULS-B-0084) | 63 | 14877 | **0.70** |
| 0.7 | 21.00 | 2402 | 3611 (SLS-S-0018) | -4.55 | yes | 5399 | 8788 | **0.41** | 9468 | 18628 | 11361 | 8973 (ULS-B-0084) | 7 | 14900 | **0.60** |
| 0.8 | 23.99 | 1773 | 2729 (SLS-S-0018) | -8.39 | yes | 6027 | 9257 | **0.29** | 9467 | 18632 | 11361 | 6720 (ULS-B-0084) | -46 | 14908 | **0.45** |
| 0.9 | 26.99 | 893 | 1563 (SLS-S-0018) | -13.57 | yes | 6900 | 9908 | **0.16** | 9462 | 18634 | 11354 | 3685 (ULS-B-0084) | -170 | 14917 | **0.25** |

### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)

| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -1441 | 575 | 4124 | -120 | ULS-B-0156 | N12 x 2 legs @ 100 | 1407 | 28.7 | 0.428 | 0.78 | 0.44 | 0.32 | 0.39 | **0.78** |
| 0.2 | -1128 | -372 | 6451 | -155 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 28.9 | 0.406 | 0.57 | 0.61 | 0.42 | 0.54 | **0.61** |
| 0.3 | -889 | -641 | 8177 | -106 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 30.9 | 0.285 | 0.61 | 0.95 | 0.78 | 0.70 | **0.95** |
| 0.4 | -669 | -798 | 8984 | -89 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 32.1 | 0.240 | 0.64 | 1.29 | 1.02 | 0.77 | **1.29** FAIL |
| 0.5 | -451 | -820 | 8890 | -88 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 31.8 | 0.250 | 0.63 | 1.23 | 1.04 | 0.76 | **1.23** FAIL |
| 0.6 | 495 | -1285 | 7657 | 5 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 31.9 | 0.248 | 0.96 | 1.89 | 1.63 | 0.75 | **1.89** FAIL |
| 0.7 | 729 | -1507 | 7172 | -33 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 32.2 | 0.236 | 1.14 | 2.29 | 1.94 | 0.75 | **2.29** FAIL |
| 0.8 | 993 | -1645 | 5740 | -84 | ULS-B-0090 | N12 x 2 legs @ 200 | 1407 | 31.1 | 0.275 | 1.29 | 2.37 | 2.03 | 0.70 | **2.37** FAIL |
| 0.9 | 1458 | -1106 | 1107 | -164 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 28.3 | 0.469 | 1.08 | 1.45 | 1.22 | 0.36 | **1.45** FAIL |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 153 (SLS-S-0027) | 1437 | -1333 | 0.46 | 270 (ULS-B-0413) | 14846 | 0.02 | 10363 | 18550 |
| 0.2 | 364 (SLS-S-0201) | 1116 | -2212 | 0.23 | 1053 (ULS-B-0413) | 14863 | 0.07 | 10528 | 18569 |
| 0.3 | 521 (SLS-S-0201) | 1085 | -2827 | 0.14 | 1672 (ULS-B-0413) | 14876 | 0.11 | 10582 | 18586 |
| 0.4 | 629 (SLS-S-0201) | 1067 | -3196 | 0.10 | 2080 (ULS-B-0413) | 14887 | 0.14 | 10614 | 18600 |
| 0.5 | 672 (SLS-S-0219) | 1068 | -3314 | 0.09 | 2256 (ULS-B-0431) | 14895 | 0.15 | 10627 | 18611 |
| 0.6 | 635 (SLS-S-0639) | 1785 | -3154 | 0.23 | 2192 (ULS-B-0431) | 14903 | 0.15 | 10429 | 18621 |
| 0.7 | 513 (SLS-S-0639) | 1789 | -2822 | 0.28 | 1881 (ULS-B-0431) | 14908 | 0.13 | 10430 | 18628 |
| 0.8 | 310 (SLS-S-0639) | 1799 | -2256 | 0.37 | 1308 (ULS-B-0431) | 14911 | 0.09 | 10411 | 18632 |
| 0.9 | -15 (SLS-S-0038) | 1366 | -1495 | 0.48 | 381 (ULS-B-0485) | 14912 | 0.03 | 10492 | 18634 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion: general method at each open station, governing |V*| row with concurrent T*, M*, N*; closed-box geometry mapped from the P2 parameters (ADR-039, provisional); stations inside the solid end blocks and strand development are not checked

## G4

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 2.99 | 944 | 2078 (SLS-S-0021) | -11.68 | yes | 6670 | 9631 | **0.22** | 9282 | 18634 | 11138 | 4303 (ULS-B-0102) | 478 | 14758 | **0.29** |
| 0.2 | 5.98 | 1874 | 3357 (SLS-S-0021) | -6.36 | yes | 5869 | 9066 | **0.37** | 9418 | 18713 | 11301 | 7530 (ULS-B-0102) | 305 | 14876 | **0.51** |
| 0.3 | 8.97 | 2539 | 4301 (SLS-S-0166) | -2.13 | yes | 5142 | 8578 | **0.50** | 9360 | 18766 | 11232 | 9963 (ULS-B-0102) | 229 | 14941 | **0.67** |
| 0.4 | 11.97 | 2938 | 4911 (SLS-S-0166) | 0.29 | yes | 4794 | 8316 | **0.59** | 9414 | 18798 | 11296 | 11571 (ULS-B-0102) | 131 | 14996 | **0.77** |
| 0.5 | 14.96 | 3071 | 5115 (SLS-S-0166) | 1.04 | yes | 4703 | 8258 | **0.62** | 9457 | 18810 | 11348 | 12205 (ULS-B-0102) | -7 | 15048 | **0.81** |
| 0.6 | 17.95 | 2938 | 4962 (SLS-S-0166) | 0.30 | yes | 4845 | 8375 | **0.59** | 9465 | 18806 | 11358 | 11923 (ULS-B-0102) | -69 | 15051 | **0.79** |
| 0.7 | 20.94 | 2539 | 4375 (SLS-S-0166) | -2.15 | yes | 5228 | 8679 | **0.50** | 9448 | 18784 | 11337 | 10562 (ULS-B-0102) | -108 | 15036 | **0.70** |
| 0.8 | 23.93 | 1874 | 3296 (SLS-S-0021) | -6.79 | yes | 5979 | 9195 | **0.36** | 9530 | 18742 | 11437 | 7985 (ULS-B-0102) | -122 | 15002 | **0.53** |
| 0.9 | 26.92 | 944 | 1668 (SLS-S-0021) | -13.07 | yes | 6821 | 9814 | **0.17** | 9436 | 18675 | 11324 | 4024 (ULS-B-0102) | -41 | 14943 | **0.27** |

### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)

| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -1531 | 522 | 2192 | -110 | ULS-B-0138 | N12 x 2 legs @ 100 | 1407 | 28.4 | 0.465 | 0.79 | 0.43 | 0.29 | 0.25 | **0.79** |
| 0.2 | -1242 | 365 | 5786 | -63 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 28.8 | 0.414 | 0.61 | 0.64 | 0.41 | 0.52 | **0.64** |
| 0.3 | -1075 | 45 | 8248 | -81 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 30.2 | 0.317 | 0.46 | 0.47 | 0.05 | 0.61 | **0.61** |
| 0.4 | -874 | -178 | 9725 | -144 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 31.8 | 0.251 | 0.38 | 0.48 | 0.22 | 0.71 | **0.71** |
| 0.5 | -416 | -329 | 7841 | -235 | ULS-B-0408 | N12 x 2 legs @ 200 | 1407 | 28.9 | 0.406 | 0.31 | 0.33 | 0.37 | 0.60 | **0.60** |
| 0.6 | 613 | -1243 | 8538 | -66 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 32.9 | 0.217 | 0.93 | 1.98 | 1.64 | 0.80 | **1.98** FAIL |
| 0.7 | 895 | -1506 | 7792 | -135 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 33.1 | 0.213 | 1.14 | 2.46 | 2.00 | 0.79 | **2.46** FAIL |
| 0.8 | 1245 | -1708 | 5873 | -248 | ULS-B-0090 | N12 x 2 legs @ 200 | 1407 | 31.5 | 0.260 | 1.36 | 2.59 | 2.14 | 0.72 | **2.59** FAIL |
| 0.9 | 1705 | -1742 | 1603 | -273 | ULS-B-0090 | N12 x 2 legs @ 200 | 1407 | 28.7 | 0.430 | 1.55 | 2.19 | 1.94 | 0.51 | **2.19** FAIL |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 203 (SLS-S-0347) | 1915 | -1361 | 0.52 | 141 (ULS-B-0413) | 14918 | 0.01 | 10274 | 18634 |
| 0.2 | 443 (SLS-S-0027) | 1434 | -2353 | 0.26 | 951 (ULS-B-0413) | 14978 | 0.06 | 10548 | 18713 |
| 0.3 | 626 (SLS-S-0201) | 1130 | -3015 | 0.12 | 1597 (ULS-B-0413) | 15024 | 0.11 | 10713 | 18766 |
| 0.4 | 752 (SLS-S-0201) | 1144 | -3376 | 0.09 | 2060 (ULS-B-0413) | 15050 | 0.14 | 10750 | 18798 |
| 0.5 | 809 (SLS-S-0917) | 1161 | -3481 | 0.08 | 2314 (ULS-B-0413) | 15062 | 0.15 | 10757 | 18810 |
| 0.6 | 786 (SLS-S-0917) | 1147 | -3379 | 0.08 | 2332 (ULS-B-0413) | 15059 | 0.15 | 10759 | 18806 |
| 0.7 | 675 (SLS-S-0549) | 1859 | -3023 | 0.24 | 2088 (ULS-B-0413) | 15042 | 0.14 | 10544 | 18784 |
| 0.8 | 458 (SLS-S-0549) | 1820 | -2439 | 0.32 | 1551 (ULS-B-0413) | 15006 | 0.10 | 10497 | 18742 |
| 0.9 | 49 (SLS-S-0035) | 1351 | -1603 | 0.44 | 515 (ULS-B-0467) | 14951 | 0.03 | 10528 | 18675 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion: general method at each open station, governing |V*| row with concurrent T*, M*, N*; closed-box geometry mapped from the P2 parameters (ADR-039, provisional); stations inside the solid end blocks and strand development are not checked

