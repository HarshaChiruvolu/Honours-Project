import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, accuracy_score, confusion_matrix

# ==============================
# LOAD DATA
# ============================== 

df = pd.read_csv("student_performance_dataset.csv")

# Drop ID
df = df.drop("Student_ID", axis=1)

# ==============================
# DATA PREPROCESSING
# ==============================

df['Gender'] = df['Gender'].map({'Male':1, 'Female':0})
df['Internet_Access_at_Home'] = df['Internet_Access_at_Home'].map({'Yes':1, 'No':0})
df['Extracurricular_Activities'] = df['Extracurricular_Activities'].map({'Yes':1, 'No':0})

edu_map = {'High School':0, 'Bachelors':1, 'Masters':2, 'PhD':3}
df['Parental_Education_Level'] = df['Parental_Education_Level'].map(edu_map)

df['Pass_Fail'] = df['Pass_Fail'].map({'Pass':1, 'Fail':0})

print("\n=== DATA SAMPLE ===")
print(df.head())

# ==============================
# EDA
# ==============================

print("\n=== DATA DESCRIPTION ===")
print(df.describe())

print("\n=== CORRELATION ===")
print(df.corr())

# ==============================
# VISUALIZATION
# ==============================

plt.scatter(df['Study_Hours_per_Week'], df['Final_Exam_Score'])
plt.xlabel("Study Hours")
plt.ylabel("Final Score")
plt.title("Study Hours vs Final Score")
plt.show()

# ==============================
# MODEL 1: REGRESSION
# ==============================

X = df.drop(['Final_Exam_Score','Pass_Fail'], axis=1)
y = df['Final_Exam_Score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Linear Regression
lr = LinearRegression()
lr.fit(X_train, y_train)

lr_pred = lr.predict(X_test)
lr_error = mean_squared_error(y_test, lr_pred)

# Random Forest
rf = RandomForestRegressor()
rf.fit(X_train, y_train)

rf_pred = rf.predict(X_test)
rf_error = mean_squared_error(y_test, rf_pred)

print("\n=== MODEL COMPARISON (Regression) ===")
print("Linear Regression Error:", lr_error)
print("Random Forest Error:", rf_error)

# ==============================
# FEATURE IMPORTANCE
# ==============================

importance = rf.feature_importances_
features = X.columns

print("\n=== FEATURE IMPORTANCE ===")
for f, i in zip(features, importance):
    print(f, ":", round(i, 3))

plt.barh(features, importance)
plt.title("Feature Importance")
plt.show()

# ==============================
# MODEL 2: CLASSIFICATION
# ==============================

X2 = df.drop(['Pass_Fail', 'Final_Exam_Score'], axis=1)
y2 = df['Pass_Fail']

X_train2, X_test2, y_train2, y_test2 = train_test_split(X2, y2, test_size=0.2)

clf = LogisticRegression(max_iter=1000)
clf.fit(X_train2, y_train2)

# Sample input
sample_df = pd.DataFrame([{
    'Gender':1,
    'Study_Hours_per_Week':5,
    'Attendance_Rate':80,
    'Past_Exam_Scores':70,
    'Parental_Education_Level':2,
    'Internet_Access_at_Home':1,
    'Extracurricular_Activities':1
}])

score_pred = rf.predict(sample_df)
pass_pred = clf.predict(sample_df)

pred2 = clf.predict(X_test2)
acc = accuracy_score(y_test2, pred2)

print("\n=== CLASSIFICATION RESULT ===")
print("Accuracy:", acc)

cm = confusion_matrix(y_test2, pred2)
print("Confusion Matrix:\n", cm)

# ==============================
# DEMO PREDICTION
# ==============================

sample = [[1,5,80,70,2,1,1]]  

score_pred = rf.predict(sample)
pass_pred = clf.predict(sample)

print("\n=== DEMO OUTPUT ===")
print("Predicted Score:", score_pred[0])

def generate_insights(sample, df):

    insights = []

    # Get averages
    avg_study = df['Study_Hours_per_Week'].mean()
    avg_attendance = df['Attendance_Rate'].mean()
    avg_past = df['Past_Exam_Scores'].mean()

    study = sample[0][1]
    attendance = sample[0][2]
    past = sample[0][3]

    # Study Hours Insight
    if study < avg_study:
        insights.append("Increase study hours to improve performance.")
    else:
        insights.append("Good study consistency.")

    # Attendance Insight
    if attendance < avg_attendance:
        insights.append("Improve attendance for better results.")
    else:
        insights.append("Attendance is satisfactory.")

    # Past Scores Insight
    if past < avg_past:
        insights.append("Focus on strengthening basics from previous subjects.")
    else:
        insights.append("Strong academic background.")

    return insights

if pass_pred[0] == 1:
    print("Prediction: PASS")
else:
    print("Prediction: FAIL")

    print("\n PERSONALIZED INSIGHTS FOR STUDENT ")

personalized = generate_insights(sample, df)

for i in personalized:
    print("-", i)

# ==============================
# INTERPRETATION
# ==============================

print("\n INSIGHTS FROM MODEL ")
print("Higher study hours, attendance, and past scores improve performance.")
print("Model identifies key factors affecting student success.")

