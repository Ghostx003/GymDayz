import React from 'react';
import { Dumbbell, QrCode, Calendar, BarChart3, Settings, LayoutDashboard, Ticket } from 'lucide-react';
import { useGym } from '../../context/GymContext';

export default function Navbar({ activeTab, setActiveTab, onOpenSync, onOpenPass }) {
  const { profile, isConfigured } = useGym();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Gym Pass Trigger */}
        <div 
          onClick={onOpenPass}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="Click to view Gym Entry Barcode & Member Pass"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenPass?.();
            }
          }}
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 group-hover:shadow-emerald-500/40 transition-all">
            <Dumbbell className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent group-hover:to-emerald-300 transition-colors">
                GYM DAYZ
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Ticket className="w-2.5 h-2.5" />
                <span>Pass</span>
              </span>
            </div>
            {isConfigured && profile.name ? (
              <span className="block text-[11px] font-medium text-slate-400 leading-none group-hover:text-slate-300">
                {profile.name} • Tap for barcode
              </span>
            ) : (
              <span className="block text-[11px] font-medium text-slate-400 leading-none">
                Tap for gym pass
              </span>
            )}
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sync Action Button */}
        <div className="flex items-center gap-2">
          {isConfigured && (
            <button
              onClick={onOpenSync}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
              title="Sync between Phone & PC"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Sync Phone/PC</span>
              <span className="sm:hidden">Sync</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
