import logging
import pickle
import tempfile
from collections import OrderedDict
from pathlib import Path

import faiss
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings

from app.config import settings
from app.services import s3_service

logger = logging.getLogger(__name__)

MAX_CACHED = 20


class VectorStoreManager:
    """Manages per-city FAISS indexes with an in-memory LRU cache backed by S3."""

    def __init__(self) -> None:
        self._cache: OrderedDict[str, FAISS] = OrderedDict()
        self._embeddings = OpenAIEmbeddings(
            model=settings.embedding_model_name,
            openai_api_key=settings.openai_api_key,
        )

    def _evict_if_needed(self) -> None:
        while len(self._cache) > MAX_CACHED:
            self._cache.popitem(last=False)

    def get(self, city_id: str) -> FAISS | None:
        """Load a city's FAISS index from cache or S3."""
        if city_id in self._cache:
            self._cache.move_to_end(city_id)
            return self._cache[city_id]

        data = s3_service.download_vector_store(city_id)
        if data is None:
            return None

        faiss_bytes, pkl_bytes = data
        store = self._deserialize(faiss_bytes, pkl_bytes)
        self._cache[city_id] = store
        self._evict_if_needed()
        return store

    def add_documents(self, city_id: str, documents: list[Document]) -> None:
        """Add documents to a city's index and persist to S3."""
        store = self.get(city_id)
        if store is None:
            store = FAISS.from_documents(documents, self._embeddings)
        else:
            store.add_documents(documents)

        self._cache[city_id] = store
        self._evict_if_needed()
        self._persist(city_id, store)

    def rebuild(self, city_id: str, documents: list[Document]) -> None:
        """Rebuild the entire index for a city from scratch."""
        if not documents:
            self._cache.pop(city_id, None)
            s3_service.delete_vector_store(city_id)
            return

        store = FAISS.from_documents(documents, self._embeddings)
        self._cache[city_id] = store
        self._evict_if_needed()
        self._persist(city_id, store)

    def delete(self, city_id: str) -> None:
        self._cache.pop(city_id, None)
        s3_service.delete_vector_store(city_id)

    def similarity_search(
        self, city_id: str, query: str, k: int | None = None
    ) -> list[Document]:
        store = self.get(city_id)
        if store is None:
            return []
        return store.similarity_search(query, k=k or settings.retriever_k)

    def as_retriever(self, city_id: str):
        store = self.get(city_id)
        if store is None:
            return None
        return store.as_retriever(
            search_kwargs={"k": settings.retriever_k}
        )

    def _persist(self, city_id: str, store: FAISS) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            store.save_local(str(path))
            faiss_bytes = (path / "index.faiss").read_bytes()
            pkl_bytes = (path / "index.pkl").read_bytes()
            s3_service.upload_vector_store(city_id, faiss_bytes, pkl_bytes)

    def _deserialize(self, faiss_bytes: bytes, pkl_bytes: bytes) -> FAISS:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            (path / "index.faiss").write_bytes(faiss_bytes)
            (path / "index.pkl").write_bytes(pkl_bytes)
            return FAISS.load_local(
                str(path), self._embeddings, allow_dangerous_deserialization=True
            )


vector_store_manager = VectorStoreManager()
