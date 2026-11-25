import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700",
      outline: "border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
      secondary: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
      ghost: "text-slate-700 dark:text-slate-300",
    };
    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      default: "min-h-[44px] px-4 py-2 text-sm",
      sm: "min-h-[44px] px-3 py-1.5 text-xs",
      lg: "min-h-[48px] px-6 py-3 text-base",
      icon: "min-h-[44px] min-w-[44px] p-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
