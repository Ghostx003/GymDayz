/**
 * Robust Local Calendar Date Utilities for Gym Dayz
 * Operates purely on YYYY-MM-DD calendar dates.
 * Zero timezone shift issues, leap year safe, DST resilient.
 */

/**
 * Parses a YYYY-MM-DD string into a local Date object set to local midnight.
 * @param {string} dateStr 
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Formats a Date object or YYYY-MM-DD string to standard YYYY-MM-DD
 * @param {Date|string} date 
 * @returns {string} YYYY-MM-DD
 */
export function formatLocalDate(date) {
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, normalize and return
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's local date as YYYY-MM-DD
 * @returns {string}
 */
export function getTodayLocalDateString() {
  return formatLocalDate(new Date());
}

/**
 * Calculates calendar day difference between d2 and d1 (d2 - d1).
 * Uses UTC projection to avoid any DST / timezone shift anomalies.
 * @param {string} d2Str YYYY-MM-DD
 * @param {string} d1Str YYYY-MM-DD
 * @returns {number}
 */
export function diffInCalendarDays(d2Str, d1Str) {
  const d1 = parseLocalDate(d1Str);
  const d2 = parseLocalDate(d2Str);
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Total subscription days (inclusive).
 * If start == end, total days = 1.
 * @param {string} startDateStr 
 * @param {string} endDateStr 
 * @returns {number}
 */
export function getTotalSubscriptionDays(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const diff = diffInCalendarDays(endDateStr, startDateStr);
  return Math.max(0, diff + 1);
}

/**
 * Current subscription day (1-indexed inclusive).
 * - Before start: 0
 * - During: 1 .. totalDays
 * - After end: totalDays (Subscription Completed)
 * @param {string} startDateStr 
 * @param {string} endDateStr 
 * @param {string} [todayStr] 
 * @returns {number}
 */
export function getCurrentSubscriptionDay(startDateStr, endDateStr, todayStr = getTodayLocalDateString()) {
  if (!startDateStr || !endDateStr) return 0;
  const total = getTotalSubscriptionDays(startDateStr, endDateStr);
  if (total <= 0) return 0;

  const diffFromStart = diffInCalendarDays(todayStr, startDateStr);
  if (diffFromStart < 0) {
    return 0; // Subscription hasn't started yet
  }

  const currentDay = diffFromStart + 1;
  return Math.min(currentDay, total);
}

/**
 * Remaining subscription days.
 * Never negative.
 * @param {string} startDateStr 
 * @param {string} endDateStr 
 * @param {string} [todayStr] 
 * @returns {number}
 */
export function getRemainingDays(startDateStr, endDateStr, todayStr = getTodayLocalDateString()) {
  const total = getTotalSubscriptionDays(startDateStr, endDateStr);
  const current = getCurrentSubscriptionDay(startDateStr, endDateStr, todayStr);
  return Math.max(0, total - current);
}

/**
 * Checks if subscription has started
 * @param {string} startDateStr 
 * @param {string} [todayStr] 
 * @returns {boolean}
 */
export function isSubscriptionStarted(startDateStr, todayStr = getTodayLocalDateString()) {
  if (!startDateStr) return false;
  return diffInCalendarDays(todayStr, startDateStr) >= 0;
}

/**
 * Checks if subscription is completed
 * @param {string} endDateStr 
 * @param {string} [todayStr] 
 * @returns {boolean}
 */
export function isSubscriptionCompleted(endDateStr, todayStr = getTodayLocalDateString()) {
  if (!endDateStr) return false;
  return diffInCalendarDays(todayStr, endDateStr) > 0;
}

/**
 * Formats a YYYY-MM-DD date into friendly readable text.
 * E.g. "18 Aug 2026" or "Tuesday, 18 Aug"
 * @param {string} dateStr 
 * @param {'short'|'medium'|'full'|'monthYear'} [format]
 * @returns {string}
 */
export function formatDisplayDate(dateStr, format = 'medium') {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  
  if (format === 'monthYear') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
  if (format === 'full') {
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  }
  // Default 'medium'
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Adds N calendar days to a YYYY-MM-DD date string.
 * @param {string} dateStr 
 * @param {number} days 
 * @returns {string} YYYY-MM-DD
 */
export function addCalendarDays(dateStr, days) {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

/**
 * Checks if a date is within [startDate, endDate] inclusive
 * @param {string} targetDate 
 * @param {string} startDate 
 * @param {string} endDate 
 * @returns {boolean}
 */
export function isDateWithinRange(targetDate, startDate, endDate) {
  return diffInCalendarDays(targetDate, startDate) >= 0 && diffInCalendarDays(endDate, targetDate) >= 0;
}

/**
 * Validates whether string is a valid YYYY-MM-DD date
 * @param {string} str 
 * @returns {boolean}
 */
export function isValidDateString(str) {
  if (!str || typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return false;
  }
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Month navigation helpers for calendar
 */
export function getPreviousMonth(year, month) {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function getNextMonth(year, month) {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}
