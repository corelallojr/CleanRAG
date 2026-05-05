from __future__ import annotations

from pydantic import BaseModel, Field


class CitationRecord(BaseModel):
    sourceId: str
    sourceName: str
    excerpt: str
    score: float
    locator: str


class SetupStatus(BaseModel):
    appDataReady: bool
    ollamaInstalled: bool
    ollamaReachable: bool
    chatModelReady: bool
    embeddingModelReady: bool
    dataDirectory: str
    recommendedChatModel: str
    recommendedEmbeddingModel: str
    issues: list[str]


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str = ""


class ProjectRecord(BaseModel):
    id: str
    name: str
    description: str
    createdAt: str
    updatedAt: str


class ChatCreate(BaseModel):
    title: str


class ChatRecord(BaseModel):
    id: str
    projectId: str
    title: str
    createdAt: str
    updatedAt: str


class MessageRecord(BaseModel):
    id: str
    chatId: str
    role: str
    content: str
    createdAt: str
    citations: list[CitationRecord]


class ChatResponsePayload(BaseModel):
    chat: ChatRecord
    messages: list[MessageRecord]


class ChatRespondRequest(BaseModel):
    projectId: str
    chatId: str
    message: str
    model: str
    useRetrieval: bool
    sourceId: str | None = None


class ChatRespondResult(BaseModel):
    userMessage: MessageRecord
    assistantMessage: MessageRecord


class SourceRecord(BaseModel):
    id: str
    projectId: str
    name: str
    fileType: str
    status: str
    chunkCount: int
    lastIndexedAt: str | None
    createdAt: str
    updatedAt: str
    latestVersionId: str | None


class SourceVersionRecord(BaseModel):
    id: str
    sourceId: str
    checksum: str
    rowCount: int
    chunkCount: int
    isActive: bool
    createdAt: str


class SourceStatus(SourceRecord):
    activeVersion: SourceVersionRecord | None


class ModelRecord(BaseModel):
    name: str
    tag: str
    installed: bool
    size: str
    kind: str
    recommended: bool
    status: str


class ModelMutation(BaseModel):
    model: str


class ImportSourcePathsRequest(BaseModel):
    projectId: str
    filePaths: list[str]


class NormalizedDocumentChunk(BaseModel):
    source_id: str
    project_id: str
    file_name: str
    file_type: str
    section_path: str | None
    page_or_block: str
    text: str
    metadata: dict


class NormalizedStructuredRow(BaseModel):
    source_id: str
    source_version_id: str
    sheet_name: str
    row_number: int
    row_identity: str
    row_hash: str
    columns: dict[str, str]
    display_text: str
    metadata: dict
