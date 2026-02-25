"use client";

import { useRouter } from "next/navigation";
import { Globe, Swords, Flame } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import type { GameModeConfig } from "@/types/game";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Globe,
  Swords,
  Flame,
};

interface GameModeCardProps {
  config: GameModeConfig;
}

export function GameModeCard({ config }: GameModeCardProps) {
  const router = useRouter();
  const Icon = iconMap[config.icon] || Globe;

  return (
    <GlassCard
      className="flex flex-col gap-4 transition-all duration-300 hover:border-primary/30"
      onClick={() => router.push(`/game?mode=${config.id}`)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Icon size={24} className="text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground">{config.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
      </div>
      <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
        {config.rounds < 999 && <span>{config.rounds} rounds</span>}
        <span>{config.timePerRound}s per round</span>
      </div>
    </GlassCard>
  );
}
