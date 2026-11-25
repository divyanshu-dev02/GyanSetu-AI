export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 lg:px-6">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="hidden h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 lg:block" />
      </div>
    </div>
  );
}
