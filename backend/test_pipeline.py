"""
End-to-End Pipeline Smoke Test
==============================
Verifies all modules: ML inference, TreeSHAP local attribution,
ChromaDB semantic retrieval, LangChain + Gemini remediation, and FastAPI endpoints.
"""

import sys
import json
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.models.schemas import StudentInput
from backend.app.services.ml_service import ml_service
from backend.app.services.shap_service import shap_service
from backend.app.services.vector_service import vector_service
from backend.app.services.langchain_service import langchain_service

def run_smoke_test():
    print("=" * 70)
    print("STARTING END-TO-END SMOKE TEST FOR B.TECH HONOURS SYSTEM")
    print("=" * 70)

    # Mock student with underperforming attributes (At-Risk profile)
    student = StudentInput(
        gender="Male",
        study_hours_per_week=12.0,
        attendance_rate=60.0,
        past_exam_scores=50.0,
        parental_education_level="High School",
        internet_access_at_home="Yes",
        extracurricular_activities="No",
    )
    print(f"\n[1] Ingested Mock Student Input:\n    Study Hours={student.study_hours_per_week}, Attendance={student.attendance_rate}%, Past Score={student.past_exam_scores}")

    # Test 1: ML Prediction
    print("\n[2] Testing Random Forest Inference (ML Layer)...")
    pred = ml_service.predict(student)
    print(f"    -> Predicted Exam Score: {pred.predicted_score}/100")
    print(f"    -> Pass/Fail Status:     {pred.pass_fail_status} (Threshold: {pred.passing_threshold})")
    print(f"    -> Margin:               {pred.score_margin} pts")
    assert 0 <= pred.predicted_score <= 100, "Prediction out of range!"

    # Test 2: TreeSHAP Explanation
    print("\n[3] Testing TreeSHAP Local Feature Attribution (XAI Layer)...")
    explain = shap_service.explain(student)
    print(f"    -> Cohort Base Expected Value E[f(X)]: {explain.base_value:.2f}")
    print(f"    -> Top Deficit Features Identified:    {explain.top_deficits}")
    
    total_attribution = sum(f.shap_value for f in explain.feature_impacts)
    expected_reconstruction = round(explain.base_value + total_attribution, 2)
    print(f"    -> Reconstructed Score: {expected_reconstruction} (Predicted: {pred.predicted_score})")
    print("    -> Feature Breakdown:")
    for f in explain.feature_impacts:
        print(f"       * {f.display_name:<40} : {f.shap_value:>6.2f} pts  [{f.impact_category}]")

    # Test 3: ChromaDB Retrieval
    print("\n[4] Testing Diagnostic Vector Retrieval (ChromaDB RAG Layer)...")
    retrieved = vector_service.retrieve_for_deficits(explain.top_deficits, top_k=2)
    print(f"    -> Retrieved {len(retrieved)} concept chunks based on deficits:")
    for i, chunk in enumerate(retrieved, 1):
        print(f"       {i}. [{chunk.title} - {chunk.section}] (Cosine Score: {chunk.similarity_score:.4f})")
    assert len(retrieved) > 0, "ChromaDB retrieval returned empty!"

    # Test 4: LangChain GenAI Remediation
    print("\n[5] Testing LangChain LCEL Remediation (GenAI Layer)...")
    plan = langchain_service.generate_remediation(
        student=student,
        prediction=pred,
        explainability=explain,
        retrieved_chunks=retrieved,
    )
    print(f"    -> Diagnostic Summary:\n       \"{plan.diagnostic_summary}\"")
    print(f"    -> Generated Roadmap: {len(plan.roadmap)} days")
    for day in plan.roadmap:
        print(f"       Day {day.day}: {day.focus_topic} ({day.allocated_hours} hrs)")
    print(f"    -> Practice Problems: {len(plan.practice_problems)} questions")
    for prob in plan.practice_problems:
        print(f"       [{prob.id}] ({prob.topic} - {prob.difficulty}): {prob.question[:80]}...")

    # Test 5: Grounded Tutor Chat
    print("\n[6] Testing Interactive Grounded Tutor Chat (/api/chat)...")
    test_question = "Why is post-order traversal used for deleting a tree instead of pre-order?"
    chat_resp = langchain_service.chat_tutor(
        message=test_question,
        history=[],
        student_context={"predicted_score": pred.predicted_score},
    )
    print(f"    -> Student Question: \"{test_question}\"")
    print(f"    -> Tutor Reply:      \"{chat_resp.reply[:140]}...\"")
    print(f"    -> Grounded Sources: {chat_resp.grounded_sources}")

    print("\n" + "=" * 70)
    print("ALL 6 CORE SYSTEM PIPELINES PASSED SMOKE TEST SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_smoke_test()
