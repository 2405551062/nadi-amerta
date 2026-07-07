"use client";

/**
 * Booking summary card — design/03 §5 + 05 §0. Gold hairline top, arch photo,
 * mono line items, serif total with count-up; layout-animated on line changes.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { idr, quote, PHR_RATE, SERVICE_RATE } from "@/lib/format";
import type { Villa } from "@/lib/types";
import {
  fmtISO, nightsOf, useBooking, PICKUP_PRICE,
} from "./booking-context";

export function SummaryCard({
  villa,
  action,
}: {
  villa: Villa;
  action?: React.ReactNode;
}) {
  const { state } = useBooking();
  const nights = nightsOf(state);
  const extras = state.pickup ? PICKUP_PRICE : 0;
  const q = nights > 0 ? quote(villa.priceNight, nights, extras) : null;

  return (
    <motion.aside
      layout
      className="hairline-gold-top rounded-lg bg-card p-6 shadow-md"
      aria-label="Booking summary"
    >
      <div className="flex flex-col items-center text-center">
        <div className="rounded-arch relative h-28 w-24 overflow-hidden">
          <Image src={villa.image} alt={villa.name} fill sizes="96px" className="object-cover" />
        </div>
        <h2 className="text-display-sm mt-4 text-teal-700">{villa.name}</h2>
        <p className="mt-1 text-sm text-stone-500">
          {state.checkin && state.checkout
            ? `${fmtISO(state.checkin)} — ${fmtISO(state.checkout)} · ${nights} ${nights === 1 ? "night" : "nights"}`
            : "Choose your dates"}
          {" · "}
          {state.guests} {state.guests === 1 ? "guest" : "guests"}
        </p>
      </div>

      {q ? (
        <motion.dl layout className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
          <div className="flex justify-between gap-4 text-ink-700">
            <dt>
              Nightly rate
              <span className="block text-xs text-stone-500">
                {idr(villa.priceNight)} × {nights}
              </span>
            </dt>
            <dd className="font-mono text-[13px]">{idr(villa.priceNight * nights)}</dd>
          </div>
          {state.pickup && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between gap-4 text-ink-700"
            >
              <dt>Airport pickup</dt>
              <dd className="font-mono text-[13px]">{idr(PICKUP_PRICE)}</dd>
            </motion.div>
          )}
          <div className="flex justify-between gap-4 border-t border-border pt-3 text-ink-700">
            <dt>PHR tax {PHR_RATE * 100}%</dt>
            <dd className="font-mono text-[13px]">{idr(q.phr)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-ink-700">
            <dt>Service {SERVICE_RATE * 100}%</dt>
            <dd className="font-mono text-[13px]">{idr(q.service)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
            <dt className="font-display text-xl text-ink-900">Total</dt>
            <dd className="text-price text-teal-700" aria-live="polite">
              {idr(q.total)}
            </dd>
          </div>
          {state.payment === "deposit" && (
            <div className="flex justify-between gap-4 rounded-md bg-ivory-200/70 px-3 py-2 text-[13px] text-ink-700">
              <dt>Due today (30%)</dt>
              <dd className="font-mono">{idr(Math.round(q.total * 0.3))}</dd>
            </div>
          )}
        </motion.dl>
      ) : (
        <p className="mt-6 border-t border-border pt-5 text-center text-sm text-stone-500">
          Your total appears once dates are chosen.
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-500">
        <Lock className="size-3" aria-hidden /> Secured payment via Midtrans
      </p>
    </motion.aside>
  );
}
