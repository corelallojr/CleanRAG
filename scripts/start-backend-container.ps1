$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $env:APPDATA "CleanRAG\data"
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
$env:CLEANRAG_DATA_DIR = $dataDir
$env:CLEANRAG_PORT = "8777"
docker compose -f (Join-Path $repoRoot "backend\compose.local.yml") up -d --build backend
