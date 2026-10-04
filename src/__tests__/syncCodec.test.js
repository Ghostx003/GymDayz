import { describe, it, expect } from 'vitest';
import { encodeSyncPayload, decodeSyncPayload } from '../sync/syncCodec';

describe('QR Sync Codec', () => {
  it('encodes and decodes state roundtrip reliably with ultra-compact payload', () => {
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
      skippedDates: [],
      metadata: {
        lastUpdatedAt: '2026-08-22T08:00:00.000Z',
        updatedBy: 'phone',
      },
    };

    const encoded = encodeSyncPayload(original);
    expect(encoded.startsWith('GD1:')).toBe(true);
    // Payload should be small and lightweight (< 200 chars) for instant QR capture
    expect(encoded.length).toBeLessThan(200);

    const decoded = decodeSyncPayload(encoded);
    expect(decoded.profile.name).toBe('Devi Night');
    expect(decoded.subscription.feesPaid).toBe(7500);
    expect(decoded.subscription.startDate).toBe('2026-08-18');
    expect(decoded.subscription.endDate).toBe('2026-11-15');
    expect(decoded.attendance['2026-08-18']).toBe('attended');
    expect(decoded.attendance['2026-08-19']).toBe('attended');
    expect(decoded.attendance['2026-08-20']).toBe('missed');
  });

  it('maintains backward compatibility with legacy GYMDAYZ:v1: format', () => {
    const legacyJson = JSON.stringify({
      p: 'Legacy Athlete',
      f: 5000,
      s: '2026-09-01',
      e: '2026-10-01',
      a: { '2026-09-01': 1, '2026-09-02': 0 },
    });
    const legacyPayload = `GYMDAYZ:v1:${btoa(legacyJson)}`;
    const decoded = decodeSyncPayload(legacyPayload);

    expect(decoded.profile.name).toBe('Legacy Athlete');
    expect(decoded.subscription.feesPaid).toBe(5000);
    expect(decoded.attendance['2026-09-01']).toBe('attended');
    expect(decoded.attendance['2026-09-02']).toBe('missed');
  });

  it('rejects invalid or corrupted sync strings', () => {
    expect(() => decodeSyncPayload('corrupted-random-string')).toThrow();
    expect(() => decodeSyncPayload('GD1:not-valid-base64---')).toThrow();
  });
});
