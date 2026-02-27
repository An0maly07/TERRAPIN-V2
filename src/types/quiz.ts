import type { LucideIcon } from "lucide-react";

export interface QuizCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  /** OKLch hue for the accent color of this category card */
  hue: number;
}

export type RoulettePhase = "idle" | "spinning" | "landed";

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  funFact: string;
}

export type QuizPhase = "loading" | "answering" | "feedback" | "summary";

export interface QuizRoundResult {
  question: QuizQuestion;
  selectedIndex: number; // -1 means timeout
  isCorrect: boolean;
  timeSpent: number;
}
