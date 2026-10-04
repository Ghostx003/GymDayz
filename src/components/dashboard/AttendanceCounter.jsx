import React from 'react';
import { Plus, Minus, Check, X as XIcon, Lock } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { usePressAndHold } from '../../hooks/usePressAndHold';

function CounterButton({ onClick, disabled, icon: Icon, label, color = 'emerald' }) {
  const pressHandlers = usePressAndHold(onClick, disabled);

  const colorStyles = {
    emerald: {
      active: 'bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/35 border-emerald-500/40 text-emerald-300 active:scale-95',
      disabled: 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed',
    },
    rose: {
      active: 'bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 border-rose-500/40 text-rose-300 active:scale-95',
      disabled: 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed',
    }
  };

  const style = disabled ? colorStyles[color].disabled : colorStyles[color].active;

  return (
    <button
      {...pressHandlers}
      disabled={disabled}
      aria-label={label}
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center font-bold text-xl transition-all shadow-sm select-none touch-manipulation ${style}`}
    >
      <Icon className="w-6 h-6 stroke-[2.5]" />
    </button>
  );
}

export function AttendanceCounter() {
  const {
    currentDay,
    daysGone,
    daysMissed,
    isTodaySkipped,
    incrementDaysGone,
    decrementDaysGone,
    incrementDaysMissed,
    decrementDaysMissed,
  } = useGym();

  // Constraints:
  // Minimum: 0
  // Maximum: currentDay
  // daysGone + daysMissed <= currentDay
  const remainingAllowance = Math.max(0, currentDay - (daysGone + daysMissed));

  const canIncGone = remainingAllowance > 0 && daysGone < currentDay;
  const canDecGone = daysGone > 0;

  const canIncMissed = remainingAllowance > 0 && daysMissed < currentDay;
  const canDecMissed = daysMissed > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* DAYS GONE COUNTER */}
      <div className="bg-[#111726]/90 border border-slate-800/80 rounded-3xl p-6 shadow-card flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Days Gone
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Attended
          </span>
        </div>

        {/* Big Counter Value */}
        <div className="py-4 text-center">
          <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter tabular-nums">
            {daysGone}
          </div>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            Max possible: {currentDay} days
          </span>
        </div>

        {/* Plus / Minus Buttons with Press-and-hold */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <CounterButton
            onClick={decrementDaysGone}
            disabled={!canDecGone}
            icon={Minus}
            label="Decrease Days Gone"
            color="emerald"
          />
          <CounterButton
            onClick={incrementDaysGone}
            disabled={!canIncGone}
            icon={Plus}
            label="Increase Days Gone"
            color="emerald"
          />
        </div>
      </div>

      {/* DAYS MISSED COUNTER */}
      <div className="bg-[#111726]/90 border border-slate-800/80 rounded-3xl p-6 shadow-card flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XIcon className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Days Missed
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Missed
          </span>
        </div>

        {/* Big Counter Value */}
        <div className="py-4 text-center">
          <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter tabular-nums">
            {daysMissed}
          </div>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            {daysGone + daysMissed} of {currentDay} days accounted for
          </span>
        </div>

        {/* Plus / Minus Buttons with Press-and-hold */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <CounterButton
            onClick={decrementDaysMissed}
            disabled={!canDecMissed}
            icon={Minus}
            label="Decrease Days Missed"
            color="rose"
          />
          <CounterButton
            onClick={incrementDaysMissed}
            disabled={!canIncMissed}
            icon={Plus}
            label="Increase Days Missed"
            color="rose"
          />
        </div>
      </div>
    </div>
  );
}
export default AttendanceCounter;
