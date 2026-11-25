"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  open: string | null;
  toggle: (v: string) => void;
}
const AccordionContext = React.createContext<AccordionContextValue>({
  open: null,
  toggle: () => {},
});

export function Accordion({
  children,
  defaultOpen,
  className,
}: {
  children: React.ReactNode;
  defaultOpen?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState<string | null>(defaultOpen ?? null);
  const toggle = (v: string) => setOpen((prev) => (prev === v ? null : v));
  return (
    <AccordionContext.Provider value={{ open, toggle }}>
      <div className={cn("divide-y divide-slate-200 dark:divide-slate-800", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  trigger,
  children,
  className,
}: {
  value: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { open, toggle } = React.useContext(AccordionContext);
  const isOpen = open === value;
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => toggle(value)}
        aria-expanded={isOpen}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 py-3 text-left font-semibold"
      >
        {trigger}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
}
