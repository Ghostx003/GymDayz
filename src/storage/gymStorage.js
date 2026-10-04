/**
 * Centralized Storage Service for Gym Dayz
 * Manages local persistence, schema validation, safe migration, and corrupt data recovery.
 */
import { STORAGE_KEY, APP_DATA_VERSION, createInitialData } from './defaultData';
import { isValidDateString, diffInCalendarDays } from '../utils/dateUtils';

/**
 * Validates the structure and constraints of gym dayz data
 * @param {any} data 
 * @returns {{ valid: boolean, error?: string, sanitizedData?: any }}
 */
export function validateGymData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data is not an object' };
  }

  // Check version
  const version = typeof data.version === 'number' ? data.version : APP_DATA_VERSION;

  // Validate Profile
  if (!data.profile || typeof data.profile !== 'object') {
    return { valid: false, error: 'Missing profile object' };
  }
  const name = typeof data.profile.name === 'string' ? data.profile.name.trim() : '';

  // Validate Subscription
  if (!data.subscription || typeof data.subscription !== 'object') {
    return { valid: false, error: 'Missing subscription object' };
  }
  const feesPaid = Number(data.subscription.feesPaid);
  const startDate = data.subscription.startDate;
  const endDate = data.subscription.endDate;

  if (isNaN(feesPaid) || feesPaid < 0) {
    return { valid: false, error: 'Invalid fees amount' };
  }
  if (!isValidDateString(startDate)) {
    return { valid: false, error: 'Invalid start date format' };
  }
  if (!isValidDateString(endDate)) {
    return { valid: false, error: 'Invalid end date format' };
  }
  if (diffInCalendarDays(endDate, startDate) < 0) {
    return { valid: false, error: 'End date cannot be before start date' };
  }

  // Validate Attendance Records
  const attendance = {};
  if (data.attendance && typeof data.attendance === 'object') {
    for (const [dateStr, status] of Object.entries(data.attendance)) {
      if (isValidDateString(dateStr) && (status === 'attended' || status === 'missed')) {
        // Ensure within subscription bounds
        if (diffInCalendarDays(dateStr, startDate) >= 0 && diffInCalendarDays(endDate, dateStr) >= 0) {
          attendance[dateStr] = status;
        }
      }
    }
  }

  // Validate Skipped Dates
  const skippedDates = Array.isArray(data.skippedDates)
    ? data.skippedDates.filter(d => isValidDateString(d))
    : [];

  // Metadata
  const currentDevice = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 'phone' : 'pc';
  const metadata = {
    lastUpdatedAt: data.metadata?.lastUpdatedAt || new Date().toISOString(),
    updatedBy: data.metadata?.updatedBy || currentDevice,
  };

  const sanitizedData = {
    version,
    profile: { name },
    subscription: {
      feesPaid,
      startDate,
      endDate,
    },
    attendance,
    skippedDates,
    metadata,
  };

  return { valid: true, sanitizedData };
}

/**
 * Loads data from localStorage safely.
 * Returns null if not found or if onboarding has never been completed.
 */
export function loadGymData() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error('GymDayz: Corrupt JSON in localStorage. Backing up and recovering.', parseErr);
      // Backup corrupted string for emergency recovery
      try {
        localStorage.setItem(`${STORAGE_KEY}_corrupt_backup_${Date.now()}`, raw);
      } catch {
        // ignore quota errors
      }
      return null;
    }

    const { valid, sanitizedData, error } = validateGymData(parsed);
    if (!valid) {
      console.warn('GymDayz: Data validation failed during load:', error);
      return null;
    }

    return sanitizedData;
  } catch (err) {
    console.error('GymDayz: Unexpected error loading storage:', err);
    return null;
  }
}

/**
 * Saves gym data to localStorage
 * @param {object} data 
 * @param {'phone'|'pc'} [deviceOverride]
 * @returns {boolean}
 */
export function saveGymData(data, deviceOverride) {
  if (typeof window === 'undefined') return false;

  try {
    const { valid, sanitizedData, error } = validateGymData(data);
    if (!valid) {
      console.error('GymDayz: Cannot save invalid data:', error);
      return false;
    }

    const currentDevice = deviceOverride || (typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 'phone' : 'pc');
    sanitizedData.metadata.lastUpdatedAt = new Date().toISOString();
    sanitizedData.metadata.updatedBy = currentDevice;

    const serialized = JSON.stringify(sanitizedData);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('GymDayz: Failed to save to localStorage:', err);
    return false;
  }
}

/**
 * Clears all GymDayz data from localStorage
 */
export function clearGymData() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('GymDayz: Failed to clear storage:', err);
  }
}
