/**
 * useStarfieldConfig Hook
 * Provides reactive configuration for the starfield background
 * with methods for interactive effects (pulse, zoom)
 */

import { useState, useCallback, useRef } from "react";

export interface StarfieldConfig {
  numStars: number;
  minSpeed: number;
  maxSpeed: number;
  minRadius: number;
  maxRadius: number;
  glowIntensity: number;
  enabled: boolean;
}

export interface StarfieldEffects {
  isPulsing: boolean;
  isZooming: boolean;
  isRepelling: boolean;
  speedMultiplier: number;
}

export const DEFAULT_STARFIELD_CONFIG: StarfieldConfig = {
  numStars: 200,
  minSpeed: 0.02,
  maxSpeed: 0.08,
  minRadius: 0.5,
  maxRadius: 2.5,
  glowIntensity: 8,
  enabled: true,
};

export function useStarfieldConfig(initialConfig?: Partial<StarfieldConfig>) {
  const [config, setConfigState] = useState<StarfieldConfig>({
    ...DEFAULT_STARFIELD_CONFIG,
    ...initialConfig,
  });

  const [effects, setEffects] = useState<StarfieldEffects>({
    isPulsing: false,
    isZooming: false,
    isRepelling: false,
    speedMultiplier: 1.0,
  });

  const pulseTimeoutRef = useRef<number | null>(null);
  const zoomTimeoutRef = useRef<number | null>(null);

  const setConfig = useCallback((partialConfig: Partial<StarfieldConfig>) => {
    setConfigState((prev) => ({ ...prev, ...partialConfig }));
  }, []);

  const pulse = useCallback(() => {
    if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);

    setEffects((prev) => ({
      ...prev,
      isPulsing: true,
      speedMultiplier: 2.5,
    }));

    pulseTimeoutRef.current = window.setTimeout(() => {
      setEffects((prev) => ({
        ...prev,
        isPulsing: false,
        speedMultiplier: 1.0,
      }));
    }, 400);
  }, []);

  const zoomOut = useCallback((onComplete?: () => void) => {
    if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
    if (zoomTimeoutRef.current) window.clearTimeout(zoomTimeoutRef.current);

    setEffects((prev) => ({
      ...prev,
      isPulsing: false,
      isZooming: true,
      speedMultiplier: 8.0,
    }));

    zoomTimeoutRef.current = window.setTimeout(() => {
      setEffects((prev) => ({
        ...prev,
        isZooming: false,
        speedMultiplier: 1.0,
      }));
      onComplete?.();
    }, 600);
  }, []);

  const startRepel = useCallback(() => {
    setEffects((prev) => ({ ...prev, isRepelling: true }));
  }, []);

  const stopRepel = useCallback(() => {
    setEffects((prev) => ({ ...prev, isRepelling: false }));
  }, []);

  return { config, effects, setConfig, pulse, zoomOut, startRepel, stopRepel };
}
