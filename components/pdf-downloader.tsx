"use client";

import { useEffect } from "react";

interface PdfDownloaderProps {
  planText: string;
  title: string;
}

/** Lazy-loaded PDF downloader — uses browser's print-to-PDF */
export function PdfDownloader({ planText, title }: PdfDownloaderProps) {
  useEffect(() => {
    // Build a minimal HTML document and open print dialog
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 20px; color: #4f46e5; }
    pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <pre>${planText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
      };
    } else {
      URL.revokeObjectURL(url);
    }
  }, [planText, title]);

  return (
    <p className="text-xs text-slate-400">
      PDF print dialog opened. Use your browser&apos;s &quot;Save as PDF&quot; option.
    </p>
  );
}
