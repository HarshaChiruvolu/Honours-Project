from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# ==========================================
# 1. Student Input DTO
# ==========================================
class StudentInput(BaseModel):
    """
    Standard student feature vector ingested by ML and XAI layers.
    Reflects academic predictors from the student performance dataset.
    """
    gender: str = Field(default="Male", description="Male or Female")
    study_hours_per_week: float = Field(default=20.0, ge=0.0, le=70.0, description="Weekly hours dedicated to self-study")
    attendance_rate: float = Field(default=75.0, ge=0.0, le=100.0, description="Lecture attendance percentage")
    past_exam_scores: float = Field(default=65.0, ge=0.0, le=100.0, description="Average previous examination score")
    parental_education_level: str = Field(default="Bachelors", description="High School, Bachelors, Masters, or PhD")
    internet_access_at_home: str = Field(default="Yes", description="Yes or No")
    extracurricular_activities: str = Field(default="No", description="Yes or No")

# ==========================================
# 2. Predictive Layer DTOs
# ==========================================
class PredictionResult(BaseModel):
    """Output from the Random Forest Regressor and thresholding classifier."""
    predicted_score: float
    pass_fail_status: str
    score_margin: float
    passing_threshold: float = 60.0
    model_name: str = "RandomForestRegressor (100 Trees, Bagged)"

# ==========================================
# 3. Explainable AI (SHAP) DTOs
# ==========================================
class FeatureImpact(BaseModel):
    """Local Shapley attribution decomposing individual student score."""
    feature: str
    display_name: str
    feature_value: Any
    shap_value: float
    direction: str  # 'positive' or 'negative'
    impact_category: str  # 'Deficit', 'Neutral', or 'Strength'

class ExplainResult(BaseModel):
    """Full TreeSHAP additive decomposition payload."""
    base_value: float
    predicted_score: float
    feature_impacts: List[FeatureImpact]
    top_deficits: List[str]

# ==========================================
# 4. RAG & Vector Retrieval DTOs
# ==========================================
class RetrievedCurriculumChunk(BaseModel):
    """Curriculum notes snippet retrieved from ChromaDB via Cosine Similarity."""
    module_id: str
    title: str
    section: str
    similarity_score: float
    excerpt: str

# ==========================================
# 5. Adaptive Remediation (LangChain + Gemini) DTOs
# ==========================================
class StudyDay(BaseModel):
    day: int
    focus_topic: str
    allocated_hours: float
    action_items: List[str]

class PracticeProblem(BaseModel):
    id: str
    topic: str
    difficulty: str
    question: str
    hint: str
    expected_approach: str

class RemediationPlan(BaseModel):
    """Deterministic Pydantic output structure parsed by LangChain JsonOutputParser."""
    diagnostic_summary: str
    roadmap: List[StudyDay]
    practice_problems: List[PracticeProblem]

# ==========================================
# 6. End-to-End Analysis Response
# ==========================================
class AnalyzeResponse(BaseModel):
    """Consolidated endpoint response combining ML, SHAP, RAG, and LangChain."""
    student_input: StudentInput
    prediction: PredictionResult
    explainability: ExplainResult
    retrieved_curriculum: List[RetrievedCurriculumChunk]
    remediation: RemediationPlan

# ==========================================
# 7. Grounded Chat DTOs
# ==========================================
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    student_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    grounded_sources: List[str] = []

# ==========================================
# 8. Course Materials & Document RAG DTOs
# ==========================================
class CourseMaterial(BaseModel):
    filename: str
    title: str
    file_type: str  # "PDF", "Markdown", "Text"
    total_chunks: int
    sections: List[str]
    size_bytes: int
    uploaded_at: str
    is_default: bool

class DocumentUploadResponse(BaseModel):
    status: str
    message: str
    filename: str
    file_type: str
    chunks_created: int
    title: str
