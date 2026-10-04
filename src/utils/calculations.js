/**
 * Financial & Attendance Calculations for Gym Dayz
 */
import { diffInCalendarDays, addCalendarDays } from './dateUtils';

/**
 * Format number as Indian Rupee string
 * @param {number|null} amount 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatCurrency(amount, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹—';
  }
  const formatted = Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals > 0 && amount % 1 !== 0 ? decimals : 0,
  });
  return `₹${formatted}`;
}

/**
 * Format percentage
 * @param {number} percent 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatPercent(percent, decimals = 1) {
  if (isNaN(percent)) return '0%';
  return `${Number(percent).toFixed(decimals)}%`;
}

/**
 * Calculates Subscription Completion percentage (0 - 100)
 */
export function calculateSubscriptionCompletion(currentSubscriptionDay, totalSubscriptionDays) {
  if (!totalSubscriptionDays || totalSubscriptionDays <= 0) return 0;
  const raw = (currentSubscriptionDay / totalSubscriptionDays) * 100;
  return Math.min(100, Math.max(0, raw));
}

/**
 * Calculates Attendance percentage (0 - 100)
 * daysGone / currentSubscriptionDay * 100
 */
export function calculateAttendancePercentage(daysGone, currentSubscriptionDay) {
  if (!currentSubscriptionDay || currentSubscriptionDay <= 0) return 0;
  const raw = (daysGone / currentSubscriptionDay) * 100;
  return Math.min(100, Math.max(0, raw));
}

/**
 * Calculates Cost Per Attended Session
 * feesPaid / daysGone
 * Returns null if daysGone === 0
 */
export function calculateCostPerSession(feesPaid, daysGone) {
  if (!daysGone || daysGone <= 0 || !feesPaid || feesPaid <= 0) {
    return null;
  }
  return feesPaid / daysGone;
}

/**
 * Calculates Daily Subscription Value (rate per day of membership)
 * feesPaid / totalSubscriptionDays
 */
export function calculateDailySubscriptionValue(feesPaid, totalSubscriptionDays) {
  if (!totalSubscriptionDays || totalSubscriptionDays <= 0 || !feesPaid || feesPaid <= 0) {
    return 0;
  }
  return feesPaid / totalSubscriptionDays;
}

/**
 * Calculates Total Value Recovered
 * daysGone * dailySubscriptionValue
 */
export function calculateValueRecovered(feesPaid, totalSubscriptionDays, daysGone) {
  const dailyRate = calculateDailySubscriptionValue(feesPaid, totalSubscriptionDays);
  return daysGone * dailyRate;
}

/**
 * Calculates Remaining Subscription Value
 * feesPaid - recoveredValue (clamped to >= 0)
 */
export function calculateRemainingValue(feesPaid, totalSubscriptionDays, daysGone) {
  const recovered = calculateValueRecovered(feesPaid, totalSubscriptionDays, daysGone);
  return Math.max(0, (feesPaid || 0) - recovered);
}

/**
 * Calculates attendance streaks (Current streak and Best streak).
 * Only evaluates up to today (or subscription end date, whichever is earlier).
 * 
 * @param {Record<string, 'attended'|'missed'>} attendance 
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {string} today 
 * @returns {{ currentStreak: number, bestStreak: number }}
 */
export function calculateStreaks(attendance, startDate, endDate, today) {
  if (!startDate || !endDate || !today) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // If subscription hasn't started yet, streaks are 0
  if (diffInCalendarDays(today, startDate) < 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // End boundary is earlier of today or endDate
  const lastEvalDate = diffInCalendarDays(today, endDate) > 0 ? endDate : today;
  const totalDaysToEval = diffInCalendarDays(lastEvalDate, startDate) + 1;

  if (totalDaysToEval <= 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let bestStreak = 0;
  let tempStreak = 0;

  // Track each consecutive day
  for (let i = 0; i < totalDaysToEval; i++) {
    const dateStr = addCalendarDays(startDate, i);
    const status = attendance[dateStr];

    if (status === 'attended') {
      tempStreak += 1;
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    } else {
      // Missed or unmarked breaks streak
      tempStreak = 0;
    }
  }

  // Current streak: look backwards from last evaluated date
  let currentStreak = 0;
  // If today is not marked yet, we check if yesterday had an ongoing streak
  let checkOffset = 0;
  const todayStatus = attendance[today];
  if (todayStatus !== 'attended') {
    // Check yesterday
    checkOffset = 1;
  }

  for (let i = checkOffset; i < totalDaysToEval; i++) {
    const dateStr = addCalendarDays(lastEvalDate, -i);
    if (diffInCalendarDays(dateStr, startDate) < 0) break;
    
    const status = attendance[dateStr];
    if (status === 'attended') {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    bestStreak,
  };
}
