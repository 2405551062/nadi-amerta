"use client";

/**
 * Flow stepper — design/05 §0. Three circles joined by a hairline that fills
 * with gold per step (the "Amerta thread", motion §2.6). Completed steps are links.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_WATER } from "@/components/motion";

const STEPS = [
  { key: "dates", label: "Dates" },
  { key: "details", label: "Details" },
  { key: "confirm", label: "Confirm" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export function FlowStepper({ slug, current }: { slug: string; current: StepKey }) {
  const idx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Booking progress" className="mx-auto w-full max-w-md">
      <ol className="flex items-center">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          const circle = (
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border text-[11px] transition-colors",
                done && "border-palm-700 bg-palm-700 text-ivory-50",
                active && "border-palm-700 bg-transparent",
                !done && !active && "border-sand-400"
              )}
              aria-hidden
            >
              {done ? <Check className="size-3" strokeWidth={3} /> : active ? (
                <span className="size-2 rounded-full bg-amerta-400" />
              ) : null}
            </span>
          );
          return (
            <li
              key={s.key}
              className={cn("flex items-center", i > 0 && "flex-1")}
              aria-current={active ? "step" : undefined}
            >
              {i > 0 && (
                <span className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-sand-300" aria-hidden>
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-amerta-400"
                    initial={false}
                    animate={{ width: i <= idx ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: EASE_WATER }}
                  />
                </span>
              )}
              {done ? (
                <Link href={`/book/${slug}/${s.key}`} className="flex items-center gap-2">
                  {circle}
                  <span className="text-sm font-medium text-palm-700">{s.label}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  {circle}
                  <span className={cn("text-sm", active ? "font-medium text-ink-900" : "text-stone-500")}>
                    {s.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
