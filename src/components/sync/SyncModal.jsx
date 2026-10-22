import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Camera, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap, 
  KeyRound, 
  Laptop, 
  Smartphone, 
  Radio, 
  CheckCircle2, 
  Send
} from 'lucide-react';
import Modal from '../common/Modal';
import QrScannerModal from './QrScannerModal';
import { useGym } from '../../context/GymContext';
import { encodeSyncPayload } from '../../sync/syncCodec';
import { generateSyncSession, listenForSyncPayload, publishSyncPayload } from '../../sync/liveSyncRelay';
import { fireWorkoutConfetti } from '../../utils/confetti';

export default function SyncModal({ isOpen, onClose }) {
  const { gymData, applySyncPayload, showToast, daysGone } = useGym();

  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  // Tab: 'receive' (Laptop shows QR for phone to scan)
  //      'send'    (Push to laptop by typing PIN)
  //      'scan'    (Phone camera scanner)
  //      'show'    (Legacy export QR)
  //      'manual'  (Paste raw code)
  const [activeTab, setActiveTab] = useState(isMobile ? 'scan' : 'receive');
  const [manualCode, setManualCode] = useState('');
  const [targetPin, setTargetPin] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Live session state for Laptop receiving data
  const [session, setSession] = useState(null);
  const [syncStatus, setSyncStatus] = useState('listening'); // 'listening' | 'syncing' | 'success' | 'error'
  const [syncResultNote, setSyncResultNote] = useState('');

  // Generate session when opening receive tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'receive') return;

    const newSession = generateSyncSession();
    setSession(newSession);
    setSyncStatus('listening');
    setSyncResultNote('');

    const unsubscribe = listenForSyncPayload(newSession.roomId, (payload) => {
      setSyncStatus('syncing');
      try {
        const res = applySyncPayload(payload);
        if (res.success) {
          setSyncStatus('success');
          setSyncResultNote(res.resolution?.reason || 'Synced successfully with Phone!');
          fireWorkoutConfetti();
        } else {
          setSyncStatus('error');
          setSyncResultNote(res.error || 'Failed to apply phone data.');
        }
      } catch (err) {
        setSyncStatus('error');
        setSyncResultNote(err.message || 'Sync error');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, activeTab, applySyncPayload]);

  // QR URL for phone to scan
  const receiverQrUrl = useMemo(() => {
    if (!session || typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?sync_room=${session.roomId}`;
  }, [session]);

  // Generate ultra-compact QR payload for static data
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

  // When Phone's in-app camera scans a QR
  const handleScanSuccess = async (decodedText) => {
    const raw = decodedText.trim();

    // Check if user scanned a laptop sync room QR URL or code
    let matchedRoom = null;
    if (raw.includes('sync_room=')) {
      try {
        const url = new URL(raw);
        matchedRoom = url.searchParams.get('sync_room');
      } catch {
        const match = raw.match(/sync_room=([a-zA-Z0-9_]+)/);
        if (match) matchedRoom = match[1];
      }
    } else if (raw.startsWith('GD_SYNC:')) {
      matchedRoom = raw.replace('GD_SYNC:', '');
    }

    if (matchedRoom) {
      // User is on phone scanning laptop! Push phone data to laptop
      if (!gymData) {
        showToast('No gym data to send from this device', 'error');
        return;
      }
      try {
        const payload = encodeSyncPayload(gymData);
        await publishSyncPayload(matchedRoom, payload);
        showToast('🚀 Pushed latest gym data to Laptop successfully!', 'success');
        fireWorkoutConfetti();
        onClose();
      } catch {
        showToast('Failed to connect to laptop room', 'error');
      }
      return;
    }

    // Otherwise treat as direct data payload
    const res = applySyncPayload(decodedText);
    if (res.success) {
      onClose();
    }
  };

  // Push to Laptop using 6-digit PIN
  const handleSendByPin = async (e) => {
    e.preventDefault();
    const cleanPin = targetPin.replace(/\s+/g, '').toUpperCase();
    if (!cleanPin) return;
    if (!gymData) {
      showToast('No gym data to send from this device', 'error');
      return;
    }

    setIsSending(true);
    try {
      const payload = encodeSyncPayload(gymData);
      // Room format is either gd_XXXXXX or direct PIN
      const roomKey = cleanPin.startsWith('GD_') ? cleanPin : `gd_${cleanPin}`;
      await publishSyncPayload(roomKey, payload);
      // Also try raw pin
      await publishSyncPayload(cleanPin, payload);

      showToast(`🚀 Data pushed to Laptop room ${cleanPin}!`, 'success');
      fireWorkoutConfetti();
      setIsSending(false);
      onClose();
    } catch {
      setIsSending(false);
      showToast('Failed to send data to laptop', 'error');
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
        <div className="grid grid-cols-4 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('receive')}
            className={`py-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'receive'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Laptop Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`py-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'scan'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Phone</span>
          </button>
          <button
            onClick={() => setActiveTab('show')}
            className={`py-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'show'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Show QR</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Code / PIN</span>
          </button>
        </div>

        {/* Tab 1: LAPTOP SYNC (Zero camera on laptop — phone scans this screen) */}
        {activeTab === 'receive' && (
          <div className="flex flex-col items-center text-center space-y-3.5 pt-1">
            <div className="w-full bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-2.5 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">Laptop has no camera?</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Zero Camera Needed
              </span>
            </div>

            {/* QR Container */}
            <div className="relative p-3 sm:p-4 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-emerald-500/40">
              {receiverQrUrl ? (
                <QRCodeSVG
                  value={receiverQrUrl}
                  size={230}
                  level="M"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[230px] h-[230px] flex items-center justify-center text-xs text-slate-400">
                  Generating sync session...
                </div>
              )}

              {/* Status Overlay on completion */}
              {syncStatus === 'success' && (
                <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center p-4 animate-in zoom-in-90 duration-200">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
                  <span className="text-base font-black text-white">Synced with Phone!</span>
                  <span className="text-xs text-emerald-400 mt-1 font-medium">{syncResultNote}</span>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg hover:bg-emerald-400 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Live Radar Status Bar */}
            <div className="space-y-1 w-full">
              {syncStatus === 'listening' && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-pulse">
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                  <span>Waiting for phone scan...</span>
                </div>
              )}
              {syncStatus === 'syncing' && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 animate-bounce" />
                  <span>Phone detected! Transferring latest data...</span>
                </div>
              )}
              {syncStatus === 'error' && (
                <div className="text-xs text-rose-400 font-semibold">
                  {syncResultNote || 'Sync error. Please try again.'}
                </div>
              )}

              <p className="text-xs text-slate-200 font-medium pt-1">
                Point your <strong>phone camera</strong> at this screen.
              </p>
              <p className="text-[11px] text-slate-400">
                It will open Gym Dayz on your phone & automatically push the phone's latest attendance to this laptop!
              </p>
            </div>

            {/* Room Code Fallback */}
            {session && (
              <div className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Direct Sync Room:</span>
                <span className="font-mono font-bold text-white tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                  {session.roomId.replace('gd_', '')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SCAN CAMERA (Use Phone Camera to scan laptop or peer) */}
        {activeTab === 'scan' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Scanning laptop screen:</strong> Align laptop's QR inside the frame. Your phone will instantly push its data to the laptop!
              </span>
            </div>
            <QrScannerModal onScanSuccess={handleScanSuccess} />
          </div>
        )}

        {/* Tab 3: SHOW QR (Direct Data QR Export) */}
        {activeTab === 'show' && (
          <div className="flex flex-col items-center text-center space-y-3.5 pt-1">
            <div className="p-3 sm:p-4 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-emerald-500/40">
              {syncPayload ? (
                <QRCodeSVG
                  value={syncPayload}
                  size={230}
                  level="L"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[230px] h-[230px] flex items-center justify-center text-xs text-slate-400">
                  No subscription data to sync
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-semibold block">
                Direct Attendance QR Code
              </span>
              <span className="text-[11px] text-slate-500 block">
                Current local state: <strong className="text-emerald-400">{daysGone} days gone</strong>
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

        {/* Tab 4: MANUAL PASTE / PUSH BY PIN */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            {/* Push to Laptop via Room Code */}
            <form onSubmit={handleSendByPin} className="space-y-2.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Push Phone Data to Laptop (by Room Code)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter the 6-letter room code shown on your laptop screen:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={targetPin}
                  onChange={(e) => setTargetPin(e.target.value)}
                  placeholder="e.g. 7X8K2M"
                  maxLength={10}
                  className="flex-1 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono tracking-wider uppercase outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!targetPin.trim() || isSending}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {isSending ? 'Sending...' : 'Push Now'}
                </button>
              </div>
            </form>

            {/* Offline Code Paste */}
            <form onSubmit={handleManualSubmit} className="space-y-2.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paste Raw Sync Code</span>
              </div>
              <textarea
                rows={2}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Paste GD1:... payload here"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
              >
                Apply Raw Code
              </button>
            </form>
          </div>
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
