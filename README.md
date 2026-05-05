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

## Non-technical install path

### 1. Install prerequisites

Install these once:

1. Install `Python 3.11+` and ensure `python` is available in Command Prompt or PowerShell.
2. Install `Node.js 20+`.
3. Install `Ollama` from `https://ollama.com/download/windows`.
4. Optional but recommended for OCR: install `Tesseract OCR` and add it to your `PATH`.

### 2. Start CleanRAG in development

```powershell
npm install
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
npm run dev
```

The desktop app will open and check:

- local data folder
- Ollama availability
- recommended chat model
- recommended embedding model

Use the `Models` screen to install missing models.

### 3. Package a Windows installer

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
- Ollama models are installed through the app UI, not bundled into the installer.
