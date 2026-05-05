from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import SetupStatus
from app.services.setup_service import get_setup_status

router = APIRouter(prefix="/setup", tags=["setup"])


@router.get("/status", response_model=SetupStatus)
def setup_status() -> SetupStatus:
    return get_setup_status()


@router.post("/ollama/install-check", response_model=SetupStatus)
def ollama_install_check() -> SetupStatus:
    return get_setup_status()

