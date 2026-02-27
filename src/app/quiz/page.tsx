"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { QuizGame } from "@/components/quiz/quiz-game";
import { useQuizStore } from "@/stores/quiz-store";

function QuizContent() {
  const searchParams = useSearchParams();
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const hasStartedRef = useRef(false);

  const category = searchParams.get("category") ?? "general-knowledge";

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startQuiz(category);
    }
  }, [category, startQuiz]);

  return <QuizGame />;
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
