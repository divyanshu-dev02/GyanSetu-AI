"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Flame,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { AgentTrace } from "@/components/agent-trace";
import { InputCard } from "@/components/input-card";
import { QuizCard } from "@/components/quiz-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { DifficultyLevel, Language, TraceEvent, TutorFinalPayload } from "@/lib/types";

const STUDENTS = [
  { id: "stu-aarav", name: "Aarav (Class 9)", preferredLanguage: "en" as Language, currentLevel: "standard" as DifficultyLevel, streak: 4 },
  { id: "stu-diya", name: "Diya (Class 9)", preferredLanguage: "hi" as Language, currentLevel: "simple" as DifficultyLevel, streak: 2 },
  { id: "stu-karthik", name: "Karthik (Class 10)", preferredLanguage: "kn" as Language, currentLevel: "advanced" as DifficultyLevel, streak: 7 },
];

const LANG_LABELS: Record<Language, string> = { en: "English", hi: "हिन्दी", kn: "ಕನ್ನಡ" };

const QUICK_PROMPTS: Record<Language, string[]> = {
  en: [
    "Why don't action and reaction forces cancel in Newton's third law?",
    "How do I solve x² - 5x + 6 = 0 by factoring?",
    "How does photosynthesis work in plant leaves?",
  ],
  hi: [
    "न्यूटन के तीसरे नियम में क्रिया-प्रतिक्रिया बल रद्द क्यों नहीं होते?",
    "द्विघात समीकरण x² - 5x + 6 = 0 कैसे हल करें?",
    "पत्तियों में प्रकाश संश्लेषण कैसे होता है?",
  ],
  kn: [
    "ನ್ಯೂಟನ್‌ನ ಮೂರನೇ ನಿಯಮದಲ್ಲಿ ಕ್ರಿಯೆ-ಪ್ರತಿಕ್ರಿಯೆ ಬಲಗಳು ಏಕೆ ರದ್ದಾಗುವುದಿಲ್ಲ?",
    "ವರ್ಗ ಸಮೀಕರಣ x² - 5x + 6 = 0 ಅನ್ನು ಹೇಗೆ ಬಿಡಿಸುವುದು?",
    "ಸಸ್ಯಗಳ ಎಲೆಗಳಲ್ಲಿ ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಹೇಗೆ ನಡೆಯುತ್ತದೆ?",
  ],
};

const LEVEL_LABELS: Record<DifficultyLevel, { label: string; icon: React.ReactNode; desc: string }> = {
  simple: {
    label: "Simple",
    icon: <BookOpen className="h-4 w-4" />,
    desc: "Analogies and visuals, no jargon",
  },
  standard: {
    label: "Standard",
    icon: <Star className="h-4 w-4" />,
    desc: "Curriculum-level explanation + quiz",
  },
  advanced: {
    label: "Advanced",
    icon: <Zap className="h-4 w-4" />,
    desc: "Deep dives, edge cases, extensions",
  },
};

// Demo scenario constants
const DEMO_DOUBT = "Why don't action and reaction forces cancel each other out in Newton's third law?";
const DEMO_FAIL_GRADE: NonNullable<TutorFinalPayload["gradeResult"]> = {
  score: 1,
  total: 3,
  passed: false,
  misconceptionsFound: ["Confuses mass with force cancellation"],
  nextAction: "retry_easier",
};

async function fetchSSE(
  body: Record<string, unknown>,
  onTrace: (t: TraceEvent) => void,
  onFinal: (p: TutorFinalPayload) => void,
  signal: AbortSignal
) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      const event = JSON.parse(json);
      if (event.type === "trace") onTrace(event as TraceEvent);
      else if (event.type === "final") onFinal(event.payload as TutorFinalPayload);
    }
  }
}

export function StudentPage() {
  const [studentId, setStudentId] = useState("stu-aarav");
  const [language, setLanguage] = useState<Language>("en");
  const [message, setMessage] = useState("");
  const [chosenLevel, setChosenLevel] = useState<DifficultyLevel>("standard");

  const [isRunning, setIsRunning] = useState(false);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [result, setResult] = useState<TutorFinalPayload | null>(null);
  const [gradedResult, setGradedResult] = useState<NonNullable<TutorFinalPayload["gradeResult"]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoScenario, setIsDemoScenario] = useState(false);
  const [demoPhase, setDemoPhase] = useState<"idle" | "first" | "retry">("idle");
  const abortRef = useRef<AbortController | null>(null);

  // Sync language to student's preferred language
  useEffect(() => {
    const stu = STUDENTS.find((s) => s.id === studentId);
    if (stu) {
      setLanguage(stu.preferredLanguage);
      setChosenLevel(stu.currentLevel);
    }
  }, [studentId]);

  async function runAgent(opts: {
    msg: string;
    img?: string;
    isRetryEasier?: boolean;
    grade?: NonNullable<TutorFinalPayload["gradeResult"]>;
  }) {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsRunning(true);
    setError(null);
    setTraces([]);
    setResult(null);
    setGradedResult(null);

    try {
      await fetchSSE(
        {
          studentId,
          message: opts.msg,
          language,
          imageBase64: opts.img,
          isRetryEasier: opts.isRetryEasier,
          gradeResult: opts.grade,
        },
        (t) => setTraces((prev) => [...prev, t]),
        (payload) => {
          setResult(payload);
          if (payload.difficulty) setChosenLevel(payload.difficulty);
        },
        ctrl.signal
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setIsRunning(false);
    }
  }

  async function handleRunDemo() {
    setIsDemoScenario(true);
    setDemoPhase("first");
    setMessage(DEMO_DOUBT);
    await runAgent({ msg: DEMO_DOUBT });
  }

  function handleDemoRetry() {
    setDemoPhase("retry");
    void runAgent({
      msg: DEMO_DOUBT,
      isRetryEasier: true,
      grade: DEMO_FAIL_GRADE,
    });
  }

  function handleUserSubmit(msg: string, img?: string) {
    setIsDemoScenario(false);
    setDemoPhase("idle");
    setMessage(msg);
    void runAgent({ msg, img });
  }

  function handleQuizGrade(grade: NonNullable<TutorFinalPayload["gradeResult"]>) {
    setGradedResult(grade);
    if (!grade.passed) {
      // Fire retry automatically in demo mode
      if (isDemoScenario && demoPhase === "first") {
        setTimeout(() => handleDemoRetry(), 800);
      }
    }
  }

  function handleRetryManual() {
    if (!result) return;
    setDemoPhase("retry");
    void runAgent({
      msg: message || result.topic,
      isRetryEasier: true,
      grade: gradedResult ?? DEMO_FAIL_GRADE,
    });
  }

  function handleLevelUp() {
    if (!result) return;
    void runAgent({ msg: `Challenge me on a harder ${result.topic} problem` });
  }

  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0];

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 lg:px-6">
      {/* ─── HEADER ─── */}
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 sm:text-xl">
            GyanSetu AI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your patient agentic tutor
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Student selector */}
          <Select
            label="Student"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="min-w-[160px]"
          >
            {STUDENTS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>

          {/* Language selector */}
          <Select
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            <option value="en">🇬🇧 English</option>
            <option value="hi">🇮🇳 हिन्दी</option>
            <option value="kn">🇮🇳 ಕನ್ನಡ</option>
          </Select>

          {/* Streak badge */}
          <div className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 dark:border-amber-800 dark:bg-amber-950/40">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {student.streak} day streak
            </span>
          </div>
        </div>
      </header>

      {/* ─── DEMO BUTTON ─── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleRunDemo}
          disabled={isRunning}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
        >
          <Sparkles className="h-4 w-4" />
          Run demo scenario (physics fail → retry)
        </button>
        {isDemoScenario && demoPhase !== "idle" && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
            Demo mode — simulating fail on first quiz
          </span>
        )}
      </div>

      {/* ─── MAIN CONTENT GRID ─── */}
      <div className="grid flex-1 grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">
          {/* Input Card */}
          <Card>
            <InputCard
              value={message}
              onChange={setMessage}
              language={language}
              onSubmit={handleUserSubmit}
              isRunning={isRunning}
              quickPrompts={QUICK_PROMPTS[language]}
            />
          </Card>

          {/* Mobile: trace accordion */}
          <div className="lg:hidden">
            <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Result area */}
          {result && (
            <div className="space-y-4">
              {/* Level tabs */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>{result.topic}</CardTitle>
                    {result.demoMode && (
                      <Badge variant="warning">Demo Fixture</Badge>
                    )}
                  </div>
                  {result.prerequisiteGap && (
                    <p className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      📚 <strong>Prerequisite gap detected:</strong> {result.prerequisiteGap}
                    </p>
                  )}
                </CardHeader>

                <Tabs defaultValue={result.difficulty}>
                  <TabsList className="mb-3">
                    {(["simple", "standard", "advanced"] as DifficultyLevel[]).map((lvl) => {
                      const info = LEVEL_LABELS[lvl];
                      const isRecommended = lvl === result.difficulty;
                      return (
                        <TabsTrigger key={lvl} value={lvl}>
                          <span className="flex items-center gap-1.5">
                            {info.icon}
                            <span className="hidden sm:inline">{info.label}</span>
                            {isRecommended && (
                              <span className="hidden rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white sm:inline">
                                ★ You
                              </span>
                            )}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {(["simple", "standard", "advanced"] as DifficultyLevel[]).map((lvl) => {
                    const info = LEVEL_LABELS[lvl];
                    const isRecommended = lvl === result.difficulty;
                    return (
                      <TabsContent key={lvl} value={lvl}>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={isRecommended ? "default" : "secondary"}>
                              {info.icon}
                              <span className="ml-1">{info.label}</span>
                            </Badge>
                            {isRecommended && (
                              <Badge variant="default">★ Recommended for you</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{info.desc}</p>
                          {/* Show explanation only for recommended level; others show a teaser */}
                          {isRecommended ? (
                            <>
                              <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                                {result.explanation}
                              </p>
                              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-sm text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-100">
                                <strong>💡 Analogy:</strong> {result.analogy}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs italic text-slate-400 dark:text-slate-500">
                              Submit your answer at the {result.difficulty} level first to unlock {lvl} content.
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </Card>

              {/* Quiz Card */}
              {result.quiz.length > 0 && (
                <Card>
                  <QuizCard
                    questions={result.quiz}
                    onGrade={handleQuizGrade}
                    disabled={isRunning}
                  />
                </Card>
              )}

              {/* Failure banner */}
              {gradedResult && !gradedResult.passed && !isRunning && (
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">
                      🔄 Let me try a different way
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                      I&apos;ll use a fresh analogy at a simpler level.
                      {gradedResult.misconceptionsFound.length > 0 && (
                        <> Detected: <em>{gradedResult.misconceptionsFound.join("; ")}</em></>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetryManual}
                    disabled={isRunning}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Re-explain differently
                  </button>
                </div>
              )}

              {/* Pass banner */}
              {gradedResult && gradedResult.passed && !isRunning && (
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-emerald-500" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">
                        Excellent! Ready to level up 🎉
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        You scored {gradedResult.score}/{gradedResult.total}. Try the next challenge!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLevelUp}
                    disabled={isRunning}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Level up
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: sticky trace (desktop only) ── */}
        <div className="hidden lg:block">
          <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile={false} />
        </div>
      </div>
    </div>
  );
}
