export interface StudentInput {
  gender: string;
  study_hours_per_week: number;
  attendance_rate: number;
  past_exam_scores: number;
  parental_education_level: string;
  internet_access_at_home: string;
  extracurricular_activities: string;
}

export interface PredictionResult {
  predicted_score: number;
  pass_fail_status: "Pass" | "Fail";
  score_margin: number;
  passing_threshold: number;
  model_name: string;
}

export interface FeatureImpact {
  feature: string;
  display_name: string;
  feature_value: string | number;
  shap_value: number;
  direction: "positive" | "negative";
  impact_category: string;
}

export interface ExplainResult {
  base_value: number;
  predicted_score: number;
  feature_impacts: FeatureImpact[];
  top_deficits: string[];
}

export interface RetrievedCurriculumChunk {
  module_id: string;
  title: string;
  section: string;
  similarity_score: number;
  excerpt: string;
}

export interface StudyDay {
  day: number;
  focus_topic: string;
  allocated_hours: number;
  action_items: string[];
}

export interface PracticeProblem {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  hint: string;
  expected_approach: string;
}

export interface RemediationPlan {
  diagnostic_summary: string;
  roadmap: StudyDay[];
  practice_problems: PracticeProblem[];
}

export interface AnalyzeResponse {
  student_input: StudentInput;
  prediction: PredictionResult;
  explainability: ExplainResult;
  retrieved_curriculum: RetrievedCurriculumChunk[];
  remediation: RemediationPlan;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  reply: string;
  grounded_sources: string[];
}

export interface CourseMaterial {
  filename: string;
  title: string;
  file_type: string;
  total_chunks: number;
  sections: string[];
  size_bytes: number;
  uploaded_at: string;
  is_default: boolean;
}

export interface DocumentUploadResponse {
  status: string;
  message: string;
  filename: string;
  file_type: string;
  chunks_created: number;
  title: string;
}
