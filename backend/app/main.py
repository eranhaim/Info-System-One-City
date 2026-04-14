from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, cities, files

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


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
