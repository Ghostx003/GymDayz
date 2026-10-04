import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Camera, Copy, Check, ShieldCheck, ArrowRightLeft, Sparkles, KeyRound } from 'lucide-react';
import Modal from '../common/Modal';
import QrScannerModal from './QrScannerModal';
import { useGym } from '../../context/GymContext';
import { encodeSyncPayload } from '../../sync/syncCodec';

export default function SyncModal({ isOpen, onClose }) {
  const { gymData, applySyncPayload, showToast, daysGone } = useGym();

  const [activeTab, setActiveTab] = useState('show'); // 'show' | 'scan' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate QR payload
  const syncPayload = useMemo(() => {
    if (!gymData) return '';
    try {
      return encodeSyncPayload(gymData);
    } catch {
      return '';
    }
  }, [gymData]);

  const handleCopyCode = async () => {
    if (!syncPayload) return;
    try {
      await navigator.clipboard.writeText(syncPayload);
      setCopied(true);
      showToast('Sync code copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleScanSuccess = (decodedText) => {
    const res = applySyncPayload(decodedText);
    if (res.success) {
      onClose();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const res = applySyncPayload(manualCode.trim());
    if (res.success) {
      setManualCode('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sync Between Phone & PC"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {/* Tab Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('show')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'show'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Show QR</span>
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'scan'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Paste Code</span>
          </button>
        </div>

        {/* Tab 1: Show QR */}
        {activeTab === 'show' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              {syncPayload ? (
                <QRCodeSVG
                  value={syncPayload}
                  size={210}
                  level="M"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[210px] h-[210px] flex items-center justify-center text-xs text-slate-400">
                  No subscription data to sync
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-300 font-semibold">
                Open Gym Dayz on your other device and choose "Scan Camera"
              </p>
              <span className="text-[11px] text-slate-500 block mt-1">
                Your current attendance: <strong className="text-emerald-400">{daysGone} days gone</strong>
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'Copied Code to Clipboard!' : 'Copy Raw Sync Payload'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Scan Camera */}
        {activeTab === 'scan' && (
          <div>
            <QrScannerModal onScanSuccess={handleScanSuccess} />
          </div>
        )}

        {/* Tab 3: Manual Code Paste */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <p className="text-xs text-slate-400">
              Paste the synchronization string or backup JSON from your other device:
            </p>
            <textarea
              rows={4}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste GYMDAYZ:v1:... code here"
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              Apply Sync Payload
            </button>
          </form>
        )}

        {/* Conflict Resolution Safety Notice */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Deterministic Conflict Resolution</span>
          </div>
          <p className="leading-relaxed">
            Rule 1: <strong>Higher Days Gone wins</strong>. If both devices have identical attendance counts, the newer timestamp is used as tiebreaker.
          </p>
        </div>
      </div>
    </Modal>
  );
}
