"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { useGameStore } from "@/stores/game-store";

export function MiniMap() {
  const [expanded, setExpanded] = useState(true);
  const setGuessPosition = useGameStore((s) => s.setGuessPosition);
  const phase = useGameStore((s) => s.phase);

  const [pinPosition, setPinPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (phase !== "guessing") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPinPosition({ x, y });

      // Convert pixel position to fake lat/lng (placeholder mapping)
      const lat = 90 - (y / 100) * 180;
      const lng = (x / 100) * 360 - 180;
      setGuessPosition({ lat, lng });
    },
    [phase, setGuessPosition]
  );

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      className="absolute right-4 bottom-20 z-10 sm:bottom-4"
    >
      <div className="glass overflow-hidden rounded-xl">
        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span>Map</span>
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Map area */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="relative h-48 w-64 cursor-crosshair sm:h-56 sm:w-72"
                onClick={handleMapClick}
                style={{
                  background:
                    "radial-gradient(ellipse at center, oklch(0.22 0.04 220) 0%, oklch(0.14 0.02 240) 100%)",
                }}
              >
                {/* Simplified world map outlines (placeholder) */}
                <svg
                  viewBox="0 0 360 180"
                  className="absolute inset-0 h-full w-full opacity-20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                >
                  {/* Rough continent outlines */}
                  <ellipse cx="180" cy="90" rx="160" ry="70" className="text-muted-foreground" />
                  <path d="M60,40 Q80,30 100,35 Q120,40 110,60 Q90,80 70,70 Q55,55 60,40" className="text-muted-foreground" />
                  <path d="M130,35 Q170,25 200,30 Q230,40 220,60 Q200,70 180,65 Q150,55 130,35" className="text-muted-foreground" />
                  <path d="M240,30 Q280,20 310,35 Q320,50 300,65 Q270,70 250,55 Q235,40 240,30" className="text-muted-foreground" />
                  <path d="M100,90 Q120,85 130,100 Q120,130 100,140 Q85,130 90,110 Q95,95 100,90" className="text-muted-foreground" />
                  <path d="M250,80 Q280,70 300,80 Q310,100 290,120 Q270,130 255,110 Q245,95 250,80" className="text-muted-foreground" />
                </svg>

                {/* Grid lines */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                    backgroundSize: "25% 25%",
                  }}
                />

                {/* Pin */}
                <AnimatePresence>
                  {pinPosition && (
                    <motion.div
                      key={`${pinPosition.x}-${pinPosition.y}`}
                      initial={{ y: -30, scale: 1.5, opacity: 0 }}
                      animate={{ y: 0, scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="absolute"
                      style={{
                        left: `${pinPosition.x}%`,
                        top: `${pinPosition.y}%`,
                        transform: "translate(-50%, -100%)",
                      }}
                    >
                      <MapPin size={24} className="text-primary drop-shadow-lg" fill="var(--primary)" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/30"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Click hint */}
                {!pinPosition && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground/40">Click to place pin</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
