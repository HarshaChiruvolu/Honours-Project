"""
Model Training and TreeSHAP Decomposition Pipeline
===================================================
Author: B.Tech Honours Review Team
Institution: IIIT Kottayam

Computer Science & Machine Learning Mechanics:
----------------------------------------------
1. Bagging & Random Forest:
   - Evaluates an ensemble of B=100 de-correlated decision trees.
   - At each split, selects a random subspace of features m ≈ p/3 to minimize pairwise
     tree correlation (rho), driving down ensemble variance Var(T_bar) -> rho * sigma^2.
2. Cooperative Game Theory (Shapley Values & TreeSHAP):
   - Computes local feature attribution phi_i decomposing individual predictions:
     f(x) = E[f(X)] + sum(phi_i)
   - TreeSHAP uses recursive conditional expectations on decision paths to compute exact
     Shapley values in polynomial O(T * L * D^2) time rather than exponential O(M * 2^M).
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import shap

from backend.app.core.config import settings

# Encodings mapping categorical values to numeric scale
CATEGORICAL_MAPPINGS = {
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

FEATURE_COLUMNS = [
    "Gender",
    "Study_Hours_per_Week",
    "Attendance_Rate",
    "Past_Exam_Scores",
    "Parental_Education_Level",
    "Internet_Access_at_Home",
    "Extracurricular_Activities",
]

def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes and encodes categorical features."""
    data = df.copy()
    if "Student_ID" in data.columns:
        data = data.drop("Student_ID", axis=1)
        
    for col, mapping in CATEGORICAL_MAPPINGS.items():
        if col in data.columns:
            data[col] = data[col].map(mapping)
            
    return data

def train_and_export_artifacts():
    """Trains Random Forest Regressor and fits TreeExplainer, saving all artifacts."""
    print("=" * 60)
    print("STEP 1: Ingesting Student Dataset")
    print("=" * 60)
    
    data_path = settings.DATA_PATH
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
        
    raw_df = pd.read_csv(data_path)
    print(f"Loaded {len(raw_df)} student records from {data_path}")
    
    clean_df = preprocess_dataframe(raw_df)
    
    X = clean_df[FEATURE_COLUMNS]
    y = clean_df["Final_Exam_Score"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print("\n" + "=" * 60)
    print("STEP 2: Training Random Forest Regressor")
    print("=" * 60)
    
    rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    print(f"Test Set R² Score: {r2:.4f}")
    print(f"Test Set RMSE:     {rmse:.4f}")
    
    print("\n" + "=" * 60)
    print("STEP 3: Fitting TreeSHAP Explainer")
    print("=" * 60)
    
    # TreeExplainer calculates exact local Shapley values in polynomial time
    explainer = shap.TreeExplainer(rf, data=X_train)
    
    # Calculate baseline expected value E[f(X)]
    expected_val = float(explainer.expected_value) if np.isscalar(explainer.expected_value) else float(explainer.expected_value[0])
    print(f"Global Expected Baseline Score E[f(X)]: {expected_val:.2f}")
    
    # Verify Additive Efficiency on a test sample: f(x) = E[f(X)] + sum(phi_i)
    sample_x = X_test.iloc[0:1]
    sample_pred = float(rf.predict(sample_x)[0])
    shap_vals = explainer.shap_values(sample_x)[0]
    reconstructed_pred = expected_val + np.sum(shap_vals)
    
    diff = abs(sample_pred - reconstructed_pred)
    print(f"Additive Efficiency Check: Prediction={sample_pred:.4f}, Reconstructed={reconstructed_pred:.4f}, Error={diff:.6f}")
    assert diff < 1e-4, "SHAP efficiency axiom violated!"
    print("Verification Passed: Efficiency axiom strictly holds.")
    
    print("\n" + "=" * 60)
    print("STEP 4: Serializing Artifacts")
    print("=" * 60)
    
    artifacts_dir = settings.ML_ARTIFACTS_PATH
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = artifacts_dir / "rf_model.joblib"
    explainer_path = artifacts_dir / "shap_explainer.joblib"
    metadata_path = artifacts_dir / "metadata.json"
    
    joblib.dump(rf, model_path)
    joblib.dump(explainer, explainer_path)
    
    metadata = {
        "features": FEATURE_COLUMNS,
        "categorical_mappings": CATEGORICAL_MAPPINGS,
        "expected_value": expected_val,
        "test_r2": float(r2),
        "test_rmse": float(rmse),
        "passing_threshold": settings.PASSING_SCORE,
    }
    
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Saved Model:     {model_path}")
    print(f"Saved Explainer: {explainer_path}")
    print(f"Saved Metadata:  {metadata_path}")
    print("Model Training & XAI Pipeline Artifacts Ready.")

if __name__ == "__main__":
    train_and_export_artifacts()
