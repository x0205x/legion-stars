# Builds Conquer the Universe Windows .exe using system Node (not Cursor's shim).
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/pack-windows.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/pack-windows.ps1 -Target portable
param(
  [ValidateSet("all", "portable", "installer")]
  [string]$Target = "all"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

$NodeHome = "${env:ProgramFiles}\nodejs"
if (-not (Test-Path "$NodeHome\node.exe")) {
  Write-Host ""
  Write-Host "ERROR: Node.js was not found at $NodeHome" -ForegroundColor Red
  Write-Host "Install the LTS build from https://nodejs.org/ then run this script again."
  Write-Host ""
  exit 1
}

if (-not (Test-Path "$ProjectRoot\build\icon.png")) {
  Write-Host ""
  Write-Host "ERROR: Missing build\icon.png (app icon for the .exe)." -ForegroundColor Red
  Write-Host ""
  exit 1
}

$cleanPath = ($env:Path -split ";" | Where-Object {
  $_ -and $_ -notmatch "\\cursor\\" -and $_ -notmatch "cursor\\resources"
}) -join ";"
$env:Path = "$NodeHome;$cleanPath"
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"

$Log = Join-Path $ProjectRoot "pack.log"

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
  Write-Host $line
  Add-Content -Path $Log -Value $line -Encoding utf8
}

function Invoke-NpmCommand {
  param([Parameter(Mandatory = $true)][string[]]$Command)

  $quoted = ($Command | ForEach-Object { if ($_ -match '\s') { "`"$_`"" } else { $_ } }) -join " "
  Log ">> corepack npm $quoted"

  # Do not use Tee-Object on the log file (mixes UTF-16 and breaks pack.log).
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & corepack npm @Command 2>&1 | ForEach-Object {
    $text = $_.ToString()
    Write-Host $text
    Add-Content -Path $Log -Value $text -Encoding utf8
  }
  $exit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap

  if ($exit -ne 0) {
    throw "corepack npm $quoted failed (exit $exit)"
  }
}

function Invoke-ElectronBuilder {
  param([Parameter(Mandatory = $true)][string[]]$Command)

  $builder = Join-Path $ProjectRoot "node_modules\.bin\electron-builder.cmd"
  if (-not (Test-Path $builder)) {
    throw "electron-builder not found. Run npm install first."
  }

  $quoted = ($Command | ForEach-Object { if ($_ -match '\s') { "`"$_`"" } else { $_ } }) -join " "
  Log ">> electron-builder $quoted"

  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $builder @Command 2>&1 | ForEach-Object {
    $text = $_.ToString()
    Write-Host $text
    Add-Content -Path $Log -Value $text -Encoding utf8
  }
  $exit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap

  if ($exit -ne 0) {
    throw "electron-builder $quoted failed (exit $exit)"
  }
}

"" | Set-Content $Log -Encoding utf8
Log "Project: $ProjectRoot"
Log "Node:    $(& "$NodeHome\node.exe" -v)"
Log ("npm:     " + (corepack npm -v 2>&1 | Out-String).Trim())

try {
  Log "Running npm install..."
  Invoke-NpmCommand -Command @("install")

  Log "Running vite build..."
  Invoke-NpmCommand -Command @("run", "build")

  $releaseDir = Join-Path $ProjectRoot "release"
  if (Test-Path $releaseDir) {
    Log "Cleaning release folder (close any running game .exe first)..."
    Get-Process -ErrorAction SilentlyContinue |
      Where-Object { $_.ProcessName -match "Conquer|electron" -and $_.Path -like "*$([regex]::Escape($ProjectRoot))*" } |
      ForEach-Object {
        Log "Stopping locked process: $($_.ProcessName)"
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
      }
    Start-Sleep -Seconds 1
    Remove-Item -Path $releaseDir -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
  }

  $builderArgs = @()
  switch ($Target) {
    "portable" { $builderArgs = @("--win", "portable", "--x64") }
    "installer" { $builderArgs = @("--win", "nsis", "--x64") }
    default { $builderArgs = @("--win", "--x64") }
  }

  Log "Running electron-builder ($Target)..."
  Invoke-ElectronBuilder -Command $builderArgs
}
catch {
  Log "FAILED: $($_.Exception.Message)"
  Log "See pack.log for full output."
  exit 1
}

Log "SUCCESS. Outputs in release\"
Get-ChildItem (Join-Path $ProjectRoot "release") -File -ErrorAction SilentlyContinue |
  ForEach-Object { Log "  - $($_.Name)" }

exit 0
