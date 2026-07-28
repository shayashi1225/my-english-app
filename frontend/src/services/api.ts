const BASE = "/api";

export interface Situation {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Feedback {
  grammar_score: number;
  grammar_issues: string[];
  corrected_text?: string;
  pronunciation_tips: string[];
  positive_feedback: string;
}

export interface TurnResponse {
  ai_message: string;
  feedback: Feedback | null;
  is_last_turn: boolean;
}

export interface SessionSummary {
  summary: {
    overall_summary: string;
    total_score: number;
    grammar_score: number;
    fluency_score: number;
    strengths: string[];
    areas_for_improvement: string[];
  };
  vocabulary: {
    word_or_phrase: string;
    explanation: string;
    example_sentence: string;
  }[];
}

export interface SessionDetail {
  id: number;
  situation_title: string;
  learner_name: string | null;
  started_at: string;
  completed_at: string | null;
  total_score: number | null;
  grammar_score: number | null;
  fluency_score: number | null;
  summary: string | null;
  vocabulary: {
    word_or_phrase: string;
    explanation: string;
    example_sentence: string | null;
  }[];
  turns: {
    speaker: "ai" | "user";
    text: string;
    grammar_score: number | null;
    grammar_feedback: string | null;
    corrected_text: string | null;
    pronunciation_feedback: string | null;
  }[];
}

export interface WeakGrammarCategory {
  code: string;
  label: string;
  count: number;
}

export interface DashboardData {
  total_sessions: number;
  average_score: number;
  current_streak: number;
  recent_sessions: {
    id: number;
    situation_title: string;
    started_at: string;
    total_score: number;
    grammar_score: number;
    fluency_score: number;
  }[];
  daily_scores: { date: string; avg_score: number; count: number }[];
  situation_stats: { title: string; count: number; avg_score: number }[];
  weak_grammar_categories: WeakGrammarCategory[];
}

export interface ReviewItem {
  id: number;
  word_or_phrase: string;
  explanation: string;
  example_sentence: string | null;
  box: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  situation_title: string;
}

export interface ReviewQueue {
  due_count: number;
  items: ReviewItem[];
}

export type ReviewRating = "again" | "hard" | "good";

export interface SpeakEvaluation {
  is_correct: boolean;
  score: number;
  feedback: string;
  pronunciation_tips: string[];
  correct_answer: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getSituations: () => request<Situation[]>("/situations"),

  startSession: (situation_id: string, learner_name: string) =>
    request<{ session_id: number; situation: Situation; ai_message: string }>("/sessions", {
      method: "POST",
      body: JSON.stringify({ situation_id, learner_name }),
    }),

  sendTurn: (sessionId: number, user_text: string) =>
    request<TurnResponse>(`/sessions/${sessionId}/turn`, {
      method: "POST",
      body: JSON.stringify({ user_text }),
    }),

  completeSession: (sessionId: number) =>
    request<SessionSummary>(`/sessions/${sessionId}/complete`, { method: "POST" }),

  getDashboard: () => request<DashboardData>("/dashboard"),

  getSession: (sessionId: number) =>
    request<SessionDetail>(`/sessions/${sessionId}`),

  getReviewQueue: (limit = 20) =>
    request<ReviewQueue>(`/review/queue?limit=${limit}`),

  answerReview: (vocabId: number, rating: ReviewRating) =>
    request<{ id: number; box: number; next_review_at: string }>(
      `/review/${vocabId}/answer`,
      { method: "POST", body: JSON.stringify({ rating }) }
    ),

  evaluateSpeaking: (vocabId: number, spoken_text: string) =>
    request<SpeakEvaluation>(`/review/${vocabId}/speak`, {
      method: "POST",
      body: JSON.stringify({ spoken_text }),
    }),
};
