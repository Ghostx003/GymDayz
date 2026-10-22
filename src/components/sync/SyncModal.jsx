import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Laptop, 
  Smartphone, 
  Radio, 
  CheckCircle2, 
  Zap,
  ShieldCheck
} from 'lucide-react';
import Modal from '../common/Modal';
import QrScannerModal from './QrScannerModal';
import { useGym } from '../../context/GymContext';
import { encodeSyncPayload, decodeSyncPayload } from '../../sync/syncCodec';
import { resolveSyncConflict } from '../../sync/conflictResolver';
import { generateSyncSession, listenForSyncPayload, publishSyncPayload } from '../../sync/liveSyncRelay';
import { fireWorkoutConfetti } from '../../utils/confetti';

export default function SyncModal({ isOpen, onClose }) {
  const { gymData, applySyncPayload, showToast } = useGym();

  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  // Strictly only 2 tabs: 'laptop' or 'phone'
  const [activeTab, setActiveTab] = useState(isMobile ? 'phone' : 'laptop');

  // Live session state for Laptop receiving data
  const [session, setSession] = useState(null);
  const [syncStatus, setSyncStatus] = useState('listening'); // 'listening' | 'syncing' | 'success' | 'error'
  const [syncResultNote, setSyncResultNote] = useState('');

  // 1. Laptop Sync: Generate session & listen for phone scan
  useEffect(() => {
    if (!isOpen || activeTab !== 'laptop') return;

    const newSession = generateSyncSession();
    setSession(newSession);
    setSyncStatus('listening');
    setSyncResultNote('');

    // Listen on laptop for incoming phone payload
    const unsubscribe = listenForSyncPayload(newSession.roomId, async (incomingPayload) => {
      setSyncStatus('syncing');
      try {
        const phoneData = decodeSyncPayload(incomingPayload);
        const currentLaptopData = gymData;

        // Two-way sync comparison
        const resolution = resolveSyncConflict(currentLaptopData, phoneData);

        if (resolution.winner === 'incoming') {
          // Phone data is more recent! Laptop gets phone data
          applySyncPayload(incomingPayload);
          setSyncResultNote('Phone data was more recent. Laptop updated successfully!');
        } else {
          // Laptop data is more recent! Send laptop's data back to phone
          const winningLaptopPayload = encodeSyncPayload(currentLaptopData);
          await publishSyncPayload(newSession.roomId, winningLaptopPayload, 'laptop');
          setSyncResultNote('Laptop data was more recent. Phone updated successfully!');
        }

        setSyncStatus('success');
        fireWorkoutConfetti();
      } catch (err) {
        setSyncStatus('error');
        setSyncResultNote(err.message || 'Sync error');
      }
    }, 'laptop');

    return () => {
      unsubscribe();
    };
  }, [isOpen, activeTab, gymData, applySyncPayload]);

  // QR URL for phone to scan
  const receiverQrUrl = useMemo(() => {
    if (!session || typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?sync_room=${session.roomId}`;
  }, [session]);

  // 2. Phone Sync: When phone camera scans the laptop QR code
  const handlePhoneScanSuccess = async (decodedText) => {
    const raw = decodedText.trim();

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
      if (!gymData) {
        showToast('No local gym data to sync from this phone', 'error');
        return;
      }

      try {
        const phonePayload = encodeSyncPayload(gymData);

        // Listen for 3 seconds in case laptop data is newer
        const unsub = listenForSyncPayload(matchedRoom, (laptopWinningPayload) => {
          applySyncPayload(laptopWinningPayload);
          showToast('Synced! Laptop data was newer and applied to Phone.', 'success');
          fireWorkoutConfetti();
          unsub();
        }, 'phone');

        // Push phone data to laptop
        await publishSyncPayload(matchedRoom, phonePayload, 'phone');
        showToast('🚀 Synced with Laptop! Latest attendance applied.', 'success');
        fireWorkoutConfetti();

        setTimeout(() => {
          unsub();
          onClose();
        }, 1500);
      } catch {
        showToast('Failed to connect to laptop sync session', 'error');
      }
      return;
    }

    // Direct payload fallback
    const res = applySyncPayload(decodedText);
    if (res.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Device Sync"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Simple 2-Option Switcher */}
        <div className="grid grid-cols-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('laptop')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'laptop'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Laptop Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('phone')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'phone'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Phone Sync</span>
          </button>
        </div>

        {/* Option 1: LAPTOP SYNC (Laptop displays QR, zero camera needed) */}
        {activeTab === 'laptop' && (
          <div className="flex flex-col items-center text-center space-y-4 pt-1">
            {/* Scannable QR Container */}
            <div className="relative p-3 sm:p-4 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-emerald-500/40">
              {receiverQrUrl ? (
                <QRCodeSVG
                  value={receiverQrUrl}
                  size={240}
                  level="M"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[240px] h-[240px] flex items-center justify-center text-xs text-slate-400">
                  Generating sync session...
                </div>
              )}

              {/* Success Overlay */}
              {syncStatus === 'success' && (
                <div className="absolute inset-0 bg-slate-950/95 rounded-2xl flex flex-col items-center justify-center p-4 animate-in zoom-in-90 duration-200">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 animate-bounce" />
                  <span className="text-lg font-black text-white">Boom, Synced!</span>
                  <span className="text-xs text-emerald-400 mt-1 font-medium text-center">
                    {syncResultNote}
                  </span>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg hover:bg-emerald-400 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Radar status */}
            <div className="space-y-1.5 w-full">
              {syncStatus === 'listening' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-pulse">
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                  <span>Waiting for phone scan...</span>
                </div>
              )}
              {syncStatus === 'syncing' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 animate-bounce" />
                  <span>Phone detected! Synchronizing latest data...</span>
                </div>
              )}

              <p className="text-xs text-slate-200 font-semibold pt-1">
                Scan this QR code with your <strong>Phone</strong>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                Latest attendance is applied automatically to both sides.
              </p>
            </div>
          </div>
        )}

        {/* Option 2: PHONE SYNC (Use Phone camera to scan laptop screen) */}
        {activeTab === 'phone' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Point this phone's camera at the <strong>Laptop Sync QR</strong> to instantly sync both devices.
              </span>
            </div>
            <QrScannerModal onScanSuccess={handlePhoneScanSuccess} />
          </div>
        )}

        {/* Auto resolution rule note */}
        <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Bi-directional sync: <strong>Most recent attendance wins</strong> on both sides.</span>
        </div>
      </div>
    </Modal>
  );
}
