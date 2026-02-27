import { create } from "zustand";
import type { QuizPhase, QuizQuestion, QuizRoundResult } from "@/types/quiz";
import { QUIZ_CATEGORIES } from "@/components/quiz/categories";

interface QuizState {
  category: string;
  categoryLabel: string;
  categoryHue: number;
  phase: QuizPhase;
  currentRound: number;
  totalRounds: number;
  score: number;
  streak: number;
  bestStreak: number;
  timer: number;
  timePerRound: number;
  currentQuestion: QuizQuestion | null;
  rounds: QuizRoundResult[];
  error: string | null;

  startQuiz: (categoryId: string) => void;
  selectAnswer: (optionIndex: number) => void;
  nextRound: () => void;
  tickTimer: () => void;
  resetQuiz: () => void;
}

const TIME_PER_ROUND = 20;
const TOTAL_ROUNDS = 5;

/** Generation counter — incremented on every new fetch to cancel stale requests */
let fetchGeneration = 0;

async function fetchQuestion(
  categoryLabel: string,
  generation: number
): Promise<{ data: QuizQuestion | null; error: string | null; generation: number }> {
  try {
    const res = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: categoryLabel }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        data: null,
        error: body.error ?? "Failed to generate question",
        generation,
      };
    }

    const data: QuizQuestion = await res.json();
    return { data, error: null, generation };
  } catch {
    return { data: null, error: "Network error", generation };
  }
}

export const useQuizStore = create<QuizState>()((set, get) => ({
  category: "",
  categoryLabel: "",
  categoryHue: 160,
  phase: "loading",
  currentRound: 1,
  totalRounds: TOTAL_ROUNDS,
  score: 0,
  streak: 0,
  bestStreak: 0,
  timer: TIME_PER_ROUND,
  timePerRound: TIME_PER_ROUND,
  currentQuestion: null,
  rounds: [],
  error: null,

  startQuiz: (categoryId) => {
    const cat = QUIZ_CATEGORIES.find((c) => c.id === categoryId);
    const label = cat?.label ?? "General Knowledge";
    const hue = cat?.hue ?? 145;
    const gen = ++fetchGeneration;

    set({
      category: categoryId,
      categoryLabel: label,
      categoryHue: hue,
      phase: "loading",
      currentRound: 1,
      totalRounds: TOTAL_ROUNDS,
      score: 0,
      streak: 0,
      bestStreak: 0,
      timer: TIME_PER_ROUND,
      currentQuestion: null,
      rounds: [],
      error: null,
    });

    fetchQuestion(label, gen).then(({ data, error, generation }) => {
      if (generation !== fetchGeneration) return;
      if (error || !data) {
        set({ error: error ?? "Unknown error", phase: "loading" });
      } else {
        set({ currentQuestion: data, phase: "answering", timer: TIME_PER_ROUND });
      }
    });
  },

  selectAnswer: (optionIndex) => {
    const { phase, currentQuestion, timer, timePerRound, score, streak, bestStreak, rounds } =
      get();
    if (phase !== "answering" || !currentQuestion) return;

    const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
    const newStreak = isCorrect ? streak + 1 : 0;

    const result: QuizRoundResult = {
      question: currentQuestion,
      selectedIndex: optionIndex,
      isCorrect,
      timeSpent: timePerRound - timer,
    };

    set({
      phase: "feedback",
      score: isCorrect ? score + 1 : score,
      streak: newStreak,
      bestStreak: Math.max(bestStreak, newStreak),
      rounds: [...rounds, result],
    });
  },

  nextRound: () => {
    const { currentRound, totalRounds, categoryLabel } = get();

    if (currentRound >= totalRounds) {
      set({ phase: "summary" });
      return;
    }

    const gen = ++fetchGeneration;
    set({
      currentRound: currentRound + 1,
      phase: "loading",
      currentQuestion: null,
      timer: TIME_PER_ROUND,
      error: null,
    });

    fetchQuestion(categoryLabel, gen).then(({ data, error, generation }) => {
      if (generation !== fetchGeneration) return;
      if (error || !data) {
        set({ error: error ?? "Unknown error", phase: "loading" });
      } else {
        set({ currentQuestion: data, phase: "answering", timer: TIME_PER_ROUND });
      }
    });
  },

  tickTimer: () => {
    const { timer, phase } = get();
    if (phase !== "answering") return;
    if (timer > 1) {
      set({ timer: timer - 1 });
    } else {
      set({ timer: 0 });
      // Auto-submit as timeout (-1)
      get().selectAnswer(-1);
    }
  },

  resetQuiz: () => {
    ++fetchGeneration;
    set({
      category: "",
      categoryLabel: "",
      categoryHue: 160,
      phase: "loading",
      currentRound: 1,
      score: 0,
      streak: 0,
      bestStreak: 0,
      timer: TIME_PER_ROUND,
      currentQuestion: null,
      rounds: [],
      error: null,
    });
  },
}));
