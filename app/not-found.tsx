import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
        404
      </span>
      <h1 className="text-2xl font-extrabold">Page not found</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        The page you are looking for does not exist.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Student Tutor
        </Link>
        <Link
          href="/teacher"
          className="flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Teacher Co-Pilot
        </Link>
      </div>
    </div>
  );
}
