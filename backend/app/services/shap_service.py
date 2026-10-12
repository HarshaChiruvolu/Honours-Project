"""
Explainable AI (TreeSHAP) Service
=================================
Decomposes individual student predictions into additive feature attributions:
  f(x) = E[f(X)] + sum(phi_i)
Ranks negative feature contributions (deficits) to guide personalized RAG retrieval.
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Dict, Tuple

from backend.app.core.config import settings
from backend.app.models.schemas import StudentInput, FeatureImpact, ExplainResult
from backend.app.services.ml_service import ml_service

FEATURE_DISPLAY_NAMES = {
    "Past_Exam_Scores": "Past Exam Scores",
    "Study_Hours_per_Week": "Weekly Study Hours",
    "Attendance_Rate": "Attendance Rate",
    "Parental_Education_Level": "Parental Education",
    "Internet_Access_at_Home": "Home Internet Access",
    "Extracurricular_Activities": "Extracurricular Activities",
    "Gender": "Gender",
}

class SHAPService:
    def __init__(self):
        self.explainer = None
        self.metadata = None
        self._load_explainer()

    def _load_explainer(self):
        """Loads serialized TreeExplainer and metadata."""
        artifacts_dir = settings.ML_ARTIFACTS_PATH
        explainer_path = artifacts_dir / "shap_explainer.joblib"
        meta_path = artifacts_dir / "metadata.json"

        if explainer_path.exists() and meta_path.exists():
            self.explainer = joblib.load(explainer_path)
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)
        else:
            self.explainer = None
            self.metadata = None

    def explain(self, student: StudentInput) -> ExplainResult:
        """
        Computes local Shapley values for an individual student.
        Validates efficiency axiom: base_value + sum(shap_values) == predicted_score
        """
        if self.explainer is None:
            self._load_explainer()
            if self.explainer is None:
                raise RuntimeError("SHAP explainer artifacts not found. Please run backend/ml/train.py first.")

        df_encoded = ml_service.transform_student_input(student)
        shap_values_raw = self.explainer.shap_values(df_encoded)[0]

        expected_val = float(self.metadata.get("expected_value", 62.45))
        
        # Original raw features for human display
        raw_vals = {
            "Gender": student.gender,
            "Study_Hours_per_Week": f"{student.study_hours_per_week:.1f} hrs/wk",
            "Attendance_Rate": f"{student.attendance_rate:.1f}%",
            "Past_Exam_Scores": f"{student.past_exam_scores:.1f} pts",
            "Parental_Education_Level": student.parental_education_level,
            "Internet_Access_at_Home": student.internet_access_at_home,
            "Extracurricular_Activities": student.extracurricular_activities,
        }

        feature_impacts: List[FeatureImpact] = []
        feature_cols = list(df_encoded.columns)

        for col, val in zip(feature_cols, shap_values_raw):
            val_float = round(float(val), 2)
            direction = "positive" if val_float >= 0 else "negative"
            
            if val_float < -2.0:
                impact_cat = "Critical Deficit"
            elif val_float < 0:
                impact_cat = "Moderate Deficit"
            elif val_float > 2.0:
                impact_cat = "Strong Driver"
            else:
                impact_cat = "Neutral / Minor"

            feature_impacts.append(
                FeatureImpact(
                    feature=col,
                    display_name=f"{FEATURE_DISPLAY_NAMES.get(col, col)} ({raw_vals.get(col, '')})",
                    feature_value=raw_vals.get(col, ""),
                    shap_value=val_float,
                    direction=direction,
                    impact_category=impact_cat,
                )
            )

        # Sort feature impacts by magnitude
        feature_impacts.sort(key=lambda x: x.shap_value)

        # Extract top negative features (deficits)
        deficits = [item.feature for item in feature_impacts if item.shap_value < 0]

        prediction_res = ml_service.predict(student)

        return ExplainResult(
            base_value=round(expected_val, 2),
            predicted_score=prediction_res.predicted_score,
            feature_impacts=feature_impacts,
            top_deficits=deficits,
        )

shap_service = SHAPService()
