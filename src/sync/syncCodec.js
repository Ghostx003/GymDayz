/**
 * Compact Sync Payload Codec for Gym Dayz
 * Serializes and deserializes application state to fit efficiently into QR codes.
 */

const SYNC_HEADER = 'GYMDAYZ:v1:';

/**
 * Encodes gym data into a compact QR sync string
 * @param {object} data 
 * @returns {string}
 */
export function encodeSyncPayload(data) {
  try {
    // Compress attendance into compact mapping: 1 for attended, 0 for missed
    const compactAttendance = {};
    if (data.attendance) {
      for (const [date, status] of Object.entries(data.attendance)) {
        compactAttendance[date] = status === 'attended' ? 1 : 0;
      }
    }

    const payload = {
      p: data.profile?.name || '',
      f: data.subscription?.feesPaid || 0,
      s: data.subscription?.startDate || '',
      e: data.subscription?.endDate || '',
      a: compactAttendance,
      k: data.skippedDates || [],
      t: data.metadata?.lastUpdatedAt || new Date().toISOString(),
      d: data.metadata?.updatedBy || 'pc',
    };

    const jsonStr = JSON.stringify(payload);
    // Encode to base64 for safe string representation
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return `${SYNC_HEADER}${base64}`;
  } catch (err) {
    console.error('Failed to encode sync payload:', err);
    throw new Error('Could not generate sync payload');
  }
}

/**
 * Decodes and validates a QR sync string into full Gym Dayz state
 * @param {string} syncString 
 * @returns {object}
 */
export function decodeSyncPayload(syncString) {
  if (!syncString || typeof syncString !== 'string') {
    throw new Error('Invalid sync data: empty payload');
  }

  let jsonStr = '';
  if (syncString.startsWith(SYNC_HEADER)) {
    const rawBase64 = syncString.slice(SYNC_HEADER.length);
    try {
      jsonStr = decodeURIComponent(escape(atob(rawBase64)));
    } catch {
      throw new Error('Invalid QR code format: corrupt base64');
    }
  } else {
    // Check if direct JSON string (for manual copy/paste fallback)
    try {
      JSON.parse(syncString);
      jsonStr = syncString;
    } catch {
      throw new Error('Invalid sync code format. Must start with GYMDAYZ:');
    }
  }

  let payload;
  try {
    payload = JSON.parse(jsonStr);
  } catch {
    throw new Error('Invalid sync data: malformed JSON content');
  }

  // Support both full JSON and compressed format
  const isCompressed = 'p' in payload || 's' in payload;

  const name = isCompressed ? payload.p : payload.profile?.name;
  const feesPaid = Number(isCompressed ? payload.f : payload.subscription?.feesPaid);
  const startDate = isCompressed ? payload.s : payload.subscription?.startDate;
  const endDate = isCompressed ? payload.e : payload.subscription?.endDate;
  const skippedDates = (isCompressed ? payload.k : payload.skippedDates) || [];
  const lastUpdatedAt = isCompressed ? payload.t : payload.metadata?.lastUpdatedAt;
  const updatedBy = isCompressed ? payload.d : payload.metadata?.updatedBy;

  // Reconstitute attendance
  const rawAttendance = isCompressed ? payload.a : payload.attendance;
  const attendance = {};
  if (rawAttendance && typeof rawAttendance === 'object') {
    for (const [date, val] of Object.entries(rawAttendance)) {
      if (val === 1 || val === 'attended') {
        attendance[date] = 'attended';
      } else if (val === 0 || val === 'missed') {
        attendance[date] = 'missed';
      }
    }
  }

  return {
    version: 1,
    profile: { name: name || 'User' },
    subscription: {
      feesPaid: Math.max(0, feesPaid || 0),
      startDate: startDate || '',
      endDate: endDate || '',
    },
    attendance,
    skippedDates: Array.isArray(skippedDates) ? skippedDates : [],
    metadata: {
      lastUpdatedAt: lastUpdatedAt || new Date().toISOString(),
      updatedBy: updatedBy || 'device',
    },
  };
}
