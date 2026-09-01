@echo off
setlocal enabledelayedexpansion
title Push Civicverse to GitHub
cd /d "%~dp0"
if exist "Civicverse" cd /d "Civicverse"

:: Ensure Git is in PATH
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\Git\cmd" set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;!PATH!"
    if exist "C:\Program Files\Git\cmd" set "PATH=C:\Program Files\Git\cmd;!PATH!"
    if exist "C:\Program Files (x86)\Git\cmd" set "PATH=C:\Program Files (x86)\Git\cmd;!PATH!"
)

echo ===================================================
echo           PUSH CIVICVERSE TO GITHUB
echo ===================================================
echo.
echo Remote target: https://github.com/Civicverse/Civicverse.git
echo Current branch: main
echo.
echo Staging and committing changes...
git add -A
git commit -m "Deploy GitHub Pages MVP: relative assets, hash routing, offline fallbacks, and workflow remediation"
echo.
echo Executing git push to origin main...
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ===================================================
    echo  SUCCESS: Successfully pushed to Civicverse repo!
    echo ===================================================
) else (
    echo ===================================================
    echo  Push completed or requires authentication credentials.
    echo ===================================================
)
echo.
pause
