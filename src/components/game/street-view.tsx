"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPinOff, RotateCcw } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import { loadGoogleMaps } from "@/lib/google-maps";

export function StreetView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const startPosRef = useRef<google.maps.LatLng | null>(null);

  const actualPosition = useGameStore((s) => s.actualPosition);
  const panoId = useGameStore((s) => s.panoId);
  const isLoadingLocation = useGameStore((s) => s.isLoadingLocation);
  const phase = useGameStore((s) => s.phase);
  const setStreetViewHeading = useGameStore((s) => s.setStreetViewHeading);

  const [isPanoReady, setIsPanoReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset panorama to start position (keyboard shortcut R)
  const resetView = useCallback(() => {
    if (panoramaRef.current && startPosRef.current) {
      panoramaRef.current.setPosition(startPosRef.current);
      panoramaRef.current.setPov({ heading: 0, pitch: 0 });
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        (e.key === "r" || e.key === "R") &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        resetView();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [resetView]);

  // Initialize / update panorama when actualPosition changes
  useEffect(() => {
    if (!actualPosition || !containerRef.current) return;

    let cancelled = false;

    setIsPanoReady(false);
    setHasError(false);

    (async () => {
      await loadGoogleMaps();
      if (cancelled || !containerRef.current) return;

      const sv = new google.maps.StreetViewService();
      const latLng = new google.maps.LatLng(
        actualPosition.lat,
        actualPosition.lng
      );

      sv.getPanorama(
        {
          location: latLng,
          radius: 100,
          source: google.maps.StreetViewSource.OUTDOOR,
        },
        (
          data: google.maps.StreetViewPanoramaData | null,
          status: google.maps.StreetViewStatus
        ) => {
          if (cancelled) return;

          if (
            status === google.maps.StreetViewStatus.OK &&
            data?.location?.latLng
          ) {
            startPosRef.current = data.location.latLng;

            // Destroy previous panorama listeners
            if (panoramaRef.current) {
              google.maps.event.clearInstanceListeners(panoramaRef.current);
            }

            panoramaRef.current = new google.maps.StreetViewPanorama(
              containerRef.current!,
              {
                position: data.location.latLng,
                pov: { heading: 0, pitch: 0 },
                zoom: 1,
                addressControl: false,
                showRoadLabels: false,
                zoomControl: false,
                panControl: false,
                fullscreenControl: false,
                motionTracking: false,
                motionTrackingControl: false,
                disableDefaultUI: true,
                linksControl: true,
              }
            );

            // Emit heading changes so the CompassHUD can track panning
            panoramaRef.current.addListener("pov_changed", () => {
              const pov = panoramaRef.current?.getPov();
              if (pov != null) setStreetViewHeading(pov.heading);
            });

            setIsPanoReady(true);
          } else {
            setHasError(true);
          }
        }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [actualPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (panoramaRef.current) {
        google.maps.event.clearInstanceListeners(panoramaRef.current);
        panoramaRef.current = null;
      }
    };
  }, []);

  const showOverlay = isLoadingLocation || (!isPanoReady && !hasError);

  return (
    <div className="relative flex flex-1 overflow-hidden bg-[oklch(0.08_0.02_260)]">
      {/* Google Street View container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Loading overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[oklch(0.08_0.02_260)]"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={36} className="text-primary/60" />
            </motion.div>
            <p className="text-sm font-medium text-white/40">
              Loading Street View...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[oklch(0.08_0.02_260)]"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <MapPinOff size={32} className="text-destructive/60" />
            </div>
            <p className="text-sm font-medium text-white/50">
              Street View not available for this location
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button (visible when panorama is ready) */}
      {isPanoReady && phase === "guessing" && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={resetView}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl border-2 border-[rgba(71,85,105,0.6)] bg-[rgba(30,41,59,0.95)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-200 hover:scale-105 hover:border-[rgba(100,116,139,0.8)] hover:bg-[rgba(51,65,85,0.95)] hover:text-white active:scale-95"
          title="Reset view (R)"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Reset</span>
          <span className="ml-1 rounded border border-white/15 bg-white/5 px-1 py-0.5 text-[0.55rem] text-white/30">
            R
          </span>
        </motion.button>
      )}
    </div>
  );
}
