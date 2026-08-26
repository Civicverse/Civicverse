@echo off
title Push Civicverse to GitHub
cd /d "%~dp0"
if exist "Civicverse" cd /d "Civicverse"

echo ===================================================
echo           PUSH CIVICVERSE TO GITHUB
echo ===================================================
echo.
echo Remote target: https://github.com/Civicverse/Civicverse.git
echo Current branch: main
echo.
echo Executing git push...
echo.

git push -u origin main --force

echo.
if %ERRORLEVEL% equ 0 (
    echo ===================================================
    echo  SUCCESS: Successfully pushed to Civicverse repo!
    echo ===================================================
) else (
    echo ===================================================
    echo  Push failed or requires login.
    echo ===================================================
)
echo.
pause
