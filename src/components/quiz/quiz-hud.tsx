"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Zap } from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";

export function QuizHUD() {
  const router = useRouter();
  const phase = useQuizStore((s) => s.phase);
  const currentRound = useQuizStore((s) => s.currentRound);
  const totalRounds = useQuizStore((s) => s.totalRounds);
  const score = useQuizStore((s) => s.score);
  const streak = useQuizStore((s) => s.streak);
  const timer = useQuizStore((s) => s.timer);
  const categoryLabel = useQuizStore((s) => s.categoryLabel);
  const categoryHue = useQuizStore((s) => s.categoryHue);
  const tickTimer = useQuizStore((s) => s.tickTimer);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "answering") {
      intervalRef.current = setInterval(() => tickTimer(), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, tickTimer]);

  const handleExit = () => {
    resetQuiz();
    router.push("/");
  };

  const accentColor = `oklch(0.65 0.2 ${categoryHue})`;

  if (phase === "summary") return null;

  return (
    <div className="glass fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-3">
      {/* Left: Round + Category */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-white/70">
          Round {currentRound}/{totalRounds}
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
          style={{
            background: `oklch(0.65 0.2 ${categoryHue} / 0.15)`,
            color: accentColor,
            border: `1px solid oklch(0.65 0.2 ${categoryHue} / 0.3)`,
          }}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Center: Timer */}
      <div className="flex items-center gap-2">
        <span
          className="min-w-[48px] text-center text-2xl font-extrabold tabular-nums"
          style={{ color: timer <= 5 ? "#f87171" : "white" }}
        >
          {timer}
        </span>
      </div>

      {/* Right: Score + Streak + Exit */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-white/70">
          {score}/{totalRounds}
        </span>
        {streak > 1 && (
          <span className="flex items-center gap-1 text-sm font-bold text-amber-400">
            <Zap size={14} />
            {streak}
          </span>
        )}
        <button
          onClick={handleExit}
          className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
