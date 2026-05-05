from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import ModelMutation, ModelRecord
from app.services.ollama_service import install_model, list_models, remove_model

router = APIRouter(tags=["models"])


@router.get("/models", response_model=list[ModelRecord])
def get_models() -> list[ModelRecord]:
    return list_models()


@router.post("/models")
def unsupported_models_post() -> dict[str, str]:
    raise HTTPException(status_code=405, detail="Use /models/install or /models/remove.")


@router.post("/models/install")
def install(payload: ModelMutation) -> dict[str, object]:
    install_model(payload.model)
    return {"ok": True, "model": payload.model}


@router.post("/models/remove")
def remove(payload: ModelMutation) -> dict[str, object]:
    remove_model(payload.model)
    return {"ok": True, "model": payload.model}

