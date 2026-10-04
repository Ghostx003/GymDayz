/**
 * Export and Import utilities for Gym Dayz
 */
import { validateGymData } from '../storage/gymStorage';
import { getTodayLocalDateString, diffInCalendarDays, addCalendarDays, formatDisplayDate } from './dateUtils';

/**
 * Triggers a browser file download
 */
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports entire state as JSON backup
 * @param {object} data 
 */
export function exportDataAsJson(data) {
  const today = getTodayLocalDateString();
  const fileName = `gym-dayz-backup-${today}.json`;
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, fileName, 'application/json');
}

/**
 * Exports attendance records as CSV
 * @param {object} data 
 */
export function exportAttendanceAsCsv(data) {
  const startDate = data.subscription?.startDate;
  const endDate = data.subscription?.endDate;
  const attendance = data.attendance || {};
  const skipped = new Set(data.skippedDates || []);

  if (!startDate || !endDate) return;

  const totalDays = diffInCalendarDays(endDate, startDate) + 1;
  const rows = [['Date', 'Subscription Day', 'Status', 'Day of Week']];

  for (let i = 0; i < totalDays; i++) {
    const dateStr = addCalendarDays(startDate, i);
    const dayNumber = i + 1;
    let status = 'Unmarked';
    if (attendance[dateStr] === 'attended') {
      status = 'Attended';
    } else if (attendance[dateStr] === 'missed') {
      status = 'Missed';
    } else if (skipped.has(dateStr)) {
      status = 'Skipped';
    }

    const dayOfWeek = formatDisplayDate(dateStr, 'full').split(',')[0];
    rows.push([dateStr, `Day ${dayNumber}`, status, dayOfWeek]);
  }

  const csvContent = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
  const today = getTodayLocalDateString();
  const fileName = `gym-dayz-attendance-${today}.csv`;
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
}

/**
 * Parses and validates an uploaded JSON file
 * @param {File} file 
 * @returns {Promise<object>}
 */
export function parseAndValidateImportFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }

    if (!file.name.endsWith('.json')) {
      reject(new Error('Please upload a valid .json backup file'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        const { valid, sanitizedData, error } = validateGymData(parsed);

        if (!valid) {
          reject(new Error(`Invalid backup file: ${error}`));
          return;
        }

        resolve(sanitizedData);
      } catch {
        reject(new Error('Corrupt or malformed JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk'));
    };

    reader.readAsText(file);
  });
}
