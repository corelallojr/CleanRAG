$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "backend"
$venvPython = Join-Path $backendRoot ".venv\Scripts\python.exe"
$dataDir = Join-Path $env:APPDATA "CleanRAG\data"

if (-not (Test-Path $venvPython)) {
  throw "Backend virtual environment not found. Run .\scripts\install-local.ps1 first."
}

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
$env:CLEANRAG_DATA_DIR = $dataDir
$env:CLEANRAG_PORT = "8777"

Push-Location $backendRoot
try {
  & $venvPython -m app.main
} finally {
  Pop-Location
}
