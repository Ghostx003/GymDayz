import React, { useState, Suspense, lazy } from 'react';
import { useGym } from './context/GymContext';
import OnboardingSetup from './components/setup/OnboardingSetup';
import Navbar from './components/common/Navbar';
import TabBar from './components/common/TabBar';
import Toast from './components/common/Toast';

// Core Dashboard components (eager loaded for instant first paint)
import Header from './components/dashboard/Header';
import SummaryCards from './components/dashboard/SummaryCards';
import DonutProgress from './components/dashboard/DonutProgress';
import AttendanceCounter from './components/dashboard/AttendanceCounter';
import TodayActionCard from './components/dashboard/TodayActionCard';
import FinancialCards from './components/dashboard/FinancialCards';
import AttendanceCalendar from './components/calendar/AttendanceCalendar';

// Lazy loaded views to keep main bundle tiny
const StatisticsView = lazy(() => import('./components/stats/StatisticsView'));
const SettingsView = lazy(() => import('./components/settings/SettingsView'));
const SyncModal = lazy(() => import('./components/sync/SyncModal'));

function ViewLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium">Loading view...</span>
    </div>
  );
}

export default function App() {
  const { isConfigured, toastMessage, hideToast } = useGym();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // If new user / not configured, show onboarding
  if (!isConfigured) {
    return (
      <>
        <Toast toast={toastMessage} onClose={hideToast} />
        <OnboardingSetup />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Name & Today's Date */}
            <Header />

            {/* Top Summary: Fees Paid & Current Subscription Day */}
            <SummaryCards />

            {/* Circular Progress & Today's Action Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <DonutProgress />
              <div className="space-y-6 flex flex-col justify-between">
                <TodayActionCard />
              </div>
            </div>

            {/* Prominent Attendance Counters (Days Gone / Days Missed) */}
            <AttendanceCounter />

            {/* Financial Return & Session Breakdown */}
            <FinancialCards />

            {/* Attendance Calendar Grid */}
            <AttendanceCalendar />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Calendar</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                View your complete subscription calendar and toggle workout attendance for any date.
              </p>
            </div>
            <AttendanceCalendar />
          </div>
        )}

        {activeTab === 'stats' && (
          <Suspense fallback={<ViewLoader />}>
            <div className="animate-in fade-in duration-200">
              <StatisticsView />
            </div>
          </Suspense>
        )}

        {activeTab === 'settings' && (
          <Suspense fallback={<ViewLoader />}>
            <div className="animate-in fade-in duration-200">
              <SettingsView onOpenSync={() => setIsSyncModalOpen(true)} />
            </div>
          </Suspense>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      {/* Sync Modal (Lazy) */}
      {isSyncModalOpen && (
        <Suspense fallback={null}>
          <SyncModal
            isOpen={isSyncModalOpen}
            onClose={() => setIsSyncModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Global Toast */}
      <Toast toast={toastMessage} onClose={hideToast} />
    </div>
  );
}
