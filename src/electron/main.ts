import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { spawn, spawnSync, ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import isDev from "electron-is-dev";

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcessWithoutNullStreams | null = null;
let backendMode: "python" | "unavailable" = "unavailable";
const backendPort = 8777;

function getContentRoot(): string {
  return app.isPackaged ? path.join(process.resourcesPath, "app.asar.unpacked") : app.getAppPath();
}

function getBackendEntry(): string {
  return path.join(getContentRoot(), "backend");
}

function getBundledVenvPythonPath(): string {
  return path.join(getBackendEntry(), ".venv", "Scripts", "python.exe");
}

function getBootstrapScriptPath(): string {
  return path.join(getContentRoot(), "scripts", "install-local.ps1");
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#f7f4ec",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }
}

function commandExists(command: string, args: string[] = ["--version"]): boolean {
  try {
    const result = spawnSync(command, args, { stdio: "ignore", shell: false });
    return result.status === 0;
  } catch {
    return false;
  }
}

function resolvePythonCommand(): string | null {
  const bundledVenvPython = getBundledVenvPythonPath();
  if (fs.existsSync(bundledVenvPython)) {
    return bundledVenvPython;
  }

  const candidates = ["python", "py"];
  for (const candidate of candidates) {
    if (commandExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

function ensureAppDirectories(): string {
  const userDataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(userDataDir, { recursive: true });
  return userDataDir;
}

async function waitForBackend(timeoutMs = 45000): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${backendPort}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  return false;
}

function startPythonBackend(): boolean {
  const pythonCommand = resolvePythonCommand();
  if (!pythonCommand) {
    return false;
  }

  const backendEntry = getBackendEntry();
  const env = {
    ...process.env,
    CLEANRAG_PORT: String(backendPort),
    CLEANRAG_DATA_DIR: path.join(app.getPath("userData"), "data")
  };

  backendProcess = spawn(pythonCommand, ["-m", "app.main"], {
    cwd: backendEntry,
    env,
    stdio: "pipe"
  });

  backendProcess.stdout.on("data", (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });

  backendProcess.stderr.on("data", (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });

  backendMode = "python";
  return true;
}

async function startBackend(): Promise<void> {
  ensureAppDirectories();

  if (startPythonBackend()) {
    await waitForBackend();
    return;
  }

  backendMode = "unavailable";
}

function stopBackend(): void {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
  backendProcess = null;
}

app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBackend();
});

ipcMain.handle("cleanrag:get-runtime-config", async () => ({
  apiBaseUrl: `http://127.0.0.1:${backendPort}`,
  hasPython: resolvePythonCommand() !== null,
  backendMode
}));

ipcMain.handle("cleanrag:pick-files", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Supported files",
        extensions: ["pdf", "docx", "txt", "md", "csv", "xlsx", "json", "png", "jpg", "jpeg"]
      }
    ]
  });

  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle("cleanrag:open-external", async (_event, target: string) => {
  await shell.openExternal(target);
});

ipcMain.handle("cleanrag:run-setup-helper", async () => {
  const scriptPath = getBootstrapScriptPath();
  const powershellArgs = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath
  ];
  spawn("powershell", powershellArgs, {
    cwd: getContentRoot(),
    detached: true,
    stdio: "ignore"
  }).unref();
  return true;
});
