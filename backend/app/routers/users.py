from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.models.schemas import MessageResponse, UserCreate, UserResponse
from app.services.database import users_col

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users():
    col = users_col()
    docs = await col.find().sort("name", 1).to_list(500)
    return [
        UserResponse(
            id=str(d["_id"]),
            name=d["name"],
            created_at=d.get("created_at", ""),
        )
        for d in docs
    ]


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(body: UserCreate):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="שם עובד לא תקין.")

    col = users_col()
    existing = await col.find_one({"name": name})
    if existing:
        raise HTTPException(status_code=409, detail="עובד בשם זה כבר קיים במערכת.")

    now = datetime.now(timezone.utc).isoformat()
    result = await col.insert_one({"name": name, "created_at": now})
    return UserResponse(id=str(result.inserted_id), name=name, created_at=now)


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(user_id: str):
    col = users_col()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="מזהה עובד לא תקין.")
    result = await col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="עובד לא נמצא.")
    return MessageResponse(message="העובד הוסר בהצלחה.")
