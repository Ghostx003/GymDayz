/**
 * Deterministic Conflict Resolution Engine for Gym Dayz
 * Implements the core synchronization rules:
 * 1. Higher Days Gone wins.
 * 2. If Days Gone is equal, latest lastUpdatedAt wins.
 * 3. Enforces strict consistency (no future attendance, daysGone + daysMissed <= currentSubscriptionDay).
 */
import { validateGymData } from '../storage/gymStorage';
import { getCurrentSubscriptionDay, getTodayLocalDateString, diffInCalendarDays } from '../utils/dateUtils';

/**
 * Counts days gone (attended days) from attendance map
 * @param {Record<string, 'attended'|'missed'>} attendance 
 * @returns {number}
 */
export function countDaysGone(attendance) {
  if (!attendance || typeof attendance !== 'object') return 0;
  return Object.values(attendance).filter(status => status === 'attended').length;
}

/**
 * Counts days missed from attendance map
 * @param {Record<string, 'attended'|'missed'>} attendance 
 * @returns {number}
 */
export function countDaysMissed(attendance) {
  if (!attendance || typeof attendance !== 'object') return 0;
  return Object.values(attendance).filter(status => status === 'missed').length;
}

/**
 * Sanitizes and strictly enforces attendance boundary rules:
 * - No records after today
 * - No records before subscription start or after subscription end
 * - Total (attended + missed) <= currentSubscriptionDay
 * @param {object} state 
 * @returns {object} sanitized state
 */
export function sanitizeAttendanceState(state) {
  const today = getTodayLocalDateString();
  const startDate = state.subscription?.startDate;
  const endDate = state.subscription?.endDate;
  const currentSubDay = getCurrentSubscriptionDay(startDate, endDate, today);

  const cleanAttendance = {};
  const sortedDates = Object.keys(state.attendance || {})
    .sort() // chronological order
    .filter(date => {
      // Must be between start and min(today, endDate)
      if (diffInCalendarDays(date, startDate) < 0) return false;
      if (diffInCalendarDays(endDate, date) < 0) return false;
      if (diffInCalendarDays(today, date) < 0) return false; // No future attendance!
      return true;
    });

  let attendedCount = 0;
  let missedCount = 0;

  for (const date of sortedDates) {
    const status = state.attendance[date];
    if (status === 'attended' || status === 'missed') {
      if (attendedCount + missedCount < currentSubDay) {
        cleanAttendance[date] = status;
        if (status === 'attended') attendedCount++;
        else missedCount++;
      }
    }
  }

  // Filter skipped dates likewise (no future skipped dates beyond today)
  const cleanSkipped = (state.skippedDates || []).filter(date => {
    return diffInCalendarDays(date, startDate) >= 0 &&
      diffInCalendarDays(endDate, date) >= 0 &&
      diffInCalendarDays(today, date) <= 0;
  });

  return {
    ...state,
    attendance: cleanAttendance,
    skippedDates: cleanSkipped,
  };
}

/**
 * Resolves conflict between local state and incoming remote state.
 * 
 * @param {object} localState 
 * @param {object} incomingState 
 * @returns {{
 *   winner: 'local'|'incoming',
 *   winningState: object,
 *   reason: string,
 *   localDaysGone: number,
 *   incomingDaysGone: number
 * }}
 */
export function resolveSyncConflict(localState, incomingState) {
  // Validate incoming state schema
  const { valid, sanitizedData, error } = validateGymData(incomingState);
  if (!valid || !sanitizedData) {
    throw new Error(`Sync rejected: Invalid incoming data structure (${error || 'schema validation failed'})`);
  }

  // Sanitize both states strictly against current calendar reality
  const cleanIncoming = sanitizeAttendanceState(sanitizedData);
  const cleanLocal = sanitizeAttendanceState(localState);

  const localDaysGone = countDaysGone(cleanLocal.attendance);
  const incomingDaysGone = countDaysGone(cleanIncoming.attendance);

  const localTime = new Date(cleanLocal.metadata?.lastUpdatedAt || 0).getTime();
  const incomingTime = new Date(cleanIncoming.metadata?.lastUpdatedAt || 0).getTime();

  let winner = 'local';
  let reason = '';

  if (incomingDaysGone > localDaysGone) {
    winner = 'incoming';
    reason = `Remote device has higher attendance (${incomingDaysGone} vs ${localDaysGone} days gone). Remote wins.`;
  } else if (localDaysGone > incomingDaysGone) {
    winner = 'local';
    reason = `Local device has higher attendance (${localDaysGone} vs ${incomingDaysGone} days gone). Local retained.`;
  } else {
    // Tiebreaker: latest lastUpdatedAt wins
    if (incomingTime > localTime) {
      winner = 'incoming';
      reason = `Days gone tied at ${localDaysGone}. Remote has newer timestamp (${new Date(incomingTime).toLocaleTimeString()}). Remote wins.`;
    } else {
      winner = 'local';
      reason = `Days gone tied at ${localDaysGone}. Local timestamp is newer or identical. Local retained.`;
    }
  }

  const winningState = winner === 'incoming' ? cleanIncoming : cleanLocal;

  return {
    winner,
    winningState,
    reason,
    localDaysGone,
    incomingDaysGone,
  };
}
