@echo off
echo Starting Calm Flow Desktop App...
cd /d "%~dp0"
npm run build
npm run electron
pause
