# BR13A — MIDAS run 2026-10-28f: earthquake with member self weight as mass

- File: commit d9664c3 (SW_mass = member self weight as beam loads, converted by *LOADTOMASS with SDL; *STRUCTYPE unchanged —
  MIDAS warns "The Convert Self Weight into Masses option is not applied", as intended). Owner run 2026-10-28 14:31,
  `Results_mass_fix.xlsx` (Sheet1 = element forces, Sheet2 = displacements).

## Earthquake EQ_L / EQ_T (pile and girder element end actions, |values|)
| Platform model compared | Piles worst | Girders worst | Median ratio | T1 |
|---|---|---|---|---|
| Platform as built (consistent mass, X Y Z, + missing mass) | 2.9 / 8.6 % | 38.7 / 19.8 % | 1.004-1.018 | 0.562 s |
| Platform, mass lumped at nodes, X Y only (= MIDAS *LOADTOMASS XY) | 0.1 / 0.1 % | 0.4 / 0.9 % | 1.000-1.002 | 0.562 s |

- **Export verified:** MIDAS = the platform with MIDAS's mass idealisation, to 0.1-0.9 %. The 0.3 field on *SPLDCASE does NOT add an
  orthogonal component (EQ_L = L alone fits; L + 0.3 T does not).
- **Remaining difference = mass idealisation, not an error:** with no vertical mass (Loads to Masses direction X, Y) MIDAS's girder
  vertical moments under horizontal earthquake are up to ~39 % (L) / ~20 % (T) lower than the platform's, which carries vertical
  mass (consistent beam mass) — coupled torsional / rocking modes move mass vertically. Piles barely change.
- Open: whether to export the mass in X, Y, Z (MIDAS dialog option "X, Y, Z"; the *LOADTOMASS token for it is not yet verified).
