import { useEffect, useRef, useState, useCallback } from 'react';

export type FocusState = 'idle' | 'focusing' | 'evaluated';

interface UseFocusFadeTimerOptions {
  pauseDurationMs?: number; // default: 1000ms
  transitionDurationMs?: number; // default: 4000ms
  isPaused?: boolean;
}

export function useFocusFadeTimer({
  pauseDurationMs = 1000,
  transitionDurationMs = 4000,
  isPaused = false,
}: UseFocusFadeTimerOptions = {}) {
  const [focusState, setFocusState] = useState<FocusState>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    setFocusState('idle');
    setProgressPercent(0);
    startTimeRef.current = Date.now();
  }, []);

  const stopTimer = useCallback(() => {
    setFocusState('evaluated');
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPaused || focusState === 'evaluated') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const updateFrame = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const totalDurationMs = pauseDurationMs + transitionDurationMs;

      // Progress bar advances smoothly and immediately from t = 0 across the full duration
      const progress = Math.min(100, (elapsed / totalDurationMs) * 100);
      setProgressPercent(progress);

      // Focus state transitions independently from idle to focusing after pauseDurationMs
      if (elapsed < pauseDurationMs) {
        setFocusState('idle');
      } else {
        setFocusState('focusing');
      }

      rafRef.current = requestAnimationFrame(updateFrame);
    };

    rafRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [focusState, isPaused, pauseDurationMs, transitionDurationMs]);

  return {
    focusState,
    progressPercent,
    startTime: startTimeRef.current,
    startTimer,
    stopTimer,
  };
}
