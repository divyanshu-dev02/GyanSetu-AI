"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GraduationCap, BookOpen, Moon, Sun, UserCheck } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const StudentPage = dynamic(
  () => import("@/components/student-page").then((m) => m.StudentPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    ),
  }
);

const TeacherPage = dynamic(
  () => import("@/components/teacher-page").then((m) => m.TeacherPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    ),
  }
);

export default function HomePage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [dark, setDark] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  function toggleTheme() {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  return (
    <div className="relative min-h-[100dvh] bg-slate-50 dark:bg-slate-950">
      {/* ── Global floating nav ── */}
      <nav className="fixed right-3 top-3 z-50 flex items-center gap-1.5">
        {/* Role switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-card-md dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={cn(
              "flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              role === "student"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Student View
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={cn(
              "flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              role === "teacher"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Teacher Portal
          </button>
        </div>

        {/* User profile / Auth button */}
        <button
          type="button"
          onClick={() => setIsAuthOpen(true)}
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-card-md transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          title="Account profile"
        >
          <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">{user?.name ? user.name.split(" ")[0] : "Profile"}</span>
        </button>

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-card-md transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          {dark
            ? <Sun className="h-4 w-4 text-amber-500" />
            : <Moon className="h-4 w-4 text-slate-500" />}
        </button>
      </nav>

      {/* ── Page content ── */}
      {role === "student" ? <StudentPage /> : <TeacherPage />}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
