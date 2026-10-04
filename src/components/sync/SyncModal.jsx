import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Camera, Copy, Check, ShieldCheck, Zap, KeyRound } from 'lucide-react';
import Modal from '../common/Modal';
import QrScannerModal from './QrScannerModal';
import { useGym } from '../../context/GymContext';
import { encodeSyncPayload } from '../../sync/syncCodec';

export default function SyncModal({ isOpen, onClose }) {
  const { gymData, applySyncPayload, showToast, daysGone } = useGym();

  const [activeTab, setActiveTab] = useState('show'); // 'show' | 'scan' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate ultra-compact QR payload
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
      title="Instant Device Sync"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('show')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'show'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
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
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
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
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Paste Code</span>
          </button>
        </div>

        {/* Tab 1: Show QR (Ultra-low density, large chunky blocks for instant 1-2 second detection) */}
        {activeTab === 'show' && (
          <div className="flex flex-col items-center text-center space-y-3.5 pt-1">
            {/* High Contrast White QR Container with Chunky Blocks */}
            <div className="p-3 sm:p-4 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-emerald-500/40">
              {syncPayload ? (
                <QRCodeSVG
                  value={syncPayload}
                  size={240}
                  level="L" // Level L = lowest density, biggest blocks, captures in under 2 seconds!
                  includeMargin={true}
                />
              ) : (
                <div className="w-[240px] h-[240px] flex items-center justify-center text-xs text-slate-400">
                  No subscription data to sync
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                <Zap className="w-3 h-3 fill-emerald-400" />
                <span>Instant 2-Second Capture</span>
              </div>
              <p className="text-xs text-slate-300 font-semibold">
                Point your phone camera at this QR code
              </p>
              <span className="text-[11px] text-slate-500 block">
                Current sync state: <strong className="text-emerald-400">{daysGone} days gone</strong>
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw Sync Payload'}</span>
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
              Paste the short sync code from your other device:
            </p>
            <textarea
              rows={3}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste GD1:... code here"
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

        {/* Safety Rule */}
        <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Rule: <strong>Higher Days Gone wins</strong> during synchronization.</span>
        </div>
      </div>
    </Modal>
  );
}
