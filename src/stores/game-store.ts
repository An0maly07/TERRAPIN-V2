import { create } from "zustand";
import type { GameMode, GamePhase, Position, RoundResult } from "@/types/game";
import { DEMO_LOCATIONS, MAX_SCORE_PER_ROUND, SCORE_DECAY_FACTOR } from "@/lib/constants";

interface GameState {
  mode: GameMode;
  totalRounds: number;
  timePerRound: number;
  currentRound: number;
  phase: GamePhase;
  score: number;
  streak: number;
  timer: number;
  actualPosition: Position | null;
  guessPosition: Position | null;
  rounds: RoundResult[];

  startGame: (mode: GameMode) => void;
  setGuessPosition: (pos: Position) => void;
  submitGuess: () => void;
  nextRound: () => void;
  tickTimer: () => void;
  resetGame: () => void;
}

function calculateScore(distanceKm: number): number {
  return Math.max(
    0,
    Math.round(MAX_SCORE_PER_ROUND * Math.exp(-distanceKm / SCORE_DECAY_FACTOR))
  );
}

function haversineDistance(a: Position, b: Position): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getRandomLocation(): Position {
  const loc = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
  return { lat: loc.lat, lng: loc.lng };
}

function getRoundsForMode(mode: GameMode): number {
  switch (mode) {
    case "classic":
      return 5;
    case "duel":
      return 5;
    case "streaks":
      return 999;
  }
}

function getTimeForMode(mode: GameMode): number {
  switch (mode) {
    case "classic":
      return 120;
    case "duel":
      return 60;
    case "streaks":
      return 30;
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: "classic",
  totalRounds: 5,
  timePerRound: 120,
  currentRound: 1,
  phase: "menu",
  score: 0,
  streak: 0,
  timer: 120,
  actualPosition: null,
  guessPosition: null,
  rounds: [],

  startGame: (mode) => {
    const timePerRound = getTimeForMode(mode);
    set({
      mode,
      phase: "guessing",
      currentRound: 1,
      totalRounds: getRoundsForMode(mode),
      timePerRound,
      score: 0,
      streak: 0,
      timer: timePerRound,
      rounds: [],
      actualPosition: getRandomLocation(),
      guessPosition: null,
    });
  },

  setGuessPosition: (pos) => set({ guessPosition: pos }),

  submitGuess: () => {
    const { guessPosition, actualPosition, timer, timePerRound, score, rounds, streak } =
      get();
    if (!guessPosition || !actualPosition) return;

    const distanceKm = haversineDistance(guessPosition, actualPosition);
    const roundScore = calculateScore(distanceKm);
    const newStreak = roundScore > 2500 ? streak + 1 : 0;

    const result: RoundResult = {
      guessPosition,
      actualPosition,
      distanceKm,
      score: roundScore,
      timeSpent: timePerRound - timer,
    };

    set({
      phase: "result",
      score: score + roundScore,
      streak: newStreak,
      rounds: [...rounds, result],
    });
  },

  nextRound: () => {
    const { currentRound, totalRounds, timePerRound } = get();
    if (currentRound >= totalRounds) {
      set({ phase: "summary" });
    } else {
      set({
        currentRound: currentRound + 1,
        phase: "guessing",
        timer: timePerRound,
        guessPosition: null,
        actualPosition: getRandomLocation(),
      });
    }
  },

  tickTimer: () => {
    const { timer } = get();
    if (timer > 0) {
      set({ timer: timer - 1 });
    } else {
      get().submitGuess();
    }
  },

  resetGame: () =>
    set({
      phase: "menu",
      currentRound: 1,
      score: 0,
      streak: 0,
      timer: 120,
      rounds: [],
      actualPosition: null,
      guessPosition: null,
    }),
}));
