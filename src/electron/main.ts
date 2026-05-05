import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import isDev from "electron-is-dev";

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcessWithoutNullStreams | null = null;
const backendPort = 8777;

function getBackendEntry(): string {
  return path.join(app.getAppPath(), "backend");
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

function resolvePythonCommand(): string | null {
  const candidates = ["python", "py"];
  for (const candidate of candidates) {
    try {
      const result = require("node:child_process").spawnSync(candidate, ["--version"], { stdio: "ignore" });
      if (result.status === 0) {
        return candidate;
      }
    } catch {
      // Continue checking candidates.
    }
  }
  return null;
}

function ensureAppDirectories(): string {
  const userDataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(userDataDir, { recursive: true });
  return userDataDir;
}

function startBackend(): void {
  const pythonCommand = resolvePythonCommand();
  ensureAppDirectories();

  if (!pythonCommand) {
    return;
  }

  const backendEntry = getBackendEntry();
  const env = {
    ...process.env,
    CLEANRAG_PORT: String(backendPort),
    CLEANRAG_DATA_DIR: path.join(app.getPath("userData"), "data")
  };

  const backendArgs = pythonCommand === "py" ? ["-m", "app.main"] : ["-m", "app.main"];

  backendProcess = spawn(pythonCommand, backendArgs, {
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
}

function stopBackend(): void {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
  backendProcess = null;
}

app.whenReady().then(() => {
  startBackend();
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
  hasPython: resolvePythonCommand() !== null
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
