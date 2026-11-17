#!/bin/sh
# Rebuild the SB41 EB span descriptions from the drawings (ADR-062): values -> new description per span -> generic missing-input proposals (D-1, PROPOSED).
set -e
cd "$(dirname "$0")/../.."
python3 projects/B12460/extraction/values.py
for S in S1 S2 S3 S4; do
  D=projects/B12460-$S
  mkdir -p $D
  rm -f $D/B12460-$S.bridge.0.2.json $D/B12460-$S.decisions.jsonl $D/B12460-$S.bridge.0.2.new.md
  rm -rf $D/history
  python3 tools/new_description.py projects/B12460/extraction/B12460-${S}_description_values.json --out $D/B12460-$S.bridge.0.2.json
  python3 -c "import sys; sys.path.insert(0, '.'); from pdf2bim.extract.propose_missing import propose_defaults; print('proposed', propose_defaults('$D/B12460-$S.bridge.0.2.json'))"
done
