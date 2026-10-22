import { describe, it, expect } from 'vitest';
import { generateSyncSession } from '../sync/liveSyncRelay';

describe('Live Sync Relay', () => {
  it('generates unique valid session ID', () => {
    const s1 = generateSyncSession();
    const s2 = generateSyncSession();

    expect(s1.roomId).toMatch(/^gd_[2-9A-HJ-NP-Z]{6}$/);
    expect(s1.roomId).not.toBe(s2.roomId);
  });
});
