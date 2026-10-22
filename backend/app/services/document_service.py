"""
Document Ingestion & Management Service
=======================================
Handles multi-format course materials ingestion (PDFs, Markdown, Text notes).
Extracts text, applies recursive semantic chunking, embeds, and updates ChromaDB.
"""

import os
import re
import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple

import pypdf
from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.app.core.config import settings
from backend.app.models.schemas import CourseMaterial, DocumentUploadResponse
from backend.app.services.vector_service import vector_service

# Recognized default curriculum files
DEFAULT_CURRICULUM_FILES = {
    "module1_pointers_and_memory.md": "Module 1: Pointers & Dynamic Memory Management",
    "module2_recursion_and_trees.md": "Module 2: Recursion & Binary Trees",
    "module3_complexity_and_sorting.md": "Module 3: Asymptotic Analysis & Sorting Algorithms",
}

class DocumentService:
    def __init__(self):
        self.uploads_dir = settings.CURRICULUM_PATH / "uploads"
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=650,
            chunk_overlap=100,
            separators=["\n## ", "\n### ", "\n\n", "\n", ". ", " "],
        )

    def _sanitize_filename(self, filename: str) -> str:
        """Sanitizes filename against directory traversal attacks."""
        clean = Path(filename).name
        clean = re.sub(r"[^\w\s\.\-]", "", clean)
        return clean.strip().replace(" ", "_")

    def extract_text_from_pdf(self, file_path: Path) -> Tuple[str, List[Dict[str, str]]]:
        """
        Extracts textual content from a PDF file page by page.
        Returns document title and list of {section: str, content: str}.
        """
        reader = pypdf.PdfReader(str(file_path))
        title = file_path.stem.replace("_", " ").title()

        # Try reading embedded metadata title
        if reader.metadata and reader.metadata.title:
            title = str(reader.metadata.title).strip()

        sections = []
        for idx, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text() or ""
            page_clean = page_text.strip()
            if page_clean:
                sections.append({
                    "section": f"Page {idx}",
                    "content": page_clean,
                })

        return title, sections

    def extract_text_from_markdown(self, file_path: Path) -> Tuple[str, List[Dict[str, str]]]:
        """
        Extracts content from Markdown file with header preservation.
        """
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Extract Module Title (H1)
        h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        title = h1_match.group(1).strip() if h1_match else file_path.stem.replace("_", " ").title()

        # Split content by H2 headers (## Section)
        raw_sections = re.split(r"\n(?=##\s+)", content)
        sections = []

        for sec in raw_sections:
            sec_clean = sec.strip()
            if not sec_clean:
                continue

            h2_match = re.search(r"^##\s+(.+)$", sec_clean, re.MULTILINE)
            section_title = h2_match.group(1).strip() if h2_match else "Overview"
            sections.append({
                "section": section_title,
                "content": sec_clean,
            })

        return title, sections

    def extract_text_from_txt(self, file_path: Path) -> Tuple[str, List[Dict[str, str]]]:
        """
        Extracts content from plain text file.
        """
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        title = file_path.stem.replace("_", " ").title()
        return title, [{"section": "Full Notes", "content": content.strip()}]

    def ingest_file(self, file_bytes: bytes, filename: str) -> DocumentUploadResponse:
        """
        Saves uploaded file to uploads directory, extracts content, chunks,
        and indexes chunks into ChromaDB.
        """
        sanitized = self._sanitize_filename(filename)
        extension = Path(sanitized).suffix.lower()

        if extension not in [".pdf", ".md", ".txt"]:
            raise ValueError(f"Unsupported file type '{extension}'. Allowed: .pdf, .md, .txt")

        target_path = self.uploads_dir / sanitized
        with open(target_path, "wb") as f:
            f.write(file_bytes)

        # Parse text based on format
        if extension == ".pdf":
            title, sections = self.extract_text_from_pdf(target_path)
            file_type_label = "PDF"
        elif extension == ".md":
            title, sections = self.extract_text_from_markdown(target_path)
            file_type_label = "Markdown"
        else:
            title, sections = self.extract_text_from_txt(target_path)
            file_type_label = "Text"

        if not sections:
            raise ValueError(f"No readable text could be extracted from {filename}.")

        # Chunk sections using RecursiveCharacterTextSplitter
        chunks = []
        chunk_idx = 0
        module_id = Path(sanitized).stem

        for sec in sections:
            sec_name = sec["section"]
            sec_text = sec["content"]

            sub_chunks = self.text_splitter.split_text(sec_text)
            for sub in sub_chunks:
                if not sub.strip():
                    continue

                doc_id = f"custom_{module_id}_c{chunk_idx}"
                chunks.append({
                    "id": doc_id,
                    "text": sub.strip(),
                    "metadata": {
                        "module_id": module_id,
                        "title": title,
                        "section": sec_name,
                        "source": sanitized,
                        "source_type": file_type_label.lower(),
                    }
                })
                chunk_idx += 1

        if not chunks:
            raise ValueError("No valid semantic chunks generated from document.")

        # Delete any previous version of this document from ChromaDB to prevent duplicates
        vector_service.delete_by_source(sanitized)

        # Index new chunks into ChromaDB
        texts = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]
        ids = [c["id"] for c in chunks]

        vector_service.add_documents(texts=texts, metadatas=metadatas, ids=ids)

        return DocumentUploadResponse(
            status="success",
            message=f"Successfully indexed '{sanitized}' into vector knowledge base.",
            filename=sanitized,
            file_type=file_type_label,
            chunks_created=len(chunks),
            title=title,
        )

    def list_all_materials(self) -> List[CourseMaterial]:
        """
        Aggregates all indexed materials from ChromaDB and matches with filesystem files.
        """
        data = vector_service.get_all_collection_data()
        metadatas = data.get("metadatas", [])

        # Group chunk count and sections by source
        source_stats: Dict[str, Dict[str, Any]] = {}
        for meta in metadatas:
            if not meta:
                continue
            src = meta.get("source", "unknown")
            if src not in source_stats:
                source_stats[src] = {
                    "title": meta.get("title", src),
                    "chunks": 0,
                    "sections": set(),
                    "source_type": meta.get("source_type", "markdown").upper(),
                }
            source_stats[src]["chunks"] += 1
            if meta.get("section"):
                source_stats[src]["sections"].add(meta["section"])

        results: List[CourseMaterial] = []

        # 1. Check default curriculum files in curriculum_docs/
        for fname, default_title in DEFAULT_CURRICULUM_FILES.items():
            fpath = settings.CURRICULUM_PATH / fname
            size = fpath.stat().st_size if fpath.exists() else 0
            mod_time = (
                datetime.datetime.fromtimestamp(fpath.stat().st_mtime).strftime("%b %d, %Y")
                if fpath.exists()
                else "Core Course"
            )

            stats = source_stats.get(fname, {})
            results.append(
                CourseMaterial(
                    filename=fname,
                    title=stats.get("title", default_title),
                    file_type="Markdown",
                    total_chunks=stats.get("chunks", 5),
                    sections=sorted(list(stats.get("sections", [])))[:5],
                    size_bytes=size,
                    uploaded_at=mod_time,
                    is_default=True,
                )
            )

        # 2. Check uploaded materials in curriculum_docs/uploads/
        if self.uploads_dir.exists():
            for fpath in self.uploads_dir.iterdir():
                if fpath.is_file():
                    fname = fpath.name
                    size = fpath.stat().st_size
                    mod_time = datetime.datetime.fromtimestamp(fpath.stat().st_mtime).strftime("%b %d, %Y")
                    ext = fpath.suffix.lower().replace(".", "").upper()

                    stats = source_stats.get(fname, {})
                    results.append(
                        CourseMaterial(
                            filename=fname,
                            title=stats.get("title", fpath.stem.replace("_", " ").title()),
                            file_type=ext if ext in ["PDF", "TXT"] else "Markdown",
                            total_chunks=stats.get("chunks", 0),
                            sections=sorted(list(stats.get("sections", [])))[:5],
                            size_bytes=size,
                            uploaded_at=mod_time,
                            is_default=False,
                        )
                    )

        return results

    def delete_material(self, filename: str) -> bool:
        """
        Deletes a user-uploaded material from both disk and ChromaDB.
        Default core curriculum files are protected.
        """
        if filename in DEFAULT_CURRICULUM_FILES:
            raise ValueError("Core university curriculum modules cannot be deleted.")

        sanitized = self._sanitize_filename(filename)
        vector_service.delete_by_source(sanitized)

        file_path = self.uploads_dir / sanitized
        if file_path.exists():
            file_path.unlink()

        return True

document_service = DocumentService()
