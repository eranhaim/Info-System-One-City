from pydantic import BaseModel


class CityCreate(BaseModel):
    name: str


class CityResponse(BaseModel):
    id: str
    name: str
    file_count: int


class FileResponse(BaseModel):
    filename: str
    size_bytes: int
    city_id: str


class ChatRequest(BaseModel):
    city_id: str
    question: str
    session_id: str | None = None


class SourceDocument(BaseModel):
    filename: str
    page_content: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceDocument]
    session_id: str


class MessageResponse(BaseModel):
    message: str
