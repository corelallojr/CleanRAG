from __future__ import annotations

import shutil
from pathlib import Path

import httpx

from app.config import settings
from app.models.schemas import SetupStatus
from app.services.ollama_service import list_installed_model_tags


def get_setup_status() -> SetupStatus:
    issues: list[str] = []
    app_data_ready = all(Path(directory).exists() for directory in [settings.data_dir, settings.uploads_dir, settings.lancedb_dir])
    ollama_installed = shutil.which("ollama") is not None
    ollama_reachable = False

    try:
        response = httpx.get(f"{settings.ollama_base_url}/api/tags", timeout=2.0)
        ollama_reachable = response.status_code == 200
    except httpx.HTTPError:
        ollama_reachable = False

    installed_tags = list_installed_model_tags() if ollama_reachable else []
    chat_model_ready = settings.recommended_chat_model in installed_tags
    embedding_model_ready = settings.recommended_embedding_model in installed_tags

    if not ollama_installed:
        issues.append("Install Ollama to run local chat and embeddings.")
    if ollama_installed and not ollama_reachable:
        issues.append("Ollama is installed but not responding on the local default port.")
    if not chat_model_ready:
        issues.append(f"Install the recommended chat model: {settings.recommended_chat_model}.")
    if not embedding_model_ready:
        issues.append(f"Install the recommended embedding model: {settings.recommended_embedding_model}.")

    return SetupStatus(
        appDataReady=app_data_ready,
        ollamaInstalled=ollama_installed,
        ollamaReachable=ollama_reachable,
        chatModelReady=chat_model_ready,
        embeddingModelReady=embedding_model_ready,
        dataDirectory=str(settings.data_dir),
        recommendedChatModel=settings.recommended_chat_model,
        recommendedEmbeddingModel=settings.recommended_embedding_model,
        issues=issues
    )

