/**
 * Ultra-Compact Sync Payload Codec for Gym Dayz
 * Optimizes payload size so QR codes have huge, chunky blocks
 * that any phone camera can scan in under 1-2 seconds.
 */
import { diffInCalendarDays, addCalendarDays } from '../utils/dateUtils';

const SYNC_PREFIX = 'GD1:'; // Ultra-short magic header

/**
 * Encodes gym data into an ultra-compact string for instant QR scanning
 * @param {object} data 
 * @returns {string}
 */
export function encodeSyncPayload(data) {
  try {
    const startDate = data.subscription?.startDate || '';
    const endDate = data.subscription?.endDate || '';
    const attendance = data.attendance || {};

    // Generate ultra-short sequence for attendance:
    // '1' = attended, '0' = missed, '.' = unmarked
    let seq = '';
    if (startDate && endDate) {
      const total = Math.min(1000, diffInCalendarDays(endDate, startDate) + 1);
      for (let i = 0; i < total; i++) {
        const d = addCalendarDays(startDate, i);
        const status = attendance[d];
        if (status === 'attended') {
          seq += '1';
        } else if (status === 'missed') {
          seq += '0';
        } else {
          seq += '.';
        }
      }
      // Trim trailing unmarked days
      seq = seq.replace(/\.+$/, '');
    }

    // Ultra-compact JSON object with single-letter keys
    const compact = {
      p: data.profile?.name || '',
      f: data.subscription?.feesPaid || 0,
      s: startDate,
      e: endDate,
      b: seq, // bitstring: '1' = attended, '0' = missed
      t: data.metadata?.lastUpdatedAt ? new Date(data.metadata.lastUpdatedAt).getTime() : Date.now(),
    };

    const jsonStr = JSON.stringify(compact);
    // Base64 encoding
    const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return `${SYNC_PREFIX}${b64}`;
  } catch (err) {
    console.error('Failed to encode sync payload:', err);
    throw new Error('Could not generate sync payload');
  }
}

/**
 * Decodes sync string (supports both ultra-compact GD1: and legacy GYMDAYZ: formats)
 * @param {string} syncString 
 * @returns {object}
 */
export function decodeSyncPayload(syncString) {
  if (!syncString || typeof syncString !== 'string') {
    throw new Error('Invalid sync data: empty payload');
  }

  let jsonStr = '';
  if (syncString.startsWith(SYNC_PREFIX)) {
    const raw = syncString.slice(SYNC_PREFIX.length);
    try {
      jsonStr = decodeURIComponent(escape(atob(raw)));
    } catch {
      throw new Error('Invalid QR code format: corrupt base64');
    }
  } else if (syncString.startsWith('GYMDAYZ:v1:')) {
    const raw = syncString.slice('GYMDAYZ:v1:'.length);
    try {
      jsonStr = decodeURIComponent(escape(atob(raw)));
    } catch {
      throw new Error('Invalid QR code format: corrupt base64');
    }
  } else {
    // Try raw JSON for manual copy-paste
    try {
      JSON.parse(syncString);
      jsonStr = syncString;
    } catch {
      throw new Error('Invalid sync code format');
    }
  }

  let payload;
  try {
    payload = JSON.parse(jsonStr);
  } catch {
    throw new Error('Invalid sync data: malformed JSON content');
  }

  const name = payload.p || payload.profile?.name || 'Athlete';
  const feesPaid = Number(payload.f ?? payload.subscription?.feesPaid ?? 0);
  const startDate = payload.s || payload.subscription?.startDate || '';
  const endDate = payload.e || payload.subscription?.endDate || '';
  const lastUpdatedAt = typeof payload.t === 'number'
    ? new Date(payload.t).toISOString()
    : payload.t || payload.metadata?.lastUpdatedAt || new Date().toISOString();

  const attendance = {};

  // If ultra-compact bitstring format 'b' was used
  if (typeof payload.b === 'string' && startDate) {
    for (let i = 0; i < payload.b.length; i++) {
      const char = payload.b[i];
      const d = addCalendarDays(startDate, i);
      if (char === '1') {
        attendance[d] = 'attended';
      } else if (char === '0') {
        attendance[d] = 'missed';
      }
    }
  } else if (payload.a && typeof payload.a === 'object') {
    // Legacy dictionary format
    for (const [date, val] of Object.entries(payload.a)) {
      if (val === 1 || val === 'attended') {
        attendance[date] = 'attended';
      } else if (val === 0 || val === 'missed') {
        attendance[date] = 'missed';
      }
    }
  } else if (payload.attendance && typeof payload.attendance === 'object') {
    Object.assign(attendance, payload.attendance);
  }

  return {
    version: 1,
    profile: { name },
    subscription: {
      feesPaid: Math.max(0, feesPaid),
      startDate,
      endDate,
    },
    attendance,
    skippedDates: [],
    metadata: {
      lastUpdatedAt,
      updatedBy: payload.d || 'sync',
    },
  };
}
