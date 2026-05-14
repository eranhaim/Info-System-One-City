import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    CityConfigUpdate,
    CityCreate,
    CityResponse,
    MessageResponse,
)
from app.services import s3_service
from app.services.database import cities_col
from app.services.document_loader import chunk_text, extract_text
from app.services.standardiser import standardise
from app.services.vector_store import vector_store_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cities", tags=["cities"])

_SLUG_RE = re.compile(r"^[\w\u0590-\u05FF-]+$")


def _to_slug(name: str) -> str:
    slug = name.strip().replace(" ", "-")
    if not _SLUG_RE.match(slug):
        raise HTTPException(
            status_code=400,
            detail="שם יישוב לא תקין. יש להשתמש באותיות, מספרים ומקפים בלבד.",
        )
    return slug


@router.get("", response_model=list[CityResponse])
async def list_cities():
    col = cities_col()
    cities = await col.find().to_list(500)
    result = []
    for c in cities:
        file_count = s3_service.count_files(c["city_id"])
        result.append(CityResponse(
            id=c["city_id"],
            name=c.get("name", c["city_id"]),
            file_count=file_count,
            widget_id=c.get("widget_id"),
            folder_id=c.get("folder_id"),
        ))
    return result


@router.post("", response_model=CityResponse, status_code=201)
async def create_city(body: CityCreate):
    city_id = _to_slug(body.name)
    col = cities_col()

    existing = await col.find_one({"city_id": city_id})
    if existing:
        raise HTTPException(status_code=409, detail="יישוב זה כבר קיים במערכת.")

    doc = {
        "city_id": city_id,
        "name": body.name,
        "widget_id": body.widget_id,
        "folder_id": body.folder_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await col.insert_one(doc)
    s3_service.create_city(city_id)

    return CityResponse(
        id=city_id,
        name=body.name,
        file_count=0,
        widget_id=body.widget_id,
        folder_id=body.folder_id,
    )


@router.put("/{city_id}/config", response_model=MessageResponse)
async def update_city_config(city_id: str, body: CityConfigUpdate):
    update: dict = {}
    if body.widget_id is not None:
        update["widget_id"] = body.widget_id
    if body.folder_id is not None:
        update["folder_id"] = body.folder_id
    if not update:
        raise HTTPException(status_code=400, detail="לא סופקו שדות לעדכון.")

    col = cities_col()
    result = await col.update_one({"city_id": city_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="יישוב לא נמצא.")
    return MessageResponse(message="ההגדרות עודכנו בהצלחה.")


@router.delete("/{city_id}", response_model=MessageResponse)
async def delete_city(city_id: str):
    col = cities_col()
    await col.delete_one({"city_id": city_id})
    s3_service.delete_city(city_id)
    return MessageResponse(message=f"היישוב {city_id} נמחק בהצלחה.")


@router.post("/{city_id}/sync", response_model=MessageResponse)
async def sync_city(city_id: str):
    """Consolidate all files through GPT-4.1 and rebuild FAISS index."""
    files = s3_service.list_files(city_id)
    if not files:
        raise HTTPException(status_code=400, detail="אין קבצים ליישוב זה.")

    file_texts: dict[str, str] = {}
    for f in files:
        data = s3_service.download_file(city_id, f["filename"])
        try:
            file_texts[f["filename"]] = extract_text(f["filename"], data)
        except ValueError:
            logger.warning("Skipping unsupported file: %s", f["filename"])

    if not file_texts:
        raise HTTPException(status_code=400, detail="לא ניתן היה לחלץ טקסט מהקבצים.")

    consolidated = standardise(file_texts)
    s3_service.upload_consolidated_text(city_id, consolidated)
    chunks = chunk_text(consolidated, source="consolidated.txt")
    vector_store_manager.rebuild(city_id, chunks)

    return MessageResponse(
        message=f"הסנכרון הושלם. {len(file_texts)} קבצים עובדו ל-{len(chunks)} קטעים."
    )
