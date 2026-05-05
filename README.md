# CleanRAG

CleanRAG is a Windows-first local desktop app for simple RAG with small Ollama models. It is designed for non-technical users who want ChatGPT-style chat, projects, drag-and-drop document ingestion, local model installs, and fully local storage after setup.

## What this repo contains

- `Electron + React + TypeScript` desktop app
- `FastAPI` local backend
- `SQLite` chat and metadata storage
- `LanceDB` local vector index
- OCR for common image files
- Structured data refresh flow for `CSV` and `XLSX` that replaces the active dataset snapshot without duplicating active rows

## Supported source types

- `PDF`
- `DOCX`
- `TXT`
- `Markdown`
- `CSV`
- `XLSX`
- `JSON`
- `PNG`, `JPG`, `JPEG` through local OCR

## Recommended local models

- Chat: `qwen2.5:3b`
- Embeddings: `nomic-embed-text:latest`

## Simple local install path

For non-technical users, the preferred setup is now:

1. Install `Docker Desktop` for Windows.
2. Install `Ollama` for Windows.
3. Run the setup helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1
```

This helper:

- verifies or installs Docker Desktop
- verifies or installs Ollama
- starts Docker Desktop and waits for it
- waits for Ollama to respond locally
- builds and starts the CleanRAG backend container

After that, open the desktop app and use the `Models` screen to install the recommended local models.

## Developer install path

If you want to run the renderer in development, use:

```powershell
npm install
npm run dev
```

The desktop app will prefer the Docker-backed backend automatically. If Docker is unavailable, it falls back to a local Python backend.

The app checks:

- local data folder
- Ollama availability
- recommended chat model
- recommended embedding model

If you explicitly want to run only the backend container:

```powershell
npm run backend:container
```

## Package a Windows installer

```powershell
npm run package
```

This builds the desktop app and creates a Windows installer through `electron-builder`.

## Product structure

- `Chats`: ChatGPT-style conversations scoped to a project
- `Projects`: top-level workspaces for sources and chats
- `Sources`: drag-and-drop source setup and reindexing
- `Models`: local Ollama model management
- `Settings`: runtime and setup notes

## Structured data refresh behavior

When a user uploads an updated `CSV` or `XLSX` into an existing source:

- the source is treated as a replacement snapshot
- active rows are recomputed from the new file
- duplicate active rows are prevented through stable row identity and deterministic hashing fallback
- removed rows stop appearing in active retrieval
- new rows become searchable after reindexing

## API surface

- `GET /health`
- `GET /setup/status`
- `POST /setup/ollama/install-check`
- `GET /models`
- `POST /models/install`
- `POST /models/remove`
- `GET /projects`
- `POST /projects`
- `GET /projects/{id}/chats`
- `POST /projects/{id}/chats`
- `GET /projects/{id}/sources`
- `GET /chats/{id}`
- `POST /chat/respond`
- `POST /sources/upload`
- `POST /sources/import-paths`
- `POST /sources/{id}/refresh`
- `GET /sources/{id}/status`
- `POST /sources/{id}/reindex`

## Notes

- The app is local-first and single-user in v1.
- The current implementation targets Windows first.
- The preferred local service runtime is a Docker container for the backend.
- Ollama models are installed through the app UI, not bundled into the installer.
- Docker Desktop system requirements are documented by Docker, including supported Windows editions and WSL 2 requirements: https://docs.docker.com/desktop/setup/install/windows-install/
- Ollama Windows downloads are available at: https://ollama.com/download/windows
