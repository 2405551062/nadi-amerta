"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Booking code chip — mono, copy-on-click (design/05 §5.1). */
export function CopyChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="mt-6 inline-flex h-10 items-center gap-2 rounded-full border border-amerta-300/40 px-5 font-mono text-sm text-amerta-300 transition-colors hover:bg-white/5"
      aria-label={`Booking code ${code} — copy to clipboard`}
    >
      {code}
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
