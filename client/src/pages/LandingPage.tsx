import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  BrainCircuit,
  TrendingUp,
  Clock,
  Layers,
  Database,
  Terminal,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-brand-600/20 to-indigo-500/20 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Powered by Google Gemini 2.5 & Official google-genai SDK</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Master Technical Interviews with{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Adaptive AI
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Real-time mock interviews tailored for Full Stack, Backend, and Data/ML engineers. Experience realistic countdowns, adaptive follow-ups, and instant multidimensional scoring.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-2xl shadow-lg shadow-brand-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Mock Interview Free'}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link
              to={isAuthenticated ? '/interview/new' : '/login'}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl shadow-sm transition-all"
            >
              <span>Explore Roles & Tracks</span>
            </Link>
          </div>

          {/* Role Badges Banner */}
          <div className="mt-14 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider text-xs font-semibold text-slate-400">Tracks Available:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Layers className="w-4 h-4 mr-1.5 text-brand-500" /> Full Stack Engineering
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Terminal className="w-4 h-4 mr-1.5 text-indigo-500" /> Backend Systems & Architecture
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Database className="w-4 h-4 mr-1.5 text-purple-500" /> Data Science & ML Engineering
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Built to Mimic Top-Tier Tech Interviews</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Every detail is engineered to help you identify blind spots and sharpen technical communication under realistic interview pressure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Adaptive Follow-Up Questions</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Just like a real interviewer, the AI probes your technical decisions and asks follow-ups when trade-offs or edge cases need deeper exploration.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">3-Dimensional Answer Scoring</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Receive instant granular feedback on <span className="font-semibold text-slate-800 dark:text-slate-200">Correctness</span>, <span className="font-semibold text-slate-800 dark:text-slate-200">Clarity</span>, and <span className="font-semibold text-slate-800 dark:text-slate-200">Depth</span>, paired with ideal senior-level answer outlines.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Personalized Improvement Plan</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Get a comprehensive post-interview report featuring your overall score, identified weak topics, strengths, and a concrete 5-point study action plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-br from-brand-900 via-indigo-900 to-slate-900 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to Ace Your Next Tech Screen?</h2>
            <p className="mt-4 text-indigo-200 max-w-xl mx-auto text-base sm:text-lg">
              Practice role-specific questions, test your knowledge under timed conditions, and level up your engineering communication today.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to={isAuthenticated ? '/interview/new' : '/register'}
                className="inline-flex items-center px-8 py-3.5 rounded-2xl font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                Get Started in 30 Seconds
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
