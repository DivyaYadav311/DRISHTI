@echo off
cd /d "%~dp0"
set NODE_OPTIONS=--openssl-legacy-provider
start "backend" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"
start "frontend" cmd /k "cd /d "%~dp0" && "C:\Program Files\nodejs\npm.cmd" run dev -- --host 127.0.0.1 --port 3000"
