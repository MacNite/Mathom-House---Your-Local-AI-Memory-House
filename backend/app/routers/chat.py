"""Follow-up AI chat, grounded in a Mathom's transcript."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user, owns
from app.models import ChatMessage, Mathom, User
from app.schemas import ChatMessageOut, ChatRequest
from app.services import ollama

router = APIRouter(prefix="/mathoms/{mathom_id}/chat", tags=["chat"])


def _get_mathom(mathom_id: int, db: Session, user: User | None) -> Mathom:
    mathom = db.get(Mathom, mathom_id)
    if mathom is None or not owns(mathom, user):
        raise HTTPException(status_code=404, detail="Mathom not found")
    return mathom


@router.get("", response_model=list[ChatMessageOut])
def list_messages(
    mathom_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> list[ChatMessage]:
    return _get_mathom(mathom_id, db, user).chat_messages


@router.post("", response_model=list[ChatMessageOut])
def send_message(
    mathom_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> list[ChatMessage]:
    mathom = _get_mathom(mathom_id, db, user)
    if not mathom.transcript:
        raise HTTPException(status_code=409, detail="Mathom has no transcript yet")

    history = [{"role": m.role, "content": m.content} for m in mathom.chat_messages]
    reply = ollama.followup_chat(
        mathom.transcript, history, payload.message, language=mathom.language
    )

    db.add(ChatMessage(mathom_id=mathom.id, role="user", content=payload.message))
    db.add(ChatMessage(mathom_id=mathom.id, role="assistant", content=reply))
    db.commit()
    db.refresh(mathom)
    return mathom.chat_messages


@router.delete("", status_code=204)
def clear_chat(
    mathom_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> None:
    mathom = _get_mathom(mathom_id, db, user)
    for message in list(mathom.chat_messages):
        db.delete(message)
    db.commit()
