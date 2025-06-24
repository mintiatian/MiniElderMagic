@echo off
set PORT=63342
set FILE=MapEditor.html
cd /d "%~dp0"

rem ターミナルを残して http-server を起動
start "HTTP Server" cmd /k "http-server -p %PORT%"

rem ちょっと待ってブラウザを開く
timeout /t 1 >nul
start "" "http://localhost:%PORT%/%FILE%"
