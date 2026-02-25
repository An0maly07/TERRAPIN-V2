"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GameHUD } from "@/components/game/game-hud";
import { StreetView } from "@/components/game/street-view";
import { MiniMap } from "@/components/game/mini-map";
import { GuessSheet } from "@/components/game/guess-sheet";
import { Confetti } from "@/components/game/confetti";
import { ResultsModal } from "@/components/results/results-modal";
import { useGameStore } from "@/stores/game-store";
import type { GameMode } from "@/types/game";

function GameContent() {
  const searchParams = useSearchParams();
  const phase = useGameStore((s) => s.phase);
  const startGame = useGameStore((s) => s.startGame);

  useEffect(() => {
    const mode = (searchParams.get("mode") as GameMode) || "classic";
    if (phase === "menu") {
      startGame(mode);
    }
  }, [searchParams, phase, startGame]);

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
      <StreetView />
      <MiniMap />
      <GuessSheet />
      <Confetti />
      <ResultsModal />
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
