from __future__ import annotations

from typing import Iterable

import lancedb
import pyarrow as pa

from app.config import settings
from app.models.schemas import CitationRecord
from app.services.ollama_service import embed_text


TABLE_NAME = "project_chunks"


def get_db():
    return lancedb.connect(str(settings.lancedb_dir))


def ensure_table():
    db = get_db()
    if TABLE_NAME not in db.table_names():
        schema = pa.schema(
            [
                pa.field("id", pa.string()),
                pa.field("project_id", pa.string()),
                pa.field("source_id", pa.string()),
                pa.field("source_name", pa.string()),
                pa.field("source_version_id", pa.string()),
                pa.field("locator", pa.string()),
                pa.field("content", pa.string()),
                pa.field("kind", pa.string()),
                pa.field("vector", pa.list_(pa.float32()))
            ]
        )
        return db.create_table(TABLE_NAME, schema=schema)
    return db.open_table(TABLE_NAME)


def replace_source_rows(source_id: str, rows: Iterable[dict]) -> int:
    table = ensure_table()
    table.delete(f"source_id = '{source_id}'")
    rows_list = list(rows)
    if rows_list:
        table.add(rows_list)
    return len(rows_list)


def build_vector_row(
    *,
    item_id: str,
    project_id: str,
    source_id: str,
    source_name: str,
    source_version_id: str,
    locator: str,
    content: str,
    kind: str
) -> dict:
    vector = embed_text(content)
    return {
        "id": item_id,
        "project_id": project_id,
        "source_id": source_id,
        "source_name": source_name,
        "source_version_id": source_version_id,
        "locator": locator,
        "content": content,
        "kind": kind,
        "vector": vector
    }


def search_project(project_id: str, query: str, source_id: str | None = None, limit: int = 6) -> list[CitationRecord]:
    table = ensure_table()
    query_vector = embed_text(query)
    search = table.search(query_vector).where(f"project_id = '{project_id}'")
    if source_id:
        search = search.where(f"project_id = '{project_id}' AND source_id = '{source_id}'")
    results = search.limit(limit).to_list()
    return [
        CitationRecord(
            sourceId=row["source_id"],
            sourceName=row["source_name"],
            excerpt=row["content"][:220],
            score=float(row.get("_distance", 0.0)),
            locator=row["locator"]
        )
        for row in results
    ]
