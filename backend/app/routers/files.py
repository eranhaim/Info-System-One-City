import logging

from fastapi import APIRouter, HTTPException, UploadFile

from app.models.schemas import FileResponse, MessageResponse
from app.services import s3_service
from app.services import gentrix_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cities/{city_id}/files", tags=["files"])

SUPPORTED_EXTENSIONS = {".txt", ".docx", ".pdf", ".csv", ".doc"}


@router.get("", response_model=list[FileResponse])
async def list_files(city_id: str):
    return [FileResponse(**f) for f in s3_service.list_files(city_id)]


@router.post("", response_model=FileResponse, status_code=201)
async def upload_file(city_id: str, file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="שם קובץ חסר.")

    ext = _get_ext(file.filename)
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"סוג קובץ {ext} אינו נתמך. הסוגים הנתמכים: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    data = await file.read()
    size = s3_service.upload_file(city_id, file.filename, data)

    config = s3_service.get_city_config(city_id)
    folder_id = config.get("folder_id")
    if folder_id:
        try:
            await gentrix_service.upload_document(folder_id, file.filename, data)
        except Exception:
            logger.exception(
                "Failed to upload %s to Gentrix folder %s", file.filename, folder_id
            )

    return FileResponse(filename=file.filename, size_bytes=size, city_id=city_id)


@router.delete("/{filename}", response_model=MessageResponse)
async def delete_file(city_id: str, filename: str):
    s3_service.delete_file(city_id, filename)

    config = s3_service.get_city_config(city_id)
    folder_id = config.get("folder_id")
    if folder_id:
        try:
            await gentrix_service.find_and_delete_document(folder_id, filename)
        except Exception:
            logger.exception(
                "Failed to delete %s from Gentrix folder %s", filename, folder_id
            )

    return MessageResponse(message=f"הקובץ {filename} נמחק בהצלחה.")


def _get_ext(filename: str) -> str:
    dot_idx = filename.rfind(".")
    if dot_idx == -1:
        return ""
    return filename[dot_idx:].lower()
