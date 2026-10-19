import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss, className = '' }) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-start justify-between p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-sm shadow-sm transition-all ${className}`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
        <span className="leading-snug">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-3 -mr-1 p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
