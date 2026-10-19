import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Lock, User, ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const LoginPage: React.FC = () => {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide your username (or email) and password.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest('Guest Candidate');
    navigate('/dashboard', { replace: true });
  };

  const handleDemoLogin = async () => {
    const demoUser = 'alex_dev';
    const demoPassword = 'Password123!';
    setIdentifier(demoUser);
    setPassword(demoPassword);

    try {
      setError(null);
      setLoading(true);
      try {
        await login(demoUser, demoPassword);
      } catch (loginErr: any) {
        await authApi.register(demoUser, 'AlexDev', demoPassword);
        await login(demoUser, demoPassword);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      // Fallback directly to guest/local session so user is never blocked
      loginAsGuest('Alex Dev');
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-600 dark:bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/30 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome to InterviewAI</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in with your username or try instantly as a guest
          </p>
        </div>

        {/* Guest Instant Access Button */}
        <button
          type="button"
          onClick={handleGuestLogin}
          className="w-full flex items-center justify-center py-3 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <Compass className="w-4 h-4 mr-2" />
          <span>Explore as Guest (No Login Required)</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">or sign in</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. sumedha or user@domain.com"
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? <LoadingSpinner size="sm" message="Signing in..." /> : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast-login button */}
        <div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
            Quick Fill Demo Account (Alex Dev)
          </button>
        </div>

        <div className="text-center pt-3 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400">
              Create an account with username
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
