from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user_id
from backend.database import SessionLocal
from backend.models.chat import ChatMessage, ChatSession
from backend.schemas.chat import ChatMessageRequest
from backend.services.rag_service import generate_rag_response


router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/sessions")
def create_chat_session(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    session = ChatSession(
        user_id=user_id
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "message": "Chat session created successfully",
        "session_id": session.session_id
    }


@router.get("/sessions")
def get_my_chat_sessions(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )

    return [
        {
            "session_id": session.session_id,
            "created_at": session.created_at
        }
        for session in sessions
    ]


@router.get("/sessions/{session_id}")
def get_chat_history(
    session_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.session_id == session_id,
            ChatSession.user_id == user_id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found"
        )

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return {
        "session_id": session_id,
        "messages": [
            {
                "message_id": message.message_id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at
            }
            for message in messages
        ]
    }


@router.post("/sessions/{session_id}/message")
def send_message(
    session_id: int,
    message_data: ChatMessageRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Make sure the session belongs to the logged-in technician.
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.session_id == session_id,
            ChatSession.user_id == user_id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found"
        )

    # Store technician's message.
    user_message = ChatMessage(
        session_id=session_id,
        role="user",
        content=message_data.message
    )

    db.add(user_message)
    db.commit()

    response = generate_rag_response(
        db=db,
        question=message_data.message
    )

    # Store Simeon's response.
    assistant_message = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=response["answer"]
    )

    db.add(assistant_message)
    db.commit()

    return {
        "session_id": session_id,
        "answer": response["answer"],
        "knowledge_found": response["knowledge_found"],
        "sources": response["sources"]
    }