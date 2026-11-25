"use client";

import { cn } from "@/lib/utils";
import type { StudentProfile, DifficultyLevel } from "@/lib/types";
import { Flame, Trophy, AlertCircle, CheckCircle2, TrendingUp, GraduationCap, Star, Zap, BookOpen } from "lucide-react";

const LEVEL_COLORS: Record<DifficultyLevel, string> = {
  simple:   "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  standard: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  advanced: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};
const LEVEL_ICONS: Record<DifficultyLevel, React.ReactNode> = {
  simple:   <BookOpen className="h-3 w-3" />,
  standard: <Star className="h-3 w-3" />,
  advanced: <Zap className="h-3 w-3" />,
};

const AVATAR_COLORS = [
  "from-indigo-400 to-violet-500",
  "from-pink-400 to-rose-500",
  "from-emerald-400 to-teal-500",
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function MasteryBar({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        {pct}%
      </span>
    </div>
  );
}

interface StudentProfileCardProps {
  student: StudentProfile;
  avatarIndex?: number;
  sessionScore?: { score: number; total: number; topic: string } | null;
}

export function StudentProfileCard({ student, avatarIndex = 0, sessionScore }: StudentProfileCardProps) {
  const avatarGrad = AVATAR_COLORS[avatarIndex % AVATAR_COLORS.length];
  const streakColor =
    student.streak >= 7
      ? "text-emerald-600 dark:text-emerald-400"
      : student.streak >= 3
      ? "text-amber-600 dark:text-amber-400"
      : "text-slate-500 dark:text-slate-400";

  return (
    <section className="animate-fade-in space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-sm",
            avatarGrad
          )}
        >
          {initials(student.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{student.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <GraduationCap className="h-3 w-3 shrink-0" />
            <span>{student.grade}</span>
          </div>
        </div>
        <div className={cn("flex items-center gap-1 text-sm font-bold", streakColor)}>
          <Flame className="h-4 w-4" />
          <span>{student.streak}d</span>
        </div>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", LEVEL_COLORS[student.currentLevel])}>
          {LEVEL_ICONS[student.currentLevel]}
          {student.currentLevel.charAt(0).toUpperCase() + student.currentLevel.slice(1)} Level
        </span>
        {student.streak >= 5 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <Trophy className="h-3 w-3" />
            On fire!
          </span>
        )}
      </div>

      {/* Session score (live) */}
      {sessionScore && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 dark:border-indigo-900/50 dark:bg-indigo-950/30">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
            This session · {sessionScore.topic}
          </p>
          <MasteryBar score={sessionScore.score} total={sessionScore.total} />
        </div>
      )}

      <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
        {/* Mastered topics */}
        {student.masteredTopics.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Mastered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {student.masteredTopics.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weak topics */}
        {student.weakTopics.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              Needs work
            </p>
            <div className="flex flex-wrap gap-1.5">
              {student.weakTopics.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent scores */}
        {student.recentScores.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <TrendingUp className="h-3 w-3 text-indigo-500" />
              Recent scores
            </p>
            <div className="space-y-2">
              {student.recentScores.map((s) => (
                <div key={s.topic}>
                  <p className="mb-0.5 text-[11px] text-slate-600 dark:text-slate-400 truncate">{s.topic}</p>
                  <MasteryBar score={s.score} total={s.total} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
