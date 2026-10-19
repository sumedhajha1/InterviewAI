import { apiClient } from './client';
import {
  Interview,
  AnswerSubmissionResponse,
  FinalReport,
} from '../types';

export const interviewApi = {
  async createInterview(role: string, difficulty: string, numQuestions: number): Promise<{ interview: Interview }> {
    return apiClient<{ interview: Interview }>('/interviews', {
      method: 'POST',
      body: JSON.stringify({ role, difficulty, num_questions: numQuestions }),
    });
  },

  async listInterviews(): Promise<{ interviews: Interview[] }> {
    return apiClient<{ interviews: Interview[] }>('/interviews', {
      method: 'GET',
    });
  },

  async getInterview(id: number): Promise<{ interview: Interview }> {
    return apiClient<{ interview: Interview }>(`/interviews/${id}`, {
      method: 'GET',
    });
  },

  async submitAnswer(questionId: number, answerText: string): Promise<AnswerSubmissionResponse> {
    return apiClient<AnswerSubmissionResponse>(`/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer_text: answerText }),
    });
  },

  async completeInterview(interviewId: number): Promise<{ interview: Interview; report: FinalReport }> {
    return apiClient<{ interview: Interview; report: FinalReport }>(`/interviews/${interviewId}/complete`, {
      method: 'POST',
    });
  },

  async getReport(interviewId: number): Promise<{ interview: Interview; report: FinalReport }> {
    return apiClient<{ interview: Interview; report: FinalReport }>(`/interviews/${interviewId}/report`, {
      method: 'GET',
    });
  },
};
