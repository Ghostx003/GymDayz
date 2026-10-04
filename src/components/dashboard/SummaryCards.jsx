import React from 'react';
import { IndianRupee, Flame, Clock, Award } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { formatCurrency } from '../../utils/calculations';
import { formatDisplayDate, diffInCalendarDays } from '../../utils/dateUtils';

export default function SummaryCards() {
  const {
    subscription,
    currentDay,
    totalDays,
    remainingDays,
    isCompleted,
    hasStarted,
    todayStr,
  } = useGym();

  // If subscription hasn't started yet
  const daysUntilStart = !hasStarted
    ? diffInCalendarDays(subscription.startDate, todayStr)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Fees Paid Card */}
      <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-card hover:border-slate-700/80 transition-all flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Fees Paid
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatCurrency(subscription.feesPaid, 0)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {formatDisplayDate(subscription.startDate, 'short')} – {formatDisplayDate(subscription.endDate, 'short')}
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
          <IndianRupee className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* Current Subscription Day Card */}
      <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-card hover:border-slate-700/80 transition-all flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Current Subscription Day
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {!hasStarted ? `DAY 0` : `DAY ${currentDay}`}
            </span>
            <span className="text-sm font-semibold text-slate-500">
              / {totalDays}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block font-medium">
            {!hasStarted ? (
              <span className="text-cyan-400">Starts in {daysUntilStart} days</span>
            ) : isCompleted ? (
              <span className="text-emerald-400 font-semibold">Subscription Completed</span>
            ) : (
              <span>{remainingDays} {remainingDays === 1 ? 'day' : 'days'} remaining</span>
            )}
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
          {isCompleted ? (
            <Award className="w-6 h-6 stroke-[2.2]" />
          ) : (
            <Flame className="w-6 h-6 stroke-[2.2]" />
          )}
        </div>
      </div>
    </div>
  );
}
