import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services import s3_service
from app.services import gentrix_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    config = s3_service.get_city_config(body.city_id)
    widget_id = config.get("widget_id")
    if not widget_id:
        raise HTTPException(
            status_code=400,
            detail="לא הוגדר סוכן עבור יישוב זה. יש להגדיר widget_id בהגדרות היישוב.",
        )

    try:
        conversation_id = body.session_id
        if not conversation_id:
            conversation_id = await gentrix_service.init_conversation(widget_id)

        answer = await gentrix_service.send_message(
            widget_id, conversation_id, body.question
        )

        return ChatResponse(answer=answer, session_id=conversation_id)

    except Exception:
        logger.exception("Gentrix chat failed for city=%s", body.city_id)
        raise HTTPException(status_code=502, detail="שגיאה בתקשורת עם הסוכן. נסה שוב.")
