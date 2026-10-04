import React from 'react';
import { Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { formatDisplayDate } from '../../utils/dateUtils';

export default function Header() {
  const { profile, todayStr, currentDay, totalDays, isCompleted, hasStarted } = useGym();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">
            {profile.name || 'Athlete'}
          </h2>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-3 h-3" /> Completed
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Your Gym Subscription & Daily Tracker
        </p>
      </div>

      {/* Date badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs sm:text-sm self-start sm:self-auto shadow-inner">
        <CalendarIcon className="w-4 h-4 text-emerald-400" />
        <span className="font-medium">{formatDisplayDate(todayStr, 'full')}</span>
      </div>
    </div>
  );
}
