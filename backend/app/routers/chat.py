import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import ChatRequest, ChatResponse, InquiryCloseRequest, MessageResponse
from app.services import gentrix_service
from app.services.database import cities_col, chat_logs_col, inquiries_col

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    city = await cities_col().find_one({"city_id": body.city_id})
    if not city:
        raise HTTPException(status_code=404, detail="יישוב לא נמצא.")

    widget_id = city.get("widget_id")
    if not widget_id:
        raise HTTPException(
            status_code=400,
            detail="לא הוגדר סוכן עבור יישוב זה. יש להגדיר widget_id בהגדרות היישוב.",
        )

    try:
        is_new_session = not body.session_id
        conversation_id = body.session_id
        if not conversation_id:
            conversation_id = await gentrix_service.init_conversation(widget_id)

        started_at = datetime.now(timezone.utc)
        answer = await gentrix_service.send_message(
            widget_id, conversation_id, body.question
        )
        answered_at = datetime.now(timezone.utc)
        duration_ms = int((answered_at - started_at).total_seconds() * 1000)

        log_doc = {
            "user_id": body.user_id,
            "city_id": body.city_id,
            "session_id": conversation_id,
            "question": body.question,
            "answer": answer,
            "started_at": started_at.isoformat(),
            "answered_at": answered_at.isoformat(),
            "duration_ms": duration_ms,
        }
        await chat_logs_col().insert_one(log_doc)

        if is_new_session:
            inquiry_doc = {
                "user_id": body.user_id,
                "city_id": body.city_id,
                "session_id": conversation_id,
                "message_count": 1,
                "opened_at": started_at.isoformat(),
                "closed_at": None,
                "total_duration_ms": None,
            }
            await inquiries_col().insert_one(inquiry_doc)
        else:
            await inquiries_col().update_one(
                {"session_id": conversation_id},
                {"$inc": {"message_count": 1}},
            )

        return ChatResponse(answer=answer, session_id=conversation_id)

    except HTTPException:
        raise
    except Exception:
        logger.exception("Gentrix chat failed for city=%s", body.city_id)
        raise HTTPException(status_code=502, detail="שגיאה בתקשורת עם הסוכן. נסה שוב.")


@router.post("/chat/close", response_model=MessageResponse)
async def close_inquiry(body: InquiryCloseRequest):
    """Mark an inquiry as handled and record the total duration."""
    col = inquiries_col()
    inquiry = await col.find_one({"session_id": body.session_id})
    if not inquiry:
        raise HTTPException(status_code=404, detail="פנייה לא נמצאה.")

    closed_at = datetime.now(timezone.utc)
    opened_at = datetime.fromisoformat(inquiry["opened_at"])
    total_duration_ms = int((closed_at - opened_at).total_seconds() * 1000)

    await col.update_one(
        {"session_id": body.session_id},
        {"$set": {
            "closed_at": closed_at.isoformat(),
            "total_duration_ms": total_duration_ms,
        }},
    )

    return MessageResponse(message="הפנייה סומנה כטופלה.")


@router.get("/chat/sessions")
async def chat_sessions(user_id: str = Query(...)):
    """Return the user's recent inquiry sessions with the first question as title."""
    col = inquiries_col()
    docs = await col.find({"user_id": user_id}).sort("opened_at", -1).limit(50).to_list(50)

    sessions = []
    for d in docs:
        title = ""
        first_msg = await chat_logs_col().find_one(
            {"session_id": d["session_id"]},
            sort=[("started_at", 1)],
        )
        if first_msg:
            title = first_msg.get("question", "")[:80]

        sessions.append({
            "session_id": d.get("session_id", ""),
            "city_id": d.get("city_id", ""),
            "title": title,
            "message_count": d.get("message_count", 0),
            "opened_at": d.get("opened_at", ""),
            "closed_at": d.get("closed_at"),
        })

    return sessions


@router.get("/chat/history/{session_id}")
async def chat_history(session_id: str):
    """Return all messages for a session, ordered chronologically."""
    col = chat_logs_col()
    docs = await col.find({"session_id": session_id}).sort("started_at", 1).to_list(500)
    return [
        {"question": d.get("question", ""), "answer": d.get("answer", "")}
        for d in docs
    ]
