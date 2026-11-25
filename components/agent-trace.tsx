"use client";

import { useState } from "react";
import { Activity, CheckCircle2, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraceEvent } from "@/lib/types";

const TOOL_ICONS: Record<string, string> = {
  get_student_profile:    "👤",
  find_prerequisite_gap:  "🔍",
  explain_doubt:          "💡",
  generate_quiz:          "📝",
  grade_answers:          "📊",
  update_progress:        "📈",
  flag_class_weakness:    "🚩",
  get_class_stats:        "📊",
  generate_revision_plan: "📋",
  suggest_peer_groups:    "👥",
};

const TOOL_COLORS: Record<string, string> = {
  get_student_profile:    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  find_prerequisite_gap:  "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  explain_doubt:          "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  generate_quiz:          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  grade_answers:          "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  update_progress:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  flag_class_weakness:    "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  get_class_stats:        "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  generate_revision_plan: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  suggest_peer_groups:    "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
};

interface AgentTraceProps {
  traces: TraceEvent[];
  isRunning: boolean;
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
        const toolColor = TOOL_COLORS[t.tool] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
        return (
          <li
            key={`${t.step}-${t.tool}-${idx}`}
            className={cn(
              "animate-fade-in relative flex items-start gap-3 pl-7",
              "before:absolute before:left-2.5 before:top-5 before:h-full before:w-px before:bg-slate-200 dark:before:bg-slate-700",
              isLast && "before:hidden"
            )}
          >
            {/* Timeline dot */}
            <span className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 ring-2 ring-white dark:bg-indigo-900/60 dark:ring-slate-900">
              <CheckCircle2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
            </span>

            <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", toolColor)}>
                  <span className="text-sm leading-none">{TOOL_ICONS[t.tool] ?? "⚙️"}</span>
                  <span className="font-mono">{t.tool}</span>
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  step {t.step}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t.summary}</p>
            </div>
          </li>
        );
      })}

      {isRunning && (
        <li className="relative flex items-center gap-2 pl-7 text-xs text-indigo-600 dark:text-indigo-400">
          <span className="absolute left-0 flex h-5 w-5 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
          <span className="ml-1 animate-pulse2">Thinking…</span>
        </li>
      )}
    </ul>
  );

  const header = (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
      {isRunning
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Activity className="h-3.5 w-3.5" />}
      <span>
        Agent Trace{traces.length > 0 ? ` · ${traces.length} steps` : ""}
      </span>
      {isRunning && (
        <span className="ml-auto">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        </span>
      )}
    </div>
  );

  if (!collapsibleOnMobile) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3">{header}</div>
        <div className="max-h-[65vh] overflow-y-auto pr-1">{timeline}</div>
      </section>
    );
  }

  return (
    <>
      {/* Mobile: collapsible */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-3"
        >
          {header}
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")}
          />
        </button>
        {expanded && (
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            {timeline}
          </div>
        )}
      </section>

      {/* Desktop: always visible sticky */}
      <section className="sticky top-16 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="mb-3">{header}</div>
        <div className="max-h-[60vh] overflow-y-auto pr-1">{timeline}</div>
      </section>
    </>
  );
}
