"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight, BookOpen, Flame, GraduationCap, Loader2,
  Plus, RotateCcw, Sparkles, Star, Trophy, Users, Zap, X,
} from "lucide-react";
import { AgentTrace } from "@/components/agent-trace";
import { InputCard } from "@/components/input-card";
import { QuizCard } from "@/components/quiz-card";
import { StudentProfileCard } from "@/components/student-profile-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  DifficultyLevel, Language, StudentProfile, TraceEvent, TutorFinalPayload,
} from "@/lib/types";

// ── Static seed data (matches data/students.json) ───────────────────────────
const STUDENTS: StudentProfile[] = [
  {
    id: "stu-aarav",
    name: "Aarav",
    grade: "Class 9",
    preferredLanguage: "en",
    currentLevel: "standard",
    masteredTopics: ["Force and Motion Basics", "Linear Equations"],
    weakTopics: ["Newton's Third Law", "Quadratic Equations"],
    recentScores: [{ topic: "Force and Motion Basics", score: 3, total: 3, timestamp: "2026-11-24T10:00:00Z" }],
    streak: 4,
  },
  {
    id: "stu-diya",
    name: "Diya",
    grade: "Class 9",
    preferredLanguage: "hi",
    currentLevel: "simple",
    masteredTopics: ["Plant Cell Structure"],
    weakTopics: ["Photosynthesis", "Newton's Third Law"],
    recentScores: [{ topic: "Plant Cell Structure", score: 2, total: 3, timestamp: "2026-11-24T11:30:00Z" }],
    streak: 2,
  },
  {
    id: "stu-karthik",
    name: "Karthik",
    grade: "Class 10",
    preferredLanguage: "kn",
    currentLevel: "advanced",
    masteredTopics: ["Newton's Third Law", "Photosynthesis", "Linear Equations"],
    weakTopics: ["Quadratic Equations"],
    recentScores: [{ topic: "Newton's Third Law", score: 3, total: 3, timestamp: "2026-11-24T14:15:00Z" }],
    streak: 7,
  },
];

const LANG_LABELS: Record<Language, string> = {
  en: "🇬🇧 English", hi: "🇮🇳 हिन्दी", kn: "🇮🇳 ಕನ್ನಡ",
};

const QUICK_PROMPTS: Record<Language, string[]> = {
  en: [
    "Why don't action and reaction forces cancel in Newton's third law?",
    "How do I solve x² − 5x + 6 = 0 by factoring?",
    "How does photosynthesis work in plant leaves?",
  ],
  hi: [
    "न्यूटन के तीसरे नियम में क्रिया-प्रतिक्रिया बल रद्द क्यों नहीं होते?",
    "द्विघात समीकरण x² − 5x + 6 = 0 कैसे हल करें?",
    "पत्तियों में प्रकाश संश्लेषण कैसे होता है?",
  ],
  kn: [
    "ನ್ಯೂಟನ್‌ನ ಮೂರನೇ ನಿಯಮದಲ್ಲಿ ಕ್ರಿಯೆ-ಪ್ರತಿಕ್ರಿಯೆ ಬಲಗಳು ಏಕೆ ರದ್ದಾಗುವುದಿಲ್ಲ?",
    "ವರ್ಗ ಸಮೀಕರಣ x² − 5x + 6 = 0 ಅನ್ನು ಹೇಗೆ ಬಿಡಿಸುವುದು?",
    "ಸಸ್ಯಗಳ ಎಲೆಗಳಲ್ಲಿ ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಹೇಗೆ ನಡೆಯುತ್ತದೆ?",
  ],
};

const LEVEL_META: Record<DifficultyLevel, { label: string; icon: React.ReactNode; desc: string; color: string }> = {
  simple:   { label: "Simple",   icon: <BookOpen className="h-4 w-4" />, desc: "Analogies & visuals, no jargon",          color: "sky" },
  standard: { label: "Standard", icon: <Star     className="h-4 w-4" />, desc: "Curriculum-level explanation + quiz",     color: "indigo" },
  advanced: { label: "Advanced", icon: <Zap      className="h-4 w-4" />, desc: "Deep dives, edge cases & extensions",     color: "violet" },
};

const DEMO_DOUBT =
  "Why don't action and reaction forces cancel each other out in Newton's third law?";
const DEMO_FAIL_GRADE: NonNullable<TutorFinalPayload["gradeResult"]> = {
  score: 1, total: 3, passed: false,
  misconceptionsFound: ["Confuses mass with force cancellation"],
  nextAction: "retry_easier",
};

// ── SSE helper ────────────────────────────────────────────────────────────────
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ResultSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading response">
      <div className="skeleton h-5 w-2/5 rounded-lg" />
      <div className="skeleton h-4 w-full rounded-lg" />
      <div className="skeleton h-4 w-5/6 rounded-lg" />
      <div className="skeleton h-4 w-4/6 rounded-lg" />
      <div className="skeleton h-24 w-full rounded-xl" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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
  const [sessionScore, setSessionScore] = useState<{ score: number; total: number; topic: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0];
  const avatarIndex = STUDENTS.findIndex((s) => s.id === studentId);

  // Sync language + level when student changes
  useEffect(() => {
    const stu = STUDENTS.find((s) => s.id === studentId);
    if (stu) {
      setLanguage(stu.preferredLanguage);
      setChosenLevel(stu.currentLevel);
      // Clear session when switching students
      setResult(null);
      setGradedResult(null);
      setTraces([]);
      setError(null);
      setSessionScore(null);
      setIsDemoScenario(false);
      setDemoPhase("idle");
    }
  }, [studentId]);

  async function runAgent(opts: {
    msg: string; img?: string;
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
        { studentId, message: opts.msg, language, imageBase64: opts.img,
          isRetryEasier: opts.isRetryEasier, gradeResult: opts.grade },
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

  function handleRunDemo() {
    setIsDemoScenario(true);
    setDemoPhase("first");
    setMessage(DEMO_DOUBT);
    void runAgent({ msg: DEMO_DOUBT });
  }

  function handleDemoRetry() {
    setDemoPhase("retry");
    void runAgent({ msg: DEMO_DOUBT, isRetryEasier: true, grade: DEMO_FAIL_GRADE });
  }

  function handleUserSubmit(msg: string, img?: string) {
    setIsDemoScenario(false);
    setDemoPhase("idle");
    setMessage(msg);
    void runAgent({ msg, img });
  }

  function handleNewSession() {
    if (abortRef.current) abortRef.current.abort();
    setResult(null);
    setGradedResult(null);
    setTraces([]);
    setError(null);
    setMessage("");
    setIsDemoScenario(false);
    setDemoPhase("idle");
  }

  function handleQuizGrade(grade: NonNullable<TutorFinalPayload["gradeResult"]>) {
    setGradedResult(grade);
    setSessionScore(result ? { score: grade.score, total: grade.total, topic: result.topic } : null);
    if (!grade.passed && isDemoScenario && demoPhase === "first") {
      setTimeout(() => handleDemoRetry(), 800);
    }
  }

  function handleRetryManual() {
    if (!result) return;
    setDemoPhase("retry");
    void runAgent({ msg: message || result.topic, isRetryEasier: true, grade: gradedResult ?? DEMO_FAIL_GRADE });
  }

  function handleLevelUp() {
    if (!result) return;
    void runAgent({ msg: `Challenge me on a harder ${result.topic} problem` });
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-0 px-0">
      {/* ─── TOP NAV BAR ─── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <GraduationCap className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold leading-none brand-gradient">GyanSetu AI</h1>
              <p className="text-[10px] text-slate-400">Personalised AI Tutor</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              label="Student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="min-w-[140px] text-xs"
            >
              {STUDENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.grade}
                </option>
              ))}
            </Select>

            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="text-xs"
            >
              {(Object.entries(LANG_LABELS) as [Language, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>

            {/* Streak pill */}
            <div className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 dark:border-amber-800 dark:bg-amber-950/40">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {student.streak}d
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── BODY ─── */}
      <div className="flex-1 px-4 py-5 sm:px-6">
        {/* Demo + New session row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunDemo}
            disabled={isRunning}
            className="flex min-h-[40px] items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 transition disabled:opacity-50 enabled:hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Run demo scenario
          </button>
          {(result || traces.length > 0) && (
            <button
              type="button"
              onClick={handleNewSession}
              className="flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Plus className="h-3.5 w-3.5" />
              New session
            </button>
          )}
          {isDemoScenario && demoPhase !== "idle" && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
              Demo mode
            </span>
          )}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[260px_1fr_300px]">

          {/* ── LEFT: Profile card (desktop sidebar) ── */}
          <div className="hidden lg:block">
            <StudentProfileCard
              student={student}
              avatarIndex={avatarIndex}
              sessionScore={sessionScore}
            />
          </div>

          {/* ── CENTRE: Input + Results ── */}
          <div className="min-w-0 space-y-4">
            {/* Mobile profile strip */}
            <div className="lg:hidden">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-bold text-white">
                  {student.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{student.name} · {student.grade}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Flame className="h-3 w-3 text-amber-500" />{student.streak} day streak
                    <span className="text-slate-300">·</span>
                    <span className="capitalize">{student.currentLevel} level</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Card */}
            <Card className="shadow-card-md">
              <InputCard
                value={message}
                onChange={setMessage}
                language={language}
                onSubmit={handleUserSubmit}
                isRunning={isRunning}
                quickPrompts={QUICK_PROMPTS[language]}
              />
            </Card>

            {/* Mobile trace */}
            <div className="lg:hidden">
              <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Running skeleton */}
            {isRunning && !result && (
              <Card className="shadow-card">
                <CardContent className="pt-4">
                  <ResultSkeleton />
                </CardContent>
              </Card>
            )}

            {/* Result area */}
            {result && (
              <div className="animate-slide-up space-y-4">
                {/* Level tabs */}
                <Card className="shadow-card-md overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{result.topic}</CardTitle>
                        {result.prerequisiteGap && (
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                            📚 Prerequisite gap: <strong>{result.prerequisiteGap}</strong>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.demoMode && <Badge variant="warning">Demo Fixture</Badge>}
                      </div>
                    </div>
                  </CardHeader>

                  <Tabs defaultValue={result.difficulty}>
                    <div className="border-b border-slate-100 px-4 dark:border-slate-800">
                      <TabsList className="h-auto gap-0 bg-transparent pb-0">
                        {(["simple", "standard", "advanced"] as DifficultyLevel[]).map((lvl) => {
                          const meta = LEVEL_META[lvl];
                          const isRec = lvl === result.difficulty;
                          return (
                            <TabsTrigger
                              key={lvl}
                              value={lvl}
                              className={cn(
                                "relative flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-3 text-xs font-semibold transition-colors",
                                isRec && "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                              )}
                            >
                              {meta.icon}
                              <span className="hidden sm:inline">{meta.label}</span>
                              {isRec && (
                                <span className="hidden rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white sm:inline">
                                  ★ You
                                </span>
                              )}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                    </div>

                    {(["simple", "standard", "advanced"] as DifficultyLevel[]).map((lvl) => {
                      const meta = LEVEL_META[lvl];
                      const isRec = lvl === result.difficulty;
                      return (
                        <TabsContent key={lvl} value={lvl} className="p-4 pt-3">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge variant={isRec ? "default" : "secondary"}>
                              {meta.icon}
                              <span className="ml-1">{meta.label}</span>
                            </Badge>
                            {isRec && <Badge variant="default">★ Recommended for you</Badge>}
                            <span className="text-xs text-slate-400">{meta.desc}</span>
                          </div>

                          {isRec ? (
                            <div className="space-y-3">
                              <p className="prose-answer">{result.explanation}</p>
                              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-3.5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-violet-950/40">
                                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">💡 Analogy</p>
                                <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">{result.analogy}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-xs italic text-slate-400 dark:border-slate-700 dark:text-slate-500">
                              Complete the quiz at your recommended level first to unlock {lvl} content.
                            </p>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </Card>

                {/* Quiz Card */}
                {result.quiz.length > 0 && (
                  <Card className="shadow-card-md">
                    <CardContent className="pt-4">
                      <QuizCard
                        questions={result.quiz}
                        onGrade={handleQuizGrade}
                        disabled={isRunning}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Failure banner */}
                {gradedResult && !gradedResult.passed && !isRunning && (
                  <div className="animate-slide-up flex flex-col gap-3 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30 sm:flex-row sm:items-center sm:justify-between">
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
                      className="flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-amber-700 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Re-explain differently
                    </button>
                  </div>
                )}

                {/* Pass banner */}
                {gradedResult && gradedResult.passed && !isRunning && (
                  <div className="animate-confetti-pop flex flex-col gap-3 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-10 w-10 text-emerald-500" />
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-200">
                          Excellent! You&apos;ve got it 🎉
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          Scored {gradedResult.score}/{gradedResult.total}. Ready for the next challenge!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLevelUp}
                      disabled={isRunning}
                      className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Level up
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!result && !isRunning && traces.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 py-14 dark:border-slate-800">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40">
                  <Sparkles className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ask your first doubt</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Type a question below or click one of the quick prompts
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS[language].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleUserSubmit(p)}
                      className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                    >
                      {p.length > 55 ? p.slice(0, 55) + "…" : p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Agent trace (desktop) ── */}
          <div className="hidden lg:block">
            <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile={false} />
            {!traces.length && !isRunning && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  How it works
                </p>
                <ul className="space-y-2.5">
                  {[
                    { icon: "👤", text: "Loads your profile & history" },
                    { icon: "🔍", text: "Checks prerequisite gaps" },
                    { icon: "💡", text: "Explains at your level" },
                    { icon: "📝", text: "Generates a targeted quiz" },
                    { icon: "📊", text: "Grades & flags misconceptions" },
                    { icon: "📈", text: "Updates your progress" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-base leading-none">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Class context */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Class context
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Users className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                <span>32 students · 8 topics tracked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
