import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Lock,
  Calendar as CalendarIcon,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import {
  parseLocalDate,
  formatLocalDate,
  getTodayLocalDateString,
  diffInCalendarDays,
  isDateWithinRange,
  formatDisplayDate,
} from '../../utils/dateUtils';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function AttendanceCalendar() {
  const {
    subscription,
    attendance,
    skippedDates,
    todayStr,
    setDateAttendance,
    isTodaySkipped,
  } = useGym();

  const startDate = parseLocalDate(subscription.startDate);
  const endDate = parseLocalDate(subscription.endDate);
  const today = parseLocalDate(todayStr);

  // Default to today's month, or subscription start month
  const [viewDate, setViewDate] = useState(() => {
    // If today is within range or after start, default to today's month; otherwise start month
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Build grid days
  // Days in month
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // First day of month (0 = Sun, 1 = Mon ...). We want Mon = 0, Sun = 6
  let firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  // Convert Sun(0) -> 6, Mon(1) -> 0
  firstDayIndex = (firstDayIndex + 6) % 7;

  // Calendar cells
  const cells = [];
  // Empty slots for previous month padding
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ type: 'empty', id: `empty-${i}` });
  }

  // Days of current month
  for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
    const dateObj = new Date(viewYear, viewMonth, dayNum);
    const dateStr = formatLocalDate(dateObj);

    const isInSubscription = isDateWithinRange(dateStr, subscription.startDate, subscription.endDate);
    const isFuture = diffInCalendarDays(todayStr, dateStr) < 0;
    const isToday = dateStr === todayStr;
    const status = attendance[dateStr] || null; // 'attended' | 'missed' | null
    const isSkipped = skippedDates.includes(dateStr);

    cells.push({
      type: 'day',
      dateStr,
      dayNum,
      isInSubscription,
      isFuture,
      isToday,
      status,
      isSkipped,
    });
  }

  // Cell click handler
  const handleDayClick = (cell) => {
    if (!cell.isInSubscription || cell.isFuture) return;
    if (cell.dateStr === todayStr && isTodaySkipped) return;

    // Cycle: unmarked -> attended -> missed -> unmarked
    let nextStatus = 'attended';
    if (cell.status === 'attended') {
      nextStatus = 'missed';
    } else if (cell.status === 'missed') {
      nextStatus = 'unmarked';
    } else {
      nextStatus = 'attended';
    }

    setDateAttendance(cell.dateStr, nextStatus);
  };

  const monthTitle = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-[#111726]/90 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-card">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            ATTENDANCE CALENDAR
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tap any past or today's date to toggle workout attendance
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-white min-w-[110px] text-center">
              {monthTitle}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center my-3">
        {WEEKDAYS.map(day => (
          <span key={day} className="text-[11px] font-bold uppercase tracking-wider text-slate-500 py-1">
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((cell) => {
          if (cell.type === 'empty') {
            return <div key={cell.id} className="aspect-square rounded-xl opacity-0" />;
          }

          const { dayNum, isInSubscription, isFuture, isToday, status, isSkipped } = cell;

          // Stylings based on status
          let cellStyle = 'bg-slate-900/40 text-slate-600 border border-slate-800/40 cursor-not-allowed';
          let statusBadge = null;

          if (isInSubscription) {
            if (isFuture) {
              cellStyle = 'bg-slate-900/60 text-slate-600 border border-slate-800/60 cursor-not-allowed';
            } else {
              // Past or today within subscription
              cellStyle = 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 cursor-pointer active:scale-95 transition-all';

              if (status === 'attended') {
                cellStyle = 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 shadow-sm shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all';
                statusBadge = <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 stroke-[3]" />;
              } else if (status === 'missed') {
                cellStyle = 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/50 shadow-sm shadow-rose-500/20 cursor-pointer active:scale-95 transition-all';
                statusBadge = <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 stroke-[3]" />;
              } else if (isSkipped) {
                cellStyle = 'bg-amber-500/15 text-amber-300 border border-amber-500/40 cursor-pointer';
                statusBadge = <Lock className="w-3 h-3 text-amber-400" />;
              }
            }
          }

          if (isToday) {
            cellStyle += ' ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#090d16] font-black';
          }

          return (
            <div
              key={cell.dateStr}
              onClick={() => handleDayClick(cell)}
              className={`aspect-square rounded-xl sm:rounded-2xl p-1 sm:p-2 flex flex-col items-center justify-between select-none relative ${cellStyle}`}
              title={`${cell.dateStr}${status ? ` (${status})` : ''}`}
            >
              {/* Day number */}
              <span className="text-xs sm:text-sm font-semibold">{dayNum}</span>

              {/* Status Indicator */}
              <div className="flex items-center justify-center flex-1">
                {statusBadge}
              </div>

              {/* Today indicator dot */}
              {isToday && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend & Instructions */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>Attended</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <X className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>Missed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Lock className="w-2.5 h-2.5" />
            </span>
            <span>Skipped</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-800/60 border border-slate-700/60" />
            <span>Unmarked</span>
          </div>
        </div>

        <div className="text-slate-500 italic">
          *Future dates locked
        </div>
      </div>
    </div>
  );
}
