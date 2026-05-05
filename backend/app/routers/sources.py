from __future__ import annotations

from pathlib import Path
import shutil

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_session
from app.models.db_models import Source
from app.models.schemas import ImportSourcePathsRequest, SourceRecord, SourceStatus
from app.services.ingestion_service import ingest_source_file
from app.services.repository import create_source, get_source_status, list_sources

router = APIRouter(tags=["sources"])


@router.get("/projects/{project_id}/sources", response_model=list[SourceRecord])
def get_project_sources(project_id: str, session: Session = Depends(get_session)) -> list[SourceRecord]:
    return list_sources(session, project_id)


@router.post("/sources/upload", response_model=list[SourceRecord])
async def upload_sources(
    project_id: str = Form(...),
    files: list[UploadFile] = File(...),
    session: Session = Depends(get_session)
) -> list[SourceRecord]:
    created_sources: list[SourceRecord] = []
    for upload in files:
        suffix = Path(upload.filename or "").suffix.lower()
        source = create_source(session, project_id, upload.filename or "source", suffix.lstrip("."))
        source_dir = settings.uploads_dir / source.id
        source_dir.mkdir(parents=True, exist_ok=True)
        target_path = source_dir / (upload.filename or "source")
        with target_path.open("wb") as handle:
            shutil.copyfileobj(upload.file, handle)
        ingest_source_file(session, source=source, file_path=target_path)
        created_sources.append(get_source_status(session, source.id))
    return created_sources


@router.post("/sources/import-paths", response_model=list[SourceRecord])
def import_source_paths(payload: ImportSourcePathsRequest, session: Session = Depends(get_session)) -> list[SourceRecord]:
    created_sources: list[SourceRecord] = []
    for raw_path in payload.filePaths:
        source_path = Path(raw_path)
        suffix = source_path.suffix.lower()
        source = create_source(session, payload.projectId, source_path.name, suffix.lstrip("."))
        source_dir = settings.uploads_dir / source.id
        source_dir.mkdir(parents=True, exist_ok=True)
        target_path = source_dir / source_path.name
        shutil.copy2(source_path, target_path)
        ingest_source_file(session, source=source, file_path=target_path)
        created_sources.append(get_source_status(session, source.id))
    return created_sources


@router.get("/sources/{source_id}/status", response_model=SourceStatus)
def source_status(source_id: str, session: Session = Depends(get_session)) -> SourceStatus:
    return get_source_status(session, source_id)


@router.post("/sources/{source_id}/refresh", response_model=SourceStatus)
async def refresh_source(
    source_id: str,
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
) -> SourceStatus:
    source = session.get(Source, source_id)
    source_dir = settings.uploads_dir / source.id
    source_dir.mkdir(parents=True, exist_ok=True)
    target_path = source_dir / (file.filename or source.name)
    with target_path.open("wb") as handle:
        shutil.copyfileobj(file.file, handle)
    return ingest_source_file(session, source=source, file_path=target_path)


@router.post("/sources/{source_id}/reindex", response_model=SourceStatus)
def reindex_source(source_id: str, session: Session = Depends(get_session)) -> SourceStatus:
    source = session.get(Source, source_id)
    source_dir = settings.uploads_dir / source.id
    files = sorted(source_dir.glob("*"))
    if not files:
        return get_source_status(session, source_id)
    return ingest_source_file(session, source=source, file_path=files[-1])
