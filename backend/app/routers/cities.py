import logging
import re

from fastapi import APIRouter, HTTPException

from app.models.schemas import CityCreate, CityResponse, MessageResponse
from app.services import s3_service
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
    cities = s3_service.list_cities()
    return [CityResponse(**c) for c in cities]


@router.post("", response_model=CityResponse, status_code=201)
async def create_city(body: CityCreate):
    city_id = _to_slug(body.name)
    existing = {c["id"] for c in s3_service.list_cities()}
    if city_id in existing:
        raise HTTPException(status_code=409, detail="יישוב זה כבר קיים במערכת.")
    s3_service.create_city(city_id)
    return CityResponse(id=city_id, name=body.name, file_count=0)


@router.delete("/{city_id}", response_model=MessageResponse)
async def delete_city(city_id: str):
    s3_service.delete_city(city_id)
    vector_store_manager.delete(city_id)
    return MessageResponse(message=f"היישוב {city_id} נמחק בהצלחה.")


@router.post("/{city_id}/sync", response_model=MessageResponse)
async def sync_city(city_id: str):
    """Rebuild a city's FAISS index by standardising all files through GPT-4.1."""
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
