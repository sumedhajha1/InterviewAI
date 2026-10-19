export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Answer {
  id: number;
  question_id: number;
  answer_text: string;
  correctness: number;
  clarity: number;
  depth: number;
  average_score: number;
  feedback: string;
  ideal_outline: string;
  created_at: string;
}

export interface Question {
  id: number;
  interview_id: number;
  order: number;
  text: string;
  category: string;
  is_follow_up: boolean;
  parent_question_id?: number | null;
  created_at: string;
  answers?: Answer[];
  latest_answer?: Answer | null;
}

export interface Interview {
  id: number;
  user_id: number;
  role: 'Full Stack' | 'Backend' | 'Data/ML' | string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  num_questions: number;
  status: 'in_progress' | 'completed';
  overall_score?: number | null;
  strengths?: string[];
  weak_areas?: string[];
  improvement_plan?: string[];
  created_at: string;
  completed_at?: string | null;
  questions?: Question[];
}

export interface EvaluationResult {
  correctness: number;
  clarity: number;
  depth: number;
  feedback: string;
  ideal_outline: string;
  follow_up_question?: string | null;
}

export interface AnswerSubmissionResponse {
  message: string;
  answer: Answer;
  follow_up_question?: Question | null;
}

export interface FinalReport {
  overall_score: number;
  strengths: string[];
  weak_areas: string[];
  improvement_plan: string[];
  completed_at?: string | null;
}

export interface TopicScore {
  topic: string;
  average_score: number;
  count: number;
}

export interface ScoreHistoryPoint {
  interview_id: number;
  date: string;
  score: number;
  role: string;
  difficulty: string;
}

export interface DashboardStats {
  total_interviews: number;
  completed_count: number;
  in_progress_count: number;
  average_score: number;
  score_history: ScoreHistoryPoint[];
  topic_breakdown: TopicScore[];
  weakest_topics: TopicScore[];
  strongest_topics: TopicScore[];
  recent_interviews: Interview[];
}
