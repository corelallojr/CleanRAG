from __future__ import annotations

from pathlib import Path
import os


class Settings:
    app_name = "CleanRAG"
    default_port = int(os.getenv("CLEANRAG_PORT", "8777"))
    data_dir = Path(os.getenv("CLEANRAG_DATA_DIR", Path(__file__).resolve().parents[2] / "backend" / "data"))
    uploads_dir = data_dir / "uploads"
    lancedb_dir = data_dir / "lancedb"
    sqlite_path = data_dir / "cleanrag.db"
    ollama_base_url = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    recommended_chat_model = "llama3.2:3b"
    recommended_embedding_model = "nomic-embed-text:latest"


settings = Settings()
