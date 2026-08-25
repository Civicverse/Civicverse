@echo off
title Civicverse Launcher
cd /d "%~dp0"

echo ===================================================
echo           CIVICVERSE METAVERSE NODE LAUNCHER
echo ===================================================
echo.

if exist "Civicverse.exe" (
    start "" "Civicverse.exe"
    exit /b
)

if exist "Civicverse\Civicverse.exe" (
    start "" "Civicverse\Civicverse.exe"
    exit /b
)

echo Starting Civicverse via Node.js...
npm start
