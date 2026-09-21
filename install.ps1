# ==============================================================================
# Mitti Programming Language — One-Line PowerShell Installer
# Usage:
#   irm https://raw.githubusercontent.com/otabekoff/mitti/master/install.ps1 | iex
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  __  __ _ _   _   _" -ForegroundColor Cyan
Write-Host " |  \/  (_) |_| |_(_)" -ForegroundColor Cyan
Write-Host " | |\/| | | __| __| |" -ForegroundColor Cyan
Write-Host " | |  | | | |_| |_| |" -ForegroundColor Cyan
Write-Host " |_|  |_|_|\__|\__|_|" -ForegroundColor Cyan
Write-Host ""
Write-Host " Mitti Programming Language Installer" -ForegroundColor Green
Write-Host "========================================"

$InstallDir = Join-Path $HOME ".mitti\bin"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$ExePath = Join-Path $InstallDir "mitti.exe"

# Get latest release tag
Write-Host "-> Eng so'nggi versiya tekshirilmoqda..." -ForegroundColor Yellow
$Repo = "otabekoff/mitti"
$DownloadUrl = "https://github.com/$Repo/releases/latest/download/mitti-windows-x64.zip"

$ZipPath = Join-Path $env:TEMP "mitti-windows-x64.zip"

try {
    Write-Host "-> Yuklab olinmoqda: $DownloadUrl" -ForegroundColor Yellow
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing

    Write-Host "-> O'rnatilmoqda: $InstallDir" -ForegroundColor Yellow
    Expand-Archive -Path $ZipPath -DestinationPath (Join-Path $HOME ".mitti") -Force
}
catch {
    Write-Host "-> Direct fallback: v1.0.0 yuklab olinmoqda..." -ForegroundColor Yellow
    $FallbackUrl = "https://github.com/$Repo/releases/download/v1.0.0/mitti-windows-x64.zip"
    Invoke-WebRequest -Uri $FallbackUrl -OutFile $ZipPath -UseBasicParsing
    Expand-Archive -Path $ZipPath -DestinationPath (Join-Path $HOME ".mitti") -Force
}
finally {
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue }
}

# If zip extracted to .mitti root or subfolder, ensure mitti.exe is in bin
$FoundExe = Get-ChildItem (Join-Path $HOME ".mitti") -Filter "mitti.exe" -Recurse | Select-Object -First 1
if ($FoundExe -and ($FoundExe.DirectoryName -ne $InstallDir)) {
    Copy-Item $FoundExe.FullName -Destination $ExePath -Force
}

# Add to User PATH if not present
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallDir*") {
    Write-Host "-> PATH muhitiga qo'shilmoqda ($InstallDir)..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$InstallDir;$UserPath", "User")
    $env:Path = "$InstallDir;" + $env:Path
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Mitti muvaffaqiyatli o'rnatildi!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host " Ishlatish uchun yangi terminal oching va quyidagilarni yozing:"
Write-Host "   mitti --version" -ForegroundColor Cyan
Write-Host "   mitti" -ForegroundColor Cyan
Write-Host ""

