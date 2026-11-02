#!/usr/bin/env bash
# PDF2BIM web app on macOS / Linux: ./start_app.sh  (first run creates .venv and installs the packages)
set -e
cd "$(dirname "$0")"
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
  .venv/bin/python -m pip install --upgrade pip
  .venv/bin/python -m pip install -r requirements.txt
fi
( sleep 2; (command -v open >/dev/null && open http://localhost:8600) || (command -v xdg-open >/dev/null && xdg-open http://localhost:8600) || true ) &
exec .venv/bin/python app/server.py
