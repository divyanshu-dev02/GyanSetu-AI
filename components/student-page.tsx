"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight, BookOpen, Flame, GraduationCap,
  Plus, RotateCcw, Sparkles, Star, Trophy, Users, Zap, X, UserCheck
} from "lucide-react";
import { AgentTrace } from "@/components/agent-trace";
import { InputCard } from "@/components/input-card";
import { QuizCard } from "@/components/quiz-card";
import { StudentProfileCard } from "@/components/student-profile-card";
import { ManageStudentsModal } from "@/components/manage-students-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  DifficultyLevel, Language, StudentProfile, TraceEvent, TutorFinalPayload,
} from "@/lib/types";

const LANG_LABELS: Record<Language, string> = {
  en: "🇬🇧 English", hi: "🇮🇳 हिन्दी", kn: "🇮🇳 ಕನ್ನಡ",
};

const QUICK_PROMPTS: Record<Language, string[]> = {
  en: [
    "Why don't action and reaction forces cancel in Newton's third law?",
    "How do I solve x² − 5x + 6 = 0 by factoring?",
    "How does photosynthesis work in plant leaves?",
    "Explain what is a Black Hole and how it curves spacetime?",
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

export function StudentPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [studentId, setStudentId] = useState("stu-aarav");
  const [language, setLanguage] = useState<Language>("en");
  const [message, setMessage] = useState("");
  const [chosenLevel, setChosenLevel] = useState<DifficultyLevel>("standard");

  const [isRunning, setIsRunning] = useState(false);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [result, setResult] = useState<TutorFinalPayload | null>(null);
  const [gradedResult, setGradedResult] = useState<NonNullable<TutorFinalPayload["gradeResult"]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionScore, setSessionScore] = useState<{ score: number; total: number; topic: string } | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Fetch live student list from API
  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await fetch("/api/students");
        if (res.ok) {
          const data = await res.json();
          if (data.students && data.students.length > 0) {
            setStudents(data.students);
            setStudentId(data.students[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load students:", err);
      }
    }
    loadStudents();
  }, []);

  const student = students.find((s) => s.id === studentId) ?? students[0] ?? {
    id: "stu-aarav",
    name: "Aarav",
    grade: "Class 9",
    preferredLanguage: "en",
    currentLevel: "standard",
    masteredTopics: ["Force and Motion Basics"],
    weakTopics: ["Newton's Third Law"],
    recentScores: [],
    streak: 4,
  };

  const avatarIndex = students.findIndex((s) => s.id === studentId);

  useEffect(() => {
    const current = students.find((s) => s.id === studentId);
    if (current) {
      setLanguage(current.preferredLanguage);
      setChosenLevel(current.currentLevel);
      setResult(null);
      setGradedResult(null);
      setTraces([]);
      setError(null);
      setSessionScore(null);
    }
  }, [studentId, students]);

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

  function handleUserSubmit(msg: string, img?: string) {
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
  }

  function handleQuizGrade(grade: NonNullable<TutorFinalPayload["gradeResult"]>) {
    setGradedResult(grade);
    setSessionScore(result ? { score: grade.score, total: grade.total, topic: result.topic } : null);
  }

  function handleRetryManual() {
    if (!result) return;
    void runAgent({
      msg: message || result.topic,
      isRetryEasier: true,
      grade: gradedResult ?? undefined,
    });
  }

  function handleLevelUp() {
    if (!result) return;
    void runAgent({ msg: `Challenge me on a harder problem about ${result.topic}` });
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-0 px-0">
      {/* ─── TOP NAV BAR ─── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <GraduationCap className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold leading-none brand-gradient">GyanSetu AI</h1>
              <p className="text-[10px] text-slate-400">Adaptive Personal Tutor</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              label="Student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="min-w-[140px] text-xs"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.grade}
                </option>
              ))}
            </Select>

            <button
              onClick={() => setIsManageOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              title="Manage Students"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Roster</span>
            </button>

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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(result || traces.length > 0) && (
            <button
              type="button"
              onClick={handleNewSession}
              className="flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Plus className="h-3.5 w-3.5" />
              New session
            </button>
          )}
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Live AI Powered
          </span>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[260px_1fr_300px]">
          {/* Profile Sidebar */}
          <div className="hidden lg:block">
            <StudentProfileCard
              student={student}
              avatarIndex={avatarIndex}
              sessionScore={sessionScore}
            />
          </div>

          {/* Centre Column */}
          <div className="min-w-0 space-y-4">
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

            <div className="lg:hidden">
              <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {isRunning && !result && (
              <Card className="shadow-card">
                <CardContent className="pt-4">
                  <ResultSkeleton />
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="animate-slide-up space-y-4">
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
                      <Badge variant="default">AI Generated</Badge>
                    </div>
                  </CardHeader>

                  <Tabs defaultValue={result.difficulty || "standard"}>
                    <div className="border-b border-slate-100 px-4 dark:border-slate-800">
                      <TabsList className="h-auto gap-0 bg-transparent pb-0">
                        {(["simple", "standard", "advanced"] as DifficultyLevel[]).map((lvl) => {
                          const meta = LEVEL_META[lvl];
                          const isRec = lvl === (result.difficulty || chosenLevel);
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
                                  ★ Target
                                </span>
                              )}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                    </div>

                    {(["simple", "standard", "advanced"] as DifficultyLevel[]).map((lvl) => {
                      const meta = LEVEL_META[lvl];
                      const isRec = lvl === (result.difficulty || chosenLevel);
                      return (
                        <TabsContent key={lvl} value={lvl} className="p-4 pt-3">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge variant={isRec ? "default" : "secondary"}>
                              {meta.icon}
                              <span className="ml-1">{meta.label}</span>
                            </Badge>
                            {isRec && <Badge variant="default">★ Level Matched</Badge>}
                            <span className="text-xs text-slate-400">{meta.desc}</span>
                          </div>

                          <div className="space-y-3">
                            <p className="prose-answer">{result.explanation}</p>
                            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-3.5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-violet-950/40">
                              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">💡 Real-World Analogy</p>
                              <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">{result.analogy}</p>
                            </div>
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </Card>

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

                {gradedResult && !gradedResult.passed && !isRunning && (
                  <div className="animate-slide-up flex flex-col gap-3 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        🔄 Let me re-explain with a simpler approach
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                        We will break this down step-by-step with new analogies.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetryManual}
                      disabled={isRunning}
                      className="flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Simpler Explanation
                    </button>
                  </div>
                )}

                {gradedResult && gradedResult.passed && !isRunning && (
                  <div className="animate-confetti-pop flex flex-col gap-3 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-10 w-10 text-emerald-500" />
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-200">
                          Concept Mastered! 🎉
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          Scored {gradedResult.score}/{gradedResult.total}. Ready for the next difficulty level!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLevelUp}
                      disabled={isRunning}
                      className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Level Up
                    </button>
                  </div>
                )}
              </div>
            )}

            {!result && !isRunning && traces.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 py-14 dark:border-slate-800">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40">
                  <Sparkles className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ask any question to begin</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Type below or click any of the curated concept prompts
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

          {/* Right Column: Execution Timeline */}
          <div className="hidden lg:block">
            <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile={false} />
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Class Context
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Users className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                <span>{students.length} students enrolled in this cohort</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ManageStudentsModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        students={students}
        onStudentAdded={(newStu) => {
          setStudents((prev) => [...prev, newStu]);
          setStudentId(newStu.id);
        }}
        onStudentDeleted={(delId) => {
          setStudents((prev) => prev.filter((s) => s.id !== delId));
          if (studentId === delId && students.length > 1) {
            setStudentId(students.find((s) => s.id !== delId)?.id || "");
          }
        }}
      />
    </div>
  );
}
