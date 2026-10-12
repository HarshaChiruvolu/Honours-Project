import { StudentInput, PredictionResult, ExplainResult, AnalyzeResponse, ChatMessage, ChatResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeStudent(input: StudentInput): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Network error" }));
    throw new Error(err.detail || `Analysis request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  studentContext?: any
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      student_context: studentContext,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Network error" }));
    throw new Error(err.detail || `Chat request failed: ${response.statusText}`);
  }

  return response.json();
}
