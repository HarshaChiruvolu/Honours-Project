"""
Vector Retrieval Service
========================
Interfaces with ChromaDB to retrieve relevant course concepts matching
a student's diagnostic profile or conversational questions.
"""

import os
from pathlib import Path
from typing import List

from backend.app.core.config import settings
from backend.app.models.schemas import RetrievedCurriculumChunk

class VectorService:
    def __init__(self):
        self.vectorstore = None
        self._init_vectorstore()

    def _init_vectorstore(self):
        """Initializes ChromaDB persistent client and embedding function."""
        chroma_dir = str(settings.CHROMA_DB_PATH)
        if not os.path.exists(chroma_dir):
            return

        try:
            try:
                from langchain_chroma import Chroma
            except ImportError:
                from langchain_community.vectorstores import Chroma

            try:
                from langchain_huggingface import HuggingFaceEmbeddings
            except ImportError:
                from langchain_community.embeddings import HuggingFaceEmbeddings

            embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL_NAME)
            self.vectorstore = Chroma(
                collection_name="curriculum_collection",
                embedding_function=embeddings,
                persist_directory=chroma_dir,
            )
        except Exception as e:
            print(f"VectorStore initialization deferred: {e}")
            self.vectorstore = None

    def retrieve(self, query: str, top_k: int = 2) -> List[RetrievedCurriculumChunk]:
        """Retrieves top_k curriculum chunks matching the semantic query."""
        if self.vectorstore is None:
            self._init_vectorstore()
            if self.vectorstore is None:
                # Return empty list or fallback if index hasn't run yet
                return []

        try:
            docs_and_scores = self.vectorstore.similarity_search_with_relevance_scores(
                query, k=top_k
            )
            chunks: List[RetrievedCurriculumChunk] = []

            for doc, score in docs_and_scores:
                meta = doc.metadata or {}
                chunks.append(
                    RetrievedCurriculumChunk(
                        module_id=meta.get("module_id", "module_unknown"),
                        title=meta.get("title", "Curriculum Topic"),
                        section=meta.get("section", "Core Concepts"),
                        similarity_score=round(float(score), 4) if score is not None else 0.85,
                        excerpt=doc.page_content.strip(),
                    )
                )
            return chunks
        except Exception as e:
            print(f"Error during vector retrieval: {e}")
            return []

    def retrieve_for_deficits(self, top_deficits: List[str], top_k: int = 2) -> List[RetrievedCurriculumChunk]:
        """Translates top SHAP negative features into a targeted educational search query."""
        deficit_phrases = []
        for def_feat in top_deficits:
            if "Past_Exam" in def_feat:
                deficit_phrases.append("core foundational programming concepts and call stack tracing")
            elif "Study_Hours" in def_feat:
                deficit_phrases.append("time management, dynamic memory pitfalls, and algorithm analysis")
            elif "Attendance" in def_feat:
                deficit_phrases.append("fundamental lecture topics and data structures")
            else:
                deficit_phrases.append("foundational algorithms and memory models")

        query = " ".join(deficit_phrases) if deficit_phrases else "recursion, pointers, memory, divide and conquer"
        return self.retrieve(query, top_k=top_k)

    def add_documents(self, texts: List[str], metadatas: List[dict], ids: List[str]) -> int:
        """Adds semantic text chunks and metadata directly into persistent ChromaDB."""
        if self.vectorstore is None:
            self._init_vectorstore()
        if self.vectorstore is None:
            raise RuntimeError("ChromaDB vector store is not initialized.")

        self.vectorstore.add_texts(texts=texts, metadatas=metadatas, ids=ids)
        return len(texts)

    def delete_by_source(self, source_name: str) -> int:
        """Deletes any chunks matching the source filename from ChromaDB."""
        if self.vectorstore is None:
            self._init_vectorstore()
        if self.vectorstore is None:
            return 0

        try:
            existing = self.vectorstore.get(where={"source": source_name})
            ids_to_delete = existing.get("ids", [])
            if ids_to_delete:
                self.vectorstore.delete(ids=ids_to_delete)
                return len(ids_to_delete)
        except Exception as e:
            print(f"Error deleting from ChromaDB by source: {e}")
        return 0

    def get_all_collection_data(self) -> dict:
        """Returns all documents and metadata currently indexed in ChromaDB."""
        if self.vectorstore is None:
            self._init_vectorstore()
        if self.vectorstore is None:
            return {"ids": [], "metadatas": []}

        try:
            return self.vectorstore.get(include=["metadatas"])
        except Exception as e:
            print(f"Error fetching collection data: {e}")
            return {"ids": [], "metadatas": []}

vector_service = VectorService()
