from __future__ import annotations

import json

from sqlalchemy import select

from app.models.db_models import Chat, Message, Project, Source, SourceVersion
from app.models.schemas import (
    ChatRecord,
    ChatResponsePayload,
    MessageRecord,
    ProjectRecord,
    SourceRecord,
    SourceStatus,
    SourceVersionRecord
)
from app.services.helpers import new_id, utc_now


def create_project(session, name: str, description: str) -> ProjectRecord:
    timestamp = utc_now()
    project = Project(id=new_id("project"), name=name, description=description, created_at=timestamp, updated_at=timestamp)
    session.add(project)
    session.flush()
    return ProjectRecord(id=project.id, name=project.name, description=project.description, createdAt=project.created_at, updatedAt=project.updated_at)


def list_projects(session) -> list[ProjectRecord]:
    projects = session.scalars(select(Project).order_by(Project.updated_at.desc())).all()
    return [ProjectRecord(id=item.id, name=item.name, description=item.description, createdAt=item.created_at, updatedAt=item.updated_at) for item in projects]


def create_chat(session, project_id: str, title: str) -> ChatRecord:
    timestamp = utc_now()
    chat = Chat(id=new_id("chat"), project_id=project_id, title=title, created_at=timestamp, updated_at=timestamp)
    session.add(chat)
    session.flush()
    return ChatRecord(id=chat.id, projectId=chat.project_id, title=chat.title, createdAt=chat.created_at, updatedAt=chat.updated_at)


def list_chats(session, project_id: str) -> list[ChatRecord]:
    chats = session.scalars(select(Chat).where(Chat.project_id == project_id).order_by(Chat.updated_at.desc())).all()
    return [ChatRecord(id=item.id, projectId=item.project_id, title=item.title, createdAt=item.created_at, updatedAt=item.updated_at) for item in chats]


def get_chat_payload(session, chat_id: str) -> ChatResponsePayload:
    chat = session.get(Chat, chat_id)
    messages = session.scalars(select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc())).all()
    return ChatResponsePayload(
        chat=ChatRecord(id=chat.id, projectId=chat.project_id, title=chat.title, createdAt=chat.created_at, updatedAt=chat.updated_at),
        messages=[
            MessageRecord(
                id=item.id,
                chatId=item.chat_id,
                role=item.role,
                content=item.content,
                createdAt=item.created_at,
                citations=json.loads(item.citations_json)
            )
            for item in messages
        ]
    )


def add_message(session, chat_id: str, role: str, content: str, citations: list[dict]) -> MessageRecord:
    timestamp = utc_now()
    message = Message(
        id=new_id("msg"),
        chat_id=chat_id,
        role=role,
        content=content,
        citations_json=json.dumps(citations),
        created_at=timestamp
    )
    session.add(message)
    chat = session.get(Chat, chat_id)
    chat.updated_at = timestamp
    session.add(chat)
    session.flush()
    return MessageRecord(id=message.id, chatId=message.chat_id, role=message.role, content=message.content, createdAt=message.created_at, citations=citations)


def create_source(session, project_id: str, file_name: str, file_type: str) -> Source:
    timestamp = utc_now()
    source = Source(
        id=new_id("source"),
        project_id=project_id,
        name=file_name,
        file_type=file_type,
        status="queued",
        chunk_count=0,
        last_indexed_at=None,
        latest_version_id=None,
        created_at=timestamp,
        updated_at=timestamp
    )
    session.add(source)
    session.flush()
    return source


def list_sources(session, project_id: str) -> list[SourceRecord]:
    sources = session.scalars(select(Source).where(Source.project_id == project_id).order_by(Source.updated_at.desc())).all()
    return [
        SourceRecord(
            id=item.id,
            projectId=item.project_id,
            name=item.name,
            fileType=item.file_type,
            status=item.status,
            chunkCount=item.chunk_count,
            lastIndexedAt=item.last_indexed_at,
            createdAt=item.created_at,
            updatedAt=item.updated_at,
            latestVersionId=item.latest_version_id
        )
        for item in sources
    ]


def get_source_status(session, source_id: str) -> SourceStatus:
    source = session.get(Source, source_id)
    active_version = session.scalar(select(SourceVersion).where(SourceVersion.source_id == source_id, SourceVersion.is_active.is_(True)))
    version_record = None
    if active_version:
        version_record = SourceVersionRecord(
            id=active_version.id,
            sourceId=active_version.source_id,
            checksum=active_version.checksum,
            rowCount=active_version.row_count,
            chunkCount=active_version.chunk_count,
            isActive=active_version.is_active,
            createdAt=active_version.created_at
        )
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
        activeVersion=version_record
    )
