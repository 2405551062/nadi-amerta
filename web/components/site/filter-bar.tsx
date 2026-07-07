"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GuestStepper, toISO } from "@/components/site/booking-bar";
import { cn } from "@/lib/utils";

/**
 * Villa search filter bar — design/04 §2. URL is the source of truth
 * (?checkin&checkout&guests&view&br) so searches are sharable and back-safe.
 */
export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = params.get("checkin");
    const to = params.get("checkout");
    return from ? { from: new Date(from), to: to ? new Date(to) : undefined } : undefined;
  });

  const guests = Number(params.get("guests") ?? 2);
  const view = params.get("view") ?? "any";
  const br = params.get("br") ?? "any";
  const hasFilters = !!(params.get("checkin") || params.get("view") || params.get("br"));

  const push = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "any") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`/villas?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  const applyRange = (r: DateRange | undefined) => {
    setRange(r);
    push({
      checkin: r?.from ? toISO(r.from) : undefined,
      checkout: r?.to ? toISO(r.to) : undefined,
    });
  };

  const fmt = (d?: Date) =>
    d?.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-ivory-100/85 backdrop-blur-xl">
      <div className="container-na flex flex-wrap items-center gap-3 py-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-11 items-center gap-2 rounded-md border bg-white px-4 text-sm transition-colors",
                range?.from ? "border-palm-700 font-medium text-ink-900" : "border-input text-stone-500"
              )}
            >
              <CalendarIcon className="size-4 text-palm-700" aria-hidden />
              {range?.from ? `${fmt(range.from)} — ${fmt(range.to) ?? "…"}` : "Dates"}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-auto rounded-lg p-3 shadow-lg">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={applyRange}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex h-11 items-center gap-3 rounded-md border border-input bg-white px-4">
          <span className="text-sm text-stone-500">Guests</span>
          <GuestStepper value={guests} onChange={(n) => push({ guests: String(n) })} />
        </div>

        <Select value={view} onValueChange={(v) => push({ view: v })}>
          <SelectTrigger className="h-11! w-[150px] bg-white" aria-label="View">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any view</SelectItem>
            <SelectItem value="river">River</SelectItem>
            <SelectItem value="rice">Rice paddy</SelectItem>
            <SelectItem value="garden">Garden</SelectItem>
          </SelectContent>
        </Select>

        <div
          className="flex h-11 items-center rounded-md border border-input bg-white p-1"
          role="group"
          aria-label="Bedrooms"
        >
          {[
            { v: "any", label: "All" },
            { v: "1", label: "1 BR" },
            { v: "2", label: "2 BR" },
            { v: "3", label: "3+ BR" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => push({ br: o.v })}
              aria-pressed={br === o.v}
              className={cn(
                "h-full rounded-[4px] px-3 text-sm transition-colors",
                br === o.v ? "bg-palm-700 font-medium text-ivory-50" : "text-ink-700 hover:bg-ivory-200"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setRange(undefined);
              router.replace("/villas", { scroll: false });
            }}
            className="flex items-center gap-1 text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
          >
            <X className="size-3.5" aria-hidden /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}
