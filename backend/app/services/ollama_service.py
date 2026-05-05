from __future__ import annotations

import subprocess

import httpx

from app.config import settings
from app.models.schemas import ModelRecord


RECOMMENDED_MODELS = [
    ModelRecord(
        name="Llama 3.2 3B",
        tag=settings.recommended_chat_model,
        installed=False,
        size="2.0 GB",
        kind="chat",
        recommended=True,
        status="missing"
    ),
    ModelRecord(
        name="Nomic Embed Text",
        tag=settings.recommended_embedding_model,
        installed=False,
        size="274 MB",
        kind="embedding",
        recommended=True,
        status="missing"
    )
]


def list_installed_model_tags() -> list[str]:
    try:
        response = httpx.get(f"{settings.ollama_base_url}/api/tags", timeout=3.0)
        response.raise_for_status()
        return [model["name"] for model in response.json().get("models", [])]
    except httpx.HTTPError:
        return []


def list_models() -> list[ModelRecord]:
    installed_tags = set(list_installed_model_tags())
    models: list[ModelRecord] = []
    for model in RECOMMENDED_MODELS:
        installed = model.tag in installed_tags
        models.append(
            ModelRecord(
                **model.model_dump(),
                installed=installed,
                status="ready" if installed else "missing"
            )
        )
    return models


def install_model(model: str) -> None:
    subprocess.run(["ollama", "pull", model], check=True)


def remove_model(model: str) -> None:
    subprocess.run(["ollama", "rm", model], check=True)


def embed_text(text: str, model: str | None = None) -> list[float]:
    embedding_model = model or settings.recommended_embedding_model
    response = httpx.post(
        f"{settings.ollama_base_url}/api/embeddings",
        json={"model": embedding_model, "prompt": text},
        timeout=60.0
    )
    response.raise_for_status()
    return response.json()["embedding"]


def generate_chat(model: str, prompt: str) -> str:
    response = httpx.post(
        f"{settings.ollama_base_url}/api/generate",
        json={"model": model, "prompt": prompt, "stream": False},
        timeout=120.0
    )
    response.raise_for_status()
    return response.json()["response"]
