import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  QrCode, 
  CreditCard, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw 
} from 'lucide-react';
import gymPassBarcode from '../../assets/gym-pass-barcode.jpg';
import gymPassCard from '../../assets/gym-pass-card.jpg';

export default function GymPassModal({ isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = Barcode, 1 = Full Pass Card
  
  // Single-touch swipe & pan state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Zoom & Pan state
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef(0);
  const initialPinchScaleRef = useRef(1);
  const imageContainerRef = useRef(null);

  const slides = [
    {
      id: 'barcode',
      title: 'Gym Barcode',
      image: gymPassBarcode,
      tag: 'Access Barcode',
    },
    {
      id: 'fullcard',
      title: 'Member Pass',
      image: gymPassCard,
      tag: 'Digital Pass',
    },
  ];

  const resetZoom = useCallback(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(4, +(prev + 0.5).toFixed(1)));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, +(prev - 0.5).toFixed(1));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const nextSlide = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length, resetZoom]);

  const prevSlide = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length, resetZoom]);

  // Touch handlers: Multi-touch Pinch to Zoom + Single touch Pan/Swipe
  const getTouchDistance = (t1, t2) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      initialPinchDistRef.current = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchScaleRef.current = zoomScale;
      setTouchStart(null);
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      if (zoomScale > 1) {
        // Drag / Pan mode when zoomed
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        };
      } else {
        // Normal swipe
        setTouchEnd(null);
        setTouchStart(e.touches[0].clientX);
      }
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDistRef.current > 0) {
      // Active pinch-to-zoom
      e.preventDefault();
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const factor = currentDist / initialPinchDistRef.current;
      const targetScale = Math.min(4, Math.max(1, +(initialPinchScaleRef.current * factor).toFixed(2)));
      setZoomScale(targetScale);
      if (targetScale === 1) setPan({ x: 0, y: 0 });
    } else if (e.touches.length === 1) {
      if (zoomScale > 1 && isDragging) {
        const newX = e.touches[0].clientX - dragStartRef.current.x;
        const newY = e.touches[0].clientY - dragStartRef.current.y;
        const maxPan = 100 * zoomScale;
        setPan({
          x: Math.max(-maxPan, Math.min(maxPan, newX)),
          y: Math.max(-maxPan, Math.min(maxPan, newY)),
        });
      } else {
        setTouchEnd(e.touches[0].clientX);
      }
    }
  };

  const onTouchEnd = (e) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = 0;
    }

    if (zoomScale > 1) {
      setIsDragging(false);
      return;
    }

    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipe = 45;

    if (distance > minSwipe) {
      nextSlide();
    } else if (distance < -minSwipe) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse pan when zoomed
  const onMouseDown = (e) => {
    if (zoomScale > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
    }
  };

  const onMouseMove = (e) => {
    if (isDragging && zoomScale > 1) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      const maxPan = 120 * zoomScale;
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (zoomScale === 1) nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (zoomScale === 1) prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose, zoomScale]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      resetZoom();
    }
  }, [isOpen, resetZoom]);

  if (!isOpen) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
        aria-hidden="true" 
      />

      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-gradient-to-b from-[#131b2e] to-[#0a0f1d] border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all select-none animate-in zoom-in-95 duration-200"
      >
        {/* Clean Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              {currentSlide.tag}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimal Zoom Controls */}
            {currentIndex === 1 && (
              <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-1 py-0.5">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 1}
                  className="p-1 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-emerald-400 px-1 min-w-[36px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 4}
                  className="p-1 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomScale > 1 && (
                  <button
                    onClick={resetZoom}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors border-l border-slate-700 pl-1.5"
                    aria-label="Reset Zoom"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                resetZoom();
                setCurrentIndex(0);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentIndex === 0
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Barcode</span>
            </button>
            <button
              onClick={() => setCurrentIndex(1)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentIndex === 1
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Full Pass</span>
            </button>
          </div>
        </div>

        {/* Image Display Area with Pinch-to-Zoom */}
        <div
          ref={imageContainerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative px-5 py-3 flex-1 flex flex-col items-center justify-center min-h-[340px] touch-none"
        >
          {zoomScale === 1 && (
            <>
              <button
                onClick={prevSlide}
                aria-label="Previous"
                className="absolute left-2 z-10 w-9 h-9 rounded-full bg-slate-900/85 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-all active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next"
                className="absolute right-2 z-10 w-9 h-9 rounded-full bg-slate-900/85 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-all active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div 
            onMouseDown={onMouseDown}
            className={`relative w-full flex items-center justify-center overflow-hidden rounded-2xl ${
              zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'
            }`}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 max-h-[460px] bg-slate-950 flex items-center justify-center w-full">
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                draggable={false}
                style={{
                  transform: zoomScale > 1
                    ? `scale(${zoomScale}) translate(${pan.x / zoomScale}px, ${pan.y / zoomScale}px)`
                    : 'scale(1)',
                  transition: isDragging || initialPinchDistRef.current > 0 ? 'none' : 'transform 0.15s ease-out',
                }}
                className="w-full h-auto max-h-[440px] object-contain rounded-xl select-none"
              />
            </div>
          </div>
        </div>

        {/* Minimal Dots Only — Zero Hints */}
        <div className="pb-4 pt-1 flex items-center justify-center gap-2">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => {
                resetZoom();
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx
                  ? 'w-6 bg-emerald-400'
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
