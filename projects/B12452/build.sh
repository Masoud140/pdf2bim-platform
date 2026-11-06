#!/bin/sh
# Rebuild the SB01 description from the drawings: values -> new description -> generic missing-input proposals (D-1, PROPOSED).
set -e
cd "$(dirname "$0")/../.."
python3 projects/B12452/extraction/values.py
rm -f projects/B12452/B12452.bridge.0.2.json projects/B12452/B12452.decisions.jsonl projects/B12452/B12452.bridge.0.2.new.md
rm -rf projects/B12452/history
python3 tools/new_description.py projects/B12452/extraction/B12452_description_values.json --out projects/B12452/B12452.bridge.0.2.json
python3 -c "import sys; sys.path.insert(0, '.'); from pdf2bim.extract.propose_missing import propose_defaults; print('proposed', propose_defaults('projects/B12452/B12452.bridge.0.2.json'))"
