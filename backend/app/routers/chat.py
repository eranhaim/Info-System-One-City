from fastapi import APIRouter

from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_chain import rag_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    result = rag_service.query(
        city_id=body.city_id,
        question=body.question,
        session_id=body.session_id,
    )
    return ChatResponse(**result)
