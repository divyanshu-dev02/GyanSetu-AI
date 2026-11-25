"use client";

import { lazy, Suspense, useCallback, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
  AlertTriangle, ArrowDown, ArrowUp, BookOpen, CheckCircle, Clock,
  Copy, Download, GraduationCap, Loader2, Minus, RefreshCw, Sparkles, TrendingUp, Users,
} from "lucide-react";
import { AgentTrace } from "@/components/agent-trace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ClassTopicStat, Language, TeacherFinalPayload, TraceEvent } from "@/lib/types";

const PdfDownloader = lazy(() =>
  import("./pdf-downloader").then((m) => ({ default: m.PdfDownloader }))
);

const LANG_LABELS: Record<Language, string> = {
  en: "🇬🇧 English", hi: "🇮🇳 हिन्दी", kn: "🇮🇳 ಕನ್ನಡ",
};

function barColor(pct: number) {
  if (pct < 55) return "#ef4444";
  if (pct < 70) return "#f59e0b";
  return "#10b981";
}

function TrendIcon({ pct }: { pct: number }) {
  if (pct >= 70) return <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (pct >= 55) return <Minus className="h-3.5 w-3.5 text-amber-500" />;
  return <ArrowDown className="h-3.5 w-3.5 text-red-500" />;
}

// ── Class summary stat cards ───────────────────────────────────────────────────
function ClassSummaryCards({ stats }: { stats: ClassTopicStat[] }) {
  if (!stats.length) return null;
  const avgMastery = Math.round(stats.reduce((s, t) => s + t.masteryPercent, 0) / stats.length);
  const totalStruggling = stats.reduce((s, t) => s + t.strugglingCount, 0);
  const belowThreshold = stats.filter((t) => t.masteryPercent < 55).length;
  const totalStudents = stats[0]?.totalStudents ?? 0;

  const cards = [
    {
      icon: <Users className="h-5 w-5 text-indigo-500" />,
      label: "Total students", value: totalStudents, unit: "",
      bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-900",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      label: "Avg mastery", value: avgMastery, unit: "%",
      bg: avgMastery >= 70 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-amber-50 dark:bg-amber-950/30",
      border: avgMastery >= 70 ? "border-emerald-200 dark:border-emerald-900" : "border-amber-200 dark:border-amber-900",
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      label: "Topics below 55%", value: belowThreshold, unit: "",
      bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900",
    },
    {
      icon: <GraduationCap className="h-5 w-5 text-violet-500" />,
      label: "Students struggling", value: totalStruggling, unit: "",
      bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            "animate-fade-in flex flex-col gap-2 rounded-2xl border p-4 shadow-card",
            c.bg, c.border
          )}
        >
          {c.icon}
          <div>
            <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {c.value}{c.unit}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Misconception list ─────────────────────────────────────────────────────────
function MisconceptionList({ stats }: { stats: ClassTopicStat[] }) {
  const sorted = [...stats]
    .filter((s) => s.masteryPercent < 75)
    .sort((a, b) => a.masteryPercent - b.masteryPercent)
    .slice(0, 5);

  return (
    <ul className="space-y-2">
      {sorted.map((s, i) => (
        <li key={s.topic} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700 dark:bg-red-900/60 dark:text-red-300">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.topic}</p>
              <TrendIcon pct={s.masteryPercent} />
              <span className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold",
                s.masteryPercent < 55 ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              )}>
                {s.masteryPercent}%
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <AlertTriangle className="mr-1 inline h-3 w-3 text-amber-500" />
              {s.topMisconception}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {s.strugglingCount} of {s.totalStudents} students struggling
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── CSV export ─────────────────────────────────────────────────────────────────
function exportCSV(stats: ClassTopicStat[]) {
  const header = "Topic,Mastery %,Struggling Count,Total Students,Top Misconception";
  const rows = stats.map(
    (s) => `"${s.topic}",${s.masteryPercent},${s.strugglingCount},${s.totalStudents},"${s.topMisconception}"`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gyansetu-class-stats.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Lesson plan ────────────────────────────────────────────────────────────────
function LessonPlan({
  plan, peerGroups, planText,
}: {
  plan: TeacherFinalPayload["revisionPlan"];
  peerGroups: TeacherFinalPayload["peerGroups"];
  planText: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(planText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4" id="lesson-plan-content">
      {/* Plan header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{plan.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="default">
              <Clock className="mr-1 h-3.5 w-3.5" />
              {plan.durationMinutes} min
            </Badge>
            <Badge variant="secondary">{plan.focusTopic}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => setShowPdf(true)}
            className="flex min-h-[40px] items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {showPdf && (
        <Suspense fallback={<p className="text-xs text-slate-400">Preparing PDF…</p>}>
          <PdfDownloader planText={planText} title={plan.title} />
        </Suspense>
      )}

      {/* Steps timeline */}
      <div className="space-y-2.5">
        {plan.steps.map((step, idx) => (
          <div
            key={step.phase}
            className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.phase}</p>
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  <Clock className="h-3 w-3" />{step.minutes} min
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{step.activity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Peer groups */}
      {peerGroups.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-indigo-600" />
            Peer-Learning Groups
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {peerGroups.map((g) => (
              <div key={g.groupName} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{g.groupName}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">{g.topic}</Badge>
                <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                  Mentor: <strong>{g.mentor}</strong>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Learners: {g.learners.join(", ")}
                </p>
                <p className="mt-1 text-xs italic text-slate-400">{g.activity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SSE helper ─────────────────────────────────────────────────────────────────
async function fetchSSE(
  language: Language,
  onTrace: (t: TraceEvent) => void,
  onFinal: (p: TeacherFinalPayload) => void,
  signal: AbortSignal
) {
  const res = await fetch("/api/teacher", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const chunks = buf.split("\n\n");
    buf = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      const ev = JSON.parse(json);
      if (ev.type === "trace") onTrace(ev as TraceEvent);
      else if (ev.type === "final") onFinal(ev.payload as TeacherFinalPayload);
    }
  }
}

// ── Main TeacherPage ───────────────────────────────────────────────────────────
export function TeacherPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [isRunning, setIsRunning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [data, setData] = useState<TeacherFinalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsRunning(true);
    setError(null);
    setTraces([]);
    setData(null);
    try {
      await fetchSSE(
        language,
        (t) => setTraces((prev) => [...prev, t]),
        (payload) => setData(payload),
        ctrl.signal
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setIsRunning(false);
    }
  }, [language]);

  async function handleReset() {
    setIsResetting(true);
    setData(null);
    setTraces([]);
    setError(null);
    try {
      await fetch("/api/teacher/reset", { method: "POST" });
    } catch { /* silent */ } finally {
      setIsResetting(false);
    }
  }

  const planText = data
    ? [
        `${data.revisionPlan.title} (${data.revisionPlan.durationMinutes} min)`,
        `Focus: ${data.revisionPlan.focusTopic}`,
        "",
        "LESSON STEPS",
        ...data.revisionPlan.steps.map((s, i) => `${i + 1}. ${s.phase} [${s.minutes} min]\n   ${s.activity}`),
        "",
        "PEER GROUPS",
        ...data.peerGroups.map(
          (g) => `${g.groupName} — ${g.topic}\n   Mentor: ${g.mentor}\n   Learners: ${g.learners.join(", ")}\n   Activity: ${g.activity}`
        ),
      ].join("\n")
    : "";

  const chartData = (data?.classStats ?? []).map((s) => ({
    name: s.topic.split(" ").slice(0, 2).join(" "),
    fullName: s.topic,
    mastery: s.masteryPercent,
    struggling: s.strugglingCount,
  }));

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-0 px-0">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-sm">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold leading-none brand-gradient">Teacher Co-Pilot</h1>
              <p className="text-[10px] text-slate-400">AI-powered class insights</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isRunning}
              className="flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 enabled:hover:shadow-md"
            >
              {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Generate Smart Lesson Plan
            </button>

            {data && (
              <button
                type="button"
                onClick={() => exportCSV(data.classStats)}
                className="flex min-h-[40px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting || isRunning}
              className="flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Reset data
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-5 sm:px-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Mobile trace */}
        <div className="mb-4 lg:hidden">
          <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            {/* Summary cards */}
            {data && <ClassSummaryCards stats={data.classStats} />}

            {/* Bar chart */}
            {data && data.classStats.length > 0 && (
              <Card className="shadow-card-md animate-fade-in">
                <CardHeader>
                  <CardTitle>Topic Mastery Overview</CardTitle>
                  <p className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-red-400" /> &lt;55% critical</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-amber-400" /> 55–70% at risk</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" /> &gt;70% healthy</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 60 }}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          angle={-30}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          formatter={(value: number, _name: string, props) => [
                            `${value}% mastery · ${props.payload.struggling} struggling`,
                            props.payload.fullName,
                          ]}
                          contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                        />
                        <Bar dataKey="mastery" radius={[8, 8, 0, 0]} maxBarSize={56}>
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={barColor(entry.mastery)} />
                          ))}
                          <LabelList
                            dataKey="mastery"
                            position="top"
                            formatter={(v: number) => `${v}%`}
                            style={{ fontSize: 11, fill: "#64748b" }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top misconceptions */}
            {data && (
              <Card className="shadow-card-md animate-fade-in">
                <CardHeader>
                  <CardTitle>
                    <AlertTriangle className="mr-2 inline h-4 w-4 text-amber-500" />
                    Top Misconceptions to Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MisconceptionList stats={data.classStats} />
                </CardContent>
              </Card>
            )}

            {/* Lesson plan */}
            {data && data.revisionPlan && (
              <Card className="shadow-card-md animate-fade-in">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Smart 45-Minute Lesson Plan</CardTitle>
                    {data.demoMode && <Badge variant="warning">Demo Fixture</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <LessonPlan
                    plan={data.revisionPlan}
                    peerGroups={data.peerGroups}
                    planText={planText}
                  />
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!data && !isRunning && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 py-20 dark:border-slate-800">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40">
                  <Sparkles className="h-7 w-7 text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Click <strong>Generate Smart Lesson Plan</strong> to get started
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    The AI will analyse class-wide misconceptions and generate a targeted 45-min plan.
                  </p>
                </div>
              </div>
            )}

            {isRunning && !data && (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 py-14 dark:border-slate-700">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-500">Agent is analysing your class…</p>
              </div>
            )}
          </div>

          {/* Desktop trace + tips */}
          <div className="hidden lg:block">
            <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile={false} />
            {!traces.length && !isRunning && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  What the AI does
                </p>
                <ul className="space-y-2.5">
                  {[
                    { icon: "📊", text: "Reads class mastery stats" },
                    { icon: "🔍", text: "Identifies top misconceptions" },
                    { icon: "📋", text: "Generates a 45-min plan" },
                    { icon: "👥", text: "Suggests peer-learning groups" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-base leading-none">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
