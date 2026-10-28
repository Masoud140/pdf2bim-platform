# BR13A — MIDAS run 2026-10-28g: earthquake with mass direction X, Y, Z

- File: commit d9664c3, Loads to Masses direction changed to X, Y, Z in MIDAS by the owner. Run 2026-10-28 15:29, `Results_mass_XYZ.xlsx`.

| Platform model compared | T1 | Piles L / T | Girders L / T |
|---|---|---|---|
| As built (consistent member mass at the centroids, X Y Z) | 0.562 s | 4.5 / 10.7 % | 22.2 / 24.3 % |
| Mass lumped at the nodes, X Y Z (= MIDAS Loads to Masses) | 0.563 s | 0.0 / 0.1 % | 0.4 / 0.9 % |
| Mass lumped at the nodes, X Y only | 0.562 s | 3.7 / 5.2 % | 53.5 / 34.6 % |

- **Export verified**: MIDAS = platform with the same mass idealisation to 0.0-0.9 % (regression test `test_midas_run.py`, 0.79 %).
- **Known difference (kept, agent default — owner may overrule):** the platform's RSA uses consistent member mass at the member
  centroids (0.3-0.7 m below the deck-top node line); MIDAS lumps the converted mass at the nodes. Girder EQ moments differ by up to
  ~24 %, pile actions by up to ~11 %. The platform's idealisation is kept as the more faithful one.
- Exporter now writes *LOADTOMASS direction `XYZ` (owner's choice); the token is unverified until the next import (XY is verified).
