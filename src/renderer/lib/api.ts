import type {
  ChatRecord,
  ChatRespondRequest,
  ChatRespondResult,
  ChatResponsePayload,
  ModelRecord,
  ProjectRecord,
  SetupStatus,
  SourceRecord,
  SourceStatus
} from "../../shared";

let apiBaseUrl = "http://127.0.0.1:8777";

export function configureApi(baseUrl: string): void {
  apiBaseUrl = baseUrl;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed for ${path}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  getSetupStatus: () => request<SetupStatus>("/setup/status"),
  checkOllamaInstall: () => request<SetupStatus>("/setup/ollama/install-check", { method: "POST" }),
  getProjects: () => request<ProjectRecord[]>("/projects"),
  createProject: (payload: { name: string; description: string }) =>
    request<ProjectRecord>("/projects", { method: "POST", body: JSON.stringify(payload) }),
  getChats: (projectId: string) => request<ChatRecord[]>(`/projects/${projectId}/chats`),
  createChat: (projectId: string, payload: { title: string }) =>
    request<ChatRecord>(`/projects/${projectId}/chats`, { method: "POST", body: JSON.stringify(payload) }),
  getChatMessages: (chatId: string) => request<ChatResponsePayload>(`/chats/${chatId}`),
  respondToChat: (payload: ChatRespondRequest) =>
    request<ChatRespondResult>("/chat/respond", { method: "POST", body: JSON.stringify(payload) }),
  getSources: (projectId: string) => request<SourceRecord[]>(`/projects/${projectId}/sources`),
  uploadSource: (formData: FormData) =>
    fetch(`${apiBaseUrl}/sources/upload`, { method: "POST", body: formData }).then(async (response) => {
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return (await response.json()) as SourceRecord[];
    }),
  importSourcePaths: (payload: { projectId: string; filePaths: string[] }) =>
    request<SourceRecord[]>("/sources/import-paths", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getSourceStatus: (sourceId: string) => request<SourceStatus>(`/sources/${sourceId}/status`),
  refreshSource: (sourceId: string, formData: FormData) =>
    fetch(`${apiBaseUrl}/sources/${sourceId}/refresh`, { method: "POST", body: formData }).then(async (response) => {
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return (await response.json()) as SourceStatus;
    }),
  reindexSource: (sourceId: string) => request<SourceStatus>(`/sources/${sourceId}/reindex`, { method: "POST" }),
  getModels: () => request<ModelRecord[]>("/models"),
  installModel: (payload: { model: string }) =>
    request<{ ok: boolean; model: string }>("/models/install", { method: "POST", body: JSON.stringify(payload) }),
  removeModel: (payload: { model: string }) =>
    request<{ ok: boolean; model: string }>("/models/remove", { method: "POST", body: JSON.stringify(payload) })
};
