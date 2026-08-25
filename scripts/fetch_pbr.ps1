# Interactive PowerShell script to download PBR textures into frontend/public/textures
# It prompts for a base URL for a texture pack and downloads common maps: albedo, normal, roughness, metalness
# Example usage: run from repo root with PowerShell: `./scripts/fetch_pbr.ps1`

$targetDir = "frontend/public/textures"
if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }

Write-Host "This script will download PBR maps into $targetDir"
$packName = Read-Host "Enter pack name (used as local file prefix, e.g. plaza, island, ocean, suit)"
$baseUrl = Read-Host "Enter base URL where files are hosted (no trailing slash). Example: https://cdn.example.com/pack"

$maps = @("albedo", "normal", "roughness", "metalness")
foreach ($map in $maps) {
    $url = "$baseUrl/$packName`_$map.jpg"
    $out = Join-Path $targetDir "$packName`_$map.jpg"
    try {
        Write-Host "Downloading $url -> $out"
        Invoke-WebRequest -Uri $url -OutFile $out -ErrorAction Stop
    } catch {
        Write-Host "Failed to download $url (skipping)"
    }
}

Write-Host "Done. Place additional PBR packs by repeating the script or add files manually."
