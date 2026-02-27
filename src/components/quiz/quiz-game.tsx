"use client";

import { AnimatePresence } from "framer-motion";
import { useQuizStore } from "@/stores/quiz-store";
import { QuizHUD } from "./quiz-hud";
import { QuizLoading } from "./quiz-loading";
import { QuestionCard } from "./question-card";
import { QuizFeedback } from "./quiz-feedback";
import { QuizSummary } from "./quiz-summary";

export function QuizGame() {
  const phase = useQuizStore((s) => s.phase);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <QuizHUD />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-8 pt-20">
        <AnimatePresence mode="wait">
          {phase === "loading" && <QuizLoading key="loading" />}
          {phase === "answering" && <QuestionCard key="answering" />}
          {phase === "feedback" && <QuizFeedback key="feedback" />}
          {phase === "summary" && <QuizSummary key="summary" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
