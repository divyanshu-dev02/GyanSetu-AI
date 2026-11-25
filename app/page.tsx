"use client";

import { useState } from "react";
import { GraduationCap, Users } from "lucide-react";
import { StudentPage } from "@/components/student-page";
import { TeacherPage } from "@/components/teacher-page";

export default function HomePage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [dark, setDark] = useState(false);

  function toggleTheme() {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  return (
    <div className="relative">
      {/* Global nav — fixed top-right */}
      <nav className="fixed right-3 top-3 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRole(role === "student" ? "teacher" : "student")}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {role === "student" ? (
            <><Users className="h-4 w-4" />Teacher View</>
          ) : (
            <><GraduationCap className="h-4 w-4" />Student View</>
          )}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </nav>

      {role === "student" ? <StudentPage /> : <TeacherPage />}
    </div>
  );
}

