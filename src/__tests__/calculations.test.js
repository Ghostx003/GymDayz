import { describe, it, expect } from 'vitest';
import {
  calculateSubscriptionCompletion,
  calculateAttendancePercentage,
  calculateCostPerSession,
  calculateDailySubscriptionValue,
  calculateValueRecovered,
  calculateRemainingValue,
  calculateStreaks,
} from '../utils/calculations';

describe('Financial & Attendance Calculations', () => {
  it('calculates clamped subscription completion percentage', () => {
    // 72 of 100 days = 72%
    expect(calculateSubscriptionCompletion(72, 100)).toBe(72);
    // Day 0 = 0%
    expect(calculateSubscriptionCompletion(0, 100)).toBe(0);
    // Exceeding = clamped to 100%
    expect(calculateSubscriptionCompletion(120, 100)).toBe(100);
  });

  it('calculates attendance percentage based on elapsed days', () => {
    // 37 gone on Day 40 = 92.5%
    expect(calculateAttendancePercentage(37, 40)).toBe(92.5);
    // Day 0 = 0%
    expect(calculateAttendancePercentage(0, 0)).toBe(0);
    // 40 of 40 = 100%
    expect(calculateAttendancePercentage(40, 40)).toBe(100);
  });

  it('calculates cost per session safely with zero handling', () => {
    // ₹7,500 with 37 days gone = 202.7027...
    const cost = calculateCostPerSession(7500, 37);
    expect(cost).toBeCloseTo(202.70, 1);

    // daysGone = 0 -> returns null (never divide by zero)
    expect(calculateCostPerSession(7500, 0)).toBeNull();
  });

  it('calculates value recovered and remaining value accurately', () => {
    const fees = 7500;
    const totalDays = 100;
    const daysGone = 40;

    // Daily rate = 7500 / 100 = 75
    expect(calculateDailySubscriptionValue(fees, totalDays)).toBe(75);

    // Recovered = 40 * 75 = 3000
    expect(calculateValueRecovered(fees, totalDays, daysGone)).toBe(3000);

    // Remaining = 7500 - 3000 = 4500
    expect(calculateRemainingValue(fees, totalDays, daysGone)).toBe(4500);
  });

  it('calculates streaks correctly', () => {
    const startDate = '2026-08-01';
    const endDate = '2026-08-10';
    const today = '2026-08-06';

    const attendance = {
      '2026-08-01': 'attended',
      '2026-08-02': 'attended',
      '2026-08-03': 'attended', // Streak of 3
      '2026-08-04': 'missed',   // Breaks streak
      '2026-08-05': 'attended',
      '2026-08-06': 'attended', // Current streak of 2
    };

    const streaks = calculateStreaks(attendance, startDate, endDate, today);
    expect(streaks.bestStreak).toBe(3);
    expect(streaks.currentStreak).toBe(2);
  });
});
