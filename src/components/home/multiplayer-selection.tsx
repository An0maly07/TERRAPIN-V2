"use client";

import { motion } from "framer-motion";
import { Wifi, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiplayerModeConfig {
  id: string;
  phaseLabel: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badges: string[];
  cta: string;
  isPrimary: boolean;
  comingSoon?: boolean;
}

const MULTIPLAYER_MODES: MultiplayerModeConfig[] = [
  {
    id: "lan",
    phaseLabel: "LOCAL NETWORK",
    title: "LAN Mode",
    icon: Wifi,
    description:
      "Play with friends on the same network. Host a private room and battle it out on shared WiFi — no account needed, just pure geography.",
    badges: ["UP TO 4 PLAYERS", "LOCAL NETWORK"],
    cta: "HOST GAME",
    isPrimary: true,
    comingSoon: true,
  },
  {
    id: "duel",
    phaseLabel: "MODE 02",
    title: "Duel",
    icon: Swords,
    description:
      "Go head-to-head against a single opponent online. Race to pin the location first and claim victory round by round in ranked or casual play.",
    badges: ["1V1", "ONLINE", "RANKED"],
    cta: "FIND OPPONENT",
    isPrimary: false,
    comingSoon: true,
  },
];

function MultiplayerCard({
  config,
  index,
}: {
  config: MultiplayerModeConfig;
  index: number;
}) {
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "group relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300",
        "bg-card/75 shadow-[0_10px_40px_rgba(0,0,0,0.5)]",
        config.comingSoon
          ? "cursor-default opacity-80"
          : "cursor-pointer hover:-translate-y-1.5",
        config.isPrimary
          ? "border-primary/10 hover:border-primary/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_oklch(0.65_0.2_265_/_0.1)]"
          : "border-accent/10 hover:border-accent/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_oklch(0.55_0.2_290_/_0.07)]"
      )}
    >
      {/* Coming Soon ribbon */}
      {config.comingSoon && (
        <div className="absolute top-4 right-4">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
            Coming Soon
          </span>
        </div>
      )}

      {/* Phase tag */}
      <div
        className={cn(
          "mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
          config.isPrimary ? "text-primary" : "text-accent"
        )}
      >
        <span
          className={cn("block h-0.5 w-5", config.isPrimary ? "bg-primary" : "bg-accent")}
        />
        {config.phaseLabel}
      </div>

      {/* Icon + Title */}
      <div className="mb-3 flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300",
            !config.comingSoon && "group-hover:scale-110",
            config.isPrimary ? "bg-primary/15" : "bg-accent/15"
          )}
        >
          <Icon size={23} className={config.isPrimary ? "text-primary" : "text-accent"} />
        </div>
        <h2 className="text-[1.6rem] font-extrabold italic uppercase leading-tight text-white">
          {config.title}
        </h2>
      </div>

      {/* Description */}
      <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-white/60">
        {config.description}
      </p>

      {/* Badges */}
      <div className="mb-5 flex flex-wrap gap-2">
        {config.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-white/15 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white/50"
          >
            {badge}
          </span>
        ))}
      </div>

      {/* CTA Button */}
      <button
        disabled={config.comingSoon}
        className={cn(
          "shimmer mt-auto w-full rounded-lg py-3 text-sm font-extrabold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          config.comingSoon
            ? "cursor-not-allowed opacity-40"
            : "hover:scale-[1.02]",
          config.isPrimary
            ? "bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-[0_0_24px_oklch(0.65_0.2_265_/_0.45)]"
            : "border border-accent/60 bg-transparent text-accent hover:bg-accent/10"
        )}
        style={
          !config.isPrimary
            ? {
                boxShadow:
                  "0 0 15px oklch(0.55 0.2 290 / 0.15), inset 0 0 15px oklch(0.55 0.2 290 / 0.08)",
              }
            : undefined
        }
      >
        {config.comingSoon ? "IN DEVELOPMENT" : config.cta}
      </button>
    </motion.div>
  );
}

export function MultiplayerSelection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex w-full max-w-[760px] flex-col items-center text-white"
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-balance text-5xl font-extrabold italic uppercase tracking-wide">
          Multiplayer
        </h1>
        <div className="mx-auto mt-2 mb-3 h-[3px] w-[120px] rounded-sm bg-accent shadow-[0_0_12px_oklch(0.55_0.2_290_/_0.55)]" />
        <p className="text-xs font-semibold italic uppercase tracking-widest text-white/50">
          Challenge friends &amp; rivals
        </p>
      </div>

      {/* 2-card centered grid */}
      <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2">
        {MULTIPLAYER_MODES.map((mode, i) => (
          <MultiplayerCard key={mode.id} config={mode} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
