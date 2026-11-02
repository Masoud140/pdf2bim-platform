@echo off
rem PDF2BIM web app on Windows: double-click. First run creates .venv and installs the packages (needs Python 3.10+ from python.org).
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (
  py -3 -m venv .venv || python -m venv .venv || (echo Python 3.10+ is needed: https://www.python.org/downloads/ & pause & exit /b 1)
  .venv\Scripts\python -m pip install --upgrade pip
  .venv\Scripts\python -m pip install -r requirements.txt || (echo Package install failed & pause & exit /b 1)
)
start "" http://localhost:8600
.venv\Scripts\python app\server.py
pause
