/**
 * Build the "Your journey" timeline from a real reservation instead of the old
 * hardcoded demo steps. Pure function — safe in server or client components.
 */
import type { JourneyStep } from "@/components/journey-timeline";
import type { Reservation } from "@/lib/types";

/** Month label for the rail heading, e.g. "August". Falls back to "" if unknown. */
export function journeyMonth(r: Reservation): string {
  const d = new Date(r.checkIn);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "long" });
}

export function buildJourney(r: Reservation, villaName: string): JourneyStep[] {
  const paid = r.paymentState === "paid" || r.paymentState === "deposit";
  const checkedIn = r.state === "checked_in" || r.state === "checked_out";
  const checkedOut = r.state === "checked_out";
  const checkInShort = (r.checkIn || "").split(",")[0]; // "Aug 12"

  const payLabel =
    r.paymentState === "deposit" ? "Deposit paid" : paid ? "Paid in full" : "Awaiting payment";

  return [
    { label: "Booked", date: "Reservation confirmed", state: "done" },
    {
      label: paid ? "Payment complete" : "Payment pending",
      date: payLabel,
      state: paid ? "done" : "current",
    },
    {
      label: "Arrival ritual planned",
      date: "Before you arrive",
      state: checkedIn ? "done" : paid ? "current" : "todo",
    },
    {
      label: "Pre-arrival concierge",
      date: "A few days before",
      state: checkedIn ? "done" : "todo",
    },
    {
      label: `Check-in at ${villaName}`,
      date: checkInShort ? `${checkInShort} · 14:00` : "14:00",
      state: checkedOut ? "done" : checkedIn ? "current" : "todo",
    },
  ];
}
