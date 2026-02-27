"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { GAME_MODES } from "@/lib/constants";
import { CampaignSelection } from "./campaign-selection";
import type { GameModeConfig } from "@/types/game";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Globe,
  Flame,
};

// Human-readable phase labels per mode id
const PHASE_LABELS: Record<string, string> = {
  classic: "OPERATIONAL PHASE 01",
  campaign: "MODE 02",
};

function ModeCard({
  config,
  index,
  onCampaign,
}: {
  config: GameModeConfig;
  index: number;
  onCampaign: () => void;
}) {
  const router = useRouter();
  const Icon = iconMap[config.icon] || Globe;
  const isClassic = config.id === "classic";

  // Derive badge list: prefer explicit config.badges, otherwise auto-generate
  const tags: string[] = config.badges
    ? config.badges
    : [
        ...(config.rounds < 999 ? [`${config.rounds} ROUNDS`] : []),
        ...(config.timePerRound > 0 ? [`${config.timePerRound}S TIMER`] : []),
      ];

  const handleClick = () => {
    if (config.id === "campaign") {
      onCampaign();
    } else {
      router.push(`/game?mode=${config.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={handleClick}
      className={cn(
        "group flex cursor-pointer flex-col rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300",
        "bg-card/75 shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1.5",
        isClassic
          ? "border-primary/10 hover:border-primary/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_oklch(0.65_0.2_265_/_0.1)]"
          : "border-accent/10 hover:border-accent/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_oklch(0.55_0.2_290_/_0.07)]"
      )}
    >
      {/* Phase tag */}
      <div
        className={cn(
          "mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
          isClassic ? "text-primary" : "text-accent"
        )}
      >
        <span className={cn("block h-0.5 w-5", isClassic ? "bg-primary" : "bg-accent")} />
        {PHASE_LABELS[config.id] ?? `MODE ${String(index + 1).padStart(2, "0")}`}
      </div>

      {/* Icon + Title */}
      <div className="mb-3 flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            isClassic ? "bg-primary/15" : "bg-accent/15"
          )}
        >
          <Icon size={23} className={isClassic ? "text-primary" : "text-accent"} />
        </div>
        <h2 className="text-[1.6rem] font-extrabold italic uppercase leading-tight text-white">
          {config.title}
        </h2>
      </div>

      {/* Description — allow 3 lines on the wider 2-card layout */}
      <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-white/60">
        {config.description}
      </p>

      {/* Badges */}
      <div className="mb-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/15 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white/50"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA Button */}
      <button
        className={cn(
          "shimmer mt-auto w-full rounded-lg py-3 text-sm font-extrabold uppercase tracking-wide transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isClassic
            ? "bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-[0_0_24px_oklch(0.65_0.2_265_/_0.45)]"
            : "border border-accent/60 bg-transparent text-accent hover:bg-accent/10"
        )}
        style={
          !isClassic
            ? {
                boxShadow:
                  "0 0 15px oklch(0.55 0.2 290 / 0.15), inset 0 0 15px oklch(0.55 0.2 290 / 0.08)",
              }
            : undefined
        }
      >
        {isClassic ? "START EXPEDITION" : "BEGIN CAMPAIGN"}
      </button>
    </motion.div>
  );
}

export function SingleplayerSelection() {
  const [showCampaign, setShowCampaign] = useState(false);

  if (showCampaign) {
    return <CampaignSelection onBack={() => setShowCampaign(false)} />;
  }

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
          Singleplayer
        </h1>
        <div className="mx-auto mt-2 mb-3 h-[3px] w-[120px] rounded-sm bg-primary shadow-[0_0_12px_oklch(0.65_0.2_265_/_0.55)]" />
        <p className="text-xs font-semibold italic uppercase tracking-widest text-white/50">
          Select your operational environment
        </p>
      </div>

      {/* 2-card centered grid */}
      <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2">
        {GAME_MODES.map((mode, i) => (
          <ModeCard
            key={mode.id}
            config={mode}
            index={i}
            onCampaign={() => setShowCampaign(true)}
          />
        ))}
      </div>
    </motion.div>
  );
}
