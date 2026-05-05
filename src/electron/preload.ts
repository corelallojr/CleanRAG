import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("cleanragDesktop", {
  getRuntimeConfig: () => ipcRenderer.invoke("cleanrag:get-runtime-config"),
  pickFiles: (): Promise<string[]> => ipcRenderer.invoke("cleanrag:pick-files"),
  openExternal: (target: string): Promise<void> => ipcRenderer.invoke("cleanrag:open-external", target),
  runSetupHelper: (): Promise<boolean> => ipcRenderer.invoke("cleanrag:run-setup-helper")
});
