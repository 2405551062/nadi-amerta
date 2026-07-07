"use client";

import Link from "next/link";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { motion } from "framer-motion";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GuestStepper, toISO } from "@/components/site/booking-bar";
import { idr, quote } from "@/lib/format";
import { disabledFromBooked, type BookedRange } from "@/lib/availability";
import type { Villa } from "@/lib/types";
import { cn } from "@/lib/utils";

function nightsBetween(r?: DateRange): number {
  if (!r?.from || !r?.to) return 0;
  return Math.max(0, Math.round((r.to.getTime() - r.from.getTime()) / 86_400_000));
}

/**
 * Sticky booking card — design/03 §5 + 04 §3. Gold hairline top border,
 * live fee preview (PHR 10% + service 8%), totals reflow with layout animation.
 * Reserve deep-links the flow: /book/[slug]?checkin&checkout&guests (UC-C1 → B1).
 * Dates already booked in Odoo are disabled in the calendar.
 */
export function BookingCard({ villa, bookedRanges = [] }: { villa: Villa; bookedRanges?: BookedRange[] }) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [minStayNote, setMinStayNote] = useState(false);
  const disabled = disabledFromBooked(bookedRanges);

  const nights = nightsBetween(range);
  const q = nights > 0 ? quote(villa.priceNight, nights) : null;

  const onSelect = (r: DateRange | undefined) => {
    const n = nightsBetween(r);
    if (r?.from && r?.to && n < villa.minStay) {
      setMinStayNote(true);
      setRange({ from: r.from, to: undefined });
      return;
    }
    setMinStayNote(false);
    setRange(r);
  };

  const reserveHref = q
    ? `/book/${villa.slug}?checkin=${toISO(range!.from!)}&checkout=${toISO(range!.to!)}&guests=${guests}`
    : `/book/${villa.slug}`;

  const fmt = (d?: Date) => d?.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <>
      {/* Desktop sticky card */}
      <motion.aside
        layout
        className="hairline-gold-top sticky top-24 hidden rounded-lg bg-card p-6 shadow-md lg:block"
        aria-label="Reserve this villa"
      >
        <p>
          <span className="text-price text-teal-700">{idr(villa.priceNight)}</span>
          <span className="ml-1.5 text-[13px] text-stone-500">/ night</span>
        </p>
        <p className="mt-1 text-[13px] text-sage-500">Two August weekends remain</p>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "mt-5 flex h-12 w-full items-center gap-3 rounded-md border bg-white px-4 text-left text-sm transition-colors",
                range?.from ? "border-palm-700 font-medium" : "border-input text-stone-500"
              )}
            >
              <CalendarIcon className="size-4 text-palm-700" aria-hidden />
              {range?.from
                ? `${fmt(range.from)} — ${fmt(range.to) ?? "choose check-out"}`
                : "Choose your dates"}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-auto rounded-lg p-3 shadow-lg">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={onSelect}
              disabled={disabled}
            />
            <p className="mt-2 px-2 text-xs text-stone-500">
              {villa.name} asks for a {villa.minStay}-night minimum.
            </p>
          </PopoverContent>
        </Popover>
        {minStayNote && (
          <p className="mt-2 text-[13px] text-terracotta-500" role="alert">
            {villa.name} asks for a {villa.minStay}-night minimum — please choose a later check-out.
          </p>
        )}

        <div className="mt-3 flex h-12 items-center justify-between rounded-md border border-input bg-white px-4">
          <span className="text-sm text-ink-700">Guests</span>
          <GuestStepper value={guests} onChange={setGuests} max={villa.capacity} />
        </div>

        <Link
          href={reserveHref}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all duration-200 hover:bg-palm-600 active:scale-[0.98]"
        >
          Reserve
        </Link>
        <p className="mt-3 text-center text-xs text-stone-500">You won&apos;t be charged yet</p>

        {q && (
          <motion.dl
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm"
          >
            <div className="flex justify-between text-ink-700">
              <dt>
                {idr(villa.priceNight)} × {q.nights} nights
              </dt>
              <dd className="font-mono text-[13px]">{idr(q.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-700">
              <dt>PHR tax 10%</dt>
              <dd className="font-mono text-[13px]">{idr(q.phr)}</dd>
            </div>
            <div className="flex justify-between text-ink-700">
              <dt>Service 8%</dt>
              <dd className="font-mono text-[13px]">{idr(q.service)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <dt className="font-display text-lg text-ink-900">Total</dt>
              <dd className="text-price text-teal-700" aria-live="polite">
                {idr(q.total)}
              </dd>
            </div>
          </motion.dl>
        )}

        <p className="mt-4 text-center text-xs text-stone-500">
          Free cancellation before 7 days · PHR &amp; service included above
        </p>
      </motion.aside>

      {/* Mobile dock — design/04 §3 */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-between gap-4 border-t border-border bg-ivory-50/95 px-5 backdrop-blur-xl lg:hidden">
        <p>
          <span className="text-price text-teal-700">{idr(villa.priceNight)}</span>
          <span className="ml-1 text-xs text-stone-500">/ night</span>
        </p>
        <Link
          href={reserveHref}
          className="flex h-12 items-center rounded-md bg-palm-700 px-8 text-sm font-medium text-ivory-50 active:scale-[0.98]"
        >
          Reserve
        </Link>
      </div>
    </>
  );
}
