import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, Zap } from 'lucide-react';

export default function QrScannerModal({ onScanSuccess }) {
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    const containerId = 'gym-qr-reader';
    let isMounted = true;

    async function startScanner() {
      try {
        setCameraError('');
        const html5QrCode = new Html5Qrcode(containerId, {
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true, // Native Android/Chrome hardware acceleration
          },
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 25, // High scanning frame rate for sub-second recognition
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.85);
              return { width: edge, height: edge };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
              }).catch(() => {
                onScanSuccess(decodedText);
              });
            }
          },
          () => {
            // Frame scanned
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err) {
        if (isMounted) {
          const errStr = err?.toString() || '';
          if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
            setCameraError('Camera permission denied. Please allow camera access in your browser settings, or use the "Paste Code" tab.');
          } else {
            setCameraError('Unable to access camera feed. You can use the "Paste Code" tab to sync manually.');
          }
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="space-y-3">
      {cameraError ? (
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block mb-1">Camera Notice</span>
            <span>{cameraError}</span>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
          <div id="gym-qr-reader" className="w-full min-h-[260px]" />
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-2">
              <Camera className="w-8 h-8 animate-pulse text-emerald-400" />
              <span className="text-xs font-semibold">Starting camera...</span>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-emerald-400" />
        <span>Align QR code inside box — captures automatically in 1–2 seconds.</span>
      </p>
    </div>
  );
}
