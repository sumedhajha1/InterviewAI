import { apiClient } from './client';
import {
  Interview,
  Question,
  Answer,
  AnswerSubmissionResponse,
  FinalReport,
} from '../types';

// In-memory / localStorage fallback store for guest & offline mode
const LOCAL_INTERVIEWS_KEY = 'interviewai_local_interviews';

function getLocalInterviews(): Interview[] {
  try {
    const raw = localStorage.getItem(LOCAL_INTERVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInterviews(interviews: Interview[]) {
  try {
    localStorage.setItem(LOCAL_INTERVIEWS_KEY, JSON.stringify(interviews));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

const QUESTION_BANK: Record<string, { text: string; category: string }[]> = {
  'Full Stack': [
    { text: 'Explain how the Virtual DOM works in React and how reconciliation optimizes DOM updates.', category: 'Frontend Architecture' },
    { text: 'How do you implement secure user authentication using JWT and refresh tokens across a SPA and REST API?', category: 'Security & Auth' },
    { text: 'Describe the differences between SSR, SSG, and CSR. When would you choose each for a high-traffic e-commerce platform?', category: 'Web Performance' },
    { text: 'How would you design a scalable real-time notification service using WebSockets and Redis Pub/Sub?', category: 'System Design' },
    { text: 'What are database indexes, how do B-Trees work under the hood, and when can indexing hurt performance?', category: 'Databases' },
  ],
  'Backend': [
    { text: 'Explain the differences between SQL and NoSQL databases. In what scenarios would you choose DynamoDB or MongoDB over PostgreSQL?', category: 'Database Architecture' },
    { text: 'How do you handle race conditions and ensure idempotency in a distributed payment processing system?', category: 'Concurrency & Distributed Systems' },
    { text: 'Explain the CAP theorem and discuss the trade-offs made by Apache Kafka and Cassandra.', category: 'Distributed Systems' },
    { text: 'How does database connection pooling work, and how do you calculate optimal pool size for high concurrency?', category: 'Database Optimization' },
    { text: 'Describe the implementation of a rate limiting algorithm (e.g., Token Bucket or Leaky Bucket) in an API gateway.', category: 'System Design' },
  ],
  'Data/ML': [
    { text: 'Explain the bias-variance tradeoff and how regularization (L1 vs L2) impacts model generalization.', category: 'Machine Learning Fundamentals' },
    { text: 'How would you detect and handle data drift and concept drift in a deployed production ML model?', category: 'MLOps & Monitoring' },
    { text: 'Describe the self-attention mechanism in Transformers and how multi-head attention computes representations.', category: 'Deep Learning & NLP' },
    { text: 'How do you optimize an inference pipeline for a Large Language Model to reduce latency and memory usage?', category: 'LLM Engineering' },
    { text: 'What metrics would you use to evaluate an imbalanced binary classification dataset, and why is accuracy misleading?', category: 'Model Evaluation' },
  ],
};

function createLocalInterview(role: string, difficulty: string, numQuestions: number): Interview {
  const bank = QUESTION_BANK[role] || QUESTION_BANK['Full Stack'];
  const count = Math.min(Math.max(3, numQuestions), bank.length);
  const selected = bank.slice(0, count);

  const newId = Date.now();
  const questions: Question[] = selected.map((q, idx) => ({
    id: newId * 10 + idx,
    interview_id: newId,
    order: idx + 1,
    text: q.text,
    category: q.category,
    is_follow_up: false,
    created_at: new Date().toISOString(),
    answers: [],
  }));

  const newInterview: Interview = {
    id: newId,
    user_id: 1,
    role,
    difficulty,
    num_questions: count,
    status: 'in_progress',
    created_at: new Date().toISOString(),
    questions,
  };

  const list = getLocalInterviews();
  list.unshift(newInterview);
  saveLocalInterviews(list);
  return newInterview;
}

export const interviewApi = {
  async createInterview(role: string, difficulty: string, numQuestions: number): Promise<{ interview: Interview }> {
    const token = localStorage.getItem('interviewai_token');
    if (token?.startsWith('guest_') || token?.startsWith('local_')) {
      return { interview: createLocalInterview(role, difficulty, numQuestions) };
    }

    try {
      return await apiClient<{ interview: Interview }>('/interviews', {
        method: 'POST',
        body: JSON.stringify({ role, difficulty, num_questions: numQuestions }),
      });
    } catch (err: any) {
      if (err.status === 0 || err.message?.includes('fetch')) {
        console.warn('Backend unavailable, using local mock interview');
        return { interview: createLocalInterview(role, difficulty, numQuestions) };
      }
      throw err;
    }
  },

  async listInterviews(): Promise<{ interviews: Interview[] }> {
    const token = localStorage.getItem('interviewai_token');
    if (token?.startsWith('guest_') || token?.startsWith('local_')) {
      return { interviews: getLocalInterviews() };
    }

    try {
      return await apiClient<{ interviews: Interview[] }>('/interviews', {
        method: 'GET',
      });
    } catch (err: any) {
      return { interviews: getLocalInterviews() };
    }
  },

  async getInterview(id: number): Promise<{ interview: Interview }> {
    const token = localStorage.getItem('interviewai_token');
    if (token?.startsWith('guest_') || token?.startsWith('local_')) {
      const found = getLocalInterviews().find((i) => i.id === id);
      if (found) return { interview: found };
    }

    try {
      return await apiClient<{ interview: Interview }>(`/interviews/${id}`, {
        method: 'GET',
      });
    } catch (err: any) {
      const found = getLocalInterviews().find((i) => i.id === id);
      if (found) return { interview: found };
      throw err;
    }
  },

  async submitAnswer(questionId: number, answerText: string): Promise<AnswerSubmissionResponse> {
    const token = localStorage.getItem('interviewai_token');
    const isLocal = token?.startsWith('guest_') || token?.startsWith('local_');

    if (!isLocal) {
      try {
        return await apiClient<AnswerSubmissionResponse>(`/questions/${questionId}/answer`, {
          method: 'POST',
          body: JSON.stringify({ answer_text: answerText }),
        });
      } catch (err: any) {
        if (err.status !== 0 && !err.message?.includes('fetch')) {
          throw err;
        }
      }
    }

    // Local heuristic evaluation
    const words = answerText.trim().split(/\s+/).length;
    let correctness = 8.5;
    let clarity = 8.0;
    let depth = 7.5;
    let feedback = 'Well-structured response demonstrating practical grasp of core architectural concepts!';

    if (words < 20) {
      correctness = 5.0;
      clarity = 6.0;
      depth = 4.5;
      feedback = 'Good start, but too brief. Make sure to discuss trade-offs, edge cases, and high-concurrency issues.';
    } else if (words < 45) {
      correctness = 7.5;
      clarity = 7.5;
      depth = 7.0;
      feedback = 'Clear foundational explanation. Could be enhanced with specific production trade-offs.';
    }

    const answerId = Date.now();
    const answer: Answer = {
      id: answerId,
      question_id: questionId,
      answer_text: answerText,
      correctness,
      clarity,
      depth,
      average_score: Math.round(((correctness + clarity + depth) / 3) * 10) / 10,
      feedback,
      ideal_outline: '- Clearly define foundational mechanism\n- Discuss trade-offs (memory, latency, consistency)\n- Provide real-world architecture examples\n- Address failure modes and scaling bottlenecks',
      created_at: new Date().toISOString(),
    };

    // Update in local store
    const list = getLocalInterviews();
    let followUp: Question | null = null;

    for (const interview of list) {
      const q = interview.questions?.find((qu) => qu.id === questionId);
      if (q) {
        if (!q.answers) q.answers = [];
        q.answers.push(answer);
        q.latest_answer = answer;

        // Generate adaptive follow-up if not already follow-up and none exists yet
        if (!q.is_follow_up && words >= 15 && !interview.questions?.some((qu) => qu.parent_question_id === q.id)) {
          followUp = {
            id: Date.now() + 1,
            interview_id: interview.id,
            order: q.order,
            text: `Follow-up: How would your proposed approach handle a 10x traffic spike or a downstream network partition?`,
            category: q.category,
            is_follow_up: true,
            parent_question_id: q.id,
            created_at: new Date().toISOString(),
            answers: [],
          };
          if (interview.questions) {
            const qIndex = interview.questions.indexOf(q);
            interview.questions.splice(qIndex + 1, 0, followUp);
          }
        }
        break;
      }
    }
    saveLocalInterviews(list);

    return {
      message: 'Answer evaluated successfully',
      answer,
      follow_up_question: followUp,
    };
  },

  async completeInterview(interviewId: number): Promise<{ interview: Interview; report: FinalReport }> {
    const token = localStorage.getItem('interviewai_token');
    const isLocal = token?.startsWith('guest_') || token?.startsWith('local_');

    if (!isLocal) {
      try {
        return await apiClient<{ interview: Interview; report: FinalReport }>(`/interviews/${interviewId}/complete`, {
          method: 'POST',
        });
      } catch (err: any) {
        if (err.status !== 0 && !err.message?.includes('fetch')) {
          throw err;
        }
      }
    }

    const list = getLocalInterviews();
    const interview = list.find((i) => i.id === interviewId);
    let totalScore = 0;
    let answerCount = 0;

    if (interview && interview.questions) {
      for (const q of interview.questions) {
        if (q.answers && q.answers.length > 0) {
          totalScore += q.answers[q.answers.length - 1].average_score;
          answerCount++;
        }
      }
    }

    const avg = answerCount > 0 ? (totalScore / answerCount) * 10 : 75;
    const report: FinalReport = {
      overall_score: Math.round(avg),
      strengths: [
        'Strong conceptual foundation in architecture patterns',
        'Concise and structured communication style',
        'Good awareness of production operational challenges',
      ],
      weak_areas: [
        'Deep dive on distributed edge cases and failure recovery',
        'Quantifiable metrics (QPS, throughput, latency targets)',
      ],
      improvement_plan: [
        '1. Deepen domain knowledge in system architecture trade-offs and CAP theorem nuances.',
        '2. Practice back-of-the-envelope calculations for latency, storage, and throughput.',
        '3. Study database indexing strategies, lock contention, and connection pool sizing.',
        '4. Structure answers using the STAR/CAR framework with measurable production outcomes.',
        '5. Schedule weekly mock interviews with strict 3-minute timers to sharpen conciseness.',
      ],
      completed_at: new Date().toISOString(),
    };

    if (interview) {
      interview.status = 'completed';
      interview.overall_score = report.overall_score;
      interview.strengths = report.strengths;
      interview.weak_areas = report.weak_areas;
      interview.improvement_plan = report.improvement_plan;
      interview.completed_at = report.completed_at;
      saveLocalInterviews(list);
    }

    return {
      interview: interview || ({} as Interview),
      report,
    };
  },

  async getReport(interviewId: number): Promise<{ interview: Interview; report: FinalReport }> {
    const token = localStorage.getItem('interviewai_token');
    const isLocal = token?.startsWith('guest_') || token?.startsWith('local_');

    if (!isLocal) {
      try {
        return await apiClient<{ interview: Interview; report: FinalReport }>(`/interviews/${interviewId}/report`, {
          method: 'GET',
        });
      } catch (err: any) {
        if (err.status !== 0 && !err.message?.includes('fetch')) {
          throw err;
        }
      }
    }

    const list = getLocalInterviews();
    const interview = list.find((i) => i.id === interviewId);

    const report: FinalReport = {
      overall_score: interview?.overall_score || 80,
      strengths: interview?.strengths || ['Solid engineering fundamentals', 'Clear technical explanations'],
      weak_areas: interview?.weak_areas || ['Edge case handling', 'Distributed scaling specifics'],
      improvement_plan: interview?.improvement_plan || [
        '1. Review distributed systems consistency models.',
        '2. Practice system design back-of-the-envelope calculations.',
        '3. Deepen understanding of database indexing and locking.',
        '4. Implement caching patterns with Redis and invalidation policies.',
        '5. Perform timed mock sessions to refine structured delivery.',
      ],
      completed_at: interview?.completed_at || new Date().toISOString(),
    };

    return {
      interview: interview || ({} as Interview),
      report,
    };
  },
};
