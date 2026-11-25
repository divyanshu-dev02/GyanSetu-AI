"use client";

import { useState } from "react";
import type { StudentProfile, Language, DifficultyLevel } from "@/lib/types";
import { UserPlus, Trash2, X, Plus, GraduationCap } from "lucide-react";

interface ManageStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentProfile[];
  onStudentAdded: (student: StudentProfile) => void;
  onStudentDeleted: (studentId: string) => void;
}

export function ManageStudentsModal({
  isOpen,
  onClose,
  students,
  onStudentAdded,
  onStudentDeleted,
}: ManageStudentsModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Class 9");
  const [language, setLanguage] = useState<Language>("en");
  const [level, setLevel] = useState<DifficultyLevel>("standard");
  const [weakTopics, setWeakTopics] = useState("Algebra, Physics");
  const [masteredTopics, setMasteredTopics] = useState("Arithmetic");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          preferredLanguage: language,
          currentLevel: level,
          weakTopics: weakTopics.split(",").map((s) => s.trim()).filter(Boolean),
          masteredTopics: masteredTopics.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onStudentAdded(data.student);
        setName("");
        setIsAdding(false);
      }
    } catch (err) {
      console.error("Failed to add student:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this student?")) {
      try {
        await fetch(`/api/students?id=${id}`, { method: "DELETE" });
        onStudentDeleted(id);
      } catch (err) {
        console.error("Failed to delete student:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Roster Management
              </h2>
              <p className="text-xs text-slate-500">Add, configure, or remove enrolled students</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!isAdding ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Students: {students.length}
                </span>
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" /> Add New Student
                </button>
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3.5 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-sm font-bold text-white">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</p>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {s.grade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Lang: {s.preferredLanguage.toUpperCase()} • Level: {s.currentLevel} • Streak: {s.streak}d
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(s.id)}
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      title="Remove Student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddStudent} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">New Student Profile</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Riya Patel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Grade / Class
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 10"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Preferred Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Initial Difficulty
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as DifficultyLevel)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="simple">Simple (Analogies & Foundations)</option>
                    <option value="standard">Standard (Grade Level)</option>
                    <option value="advanced">Advanced (Deep Rigor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Areas of Struggle (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trigonometry, Electric Circuits"
                  value={weakTopics}
                  onChange={(e) => setWeakTopics(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Mastered Concepts (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Linear Equations, Cell Structure"
                  value={masteredTopics}
                  onChange={(e) => setMasteredTopics(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" /> Save Student
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
