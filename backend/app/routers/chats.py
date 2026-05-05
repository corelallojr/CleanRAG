from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_session
from app.models.schemas import ChatRespondRequest, ChatRespondResult, ChatResponsePayload
from app.services.chat_service import respond_to_chat
from app.services.repository import get_chat_payload

router = APIRouter(tags=["chats"])


@router.get("/chats/{chat_id}", response_model=ChatResponsePayload)
def get_chat(chat_id: str, session: Session = Depends(get_session)) -> ChatResponsePayload:
    return get_chat_payload(session, chat_id)


@router.post("/chat/respond", response_model=ChatRespondResult)
def chat_respond(payload: ChatRespondRequest, session: Session = Depends(get_session)) -> ChatRespondResult:
    return respond_to_chat(session, payload)

