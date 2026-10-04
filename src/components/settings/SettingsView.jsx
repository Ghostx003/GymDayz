import React, { useState, useRef } from 'react';
import {
  User,
  IndianRupee,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  QrCode,
  Info,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import Modal from '../common/Modal';
import { exportDataAsJson, exportAttendanceAsCsv, parseAndValidateImportFile } from '../../utils/exportImport';
import { diffInCalendarDays, isValidDateString } from '../../utils/dateUtils';

export default function SettingsView({ onOpenSync }) {
  const {
    gymData,
    profile,
    subscription,
    updateSubscriptionSettings,
    importBackupData,
    resetAllData,
    showToast,
  } = useGym();

  // Edit Subscription State
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [name, setName] = useState(profile.name || '');
  const [feesPaid, setFeesPaid] = useState(subscription.feesPaid || '');
  const [startDate, setStartDate] = useState(subscription.startDate || '');
  const [endDate, setEndDate] = useState(subscription.endDate || '');
  const [editError, setEditError] = useState('');

  // Reset Confirmation Modal State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // File input ref for import
  const fileInputRef = useRef(null);

  const handleOpenEdit = () => {
    setName(profile.name || '');
    setFeesPaid(subscription.feesPaid || '');
    setStartDate(subscription.startDate || '');
    setEndDate(subscription.endDate || '');
    setEditError('');
    setIsEditingSub(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setEditError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setEditError('Name cannot be empty.');
      return;
    }

    const numFees = Number(feesPaid);
    if (isNaN(numFees) || numFees <= 0) {
      setEditError('Fees paid must be greater than 0.');
      return;
    }

    if (!isValidDateString(startDate)) {
      setEditError('Please select a valid start date.');
      return;
    }

    if (!isValidDateString(endDate)) {
      setEditError('Please select a valid end date.');
      return;
    }

    if (diffInCalendarDays(endDate, startDate) < 0) {
      setEditError('End date cannot be earlier than start date.');
      return;
    }

    updateSubscriptionSettings({
      name: trimmedName,
      feesPaid: numFees,
      startDate,
      endDate,
    });
    setIsEditingSub(false);
  };

  const handleExportJson = () => {
    if (!gymData) return;
    exportDataAsJson(gymData);
    showToast('JSON backup exported successfully!');
  };

  const handleExportCsv = () => {
    if (!gymData) return;
    exportAttendanceAsCsv(gymData);
    showToast('Attendance CSV exported successfully!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const sanitized = await parseAndValidateImportFile(file);
      importBackupData(sanitized);
    } catch (err) {
      showToast(err.message || 'Import failed. Malformed backup file.', 'error');
    } finally {
      // Clear file input so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Settings Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Settings</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your membership details, backups, device sync, and preferences.
        </p>
      </div>

      {/* Subscription & Profile Summary Card */}
      <div className="bg-[#111726]/90 border border-slate-800/80 rounded-3xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Active Subscription
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              {profile.name}
            </h3>
            <span className="text-xs text-slate-400">
              ₹{subscription.feesPaid.toLocaleString('en-IN')} paid • {subscription.startDate} to {subscription.endDate}
            </span>
          </div>

          <button
            onClick={handleOpenEdit}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
          >
            Edit Subscription
          </button>
        </div>

        {/* Sync cross-link */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Synchronize with another phone or desktop PC</span>
          </div>
          <button
            onClick={onOpenSync}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Open Sync &rarr;
          </button>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-[#111726]/90 border border-slate-800/80 rounded-3xl p-6 shadow-card space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            Data Backup & Restore
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Export a full JSON backup to save locally, or export your attendance history as a spreadsheet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Export JSON Backup</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Attendance CSV</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={handleImportClick}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Import / Restore JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#111726]/90 border border-rose-900/40 rounded-3xl p-6 shadow-card space-y-3">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-base font-bold text-white tracking-tight">Danger Zone</h3>
        </div>
        <p className="text-xs text-slate-400">
          Resetting will clear all stored attendance records and subscription details from this browser.
        </p>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold text-xs sm:text-sm transition-colors"
        >
          Reset All Application Data
        </button>
      </div>

      {/* About Gym Dayz */}
      <div className="bg-[#111726]/60 border border-slate-800/60 rounded-3xl p-6 text-center space-y-2">
        <h4 className="text-sm font-bold text-white tracking-tight">About Gym Dayz</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Gym Dayz is a client-first, private gym subscription and attendance tracker built with modern React. Your data stays entirely in your browser's local storage and syncs securely peer-to-peer via QR codes.
        </p>
        <div className="text-[11px] text-slate-500 pt-2">
          Version 1.0.0 • Production Ready
        </div>
      </div>

      {/* Edit Subscription Modal */}
      <Modal
        isOpen={isEditingSub}
        onClose={() => setIsEditingSub(false)}
        title="Edit Gym Subscription"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Fees Paid (₹)
            </label>
            <input
              type="number"
              min="1"
              value={feesPaid}
              onChange={(e) => setFeesPaid(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditingSub(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Confirm Data Reset"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to permanently reset Gym Dayz? All your recorded attendance history, skipped days, and subscription settings will be wiped.
          </p>
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
            Tip: You can export a JSON backup first if you want to save your progress!
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsResetConfirmOpen(false);
                resetAllData();
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Yes, Reset Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
