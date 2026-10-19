import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Terminal,
  Database,
  Sparkles,
  ArrowRight,
  Gauge,
  Sliders,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { interviewApi } from '../api/interview';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

type RoleType = 'Full Stack' | 'Backend' | 'Data/ML';
type DifficultyType = 'Easy' | 'Medium' | 'Hard';

export const StartInterviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState<RoleType>('Full Stack');
  const [difficulty, setDifficulty] = useState<DifficultyType>('Medium');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = [
    {
      id: 'Full Stack',
      title: 'Full Stack Engineer',
      icon: Layers,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-950/40',
      border: 'border-brand-500',
      desc: 'Frontend architecture (React/Vite), backend APIs, auth, caching, state management & performance.',
    },
    {
      id: 'Backend',
      title: 'Backend Systems',
      icon: Terminal,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-500',
      desc: 'Distributed systems, database locking & indexing, concurrency, microservices & high-scale APIs.',
    },
    {
      id: 'Data/ML',
      title: 'Data & ML Engineer',
      icon: Database,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      border: 'border-purple-500',
      desc: 'ML modeling, Transformers, MLOps, inference optimization, feature stores & model evaluation.',
    },
  ];

  const difficulties = [
    {
      id: 'Easy',
      label: 'Foundational',
      subtext: 'Core principles, syntax, definitions',
      badge: 'Junior / Associate',
    },
    {
      id: 'Medium',
      label: 'Standard',
      subtext: 'Tradeoffs, production patterns, optimization',
      badge: 'Mid-Level Engineer',
    },
    {
      id: 'Hard',
      label: 'Advanced',
      subtext: 'Distributed failure modes, scale, internals',
      badge: 'Senior / Staff',
    },
  ];

  const handleStartInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await interviewApi.createInterview(role, difficulty, numQuestions);
      navigate(`/interview/${res.interview.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start interview session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interview Configuration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Configure Your Mock Interview</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Pick your engineering track and challenge level. Google Gemini will curate realistic technical questions.
        </p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Step 1: Role Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">1</span>
            <span>Select Engineering Track</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as RoleType)}
                className={`p-6 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? `${r.bg} ${r.border} border-2 shadow-md shadow-brand-500/10`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${r.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {isSelected && <CheckCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{r.title}</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Difficulty Selection */}
      <div className="space-y-4">
        <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">2</span>
          <span>Select Difficulty Level</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {difficulties.map((d) => {
            const isSelected = difficulty === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id as DifficultyType)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-brand-50/70 dark:bg-brand-950/40 border-2 border-brand-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">{d.id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {d.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{d.subtext}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Question Count */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">3</span>
            <span>Number of Questions</span>
          </label>
          <span className="font-extrabold text-base text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-xl">
            {numQuestions} Questions
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <input
            type="range"
            min={3}
            max={10}
            step={1}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>3 (Quick Screen)</span>
            <span>5 (Standard Interview)</span>
            <span>10 (Full Onsite Simulation)</span>
          </div>
        </div>
      </div>

      {/* Overview Card & Launch Button */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Session Summary</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {role} Track • {difficulty} Difficulty • {numQuestions} Questions with Adaptive Follow-ups
            </p>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={loading}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl text-base font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner size="sm" message="Generating Questions..." />
            ) : (
              <>
                <span>Begin Interview</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>3:00 countdown timer per question</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>1 adaptive follow-up after each answer</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Instant multidimensional feedback</span>
          </div>
        </div>
      </div>
    </div>
  );
};
