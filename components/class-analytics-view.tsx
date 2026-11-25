"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { TrendingUp, Users, AlertCircle, Award, Target } from "lucide-react";
import type { ClassTopicStat, StudentProfile } from "@/lib/types";

interface ClassAnalyticsProps {
  stats: ClassTopicStat[];
  students: StudentProfile[];
}

export function ClassAnalyticsView({ stats, students }: ClassAnalyticsProps) {
  const masteryDistribution = useMemo(() => {
    let high = 0;
    let mid = 0;
    let low = 0;
    stats.forEach((s) => {
      if (s.masteryPercent >= 70) high++;
      else if (s.masteryPercent >= 50) mid++;
      else low++;
    });
    return [
      { name: "Mastered (≥70%)", value: high, color: "#10b981" },
      { name: "Proficient (50-69%)", value: mid, color: "#f59e0b" },
      { name: "Needs Support (<50%)", value: low, color: "#ef4444" },
    ];
  }, [stats]);

  const radarData = useMemo(() => {
    return stats.slice(0, 6).map((s) => ({
      topic: s.topic.length > 15 ? s.topic.slice(0, 15) + "…" : s.topic,
      mastery: s.masteryPercent,
      target: 75,
    }));
  }, [stats]);

  const avgMastery = Math.round(
    stats.length ? stats.reduce((acc, c) => acc + c.masteryPercent, 0) / stats.length : 0
  );

  const topStruggling = useMemo(() => {
    return [...stats].sort((a, b) => a.masteryPercent - b.masteryPercent).slice(0, 3);
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Top metrics summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold">Active Roster</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{students.length} Students</p>
          <span className="text-[11px] text-slate-400">Tracked in realtime</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold">Curriculum Mastery</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{avgMastery}%</p>
          <span className="text-[11px] text-emerald-500 font-medium">+4.2% this week</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Target className="h-4 w-4" />
            <span className="text-xs font-semibold">Curriculum Units</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.length} Topics</p>
          <span className="text-[11px] text-slate-400">Aligned with state standards</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-semibold">Remedial Focus</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.filter((s) => s.masteryPercent < 55).length} Topics
          </p>
          <span className="text-[11px] text-rose-500 font-medium">Require immediate review</span>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Radar Competency Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Competency Radar & Mastery Targets
          </h3>
          <p className="text-xs text-slate-400 mb-4">Comparing current class scores against 75% mastery goal</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fill: "#64748b" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Target" dataKey="target" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Distribution Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Topic Health Breakdown
          </h3>
          <p className="text-xs text-slate-400 mb-4">Proportion of topics meeting grade performance thresholds</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={masteryDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {masteryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {masteryDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {d.name}: <strong>{d.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Action Items / Intervention */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 dark:border-rose-950/40 dark:bg-rose-950/20">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4" />
          <h4 className="text-sm font-bold">Priority Remedial Interventions</h4>
        </div>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1 mb-3">
          Students need immediate targeted revision on these concepts before assessments:
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {topStruggling.map((s) => (
            <div
              key={s.topic}
              className="rounded-xl border border-rose-200 bg-white p-3 shadow-xs dark:border-rose-900/60 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.topic}</span>
                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {s.masteryPercent}%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                <strong>Misconception:</strong> {s.topMisconception}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
