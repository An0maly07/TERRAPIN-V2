"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Map,
  Send,
  SkipForward,
  Maximize2,
  Minimize2,
  Pin,
  Check,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DistanceMeter } from "./distance-meter";
import { useGameStore } from "@/stores/game-store";
import { loadGoogleMaps } from "@/lib/google-maps";

/** Expansion stages matching TerraPin-main pattern */
type ExpansionStage = 0 | 1;

const STAGE_SIZES: Record<ExpansionStage, { w: string; h: string }> = {
  0: { w: "w-[340px]", h: "h-[230px]" },
  1: { w: "w-[520px]", h: "h-[360px]" },
};

const HOVER_SIZES = { w: "w-[400px]", h: "h-[270px]" };

export function MiniMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const guessMarkerRef = useRef<google.maps.Marker | null>(null);
  const trueMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const [expanded, setExpanded] = useState(true);
  const [stage, setStage] = useState<ExpansionStage>(0);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasGuess, setHasGuess] = useState(false);

  const setGuessPosition = useGameStore((s) => s.setGuessPosition);
  const guessPosition = useGameStore((s) => s.guessPosition);
  const actualPosition = useGameStore((s) => s.actualPosition);
  const phase = useGameStore((s) => s.phase);
  const submitGuess = useGameStore((s) => s.submitGuess);
  const nextRound = useGameStore((s) => s.nextRound);
  const rounds = useGameStore((s) => s.rounds);
  const lastRound = rounds[rounds.length - 1];

  // Keep a stable ref for the click handler
  const setGuessRef = useRef(setGuessPosition);
  useEffect(() => {
    setGuessRef.current = setGuessPosition;
  }, [setGuessPosition]);

  // Initialize Google Map
  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;

    (async () => {
      await loadGoogleMaps();
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        disableDefaultUI: true,
        keyboardShortcuts: false,
        gestureHandling: "greedy",
        clickableIcons: false,
      });

      // Click listener for placing guesses
      mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setGuessRef.current({ lat, lng });
        }
      });

      setIsMapReady(true);
    })();

    return () => {
      cancelled = true;
      // When collapsing, AnimatePresence removes the container from the DOM,
      // so the old Map instance is detached. Clear refs so a fresh map is
      // created the next time the panel is expanded.
      mapRef.current = null;
      guessMarkerRef.current = null;
      trueMarkerRef.current = null;
      polylineRef.current = null;
      setIsMapReady(false);
    };
  }, [expanded]);

  // Update guess marker when guessPosition changes
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    // Remove old marker
    if (guessMarkerRef.current) {
      guessMarkerRef.current.setMap(null);
      guessMarkerRef.current = null;
    }

    if (guessPosition) {
      const pinPath =
        "M 0,-20 C -6,-20 -10,-14 -10,-8 C -10,0 0,10 0,10 C 0,10 10,0 10,-8 C 10,-14 6,-20 0,-20 Z";

      guessMarkerRef.current = new google.maps.Marker({
        position: { lat: guessPosition.lat, lng: guessPosition.lng },
        map: mapRef.current,
        icon: {
          path: pinPath,
          scale: 0.9,
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          anchor: new google.maps.Point(0, 10),
        },
        title: "Your Guess",
        zIndex: 1000,
      });
      setHasGuess(true);
    } else {
      setHasGuess(false);
    }
  }, [guessPosition, isMapReady]);

  // Show result: true location marker + polyline
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    // Cleanup previous result visuals
    if (trueMarkerRef.current) {
      trueMarkerRef.current.setMap(null);
      trueMarkerRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (phase === "result" && actualPosition) {
      const flagPath =
        "M -1,10 L -1,-8 L 10,-8 L 5,-4 L 10,0 L -1,0 L -1,10 Z";

      trueMarkerRef.current = new google.maps.Marker({
        position: { lat: actualPosition.lat, lng: actualPosition.lng },
        map: mapRef.current,
        icon: {
          path: flagPath,
          scale: 1.5,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          anchor: new google.maps.Point(0, 10),
        } as google.maps.Symbol,
        title: "Actual Location",
        zIndex: 900,
      });

      // Dashed polyline connecting guess → true
      if (guessPosition) {
        polylineRef.current = new google.maps.Polyline({
          path: [
            { lat: guessPosition.lat, lng: guessPosition.lng },
            { lat: actualPosition.lat, lng: actualPosition.lng },
          ],
          geodesic: true,
          strokeColor: "#7c3aed",
          strokeOpacity: 0,
          strokeWeight: 3,
          icons: [
            {
              icon: {
                path: "M 0,-1 0,1",
                strokeOpacity: 1,
                strokeColor: "#7c3aed",
                scale: 3,
              },
              offset: "0",
              repeat: "15px",
            },
          ],
          map: mapRef.current,
        });

        // Fit bounds to show both markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: guessPosition.lat, lng: guessPosition.lng });
        bounds.extend({ lat: actualPosition.lat, lng: actualPosition.lng });
        mapRef.current.fitBounds(bounds, {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        });
      }
    }
  }, [phase, actualPosition, guessPosition, isMapReady]);

  // Reset map for new round
  useEffect(() => {
    if (phase === "guessing" && isMapReady && mapRef.current) {
      // Clean up result visuals
      if (trueMarkerRef.current) {
        trueMarkerRef.current.setMap(null);
        trueMarkerRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      if (guessMarkerRef.current) {
        guessMarkerRef.current.setMap(null);
        guessMarkerRef.current = null;
      }
      setHasGuess(false);
      mapRef.current.setCenter({ lat: 20, lng: 0 });
      mapRef.current.setZoom(2);
    }
  }, [phase, isMapReady]);

  // Keyboard: Space to submit
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && guessPosition && phase === "guessing") {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          submitGuess();
        }
      }
      if (e.code === "KeyN" && phase === "result") {
        e.preventDefault();
        nextRound();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [guessPosition, phase, submitGuess, nextRound]);

  // Determine effective map size
  const getMapSize = () => {
    if (stage === 1) return STAGE_SIZES[1];
    if (isHovered && !isPinned && stage === 0) return HOVER_SIZES;
    return STAGE_SIZES[stage];
  };

  const { w: mapWidth, h: mapHeight } = getMapSize();

  // Panel engaged: full opacity when hovered, pin placed, or in result. Dims entire panel (TerraPin-main legacy)
  const mapEngaged = isHovered || hasGuess || phase === "result";

  return (
    <motion.div
      initial={{ y: 40, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 22 }}
      className="absolute right-5 bottom-5 z-10"
    >
      {/*
       * Idle-dim wrapper — separate from entrance animation so framer-motion's
       * animate={{ opacity: 1 }} doesn't fight the persistent dim state.
       * Dims the ENTIRE panel (card + map + buttons) matching TerraPin-main's
       * mapAreaWrapper approach: opacity 0.5 idle → 1.0 on hover/engage.
       */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          opacity: mapEngaged ? 1 : 0.5,
          transition: "opacity 0.35s ease",
          willChange: "opacity",
        }}
      >
      {/* Top Controls — Expand / Shrink / Pin */}
      <AnimatePresence>
        {expanded && isHovered && phase === "guessing" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="mb-2 flex justify-end gap-1"
          >
            <button
              onClick={() =>
                setStage((s) => Math.min(s + 1, 1) as ExpansionStage)
              }
              disabled={stage === 1}
              className={cn(
                "flex h-[34px] w-[34px] items-center justify-center rounded-xl border-2 text-white transition-all duration-200",
                stage === 1
                  ? "cursor-not-allowed border-white/5 bg-white/[0.03] opacity-30"
                  : "border-[rgba(71,85,105,0.6)] bg-[rgba(30,41,59,0.95)] shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:scale-105 hover:border-[rgba(100,116,139,0.8)] hover:bg-[rgba(51,65,85,0.95)] active:scale-95"
              )}
              title="Expand"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={() =>
                setStage((s) => Math.max(s - 1, 0) as ExpansionStage)
              }
              disabled={stage === 0}
              className={cn(
                "flex h-[34px] w-[34px] items-center justify-center rounded-xl border-2 text-white transition-all duration-200",
                stage === 0
                  ? "cursor-not-allowed border-white/5 bg-white/[0.03] opacity-30"
                  : "border-[rgba(71,85,105,0.6)] bg-[rgba(30,41,59,0.95)] shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:scale-105 hover:border-[rgba(100,116,139,0.8)] hover:bg-[rgba(51,65,85,0.95)] active:scale-95"
              )}
              title="Shrink"
            >
              <Minimize2 size={14} />
            </button>
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                "flex h-[34px] w-[34px] items-center justify-center rounded-xl border-2 text-white transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95",
                isPinned
                  ? "border-[rgba(96,165,250,0.8)] bg-[rgba(59,130,246,0.6)]"
                  : "border-[rgba(71,85,105,0.6)] bg-[rgba(30,41,59,0.95)] hover:border-[rgba(100,116,139,0.8)] hover:bg-[rgba(51,65,85,0.95)]"
              )}
              title={isPinned ? "Unpin size" : "Pin size"}
            >
              <Pin size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "overflow-hidden rounded-2xl border-2 transition-all duration-500",
          phase === "result"
            ? "border-[rgba(16,185,129,0.6)] shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_40px_rgba(16,185,129,0.2)]"
            : isHovered
              ? "border-[rgba(124,58,237,0.6)] shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_40px_rgba(124,58,237,0.15)]"
              : "border-[rgba(124,58,237,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          "bg-[oklch(0.11_0.02_260/0.90)] backdrop-blur-2xl"
        )}
      >
        {/* Header */}
        <motion.div
          layout="position"
          className="flex items-center justify-between px-4 py-2.5"
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white/80"
          >
            <Map size={13} className="text-primary/70" />
            <span>Map</span>
            <motion.div
              animate={{ rotate: expanded ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={13} />
            </motion.div>
          </button>

          {/* Pin placed indicator in header */}
          <AnimatePresence>
            {hasGuess && phase === "guessing" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 rounded-full border border-[rgba(16,185,129,0.5)] bg-[rgba(16,185,129,0.15)] px-2.5 py-1"
              >
                <Check size={11} className="text-emerald-400" strokeWidth={3} />
                <span className="text-[0.6rem] font-bold text-emerald-400">
                  Pin placed!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Map + Actions */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              {/* Google Map container */}
              <div
                className={cn(
                  "relative overflow-hidden transition-all duration-500",
                  mapWidth,
                  mapHeight
                )}
                style={{
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div
                  ref={mapContainerRef}
                  className="absolute inset-0 h-full w-full"
                  style={{
                    transform: mapEngaged ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    willChange: "transform",
                  }}
                />

                {/* Zoom controls on hover */}
                <AnimatePresence>
                  {isHovered && phase === "guessing" && isMapReady && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-3 left-3 z-20 flex flex-col gap-1"
                    >
                      <button
                        onClick={() => {
                          const z = mapRef.current?.getZoom() ?? 2;
                          mapRef.current?.setZoom(z + 1);
                        }}
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-xl border-2 border-[rgba(71,85,105,0.6)] bg-[rgba(30,41,59,0.95)] text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-200 hover:scale-105 hover:border-[rgba(100,116,139,0.8)] hover:bg-[rgba(51,65,85,0.95)] active:scale-95"
                      >
                        <ZoomIn size={15} />
                      </button>
                      <button
                        onClick={() => {
                          const z = mapRef.current?.getZoom() ?? 2;
                          mapRef.current?.setZoom(Math.max(z - 1, 1));
                        }}
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-xl border-2 border-[rgba(71,85,105,0.6)] bg-[rgba(30,41,59,0.95)] text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-200 hover:scale-105 hover:border-[rgba(100,116,139,0.8)] hover:bg-[rgba(51,65,85,0.95)] active:scale-95"
                      >
                        <ZoomOut size={15} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action button — separate card below the map, TerraPin-main style */}
      <AnimatePresence mode="wait">
        {phase === "guessing" && (
          <motion.div
            key="guessing-action"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2"
          >
            <motion.button
              onClick={submitGuess}
              disabled={!guessPosition}
              whileHover={guessPosition ? { scale: 1.02 } : undefined}
              whileTap={guessPosition ? { scale: 0.97 } : undefined}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg py-[11px] px-4 text-[0.69rem] font-bold uppercase tracking-[1.5px] transition-all duration-300",
                guessPosition
                  ? "cursor-pointer border border-emerald-400/50 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.45)]"
                  : "cursor-not-allowed border border-white/[0.15] bg-[rgba(30,30,50,0.95)] text-white/50"
              )}
            >
              <Send size={13} />
              {guessPosition ? "GUESS" : "PLACE YOUR PIN ON THE MAP"}
              {guessPosition && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-1 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[0.5rem] tracking-normal text-white/50"
                >
                  Space
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        )}

        {phase === "result" && lastRound && (
          <motion.div
            key="result-action"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 flex flex-col gap-2"
          >
            <DistanceMeter
              distanceKm={lastRound.distanceKm}
              score={lastRound.score}
            />
            <motion.button
              onClick={nextRound}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[rgba(30,30,50,0.95)] py-[11px] px-4 text-[0.69rem] font-bold uppercase tracking-[1.5px] text-white/70 transition-all duration-200 hover:bg-white/[0.08] hover:text-white"
            >
              <SkipForward size={13} />
              Next Round
              <span className="ml-1 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[0.5rem] tracking-normal text-white/30">
                N
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      </div> {/* end idle-dim wrapper */}
    </motion.div>
  );
}
