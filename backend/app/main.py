from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.db.database import engine
from app.models.db_models import Base
from app.routers import chats, models, projects, setup, sources

app = FastAPI(title="CleanRAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(setup.router)
app.include_router(models.router)
app.include_router(projects.router)
app.include_router(chats.router)
app.include_router(sources.router)


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.default_port, reload=False)

