# Super-T girder checks along the girders (P4.5 stage 6) — INDICATIVE

Staged SLS (girder alone under prestress + Mnc, then composite), decompression Mdec, allowable moment Mal (Table 8.6.2.1 increments), cracking moment Mcr and minimum strength Muo >= 1.2 Mcr, ULS bending with the concurrent axial force. Effective prestress from the ported losses analysis (D-42 Assumed inputs); strand / bar layout an Assumed placeholder (D-1); standards values code-extracted-UNVERIFIED. **Not design-approved.** Free strains on the composite section: temperature-gradient primary strains (factors of the governing SLS row) and deck differential shrinkage (losses analysis). Shear / torsion by the general method with Assumed fitments (D-45 / D-46). Solid-end zone stations: shear only (rectangular approx, Assumed ADR-039); flexure / SLS not applicable. Strand development not checked.

## G1

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.02 | 836 | 1496 (SLS-S-0018) | -13.68 | yes | 6824 | 9843 | **0.15** | 9312 | 18459 | 11175 | 3798 (ULS-B-0084) | 206 | 14700 | **0.26** |
| 0.2 | 6.03 | 1659 | 2972 (SLS-S-0018) | -7.82 | yes | 6008 | 9280 | **0.32** | 9313 | 18399 | 11175 | 7342 (ULS-B-0084) | 142 | 14672 | **0.50** |
| 0.3 | 9.05 | 2248 | 3936 (SLS-S-0148) | -3.42 | yes | 5260 | 8786 | **0.45** | 9149 | 18355 | 10978 | 9643 (ULS-B-0084) | 204 | 14616 | **0.66** |
| 0.4 | 12.06 | 2601 | 4387 (SLS-S-0148) | -1.26 | yes | 4875 | 8497 | **0.52** | 9114 | 18327 | 10937 | 10699 (ULS-B-0084) | 247 | 14582 | **0.73** |
| 0.5 | 15.08 | 2719 | 4447 (SLS-S-0148) | -0.77 | yes | 4744 | 8396 | **0.53** | 9101 | 18322 | 10921 | 10799 (ULS-B-0084) | 273 | 14570 | **0.74** |
| 0.6 | 18.10 | 2601 | 4245 (SLS-S-0148) | -1.61 | yes | 4867 | 8479 | **0.50** | 9107 | 18341 | 10929 | 10193 (ULS-B-0084) | 302 | 14574 | **0.70** |
| 0.7 | 21.11 | 2248 | 3666 (SLS-S-0148) | -4.07 | yes | 5241 | 8748 | **0.42** | 9133 | 18380 | 10959 | 8699 (ULS-B-0084) | 311 | 14600 | **0.60** |
| 0.8 | 24.13 | 1659 | 2753 (SLS-S-0018) | -8.30 | yes | 5979 | 9222 | **0.30** | 9288 | 18434 | 11145 | 6415 (ULS-B-0084) | 290 | 14652 | **0.44** |
| 0.9 | 27.14 | 836 | 1485 (SLS-S-0018) | -13.73 | yes | 6848 | 9854 | **0.15** | 9340 | 18505 | 11208 | 3344 (ULS-B-0084) | 105 | 14770 | **0.23** |

### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)

| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.0 | 129 | -13 | -9 | 6 | ULS-B-0414 | N12 x 2 legs @ 100 | 1358 | 30.2 | 0.320 | 0.02 | 0.02 | 0.01 | 0.04 | **0.04** |
| 0.1 | -1922 | -1585 | 2771 | -601 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 28.8 | 0.417 | 1.49 | 2.14 | 1.78 | 0.58 | **2.14** FAIL |
| 0.2 | -1393 | -1667 | 6230 | -344 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 32.0 | 0.244 | 1.35 | 2.66 | 2.12 | 0.74 | **2.66** FAIL |
| 0.3 | -969 | -1628 | 8101 | -191 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 34.0 | 0.193 | 1.22 | 2.80 | 2.24 | 0.82 | **2.80** FAIL |
| 0.4 | -641 | -1479 | 8667 | -110 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 34.0 | 0.193 | 1.08 | 2.48 | 2.04 | 0.83 | **2.48** FAIL |
| 0.5 | -387 | -1274 | 8447 | -62 | ULS-B-0162 | N12 x 2 legs @ 200 | 1407 | 32.8 | 0.220 | 0.93 | 1.97 | 1.68 | 0.79 | **1.97** FAIL |
| 0.6 | 477 | -706 | 7914 | 271 | ULS-B-0084 | N12 x 2 legs @ 200 | 1407 | 30.5 | 0.303 | 0.57 | 0.89 | 0.85 | 0.70 | **0.89** |
| 0.7 | 681 | -697 | 7598 | 233 | ULS-B-0102 | N12 x 2 legs @ 200 | 1407 | 30.4 | 0.310 | 0.60 | 0.92 | 0.83 | 0.67 | **0.92** |
| 0.8 | 1073 | -368 | 4425 | 214 | ULS-B-0102 | N12 x 2 legs @ 200 | 1407 | 28.6 | 0.438 | 0.55 | 0.56 | 0.41 | 0.41 | **0.56** |
| 0.9 | 1233 | -94 | 1903 | 40 | ULS-B-0102 | N12 x 2 legs @ 100 | 1407 | 28.2 | 0.485 | 0.55 | 0.26 | 0.05 | 0.15 | **0.55** |
| 1.0 | -218 | -7 | -5 | -0 | ULS-B-0144 | N12 x 2 legs @ 100 | 1358 | 30.8 | 0.287 | 0.03 | 0.04 | 0.01 | 0.02 | **0.04** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -522 (SLS-S-0030) | 1069 | -1745 | 0.57 | -21 (ULS-B-0431) | -1627 | 0.01 | -674 | -1709 |
| 0.2 | 114 (SLS-S-0639) | 1555 | -2282 | 0.38 | 1169 (ULS-B-0431) | 14725 | 0.08 | 10379 | 18399 |
| 0.3 | 433 (SLS-S-0219) | 928 | -2772 | 0.13 | 1776 (ULS-B-0431) | 14683 | 0.12 | 10515 | 18355 |
| 0.4 | 597 (SLS-S-0920) | 971 | -3009 | 0.09 | 2081 (ULS-B-0431) | 14659 | 0.14 | 10452 | 18327 |
| 0.5 | 644 (SLS-S-0920) | 986 | -3089 | 0.08 | 2136 (ULS-B-0431) | 14656 | 0.15 | 10434 | 18322 |
| 0.6 | 614 (SLS-S-0920) | 1002 | -2973 | 0.10 | 1966 (ULS-B-0431) | 14672 | 0.13 | 10442 | 18341 |
| 0.7 | 516 (SLS-S-0920) | 1022 | -2655 | 0.14 | 1599 (ULS-H-0013) | 14705 | 0.11 | 10467 | 18380 |
| 0.8 | 355 (SLS-S-0639) | 1704 | -2106 | 0.35 | 1085 (ULS-H-0013) | 14753 | 0.07 | 10304 | 18434 |
| 0.9 | 128 (SLS-S-0362) | 1790 | -1318 | 0.53 | 434 (ULS-B-0431) | 14795 | 0.03 | 10274 | 18505 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion: general method at each open station (closed-box geometry) and solid-end stations (rectangular approx, Assumed, ADR-039); governing |V*| row with concurrent T*, M*, N*; strand development in the end zone not checked

## G2

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.01 | 898 | 1866 (SLS-S-0021) | -12.41 | yes | 6723 | 9712 | **0.19** | 9281 | 18549 | 11137 | 4212 (ULS-B-0102) | 373 | 14720 | **0.29** |
| 0.2 | 6.02 | 1783 | 2847 (SLS-S-0021) | -7.85 | yes | 5921 | 9158 | **0.31** | 9366 | 18569 | 11239 | 6908 (ULS-B-0102) | 212 | 14787 | **0.47** |
| 0.3 | 9.02 | 2415 | 3643 (SLS-S-0018) | -4.33 | yes | 5341 | 8744 | **0.42** | 9419 | 18585 | 11302 | 9010 (ULS-B-0084) | 103 | 14836 | **0.61** |
| 0.4 | 12.03 | 2794 | 4158 (SLS-S-0148) | -1.74 | yes | 4839 | 8414 | **0.49** | 9297 | 18600 | 11156 | 10326 (ULS-B-0084) | 99 | 14848 | **0.70** |
| 0.5 | 15.04 | 2921 | 4329 (SLS-S-0148) | -1.01 | yes | 4725 | 8328 | **0.52** | 9310 | 18612 | 11172 | 10741 (ULS-B-0084) | 81 | 14864 | **0.72** |
| 0.6 | 18.05 | 2794 | 4231 (SLS-S-0148) | -1.61 | yes | 4862 | 8431 | **0.50** | 9321 | 18621 | 11186 | 10405 (ULS-B-0084) | 58 | 14879 | **0.70** |
| 0.7 | 21.05 | 2415 | 3770 (SLS-S-0018) | -4.13 | yes | 5392 | 8785 | **0.43** | 9473 | 18628 | 11368 | 9159 (ULS-B-0084) | -1 | 14903 | **0.61** |
| 0.8 | 24.06 | 1783 | 2973 (SLS-S-0018) | -7.77 | yes | 6026 | 9261 | **0.32** | 9476 | 18633 | 11371 | 7053 (ULS-B-0084) | -69 | 14910 | **0.47** |
| 0.9 | 27.07 | 898 | 1748 (SLS-S-0018) | -13.08 | yes | 6893 | 9900 | **0.18** | 9459 | 18635 | 11351 | 3936 (ULS-B-0084) | -162 | 14917 | **0.26** |

### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)

| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.0 | 179 | -8 | -6 | 6 | ULS-B-0144 | N12 x 2 legs @ 100 | 1358 | 30.5 | 0.300 | 0.02 | 0.03 | 0.01 | 0.03 | **0.03** |
| 0.1 | -1869 | 27 | 1704 | -302 | ULS-B-0156 | N12 x 2 legs @ 200 | 1407 | 28.3 | 0.476 | 0.83 | 0.69 | 0.03 | 0.28 | **0.83** |
| 0.2 | -1320 | -1003 | 4746 | -50 | ULS-B-0144 | N12 x 2 legs @ 200 | 1407 | 28.9 | 0.412 | 0.97 | 1.40 | 1.13 | 0.58 | **1.40** FAIL |
| 0.3 | -820 | -1541 | 8236 | -23 | ULS-B-0144 | N12 x 2 legs @ 200 | 1407 | 34.0 | 0.194 | 1.14 | 2.61 | 2.12 | 0.82 | **2.61** FAIL |
| 0.4 | -578 | -1088 | 9017 | -141 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 33.0 | 0.215 | 0.82 | 1.75 | 1.44 | 0.80 | **1.75** FAIL |
| 0.5 | 374 | -1222 | 7247 | 148 | ULS-B-0107 | N12 x 2 legs @ 200 | 1407 | 31.0 | 0.278 | 0.92 | 1.68 | 1.50 | 0.73 | **1.68** FAIL |
| 0.6 | 583 | -1274 | 7358 | 140 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 31.5 | 0.259 | 0.97 | 1.85 | 1.60 | 0.74 | **1.85** FAIL |
| 0.7 | 807 | -1243 | 6604 | 124 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 30.7 | 0.294 | 0.99 | 1.75 | 1.50 | 0.70 | **1.75** FAIL |
| 0.8 | 1031 | -1065 | 5046 | 94 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 28.9 | 0.407 | 0.94 | 1.37 | 1.20 | 0.59 | **1.37** FAIL |
| 0.9 | 1256 | -820 | 2669 | 43 | ULS-B-0108 | N12 x 2 legs @ 100 | 1407 | 28.5 | 0.449 | 0.85 | 0.51 | 0.45 | 0.34 | **0.85** |
| 1.0 | -644 | -310 | 80 | 18 | ULS-B-0213 | N12 x 2 legs @ 100 | 1358 | 37.2 | 0.145 | 0.10 | 0.29 | 0.31 | 0.67 | **0.67** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -3 (SLS-S-0027) | 1389 | -1406 | 0.50 | 230 (ULS-B-0413) | 14845 | 0.02 | 10399 | 18549 |
| 0.2 | 249 (SLS-S-0201) | 1105 | -2235 | 0.26 | 1108 (ULS-B-0413) | 14860 | 0.07 | 10536 | 18569 |
| 0.3 | 427 (SLS-S-0219) | 1071 | -2857 | 0.16 | 1713 (ULS-B-0431) | 14872 | 0.12 | 10591 | 18585 |
| 0.4 | 552 (SLS-S-0639) | 1806 | -3117 | 0.25 | 2078 (ULS-B-0431) | 14883 | 0.14 | 10387 | 18600 |
| 0.5 | 605 (SLS-S-0639) | 1815 | -3228 | 0.24 | 2208 (ULS-B-0431) | 14892 | 0.15 | 10397 | 18612 |
| 0.6 | 578 (SLS-S-0639) | 1826 | -3110 | 0.25 | 2105 (ULS-B-0431) | 14899 | 0.14 | 10400 | 18621 |
| 0.7 | 474 (SLS-S-0639) | 1839 | -2765 | 0.30 | 1774 (ULS-B-0431) | 14904 | 0.12 | 10395 | 18628 |
| 0.8 | 299 (SLS-S-0639) | 1852 | -2190 | 0.38 | 1211 (ULS-H-0013) | 14913 | 0.08 | 10374 | 18633 |
| 0.9 | 61 (SLS-S-0645) | 1870 | -1375 | 0.56 | 441 (ULS-H-0013) | 14913 | 0.03 | 10319 | 18635 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion: general method at each open station (closed-box geometry) and solid-end stations (rectangular approx, Assumed, ADR-039); governing |V*| row with concurrent T*, M*, N*; strand development in the end zone not checked

## G3

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.00 | 893 | 2029 (SLS-S-0021) | -12.02 | yes | 6735 | 9724 | **0.21** | 9288 | 18550 | 11146 | 4391 (ULS-B-0102) | 287 | 14748 | **0.30** |
| 0.2 | 6.00 | 1773 | 3185 (SLS-S-0021) | -6.94 | yes | 5902 | 9127 | **0.35** | 9337 | 18569 | 11204 | 7398 (ULS-B-0102) | 291 | 14762 | **0.50** |
| 0.3 | 9.00 | 2402 | 3928 (SLS-S-0166) | -3.21 | yes | 5184 | 8659 | **0.45** | 9249 | 18586 | 11098 | 9429 (ULS-B-0102) | 229 | 14796 | **0.64** |
| 0.4 | 12.00 | 2779 | 4328 (SLS-S-0166) | -1.30 | yes | 4838 | 8405 | **0.51** | 9281 | 18600 | 11137 | 10581 (ULS-B-0102) | 170 | 14826 | **0.71** |
| 0.5 | 15.00 | 2905 | 4376 (SLS-S-0148) | -0.92 | yes | 4738 | 8336 | **0.52** | 9307 | 18611 | 11169 | 10833 (ULS-B-0084) | 103 | 14857 | **0.73** |
| 0.6 | 18.00 | 2779 | 4170 (SLS-S-0148) | -1.81 | yes | 4879 | 8446 | **0.49** | 9324 | 18621 | 11189 | 10361 (ULS-B-0084) | 63 | 14877 | **0.70** |
| 0.7 | 21.00 | 2402 | 3615 (SLS-S-0148) | -4.21 | yes | 5268 | 8744 | **0.41** | 9337 | 18628 | 11204 | 8983 (ULS-B-0084) | 7 | 14900 | **0.60** |
| 0.8 | 23.99 | 1773 | 2730 (SLS-S-0018) | -8.39 | yes | 6027 | 9257 | **0.29** | 9467 | 18632 | 11361 | 6726 (ULS-B-0084) | -47 | 14908 | **0.45** |
| 0.9 | 26.99 | 893 | 1559 (SLS-S-0018) | -13.58 | yes | 6900 | 9907 | **0.16** | 9462 | 18634 | 11354 | 3682 (ULS-B-0084) | -169 | 14917 | **0.25** |

### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)

| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.0 | 152 | -4 | -3 | 6 | ULS-B-0162 | N12 x 2 legs @ 100 | 1358 | 30.3 | 0.313 | 0.02 | 0.03 | 0.00 | 0.02 | **0.03** |
| 0.1 | -1442 | 583 | 4120 | -120 | ULS-B-0156 | N12 x 2 legs @ 100 | 1407 | 28.7 | 0.428 | 0.78 | 0.44 | 0.33 | 0.39 | **0.78** |
| 0.2 | -1127 | -370 | 6458 | -155 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 28.9 | 0.406 | 0.57 | 0.60 | 0.42 | 0.54 | **0.60** |
| 0.3 | -887 | -641 | 8187 | -106 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 30.9 | 0.284 | 0.61 | 0.95 | 0.78 | 0.70 | **0.95** |
| 0.4 | -668 | -800 | 8993 | -89 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 32.1 | 0.239 | 0.65 | 1.29 | 1.02 | 0.77 | **1.29** FAIL |
| 0.5 | -450 | -822 | 8898 | -88 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 31.8 | 0.249 | 0.63 | 1.23 | 1.04 | 0.76 | **1.23** FAIL |
| 0.6 | 494 | -1290 | 7670 | 4 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 31.9 | 0.247 | 0.97 | 1.90 | 1.64 | 0.75 | **1.90** FAIL |
| 0.7 | 728 | -1514 | 7184 | -34 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 32.3 | 0.235 | 1.14 | 2.31 | 1.95 | 0.75 | **2.31** FAIL |
| 0.8 | 992 | -1652 | 5752 | -84 | ULS-B-0090 | N12 x 2 legs @ 200 | 1407 | 31.2 | 0.273 | 1.30 | 2.39 | 2.04 | 0.70 | **2.39** FAIL |
| 0.9 | 1455 | -1112 | 1127 | -165 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 28.3 | 0.468 | 1.09 | 1.46 | 1.22 | 0.36 | **1.46** FAIL |
| 1.0 | -213 | -22 | -15 | -2 | ULS-B-0162 | N12 x 2 legs @ 100 | 1358 | 30.9 | 0.285 | 0.03 | 0.04 | 0.02 | 0.06 | **0.06** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 155 (SLS-S-0027) | 1437 | -1333 | 0.46 | 274 (ULS-B-0413) | 14846 | 0.02 | 10363 | 18550 |
| 0.2 | 367 (SLS-S-0201) | 1116 | -2212 | 0.23 | 1058 (ULS-B-0413) | 14863 | 0.07 | 10528 | 18569 |
| 0.3 | 524 (SLS-S-0201) | 1085 | -2827 | 0.14 | 1676 (ULS-B-0413) | 14876 | 0.11 | 10581 | 18586 |
| 0.4 | 632 (SLS-S-0201) | 1067 | -3196 | 0.10 | 2085 (ULS-B-0413) | 14887 | 0.14 | 10614 | 18600 |
| 0.5 | 674 (SLS-S-0219) | 1068 | -3314 | 0.09 | 2261 (ULS-B-0431) | 14895 | 0.15 | 10627 | 18611 |
| 0.6 | 637 (SLS-S-0639) | 1785 | -3154 | 0.23 | 2195 (ULS-B-0431) | 14903 | 0.15 | 10429 | 18621 |
| 0.7 | 515 (SLS-S-0639) | 1789 | -2822 | 0.28 | 1884 (ULS-B-0431) | 14908 | 0.13 | 10430 | 18628 |
| 0.8 | 312 (SLS-S-0639) | 1799 | -2256 | 0.37 | 1311 (ULS-B-0431) | 14911 | 0.09 | 10411 | 18632 |
| 0.9 | -10 (SLS-S-0038) | 1366 | -1496 | 0.48 | 390 (ULS-B-0485) | 14912 | 0.03 | 10492 | 18634 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion: general method at each open station (closed-box geometry) and solid-end stations (rectangular approx, Assumed, ADR-039); governing |V*| row with concurrent T*, M*, N*; strand development in the end zone not checked

## G4

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 2.99 | 944 | 2075 (SLS-S-0021) | -11.69 | yes | 6670 | 9631 | **0.22** | 9283 | 18634 | 11139 | 4304 (ULS-B-0102) | 475 | 14759 | **0.29** |
| 0.2 | 5.98 | 1874 | 3363 (SLS-S-0021) | -6.35 | yes | 5869 | 9066 | **0.37** | 9418 | 18713 | 11301 | 7550 (ULS-B-0102) | 304 | 14876 | **0.51** |
| 0.3 | 8.97 | 2539 | 4313 (SLS-S-0166) | -2.09 | yes | 5142 | 8578 | **0.50** | 9360 | 18766 | 11232 | 9993 (ULS-B-0102) | 228 | 14941 | **0.67** |
| 0.4 | 11.97 | 2938 | 4926 (SLS-S-0166) | 0.33 | yes | 4794 | 8316 | **0.59** | 9414 | 18798 | 11297 | 11607 (ULS-B-0102) | 130 | 14996 | **0.77** |
| 0.5 | 14.96 | 3071 | 5132 (SLS-S-0166) | 1.08 | yes | 4704 | 8258 | **0.62** | 9457 | 18810 | 11349 | 12243 (ULS-B-0102) | -7 | 15048 | **0.81** |
| 0.6 | 17.95 | 2938 | 4979 (SLS-S-0166) | 0.34 | yes | 4845 | 8376 | **0.59** | 9465 | 18806 | 11358 | 11960 (ULS-B-0102) | -69 | 15051 | **0.79** |
| 0.7 | 20.94 | 2539 | 4390 (SLS-S-0166) | -2.12 | yes | 5228 | 8680 | **0.51** | 9448 | 18784 | 11337 | 10594 (ULS-B-0102) | -109 | 15036 | **0.70** |
| 0.8 | 23.93 | 1874 | 3306 (SLS-S-0021) | -6.76 | yes | 5979 | 9195 | **0.36** | 9531 | 18742 | 11437 | 8008 (ULS-B-0102) | -123 | 15002 | **0.53** |
| 0.9 | 26.92 | 944 | 1668 (SLS-S-0021) | -13.07 | yes | 6821 | 9814 | **0.17** | 9437 | 18675 | 11324 | 4027 (ULS-B-0102) | -43 | 14943 | **0.27** |

### Shear and torsion (general method, governing |V*| with concurrent T*, M*, N*)

| t | V* | T* | M* | N* | row | fitments | dv | θ (deg) | kv | uCr | uV | uT | uL | **u** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.0 | 135 | 3 | 2 | 6 | ULS-B-0162 | N12 x 2 legs @ 100 | 1358 | 30.2 | 0.320 | 0.02 | 0.03 | 0.00 | 0.01 | **0.03** |
| 0.1 | -1531 | 528 | 2187 | -113 | ULS-B-0138 | N12 x 2 legs @ 100 | 1407 | 28.4 | 0.465 | 0.79 | 0.43 | 0.29 | 0.25 | **0.79** |
| 0.2 | -1243 | 371 | 5801 | -64 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 28.8 | 0.414 | 0.61 | 0.65 | 0.42 | 0.52 | **0.65** |
| 0.3 | -1078 | 49 | 8274 | -81 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 30.3 | 0.314 | 0.46 | 0.47 | 0.06 | 0.61 | **0.61** |
| 0.4 | -878 | -176 | 9755 | -145 | ULS-B-0138 | N12 x 2 legs @ 200 | 1407 | 31.8 | 0.249 | 0.38 | 0.48 | 0.22 | 0.71 | **0.71** |
| 0.5 | -420 | -330 | 7864 | -235 | ULS-B-0408 | N12 x 2 legs @ 200 | 1407 | 28.9 | 0.406 | 0.32 | 0.33 | 0.37 | 0.60 | **0.60** |
| 0.6 | 605 | -1248 | 8573 | -66 | ULS-B-0108 | N12 x 2 legs @ 200 | 1407 | 33.0 | 0.216 | 0.93 | 1.99 | 1.65 | 0.80 | **1.99** FAIL |
| 0.7 | 886 | -1140 | 8088 | -79 | ULS-B-0102 | N12 x 2 legs @ 200 | 1407 | 32.3 | 0.234 | 0.91 | 1.84 | 1.47 | 0.77 | **1.84** FAIL |
| 0.8 | 1236 | -1338 | 6155 | -163 | ULS-B-0084 | N12 x 2 legs @ 200 | 1407 | 30.8 | 0.289 | 1.13 | 2.01 | 1.63 | 0.70 | **2.01** FAIL |
| 0.9 | 1695 | -1752 | 1621 | -273 | ULS-B-0090 | N12 x 2 legs @ 200 | 1407 | 28.7 | 0.430 | 1.56 | 2.20 | 1.95 | 0.51 | **2.20** FAIL |
| 1.0 | -171 | -4 | -3 | -4 | ULS-B-0144 | N12 x 2 legs @ 100 | 1358 | 30.4 | 0.307 | 0.02 | 0.03 | 0.00 | 0.01 | **0.03** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 204 (SLS-S-0347) | 1915 | -1361 | 0.52 | 147 (ULS-B-0413) | 14918 | 0.01 | 10274 | 18634 |
| 0.2 | 446 (SLS-S-0027) | 1433 | -2353 | 0.26 | 960 (ULS-B-0413) | 14978 | 0.06 | 10548 | 18713 |
| 0.3 | 630 (SLS-S-0201) | 1130 | -3015 | 0.12 | 1607 (ULS-B-0413) | 15024 | 0.11 | 10713 | 18766 |
| 0.4 | 757 (SLS-S-0201) | 1144 | -3376 | 0.09 | 2070 (ULS-B-0413) | 15050 | 0.14 | 10750 | 18798 |
| 0.5 | 814 (SLS-S-0917) | 1161 | -3481 | 0.07 | 2324 (ULS-B-0413) | 15062 | 0.15 | 10757 | 18810 |
| 0.6 | 790 (SLS-S-0917) | 1147 | -3379 | 0.08 | 2340 (ULS-B-0413) | 15059 | 0.16 | 10759 | 18806 |
| 0.7 | 679 (SLS-S-0549) | 1859 | -3023 | 0.24 | 2095 (ULS-B-0413) | 15042 | 0.14 | 10544 | 18784 |
| 0.8 | 463 (SLS-S-0549) | 1820 | -2439 | 0.32 | 1556 (ULS-B-0413) | 15006 | 0.10 | 10497 | 18742 |
| 0.9 | 54 (SLS-S-0035) | 1351 | -1603 | 0.44 | 523 (ULS-B-0467) | 14951 | 0.03 | 10528 | 18675 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion: general method at each open station (closed-box geometry) and solid-end stations (rectangular approx, Assumed, ADR-039); governing |V*| row with concurrent T*, M*, N*; strand development in the end zone not checked

