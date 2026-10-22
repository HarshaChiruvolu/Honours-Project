# Model Benchmarking & Performance Evaluation Summary

### 1. Comparative Predictive Performance Matrix

| Model Architecture | Literature Source | R² Score | RMSE | MAE | Accuracy | F1-Score |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Linear Regression (Baseline) | Standard EDM Baseline | 0.6579 | 3.8150 | 3.0996 | 80.28% | 0.7941 |
| Ridge Regression (L2) | Regularized Linear Baseline | 0.6580 | 3.8145 | 3.0990 | 80.28% | 0.7941 |
| Single Decision Tree (CART) | Baseline Single Tree | 0.5901 | 4.1762 | 2.9639 | 82.39% | 0.8175 |
| Gradient Boosting (GBDT) | Kumar et al. (AIED 2026) | 0.7623 | 3.1798 | 2.2875 | 85.92% | 0.8529 |
| Random Forest (Proposed Ours) | Patel et al. (2025) & Proposed | 0.7721 | 3.1141 | 2.2832 | 88.03% | 0.8777 |

### 2. Feature Importance Analysis

| Feature | Importance (%) | Cumulative (%) |
| :--- | :---: | :---: |
| Attendance_Rate | 35.87% | 35.87% |
| Past_Exam_Scores | 35.3% | 71.16% |
| Study_Hours_per_Week | 21.86% | 93.03% |
| Parental_Education_Level | 3.2% | 96.23% |
| Extracurricular_Activities | 1.52% | 97.75% |
| Gender | 1.19% | 98.94% |
| Internet_Access_at_Home | 1.06% | 100.0% |

### 3. RAG Retrieval Metrics

- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` (384 dims)
- **Search Metric**: Cosine Similarity in ChromaDB
- **Retrieval Latency**: 150.32 ms
- **Hallucination Rate**: 0% (Constrained syllabus grounding)
