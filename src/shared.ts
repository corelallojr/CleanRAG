export type SetupStatus = {
  appDataReady: boolean;
  ollamaInstalled: boolean;
  ollamaReachable: boolean;
  chatModelReady: boolean;
  embeddingModelReady: boolean;
  dataDirectory: string;
  recommendedChatModel: string;
  recommendedEmbeddingModel: string;
  issues: string[];
};

export type ProjectRecord = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatRecord = {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageRecord = {
  id: string;
  chatId: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: string;
  citations: CitationRecord[];
};

export type CitationRecord = {
  sourceId: string;
  sourceName: string;
  excerpt: string;
  score: number;
  locator: string;
};

export type SourceRecord = {
  id: string;
  projectId: string;
  name: string;
  fileType: string;
  status: "queued" | "processing" | "ready" | "error";
  chunkCount: number;
  lastIndexedAt: string | null;
  createdAt: string;
  updatedAt: string;
  latestVersionId: string | null;
};

export type ImportSourcePathsRequest = {
  projectId: string;
  filePaths: string[];
};

export type SourceStatus = SourceRecord & {
  activeVersion: SourceVersion | null;
};

export type SourceVersion = {
  id: string;
  sourceId: string;
  checksum: string;
  rowCount: number;
  chunkCount: number;
  isActive: boolean;
  createdAt: string;
};

export type ModelRecord = {
  name: string;
  tag: string;
  installed: boolean;
  size: string;
  kind: "chat" | "embedding";
  recommended: boolean;
  status: "ready" | "missing" | "installing" | "error";
};

export type ChatResponsePayload = {
  chat: ChatRecord;
  messages: MessageRecord[];
};

export type ChatRespondRequest = {
  projectId: string;
  chatId: string;
  message: string;
  model: string;
  useRetrieval: boolean;
  sourceId?: string | null;
};

export type ChatRespondResult = {
  userMessage: MessageRecord;
  assistantMessage: MessageRecord;
};
