"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Loader2, Send, X } from "lucide-react";
import { compressImageToBase64 } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/types";

interface InputCardProps {
  value: string;
  onChange: (v: string) => void;
  language: Language;
  onSubmit: (message: string, imageBase64?: string) => void;
  isRunning: boolean;
  quickPrompts?: string[];
}

const PLACEHOLDERS: Record<Language, string> = {
  en: "Ask any science or math doubt… or upload a photo of your homework.",
  hi: "कोई भी विज्ञान या गणित का सवाल पूछें… या होमवर्क की फ़ोटो अपलोड करें।",
  kn: "ಯಾವುದೇ ವಿಜ್ಞಾನ ಅಥವಾ ಗಣಿತದ ಸಂಶಯ ಕೇಳಿ… ಅಥವಾ ಮನೆಕೆಲಸದ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ.",
};

export function InputCard({ value, onChange, language, onSubmit, isRunning, quickPrompts }: InputCardProps) {
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageError, setImageError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setImageError(null);
    try {
      const compressed = await compressImageToBase64(file);
      setImageBase64(compressed);
    } catch {
      setImageError("Could not process image. Please try another photo.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) void handleFile(file);
  }

  function handleSubmit() {
    if (!value.trim() || isRunning) return;
    onSubmit(value.trim(), imageBase64);
  }

  return (
    <div className="space-y-3">
      {/* Quick prompts */}
      {quickPrompts && quickPrompts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((q) => (
            <button
              key={q}
              type="button"
              disabled={isRunning}
              onClick={() => onChange(q)}
              className="min-h-[44px] rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-left text-xs font-medium text-indigo-800 transition disabled:opacity-50 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Main input area */}
      <div
        className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={PLACEHOLDERS[language]}
          rows={3}
          className="w-full resize-none rounded-t-2xl bg-transparent px-4 pt-4 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />

        {/* Image preview */}
        {imageBase64 && (
          <div className="relative mx-4 mb-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageBase64}
              alt="Attached homework"
              className="h-24 w-24 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
            />
            <button
              type="button"
              onClick={() => setImageBase64(undefined)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
            <span className="mt-1 block text-[10px] text-slate-400">Compressed &lt;1 MB</span>
          </div>
        )}

        {imageError && (
          <p className="mx-4 mb-2 text-xs text-red-600 dark:text-red-400">{imageError}</p>
        )}

        {/* Toolbar row */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
          <div className="flex items-center gap-1">
            {/* Camera capture (mobile) */}
            <label
              className={cn(
                "flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                isRunning && "pointer-events-none opacity-50"
              )}
              aria-label="Capture homework photo"
            >
              <Camera className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={isRunning}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
            </label>

            {/* Gallery pick */}
            <label
              className={cn(
                "flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                isRunning && "pointer-events-none opacity-50"
              )}
              aria-label="Attach image from gallery"
            >
              <ImageIcon className="h-5 w-5" />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isRunning}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isRunning || !value.trim()}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{isRunning ? "Thinking…" : "Ask Tutor"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
