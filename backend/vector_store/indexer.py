"""
Curriculum Vector Indexer (LangChain + ChromaDB)
================================================
Chunks university lecture notes into semantic units, computes dense 384-dimensional
vector embeddings using all-MiniLM-L6-v2, and indexes into a persistent Chroma database.
"""

import os
import re
from pathlib import Path
from typing import List

from backend.app.core.config import settings

def load_curriculum_documents(curriculum_dir: Path) -> List[dict]:
    """
    Parses markdown lecture documents in curriculum_docs/ into concept chunks.
    Extracts module title, section header, and content.
    """
    documents = []
    md_files = list(curriculum_dir.glob("*.md"))
    
    if not md_files:
        print(f"Warning: No markdown files found in {curriculum_dir}")
        return documents

    for md_file in md_files:
        with open(md_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract Module Title (H1)
        h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        module_title = h1_match.group(1).strip() if h1_match else md_file.stem

        # Split content by H2 headers (## Section)
        sections = re.split(r"\n(?=##\s+)", content)
        
        for idx, sec in enumerate(sections):
            sec_clean = sec.strip()
            if not sec_clean:
                continue

            h2_match = re.search(r"^##\s+(.+)$", sec_clean, re.MULTILINE)
            section_title = h2_match.group(1).strip() if h2_match else "Overview"

            doc_id = f"{md_file.stem}_chunk_{idx}"
            documents.append({
                "id": doc_id,
                "text": sec_clean,
                "metadata": {
                    "module_id": md_file.stem,
                    "title": module_title,
                    "section": section_title,
                    "source": str(md_file.name),
                }
            })

    return documents

def build_vector_index():
    """Indexes chunks into ChromaDB with persistent storage."""
    print("=" * 60)
    print("STEP 1: Reading Curriculum Notes from", settings.CURRICULUM_PATH)
    print("=" * 60)
    
    docs = load_curriculum_documents(settings.CURRICULUM_PATH)
    print(f"Loaded {len(docs)} semantic curriculum chunks.")

    if not docs:
        print("No documents found. Aborting indexing.")
        return

    chroma_dir = str(settings.CHROMA_DB_PATH)
    os.makedirs(chroma_dir, exist_ok=True)

    print("\n" + "=" * 60)
    print(f"STEP 2: Initializing ChromaDB & Embedding Model ({settings.EMBEDDING_MODEL_NAME})")
    print("=" * 60)

    try:
        from langchain_chroma import Chroma
    except ImportError:
        from langchain_community.vectorstores import Chroma

    try:
        from langchain_huggingface import HuggingFaceEmbeddings
    except ImportError:
        from langchain_community.embeddings import HuggingFaceEmbeddings

    embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL_NAME)

    texts = [d["text"] for d in docs]
    metadatas = [d["metadata"] for d in docs]
    ids = [d["id"] for d in docs]

    vectorstore = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
        ids=ids,
        collection_name="curriculum_collection",
        persist_directory=chroma_dir,
    )

    print(f"Successfully indexed {len(docs)} documents into ChromaDB at {chroma_dir}")
    
    # Test query
    print("\n" + "=" * 60)
    print("STEP 3: Running Test Semantic Retrieval Query")
    print("=" * 60)
    test_query = "dangling pointers dynamic heap memory allocation"
    results = vectorstore.similarity_search_with_relevance_scores(test_query, k=2)
    for doc, score in results:
        print(f"Matched: [{doc.metadata.get('section', 'General')}] (Relevance Score: {score:.4f})")
        print(f"Snippet: {doc.page_content[:120]}...\n")

if __name__ == "__main__":
    build_vector_index()
