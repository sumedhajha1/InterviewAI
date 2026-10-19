import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  subMessage,
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-brand-600 dark:text-brand-400`} />
        {size === 'lg' && (
          <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-2 animate-pulse" />
        )}
      </div>
      {message && (
        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm md:text-base animate-pulse">
          {message}
        </p>
      )}
      {subMessage && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {subMessage}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
