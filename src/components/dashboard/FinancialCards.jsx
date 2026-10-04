import React from 'react';
import { IndianRupee, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { formatCurrency } from '../../utils/calculations';

export default function FinancialCards() {
  const {
    costPerSession,
    valueRecovered,
    remainingValue,
    dailySubscriptionValue,
    daysGone,
    totalDays,
    subscription,
  } = useGym();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* COST PER SESSION CARD */}
      <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-card hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cost Per Session
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {costPerSession !== null ? formatCurrency(costPerSession, 2) : '₹—'}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ session</span>
          </div>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {daysGone > 0 ? (
              <span>Effective investment per workout attended across {daysGone} sessions.</span>
            ) : (
              <span>Record your first attended session to unlock your per-session rate.</span>
            )}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Membership daily rate:</span>
          <span className="font-semibold text-slate-300">{formatCurrency(dailySubscriptionValue, 2)} / day</span>
        </div>
      </div>

      {/* VALUE RECOVERED CARD */}
      <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-card hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Value Recovered
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(valueRecovered, 2)}
            </span>
            <span className="text-xs text-slate-400 font-medium">recovered</span>
          </div>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Monetary value extracted from your {daysGone} attended days at {formatCurrency(dailySubscriptionValue, 1)}/day.
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Unused value remaining:</span>
          <span className="font-semibold text-amber-300">{formatCurrency(remainingValue, 2)}</span>
        </div>
      </div>
    </div>
  );
}
