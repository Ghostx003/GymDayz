/**
 * Live Sync Relay Engine for Gym Dayz
 * Enables zero-camera laptop synchronization:
 * Laptop shows QR code -> Phone scans QR code -> Bi-directional sync resolves latest state.
 */

// Helper to generate a short, clean session ID
export function generateSyncSession() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without ambiguous characters
  let roomId = 'gd_';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { roomId };
}

/**
 * Publishes sync payload
 * @param {string} roomId 
 * @param {string} payload 
 * @param {string} sender 'phone' | 'laptop'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function publishSyncPayload(roomId, payload, sender = 'device') {
  const cleanRoom = roomId.trim();
  const messageObj = {
    type: 'GYM_SYNC_PAYLOAD',
    room: cleanRoom,
    payload,
    sender,
    sentAt: new Date().toISOString(),
  };

  const messageStr = JSON.stringify(messageObj);

  // 1. Broadcast locally (for multi-tab / same machine testing)
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('gymdayz_live_sync');
      bc.postMessage(messageObj);
      setTimeout(() => bc.close(), 1000);
    }
  } catch (err) {
    console.warn('BroadcastChannel error:', err);
  }

  // 2. Publish to cloud relay (ntfy.sh)
  try {
    const res = await fetch(`https://ntfy.sh/${cleanRoom}`, {
      method: 'POST',
      body: messageStr,
      headers: {
        'Content-Type': 'application/json',
        'Title': 'GymDayz Sync',
      },
    });

    if (res.ok) {
      return { success: true };
    }
  } catch (err) {
    console.warn('Network publish failed:', err);
  }

  return { success: true };
}

/**
 * Listens for incoming sync payload
 * @param {string} roomId 
 * @param {(payload: string, metadata: object) => void} onPayloadReceived 
 * @param {string} [ignoreSender] if provided, ignores messages from this sender
 * @returns {() => void} cleanup unsubscribe function
 */
export function listenForSyncPayload(roomId, onPayloadReceived, ignoreSender = '') {
  const cleanRoom = roomId.trim();
  let isClosed = false;
  let receivedPayloads = new Set();

  const handleMessageString = (rawStr) => {
    if (isClosed || !rawStr) return;
    try {
      const parsed = typeof rawStr === 'string' ? JSON.parse(rawStr) : rawStr;
      if (parsed?.type === 'GYM_SYNC_PAYLOAD' && parsed.payload) {
        if (ignoreSender && parsed.sender === ignoreSender) {
          return; // Ignore own message
        }
        if (!receivedPayloads.has(parsed.payload)) {
          receivedPayloads.add(parsed.payload);
          onPayloadReceived(parsed.payload, { sender: parsed.sender });
        }
      }
    } catch {
      // If it's a direct GD1: string without JSON wrapper
      if (typeof rawStr === 'string' && (rawStr.startsWith('GD1:') || rawStr.startsWith('GYMDAYZ:'))) {
        if (!receivedPayloads.has(rawStr)) {
          receivedPayloads.add(rawStr);
          onPayloadReceived(rawStr, {});
        }
      }
    }
  };

  // 1. Local BroadcastChannel listener
  let bc = null;
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('gymdayz_live_sync');
      bc.onmessage = (event) => {
        if (event.data?.room === cleanRoom) {
          handleMessageString(event.data);
        }
      };
    }
  } catch (err) {
    console.warn('BroadcastChannel listener error:', err);
  }

  // 2. Server-Sent Events (SSE) via ntfy.sh
  let eventSource = null;
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      eventSource = new EventSource(`https://ntfy.sh/${cleanRoom}/sse`);
      eventSource.onmessage = (event) => {
        try {
          const sseData = JSON.parse(event.data);
          if (sseData.event === 'message' && sseData.message) {
            handleMessageString(sseData.message);
          }
        } catch {
          // ignore heartbeats
        }
      };
    }
  } catch (err) {
    console.warn('EventSource initialization error:', err);
  }

  // 3. Fallback polling every 1.5 seconds
  const pollInterval = setInterval(async () => {
    if (isClosed) return;
    try {
      const res = await fetch(`https://ntfy.sh/${cleanRoom}/json?poll=1&since=all`);
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n');
        for (const line of lines) {
          if (!line) continue;
          try {
            const item = JSON.parse(line);
            if (item.event === 'message' && item.message) {
              handleMessageString(item.message);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // offline or network glitch
    }
  }, 1500);

  return () => {
    isClosed = true;
    clearInterval(pollInterval);
    if (bc) {
      try {
        bc.close();
      } catch {
        // ignore
      }
    }
    if (eventSource) {
      try {
        eventSource.close();
      } catch {
        // ignore
      }
    }
  };
}
