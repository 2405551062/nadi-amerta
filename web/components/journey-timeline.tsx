import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface JourneyStep {
  label: string;
  date: string;
  state: "done" | "current" | "todo";
}

/**
 * "Your journey" gold timeline — design/06 §1.2, reused on the confirmation page.
 * Rendered as an ordered list for screen readers (design/08 §3).
 */
export function JourneyTimeline({ steps, className }: { steps: JourneyStep[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-4 pb-8 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute top-6 left-[11px] h-[calc(100%-24px)] w-px",
                s.state === "done" ? "bg-amerta-400/60" : "bg-sand-400"
              )}
            />
          )}
          <span
            aria-hidden
            className={cn(
              "z-10 mt-0.5 flex size-[23px] shrink-0 items-center justify-center rounded-full border",
              s.state === "done" && "border-amerta-400 bg-amerta-400 text-forest-900",
              s.state === "current" &&
                "border-amerta-400 bg-transparent ring-4 ring-amerta-400/20 motion-safe:animate-pulse",
              s.state === "todo" && "border-sand-400 bg-transparent"
            )}
          >
            {s.state === "done" && <Check className="size-3" strokeWidth={3} />}
            {s.state === "current" && <span className="size-2 rounded-full bg-amerta-400" />}
          </span>
          <div className={cn(s.state === "todo" && "opacity-50")}>
            <p className="text-sm font-medium text-ink-900">
              {s.label}
              {s.state === "current" && <span className="sr-only"> (current step)</span>}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">{s.date}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
