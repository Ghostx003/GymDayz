import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadGymData,
  saveGymData,
  clearGymData,
} from '../storage/gymStorage';
import { createInitialData } from '../storage/defaultData';
import {
  getTodayLocalDateString,
  getTotalSubscriptionDays,
  getCurrentSubscriptionDay,
  getRemainingDays,
  isSubscriptionCompleted,
  isSubscriptionStarted,
  diffInCalendarDays,
  addCalendarDays,
} from '../utils/dateUtils';
import {
  calculateSubscriptionCompletion,
  calculateAttendancePercentage,
  calculateCostPerSession,
  calculateDailySubscriptionValue,
  calculateValueRecovered,
  calculateRemainingValue,
  calculateStreaks,
} from '../utils/calculations';
import { decodeSyncPayload } from '../sync/syncCodec';
import { resolveSyncConflict, countDaysGone, countDaysMissed } from '../sync/conflictResolver';
import { fireWorkoutConfetti } from '../utils/confetti';

const GymContext = createContext(null);

export function GymProvider({ children }) {
  // Load persisted state or null if not yet set up
  const [gymData, setGymData] = useState(() => loadGymData());
  const [todayStr, setTodayStr] = useState(() => getTodayLocalDateString());
  const [toastMessage, setToastMessage] = useState(null);

  // Show toast notification helper
  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Update todayStr automatically on midnight transition, tab visibility change, or interval
  useEffect(() => {
    const checkDate = () => {
      const nowStr = getTodayLocalDateString();
      if (nowStr !== todayStr) {
        setTodayStr(nowStr);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkDate, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDate();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkDate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkDate);
    };
  }, [todayStr]);

  // Derived core subscription values
  const isConfigured = Boolean(
    gymData &&
    gymData.profile?.name &&
    gymData.subscription?.startDate &&
    gymData.subscription?.endDate
  );

  const profile = gymData?.profile || { name: '' };
  const subscription = gymData?.subscription || { feesPaid: 0, startDate: '', endDate: '' };
  const attendance = gymData?.attendance || {};
  const skippedDates = gymData?.skippedDates || [];
  const metadata = gymData?.metadata || {};

  const totalDays = useMemo(() => {
    if (!isConfigured) return 0;
    return getTotalSubscriptionDays(subscription.startDate, subscription.endDate);
  }, [isConfigured, subscription.startDate, subscription.endDate]);

  const currentDay = useMemo(() => {
    if (!isConfigured) return 0;
    return getCurrentSubscriptionDay(subscription.startDate, subscription.endDate, todayStr);
  }, [isConfigured, subscription.startDate, subscription.endDate, todayStr]);

  const remainingDays = useMemo(() => {
    if (!isConfigured) return 0;
    return getRemainingDays(subscription.startDate, subscription.endDate, todayStr);
  }, [isConfigured, subscription.startDate, subscription.endDate, todayStr]);

  const isCompleted = useMemo(() => {
    if (!isConfigured) return false;
    return isSubscriptionCompleted(subscription.endDate, todayStr);
  }, [isConfigured, subscription.endDate, todayStr]);

  const hasStarted = useMemo(() => {
    if (!isConfigured) return false;
    return isSubscriptionStarted(subscription.startDate, todayStr);
  }, [isConfigured, subscription.startDate, todayStr]);

  // Attendance counts
  const daysGone = useMemo(() => countDaysGone(attendance), [attendance]);
  const daysMissed = useMemo(() => countDaysMissed(attendance), [attendance]);

  // Today state
  const isTodaySkipped = useMemo(() => skippedDates.includes(todayStr), [skippedDates, todayStr]);
  const todayStatus = useMemo(() => attendance[todayStr] || null, [attendance, todayStr]);

  // Metrics
  const completionPercentage = useMemo(() => {
    return calculateSubscriptionCompletion(currentDay, totalDays);
  }, [currentDay, totalDays]);

  const attendancePercentage = useMemo(() => {
    return calculateAttendancePercentage(daysGone, currentDay);
  }, [daysGone, currentDay]);

  const costPerSession = useMemo(() => {
    return calculateCostPerSession(subscription.feesPaid, daysGone);
  }, [subscription.feesPaid, daysGone]);

  const dailySubscriptionValue = useMemo(() => {
    return calculateDailySubscriptionValue(subscription.feesPaid, totalDays);
  }, [subscription.feesPaid, totalDays]);

  const valueRecovered = useMemo(() => {
    return calculateValueRecovered(subscription.feesPaid, totalDays, daysGone);
  }, [subscription.feesPaid, totalDays, daysGone]);

  const remainingValue = useMemo(() => {
    return calculateRemainingValue(subscription.feesPaid, totalDays, daysGone);
  }, [subscription.feesPaid, totalDays, daysGone]);

  const streaks = useMemo(() => {
    return calculateStreaks(attendance, subscription.startDate, subscription.endDate, todayStr);
  }, [attendance, subscription.startDate, subscription.endDate, todayStr]);

  // Mutators and Persistence
  const updateAndPersist = useCallback((updater) => {
    setGymData(prev => {
      const base = prev || createInitialData();
      const updated = typeof updater === 'function' ? updater(base) : updater;
      saveGymData(updated);
      return updated;
    });
  }, []);

  // Setup Subscription from Onboarding
  const setupSubscription = useCallback(({ name, feesPaid, startDate, endDate }) => {
    const newData = {
      version: 1,
      profile: { name: name.trim() },
      subscription: {
        feesPaid: Math.max(0, Number(feesPaid)),
        startDate,
        endDate,
      },
      attendance: {},
      skippedDates: [],
      metadata: {
        lastUpdatedAt: new Date().toISOString(),
        updatedBy: typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 'phone' : 'pc',
      },
    };
    updateAndPersist(newData);
    showToast(`Welcome to Gym Dayz, ${name.trim()}! Membership initialized.`);
  }, [updateAndPersist, showToast]);

  // Edit Subscription / Profile in Settings
  const updateSubscriptionSettings = useCallback(({ name, feesPaid, startDate, endDate }) => {
    updateAndPersist(prev => ({
      ...prev,
      profile: { name: name.trim() },
      subscription: {
        feesPaid: Math.max(0, Number(feesPaid)),
        startDate,
        endDate,
      },
    }));
    showToast('Subscription settings saved successfully.');
  }, [updateAndPersist, showToast]);

  // Mark a specific date on Calendar
  const setDateAttendance = useCallback((dateStr, newStatus) => {
    // Cannot modify future dates or dates outside subscription
    if (!subscription.startDate || !subscription.endDate) return;
    if (diffInCalendarDays(todayStr, dateStr) < 0) {
      showToast('Cannot record attendance for future dates!', 'error');
      return;
    }
    if (diffInCalendarDays(dateStr, subscription.startDate) < 0 || diffInCalendarDays(subscription.endDate, dateStr) < 0) {
      showToast('Date is outside your active subscription range', 'error');
      return;
    }

    updateAndPersist(prev => {
      const currentAttendance = { ...(prev.attendance || {}) };
      const currentGone = countDaysGone(currentAttendance);
      const currentMiss = countDaysMissed(currentAttendance);
      const existingStatus = currentAttendance[dateStr];

      // If assigning attended, check total constraint
      if (newStatus === 'attended') {
        const addedGone = existingStatus === 'attended' ? 0 : 1;
        const subbedMissed = existingStatus === 'missed' ? 1 : 0;
        if (currentGone + addedGone + currentMiss - subbedMissed > currentDay) {
          showToast('Total attendance decisions cannot exceed current subscription day!', 'error');
          return prev;
        }
        currentAttendance[dateStr] = 'attended';
        fireWorkoutConfetti();
      } else if (newStatus === 'missed') {
        const addedMiss = existingStatus === 'missed' ? 0 : 1;
        const subbedGone = existingStatus === 'attended' ? 1 : 0;
        if (currentGone - subbedGone + currentMiss + addedMiss > currentDay) {
          showToast('Total attendance decisions cannot exceed current subscription day!', 'error');
          return prev;
        }
        currentAttendance[dateStr] = 'missed';
      } else {
        // Unmarked
        delete currentAttendance[dateStr];
      }

      return {
        ...prev,
        attendance: currentAttendance,
      };
    });
  }, [subscription.startDate, subscription.endDate, todayStr, currentDay, updateAndPersist, showToast]);

  // Today Actions (Miss = Skip, unified)
  const markTodayAttended = useCallback(() => {
    if (isCompleted || !hasStarted) return;
    setDateAttendance(todayStr, todayStatus === 'attended' ? 'unmarked' : 'attended');
  }, [isCompleted, hasStarted, setDateAttendance, todayStr, todayStatus]);

  const markTodayMissed = useCallback(() => {
    if (isCompleted || !hasStarted) return;
    setDateAttendance(todayStr, todayStatus === 'missed' ? 'unmarked' : 'missed');
  }, [isCompleted, hasStarted, setDateAttendance, todayStr, todayStatus]);

  const toggleSkipToday = useCallback(() => {
    // Skip and Miss are unified
    markTodayMissed();
  }, [markTodayMissed]);

  // Deterministic Counter Increments / Decrements
  const incrementDaysGone = useCallback(() => {
    if (isTodaySkipped && currentDay <= daysGone + daysMissed + 1) {
      // If today is skipped and remaining capacity is 0
      // Check if we can allocate to an earlier unmarked day
    }
    if (daysGone + daysMissed >= currentDay) {
      showToast(`Cannot exceed current subscription day (Day ${currentDay})`, 'warning');
      return;
    }

    // Deterministically find the latest unmarked date <= today to mark as 'attended'
    // Search backward from today to startDate
    updateAndPersist(prev => {
      const att = { ...(prev.attendance || {}) };
      let targetDate = null;

      // First check backward from today
      const maxOffset = diffInCalendarDays(todayStr, subscription.startDate);
      for (let i = 0; i <= maxOffset; i++) {
        const d = addCalendarDays(todayStr, -i);
        // If today is skipped, skip today as target
        if (d === todayStr && prev.skippedDates?.includes(todayStr)) {
          continue;
        }
        if (!att[d]) {
          targetDate = d;
          break;
        }
      }

      // If no unmarked found, try converting the oldest 'missed' date
      if (!targetDate) {
        for (let i = 0; i <= maxOffset; i++) {
          const d = addCalendarDays(todayStr, -i);
          if (att[d] === 'missed') {
            targetDate = d;
            break;
          }
        }
      }

      if (targetDate) {
        att[targetDate] = 'attended';
        fireWorkoutConfetti();
      }

      return {
        ...prev,
        attendance: att,
      };
    });
  }, [isTodaySkipped, currentDay, daysGone, daysMissed, todayStr, subscription.startDate, updateAndPersist, showToast]);

  const decrementDaysGone = useCallback(() => {
    if (daysGone <= 0) return;

    // Find latest date marked 'attended' and remove it
    updateAndPersist(prev => {
      const att = { ...(prev.attendance || {}) };
      const maxOffset = diffInCalendarDays(todayStr, subscription.startDate);
      for (let i = 0; i <= maxOffset; i++) {
        const d = addCalendarDays(todayStr, -i);
        if (att[d] === 'attended') {
          delete att[d];
          break;
        }
      }
      return {
        ...prev,
        attendance: att,
      };
    });
  }, [daysGone, todayStr, subscription.startDate, updateAndPersist]);

  const incrementDaysMissed = useCallback(() => {
    if (daysGone + daysMissed >= currentDay) {
      showToast(`Cannot exceed current subscription day (Day ${currentDay})`, 'warning');
      return;
    }

    // Find latest unmarked date <= today and mark as 'missed'
    updateAndPersist(prev => {
      const att = { ...(prev.attendance || {}) };
      let targetDate = null;
      const maxOffset = diffInCalendarDays(todayStr, subscription.startDate);

      for (let i = 0; i <= maxOffset; i++) {
        const d = addCalendarDays(todayStr, -i);
        if (d === todayStr && prev.skippedDates?.includes(todayStr)) {
          continue;
        }
        if (!att[d]) {
          targetDate = d;
          break;
        }
      }

      if (targetDate) {
        att[targetDate] = 'missed';
      }

      return {
        ...prev,
        attendance: att,
      };
    });
  }, [daysGone, daysMissed, currentDay, todayStr, subscription.startDate, updateAndPersist, showToast]);

  const decrementDaysMissed = useCallback(() => {
    if (daysMissed <= 0) return;

    // Find latest date marked 'missed' and unmark it
    updateAndPersist(prev => {
      const att = { ...(prev.attendance || {}) };
      const maxOffset = diffInCalendarDays(todayStr, subscription.startDate);
      for (let i = 0; i <= maxOffset; i++) {
        const d = addCalendarDays(todayStr, -i);
        if (att[d] === 'missed') {
          delete att[d];
          break;
        }
      }
      return {
        ...prev,
        attendance: att,
      };
    });
  }, [daysMissed, todayStr, subscription.startDate, updateAndPersist]);

  // QR Sync Engine
  const applySyncPayload = useCallback((payloadStr) => {
    try {
      const incomingData = decodeSyncPayload(payloadStr);
      const currentLocal = gymData || createInitialData();
      const resolution = resolveSyncConflict(currentLocal, incomingData);

      updateAndPersist(resolution.winningState);
      showToast(resolution.reason, 'success');
      return { success: true, resolution };
    } catch (err) {
      const msg = err.message || 'QR Sync failed';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  }, [gymData, updateAndPersist, showToast]);

  // Import JSON backup
  const importBackupData = useCallback((importedData) => {
    updateAndPersist(importedData);
    showToast('Data restored successfully from backup!');
  }, [updateAndPersist, showToast]);

  // Reset Application
  const resetAllData = useCallback(() => {
    clearGymData();
    setGymData(null);
    showToast('Gym Dayz data has been reset.', 'info');
  }, [showToast]);

  const value = {
    gymData,
    isConfigured,
    profile,
    subscription,
    attendance,
    skippedDates,
    metadata,
    todayStr,
    totalDays,
    currentDay,
    remainingDays,
    isCompleted,
    hasStarted,
    daysGone,
    daysMissed,
    isTodaySkipped,
    todayStatus,
    completionPercentage,
    attendancePercentage,
    costPerSession,
    dailySubscriptionValue,
    valueRecovered,
    remainingValue,
    streaks,
    toastMessage,
    showToast,
    hideToast,
    setupSubscription,
    updateSubscriptionSettings,
    setDateAttendance,
    markTodayAttended,
    markTodayMissed,
    toggleSkipToday,
    incrementDaysGone,
    decrementDaysGone,
    incrementDaysMissed,
    decrementDaysMissed,
    applySyncPayload,
    importBackupData,
    resetAllData,
  };

  return (
    <GymContext.Provider value={value}>
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
}
