#!/usr/bin/env bash
# Build the single-file dashboard: dist/BR13A_grillage_dashboard.html (override with OUT=path)
set -euo pipefail
cd "$(dirname "$0")/src"
bash mk19.sh
