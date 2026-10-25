# Super-T girder checks along the girders (P4.5 stage 6) — INDICATIVE

Staged SLS (girder alone under prestress + Mnc, then composite), decompression Mdec, allowable moment Mal (Table 8.6.2.1 increments), cracking moment Mcr and minimum strength Muo >= 1.2 Mcr, ULS bending with the concurrent axial force. Effective prestress from the ported losses analysis (D-42 Assumed inputs); strand / bar layout an Assumed placeholder (D-1); standards values code-extracted-UNVERIFIED. **Not design-approved.** Not checked: shear / torsion (fitments missing), strand development, temperature-gradient primary stresses, differential shrinkage.

## G1

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.02 | 836 | 1498 (SLS-S-0018) | -13.07 | yes | 6590 | 9784 | **0.15** | 9078 | 18459 | 10894 | 3804 (ULS-B-0084) | 205 | 14700 | **0.26** |
| 0.2 | 6.03 | 1659 | 2978 (SLS-S-0018) | -7.21 | yes | 5775 | 9212 | **0.32** | 9080 | 18399 | 10896 | 7356 (ULS-B-0084) | 144 | 14671 | **0.50** |
| 0.3 | 9.05 | 2248 | 3937 (SLS-S-0148) | -3.15 | yes | 5156 | 8757 | **0.45** | 9045 | 18355 | 10854 | 9648 (ULS-B-0084) | 206 | 14616 | **0.66** |
| 0.4 | 12.06 | 2601 | 4384 (SLS-S-0148) | -1.00 | yes | 4771 | 8466 | **0.52** | 9011 | 18327 | 10813 | 10696 (ULS-B-0084) | 249 | 14581 | **0.73** |
| 0.5 | 15.08 | 2719 | 4442 (SLS-S-0148) | -0.52 | yes | 4641 | 8364 | **0.53** | 8997 | 18322 | 10797 | 10789 (ULS-B-0084) | 274 | 14570 | **0.74** |
| 0.6 | 18.10 | 2601 | 4237 (SLS-S-0148) | -1.36 | yes | 4763 | 8448 | **0.50** | 9004 | 18341 | 10804 | 10177 (ULS-B-0084) | 304 | 14573 | **0.70** |
| 0.7 | 21.11 | 2248 | 3657 (SLS-S-0148) | -3.82 | yes | 5137 | 8719 | **0.42** | 9029 | 18380 | 10834 | 8681 (ULS-B-0084) | 312 | 14600 | **0.59** |
| 0.8 | 24.13 | 1659 | 2744 (SLS-S-0018) | -7.72 | yes | 5745 | 9155 | **0.30** | 9054 | 18434 | 10865 | 6396 (ULS-B-0084) | 291 | 14652 | **0.44** |
| 0.9 | 27.14 | 836 | 1477 (SLS-S-0018) | -13.15 | yes | 6611 | 9794 | **0.15** | 9104 | 18505 | 10924 | 3327 (ULS-B-0084) | 106 | 14769 | **0.23** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -506 (SLS-S-0030) | -254 | -1818 | 0.16 | 4 (ULS-B-0431) | 14783 | 0.00 | 11120 | 18459 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc; free strains (gradient primary stresses, differential shrinkage) not applied
- shear / torsion not checked: fitments and the closed-box torsion geometry are needed; strand development in the transmission zone not checked

## G2

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.01 | 898 | 1864 (SLS-S-0021) | -11.80 | yes | 6483 | 9650 | **0.19** | 9042 | 18549 | 10850 | 4206 (ULS-B-0102) | 381 | 14717 | **0.29** |
| 0.2 | 6.02 | 1783 | 2843 (SLS-S-0021) | -7.25 | yes | 5682 | 9090 | **0.31** | 9127 | 18569 | 10952 | 6900 (ULS-B-0102) | 216 | 14786 | **0.47** |
| 0.3 | 9.02 | 2415 | 3638 (SLS-S-0018) | -3.74 | yes | 5103 | 8671 | **0.42** | 9180 | 18585 | 11016 | 8999 (ULS-B-0084) | 104 | 14835 | **0.61** |
| 0.4 | 12.03 | 2794 | 4151 (SLS-S-0148) | -1.48 | yes | 4732 | 8385 | **0.50** | 9190 | 18600 | 11028 | 10312 (ULS-B-0084) | 100 | 14848 | **0.69** |
| 0.5 | 15.04 | 2921 | 4322 (SLS-S-0148) | -0.75 | yes | 4618 | 8298 | **0.52** | 9203 | 18612 | 11044 | 10726 (ULS-B-0084) | 82 | 14863 | **0.72** |
| 0.6 | 18.05 | 2794 | 4224 (SLS-S-0148) | -1.35 | yes | 4754 | 8402 | **0.50** | 9214 | 18621 | 11057 | 10389 (ULS-B-0084) | 59 | 14878 | **0.70** |
| 0.7 | 21.05 | 2415 | 3763 (SLS-S-0018) | -3.54 | yes | 5152 | 8712 | **0.43** | 9234 | 18628 | 11080 | 9141 (ULS-B-0084) | -0 | 14903 | **0.61** |
| 0.8 | 24.06 | 1783 | 2967 (SLS-S-0018) | -7.17 | yes | 5786 | 9193 | **0.32** | 9236 | 18633 | 11083 | 7037 (ULS-B-0084) | -69 | 14910 | **0.47** |
| 0.9 | 27.07 | 898 | 1746 (SLS-S-0018) | -12.48 | yes | 6653 | 9840 | **0.18** | 9219 | 18635 | 11063 | 3928 (ULS-B-0084) | -162 | 14917 | **0.26** |

### Hogging / top face

| t | Ms* min (SLS row) | MdecT | MalT | uST | M* min (ULS row) | phi Mu | M*/phi Mu | 1.2 McrH | Muo |
|---|---|---|---|---|---|---|---|---|---|
| 0.1 | -2 (SLS-S-0027) | 26 | -1475 | 0.02 | 204 (ULS-B-0413) | 14845 | 0.01 | 10939 | 18549 |

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc; free strains (gradient primary stresses, differential shrinkage) not applied
- shear / torsion not checked: fitments and the closed-box torsion geometry are needed; strand development in the transmission zone not checked

## G3

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 3.00 | 893 | 2027 (SLS-S-0021) | -11.42 | yes | 6496 | 9664 | **0.21** | 9050 | 18550 | 10860 | 4386 (ULS-B-0102) | 290 | 14747 | **0.30** |
| 0.2 | 6.00 | 1773 | 3178 (SLS-S-0021) | -6.34 | yes | 5663 | 9059 | **0.35** | 9098 | 18569 | 10918 | 7383 (ULS-B-0102) | 294 | 14762 | **0.50** |
| 0.3 | 9.00 | 2402 | 3919 (SLS-S-0166) | -2.96 | yes | 5077 | 8631 | **0.45** | 9142 | 18586 | 10970 | 9409 (ULS-B-0102) | 231 | 14795 | **0.64** |
| 0.4 | 12.00 | 2779 | 4319 (SLS-S-0166) | -1.05 | yes | 4731 | 8376 | **0.52** | 9174 | 18600 | 11009 | 10561 (ULS-B-0102) | 170 | 14826 | **0.71** |
| 0.5 | 15.00 | 2905 | 4369 (SLS-S-0148) | -0.67 | yes | 4631 | 8306 | **0.53** | 9200 | 18611 | 11040 | 10816 (ULS-B-0084) | 103 | 14857 | **0.73** |
| 0.6 | 18.00 | 2779 | 4164 (SLS-S-0148) | -1.55 | yes | 4772 | 8417 | **0.49** | 9217 | 18621 | 11060 | 10348 (ULS-B-0084) | 63 | 14877 | **0.70** |
| 0.7 | 21.00 | 2402 | 3611 (SLS-S-0018) | -3.94 | yes | 5160 | 8715 | **0.41** | 9228 | 18628 | 11074 | 8973 (ULS-B-0084) | 7 | 14900 | **0.60** |
| 0.8 | 23.99 | 1773 | 2729 (SLS-S-0018) | -7.78 | yes | 5787 | 9190 | **0.30** | 9228 | 18632 | 11073 | 6721 (ULS-B-0084) | -47 | 14908 | **0.45** |
| 0.9 | 26.99 | 893 | 1564 (SLS-S-0018) | -12.96 | yes | 6660 | 9848 | **0.16** | 9222 | 18634 | 11066 | 3687 (ULS-B-0084) | -170 | 14917 | **0.25** |

### Hogging / top face

No station with a hogging ULS moment or an SLS moment below the top-face decompression moment.

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc; free strains (gradient primary stresses, differential shrinkage) not applied
- shear / torsion not checked: fitments and the closed-box torsion geometry are needed; strand development in the transmission zone not checked

## G4

### Sagging

| t | x (m) | Mnc | Ms* (SLS row) | soffit at Ms* (MPa) | uncracked | Mdec | Mal | Ms*/Mal | Mcr | Muo | 1.2 Mcr | M* (ULS row) | N* | phi Mu | M*/phi Mu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1 | 2.99 | 944 | 2072 (SLS-S-0021) | -11.08 | yes | 6428 | 9570 | **0.22** | 9041 | 18634 | 10849 | 4292 (ULS-B-0102) | 482 | 14757 | **0.29** |
| 0.2 | 5.98 | 1874 | 3353 (SLS-S-0021) | -5.76 | yes | 5627 | 8999 | **0.37** | 9176 | 18713 | 11011 | 7522 (ULS-B-0102) | 304 | 14876 | **0.51** |
| 0.3 | 8.97 | 2539 | 4297 (SLS-S-0166) | -1.86 | yes | 5034 | 8552 | **0.50** | 9252 | 18766 | 11102 | 9956 (ULS-B-0102) | 227 | 14942 | **0.67** |
| 0.4 | 11.97 | 2938 | 4908 (SLS-S-0166) | 0.56 | yes | 4685 | 8288 | **0.59** | 9305 | 18798 | 11166 | 11566 (ULS-B-0102) | 130 | 14996 | **0.77** |
| 0.5 | 14.96 | 3071 | 5113 (SLS-S-0166) | 1.31 | yes | 4594 | 8229 | **0.62** | 9347 | 18810 | 11217 | 12201 (ULS-B-0102) | -7 | 15048 | **0.81** |
| 0.6 | 17.95 | 2938 | 4961 (SLS-S-0166) | 0.57 | yes | 4735 | 8347 | **0.59** | 9355 | 18806 | 11227 | 11920 (ULS-B-0102) | -68 | 15050 | **0.79** |
| 0.7 | 20.94 | 2539 | 4374 (SLS-S-0166) | -1.88 | yes | 5119 | 8652 | **0.51** | 9338 | 18784 | 11206 | 10560 (ULS-B-0102) | -108 | 15036 | **0.70** |
| 0.8 | 23.93 | 1874 | 3296 (SLS-S-0021) | -6.17 | yes | 5736 | 9128 | **0.36** | 9287 | 18742 | 11145 | 7985 (ULS-B-0102) | -122 | 15002 | **0.53** |
| 0.9 | 26.92 | 944 | 1668 (SLS-S-0021) | -12.46 | yes | 6579 | 9754 | **0.17** | 9195 | 18675 | 11034 | 4025 (ULS-B-0102) | -42 | 14943 | **0.27** |

### Hogging / top face

No station with a hogging ULS moment or an SLS moment below the top-face decompression moment.

- crack-control limits (Table 8.6.2.1 as coded): fscr 240 MPa (db 20 mm), fscrT 330 MPa (db 12 mm), ftcr 200 MPa
- axial force with the moments: concurrent N of the governing row (useN); losses method detailed, time 3650 d
- fpb = MBL / area = 1786 MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty
- Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc; free strains (gradient primary stresses, differential shrinkage) not applied
- shear / torsion not checked: fitments and the closed-box torsion geometry are needed; strand development in the transmission zone not checked

