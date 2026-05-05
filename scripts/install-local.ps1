param(
  [switch]$SkipPythonInstall,
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

function Resolve-PythonCommand() {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $venvPython = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"
  if (Test-Path $venvPython) {
    return $venvPython
  }

  foreach ($candidate in @("python", "py")) {
    if (Test-Command $candidate) {
      return $candidate
    }
  }

  return $null
}

function Ensure-Python {
  $pythonCommand = Resolve-PythonCommand
  if ($pythonCommand) {
    return $pythonCommand
  }

  if ($SkipPythonInstall) {
    throw "Python is not installed."
  }

  Ensure-WingetInstall "Python.Python.3.11" "Python 3.11"
  $pythonCommand = Resolve-PythonCommand
  if (-not $pythonCommand) {
    throw "Python installation finished, but Python is still not on PATH."
  }

  return $pythonCommand
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

function Ensure-BackendVenv([string]$PythonCommand) {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $backendRoot = Join-Path $repoRoot "backend"
  $venvDir = Join-Path $backendRoot ".venv"
  $venvPython = Join-Path $venvDir "Scripts\python.exe"

  if (-not (Test-Path $venvPython)) {
    Write-Step "Creating backend virtual environment"
    & $PythonCommand -m venv $venvDir
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to create the backend virtual environment."
    }
  }

  Write-Step "Installing backend Python dependencies"
  & $venvPython -m pip install --upgrade pip
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to upgrade pip in the backend virtual environment."
  }

  & $venvPython -m pip install -r (Join-Path $backendRoot "requirements.txt")
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to install backend requirements."
  }

  return $venvPython
}

function Ensure-DataDirectory {
  $dataDir = Join-Path $env:APPDATA "CleanRAG\data"
  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
  return $dataDir
}

$pythonCommand = Ensure-Python
Ensure-Ollama
Wait-ForOllama
$venvPython = Ensure-BackendVenv -PythonCommand $pythonCommand
$dataDir = Ensure-DataDirectory

Write-Step "CleanRAG local Python environment is ready"
Write-Host "Backend Python: $venvPython" -ForegroundColor Green
Write-Host "App data directory: $dataDir" -ForegroundColor Green
Write-Host "Start the backend with: npm run backend:local" -ForegroundColor Green
Write-Host "Then start the desktop app with: npm run dev" -ForegroundColor Green
