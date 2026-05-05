param(
  [switch]$SkipDockerInstall,
  [switch]$SkipOllamaInstall
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-Command([string]$CommandName, [string[]]$Arguments = @("--version")) {
  try {
    $null = & $CommandName @Arguments 2>$null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Ensure-WingetInstall([string]$PackageId, [string]$DisplayName) {
  if (-not (Test-Command "winget")) {
    throw "winget is required to install $DisplayName automatically."
  }

  Write-Step "Installing $DisplayName"
  winget install --id $PackageId --exact --accept-package-agreements --accept-source-agreements
}

function Ensure-Docker {
  if (Test-Command "docker" @("compose", "version")) {
    return
  }

  if ($SkipDockerInstall) {
    throw "Docker Desktop is not installed."
  }

  Ensure-WingetInstall "Docker.DockerDesktop" "Docker Desktop"
}

function Ensure-Ollama {
  if (Test-Command "ollama") {
    return
  }

  if ($SkipOllamaInstall) {
    throw "Ollama is not installed."
  }

  Ensure-WingetInstall "Ollama.Ollama" "Ollama"
}

function Wait-ForDocker {
  Write-Step "Starting Docker Desktop"
  $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktop) {
    Start-Process -FilePath $dockerDesktop | Out-Null
  }

  $attempts = 0
  while ($attempts -lt 90) {
    if (Test-Command "docker" @("info")) {
      return
    }
    Start-Sleep -Seconds 2
    $attempts += 1
  }

  throw "Docker Desktop did not become ready in time."
}

function Wait-ForOllama {
  Write-Step "Starting Ollama"
  $ollamaExe = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama app.exe"
  if (Test-Path $ollamaExe) {
    Start-Process -FilePath $ollamaExe | Out-Null
  }

  $attempts = 0
  while ($attempts -lt 60) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:11434/api/tags" -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        return
      }
    } catch {
      # Keep polling.
    }
    Start-Sleep -Seconds 2
    $attempts += 1
  }

  throw "Ollama did not become ready in time."
}

function Start-BackendContainer {
  Write-Step "Building and starting the CleanRAG backend container"
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $dataDir = Join-Path $env:APPDATA "CleanRAG\data"
  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
  $env:CLEANRAG_DATA_DIR = $dataDir
  $env:CLEANRAG_PORT = "8777"
  docker compose -f (Join-Path $repoRoot "backend\compose.local.yml") up -d --build backend
}

Ensure-Docker
Ensure-Ollama
Wait-ForDocker
Wait-ForOllama
Start-BackendContainer

Write-Step "CleanRAG local container environment is ready"
Write-Host "Docker Desktop is running, Ollama is reachable, and the backend container is up on http://127.0.0.1:8777." -ForegroundColor Green

