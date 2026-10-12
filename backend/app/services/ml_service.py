"""
Machine Learning Inference Service
==================================
Handles Random Forest Regressor predictions and threshold evaluation.
"""

import json
import joblib
import pandas as pd
from typing import Tuple
from pathlib import Path

from backend.app.core.config import settings
from backend.app.models.schemas import StudentInput, PredictionResult

class MLService:
    def __init__(self):
        self.model = None
        self.metadata = None
        self._load_model()
        
    def _load_model(self):
        """Loads serialized RandomForest model and training metadata."""
        artifacts_dir = settings.ML_ARTIFACTS_PATH
        model_path = artifacts_dir / "rf_model.joblib"
        meta_path = artifacts_dir / "metadata.json"
        
        if model_path.exists() and meta_path.exists():
            self.model = joblib.load(model_path)
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)
        else:
            self.model = None
            self.metadata = None

    def transform_student_input(self, student: StudentInput) -> pd.DataFrame:
        """Encodes raw StudentInput Pydantic model into numerical features expected by RF."""
        mappings = {
            "Gender": {"Male": 1, "Female": 0},
            "Internet_Access_at_Home": {"Yes": 1, "No": 0},
            "Extracurricular_Activities": {"Yes": 1, "No": 0},
            "Parental_Education_Level": {
                "High School": 0,
                "Bachelors": 1,
                "Masters": 2,
                "PhD": 3,
            },
        }
        
        row = {
            "Gender": mappings["Gender"].get(student.gender, 1),
            "Study_Hours_per_Week": float(student.study_hours_per_week),
            "Attendance_Rate": float(student.attendance_rate),
            "Past_Exam_Scores": float(student.past_exam_scores),
            "Parental_Education_Level": mappings["Parental_Education_Level"].get(
                student.parental_education_level, 1
            ),
            "Internet_Access_at_Home": mappings["Internet_Access_at_Home"].get(
                student.internet_access_at_home, 1
            ),
            "Extracurricular_Activities": mappings["Extracurricular_Activities"].get(
                student.extracurricular_activities, 0
            ),
        }
        
        feature_order = [
            "Gender",
            "Study_Hours_per_Week",
            "Attendance_Rate",
            "Past_Exam_Scores",
            "Parental_Education_Level",
            "Internet_Access_at_Home",
            "Extracurricular_Activities",
        ]
        
        return pd.DataFrame([row])[feature_order]

    def predict(self, student: StudentInput) -> PredictionResult:
        """Executes inference and returns calibrated score and pass/fail status."""
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("ML model artifacts not found. Please run backend/ml/train.py first.")
                
        df_encoded = self.transform_student_input(student)
        raw_pred = float(self.model.predict(df_encoded)[0])
        clamped_score = round(max(0.0, min(100.0, raw_pred)), 2)
        
        threshold = settings.PASSING_SCORE
        margin = round(clamped_score - threshold, 2)
        status = "Pass" if clamped_score >= threshold else "Fail"
        
        return PredictionResult(
            predicted_score=clamped_score,
            pass_fail_status=status,
            score_margin=margin,
            passing_threshold=threshold,
            model_name="RandomForestRegressor (100 Trees, Bagged)",
        )

ml_service = MLService()
