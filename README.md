# Honours Project: Student Performance Prediction & Analysis

A machine learning project analyzing factors affecting student academic performance and predicting final exam scores and pass/fail outcomes.

## Project Overview
This project performs Exploratory Data Analysis (EDA) and applies machine learning models on student performance metrics:
- **Exploratory Data Analysis & Visualization**: Study hours vs final scores, feature correlations.
- **Regression Models**:
  - Linear Regression
  - Random Forest Regressor
- **Classification Models**:
  - Logistic Regression (Pass / Fail prediction)

## Project Structure
- [harsha_model.py](file:///V:/HONOURS%20PROJECT/harsha_model.py): Core training and evaluation pipeline.
- [student_performance_dataset.csv](file:///V:/HONOURS%20PROJECT/student_performance_dataset.csv): Dataset with student academic attributes and performance outcomes.
- [Honours_Project_Templates/](file:///V:/HONOURS%20PROJECT/Honours_Project_Templates): Project documentation templates and review presentation slides.

## Setup & Execution
1. Create and activate a virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
2. Install required dependencies:
   ```powershell
   pip install pandas scikit-learn matplotlib
   ```
3. Run the model:
   ```powershell
   python harsha_model.py
   ```
