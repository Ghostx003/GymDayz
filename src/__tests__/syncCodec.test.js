import { describe, it, expect } from 'vitest';
import { encodeSyncPayload, decodeSyncPayload } from '../sync/syncCodec';

describe('QR Sync Codec', () => {
  it('encodes and decodes state roundtrip reliably', () => {
    const original = {
      version: 1,
      profile: { name: 'Devi Night' },
      subscription: {
        feesPaid: 7500,
        startDate: '2026-08-18',
        endDate: '2026-11-15',
      },
      attendance: {
        '2026-08-18': 'attended',
        '2026-08-19': 'attended',
        '2026-08-20': 'missed',
      },
      skippedDates: ['2026-08-21'],
      metadata: {
        lastUpdatedAt: '2026-08-22T08:00:00.000Z',
        updatedBy: 'phone',
      },
    };

    const encoded = encodeSyncPayload(original);
    expect(encoded.startsWith('GYMDAYZ:v1:')).toBe(true);

    const decoded = decodeSyncPayload(encoded);
    expect(decoded.profile.name).toBe('Devi Night');
    expect(decoded.subscription.feesPaid).toBe(7500);
    expect(decoded.subscription.startDate).toBe('2026-08-18');
    expect(decoded.subscription.endDate).toBe('2026-11-15');
    expect(decoded.attendance['2026-08-18']).toBe('attended');
    expect(decoded.attendance['2026-08-19']).toBe('attended');
    expect(decoded.attendance['2026-08-20']).toBe('missed');
    expect(decoded.skippedDates).toContain('2026-08-21');
  });

  it('rejects invalid or corrupted sync strings', () => {
    expect(() => decodeSyncPayload('corrupted-random-string')).toThrow();
    expect(() => decodeSyncPayload('GYMDAYZ:v1:not-valid-base64---')).toThrow();
  });
});
