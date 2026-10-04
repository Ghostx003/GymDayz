/**
 * Default empty data model schema for Gym Dayz
 */
export const APP_DATA_VERSION = 1;
export const STORAGE_KEY = 'gym_dayz_data_v1';
export const ONBOARDING_COMPLETED_KEY = 'gym_dayz_onboarding_completed';

/**
 * Creates an empty initial state
 */
export function createInitialData() {
  return {
    version: APP_DATA_VERSION,
    profile: {
      name: '',
    },
    subscription: {
      feesPaid: 0,
      startDate: '',
      endDate: '',
    },
    attendance: {},
    skippedDates: [],
    metadata: {
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 'phone' : 'pc',
    },
  };
}
