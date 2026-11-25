"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Trophy, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion, TutorFinalPayload } from "@/lib/types";

interface QuizCardProps {
  questions: QuizQuestion[];
  onGrade: (result: NonNullable<TutorFinalPayload["gradeResult"]>) => void;
  disabled?: boolean;
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const passed = score >= Math.ceil(total * 0.67);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6"
            className="text-slate-200 dark:text-slate-700" />
          <circle
            cx="36" cy="36" r={r} fill="none" strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className={passed ? "text-emerald-500" : "text-amber-500"}
            stroke="currentColor"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold leading-none text-slate-900 dark:text-white">{score}</span>
          <span className="text-[10px] text-slate-400">of {total}</span>
        </div>
      </div>
      <span className={cn(
        "text-xs font-semibold",
        passed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
      )}>
        {passed ? "Passed! 🎉" : "Try again"}
      </span>
    </div>
  );
}

function ConfettiPiece({ i }: { i: number }) {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#a855f7"];
  const color = colors[i % colors.length];
  const left = `${10 + (i * 13) % 80}%`;
  const delay = `${(i * 0.08).toFixed(2)}s`;
  return (
    <div
      className="pointer-events-none absolute top-0 h-2 w-2 rounded-sm"
      style={{
        left,
        backgroundColor: color,
        animation: `confetti 0.8s ${delay} ease-out forwards`,
      }}
    />
  );
}

export function QuizCard({ questions, onGrade, disabled }: QuizCardProps) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [gradedResult, setGradedResult] = useState<NonNullable<TutorFinalPayload["gradeResult"]> | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalQ = questions.length;
  const allAnswered = questions.every((q) => selected[q.id]);

  // Auto-advance to next question after picking
  function handlePick(qId: string, optId: string) {
    if (submitted || disabled) return;
    setSelected((prev) => ({ ...prev, [qId]: optId }));
    if (currentQ < totalQ - 1) {
      setTimeout(() => setCurrentQ((p) => Math.min(p + 1, totalQ - 1)), 350);
    }
  }

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
    const passed = score >= Math.ceil(totalQ * 0.67);
    const result: NonNullable<TutorFinalPayload["gradeResult"]> = {
      score, total: totalQ, passed, misconceptionsFound,
      nextAction: passed ? "level_up" : "retry_easier",
    };
    setGradedResult(result);
    setSubmitted(true);
    if (passed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    }
    setShowAll(true);
    onGrade(result);
  }

  // Reset if new questions arrive
  useEffect(() => {
    setSelected({});
    setSubmitted(false);
    setGradedResult(null);
    setCurrentQ(0);
    setShowAll(false);
    setShowConfetti(false);
  }, [questions]);

  const displayedQuestions = showAll ? questions : questions.slice(currentQ, currentQ + 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Check</h3>
        <div className="flex items-center gap-2">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {questions.map((q, i) => {
              const answered = !!selected[q.id];
              const isCurrent = i === currentQ && !submitted;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQ(i)}
                  aria-label={`Question ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200",
                    isCurrent ? "w-6 bg-indigo-600" :
                    answered ? "w-2 bg-emerald-500" :
                    "w-2 bg-slate-300 dark:bg-slate-600"
                  )}
                />
              );
            })}
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {submitted ? `${gradedResult?.score}/${totalQ}` : `Q${currentQ + 1}/${totalQ}`}
          </span>
        </div>
      </div>

      {/* Confetti overlay */}
      <div className="relative">
        {showConfetti && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden">
            {Array.from({ length: 12 }, (_, i) => <ConfettiPiece key={i} i={i} />)}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-3">
          {displayedQuestions.map((q, displayIdx) => {
            const qIdx = showAll ? displayIdx : currentQ;
            const pickedId = selected[q.id];

            return (
              <div
                key={q.id}
                className={cn(
                  "space-y-2 rounded-2xl border p-4 transition-all duration-200",
                  submitted
                    ? "border-slate-200 dark:border-slate-800"
                    : "border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/10"
                )}
              >
                <p className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                    {qIdx + 1}
                  </span>
                  {q.question}
                </p>

                <div className="grid gap-2">
                  {q.options.map((opt) => {
                    const isSelected = pickedId === opt.id;
                    let optClass = "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
                    if (submitted) {
                      if (opt.isCorrect) {
                        optClass = "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100";
                      } else if (isSelected) {
                        optClass = "border-red-400 bg-red-50 text-red-900 dark:border-red-600 dark:bg-red-950/40 dark:text-red-100";
                      } else {
                        optClass = "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-500 opacity-60";
                      }
                    } else if (isSelected) {
                      optClass = "border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-100";
                    }

                    return (
                      <div key={opt.id} className="space-y-1">
                        <button
                          type="button"
                          disabled={submitted || disabled}
                          onClick={() => handlePick(q.id, opt.id)}
                          className={cn(
                            "group min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-150",
                            optClass,
                            !submitted && !isSelected && "hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                              isSelected && !submitted ? "border-indigo-500 bg-indigo-500 text-white" :
                              submitted && opt.isCorrect ? "border-emerald-500 bg-emerald-500 text-white" :
                              submitted && isSelected ? "border-red-500 bg-red-500 text-white" :
                              "border-current text-current opacity-50"
                            )}>
                              {opt.id}
                            </span>
                            <span className="flex-1 leading-snug">{opt.text}</span>
                            {submitted && opt.isCorrect && (
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            )}
                            {submitted && isSelected && !opt.isCorrect && (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            )}
                          </div>
                        </button>

                        {/* Explanation pills */}
                        {submitted && isSelected && !opt.isCorrect && opt.misconception && (
                          <div className="ml-7 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            ⚠ Misconception: <strong>{opt.misconception}</strong>
                          </div>
                        )}
                        {submitted && opt.isCorrect && (
                          <div className="ml-7 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            ✓ {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Nav inside question */}
                {!submitted && !showAll && currentQ < totalQ - 1 && pickedId && (
                  <button
                    type="button"
                    onClick={() => setCurrentQ((p) => Math.min(p + 1, totalQ - 1))}
                    className="flex min-h-[36px] items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                  >
                    Next <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Show all / review button */}
      {!submitted && questions.length > 1 && (
        <button
          type="button"
          onClick={() => setShowAll((p) => !p)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {showAll ? "Show one at a time" : "Show all questions"}
        </button>
      )}

      {/* Submit */}
      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || disabled}
          className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-40 enabled:hover:shadow-md enabled:active:scale-[0.99]"
        >
          Submit Answers
        </button>
      )}

      {/* Score summary */}
      {submitted && gradedResult && (
        <div className={cn(
          "animate-confetti-pop flex flex-col items-center gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:gap-5",
          gradedResult.passed
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
            : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
        )}>
          <ScoreRing score={gradedResult.score} total={gradedResult.total} />
          <div className="flex-1 text-center sm:text-left">
            <p className={cn(
              "font-bold",
              gradedResult.passed ? "text-emerald-900 dark:text-emerald-200" : "text-amber-900 dark:text-amber-200"
            )}>
              {gradedResult.passed
                ? "Excellent work! You've mastered this concept."
                : "Good effort — let's approach this differently."}
            </p>
            {gradedResult.misconceptionsFound.length > 0 && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Detected: {gradedResult.misconceptionsFound.join(" · ")}
              </p>
            )}
            {gradedResult.passed && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                <Trophy className="h-3.5 w-3.5" />
                <span>Ready to level up!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
