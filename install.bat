@echo off
rem ============================================
rem Claude Code Open - Windows One-Click Installer
rem This batch file bypasses PowerShell execution policy restrictions.
rem
rem Usage:
rem   Double-click this file, or run in cmd:
rem     install.bat
rem
rem   Or one-liner from cmd (GitHub):
rem     curl -fsSL https://raw.githubusercontent.com/kill136/claude-code-open/private_web_ui/install.bat -o install.bat && install.bat
rem   Or one-liner from cmd (Gitee, for China):
rem     curl -fsSL https://gitee.com/lubanbbs/claude-code-open/raw/private_web_ui/install.bat -o install.bat && install.bat
rem ============================================

chcp 65001 >nul 2>&1

echo.
echo   +=============================================+
echo   ^|        Claude Code Open Installer           ^|
echo   ^|     github.com/kill136/claude-code-open     ^|
echo   +=============================================+
echo.

rem --- Detect script directory (handles both local and downloaded scenarios) ---
set "SCRIPT_DIR=%~dp0"

rem --- Check if install.ps1 exists alongside this bat file ---
if exist "%SCRIPT_DIR%install.ps1" (
    echo [INFO] Found install.ps1 in %SCRIPT_DIR%
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install.ps1" %*
    goto :end
)

rem --- install.ps1 not found locally, download and execute from remote ---
echo [INFO] install.ps1 not found locally, downloading from remote...

rem Try GitHub first, then Gitee
echo [INFO] Trying GitHub...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "try { $r = Invoke-WebRequest -Uri 'https://github.com' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop; $url = 'https://raw.githubusercontent.com/kill136/claude-code-open/private_web_ui/install.ps1' } catch { $url = 'https://gitee.com/lubanbbs/claude-code-open/raw/private_web_ui/install.ps1' }; Write-Host \"[INFO] Downloading from $url\"; try { Invoke-Expression (Invoke-WebRequest -Uri $url -UseBasicParsing).Content } catch { Write-Host \"[ERROR] Failed to download install script: $_\" -ForegroundColor Red; exit 1 }"

:end
if "%1"=="" pause
