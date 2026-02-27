"use client";

/**
 * CompassHUD — optimised linear heading tape.
 *
 * Performance contract:
 *   • Heading updates bypass React entirely via useGameStore.subscribe + rAF
 *     → zero re-renders during panning (was firing at ~60 fps through state)
 *   • Tick ribbon is memoised once on mount — DOM is never patched for ticks
 *   • willChange:"transform" keeps the ribbon on its own GPU layer
 *   • Only N / E / S / W labels rendered (removed intercardinals)
 */

import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

// ── Layout ─────────────────────────────────────────────────────────────────
const PX_PER_DEG    = 1.6;   // ribbon px per degree
const REPS          = 5;     // repetitions — gives ±720° before clamping
const CENTER_REP    = 2;     // middle repetition (index 0-based)
const PILL_W        = 280;
const PILL_H        = 40;
const PILL_CX       = PILL_W / 2;
const RIBBON_ANCHOR = CENTER_REP * 360 * PX_PER_DEG; // px of the 0° anchor

// ── Tick definitions (computed once) ───────────────────────────────────────
const CARDINALS: Record<number, string> = { 0: "N", 90: "E", 180: "S", 270: "W" };

const TICK_DEFS = Array.from({ length: 36 }, (_, i) => {
  const deg    = i * 10;
  const isCard = deg % 90  === 0;
  const isMid  = !isCard && deg % 30 === 0;
  return { deg, isCard, isMid, label: CARDINALS[deg] ?? null };
});

// ── Component ──────────────────────────────────────────────────────────────
export function CompassHUD() {
  const phase          = useGameStore((s) => s.phase);
  const actualPosition = useGameStore((s) => s.actualPosition);

  // DOM refs — all heading-driven updates go through these, not state
  const ribbonRef  = useRef<HTMLDivElement>(null);

  // Continuous heading tracking (no wrapping at 0°/360°)
  const prevRawRef = useRef(0);
  const contRef    = useRef(0);
  const rafRef     = useRef(0);

  // Reset when a new location loads
  useEffect(() => {
    prevRawRef.current = 0;
    contRef.current    = 0;
    if (ribbonRef.current)
      ribbonRef.current.style.transform = `translateX(${PILL_CX - RIBBON_ANCHOR}px)`;
  }, [actualPosition]);

  // Subscribe to heading changes without going through React render cycle
  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      const rawHeading = state.streetViewHeading;
      if (rawHeading === prev.streetViewHeading) return;

      // Continuous delta — handles 359°→0° wrap without jumping
      let delta = rawHeading - prevRawRef.current;
      if (delta >  180) delta -= 360;
      if (delta < -180) delta += 360;
      prevRawRef.current = rawHeading;
      contRef.current   += delta;

      // Clamp so we stay inside the rendered ribbon (±720°)
      if (contRef.current >  720) contRef.current -= 360;
      if (contRef.current < -720) contRef.current += 360;

      // Batch DOM writes in the next animation frame
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (ribbonRef.current) {
          const tx = PILL_CX - RIBBON_ANCHOR - contRef.current * PX_PER_DEG;
          ribbonRef.current.style.transform = `translateX(${tx}px)`;
        }
      });
    });

    return () => {
      unsub();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Tick JSX — computed once, never re-rendered
  const ticks = useMemo(
    () =>
      Array.from({ length: REPS }, (_, rep) =>
        TICK_DEFS.map(({ deg, isCard, isMid, label }) => {
          const x = (rep * 360 + deg) * PX_PER_DEG;
          const h = isCard ? 14 : isMid ? 9 : 5;
          const w = isCard ? 1.5 : 1;
          const color = isCard
            ? deg === 0
              ? "rgba(248,113,113,0.88)"
              : "rgba(255,255,255,0.70)"
            : isMid
            ? "rgba(255,255,255,0.32)"
            : "rgba(255,255,255,0.14)";

          return (
            <div
              key={`${rep}-${deg}`}
              style={{
                position:      "absolute",
                left:          x,
                bottom:        6,
                display:       "flex",
                flexDirection: "column",
                alignItems:    "center",
                gap:           2,
                transform:     "translateX(-50%)",
              }}
            >
              {label && (
                <span
                  style={{
                    fontSize:      "0.65rem",
                    fontWeight:    800,
                    letterSpacing: "0.04em",
                    lineHeight:    1,
                    whiteSpace:    "nowrap",
                    color:
                      deg === 0
                        ? "rgba(248,113,113,0.95)"
                        : "rgba(255,255,255,0.52)",
                    textShadow:
                      deg === 0 ? "0 0 5px rgba(239,68,68,0.40)" : undefined,
                  }}
                >
                  {label}
                </span>
              )}
              <div style={{ width: w, height: h, background: color, borderRadius: 1 }} />
            </div>
          );
        })
      ),
    [] // intentionally empty — ticks are static geometry
  );

  if (phase !== "guessing") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1,  y: 0   }}
      transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 28 }}
      className="absolute top-3 left-1/2 z-20 -translate-x-1/2 select-none"
    >
      {/* ── Pill ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position:             "relative",
          overflow:             "hidden",
          width:                PILL_W,
          height:               PILL_H,
          borderRadius:         PILL_H,
          background:           "rgba(7,7,18,0.76)",
          backdropFilter:       "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border:               "1px solid rgba(255,255,255,0.08)",
          boxShadow:            "0 2px 16px rgba(0,0,0,0.50)",
        }}
      >
        {/* Ribbon — transform applied via DOM ref only */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div
            ref={ribbonRef}
            style={{
              position:   "absolute",
              top:        0,
              left:       0,
              width:      REPS * 360 * PX_PER_DEG,
              height:     "100%",
              transform:  `translateX(${PILL_CX - RIBBON_ANCHOR}px)`,
              willChange: "transform",
            }}
          >
            {ticks}
          </div>
        </div>

        {/* Edge fade */}
        <div
          style={{
            position:      "absolute",
            inset:         0,
            pointerEvents: "none",
            background:
              "linear-gradient(to right," +
              " rgba(7,7,18,0.95) 0%," +
              " rgba(7,7,18,0.42) 16%," +
              " transparent       32%," +
              " transparent       68%," +
              " rgba(7,7,18,0.42) 84%," +
              " rgba(7,7,18,0.95) 100%)",
          }}
        />

        {/* Centre hairline */}
        <div
          style={{
            position:      "absolute",
            top:           0,
            bottom:        0,
            left:          "50%",
            width:         1,
            transform:     "translateX(-50%)",
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom," +
              " transparent 0%," +
              " rgba(255,255,255,0.28) 25%," +
              " rgba(255,255,255,0.50) 50%," +
              " rgba(255,255,255,0.28) 75%," +
              " transparent 100%)",
          }}
        />
      </div>

      {/* Pointer triangle */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width:       0,
            height:      0,
            borderLeft:  "3px solid transparent",
            borderRight: "3px solid transparent",
            borderTop:   "4px solid rgba(255,255,255,0.18)",
          }}
        />
      </div>

    </motion.div>
  );
}
