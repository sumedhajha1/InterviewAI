import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  initialSeconds: number; // e.g., 180 for 3 minutes
  onTimeUp?: () => void;
  isPaused?: boolean;
  questionKey: string | number; // reset timer when questionKey changes
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds,
  onTimeUp,
  isPaused = false,
  questionKey,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [questionKey, initialSeconds]);

  useEffect(() => {
    if (isPaused) return;

    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [secondsLeft, isPaused, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const percentage = Math.max(0, Math.min(100, (secondsLeft / initialSeconds) * 100));

  const isLowTime = secondsLeft <= 30;
  const isCritical = secondsLeft <= 10;

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
      {isLowTime ? (
        <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-rose-600 animate-bounce' : 'text-amber-500 animate-pulse'}`} />
      ) : (
        <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
      )}
      <div className="flex flex-col">
        <span
          className={`font-mono font-semibold text-sm tracking-wider ${
            isCritical
              ? 'text-rose-600 dark:text-rose-400'
              : isLowTime
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-800 dark:text-slate-200'
          }`}
        >
          {formattedTime}
        </span>
      </div>
      {/* Mini Progress Bar */}
      <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isCritical
              ? 'bg-rose-500'
              : isLowTime
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
