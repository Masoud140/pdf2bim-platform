# Super-T girder checks along the girders (P4.5 stage 6) — INDICATIVE

Staged SLS (girder alone under prestress + Mnc, then composite), decompression Mdec, allowable moment Mal (Table 8.6.2.1 increments), cracking moment Mcr and minimum strength Muo >= 1.2 Mcr, ULS bending with the concurrent axial force. Effective prestress from the ported losses analysis (D-42 Assumed inputs); strand / bar layout an Assumed placeholder (D-1); standards values code-extracted-UNVERIFIED. **Not design-approved.** Free strains on the composite section: temperature-gradient primary strains (factors of the governing SLS row) and deck differential shrinkage (losses analysis). Not checked: shear / torsion (fitments missing), strand development.

## G1

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.02 | 836 | 1498 (SLS-S-0018) | -13.68 | yes | 6824 | 9844 | **0.15** | 9312 | 18459 | 11175 | 3804 (ULS-B-0084) | 205 | 14700 | **0.26** |
| 0.2 | 6.03 | 1659 | 2978 (SLS-S-0018) | -7.81 | yes | 6007 | 9279 | **0.32** | 9312 | 18399 | 11175 | 7356 (ULS-B-0084) | 144 | 14671 | **0.50** |
| 0.3 | 9.05 | 2248 | 3937 (SLS-S-0148) | -3.42 | yes | 5259 | 8785 | **0.45** | 9148 | 18355 | 10978 | 9648 (ULS-B-0084) | 206 | 14616 | **0.66** |
| 0.4 | 12.06 | 2601 | 4384 (SLS-S-0148) | -1.27 | yes | 4874 | 8497 | **0.52** | 9114 | 18327 | 10936 | 10696 (ULS-B-0084) | 249 | 14581 | **0.73** |
| 0.5 | 15.08 | 2719 | 4442 (SLS-S-0148) | -0.78 | yes | 4744 | 8395 | **0.53** | 9100 | 18322 | 10921 | 10789 (ULS-B-0084) | 274 | 14570 | **0.74** |
| 0.6 | 18.10 | 2601 | 4237 (SLS-S-0148) | -1.63 | yes | 4866 | 8478 | **0.50** | 9107 | 18341 | 10928 | 10177 (ULS-B-0084) | 304 | 14573 | **0.70** |
| 0.7 | 21.11 | 2248 | 3657 (SLS-S-0148) | -4.09 | yes | 5241 | 8747 | **0.42** | 9132 | 18380 | 10959 | 8681 (ULS-B-0084) | 312 | 14600 | **0.59** |
| 0.8 | 24.13 | 1659 | 2744 (SLS-S-0018) | -8.32 | yes | 5978 | 9221 | **0.30** | 9287 | 18434 | 11145 | 6396 (ULS-B-0084) | 291 | 14652 | **0.44** |
| 0.9 | 27.14 | 836 | 1477 (SLS-S-0018) | -13.75 | yes | 6847 | 9853 | **0.15** | 9340 | 18505 | 11207 | 3327 (ULS-B-0084) | 106 | 14769 | **0.23** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -506 (SLS-S-0030) | 1069 | -1745 | 0.56 | 4 (ULS-B-0431) | 14783 | 0.00 | 10586 | 18459 |
| 0.2 | 124 (SLS-S-0639) | 1555 | -2282 | 0.37 | 1184 (ULS-B-0431) | 14725 | 0.08 | 10379 | 18399 |
| 0.3 | 442 (SLS-S-0219) | 928 | -2772 | 0.13 | 1788 (ULS-B-0431) | 14683 | 0.12 | 10515 | 18355 |
| 0.4 | 602 (SLS-S-0920) | 971 | -3009 | 0.09 | 2090 (ULS-B-0431) | 14659 | 0.14 | 10452 | 18327 |
| 0.5 | 648 (SLS-S-0920) | 987 | -3088 | 0.08 | 2142 (ULS-B-0431) | 14656 | 0.15 | 10433 | 18322 |
| 0.6 | 616 (SLS-S-0920) | 1002 | -2973 | 0.10 | 1973 (ULS-B-0431) | 14672 | 0.13 | 10441 | 18341 |
| 0.7 | 517 (SLS-S-0920) | 1023 | -2655 | 0.14 | 1608 (ULS-H-0013) | 14705 | 0.11 | 10467 | 18380 |
| 0.8 | 355 (SLS-S-0639) | 1704 | -2106 | 0.35 | 1089 (ULS-B-0431) | 14749 | 0.07 | 10304 | 18434 |
| 0.9 | 128 (SLS-S-0362) | 1790 | -1318 | 0.53 | 435 (ULS-B-0431) | 14795 | 0.03 | 10274 | 18505 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion not checked: fitments and the closed-box torsion geometry are needed; strand development in the transmission zone not checked

## G2

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.01 | 898 | 1864 (SLS-S-0021) | -12.41 | yes | 6721 | 9709 | **0.19** | 9279 | 18549 | 11135 | 4206 (ULS-B-0102) | 381 | 14717 | **0.29** |
| 0.2 | 6.02 | 1783 | 2843 (SLS-S-0021) | -7.86 | yes | 5920 | 9157 | **0.31** | 9365 | 18569 | 11237 | 6900 (ULS-B-0102) | 216 | 14786 | **0.47** |
| 0.3 | 9.02 | 2415 | 3638 (SLS-S-0018) | -4.34 | yes | 5341 | 8744 | **0.42** | 9418 | 18585 | 11302 | 8999 (ULS-B-0084) | 104 | 14835 | **0.61** |
| 0.4 | 12.03 | 2794 | 4151 (SLS-S-0148) | -1.75 | yes | 4838 | 8414 | **0.49** | 9296 | 18600 | 11156 | 10312 (ULS-B-0084) | 100 | 14848 | **0.69** |
| 0.5 | 15.04 | 2921 | 4322 (SLS-S-0148) | -1.03 | yes | 4725 | 8327 | **0.52** | 9310 | 18612 | 11172 | 10726 (ULS-B-0084) | 82 | 14863 | **0.72** |
| 0.6 | 18.05 | 2794 | 4224 (SLS-S-0148) | -1.62 | yes | 4861 | 8431 | **0.50** | 9321 | 18621 | 11186 | 10389 (ULS-B-0084) | 59 | 14878 | **0.70** |
| 0.7 | 21.05 | 2415 | 3763 (SLS-S-0018) | -4.15 | yes | 5392 | 8785 | **0.43** | 9473 | 18628 | 11368 | 9141 (ULS-B-0084) | -0 | 14903 | **0.61** |
| 0.8 | 24.06 | 1783 | 2967 (SLS-S-0018) | -7.78 | yes | 6025 | 9261 | **0.32** | 9476 | 18633 | 11371 | 7037 (ULS-B-0084) | -69 | 14910 | **0.47** |
| 0.9 | 27.07 | 898 | 1746 (SLS-S-0018) | -13.09 | yes | 6893 | 9900 | **0.18** | 9459 | 18635 | 11351 | 3928 (ULS-B-0084) | -162 | 14917 | **0.26** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -2 (SLS-S-0027) | 1388 | -1406 | 0.50 | 232 (ULS-B-0413) | 14845 | 0.02 | 10399 | 18549 |
| 0.2 | 251 (SLS-S-0201) | 1106 | -2234 | 0.26 | 1111 (ULS-B-0413) | 14860 | 0.07 | 10535 | 18569 |
| 0.3 | 429 (SLS-S-0219) | 1072 | -2857 | 0.16 | 1716 (ULS-B-0431) | 14872 | 0.12 | 10591 | 18585 |
| 0.4 | 553 (SLS-S-0639) | 1806 | -3117 | 0.25 | 2081 (ULS-B-0431) | 14883 | 0.14 | 10387 | 18600 |
| 0.5 | 605 (SLS-S-0639) | 1815 | -3227 | 0.24 | 2210 (ULS-B-0431) | 14892 | 0.15 | 10396 | 18612 |
| 0.6 | 578 (SLS-S-0639) | 1826 | -3110 | 0.25 | 2105 (ULS-B-0431) | 14899 | 0.14 | 10400 | 18621 |
| 0.7 | 474 (SLS-S-0639) | 1839 | -2765 | 0.30 | 1773 (ULS-B-0431) | 14904 | 0.12 | 10395 | 18628 |
| 0.8 | 297 (SLS-S-0639) | 1852 | -2190 | 0.38 | 1217 (ULS-H-0013) | 14913 | 0.08 | 10374 | 18633 |
| 0.9 | 59 (SLS-S-0645) | 1869 | -1375 | 0.56 | 447 (ULS-H-0013) | 14913 | 0.03 | 10319 | 18635 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion not checked: fitments and the closed-box torsion geometry are needed; strand development in the transmission zone not checked

## G3

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.00 | 893 | 2027 (SLS-S-0021) | -12.02 | yes | 6734 | 9723 | **0.21** | 9287 | 18550 | 11145 | 4386 (ULS-B-0102) | 290 | 14747 | **0.30** |
| 0.2 | 6.00 | 1773 | 3178 (SLS-S-0021) | -6.95 | yes | 5901 | 9126 | **0.35** | 9336 | 18569 | 11203 | 7383 (ULS-B-0102) | 294 | 14762 | **0.50** |
| 0.3 | 9.00 | 2402 | 3919 (SLS-S-0166) | -3.23 | yes | 5184 | 8658 | **0.45** | 9248 | 18586 | 11098 | 9409 (ULS-B-0102) | 231 | 14795 | **0.64** |
| 0.4 | 12.00 | 2779 | 4319 (SLS-S-0166) | -1.32 | yes | 4838 | 8405 | **0.51** | 9281 | 18600 | 11137 | 10561 (ULS-B-0102) | 170 | 14826 | **0.71** |
| 0.5 | 15.00 | 2905 | 4369 (SLS-S-0148) | -0.94 | yes | 4738 | 8336 | **0.52** | 9307 | 18611 | 11169 | 10816 (ULS-B-0084) | 103 | 14857 | **0.73** |
| 0.6 | 18.00 | 2779 | 4164 (SLS-S-0148) | -1.82 | yes | 4879 | 8446 | **0.49** | 9324 | 18621 | 11189 | 10348 (ULS-B-0084) | 63 | 14877 | **0.70** |
| 0.7 | 21.00 | 2402 | 3611 (SLS-S-0018) | -4.55 | yes | 5399 | 8788 | **0.41** | 9468 | 18628 | 11361 | 8973 (ULS-B-0084) | 7 | 14900 | **0.60** |
| 0.8 | 23.99 | 1773 | 2729 (SLS-S-0018) | -8.39 | yes | 6027 | 9257 | **0.29** | 9467 | 18632 | 11361 | 6721 (ULS-B-0084) | -47 | 14908 | **0.45** |
| 0.9 | 26.99 | 893 | 1564 (SLS-S-0018) | -13.57 | yes | 6901 | 9908 | **0.16** | 9462 | 18634 | 11354 | 3687 (ULS-B-0084) | -170 | 14917 | **0.25** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 153 (SLS-S-0027) | 1437 | -1333 | 0.46 | 274 (ULS-B-0413) | 14847 | 0.02 | 10363 | 18550 |
| 0.2 | 366 (SLS-S-0201) | 1116 | -2212 | 0.23 | 1059 (ULS-B-0413) | 14863 | 0.07 | 10528 | 18569 |
| 0.3 | 524 (SLS-S-0201) | 1085 | -2827 | 0.14 | 1677 (ULS-B-0413) | 14876 | 0.11 | 10581 | 18586 |
| 0.4 | 632 (SLS-S-0201) | 1067 | -3196 | 0.10 | 2085 (ULS-B-0413) | 14887 | 0.14 | 10614 | 18600 |
| 0.5 | 674 (SLS-S-0219) | 1068 | -3314 | 0.09 | 2261 (ULS-B-0431) | 14895 | 0.15 | 10627 | 18611 |
| 0.6 | 636 (SLS-S-0639) | 1785 | -3154 | 0.23 | 2195 (ULS-B-0431) | 14903 | 0.15 | 10429 | 18621 |
| 0.7 | 514 (SLS-S-0639) | 1789 | -2822 | 0.28 | 1884 (ULS-B-0431) | 14908 | 0.13 | 10430 | 18628 |
| 0.8 | 311 (SLS-S-0639) | 1799 | -2256 | 0.37 | 1312 (ULS-B-0431) | 14911 | 0.09 | 10411 | 18632 |
| 0.9 | -14 (SLS-S-0038) | 1366 | -1495 | 0.48 | 386 (ULS-B-0485) | 14912 | 0.03 | 10492 | 18634 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion not checked: fitments and the closed-box torsion geometry are needed; strand development in the transmission zone not checked

## G4

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 2.99 | 944 | 2072 (SLS-S-0021) | -11.69 | yes | 6668 | 9629 | **0.22** | 9281 | 18634 | 11137 | 4292 (ULS-B-0102) | 482 | 14757 | **0.29** |
| 0.2 | 5.98 | 1874 | 3353 (SLS-S-0021) | -6.38 | yes | 5869 | 9066 | **0.37** | 9418 | 18713 | 11302 | 7522 (ULS-B-0102) | 304 | 14876 | **0.51** |
| 0.3 | 8.97 | 2539 | 4297 (SLS-S-0166) | -2.14 | yes | 5143 | 8579 | **0.50** | 9361 | 18766 | 11233 | 9956 (ULS-B-0102) | 227 | 14942 | **0.67** |
| 0.4 | 11.97 | 2938 | 4908 (SLS-S-0166) | 0.29 | yes | 4795 | 8316 | **0.59** | 9414 | 18798 | 11297 | 11566 (ULS-B-0102) | 130 | 14996 | **0.77** |
| 0.5 | 14.96 | 3071 | 5113 (SLS-S-0166) | 1.03 | yes | 4704 | 8258 | **0.62** | 9457 | 18810 | 11348 | 12201 (ULS-B-0102) | -7 | 15048 | **0.81** |
| 0.6 | 17.95 | 2938 | 4961 (SLS-S-0166) | 0.29 | yes | 4845 | 8375 | **0.59** | 9465 | 18806 | 11358 | 11920 (ULS-B-0102) | -68 | 15050 | **0.79** |
| 0.7 | 20.94 | 2539 | 4374 (SLS-S-0166) | -2.16 | yes | 5228 | 8679 | **0.50** | 9448 | 18784 | 11337 | 10560 (ULS-B-0102) | -108 | 15036 | **0.70** |
| 0.8 | 23.93 | 1874 | 3296 (SLS-S-0021) | -6.79 | yes | 5979 | 9195 | **0.36** | 9530 | 18742 | 11437 | 7985 (ULS-B-0102) | -122 | 15002 | **0.53** |
| 0.9 | 26.92 | 944 | 1668 (SLS-S-0021) | -13.07 | yes | 6821 | 9814 | **0.17** | 9437 | 18675 | 11324 | 4025 (ULS-B-0102) | -42 | 14943 | **0.27** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 204 (SLS-S-0347) | 1916 | -1361 | 0.52 | 147 (ULS-B-0413) | 14918 | 0.01 | 10274 | 18634 |
| 0.2 | 446 (SLS-S-0027) | 1433 | -2354 | 0.26 | 956 (ULS-B-0413) | 14978 | 0.06 | 10548 | 18713 |
| 0.3 | 629 (SLS-S-0201) | 1129 | -3016 | 0.12 | 1602 (ULS-B-0413) | 15024 | 0.11 | 10713 | 18766 |
| 0.4 | 755 (SLS-S-0201) | 1143 | -3377 | 0.09 | 2065 (ULS-B-0413) | 15050 | 0.14 | 10750 | 18798 |
| 0.5 | 811 (SLS-S-0917) | 1161 | -3482 | 0.08 | 2319 (ULS-B-0413) | 15062 | 0.15 | 10758 | 18810 |
| 0.6 | 787 (SLS-S-0917) | 1146 | -3380 | 0.08 | 2336 (ULS-B-0413) | 15059 | 0.16 | 10759 | 18806 |
| 0.7 | 676 (SLS-S-0549) | 1859 | -3024 | 0.24 | 2091 (ULS-B-0413) | 15042 | 0.14 | 10544 | 18784 |
| 0.8 | 460 (SLS-S-0549) | 1820 | -2439 | 0.32 | 1553 (ULS-B-0413) | 15006 | 0.10 | 10497 | 18742 |
| 0.9 | 50 (SLS-S-0035) | 1351 | -1603 | 0.44 | 517 (ULS-B-0467) | 14951 | 0.03 | 10528 | 18675 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc
- deck differential shrinkage free strain -79.6 x 1e-6 (losses analysis, detailed method)
- temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone
- shear / torsion not checked: fitments and the closed-box torsion geometry are needed; strand development in the transmission zone not checked

