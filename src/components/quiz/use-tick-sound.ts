"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * Creates a short, clicky tick sound using Web Audio API.
 * Returns a `tick()` function that plays the sound.
 */
export function useTickSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const tick = useCallback(() => {
    try {
      const ctx = getCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        400,
        ctx.currentTime + 0.03
      );

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch {
      // Silently fail — sound is UX polish, not critical
    }
  }, [getCtx]);

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return tick;
}
