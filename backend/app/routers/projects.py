from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_session
from app.models.schemas import ChatCreate, ChatRecord, ProjectCreate, ProjectRecord
from app.services.repository import create_chat, create_project, list_chats, list_projects

router = APIRouter(tags=["projects"])


@router.get("/projects", response_model=list[ProjectRecord])
def get_projects(session: Session = Depends(get_session)) -> list[ProjectRecord]:
    return list_projects(session)


@router.post("/projects", response_model=ProjectRecord)
def post_project(payload: ProjectCreate, session: Session = Depends(get_session)) -> ProjectRecord:
    return create_project(session, payload.name, payload.description)


@router.get("/projects/{project_id}/chats", response_model=list[ChatRecord])
def get_project_chats(project_id: str, session: Session = Depends(get_session)) -> list[ChatRecord]:
    return list_chats(session, project_id)


@router.post("/projects/{project_id}/chats", response_model=ChatRecord)
def post_project_chat(project_id: str, payload: ChatCreate, session: Session = Depends(get_session)) -> ChatRecord:
    return create_chat(session, project_id, payload.title)

