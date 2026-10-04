import React, { useState } from 'react';
import { Dumbbell, Calendar, IndianRupee, User, Sparkles, AlertCircle } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import {
  getTodayLocalDateString,
  addCalendarDays,
  getTotalSubscriptionDays,
  isValidDateString,
  diffInCalendarDays,
} from '../../utils/dateUtils';

export default function OnboardingSetup() {
  const { setupSubscription } = useGym();

  const today = getTodayLocalDateString();
  const defaultEnd = addCalendarDays(today, 90); // 3 months default

  const [name, setName] = useState('');
  const [feesPaid, setFeesPaid] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [error, setError] = useState('');

  // Calculate live preview of duration
  const totalDays = (isValidDateString(startDate) && isValidDateString(endDate) && diffInCalendarDays(endDate, startDate) >= 0)
    ? getTotalSubscriptionDays(startDate, endDate)
    : 0;

  // Quick preset helper
  const applyPresetMonths = (months) => {
    const start = startDate && isValidDateString(startDate) ? startDate : today;
    // approximate days
    const daysToAdd = Math.round(months * 30.416);
    setStartDate(start);
    setEndDate(addCalendarDays(start, daysToAdd));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }

    const numFees = Number(feesPaid);
    if (isNaN(numFees) || numFees <= 0) {
      setError('Gym fees paid must be a positive number (greater than 0).');
      return;
    }

    if (!startDate || !isValidDateString(startDate)) {
      setError('Please select a valid subscription start date.');
      return;
    }

    if (!endDate || !isValidDateString(endDate)) {
      setError('Please select a valid subscription end date.');
      return;
    }

    if (diffInCalendarDays(endDate, startDate) < 0) {
      setError('Subscription end date cannot be earlier than start date.');
      return;
    }

    // Initialize subscription
    setupSubscription({
      name: trimmedName,
      feesPaid: numFees,
      startDate,
      endDate,
    });
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-[#111726]/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/25 mb-4">
            <Dumbbell className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
            Welcome to GYM DAYZ
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-md mx-auto">
            Your personal gym subscription tracker. Track every workout, calculate your real value recovered, and never waste a paid day.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-3 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* User Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Devi Night"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white placeholder-slate-500 text-sm transition-colors outline-none"
                required
              />
            </div>
          </div>

          {/* Fees Paid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Gym Fees Paid (₹)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <IndianRupee className="w-5 h-5" />
              </div>
              <input
                type="number"
                min="1"
                step="any"
                value={feesPaid}
                onChange={(e) => setFeesPaid(e.target.value)}
                placeholder="e.g. 7500"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white placeholder-slate-500 text-sm transition-colors outline-none"
                required
              />
            </div>
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Start Date (Day 1)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white text-sm transition-colors outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Exact End Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white text-sm transition-colors outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Duration Presets */}
          <div>
            <span className="block text-[11px] font-medium text-slate-400 mb-2">
              Quick duration presets:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '1 Month', m: 1 },
                { label: '3 Months', m: 3 },
                { label: '6 Months', m: 6 },
                { label: '1 Year', m: 12 },
              ].map(preset => (
                <button
                  type="button"
                  key={preset.m}
                  onClick={() => applyPresetMonths(preset.m)}
                  className="py-1.5 px-2 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Summary Badge */}
          {totalDays > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Total Membership Duration:
              </span>
              <span className="font-bold text-sm text-emerald-200">
                {totalDays} Calendar Days
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.98] mt-6 flex items-center justify-center gap-2"
          >
            Start Tracking Gym Days
          </button>
        </form>
      </div>
    </div>
  );
}
