import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, QrCode, CreditCard, Smartphone } from 'lucide-react';
import gymPassBarcode from '../../assets/gym-pass-barcode.jpg';
import gymPassCard from '../../assets/gym-pass-card.jpg';

export default function GymPassModal({ isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = Barcode, 1 = Full Pass Card
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const modalRef = useRef(null);

  const slides = [
    {
      id: 'barcode',
      title: 'Gym Access Barcode',
      subtitle: 'Fitness Hour 2.0 • ID #FHM2026-0467',
      image: gymPassBarcode,
      tag: 'Turnstile Scan',
      tip: 'Hold this high-contrast barcode near the gym scanner to enter',
    },
    {
      id: 'fullcard',
      title: 'Member Access Pass',
      subtitle: 'Devi Nayak • Fitness Hour 2.0',
      image: gymPassCard,
      tag: 'Official Digital Pass',
      tip: 'Active: 19 Aug 2026 → 19 Feb 2027 • 5:30 AM - 10:00 PM Daily',
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Touch Swipe Handlers for mobile
  const minSwipeDistance = 45;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose]);

  // Reset to first slide (barcode) when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background dismissal area */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Main Pass Modal Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gym-pass-title"
        className="w-full max-w-md bg-gradient-to-b from-[#131b2e] to-[#0a0f1d] border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-950/50 flex flex-col overflow-hidden transition-all select-none animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              {currentSlide.tag}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Gym Pass"
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle (Barcode vs Full Pass) */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentIndex(0)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentIndex === 0
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Barcode Only</span>
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
              <span>Full Member Pass</span>
            </button>
          </div>
        </div>

        {/* Swipeable Image Viewer Area */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative px-5 py-3 flex-1 flex flex-col items-center justify-center min-h-[340px]"
        >
          {/* Navigation Arrows (Desktop & Tablet) */}
          <button
            onClick={prevSlide}
            aria-label="Previous View"
            className="absolute left-2 z-10 w-9 h-9 rounded-full bg-slate-900/85 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next View"
            className="absolute right-2 z-10 w-9 h-9 rounded-full bg-slate-900/85 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-all active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Image Container with Smooth Animation */}
          <div 
            onClick={nextSlide}
            className="relative cursor-pointer group w-full flex items-center justify-center"
            title="Click or swipe to switch view"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 group-hover:border-emerald-500/60 transition-all max-h-[460px] bg-slate-950 flex items-center justify-center">
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="w-full h-auto max-h-[440px] object-contain rounded-xl transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Footer Info & Swipe Indicator */}
        <div className="px-5 pb-5 pt-1 space-y-2.5 text-center">
          <div>
            <h3 id="gym-pass-title" className="text-base font-black text-white tracking-tight">
              {currentSlide.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {currentSlide.tip}
            </p>
          </div>

          {/* Swipe Indicator Dots */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx
                    ? 'w-6 bg-emerald-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Swipe or click anywhere on pass to flip ({currentIndex + 1}/2)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
