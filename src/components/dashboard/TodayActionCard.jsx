import React from 'react';
import { Dumbbell, Check, Ban, Clock, Sparkles } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { formatDisplayDate } from '../../utils/dateUtils';

export default function TodayActionCard() {
  const {
    todayStr,
    currentDay,
    hasStarted,
    isCompleted,
    todayStatus,
    markTodayAttended,
    markTodayMissed,
  } = useGym();

  const isAttended = todayStatus === 'attended';
  const isMissed = todayStatus === 'missed';

  return (
    <div className={`bg-[#111726]/90 border rounded-3xl p-5 sm:p-6 shadow-card transition-all relative overflow-hidden ${
      isAttended
        ? 'border-emerald-500/40 bg-emerald-950/10'
        : isMissed
        ? 'border-rose-500/30 bg-rose-950/10'
        : 'border-slate-800/80'
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 shrink-0">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                TODAY'S WORKOUT
              </h3>
              {currentDay > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                  DAY {currentDay}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {formatDisplayDate(todayStr, 'full')}
            </p>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div>
          {isAttended ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Attended</span>
            </span>
          ) : isMissed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
              <Ban className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Skipped</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Not Logged</span>
            </span>
          )}
        </div>
      </div>

      {/* 2 Clean Symmetrical Action Buttons (Miss = Skip unified, no duplicate ticks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* ATTENDED BUTTON */}
        <button
          onClick={markTodayAttended}
          disabled={isCompleted || !hasStarted}
          className={`py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98] select-none ${
            isAttended
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400 font-black'
              : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200'
          } ${isCompleted || !hasStarted ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Check className={`w-5 h-5 stroke-[2.5] ${isAttended ? 'text-slate-950' : 'text-emerald-400'}`} />
          <span>{isAttended ? 'Attended Today' : 'Went to Gym'}</span>
        </button>

        {/* SKIP / MISS BUTTON */}
        <button
          onClick={markTodayMissed}
          disabled={isCompleted || !hasStarted}
          className={`py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98] select-none ${
            isMissed
              ? 'bg-rose-500 text-white shadow-rose-500/25 ring-2 ring-rose-400 font-black'
              : 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200'
          } ${isCompleted || !hasStarted ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Ban className={`w-5 h-5 stroke-[2.5] ${isMissed ? 'text-white' : 'text-rose-400'}`} />
          <span>{isMissed ? 'Skipped Today' : 'Skip / Miss Today'}</span>
        </button>
      </div>

      {/* Helper Context Subtext */}
      <div className="mt-3.5 text-center sm:text-left">
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {isAttended
            ? 'Workout logged for today! Tap again if you need to undo.'
            : isMissed
            ? 'Rest day logged for today. Tap again if you need to undo.'
            : 'Did you hit the gym today? Tap to record workout or mark as a skipped/rest day.'}
        </p>
      </div>
    </div>
  );
}
