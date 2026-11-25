"use client";

import { useState } from "react";
import { Camera, Send, Sparkles, CheckCircle, XCircle, RotateCcw, ArrowUpRight } from "lucide-react";
import { compressImageToBase64 } from "@/lib/image-compress";
import type { Language, TraceEvent, TutorFinalPayload } from "@/lib/types";
import { AgentTrace } from "./agent-trace";

interface StudentTutorProps {
  language: Language;
  studentId: string;
}

const QUICK_PROMPTS: Record<Language, string[]> = {
  en: [
    "Why don't action and reaction forces cancel out in Newton's third law?",
    "How do I solve quadratic equations like x² - 5x + 6 = 0?",
    "How does photosynthesis work in plant leaves?",
  ],
  hi: [
    "न्यूटन के तीसरे नियम में क्रिया और प्रतिक्रिया बल रद्द क्यों नहीं होते?",
    "द्विघात समीकरण x² - 5x + 6 = 0 कैसे हल करें?",
    "पौधों में प्रकाश संश्लेषण कैसे होता है?",
  ],
  kn: [
    "ನ್ಯೂಟನ್‌ನ ಮೂರನೇ ನಿಯಮದಲ್ಲಿ ಕ್ರಿಯೆ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಬಲಗಳು ಏಕೆ ರದ್ದಾಗುವುದಿಲ್ಲ?",
    "ವರ್ಗ ಸಮೀಕರಣ x² - 5x + 6 = 0 ಹೇಗೆ ಬಿಡಿಸುವುದು?",
    "ಸಸ್ಯಗಳಲ್ಲಿ ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಹೇಗೆ ನಡೆಯುತ್ತದೆ?",
  ],
};

export function StudentTutor({ language, studentId }: StudentTutorProps) {
  const [message, setMessage] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [result, setResult] = useState<TutorFinalPayload | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState<TutorFinalPayload["gradeResult"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function streamTutor(
    promptText: string,
    opts?: { isRetryEasier?: boolean; gradeResult?: TutorFinalPayload["gradeResult"] }
  ) {
    setIsRunning(true);
    setError(null);
    setTraces([]);
    setSelectedAnswers({});
    setGraded(null);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          message: promptText,
          language,
          imageBase64,
          isRetryEasier: opts?.isRetryEasier,
          gradeResult: opts?.gradeResult,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          const event = JSON.parse(jsonStr);
          if (event.type === "trace") {
            setTraces((prev) => [...prev, event as TraceEvent]);
          } else if (event.type === "final") {
            setResult(event.payload as TutorFinalPayload);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToBase64(file);
      setImageBase64(compressed);
    } catch {
      setError("Could not process image. Please try another photo.");
    }
  }

  function handleSubmitQuiz() {
    if (!result) return;
    let score = 0;
    const misconceptionsFound: string[] = [];

    for (const q of result.quiz) {
      const pickedId = selectedAnswers[q.id];
      const picked = q.options.find((o) => o.id === pickedId);
      if (picked?.isCorrect) {
        score += 1;
      } else if (picked?.misconception) {
        misconceptionsFound.push(picked.misconception);
      }
    }

    const total = result.quiz.length;
    const passed = score >= 2;
    const gradeResult: NonNullable<TutorFinalPayload["gradeResult"]> = {
      score,
      total,
      passed,
      misconceptionsFound,
      nextAction: passed ? "level_up" : "retry_easier",
    };
    setGraded(gradeResult);
  }

  return (
    <div className="space-y-4">
      {/* Quick Demo Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS[language].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setMessage(q);
              void streamTutor(q);
            }}
            disabled={isRunning}
            className="min-h-[44px] rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-xs font-medium text-indigo-800 transition active:scale-[0.99] disabled:opacity-50 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200"
          >
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            {q}
          </button>
        ))}
      </div>

      {/* Doubt Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim() || isRunning) return;
          void streamTutor(message.trim());
        }}
        className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask any science or math doubt..."
          className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <div className="flex items-center gap-2">
          <label className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Camera className="h-5 w-5" />
            <span className="sr-only">Upload or capture homework photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
          <button
            type="submit"
            disabled={isRunning || !message.trim()}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-base font-semibold text-white disabled:opacity-50 sm:flex-none"
          >
            <Send className="h-4 w-4" />
            <span>Ask Tutor</span>
          </button>
        </div>
      </form>

      {imageBase64 && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
          <span>Homework image compressed (&lt;1 MB) and attached.</span>
          <button
            type="button"
            onClick={() => setImageBase64(undefined)}
            className="min-h-[44px] px-2 font-semibold underline"
          >
            Remove
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      <AgentTrace traces={traces} isRunning={isRunning} />

      {result && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{result.topic}</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                {result.difficulty}
              </span>
              {result.demoMode && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  Demo Fixture
                </span>
              )}
            </div>
          </div>

          {result.prerequisiteGap && (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <strong>Prerequisite Check:</strong> {result.prerequisiteGap}
            </p>
          )}

          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">{result.explanation}</p>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-sm text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-100">
            <strong>Analogy:</strong> {result.analogy}
          </div>

          {/* 3-MCQ Quiz */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-semibold">Quick Check (Pass: 2 of 3)</h3>
            {result.quiz.map((q, qIdx) => (
              <div key={q.id} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-sm font-medium">
                  {qIdx + 1}. {q.question}
                </p>
                <div className="grid gap-2">
                  {q.options.map((opt) => {
                    const isSelected = selectedAnswers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={Boolean(graded)}
                        onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                        className={`min-h-[44px] rounded-xl border px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-100"
                            : "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                        }`}
                      >
                        <span className="mr-2 font-bold">{opt.id}.</span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
                {graded && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}

            {!graded ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(selectedAnswers).length < result.quiz.length}
                className="min-h-[44px] w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-50"
              >
                Submit Answers
              </button>
            ) : (
              <div
                className={`space-y-3 rounded-xl border p-4 ${
                  graded.passed
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                    : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {graded.passed ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-amber-600" />
                  )}
                  <span>
                    Score: {graded.score}/{graded.total} —{" "}
                    {graded.passed ? "Passed! Ready for next level." : "Let's try a different analogy!"}
                  </span>
                </div>

                {graded.misconceptionsFound.length > 0 && (
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>Detected misconceptions:</strong> {graded.misconceptionsFound.join("; ")}
                  </p>
                )}

                {!graded.passed ? (
                  <button
                    type="button"
                    onClick={() => void streamTutor(message || result.topic, { isRetryEasier: true, gradeResult: graded })}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Re-explain with Different Analogy & Easier Quiz</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void streamTutor(`Next harder challenge on ${result.topic}`, { gradeResult: graded })}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Level Up Difficulty</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
