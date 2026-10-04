/**
 * Confetti celebration trigger for attendance and streaks
 */
import confetti from 'canvas-confetti';

export function fireWorkoutConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'],
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback if canvas is not supported
  }
}

export function fireStreakMilestoneConfetti() {
  try {
    const end = Date.now() + 1.2 * 1000;
    const colors = ['#10b981', '#f59e0b', '#fbbf24'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  } catch {
    // Graceful fallback
  }
}
