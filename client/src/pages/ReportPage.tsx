import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  ListOrdered,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  RotateCcw,
  LayoutDashboard,
  Check,
} from 'lucide-react';
import { interviewApi } from '../api/interview';
import { Interview, FinalReport } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const interviewId = Number(id);

  const [interview, setInterview] = useState<Interview | null>(null);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await interviewApi.getReport(interviewId);
        setInterview(res.interview);
        setReport(res.report);

        // Expand first question by default
        if (res.interview.questions && res.interview.questions.length > 0) {
          setExpandedQuestions({ [res.interview.questions[0].id]: true });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load interview report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [interviewId]);

  const toggleExpand = (questionId: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  if (loading && !report) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Generating comprehensive report analysis..." size="lg" />
      </div>
    );
  }

  const score = report?.overall_score ?? interview?.overall_score ?? 0;
  let performanceTier = 'Needs Improvement';
  let tierColor = 'text-amber-600 dark:text-amber-400';
  let tierBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';

  if (score >= 85) {
    performanceTier = 'Strong Hire (Senior / Lead Tier)';
    tierColor = 'text-emerald-600 dark:text-emerald-400';
    tierBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
  } else if (score >= 70) {
    performanceTier = 'Hire (Mid-Level Engineer Tier)';
    tierColor = 'text-brand-600 dark:text-brand-400';
    tierBg = 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800';
  }

  const questions = interview?.questions || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Post-Interview Evaluation
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Final Performance Report</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {interview?.role} Track • {interview?.difficulty} Difficulty • {questions.length} Questions Analyzed
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
            Dashboard
          </Link>
          <Link
            to="/interview/new"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Practice Again
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Top Overview: Overall Score Card */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-6 text-center md:text-left">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-brand-500/20 flex flex-col items-center justify-center bg-brand-50/50 dark:bg-brand-950/30">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400 font-mono">
              {Math.round(score)}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">out of 100</span>
          </div>

          <div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold mb-2 ${tierBg} ${tierColor}`}>
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              <span>{performanceTier}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Technical Assessment Verdict
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Score evaluated across correctness, answer clarity, technical depth, and handling of adaptive edge-case follow-ups.
            </p>
          </div>
        </div>

        {/* Quick action button */}
        <Link
          to="/interview/new"
          className="inline-flex items-center px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 shadow-md shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex-shrink-0"
        >
          <span>Start Another Interview</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>

      {/* Strengths & Weak Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Demonstrated Strengths</h3>
          </div>
          <ul className="space-y-3">
            {report?.strengths && report.strengths.length > 0 ? (
              report.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="leading-snug">{str}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400">General competence in core topics.</li>
            )}
          </ul>
        </div>

        {/* Weak Areas */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Areas to Strengthen</h3>
          </div>
          <ul className="space-y-3">
            {report?.weak_areas && report.weak_areas.length > 0 ? (
              report.weak_areas.map((wa, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">!</span>
                  </div>
                  <span className="leading-snug">{wa}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400">Consistent responses throughout.</li>
            )}
          </ul>
        </div>
      </div>

      {/* 5-Point Actionable Improvement Plan */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white shadow-xl space-y-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold mb-2">
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Structured Action Roadmap</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">5-Point Actionable Improvement Plan</h2>
          <p className="text-xs text-slate-300 mt-1">
            Prioritized engineering study points generated by Gemini specifically targeting your response gaps.
          </p>
        </div>

        <div className="space-y-3">
          {report?.improvement_plan && report.improvement_plan.length > 0 ? (
            report.improvement_plan.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-start space-x-4"
              >
                <div className="w-7 h-7 rounded-xl bg-brand-500 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  {idx + 1}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed pt-0.5">
                  {item.replace(/^\d+[\.\)]\s*/, '')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">Review core distributed systems and algorithms concepts.</p>
          )}
        </div>
      </div>

      {/* Per-Question Detailed Breakdown */}
      <div className="space-y-4 pt-4">
        <h2 className="text-2xl font-bold tracking-tight">Per-Question Breakdown</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Review your answers, multidimensional scores, evaluator feedback, and senior-level outlines.
        </p>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isExpanded = !!expandedQuestions[q.id];
            const ans = q.answers && q.answers.length > 0 ? q.answers[q.answers.length - 1] : null;

            return (
              <div
                key={q.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(q.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Q{idx + 1}
                      </span>
                      {q.is_follow_up && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                          Follow-up
                        </span>
                      )}
                      <span className="text-xs text-slate-400">• {q.category}</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug">
                      {q.text}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    {ans && (
                      <span className="font-mono text-sm font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-xl">
                        {ans.average_score}/10
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-5">
                    {ans ? (
                      <>
                        {/* Score Metrics */}
                        <div className="grid grid-cols-3 gap-3 pt-4">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Correctness</span>
                            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{ans.correctness}/10</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Clarity</span>
                            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{ans.clarity}/10</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Depth</span>
                            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{ans.depth}/10</span>
                          </div>
                        </div>

                        {/* Candidate Answer */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Answer:</span>
                          <p className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line border border-slate-100 dark:border-slate-800">
                            {ans.answer_text}
                          </p>
                        </div>

                        {/* AI Feedback */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">AI Evaluator Feedback:</span>
                          <p className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-brand-100 dark:border-brand-900/40">
                            {ans.feedback}
                          </p>
                        </div>

                        {/* Ideal Outline */}
                        {ans.ideal_outline && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Senior-Level Ideal Answer Outline:</span>
                            <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line border border-emerald-100 dark:border-emerald-900/40">
                              {ans.ideal_outline}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="pt-4 text-xs text-slate-400 italic">This question was not answered.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
