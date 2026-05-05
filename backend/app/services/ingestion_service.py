from __future__ import annotations

from hashlib import md5
import json
from pathlib import Path

import pandas as pd
import pytesseract
from docx import Document
from PIL import Image
from pypdf import PdfReader
from app.models.db_models import Source, SourceVersion
from app.models.schemas import NormalizedDocumentChunk, NormalizedStructuredRow, SourceStatus, SourceVersionRecord
from app.services.helpers import new_id, utc_now
from app.services.vector_service import build_vector_row, replace_source_rows


SUPPORTED_IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg"}
SUPPORTED_STRUCTURED_SUFFIXES = {".csv", ".xlsx"}


def compute_checksum(path: Path) -> str:
    return md5(path.read_bytes(), usedforsecurity=False).hexdigest()


def chunk_text(text: str, chunk_size: int = 900) -> list[str]:
    stripped = text.strip()
    if not stripped:
        return []
    return [stripped[index : index + chunk_size] for index in range(0, len(stripped), chunk_size)]


def normalize_document(path: Path, source_id: str, project_id: str) -> list[NormalizedDocumentChunk]:
    suffix = path.suffix.lower()
    text = ""

    if suffix == ".pdf":
        reader = PdfReader(str(path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    elif suffix == ".docx":
        document = Document(str(path))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    elif suffix in {".txt", ".md", ".json"}:
        text = path.read_text(encoding="utf-8", errors="ignore")
    elif suffix in SUPPORTED_IMAGE_SUFFIXES:
        text = pytesseract.image_to_string(Image.open(path))
    else:
        raise ValueError(f"Unsupported document type: {suffix}")

    chunks = chunk_text(text)
    return [
        NormalizedDocumentChunk(
            source_id=source_id,
            project_id=project_id,
            file_name=path.name,
            file_type=suffix.lstrip("."),
            section_path=None,
            page_or_block=f"block_{index + 1}",
            text=chunk,
            metadata={"chunk_index": index + 1}
        )
        for index, chunk in enumerate(chunks)
    ]


def infer_key_columns(frame: pd.DataFrame) -> list[str]:
    candidates = []
    for column in frame.columns:
        if frame[column].is_unique:
            candidates.append(column)
    return candidates[:1]


def enrich_structured_row(row: NormalizedStructuredRow, source_name: str, ingestion_timestamp: str) -> str:
    numeric_columns = [name for name, value in row.columns.items() if str(value).replace(".", "", 1).isdigit()]
    date_columns = [name for name, value in row.columns.items() if "-" in str(value) or "/" in str(value)]
    payload = {
        "source_name": source_name,
        "sheet_name": row.sheet_name,
        "row_identity": row.row_identity,
        "ingested_at": ingestion_timestamp,
        "normalized_columns": row.columns,
        "detected_numeric_columns": numeric_columns,
        "detected_date_columns": date_columns
    }
    return f"{row.display_text}\n\nStructured context:\n{json.dumps(payload, indent=2, sort_keys=True)}"


def normalize_structured(path: Path, source_id: str, source_version_id: str) -> list[NormalizedStructuredRow]:
    frame = pd.read_excel(path) if path.suffix.lower() == ".xlsx" else pd.read_csv(path)
    frame = frame.fillna("")
    key_columns = infer_key_columns(frame)
    rows: list[NormalizedStructuredRow] = []

    for row_number, (_, row) in enumerate(frame.iterrows(), start=1):
        columns = {str(column): str(value) for column, value in row.to_dict().items()}
        identity_seed = "|".join(columns[key] for key in key_columns) if key_columns else json.dumps(columns, sort_keys=True)
        row_identity = md5(identity_seed.encode("utf-8"), usedforsecurity=False).hexdigest()
        row_hash = md5(json.dumps(columns, sort_keys=True).encode("utf-8"), usedforsecurity=False).hexdigest()
        display_text = "; ".join(f"{column}: {value}" for column, value in columns.items())
        rows.append(
            NormalizedStructuredRow(
                source_id=source_id,
                source_version_id=source_version_id,
                sheet_name="Sheet1",
                row_number=row_number,
                row_identity=row_identity,
                row_hash=row_hash,
                columns=columns,
                display_text=display_text,
                metadata={"key_columns": key_columns}
            )
        )
    return rows


def ingest_source_file(session, *, source: Source, file_path: Path) -> SourceStatus:
    timestamp = utc_now()
    checksum = compute_checksum(file_path)
    version = SourceVersion(
        id=new_id("version"),
        source_id=source.id,
        checksum=checksum,
        row_count=0,
        chunk_count=0,
        is_active=True,
        created_at=timestamp
    )

    for existing_version in source.versions:
        existing_version.is_active = False

    source.status = "processing"
    source.updated_at = timestamp
    session.add(version)
    session.flush()

    rows_for_index: list[dict] = []
    if file_path.suffix.lower() in SUPPORTED_STRUCTURED_SUFFIXES:
        structured_rows = normalize_structured(file_path, source.id, version.id)
        rows_for_index = [
            build_vector_row(
                item_id=new_id("row"),
                project_id=source.project_id,
                source_id=source.id,
                source_name=source.name,
                source_version_id=version.id,
                locator=f"{row.sheet_name}:row_{row.row_number}",
                content=enrich_structured_row(row, source.name, timestamp),
                kind="structured"
            )
            for row in structured_rows
        ]
        version.row_count = len(structured_rows)
        version.chunk_count = len(rows_for_index)
    else:
        chunks = normalize_document(file_path, source.id, source.project_id)
        rows_for_index = [
            build_vector_row(
                item_id=new_id("chunk"),
                project_id=source.project_id,
                source_id=source.id,
                source_name=source.name,
                source_version_id=version.id,
                locator=chunk.page_or_block,
                content=chunk.text,
                kind="document"
            )
            for chunk in chunks
        ]
        version.row_count = len(chunks)
        version.chunk_count = len(rows_for_index)

    replace_source_rows(source.id, rows_for_index)

    source.status = "ready"
    source.chunk_count = len(rows_for_index)
    source.last_indexed_at = timestamp
    source.latest_version_id = version.id
    source.updated_at = timestamp
    session.add(source)
    session.flush()

    return SourceStatus(
        id=source.id,
        projectId=source.project_id,
        name=source.name,
        fileType=source.file_type,
        status=source.status,
        chunkCount=source.chunk_count,
        lastIndexedAt=source.last_indexed_at,
        createdAt=source.created_at,
        updatedAt=source.updated_at,
        latestVersionId=source.latest_version_id,
        activeVersion=SourceVersionRecord(
            id=version.id,
            sourceId=version.source_id,
            checksum=version.checksum,
            rowCount=version.row_count,
            chunkCount=version.chunk_count,
            isActive=version.is_active,
            createdAt=version.created_at
        )
    )
