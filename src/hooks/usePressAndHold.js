import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook to handle click and press-and-hold auto-repeat for both mouse and touch.
 * Guaranteed:
 * - Single click triggers exactly once.
 * - Long press starts repeating after `delay` ms at `interval` ms.
 * - No accidental double increments.
 * 
 * @param {() => void} callback Action to trigger
 * @param {boolean} disabled Whether the action is disabled
 * @param {number} delay Initial hold threshold (ms)
 * @param {number} interval Repeat frequency (ms)
 */
export function usePressAndHold(callback, disabled = false, delay = 400, interval = 90) {
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const isHeldRef = useRef(false);
  const callbackRef = useRef(callback);

  // Keep callback reference fresh
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isHeldRef.current = false;
  }, []);

  // Clear timers on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const handlePointerDown = useCallback((e) => {
    // Only primary mouse button or touch
    if (e.button && e.button !== 0) return;
    if (disabled) return;

    // Trigger initial click immediately
    callbackRef.current();

    clearTimers();
    isHeldRef.current = true;

    // Start hold timer
    timeoutRef.current = setTimeout(() => {
      if (!isHeldRef.current) return;
      intervalRef.current = setInterval(() => {
        if (!isHeldRef.current) {
          clearTimers();
          return;
        }
        callbackRef.current();
      }, interval);
    }, delay);
  }, [disabled, delay, interval, clearTimers]);

  const handlePointerUp = useCallback((e) => {
    clearTimers();
  }, [clearTimers]);

  const handlePointerLeave = useCallback((e) => {
    clearTimers();
  }, [clearTimers]);

  const handlePointerCancel = useCallback((e) => {
    clearTimers();
  }, [clearTimers]);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerLeave: handlePointerLeave,
    onPointerCancel: handlePointerCancel,
    onContextMenu: (e) => e.preventDefault(),
    // Prevent default button click so pointerdown handles it cleanly without double increment
    onClick: (e) => e.preventDefault(),
  };
}
