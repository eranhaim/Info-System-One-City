import io

from docx import Document as DocxDocument
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.config import settings


def _extract_text_from_docx(data: bytes) -> str:
    doc = DocxDocument(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _extract_text_from_txt(data: bytes) -> str:
    for encoding in ("utf-8", "windows-1255", "iso-8859-8", "latin-1"):
        try:
            return data.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            continue
    return data.decode("utf-8", errors="replace")


EXTRACTORS = {
    ".docx": _extract_text_from_docx,
    ".txt": _extract_text_from_txt,
}

SUPPORTED_EXTENSIONS = set(EXTRACTORS.keys())


def extract_text(filename: str, data: bytes) -> str:
    ext = _get_extension(filename)
    extractor = EXTRACTORS.get(ext)
    if extractor is None:
        raise ValueError(f"Unsupported file type: {ext}")
    return extractor(data)


def chunk_document(filename: str, data: bytes) -> list[Document]:
    """Parse a file and split it into LangChain Document chunks."""
    text = extract_text(filename, data)
    return chunk_text(text, source=filename)


def chunk_text(text: str, source: str = "unknown") -> list[Document]:
    """Split plain text into LangChain Document chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.create_documents(
        texts=[text],
        metadatas=[{"source": source}],
    )


def _get_extension(filename: str) -> str:
    dot_idx = filename.rfind(".")
    if dot_idx == -1:
        return ""
    return filename[dot_idx:].lower()
