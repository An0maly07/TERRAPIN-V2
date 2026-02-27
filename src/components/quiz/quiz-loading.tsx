"use client";

import { motion } from "framer-motion";
import { useQuizStore } from "@/stores/quiz-store";

export function QuizLoading() {
  const error = useQuizStore((s) => s.error);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const category = useQuizStore((s) => s.category);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center gap-4"
    >
      {error ? (
        <>
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => startQuiz(category)}
            className="rounded-lg bg-white/10 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-white/50">Generating question...</p>
        </>
      )}
    </motion.div>
  );
}
