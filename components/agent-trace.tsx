"use client";

import { useState } from "react";
import { Activity, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraceEvent } from "@/lib/types";

const TOOL_ICONS: Record<string, string> = {
  get_student_profile: "👤",
  find_prerequisite_gap: "🔍",
  explain_doubt: "💡",
  generate_quiz: "📝",
  grade_answers: "📊",
  update_progress: "📈",
  flag_class_weakness: "🚩",
  get_class_stats: "📊",
  generate_revision_plan: "📋",
  suggest_peer_groups: "👥",
};

interface AgentTraceProps {
  traces: TraceEvent[];
  isRunning: boolean;
  /** On mobile (<lg) renders as collapsible accordion */
  collapsibleOnMobile?: boolean;
}

export function AgentTrace({ traces, isRunning, collapsibleOnMobile = true }: AgentTraceProps) {
  const [expanded, setExpanded] = useState(false);

  if (traces.length === 0 && !isRunning) return null;

  const timeline = (
    <ul
      aria-live="polite"
      aria-label="Agent execution trace"
      className="space-y-2 text-sm"
    >
      {traces.map((t, idx) => {
        const isLast = idx === traces.length - 1;
        return (
          <li
            key={`${t.step}-${t.tool}-${idx}`}
            className={cn(
              "relative flex items-start gap-3 pl-7",
              "before:absolute before:left-2.5 before:top-5 before:h-full before:w-px before:bg-slate-200 dark:before:bg-slate-700",
              isLast && "before:hidden"
            )}
          >
            {/* Node dot */}
            <span className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 ring-2 ring-white dark:bg-indigo-900/60 dark:ring-slate-900">
              <CheckCircle2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
            </span>

            <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{TOOL_ICONS[t.tool] ?? "⚙️"}</span>
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t.tool}
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  step {t.step}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{t.summary}</p>
            </div>
          </li>
        );
      })}

      {isRunning && (
        <li className="flex items-center gap-2 pl-7 text-xs text-indigo-600 dark:text-indigo-400">
          <span className="absolute left-0 flex h-5 w-5 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
          <span className="ml-1">Thinking…</span>
        </li>
      )}
    </ul>
  );

  const header = (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
      {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
      <span>
        Agent Trace{traces.length > 0 ? ` (${traces.length} steps)` : ""}
      </span>
    </div>
  );

  if (!collapsibleOnMobile) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3">{header}</div>
        {timeline}
      </section>
    );
  }

  return (
    <>
      {/* Mobile: collapsible accordion */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-3"
        >
          {header}
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")}
          />
        </button>
        {expanded && <div className="border-t border-slate-100 p-3 dark:border-slate-800">{timeline}</div>}
      </section>

      {/* Desktop: always visible sticky panel */}
      <section className="sticky top-4 hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="mb-3">{header}</div>
        <div className="max-h-[60vh] overflow-y-auto pr-1">{timeline}</div>
      </section>
    </>
  );
}
