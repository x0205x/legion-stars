# Copies all reference art into public/assets/intro for the opening cinematic.
$ErrorActionPreference = "Stop"
$projectRoot = if (Test-Path "C:\Users\judah\legion-stars") {
  "C:\Users\judah\legion-stars"
} else {
  Split-Path $PSScriptRoot -Parent
}

$cursorAssets = "C:\Users\judah\.cursor\projects\c-Users-judah-legion-stars\assets"
$introDir = Join-Path $projectRoot "public\assets\intro"
$refDir = Join-Path $projectRoot "public\assets\ref"

New-Item -ItemType Directory -Force -Path $introDir | Out-Null

$semanticMap = @(
  @{ Pattern = "*Turkey*"; Name = "command-tablet.png" },
  @{ Pattern = "*download__31*"; Name = "submarine-surface.png" },
  @{ Pattern = "*download__30*"; Name = "sky-carrier.png" },
  @{ Pattern = "*download__29*"; Name = "harbor-dock.png" },
  @{ Pattern = "*download__27*"; Name = "capital-wormhole.png" },
  @{ Pattern = "*download__28*"; Name = "missile-battery.png" },
  @{ Pattern = "*download__26*"; Name = "orbital-strike.png" },
  @{ Pattern = "*download__25*"; Name = "cliff-fleet.png" }
)

if (Test-Path $cursorAssets) {
  foreach ($file in Get-ChildItem $cursorAssets -File) {
    foreach ($entry in $semanticMap) {
      if ($file.Name -like $entry.Pattern) {
        Copy-Item $file.FullName (Join-Path $introDir $entry.Name) -Force
      }
    }
    Copy-Item $file.FullName (Join-Path $introDir $file.Name) -Force
  }
}

if (Test-Path $refDir) {
  Get-ChildItem $refDir -File | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $introDir $_.Name) -Force
  }
}

$manifestPath = Join-Path $introDir "manifest.json"
$files = Get-ChildItem $introDir -File |
  Where-Object { $_.Name -notin @("manifest.json", "ffmpeg-list.txt", "intro.mp4") } |
  Sort-Object Name |
  Select-Object -ExpandProperty Name

@{
  files = $files
} | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 $manifestPath

Write-Host "Intro assets ready in $introDir"
Write-Host "Files:" (Get-ChildItem $introDir -File).Count
