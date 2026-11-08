#!/bin/sh
# Rebuild the SB42 span descriptions from the drawings (ADR-062): values -> new description per span -> generic missing-input proposals (D-1, PROPOSED).
set -e
cd "$(dirname "$0")/../.."
python3 projects/B12461/extraction/values.py
for S in S1 S2; do
  D=projects/B12461-$S
  mkdir -p $D
  rm -f $D/B12461-$S.bridge.0.2.json $D/B12461-$S.decisions.jsonl $D/B12461-$S.bridge.0.2.new.md
  rm -rf $D/history
  python3 tools/new_description.py projects/B12461/extraction/B12461-${S}_description_values.json --out $D/B12461-$S.bridge.0.2.json
  python3 -c "import sys; sys.path.insert(0, '.'); from pdf2bim.extract.propose_missing import propose_defaults; print('proposed', propose_defaults('$D/B12461-$S.bridge.0.2.json'))"
done
