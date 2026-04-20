$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$startupDir = [Environment]::GetFolderPath("Startup")
$launcherPath = Join-Path $startupDir "Nuyu Recovery Backend.cmd"
$starterPath = Join-Path $PSScriptRoot "start-backend.ps1"

$escapedStarter = $starterPath.Replace('"', '""')
$content = @"
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "$escapedStarter"
"@

Set-Content -Path $launcherPath -Value $content -Encoding ASCII

Write-Output "Installed backend auto-start launcher at: $launcherPath"
