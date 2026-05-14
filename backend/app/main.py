from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.routers import analytics, chat, cities, files, users

app = FastAPI(title="One City Knowledge System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cities.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


class AdminLoginRequest(BaseModel):
    password: str


@app.post("/api/admin/login")
async def admin_login(body: AdminLoginRequest):
    if body.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="סיסמה שגויה.")
    return {"ok": True}
