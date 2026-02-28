"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { GameHUD } from "@/components/game/game-hud";
import { StreetView } from "@/components/game/street-view";
import { MiniMap } from "@/components/game/mini-map";
import { CompassHUD } from "@/components/game/compass-hud";
import { Confetti } from "@/components/game/confetti";
import { ResultPanel } from "@/components/game/result-panel";
import { ResultsModal } from "@/components/results/results-modal";
import { useGameStore } from "@/stores/game-store";
import { usePlayerInit } from "@/hooks/use-player-init";
import type { GameMode } from "@/types/game";

function GameContent() {
  // Load player progression from Supabase on mount (if authenticated)
  usePlayerInit();
  const searchParams = useSearchParams();
  const phase = useGameStore((s) => s.phase);
  const startGame = useGameStore((s) => s.startGame);
  const selectedCountryId = useGameStore((s) => s.selectedCountryId);

  // Track the country from the URL so we can detect changes
  const mode = (searchParams.get("mode") as GameMode) || "classic";
  const country = searchParams.get("country") ?? undefined;
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Start a new game if:
    // 1. We're in the menu phase (fresh load), OR
    // 2. The URL country changed from what the store has (user switched countries)
    const countryChanged =
      mode === "campaign" &&
      country !== undefined &&
      selectedCountryId !== null &&
      country !== selectedCountryId;

    if (phase === "menu" || countryChanged || !hasStartedRef.current) {
      hasStartedRef.current = true;
      startGame(mode, country);
    }
  }, [searchParams, phase, startGame, mode, country, selectedCountryId]);

  if (phase === "menu") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      <GameHUD />
      {/* Relative wrapper so absolute overlays (compass, map, modals)
          are positioned from the HUD bottom edge, not the viewport top */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <StreetView />
        <CompassHUD />
        <MiniMap />
        <Confetti />
        <ResultPanel />
        <ResultsModal />
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
