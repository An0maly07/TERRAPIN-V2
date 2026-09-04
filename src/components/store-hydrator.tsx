"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { useGameStore } from "@/stores/game-store";

/**
 * Rehydrates the persisted Zustand stores after mount.
 *
 * Both stores use `skipHydration: true`: without it, zustand/persist reads
 * localStorage synchronously during store creation, so the first client
 * render already shows a returning player's level/XP/campaign progress while
 * the server rendered the defaults — a hydration mismatch on every load.
 */
export function StoreHydrator() {
  useEffect(() => {
    void usePlayerStore.persist.rehydrate();
    void useGameStore.persist.rehydrate();
  }, []);
  return null;
}
