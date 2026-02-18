@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo   +=============================================+
echo   ^|       Claude Code Open - WebUI              ^|
echo   +=============================================+
echo.

set "INSTALL_DIR=%USERPROFILE%\.claude-code-open"

if not exist "%INSTALL_DIR%" (
    echo [ERROR] Installation directory not found: %INSTALL_DIR%
    echo         Please run the installer first.
    goto :error_exit
)
cd /d "%INSTALL_DIR%"

REM --- Use portable Node.js if available ---
if exist "%INSTALL_DIR%\.node\node.exe" (
    set "PATH=%INSTALL_DIR%\.node;%PATH%"
    echo [OK] Using portable Node.js from .node\
)

REM --- Verify node is available ---
where node >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js v22 LTS or re-run the installer.
    goto :error_exit
)

echo [INFO] Starting Claude Code WebUI...
echo.

node_modules\.bin\tsx.cmd src\web-cli.ts --evolve -H 0.0.0.0

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
