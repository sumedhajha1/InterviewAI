import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  MessageSquare,
  Award,
  Layers,
} from 'lucide-react';
import { interviewApi } from '../api/interview';
import { Interview, Question, Answer } from '../types';
import { Timer } from '../components/Timer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

export const InterviewSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const interviewId = Number(id);

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active question index in interview.questions
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answerText, setAnswerText] = useState<string>('');
  const [lastAnswer, setLastAnswer] = useState<Answer | null>(null);
  const [showIdealOutline, setShowIdealOutline] = useState<boolean>(false);
  const [followUpNotification, setFollowUpNotification] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await interviewApi.getInterview(interviewId);
      setInterview(res.interview);

      // If already completed, redirect to report
      if (res.interview.status === 'completed') {
        navigate(`/interview/${interviewId}/report`, { replace: true });
        return;
      }

      // Find first unanswered question
      const questions = res.interview.questions || [];
      const firstUnansweredIndex = questions.findIndex(
        (q) => !q.answers || q.answers.length === 0
      );

      if (firstUnansweredIndex !== -1) {
        setCurrentIndex(firstUnansweredIndex);
        setLastAnswer(null);
        setAnswerText('');
      } else if (questions.length > 0) {
        // All answered already, set to last
        setCurrentIndex(questions.length - 1);
        const lastQ = questions[questions.length - 1];
        setLastAnswer(lastQ.latest_answer || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load interview session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  const questions = interview?.questions || [];
  const currentQuestion: Question | undefined = questions[currentIndex];

  const handleTimeUp = () => {
    // When time expires, inform candidate gently
    console.log('Time expired for current question.');
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    const trimmed = answerText.trim();
    if (!trimmed) {
      setError('Please provide an answer before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setFollowUpNotification(null);

      const res = await interviewApi.submitAnswer(currentQuestion.id, trimmed);
      setLastAnswer(res.answer);

      // Update local interview state
      const updatedRes = await interviewApi.getInterview(interviewId);
      setInterview(updatedRes.interview);

      if (res.follow_up_question) {
        setFollowUpNotification(
          'Adaptive follow-up question generated based on your response! You will tackle it next.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setLastAnswer(null);
    setAnswerText('');
    setShowIdealOutline(false);
    setFollowUpNotification(null);
    setCurrentIndex((prev) => prev + 1);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCompleteInterview = async () => {
    try {
      setCompleting(true);
      setError(null);
      await interviewApi.completeInterview(interviewId);
      navigate(`/interview/${interviewId}/report`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate final report. Please try again.');
      setCompleting(false);
    }
  };

  if (loading && !interview) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Preparing your interview environment..." size="lg" />
      </div>
    );
  }

  if (completing) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner
          message="Gemini AI is analyzing your overall interview performance..."
          subMessage="Computing strengths, weak areas, and 5-point actionable improvement plan."
          size="lg"
        />
      </div>
    );
  }

  const isLastQuestion = currentIndex >= questions.length - 1;
  const isCurrentQuestionAnswered = !!lastAnswer || (currentQuestion?.answers && currentQuestion.answers.length > 0);
  const activeAnswer = lastAnswer || (currentQuestion?.answers ? currentQuestion.answers[currentQuestion.answers.length - 1] : null);
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold text-xs">
            {interview?.role}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {currentQuestion?.is_follow_up && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Adaptive Follow-up
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Topic: {currentQuestion?.category || 'General'} • Difficulty: {interview?.difficulty}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {!isCurrentQuestionAnswered && (
            <Timer
              initialSeconds={180}
              onTimeUp={handleTimeUp}
              questionKey={currentQuestion?.id || currentIndex}
              isPaused={submitting}
            />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-brand-600 dark:bg-brand-500 h-full transition-all duration-500 rounded-full"
          style={{ width: `${Math.round(((currentIndex + (isCurrentQuestionAnswered ? 1 : 0)) / Math.max(1, questions.length)) * 100)}%` }}
        />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Follow-up Notification Banner */}
      {followUpNotification && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-sm flex items-center space-x-3 shadow-sm">
          <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span>{followUpNotification}</span>
        </div>
      )}

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {currentQuestion?.is_follow_up ? 'Adaptive Follow-Up Question' : 'Technical Question'}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {currentQuestion?.category}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
          {currentQuestion?.text}
        </h2>
      </div>

      {/* Answer Section */}
      {!isCurrentQuestionAnswered ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Your Technical Answer
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {wordCount} words {wordCount < 25 && '(recommended: 40+ words)'}
            </span>
          </div>

          <textarea
            ref={textareaRef}
            rows={7}
            disabled={submitting}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Structure your answer clearly: definition, mechanisms, trade-offs, and practical production examples..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm leading-relaxed transition-colors disabled:opacity-50"
          />

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400 hidden sm:block">
              Tip: Explain <span className="font-semibold text-slate-600 dark:text-slate-300">why</span> you chose a design pattern and potential failure points.
            </p>

            <button
              onClick={handleSubmitAnswer}
              disabled={submitting || !answerText.trim()}
              className="inline-flex items-center px-6 py-3 rounded-2xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] ml-auto"
            >
              {submitting ? (
                <LoadingSpinner size="sm" message="Evaluating answer with Gemini..." />
              ) : (
                <>
                  <span>Submit Answer</span>
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Evaluation Feedback Drawer */
        activeAnswer && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">AI Evaluation Feedback</h3>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-sm text-slate-800 dark:text-slate-200">
                <span>Avg:</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono">{activeAnswer.average_score}/10</span>
              </div>
            </div>

            {/* Score Grid: Correctness, Clarity, Depth */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Correctness
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                    {activeAnswer.correctness}
                  </span>
                  <span className="text-xs text-slate-400">/ 10</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Clarity & Structure
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                    {activeAnswer.clarity}
                  </span>
                  <span className="text-xs text-slate-400">/ 10</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Technical Depth
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                    {activeAnswer.depth}
                  </span>
                  <span className="text-xs text-slate-400">/ 10</span>
                </div>
              </div>
            </div>

            {/* AI Constructive Feedback */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                <span>Evaluator Feedback</span>
              </label>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-brand-50/40 dark:bg-brand-950/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-900/40">
                {activeAnswer.feedback}
              </p>
            </div>

            {/* Ideal Answer Collapsible */}
            {activeAnswer.ideal_outline && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowIdealOutline(!showIdealOutline)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>View Ideal Answer Outline</span>
                  </span>
                  {showIdealOutline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showIdealOutline && (
                  <div className="p-4 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                    {activeAnswer.ideal_outline}
                  </div>
                )}
              </div>
            )}

            {/* Next Action Buttons */}
            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
              {isLastQuestion ? (
                <button
                  onClick={handleCompleteInterview}
                  disabled={completing}
                  className="inline-flex items-center px-7 py-3 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Award className="w-4 h-4 mr-2" />
                  <span>Finish Interview & View Report</span>
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="inline-flex items-center px-6 py-3 rounded-2xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Proceed to Next Question</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};
