import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GENTRIX_CHAT_BASE = "https://app.gentrix.ai/api/chat/widget"
GENTRIX_FOLDERS_BASE = "https://app.gentrix.ai/api/folders"

_TIMEOUT = httpx.Timeout(60.0, connect=10.0)


def _auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.gentrix_api_key}"}


# -------------------- Chat --------------------


async def init_conversation(
    widget_id: str, metadata: dict | None = None
) -> str:
    """Start a new conversation with a Gentrix agent. Returns conversationId."""
    payload: dict = {"widgetId": widget_id}
    if metadata:
        payload["metadata"] = metadata

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            f"{GENTRIX_CHAT_BASE}/init",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info("Gentrix conversation started: %s", data.get("conversationId"))
        return data["conversationId"]


async def send_message(
    widget_id: str, conversation_id: str, message: str
) -> str:
    """Send a user message and return the agent's reply text."""
    payload = {
        "widgetId": widget_id,
        "conversationId": conversation_id,
        "messages": [{"role": "user", "content": message}],
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            GENTRIX_CHAT_BASE,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        return data.get("content") or data.get("message") or data.get("answer", "")
    return str(data)


# -------------------- Knowledge Base Files --------------------


async def list_documents(folder_id: str) -> list[dict]:
    """List all documents in a Gentrix agent's knowledge folder."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(
            f"{GENTRIX_FOLDERS_BASE}/{folder_id}/documents",
            headers=_auth_headers(),
        )
        resp.raise_for_status()
        return resp.json()


async def upload_document(
    folder_id: str, filename: str, data: bytes
) -> dict:
    """Upload a file to a Gentrix agent's knowledge folder."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            f"{GENTRIX_FOLDERS_BASE}/{folder_id}/documents",
            headers=_auth_headers(),
            files={"file": (filename, data)},
        )
        resp.raise_for_status()
        result = resp.json()
        logger.info("Uploaded %s to Gentrix folder %s", filename, folder_id)
        return result


async def delete_document(folder_id: str, document_id: str) -> None:
    """Delete a specific document from a Gentrix knowledge folder."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.delete(
            f"{GENTRIX_FOLDERS_BASE}/{folder_id}/documents/{document_id}",
            headers=_auth_headers(),
        )
        resp.raise_for_status()
        logger.info(
            "Deleted document %s from Gentrix folder %s", document_id, folder_id
        )


async def find_and_delete_document(folder_id: str, filename: str) -> None:
    """Find a document by filename in Gentrix and delete it."""
    docs = await list_documents(folder_id)
    for doc in docs:
        doc_name = doc.get("name") or doc.get("filename") or ""
        if doc_name == filename:
            doc_id = doc.get("id") or doc.get("documentId")
            if doc_id:
                await delete_document(folder_id, doc_id)
                return
    logger.warning(
        "Document %s not found in Gentrix folder %s – skipping delete",
        filename,
        folder_id,
    )
