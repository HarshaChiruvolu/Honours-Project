import { StudentInput, PredictionResult, ExplainResult, AnalyzeResponse, ChatMessage, ChatResponse } from "./types";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "127.0.0.1";
    return `http://${hostname}:8000`;
  }
  return "http://127.0.0.1:8000";
}

async function fetchWithFallback(endpoint: string, options: RequestInit): Promise<Response> {
  const primaryBase = getApiBase();
  try {
    return await fetch(`${primaryBase}${endpoint}`, options);
  } catch (primaryErr) {
    // If accessing across different hostnames, fallback to explicit loopbacks
    const fallbacks = ["http://127.0.0.1:8000", "http://localhost:8000"];
    for (const fb of fallbacks) {
      if (primaryBase !== fb) {
        try {
          return await fetch(`${fb}${endpoint}`, options);
        } catch {
          // Continue trying next fallback
        }
      }
    }
    throw primaryErr;
  }
}

export async function analyzeStudent(input: StudentInput): Promise<AnalyzeResponse> {
  const response = await fetchWithFallback("/api/analyze", {
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
  const response = await fetchWithFallback("/api/chat", {
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
