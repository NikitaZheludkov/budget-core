@echo off
echo Zapusk Budget Core...
echo Ne zakryvayte eto okno, poka rabotaete s prilozheniem!
echo.
cd /d "%~dp0"
start "" "http://localhost:3000"
npm run dev
pause