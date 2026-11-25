"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion, TutorFinalPayload } from "@/lib/types";

interface QuizCardProps {
  questions: QuizQuestion[];
  onGrade: (result: NonNullable<TutorFinalPayload["gradeResult"]>) => void;
  disabled?: boolean;
}

export function QuizCard({ questions, onGrade, disabled }: QuizCardProps) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [gradedResult, setGradedResult] = useState<NonNullable<TutorFinalPayload["gradeResult"]> | null>(null);

  const allAnswered = questions.every((q) => selected[q.id]);

  function handleSubmit() {
    if (!allAnswered || submitted) return;
    let score = 0;
    const misconceptionsFound: string[] = [];

    for (const q of questions) {
      const pickedId = selected[q.id];
      const picked = q.options.find((o) => o.id === pickedId);
      if (picked?.isCorrect) {
        score += 1;
      } else if (picked?.misconception) {
        misconceptionsFound.push(picked.misconception);
      }
    }
    const passed = score >= 2;
    const result: NonNullable<TutorFinalPayload["gradeResult"]> = {
      score,
      total: questions.length,
      passed,
      misconceptionsFound,
      nextAction: passed ? "level_up" : "retry_easier",
    };
    setGradedResult(result);
    setSubmitted(true);
    onGrade(result);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold">Quick Check</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Pass: 2 of 3
        </span>
      </div>

      {questions.map((q, qIdx) => {
        const pickedId = selected[q.id];

        return (
          <div
            key={q.id}
            className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <p className="text-sm font-medium leading-snug">
              <span className="mr-1 font-bold text-indigo-600 dark:text-indigo-400">{qIdx + 1}.</span>
              {q.question}
            </p>

            <div className="grid gap-2">
              {q.options.map((opt) => {
                const isSelected = pickedId === opt.id;
                let stateClass = "";
                if (submitted) {
                  if (opt.isCorrect) {
                    stateClass =
                      "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40";
                  } else if (isSelected && !opt.isCorrect) {
                    stateClass =
                      "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/40";
                  }
                } else if (isSelected) {
                  stateClass =
                    "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/60";
                }

                return (
                  <div key={opt.id} className="space-y-1">
                    <button
                      type="button"
                      disabled={submitted || disabled}
                      onClick={() => setSelected((prev) => ({ ...prev, [q.id]: opt.id }))}
                      className={cn(
                        "min-h-[44px] w-full rounded-xl border px-3 py-2 text-left text-sm transition disabled:cursor-default",
                        stateClass ||
                          "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200",
                        !submitted && !isSelected && "hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 font-bold text-slate-500">{opt.id}.</span>
                        <span className="flex-1">{opt.text}</span>
                        {submitted && opt.isCorrect && (
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                        {submitted && isSelected && !opt.isCorrect && (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        )}
                      </div>
                    </button>

                    {/* Per-option explanation after submission */}
                    {submitted && isSelected && !opt.isCorrect && opt.misconception && (
                      <p className="ml-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        ⚠ Misconception: {opt.misconception}
                      </p>
                    )}
                    {submitted && opt.isCorrect && isSelected && (
                      <p className="ml-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        ✓ {q.explanation}
                      </p>
                    )}
                    {submitted && opt.isCorrect && !isSelected && (
                      <p className="ml-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || disabled}
          className="min-h-[44px] w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Submit Answers
        </button>
      )}

      {submitted && gradedResult && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold",
            gradedResult.passed
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          )}
        >
          {gradedResult.passed ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-amber-600" />
          )}
          <span>
            {gradedResult.score}/{gradedResult.total} —{" "}
            {gradedResult.passed
              ? "Excellent! Ready to level up."
              : "Let's try a different way!"}
          </span>
        </div>
      )}
    </div>
  );
}
