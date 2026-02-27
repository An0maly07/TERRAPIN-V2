"use client";

import { motion } from "framer-motion";
import { useQuizStore } from "@/stores/quiz-store";

const LABELS = ["A", "B", "C", "D"] as const;

export function QuestionCard() {
  const question = useQuizStore((s) => s.currentQuestion);
  const categoryHue = useQuizStore((s) => s.categoryHue);
  const timer = useQuizStore((s) => s.timer);
  const timePerRound = useQuizStore((s) => s.timePerRound);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);

  if (!question) return null;

  const progress = timer / timePerRound;
  const accentColor = `oklch(0.65 0.2 ${categoryHue})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="glass w-full max-w-2xl rounded-2xl p-8"
    >
      {/* Timer bar */}
      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: accentColor }}
          initial={{ width: "100%" }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <h2 className="mb-8 text-center text-xl font-bold leading-relaxed text-white">
        {question.question}
      </h2>

      {/* Options grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.08 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectAnswer(index)}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08]"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
              style={{
                background: `oklch(0.65 0.2 ${categoryHue} / 0.15)`,
                color: accentColor,
              }}
            >
              {LABELS[index]}
            </span>
            <span className="pt-0.5 text-sm font-medium text-white/90">
              {option}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
