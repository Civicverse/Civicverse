# Civicverse Self-Hosted Local Node Launcher
$ErrorActionPreference = "Stop"
$repoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoDir

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   CIVICVERSE SELF-HOSTED NODE (WINDOWS 11)   " -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Starting Backend API (Port 3003)..." -ForegroundColor Green
Write-Host "Starting Multiplayer Engine (Port 8080)..." -ForegroundColor Green
Write-Host "Starting Frontend Web Client (Port 3000)..." -ForegroundColor Green
Write-Host "Opening http://localhost:3000 in browser..." -ForegroundColor Cyan

# Start all workspaces concurrently
npm start
