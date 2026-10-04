import { describe, it, expect } from 'vitest';
import { resolveSyncConflict, countDaysGone, countDaysMissed, sanitizeAttendanceState } from '../sync/conflictResolver';

describe('Deterministic QR Sync Conflict Resolution', () => {
  const baseSubscription = {
    feesPaid: 7500,
    startDate: '2026-08-01',
    endDate: '2026-11-01',
  };

  it('determines winner by Higher Days Gone', () => {
    // Local device has 18 days attended
    const localAttendance = {};
    for (let i = 1; i <= 18; i++) {
      const d = String(i).padStart(2, '0');
      localAttendance[`2026-08-${d}`] = 'attended';
    }

    const localState = {
      version: 1,
      profile: { name: 'Devi' },
      subscription: baseSubscription,
      attendance: localAttendance,
      metadata: {
        lastUpdatedAt: '2026-08-20T07:00:00.000Z',
        updatedBy: 'pc',
      },
    };

    // Remote device has 38 days attended
    const remoteAttendance = {};
    for (let i = 1; i <= 31; i++) {
      const d = String(i).padStart(2, '0');
      remoteAttendance[`2026-08-${d}`] = 'attended';
    }
    for (let i = 1; i <= 7; i++) {
      const d = String(i).padStart(2, '0');
      remoteAttendance[`2026-09-${d}`] = 'attended';
    }

    const remoteState = {
      version: 1,
      profile: { name: 'Devi' },
      subscription: baseSubscription,
      attendance: remoteAttendance,
      metadata: {
        lastUpdatedAt: '2026-08-20T14:00:00.000Z',
        updatedBy: 'phone',
      },
    };

    // If local has 18 and remote has 38 -> Remote (Phone) wins!
    const res1 = resolveSyncConflict(localState, remoteState);
    expect(res1.winner).toBe('incoming');
    expect(res1.incomingDaysGone).toBe(38);
    expect(res1.localDaysGone).toBe(18);

    // If local has 38 and incoming has 18 -> Local wins!
    const res2 = resolveSyncConflict(remoteState, localState);
    expect(res2.winner).toBe('local');
    expect(res2.winningState.attendance['2026-09-07']).toBe('attended');
  });

  it('uses latest timestamp as tiebreaker when Days Gone is equal', () => {
    const attendance = {
      '2026-08-01': 'attended',
      '2026-08-02': 'attended',
    };

    const localState = {
      version: 1,
      profile: { name: 'Devi' },
      subscription: baseSubscription,
      attendance: { ...attendance },
      metadata: {
        lastUpdatedAt: '2026-08-05T10:00:00.000Z',
        updatedBy: 'pc',
      },
    };

    const incomingState = {
      version: 1,
      profile: { name: 'Devi' },
      subscription: baseSubscription,
      attendance: { ...attendance },
      metadata: {
        lastUpdatedAt: '2026-08-05T12:00:00.000Z', // newer
        updatedBy: 'phone',
      },
    };

    const res = resolveSyncConflict(localState, incomingState);
    expect(res.winner).toBe('incoming');
  });

  it('rejects malformed or invalid incoming schemas', () => {
    const localState = {
      version: 1,
      profile: { name: 'Devi' },
      subscription: baseSubscription,
      attendance: {},
      metadata: { lastUpdatedAt: new Date().toISOString() },
    };

    expect(() => resolveSyncConflict(localState, null)).toThrow();
    expect(() => resolveSyncConflict(localState, { invalid: true })).toThrow();
  });
});
