import logging
import uuid
from collections import OrderedDict

from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI

from app.config import settings
from app.services.vector_store import vector_store_manager

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a professional information assistant at "One City" (עיר אחת), \
a municipal telephone service center.

Your sole purpose is to help phone receptionists find accurate information \
from the city's knowledge base so they can assist callers quickly and reliably.

## Instructions

1. Answer ONLY based on the provided context documents below. \
   Do not use any external or prior knowledge.
2. If the answer is not explicitly stated in the context, reason about \
   whether it can be inferred from the available information. \
   If it can, provide the inferred answer and note that it is inferred. \
   If it truly cannot be answered, say clearly: \
   "לא נמצא מידע בנושא זה במאגר. נסה לנסח את השאלה אחרת או פנה למנהל המערכת."
3. When the question is ambiguous or could refer to multiple topics, \
   address the most likely interpretation and briefly mention alternatives.
4. Keep answers concise and practical — the receptionist needs to relay \
   the information over the phone.
5. When citing specific facts (dates, phone numbers, addresses, names), \
   quote them exactly as they appear in the context.
6. ALWAYS respond in Hebrew, regardless of the language the question is asked in.

## Context Documents

{context}"""

CONDENSE_PROMPT = """\
Given the following conversation history and a new follow-up question, \
rephrase the follow-up question into a standalone question that captures \
the full intent. Keep the language of the original question. \
If the new question is already standalone, return it unchanged.

Chat history:
{chat_history}

Follow-up question: {question}

Standalone question:"""

MAX_SESSIONS = 500


def _format_docs(docs: list[Document]) -> str:
    if not docs:
        return "(No documents found)"
    parts = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "unknown")
        parts.append(f"[{i}] (source: {source})\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


def _format_chat_history(messages: list) -> str:
    lines = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            lines.append(f"User: {msg.content}")
        elif isinstance(msg, AIMessage):
            lines.append(f"Assistant: {msg.content}")
    return "\n".join(lines)


class RAGService:
    def __init__(self) -> None:
        self._histories: OrderedDict[str, list] = OrderedDict()
        self._llm = ChatOpenAI(
            model=settings.llm_model_name,
            openai_api_key=settings.openai_api_key,
            temperature=settings.llm_temperature,
        )
        self._condense_llm = ChatOpenAI(
            model=settings.llm_model_name,
            openai_api_key=settings.openai_api_key,
            temperature=0.0,
        )

        self._qa_prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history"),
            ("human", "{question}"),
        ])

        self._condense_prompt = ChatPromptTemplate.from_template(CONDENSE_PROMPT)
        self._condense_chain = (
            self._condense_prompt | self._condense_llm | StrOutputParser()
        )

    def _get_history(self, session_id: str) -> list:
        if session_id in self._histories:
            self._histories.move_to_end(session_id)
            return self._histories[session_id]

        history: list = []
        self._histories[session_id] = history
        while len(self._histories) > MAX_SESSIONS:
            self._histories.popitem(last=False)
        return history

    def _trim_history(self, history: list) -> list:
        """Keep only the last N exchanges (2 messages per exchange)."""
        max_messages = settings.memory_window * 2
        if len(history) > max_messages:
            return history[-max_messages:]
        return history

    def query(
        self, city_id: str, question: str, session_id: str | None = None
    ) -> dict:
        if session_id is None:
            session_id = uuid.uuid4().hex

        retriever = vector_store_manager.as_retriever(city_id)
        if retriever is None:
            return {
                "answer": "אין עדיין מסמכים עבור יישוב זה. יש להעלות קבצים ולסנכרן את האינדקס תחילה.",
                "sources": [],
                "session_id": session_id,
            }

        history = self._get_history(session_id)
        trimmed = self._trim_history(history)

        try:
            if trimmed:
                standalone_q = self._condense_chain.invoke({
                    "chat_history": _format_chat_history(trimmed),
                    "question": question,
                })
            else:
                standalone_q = question

            retrieved_docs: list[Document] = retriever.invoke(standalone_q)
            context = _format_docs(retrieved_docs)

            response = self._qa_prompt | self._llm | StrOutputParser()
            answer = response.invoke({
                "context": context,
                "chat_history": trimmed,
                "question": question,
            })

            history.append(HumanMessage(content=question))
            history.append(AIMessage(content=answer))

            sources = []
            seen: set[tuple[str, str]] = set()
            for doc in retrieved_docs:
                filename = doc.metadata.get("source", "unknown")
                snippet = doc.page_content[:300]
                key = (filename, snippet)
                if key not in seen:
                    seen.add(key)
                    sources.append({"filename": filename, "page_content": snippet})

            return {
                "answer": answer,
                "sources": sources,
                "session_id": session_id,
            }

        except Exception:
            logger.exception("RAG query failed for city=%s", city_id)
            return {
                "answer": "אירעה שגיאה בעיבוד השאלה. נסה שוב.",
                "sources": [],
                "session_id": session_id,
            }


rag_service = RAGService()
