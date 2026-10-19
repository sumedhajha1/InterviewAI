import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Activity,
  PlayCircle,
  Clock,
  AlertTriangle,
  Award,
  Layers,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import { DashboardStats } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Loading your interview analytics..." size="lg" />
      </div>
    );
  }

  const hasScoreHistory = stats && stats.score_history && stats.score_history.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="text-brand-600 dark:text-brand-400">{user?.username}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your mock interview progress, target weak areas, and level up your technical answers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh metrics"
            aria-label="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/interview/new"
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Start New Interview
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Quick Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Interviews
            </span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight">{stats?.total_interviews ?? 0}</span>
            <span className="ml-2 text-xs text-slate-400">sessions</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Score
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats?.average_score ? `${stats.average_score}%` : '--'}
            </span>
            <span className="ml-2 text-xs text-slate-400">overall</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight">{stats?.completed_count ?? 0}</span>
            <span className="ml-2 text-xs text-slate-400">fully scored</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In-Progress
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight">{stats?.in_progress_count ?? 0}</span>
            <span className="ml-2 text-xs text-slate-400">active sessions</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Topic Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Score Over Time Chart (Recharts) */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Performance Progression</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Overall interview score across completed sessions</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-brand-600 dark:text-brand-400">
              <TrendingUp className="w-4 h-4" />
              <span>Score Trajectory</span>
            </div>
          </div>

          {hasScoreHistory ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.score_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                            <p className="font-bold text-sm text-brand-300">{data.score}% Overall Score</p>
                            <p className="text-slate-300">{data.role} ({data.difficulty})</p>
                            <p className="text-slate-400 text-[10px]">{data.date}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#4f46e5', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, fill: '#818cf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No scored interviews completed yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                Complete your first mock interview to see your score progression and trendline here.
              </p>
              <Link
                to="/interview/new"
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700"
              >
                Start an Interview
              </Link>
            </div>
          )}
        </div>

        {/* Weakest Topics & Focus Areas */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-4">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Weakest Topics</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Technical categories where your scores were lowest. Focus your study on these concepts.
            </p>

            {stats && stats.weakest_topics && stats.weakest_topics.length > 0 ? (
              <div className="space-y-3.5">
                {stats.weakest_topics.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                        {t.topic}
                      </span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                        {t.average_score}%
                      </span>
                    </div>
                    {/* Visual score bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, t.average_score)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
                Answer interview questions to reveal which technical areas need targeted revision.
              </div>
            )}
          </div>

          {stats && stats.strongest_topics && stats.strongest_topics.length > 0 && (
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-2">
                Top Strength
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {stats.strongest_topics[0].topic} ({stats.strongest_topics[0].average_score}%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Interviews Table / List */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Recent Mock Interviews</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">View performance breakdown or resume active interviews</p>
          </div>
        </div>

        {stats && stats.recent_interviews && stats.recent_interviews.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recent_interviews.map((interview) => (
              <div
                key={interview.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      interview.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {interview.overall_score ? `${Math.round(interview.overall_score)}%` : '...'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {interview.role}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {interview.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {interview.num_questions} Questions • {interview.created_at ? new Date(interview.created_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  {interview.status === 'completed' ? (
                    <Link
                      to={`/interview/${interview.id}/report`}
                      className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 rounded-xl transition-colors"
                    >
                      View Report
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  ) : (
                    <Link
                      to={`/interview/${interview.id}`}
                      className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      Resume Interview
                      <PlayCircle className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No interviews taken yet.</p>
            <Link
              to="/interview/new"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-sm"
            >
              Start Your First Interview
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
