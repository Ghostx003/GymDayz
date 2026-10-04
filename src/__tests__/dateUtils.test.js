import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  formatLocalDate,
  diffInCalendarDays,
  getTotalSubscriptionDays,
  getCurrentSubscriptionDay,
  getRemainingDays,
  isSubscriptionStarted,
  isSubscriptionCompleted,
  addCalendarDays,
  isDateWithinRange,
} from '../utils/dateUtils';

describe('Date Utilities (Local Calendar Rules)', () => {
  it('correctly calculates inclusive total days', () => {
    // Single day
    expect(getTotalSubscriptionDays('2026-08-18', '2026-08-18')).toBe(1);
    // Aug 18 to Aug 20 (18, 19, 20) -> 3 days
    expect(getTotalSubscriptionDays('2026-08-18', '2026-08-20')).toBe(3);
    // Aug 18 to Nov 15:
    // Aug: 31 - 18 + 1 = 14 days
    // Sep: 30 days
    // Oct: 31 days
    // Nov: 15 days
    // Total = 14 + 30 + 31 + 15 = 90 days
    expect(getTotalSubscriptionDays('2026-08-18', '2026-11-15')).toBe(90);
  });

  it('correctly calculates current subscription day (1-indexed inclusive)', () => {
    const start = '2026-08-18';
    const end = '2026-11-15';

    // August 18 must be Day 1
    expect(getCurrentSubscriptionDay(start, end, '2026-08-18')).toBe(1);
    // August 19 must be Day 2
    expect(getCurrentSubscriptionDay(start, end, '2026-08-19')).toBe(2);
    // August 20 must be Day 3
    expect(getCurrentSubscriptionDay(start, end, '2026-08-20')).toBe(3);

    // Before start: Day 0
    expect(getCurrentSubscriptionDay(start, end, '2026-08-17')).toBe(0);
    expect(getCurrentSubscriptionDay(start, end, '2026-01-01')).toBe(0);

    // End date: Day 90
    expect(getCurrentSubscriptionDay(start, end, '2026-11-15')).toBe(90);

    // After end: Day 90 (clamped to total days)
    expect(getCurrentSubscriptionDay(start, end, '2026-11-16')).toBe(90);
    expect(getCurrentSubscriptionDay(start, end, '2027-01-01')).toBe(90);
  });

  it('correctly calculates remaining days (never negative)', () => {
    const start = '2026-08-18';
    const end = '2026-11-15'; // 90 total days

    // On Day 1: 90 - 1 = 89 remaining
    expect(getRemainingDays(start, end, '2026-08-18')).toBe(89);

    // On Day 90: 0 remaining
    expect(getRemainingDays(start, end, '2026-11-15')).toBe(0);

    // After completion: 0 remaining (never negative)
    expect(getRemainingDays(start, end, '2026-11-16')).toBe(0);
    expect(getRemainingDays(start, end, '2027-01-01')).toBe(0);
  });

  it('correctly determines started and completed states', () => {
    const start = '2026-08-18';
    const end = '2026-11-15';

    expect(isSubscriptionStarted(start, '2026-08-17')).toBe(false);
    expect(isSubscriptionStarted(start, '2026-08-18')).toBe(true);
    expect(isSubscriptionStarted(start, '2026-08-19')).toBe(true);

    expect(isSubscriptionCompleted(end, '2026-11-14')).toBe(false);
    expect(isSubscriptionCompleted(end, '2026-11-15')).toBe(false); // Last day is still active
    expect(isSubscriptionCompleted(end, '2026-11-16')).toBe(true);  // Day after end date
  });

  it('handles leap years correctly', () => {
    // 2028 is a leap year (Feb has 29 days)
    expect(diffInCalendarDays('2028-03-01', '2028-02-28')).toBe(2);
    expect(getTotalSubscriptionDays('2028-02-01', '2028-02-29')).toBe(29);
  });

  it('handles year boundary transitions seamlessly', () => {
    expect(diffInCalendarDays('2027-01-01', '2026-12-31')).toBe(1);
    expect(getTotalSubscriptionDays('2026-12-25', '2027-01-05')).toBe(12);
  });
});
