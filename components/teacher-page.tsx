"use client";

import { lazy, Suspense, useCallback, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
  AlertTriangle, BookOpen, CheckCircle, Clock, Copy, Loader2, RefreshCw, Sparkles, Users,
} from "lucide-react";
import { AgentTrace } from "@/components/agent-trace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ClassTopicStat, Language, TeacherFinalPayload, TraceEvent } from "@/lib/types";

// Lazy-load PDF downloader — only ships to client when clicked
const PdfDownloader = lazy(() =>
  import("./pdf-downloader").then((m) => ({ default: m.PdfDownloader }))
);

const LANG_LABELS: Record<Language, string> = { en: "🇬🇧 English", hi: "🇮🇳 हिन्दी", kn: "🇮🇳 ಕನ್ನಡ" };

function barColor(pct: number) {
  if (pct < 55) return "#ef4444";   // red
  if (pct < 70) return "#f59e0b";   // amber
  return "#10b981";                   // green
}

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

// ─── Top-misconceptions list ──────────────────────────────────────────────────
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
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.topic}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <AlertTriangle className="mr-1 inline h-3 w-3 text-amber-500" />
              {s.topMisconception}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {s.strugglingCount} of {s.totalStudents} students struggling · {s.masteryPercent}% mastery
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Rendered lesson plan ─────────────────────────────────────────────────────
function LessonPlan({
  plan,
  peerGroups,
  planText,
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
          <div className="mt-1 flex items-center gap-2">
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
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => setShowPdf(true)}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
          >
            <BookOpen className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Lazy PDF component */}
      {showPdf && (
        <Suspense fallback={<p className="text-xs text-slate-400">Preparing PDF…</p>}>
          <PdfDownloader planText={planText} title={plan.title} />
        </Suspense>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {plan.steps.map((step, idx) => (
          <div
            key={step.phase}
            className="flex gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{step.phase}</p>
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Clock className="h-3 w-3" />
                  {step.minutes} min
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
          <h4 className="flex items-center gap-2 text-sm font-bold">
            <Users className="h-4 w-4 text-indigo-600" />
            Peer-Learning Groups
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {peerGroups.map((g) => (
              <div key={g.groupName} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-sm font-bold">{g.groupName}</p>
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

// ─── Main TeacherPage ─────────────────────────────────────────────────────────
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
    } catch {
      // silent
    } finally {
      setIsResetting(false);
    }
  }

  // Build plain-text copy of plan
  const planText = data
    ? [
        `${data.revisionPlan.title} (${data.revisionPlan.durationMinutes} min)`,
        `Focus: ${data.revisionPlan.focusTopic}`,
        "",
        "LESSON STEPS",
        ...data.revisionPlan.steps.map(
          (s, i) => `${i + 1}. ${s.phase} [${s.minutes} min]\n   ${s.activity}`
        ),
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
    <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 lg:px-6">
      {/* ─── Header ─── */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 sm:text-xl">
            GyanSetu AI — Teacher Co-Pilot
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            See where your class is stuck. Generate a targeted lesson plan in one click.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {(Object.entries(LANG_LABELS) as [Language, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isRunning}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Smart Lesson Plan
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isRunning}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Reset demo data
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ─── Mobile trace accordion ─── */}
      <div className="lg:hidden">
        <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile />
      </div>

      {/* ─── Main grid ─── */}
      <div className="grid flex-1 grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* ── Bar chart ── */}
          {data && data.classStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Topic Mastery & Struggling Students</CardTitle>
                <p className="text-xs text-slate-400">
                  <span className="inline-block h-2 w-2 rounded-sm bg-red-400" /> &lt;55%&nbsp;&nbsp;
                  <span className="inline-block h-2 w-2 rounded-sm bg-amber-400" /> 55–70%&nbsp;&nbsp;
                  <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" /> &gt;70%
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 16, right: 8, left: -20, bottom: 60 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(value: number, _name: string, props) => [
                          `${value}% mastery · ${props.payload.struggling} struggling`,
                          props.payload.fullName,
                        ]}
                      />
                      <Bar dataKey="mastery" radius={[6, 6, 0, 0]} maxBarSize={56}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={barColor(entry.mastery)} />
                        ))}
                        <LabelList dataKey="mastery" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: "#64748b" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Top misconceptions ── */}
          {data && (
            <Card>
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

          {/* ── Lesson plan ── */}
          {data && data.revisionPlan && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Smart Lesson Plan</CardTitle>
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

          {!data && !isRunning && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
              <Sparkles className="h-10 w-10 text-indigo-300" />
              <p className="text-sm text-slate-400">
                Click <strong>Generate Smart Lesson Plan</strong> to get started
              </p>
            </div>
          )}

          {isRunning && !data && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 py-12 dark:border-slate-700">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-500">Agent is thinking…</p>
            </div>
          )}
        </div>

        {/* ─── Desktop sticky trace ─── */}
        <div className="hidden lg:block">
          <AgentTrace traces={traces} isRunning={isRunning} collapsibleOnMobile={false} />
        </div>
      </div>
    </div>
  );
}
