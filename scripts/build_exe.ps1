$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}
if (-not (Test-Path $csc)) {
    Write-Error "Microsoft .NET C# compiler (csc.exe) was not found."
    exit 1
}

$repoDir = Split-Path -Parent $PSScriptRoot
$iconPath = Join-Path $repoDir "app.ico"
$srcPath = Join-Path $repoDir "CivicverseLauncher.cs"
$outPath = Join-Path $repoDir "Civicverse.exe"

Write-Host "Compiling Civicverse.exe..."
& $csc /target:winexe /win32icon:"$iconPath" /out:"$outPath" /r:System.dll,System.Windows.Forms.dll,System.Drawing.dll,System.Data.dll "$srcPath"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully built $outPath"
} else {
    Write-Error "Build failed with exit code $LASTEXITCODE"
}
