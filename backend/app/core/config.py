import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = BASE_DIR / "backend"
DATA_DIR = BASE_DIR / "data"
CURRICULUM_DIR = BASE_DIR / "curriculum_docs"
ML_ARTIFACTS_DIR = BACKEND_DIR / "ml" / "artifacts"
CHROMA_DIR = BACKEND_DIR / "vector_store" / "chroma_data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Explainable Adaptive Learning System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Paths
    DATA_PATH: Path = DATA_DIR / "student_data.csv"
    ML_ARTIFACTS_PATH: Path = ML_ARTIFACTS_DIR
    CHROMA_DB_PATH: Path = CHROMA_DIR
    CURRICULUM_PATH: Path = CURRICULUM_DIR
    
    # Models
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-3.8-flash"
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Classification / Passing Threshold
    PASSING_SCORE: float = 60.0
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "allow"

settings = Settings()
