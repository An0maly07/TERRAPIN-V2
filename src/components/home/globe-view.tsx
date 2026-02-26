"use client";

import { motion } from "framer-motion";
import { Globe, MapPin, Trophy, Zap } from "lucide-react";
import { TerrapinLogo } from "@/components/shared/terrapin-logo";

const FEATURES = [
  { icon: MapPin, label: "Real Locations" },
  { icon: Trophy, label: "Scoreboards" },
  { icon: Zap, label: "Fast Rounds" },
];

export function GlobeView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3 }}
      className="relative flex flex-col items-center justify-center"
    >
      {/* Globe area */}
      <div className="relative flex h-[580px] w-[580px] items-center justify-center max-[767px]:h-[380px] max-[767px]:w-[380px] max-[480px]:h-[300px] max-[480px]:w-[300px]">
        {/* Subtle glow behind globe */}
        <div className="pointer-events-none absolute h-[280px] w-[280px] rounded-full bg-radial from-white/15 via-blue-400/10 to-transparent blur-[50px]" />

        {/* Outer ring pulses */}
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-[420px] w-[420px] rounded-full border border-primary/20 max-[767px]:h-[300px] max-[767px]:w-[300px]"
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="absolute h-[500px] w-[500px] rounded-full border border-primary/8 max-[767px]:h-[360px] max-[767px]:w-[360px]"
        />

        {/* Rotating globe background */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute flex items-center justify-center opacity-[0.07]"
        >
          <Globe size={400} strokeWidth={0.5} className="text-white max-[767px]:hidden" />
          <Globe size={260} strokeWidth={0.5} className="hidden text-white max-[767px]:block" />
        </motion.div>

        {/* Center content */}
        <div className="relative flex flex-col items-center gap-5">
          <TerrapinLogo size="lg" animated />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="max-w-[340px] text-center text-base leading-relaxed text-muted-foreground"
          >
            Drop into a random location. Look around. Pin it on the map.
          </motion.p>

          {/* Thin divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent"
          />

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="flex items-center gap-5"
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 + i * 0.1, duration: 0.3 }}
                  className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-white/30"
                >
                  <Icon size={11} className="text-primary/60" />
                  {f.label}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Bottom CTA hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/20"
      >
        Select a mode to begin
      </motion.p>
    </motion.div>
  );
}
