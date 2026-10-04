import React from 'react';
import { Dumbbell, XCircle, Ban, RotateCcw, Check, Sparkles, Lock } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { formatDisplayDate } from '../../utils/dateUtils';

export default function TodayActionCard() {
  const {
    todayStr,
    currentDay,
    hasStarted,
    isCompleted,
    isTodaySkipped,
    todayStatus,
    markTodayAttended,
    markTodayMissed,
    toggleSkipToday,
  } = useGym();

  const isAttended = todayStatus === 'attended';
  const isMissed = todayStatus === 'missed';

  return (
    <div className={`bg-[#111726]/90 border rounded-3xl p-6 shadow-card transition-all relative overflow-hidden ${
      isTodaySkipped ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800/80'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-sm">
            <Dumbbell className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              TODAY'S WORKOUT
              {currentDay > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
                  DAY {currentDay}
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400">
              {formatDisplayDate(todayStr, 'full')}
            </span>
          </div>
        </div>

        {/* Skip status badge */}
        {isTodaySkipped && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5" />
            <span>Today Locked (Skipped)</span>
          </div>
        )}
      </div>

      {/* Main Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* GO TO GYM BUTTON */}
        <button
          onClick={markTodayAttended}
          disabled={isTodaySkipped || isCompleted || !hasStarted}
          className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
            isAttended
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400'
              : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300'
          } ${isTodaySkipped || isCompleted || !hasStarted ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{isAttended ? 'Attended Today ✓' : 'Go To Gym'}</span>
        </button>

        {/* MISS TODAY BUTTON */}
        <button
          onClick={markTodayMissed}
          disabled={isTodaySkipped || isCompleted || !hasStarted}
          className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
            isMissed
              ? 'bg-rose-500 text-white shadow-rose-500/25 ring-2 ring-rose-400'
              : 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300'
          } ${isTodaySkipped || isCompleted || !hasStarted ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <XCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{isMissed ? 'Missed Today ✕' : 'Miss Today'}</span>
        </button>

        {/* SKIP TODAY / UNDO SKIP BUTTON */}
        <button
          onClick={toggleSkipToday}
          className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
            isTodaySkipped
              ? 'bg-amber-500 text-slate-950 shadow-amber-500/25'
              : 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300'
          }`}
        >
          {isTodaySkipped ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Undo Skip</span>
            </>
          ) : (
            <>
              <Ban className="w-4 h-4" />
              <span>Skip Today</span>
            </>
          )}
        </button>
      </div>

      {/* Helper text */}
      <div className="mt-3 text-center sm:text-left">
        <p className="text-[11px] text-slate-500 leading-normal">
          {isTodaySkipped
            ? 'Today is locked from attendance modifications. Click "Undo Skip" anytime to enable workout logging.'
            : isAttended
            ? 'Great job working out today! Click again anytime to toggle or adjust.'
            : isMissed
            ? 'Today marked as missed. Rest up and crush it tomorrow!'
            : 'Tap "Go To Gym" after completing your workout, or "Skip Today" for planned rest days.'}
        </p>
      </div>
    </div>
  );
}
