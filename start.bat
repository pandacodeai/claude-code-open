@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo   +=============================================+
echo   ^|          Axon - WebUI                       ^|
echo   +=============================================+
echo.

REM --- Switch to script directory ---
cd /d "%~dp0"

REM --- Check if node is available ---
where node >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js is not installed.
    echo         Please download from https://nodejs.org/
    echo         Or use install.bat for automatic setup.
    goto :error_exit
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do echo [OK] Node.js %%v

REM --- Check if dist/web-cli.js exists ---
if not exist "dist\web-cli.js" (
    echo [ERROR] dist/web-cli.js not found.
    echo         This package may be incomplete.
    goto :error_exit
)

echo.
echo [INFO] Starting Axon WebUI...
echo [INFO] Open http://localhost:3456 in your browser
echo [INFO] Press Ctrl+C to stop the server
echo.

node dist/web-cli.js

if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Application exited with error code !errorlevel!
    goto :error_exit
)
goto :end

:error_exit
echo.
echo Press any key to exit...
pause >nul
exit /b 1

:end
pause
