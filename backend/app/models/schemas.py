from pydantic import BaseModel


class CityCreate(BaseModel):
    name: str
    widget_id: str | None = None
    folder_id: str | None = None


class CityResponse(BaseModel):
    id: str
    name: str
    file_count: int
    widget_id: str | None = None
    folder_id: str | None = None


class CityConfigUpdate(BaseModel):
    widget_id: str | None = None
    folder_id: str | None = None


class FileResponse(BaseModel):
    filename: str
    size_bytes: int
    city_id: str


class ChatRequest(BaseModel):
    city_id: str
    question: str
    session_id: str | None = None
    user_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    session_id: str


class InquiryCloseRequest(BaseModel):
    session_id: str
    user_id: str | None = None


class UserCreate(BaseModel):
    name: str


class UserResponse(BaseModel):
    id: str
    name: str
    created_at: str


class MessageResponse(BaseModel):
    message: str
