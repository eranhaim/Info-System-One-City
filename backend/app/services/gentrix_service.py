import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GENTRIX_CHAT_BASE = "https://app.gentrix.ai/api/chat/widget"
GENTRIX_FOLDERS_BASE = "https://app.gentrix.ai/api/folders"

_TIMEOUT = httpx.Timeout(120.0, connect=10.0)


def _auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.gentrix_api_key}"}


def _log_error(resp: httpx.Response, context: str) -> None:
    try:
        body = resp.text
    except Exception:
        body = "<unreadable>"
    logger.error(
        "Gentrix %s failed: %s %s – body: %s",
        context,
        resp.status_code,
        resp.reason_phrase,
        body[:500],
    )


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
            headers={**_auth_headers(), "Content-Type": "application/json"},
        )
        if not resp.is_success:
            _log_error(resp, "init_conversation")
        resp.raise_for_status()
        data = resp.json()
        logger.info("Gentrix conversation started: %s", data.get("conversationId"))
        return data["conversationId"]


async def send_message(
    widget_id: str, conversation_id: str, message: str
) -> str:
    """Send a user message and return the agent's reply text.

    The Gentrix chat endpoint returns an SSE stream (text/event-stream).
    We consume all `text-delta` events and concatenate the deltas.
    """
    payload = {
        "widgetId": widget_id,
        "conversationId": conversation_id,
        "messages": [{"role": "user", "content": message}],
    }

    collected: list[str] = []

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with client.stream(
            "POST",
            GENTRIX_CHAT_BASE,
            json=payload,
            headers={**_auth_headers(), "Content-Type": "application/json"},
        ) as resp:
            if not resp.is_success:
                await resp.aread()
                _log_error(resp, "send_message")
                resp.raise_for_status()

            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:]
                if raw == "[DONE]":
                    break
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                if event.get("type") == "text-delta":
                    collected.append(event.get("delta", ""))

    answer = "".join(collected)
    if not answer:
        logger.warning("Gentrix send_message returned empty answer for conv=%s", conversation_id)
    return answer


# -------------------- Knowledge Base Files --------------------


async def list_documents(folder_id: str) -> list[dict]:
    """List all documents in a Gentrix agent's knowledge folder."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(
            f"{GENTRIX_FOLDERS_BASE}/{folder_id}/documents",
            headers=_auth_headers(),
        )
        if not resp.is_success:
            _log_error(resp, "list_documents")
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data


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
        if not resp.is_success:
            _log_error(resp, f"upload_document({filename})")
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
        if not resp.is_success:
            _log_error(resp, f"delete_document({document_id})")
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
