"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trophy, Zap, Check, X, Clock, RotateCcw } from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";

export function QuizSummary() {
  const router = useRouter();
  const score = useQuizStore((s) => s.score);
  const totalRounds = useQuizStore((s) => s.totalRounds);
  const bestStreak = useQuizStore((s) => s.bestStreak);
  const rounds = useQuizStore((s) => s.rounds);
  const categoryLabel = useQuizStore((s) => s.categoryLabel);
  const categoryHue = useQuizStore((s) => s.categoryHue);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);

  const percentage = Math.round((score / totalRounds) * 100);
  const accentColor = `oklch(0.65 0.2 ${categoryHue})`;

  const handlePlayAgain = () => {
    resetQuiz();
    router.push("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="glass w-full max-w-lg rounded-2xl p-8"
    >
      {/* Trophy */}
      <div className="mb-4 flex justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: `oklch(0.65 0.2 ${categoryHue} / 0.15)`,
            boxShadow: `0 0 30px oklch(0.65 0.2 ${categoryHue} / 0.2)`,
          }}
        >
          <Trophy size={36} style={{ color: accentColor }} />
        </motion.div>
      </div>

      {/* Category + Quiz Complete */}
      <p className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-white/40">
        {categoryLabel}
      </p>
      <h2 className="mb-6 text-center text-2xl font-extrabold text-white">
        Quiz Complete
      </h2>

      {/* Score */}
      <div className="mb-6 flex items-center justify-center gap-8">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="block text-4xl font-extrabold tabular-nums"
            style={{ color: accentColor }}
          >
            {score}/{totalRounds}
          </motion.span>
          <span className="text-xs text-white/40">Correct</span>
        </div>
        <div className="h-12 w-px bg-white/10" />
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="block text-4xl font-extrabold tabular-nums text-white"
          >
            {percentage}%
          </motion.span>
          <span className="text-xs text-white/40">Accuracy</span>
        </div>
      </div>

      {/* Best Streak */}
      {bestStreak > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5"
        >
          <Zap size={14} className="text-amber-400" />
          <span className="text-sm font-bold text-amber-400">
            Best Streak: {bestStreak}
          </span>
        </motion.div>
      )}

      {/* Round breakdown */}
      <div className="mb-6 space-y-2">
        {rounds.map((round, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <span className="text-xs font-bold text-white/30">Q{i + 1}</span>
            {round.isCorrect ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <X size={14} className="text-red-400" />
            )}
            <span className="flex-1 truncate text-xs text-white/50">
              {round.question.question}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/25">
              <Clock size={10} />
              {round.timeSpent}s
            </span>
          </motion.div>
        ))}
      </div>

      {/* Play Again */}
      <div className="flex justify-center">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={handlePlayAgain}
          className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
          style={{
            background: accentColor,
            boxShadow: `0 0 20px oklch(0.65 0.2 ${categoryHue} / 0.3)`,
          }}
        >
          <RotateCcw size={16} />
          Play Again
        </motion.button>
      </div>
    </motion.div>
  );
}
