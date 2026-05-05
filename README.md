# CleanRAG

CleanRAG is a Windows-first local desktop app for simple local RAG with Ollama models. It gives you:

- ChatGPT-style chats
- Projects to organize work
- Drag-and-drop document ingestion
- Local chat history and project storage
- Local vector search over your files
- A Docker-based backend so you do not have to install Python dependencies manually

This README is written for someone starting from zero on Windows.

## Start Here

If you do not already have this project on your computer, do this first.

Open **PowerShell** and paste this exact command:

```powershell
git clone https://github.com/corelallojr/CleanRAG.git; cd CleanRAG
```

What this does:

- downloads the CleanRAG project files from GitHub onto your computer
- creates a folder named `CleanRAG`
- moves PowerShell into that folder so the next commands work

After that, keep using the same PowerShell window and continue with the setup steps below.

## What You Need

You need these installed on your Windows machine:

1. `Git`
2. `Node.js 20+`
3. `Docker Desktop`
4. `Ollama`

You do not need to install Python for the normal local setup path.

Official downloads:

- Git: [Download Git for Windows](https://git-scm.com/download/win)
- Node.js: [Download Node.js](https://nodejs.org/)
- Docker Desktop: [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- Ollama: [Download Ollama for Windows](https://ollama.com/download/windows)

## Fastest Path To Start

If you just want to get the app running from this repo, do this in order.

### 1. Clone the repo

If you already used the `Start Here` command above, you already did this step.

If not, open PowerShell and run:

```powershell
git clone https://github.com/corelallojr/CleanRAG.git
cd CleanRAG
```

### 2. Install JavaScript dependencies

```powershell
npm install
```

### 3. Install and start the local backend environment

This script is the main setup shortcut. It is meant to reduce the number of manual steps.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1
```

What this script does:

- checks whether Docker Desktop is available
- checks whether Ollama is available
- tries to install missing tools with `winget`
- starts Docker Desktop
- waits for Docker to become ready
- starts Ollama
- waits for Ollama to become ready
- builds the CleanRAG backend container
- starts the backend on `http://127.0.0.1:8777`

Important notes:

- If `winget` prompts you for agreement approval, accept it.
- Docker Desktop may require WSL 2 to be enabled on your machine. If Docker does not install cleanly, use the official guide here: [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- Docker Desktop may ask you to sign in or finish first-run setup.
- Ollama may open its own app window or tray icon on first launch. If you need to install it manually, use: [Download Ollama for Windows](https://ollama.com/download/windows)

### 4. Start the desktop app

```powershell
npm run dev
```

This opens the Electron desktop app.

### 5. Install the default models inside the app

When the app opens:

1. Go to `Models`
2. Install `llama3.2:3b`
3. Install `nomic-embed-text:latest`

These are the default recommended models:

- Chat model: `llama3.2:3b`
- Embedding model: `nomic-embed-text:latest`

### 6. Create your first project and test chat

Inside the app:

1. Open `Projects`
2. Create a project
3. Open `Chats`
4. Create a new chat
5. Confirm the selected model is `llama3.2:3b`
6. Send a message such as:

```text
Reply with exactly: CleanRAG test passed.
```

If the app responds, the basic chat path is working.

## Exact End-To-End Test

If you want one exact test flow from a fresh clone, use this:

```powershell
git clone https://github.com/corelallojr/CleanRAG.git
cd CleanRAG
npm install
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1
npm run dev
```

Then in the app:

1. Open `Models`
2. Install `llama3.2:3b`
3. Install `nomic-embed-text:latest`
4. Create a project named `Test`
5. Create a new chat
6. Send `What model are you using?`
7. Confirm the chat model selector shows `llama3.2:3b`

## Test File Upload And RAG

To test retrieval:

1. Create a plain text file on your desktop named `sample.txt`
2. Put this inside it:

```text
CleanRAG is a local retrieval app. The default chat model is llama3.2:3b.
```

3. In the app, open `Sources`
4. Select your project
5. Drag `sample.txt` into the upload area
6. Wait until the source status becomes `ready`
7. Open `Chats`
8. Make sure `Use project sources` is turned on
9. Ask:

```text
What is the default chat model mentioned in my uploaded file?
```

Expected result:

- the assistant answers `llama3.2:3b`
- a citation appears under the message

## If You Want To Start The Backend Only

If you already have Docker Desktop and Ollama running, and only want the backend container:

```powershell
npm run backend:container
```

To stop the backend container:

```powershell
npm run backend:container:stop
```

## If You Want To Run The Desktop App Again Later

After the initial setup, your normal startup is usually:

1. Start Docker Desktop
2. Start Ollama if it is not already running
3. In the repo folder, run:

```powershell
npm run dev
```

If the backend container is not already running, the app will try to start it automatically.

## Build A Windows Installer

If you want to create the packaged installer from source:

```powershell
npm run package
```

This creates a Windows installer in `dist\`.

Expected output file:

```text
dist\CleanRAG Setup 0.1.0.exe
```

## What The App Stores Locally

CleanRAG stores data locally on your machine:

- chats
- projects
- uploaded source files
- vector index data
- app metadata

The backend uses:

- `SQLite` for metadata and chats
- `LanceDB` for vector storage

## Supported File Types

Current supported source types:

- `PDF`
- `DOCX`
- `TXT`
- `Markdown`
- `CSV`
- `XLSX`
- `JSON`
- `PNG`
- `JPG`
- `JPEG`

## Structured Data Refresh Behavior

When you upload an updated `CSV` or `XLSX` into an existing source:

- the new upload is treated as the active replacement snapshot
- the active vector set is rebuilt for that source
- duplicate active rows are prevented
- removed rows stop appearing in retrieval
- new rows become searchable

## Troubleshooting

### The setup script fails

Check these first:

- `winget` works on your machine
- Docker Desktop is installed and opens successfully
- Ollama is installed and opens successfully
- you are on a supported Windows version for Docker Desktop

If needed, install Docker Desktop and Ollama manually first, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1 -SkipDockerInstall -SkipOllamaInstall
```

### The app opens but the backend is unavailable

Check whether the backend health endpoint responds:

```powershell
Invoke-WebRequest http://127.0.0.1:8777/health
```

If that fails:

1. make sure Docker Desktop is running
2. make sure Ollama is running
3. rerun:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1
```

### The app says Ollama is not reachable

Run:

```powershell
ollama list
```

If that fails, start Ollama and wait a few seconds, then retry inside the app.

### The model is missing

Open the `Models` screen and install:

- `llama3.2:3b`
- `nomic-embed-text:latest`

### Docker build fails

Common causes:

- Docker Desktop is not fully started yet
- WSL 2 is not enabled
- corporate proxy/network restrictions
- insufficient disk space

Helpful install pages:

- Docker Desktop Windows install guide: [https://docs.docker.com/desktop/setup/install/windows-install/](https://docs.docker.com/desktop/setup/install/windows-install/)
- Ollama Windows download: [https://ollama.com/download/windows](https://ollama.com/download/windows)

## Developer Notes

If you are developing the app itself:

```powershell
npm install
npm run dev
```

The desktop app prefers the Docker-backed backend automatically. If Docker is unavailable, it can fall back to a local Python backend, but the normal intended path is Docker first.

## Current App Areas

- `Chats`
- `Projects`
- `Sources`
- `Models`
- `Settings`

## API Surface

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

## Current Scope

- Windows-first
- local-first
- single-user
- Ollama for local models
- Docker-backed backend by default

## Helpful Links

- Docker Desktop for Windows: [https://docs.docker.com/desktop/setup/install/windows-install/](https://docs.docker.com/desktop/setup/install/windows-install/)
- Ollama for Windows: [https://ollama.com/download/windows](https://ollama.com/download/windows)
