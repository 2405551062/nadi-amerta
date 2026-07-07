"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Minus, Plus, Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function fmt(d?: Date) {
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : undefined;
}

export function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Guest stepper — design/03 §14. */
export function GuestStepper({
  value,
  onChange,
  min = 1,
  max = 6,
  dark = false,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  dark?: boolean;
}) {
  const btn = cn(
    "flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-40",
    dark
      ? "border-ivory-100/40 text-ivory-100 hover:bg-ivory-100/10"
      : "border-sand-400 text-ink-700 hover:border-palm-700"
  );
  return (
    <div className="flex items-center gap-3" role="group" aria-label="Number of guests">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Fewer guests">
        <Minus className="size-3.5" />
      </button>
      <span className={cn("min-w-5 text-center text-sm font-medium tabular-nums", dark && "text-ivory-100")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="More guests">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * Hero glass booking bar — design/04 §1. The only conversion element above the fold.
 * Submits to /villas with the search encoded in the URL (state source of truth).
 */
export function BookingBar() {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [open, setOpen] = useState(false);

  const search = () => {
    const params = new URLSearchParams();
    if (range?.from) params.set("checkin", toISO(range.from));
    if (range?.to) params.set("checkout", toISO(range.to));
    params.set("guests", String(guests));
    router.push(`/villas?${params.toString()}`);
  };

  return (
    <div className="glass mx-auto flex w-full max-w-[880px] flex-col divide-y divide-ink-900/10 rounded-xl md:h-[72px] md:flex-row md:items-stretch md:divide-x md:divide-y-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex flex-[2] items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-white/40 md:py-0"
            aria-label="Choose check-in and check-out dates"
          >
            <CalendarIcon className="size-4 shrink-0 text-palm-700" aria-hidden />
            <span className="flex flex-1 items-center justify-between gap-2 text-sm">
              <span className={cn("font-medium", !range?.from && "text-stone-600")}>
                {fmt(range?.from) ?? "Check-in"}
              </span>
              <span className="text-stone-500" aria-hidden>—</span>
              <span className={cn("font-medium", !range?.to && "text-stone-600")}>
                {fmt(range?.to) ?? "Check-out"}
              </span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={12} className="w-auto rounded-lg p-3 shadow-lg">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={setRange}
            disabled={{ before: new Date() }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center justify-between gap-4 px-6 py-4 md:py-0">
        <span className="text-sm font-medium text-ink-700">Guests</span>
        <GuestStepper value={guests} onChange={setGuests} />
      </div>

      <div className="flex items-center p-3 md:pl-3">
        <button
          type="button"
          onClick={search}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-palm-700 px-8 text-sm font-medium text-ivory-50 transition-all duration-200 hover:bg-palm-600 active:scale-[0.98] md:w-auto"
        >
          <Search className="size-4" aria-hidden />
          Search
        </button>
      </div>
    </div>
  );
}
