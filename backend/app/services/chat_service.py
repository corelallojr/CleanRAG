from __future__ import annotations

from sqlalchemy import select

from app.models.db_models import Message
from app.models.schemas import ChatRespondRequest, ChatRespondResult
from app.services.ollama_service import generate_chat
from app.services.repository import add_message
from app.services.vector_service import search_project


SYSTEM_PROMPT = """You are CleanRAG, a local retrieval assistant. Answer clearly and cite sources when retrieval context is provided."""


def respond_to_chat(session, payload: ChatRespondRequest) -> ChatRespondResult:
    citations = search_project(payload.projectId, payload.message, payload.sourceId) if payload.useRetrieval else []

    prompt_parts = [SYSTEM_PROMPT]
    if citations:
        prompt_parts.append("Context:")
        prompt_parts.extend([f"- {citation.sourceName} [{citation.locator}]: {citation.excerpt}" for citation in citations])
    prompt_parts.append(f"User question: {payload.message}")
    response_text = generate_chat(payload.model, "\n\n".join(prompt_parts))

    user_message = add_message(session, payload.chatId, "user", payload.message, [])
    assistant_message = add_message(session, payload.chatId, "assistant", response_text, [citation.model_dump() for citation in citations])
    return ChatRespondResult(userMessage=user_message, assistantMessage=assistant_message)

