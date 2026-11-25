"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Sparkles, Users, Clock } from "lucide-react";
import type { Language, TeacherFinalPayload, TraceEvent } from "@/lib/types";
import { AgentTrace } from "./agent-trace";

interface TeacherDashboardProps {
  language: Language;
}

export function TeacherDashboard({ language }: TeacherDashboardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [data, setData] = useState<TeacherFinalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGeneratePlan() {
    setIsRunning(true);
    setTraces([]);
    setError(null);

    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });

      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

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
            setData(event.payload as TeacherFinalPayload);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate lesson plan");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Class Mastery &amp; Weakness Radar</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            See where students are stuck and generate a 15-minute targeted revision plan.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGeneratePlan}
          disabled={isRunning}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate Smart Lesson Plan</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      <AgentTrace traces={traces} isRunning={isRunning} />

      {data && (
        <div className="space-y-4">
          {/* Recharts Class Mastery Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold">Topic Mastery (%)</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.classStats} margin={{ top: 8, right: 12, left: -16, bottom: 8 }}>
                  <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="masteryPercent" radius={[6, 6, 0, 0]}>
                    {data.classStats.map((entry) => (
                      <Cell
                        key={entry.topic}
                        fill={entry.masteryPercent < 60 ? "#ef4444" : entry.masteryPercent < 75 ? "#f59e0b" : "#10b981"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 15-Min Smart Revision Plan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-bold">{data.revisionPlan.title}</h3>
              <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                <Clock className="h-3.5 w-3.5" />
                {data.revisionPlan.durationMinutes} min
              </span>
            </div>
            <div className="space-y-2">
              {data.revisionPlan.steps.map((s) => (
                <div key={s.phase} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                  <p className="font-semibold">{s.phase}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{s.activity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Peer Groups */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Suggested Peer-Learning Groups</span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.peerGroups.map((g) => (
                <div key={g.groupName} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p className="font-bold">{g.groupName} — {g.topic}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Mentor: {g.mentor}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Learners: {g.learners.join(", ")}</p>
                  <p className="mt-1 text-xs italic text-slate-500">{g.activity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
