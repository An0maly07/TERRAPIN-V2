"use client";

import { motion } from "framer-motion";
import { Check, X, MapPin, Lightbulb } from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";

const LABELS = ["A", "B", "C", "D"] as const;

export function QuizFeedback() {
  const rounds = useQuizStore((s) => s.rounds);
  const currentRound = useQuizStore((s) => s.currentRound);
  const totalRounds = useQuizStore((s) => s.totalRounds);
  const categoryHue = useQuizStore((s) => s.categoryHue);
  const nextRound = useQuizStore((s) => s.nextRound);

  const lastRound = rounds[rounds.length - 1];
  if (!lastRound) return null;

  const { question, selectedIndex, isCorrect } = lastRound;
  const isTimeout = selectedIndex === -1;
  const isLastRound = currentRound >= totalRounds;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="glass w-full max-w-2xl rounded-2xl p-8"
    >
      {/* Result icon */}
      <div className="mb-6 flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            isCorrect
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {isCorrect ? <Check size={32} /> : <X size={32} />}
        </motion.div>
      </div>

      <h3 className="mb-2 text-center text-lg font-bold text-white">
        {isTimeout ? "Time\u2019s Up!" : isCorrect ? "Correct!" : "Incorrect"}
      </h3>

      {/* Question text */}
      <p className="mb-6 text-center text-sm text-white/50">{question.question}</p>

      {/* Options with highlights */}
      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isCorrectOption = index === question.correctAnswerIndex;
          const isUserPick = index === selectedIndex;

          let borderColor = "border-white/5";
          let bg = "bg-white/[0.02]";
          let textColor = "text-white/30";

          if (isCorrectOption) {
            borderColor = "border-emerald-500/50";
            bg = "bg-emerald-500/10";
            textColor = "text-emerald-300";
          } else if (isUserPick && !isCorrect) {
            borderColor = "border-red-500/50";
            bg = "bg-red-500/10";
            textColor = "text-red-300";
          }

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.06 }}
              className={`flex items-start gap-3 rounded-xl border p-3 ${borderColor} ${bg}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  isCorrectOption
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isUserPick && !isCorrect
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/5 text-white/20"
                }`}
              >
                {LABELS[index]}
              </span>
              <span className={`pt-0.5 text-sm font-medium ${textColor}`}>
                {option}
              </span>
              {isCorrectOption && (
                <Check size={14} className="ml-auto shrink-0 text-emerald-400" />
              )}
              {isUserPick && !isCorrect && (
                <X size={14} className="ml-auto shrink-0 text-red-400" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Fun fact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
      >
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Lightbulb size={14} />
          Fun Fact
        </div>
        <p className="text-sm leading-relaxed text-white/70">
          {question.funFact}
        </p>
      </motion.div>

      {/* Coordinates */}
      <div className="mb-6 flex items-center justify-center gap-1 text-xs text-white/30">
        <MapPin size={12} />
        {question.coordinates.lat.toFixed(4)}, {question.coordinates.lng.toFixed(4)}
      </div>

      {/* Next button */}
      <div className="flex justify-center">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={nextRound}
          className="rounded-xl px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
          style={{
            background: `oklch(0.65 0.2 ${categoryHue})`,
            boxShadow: `0 0 20px oklch(0.65 0.2 ${categoryHue} / 0.3)`,
          }}
        >
          {isLastRound ? "View Results" : "Next Question"}
        </motion.button>
      </div>
    </motion.div>
  );
}
