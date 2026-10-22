# Explainable Adaptive Learning System using Retrieval-Augmented LLMs
### B.Tech Honours Review Prototype • Indian Institute of Information Technology (IIIT) Kottayam

An end-to-end Explainable AI (XAI) and Retrieval-Augmented Generation (RAG) system that predicts undergraduate academic performance, decomposes individual predictions into exact feature contributions using **TreeSHAP**, retrieves relevant course concepts via **ChromaDB**, and generates personalized, grounded 3-day recovery roadmaps using **LangChain** and **Google Gemini**.

---

## 1. System Architecture Overview

```text
+---------------------+     +--------------------------+     +--------------------------+
|  Student Input Form | --> |  Random Forest Regressor | --> |   TreeSHAP Explainer     |
| (Hours, Attendance) |     |  Score & Pass/Fail Status|     | (Additive Feature Deficit|
+---------------------+     +--------------------------+     +--------------------------+
                                                                          |
                                                                          v
+---------------------+     +--------------------------+     +--------------------------+
| Next.js 15 UI       | <-- |  LangChain GenAI Layer   | <-- | ChromaDB Dense Retrieval |
| (Dashboard & Tutor) |     | (Grounded Gemini 3.8 Roadmap)  | (Cosine Similarity Match)|
+---------------------+     +--------------------------+     +--------------------------+
```

### The Closed-Loop Feedback Flow:
1. **Predictive Modeling Layer**:
   - Ingests student academic metrics (`Study_Hours_per_Week`, `Attendance_Rate`, `Past_Exam_Scores`, demographics).
   - Random Forest Regressor predicts the expected exam score (0–100) and evaluates pass/fail status against the university threshold (60.0).
2. **Explainable AI (TreeSHAP) Layer**:
   - Computes local Shapley values $\phi_i$ satisfying the efficiency axiom:
     ```text
     f(x) = E[f(X)] + Σ φ_i
     ```
   - Filters negative contributions ($\phi_i < 0$) to identify actionable individual deficits.
3. **Diagnostic-Triggered Vector Retrieval (RAG)**:
   - Encodes curriculum markdown notes using `sentence-transformers/all-MiniLM-L6-v2` into 384-dimensional dense vectors stored in ChromaDB.
   - Converts the student's top SHAP deficits into a semantic query to retrieve the top-2 matching curriculum modules using cosine similarity.
4. **Adaptive Remediation Layer (LangChain + Gemini)**:
   - Constructs an LCEL pipeline connecting the retrieved lecture notes, student diagnostics, and Google Gemini (`gemini-3.8-flash`).
   - Generates a grounded 3-day recovery roadmap and 2 targeted practice questions with zero hallucination.
5. **Interactive Dashboard & Tutor**:
   - Built with Next.js 15, Tailwind CSS, and Lucide icons.
   - Includes real-time sliders, zero-axis SHAP attribution bar charts, retrieved lecture note viewers, and an embedded curriculum tutor chatbot.

---

## 2. Theoretical Foundations & Interview Preparation Guide

### Q1: Why Random Forest over Single Decision Trees?
- **High Variance in Single Trees**: A single CART greedily partitions feature space to minimize MSE. Small perturbations in training data cause entirely different root splits, propagating errors down the tree and causing high variance.
- **Ensemble Averaging (Bagging)**: Random Forest constructs $B$ decision trees on independent bootstrap samples. As $B \to \infty$, variance reduces:
  ```text
  Var(T_bar) = (ρ * σ²) + ((1 - ρ) / B) * σ²  -->  ρ * σ²
  ```
- **Feature Subspace Sampling**: At each split, evaluating a random subset of size $m \approx \lfloor p / 3 \rfloor$ de-correlates the trees, lowering pairwise correlation $\rho$ and reducing total ensemble variance without increasing bias.

### Q2: How does TreeSHAP mathematically decompose predictions?
- **Shapley Roots (1953)**: Evaluates the marginal contribution of feature $i$ across all possible feature coalitions $S \subseteq F \setminus \{i\}$:
  ```text
  φ_i(x) = Σ [ (|S|! * (|F| - |S| - 1)!) / |F|! ] * [ f_x(S ∪ {i}) - f_x(S) ]
  ```
- **The 4 Axiomatic Guarantees**:
  1. *Efficiency*: $\sum \phi_i = f(x) - \mathbb{E}[f(X)]$.
  2. *Symmetry*: Identical marginal contributions yield identical attributions.
  3. *Dummy (Null Player)*: Features with zero marginal impact receive $\phi_i = 0$.
  4. *Additivity*: Ensemble Shapley values equal the sum of individual tree Shapley values.
- **TreeSHAP Polynomial Efficiency**: While exact Shapley calculation is NP-hard ($O(M \cdot 2^M)$), TreeSHAP exploits decision tree paths to compute exact values in $O(T \cdot L \cdot D^2)$ time.

### Q3: Why Cosine Similarity in ChromaDB rather than Euclidean Distance?
- Dense vectors encode semantics directionally:
  ```text
  cos(θ) = (u · v) / (||u|| * ||v||)
  ```
- Normalizing vectors ensures similarity evaluates angular alignment, preventing longer lecture notes from artificially dominating shorter concept summaries.

### Q4: How does Grounded RAG prevent LLM Hallucinations?
- Parametric memory in LLMs can fabricate topics. By injecting retrieved lecture notes into the system prompt context window and enforcing deterministic Pydantic output schemas (`JsonOutputParser`), Gemini is constrained strictly to the syllabus.

---

## 3. Project Directory Layout

```text
V:\HONOURS PROJECT\
├── .env                                # GEMINI_API_KEY
├── .gitignore                          # Git ignore rules
├── README.md                           # Documentation & Viva guide
│
├── data/
│   └── student_data.csv                # Student performance dataset (708 records)
│
├── curriculum_docs/                    # Normalized course lecture notes
│   ├── module1_pointers_and_memory.md
│   ├── module2_recursion_and_trees.md
│   └── module3_complexity_and_sorting.md
│
├── backend/                            # FastAPI Microservice & ML Pipelines
│   ├── requirements.txt                # Python dependencies
│   ├── main.py                         # FastAPI server (/api/analyze, /api/chat)
│   ├── test_pipeline.py                # End-to-end smoke test script
│   ├── app/
│   │   ├── core/config.py              # Pydantic BaseSettings & environment loader
│   │   ├── models/schemas.py           # Pydantic DTOs for requests and responses
│   │   └── services/
│   │       ├── ml_service.py           # Random Forest inference service
│   │       ├── shap_service.py         # TreeSHAP local attribution service
│   │       ├── vector_service.py       # ChromaDB vector retrieval service
│   │       └── langchain_service.py    # LangChain LCEL & Gemini GenAI service
│   ├── ml/
│   │   ├── train.py                    # Training & artifact serialization script
│   │   └── artifacts/                  # rf_model.joblib, shap_explainer.joblib
│   └── vector_store/
│       ├── indexer.py                  # LangChain ChromaDB indexing script
│       └── chroma_data/                # Persistent vector database
│
└── frontend/                           # Next.js 15 Interactive Dashboard
    ├── package.json
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx              # Root HTML wrapper
    │   │   ├── page.tsx                # Main Adaptive Learning Dashboard
    │   │   └── globals.css             # Tailwind utilities
    │   ├── components/
    │   │   ├── Header.tsx              # Institutional branding
    │   │   ├── StudentInputForm.tsx    # Reactive sliders & presets
    │   │   ├── ScoreBadge.tsx          # Predicted score & margin
    │   │   ├── ShapWaterfallChart.tsx  # Zero-axis SHAP attribution bar chart
    │   │   ├── RetrievedTopicsCard.tsx # Retrieved curriculum cards
    │   │   ├── RemediationRoadmap.tsx  # 3-Day recovery plan & problems
    │   │   └── RemediationChat.tsx     # Grounded course tutor chatbot
    │   └── lib/
    │       ├── api.ts                  # Fetch client for FastAPI
    │       └── types.ts                # TypeScript interfaces
```

---

## 4. Setup & Execution Instructions

### 4.1 Backend Setup
1. Activate virtual environment:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```
2. Install dependencies (already installed):
   ```powershell
   pip install -r backend/requirements.txt
   ```
3. Train Random Forest and fit TreeSHAP explainer:
   ```powershell
   python -m backend.ml.train
   ```
4. Index curriculum documents into ChromaDB:
   ```powershell
   python -m backend.vector_store.indexer
   ```
5. Run the end-to-end smoke test:
   ```powershell
   python backend/test_pipeline.py
   ```
6. Start the FastAPI microservice:
   ```powershell
   uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend
   ```
   Interactive Swagger API documentation will be available at: `http://localhost:8000/docs`

### 4.2 Frontend Setup
1. Navigate to `frontend/`:
   ```powershell
   cd frontend
   ```
2. Run the development server:
   ```powershell
   npm run dev
   ```
3. Open your browser at: `http://localhost:3000`

---

## 5. API Endpoints

- `POST /api/analyze`: Comprehensive endpoint executing Prediction $\to$ TreeSHAP $\to$ ChromaDB $\to$ LangChain Gemini Remediation in a single request.
- `POST /api/predict`: Fast inference returning predicted exam score and pass/fail margin.
- `POST /api/explain`: TreeSHAP local attribution returning base expected value and per-feature impact breakdown.
- `POST /api/chat`: Multi-turn conversational tutor grounded in curriculum notes.
- `GET /health`: Microservice health check.
