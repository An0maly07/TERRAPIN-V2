"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { QUIZ_CATEGORIES } from "./categories";
import type { QuizCategory, RoulettePhase } from "@/types/quiz";

const CARD_WIDTH = 160;
const CARD_GAP = 12;
const TOTAL_CARD_SLOT = CARD_WIDTH + CARD_GAP;
const TRACK_LENGTH = 90;
const WINNING_ZONE_START = 75;
const WINNING_ZONE_END = 85;
const SPIN_DURATION = 8;
const EASING: [number, number, number, number] = [0.15, 0.9, 0.25, 1];

export interface RouletteState {
  phase: RoulettePhase;
  track: QuizCategory[];
  translateX: number;
  winnerIndex: number;
  winner: QuizCategory | null;
  viewportWidth: number;
}

/** Fisher-Yates shuffle for uniform randomness */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTrack(): QuizCategory[] {
  const items: QuizCategory[] = [];
  while (items.length < TRACK_LENGTH) {
    const shuffled = shuffle(QUIZ_CATEGORIES);
    for (const cat of shuffled) {
      if (items.length >= TRACK_LENGTH) break;
      if (items.length > 0 && items[items.length - 1].id === cat.id) continue;
      items.push(cat);
    }
  }
  return items;
}

export function useRoulette() {
  const [state, setState] = useState<RouletteState>({
    phase: "idle",
    track: [],
    translateX: 0,
    winnerIndex: -1,
    winner: null,
    viewportWidth: 800,
  });

  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setState((prev) => ({
        ...prev,
        viewportWidth: entry.contentRect.width,
      }));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const spin = useCallback(() => {
    if (state.phase === "spinning") return;

    const track = buildTrack();
    const winnerIndex =
      WINNING_ZONE_START +
      Math.floor(Math.random() * (WINNING_ZONE_END - WINNING_ZONE_START));

    const vpWidth = viewportRef.current?.offsetWidth ?? 800;

    const centerOffset =
      -(winnerIndex * TOTAL_CARD_SLOT) -
      TOTAL_CARD_SLOT / 2 +
      vpWidth / 2;

    const randomOffset = (Math.random() * 0.8 - 0.4) * CARD_WIDTH;
    const finalTranslateX = centerOffset + randomOffset;

    setState({
      phase: "spinning",
      track,
      translateX: finalTranslateX,
      winnerIndex,
      winner: track[winnerIndex],
      viewportWidth: vpWidth,
    });

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        phase: "landed",
      }));
    }, SPIN_DURATION * 1000 + 200);
  }, [state.phase]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "idle",
      translateX: 0,
      winner: null,
      winnerIndex: -1,
    }));
  }, []);

  return {
    state,
    viewportRef,
    spin,
    reset,
    CARD_WIDTH,
    CARD_GAP,
    TOTAL_CARD_SLOT,
    SPIN_DURATION,
    EASING,
  } as const;
}
