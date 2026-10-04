import React from 'react';
import { useGym } from '../../context/GymContext';
import { Sparkles } from 'lucide-react';

export default function DonutProgress() {
  const {
    currentDay,
    totalDays,
    remainingDays,
    completionPercentage,
    isCompleted,
    hasStarted,
  } = useGym();

  const radius = 78;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Clamped percentage
  const clampedPercent = Math.min(100, Math.max(0, completionPercentage));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="bg-[#111726]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-card flex flex-col items-center relative overflow-hidden">
      {/* Background ambient radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* SVG Donut */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gymProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="progressGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />

          {/* Animated active progress arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#gymProgressGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#progressGlow)"
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">
            {Math.round(clampedPercent)}%
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1 leading-tight">
            {isCompleted ? 'Subscription' : 'Subscription'}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400 leading-tight">
            {isCompleted ? 'Completed' : 'Complete'}
          </span>
        </div>
      </div>

      {/* Detail description */}
      <div className="mt-4 text-center">
        <div className="text-base sm:text-lg font-bold text-slate-200">
          {!hasStarted ? (
            <span>Subscription not yet started</span>
          ) : (
            <span>Day {currentDay} of {totalDays}</span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium flex items-center justify-center gap-1.5">
          {isCompleted ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> All subscription days completed!
            </span>
          ) : (
            <span>{remainingDays} days remaining</span>
          )}
        </p>
      </div>
    </div>
  );
}
