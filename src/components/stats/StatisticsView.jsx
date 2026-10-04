import React from 'react';
import {
  Flame,
  Trophy,
  Target,
  Percent,
  TrendingUp,
  DollarSign,
  CalendarCheck,
  XCircle,
  Clock,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { formatCurrency, formatPercent } from '../../utils/calculations';
import { formatDisplayDate } from '../../utils/dateUtils';

export default function StatisticsView() {
  const {
    subscription,
    totalDays,
    currentDay,
    remainingDays,
    daysGone,
    daysMissed,
    completionPercentage,
    attendancePercentage,
    costPerSession,
    dailySubscriptionValue,
    valueRecovered,
    remainingValue,
    streaks,
  } = useGym();

  const statGroups = [
    {
      title: 'Workout & Streaks',
      items: [
        {
          label: 'Current Streak',
          value: `${streaks.currentStreak} ${streaks.currentStreak === 1 ? 'day' : 'days'}`,
          desc: 'Consecutive workouts right now',
          icon: Flame,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        },
        {
          label: 'Best Streak',
          value: `${streaks.bestStreak} ${streaks.bestStreak === 1 ? 'day' : 'days'}`,
          desc: 'All-time longest consecutive workouts',
          icon: Trophy,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
        {
          label: 'Attendance Rate',
          value: formatPercent(attendancePercentage),
          desc: `${daysGone} of ${currentDay} elapsed days attended`,
          icon: Percent,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        },
        {
          label: 'Missed Sessions',
          value: `${daysMissed} ${daysMissed === 1 ? 'day' : 'days'}`,
          desc: 'Days marked absent or skipped',
          icon: XCircle,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        },
      ],
    },
    {
      title: 'Financial & Value Return',
      items: [
        {
          label: 'Cost Per Session',
          value: costPerSession !== null ? formatCurrency(costPerSession, 2) : '₹—',
          desc: 'True cost per workout attended',
          icon: TrendingUp,
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        },
        {
          label: 'Recovered Value',
          value: formatCurrency(valueRecovered, 2),
          desc: `At daily rate of ${formatCurrency(dailySubscriptionValue, 1)}/day`,
          icon: DollarSign,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
        {
          label: 'Remaining Value',
          value: formatCurrency(remainingValue, 2),
          desc: 'Potential value left in unused days',
          icon: Sparkles,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        },
        {
          label: 'Membership Fee',
          value: formatCurrency(subscription.feesPaid, 0),
          desc: `Total upfront payment`,
          icon: Target,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        },
      ],
    },
    {
      title: 'Subscription Timeline',
      items: [
        {
          label: 'Subscription Progress',
          value: formatPercent(completionPercentage),
          desc: `Day ${currentDay} of ${totalDays} completed`,
          icon: PieChart,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        },
        {
          label: 'Days Elapsed',
          value: `${currentDay} days`,
          desc: `Since ${formatDisplayDate(subscription.startDate, 'short')}`,
          icon: CalendarCheck,
          color: 'text-slate-300 bg-slate-800 border-slate-700',
        },
        {
          label: 'Days Remaining',
          value: `${remainingDays} days`,
          desc: `Until ${formatDisplayDate(subscription.endDate, 'short')}`,
          icon: Clock,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
        {
          label: 'Total Plan Duration',
          value: `${totalDays} days`,
          desc: 'Total inclusive membership days',
          icon: Target,
          color: 'text-slate-300 bg-slate-800 border-slate-700',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Subscription Performance
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2">
            Detailed Analytics & Insights
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Track your financial return, habit consistency, and workout attendance milestones over your entire subscription.
          </p>
        </div>
      </div>

      {/* Metric Categories */}
      {statGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
            {group.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-card hover:border-slate-700/80 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400">
                      {item.label}
                    </span>
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${item.color}`}>
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white tracking-tight">
                      {item.value}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
