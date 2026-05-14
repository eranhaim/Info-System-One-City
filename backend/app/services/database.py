from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_db():
    return get_client().get_default_database()


def cities_col():
    return get_db()["cities"]


def users_col():
    return get_db()["users"]


def chat_logs_col():
    return get_db()["chat_logs"]


def inquiries_col():
    return get_db()["inquiries"]
