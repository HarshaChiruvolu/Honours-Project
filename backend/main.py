"""
FastAPI Microservice Entrypoint
===============================
Explainable Adaptive Learning System using Retrieval-Augmented LLMs.
Exposes REST endpoints for prediction, SHAP explanation, RAG retrieval, and AI tutoring.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.app.core.config import settings
from backend.app.models.schemas import (
    StudentInput,
    PredictionResult,
    ExplainResult,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
)
from backend.app.services.ml_service import ml_service
from backend.app.services.shap_service import shap_service
from backend.app.services.vector_service import vector_service
from backend.app.services.langchain_service import langchain_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable Adaptive Learning System - IIIT Kottayam Honours Project",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint confirming microservice uptime."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_loaded": ml_service.model is not None,
        "chroma_loaded": vector_service.vectorstore is not None,
        "gemini_active": langchain_service.llm is not None,
    }

@app.post("/api/predict", response_model=PredictionResult)
def predict_endpoint(student: StudentInput):
    """Executes Random Forest regression to predict final exam score and pass/fail status."""
    try:
        return ml_service.predict(student)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/explain", response_model=ExplainResult)
def explain_endpoint(student: StudentInput):
    """Executes TreeSHAP to decompose student prediction into additive feature impacts."""
    try:
        return shap_service.explain(student)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SHAP explanation error: {str(e)}")

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_endpoint(student: StudentInput):
    """
    End-to-End Orchestrator:
    1. Predicts final score & pass/fail threshold.
    2. Decomposes individual score using TreeSHAP to isolate negative deficits.
    3. Retrieves top curriculum concepts from ChromaDB matching deficits.
    4. Synthesizes a grounded 3-day recovery roadmap and practice problems via LangChain & Gemini.
    """
    try:
        prediction = ml_service.predict(student)
        explainability = shap_service.explain(student)
        
        # Retrieve curriculum notes grounded in student's top negative features
        retrieved_chunks = vector_service.retrieve_for_deficits(explainability.top_deficits, top_k=2)
        
        # Synthesize adaptive remediation plan
        remediation = langchain_service.generate_remediation(
            student=student,
            prediction=prediction,
            explainability=explainability,
            retrieved_chunks=retrieved_chunks,
        )

        return AnalyzeResponse(
            student_input=student,
            prediction=prediction,
            explainability=explainability,
            retrieved_curriculum=retrieved_chunks,
            remediation=remediation,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """
    Interactive student tutor endpoint.
    Performs semantic retrieval against the course vector store and generates
    academically rigorous explanations grounded in university curriculum docs.
    """
    try:
        return langchain_service.chat_tutor(
            message=request.message,
            history=request.history,
            student_context=request.student_context,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
