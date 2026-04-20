$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$serverDir = Join-Path $root "server"
$logsDir = Join-Path $root ".logs"
$stdoutLog = Join-Path $logsDir "backend-auto.log"
$stderrLog = Join-Path $logsDir "backend-auto.err.log"

if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$listener = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  Write-Output "Nuyu backend is already listening on port 4000."
  exit 0
}

$nodeCommand = Get-Command node -ErrorAction Stop
$nodePath = $nodeCommand.Source

Push-Location $root
try {
  npm run build --workspace server | Out-Null
} finally {
  Pop-Location
}

if (Test-Path $stdoutLog) {
  Remove-Item $stdoutLog -Force -ErrorAction SilentlyContinue
}

if (Test-Path $stderrLog) {
  Remove-Item $stderrLog -Force -ErrorAction SilentlyContinue
}

$process = Start-Process `
  -FilePath $nodePath `
  -ArgumentList "dist/index.js" `
  -WorkingDirectory $serverDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

Start-Sleep -Seconds 4

$confirmedListener = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
if (-not $confirmedListener) {
  $stderr = if (Test-Path $stderrLog) { Get-Content $stderrLog -Raw } else { "" }
  throw "The backend did not start correctly. $stderr"
}

Write-Output "Nuyu backend started successfully. PID: $($process.Id)"
