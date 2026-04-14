from fastapi import APIRouter, HTTPException, UploadFile

from app.models.schemas import FileResponse, MessageResponse
from app.services import s3_service
from app.services.document_loader import SUPPORTED_EXTENSIONS, chunk_document
from app.services.vector_store import vector_store_manager

router = APIRouter(prefix="/cities/{city_id}/files", tags=["files"])


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

    chunks = chunk_document(file.filename, data)
    vector_store_manager.add_documents(city_id, chunks)

    return FileResponse(filename=file.filename, size_bytes=size, city_id=city_id)


@router.delete("/{filename}", response_model=MessageResponse)
async def delete_file(city_id: str, filename: str):
    s3_service.delete_file(city_id, filename)
    _rebuild_index(city_id)
    return MessageResponse(message=f"הקובץ {filename} נמחק בהצלחה.")


def _rebuild_index(city_id: str) -> None:
    """Re-ingest all remaining files to rebuild the FAISS index."""
    files = s3_service.list_files(city_id)
    all_chunks = []
    for f in files:
        data = s3_service.download_file(city_id, f["filename"])
        try:
            chunks = chunk_document(f["filename"], data)
            all_chunks.extend(chunks)
        except ValueError:
            continue
    vector_store_manager.rebuild(city_id, all_chunks)


def _get_ext(filename: str) -> str:
    dot_idx = filename.rfind(".")
    if dot_idx == -1:
        return ""
    return filename[dot_idx:].lower()
