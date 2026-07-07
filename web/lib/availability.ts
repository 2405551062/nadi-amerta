/** Convert Odoo booked ranges (ISO) to react-day-picker disabled matchers. */
import type { Matcher } from "react-day-picker";

export interface BookedRange {
  from: string; // ISO yyyy-mm-dd (check-in)
  to: string; // ISO yyyy-mm-dd (check-out / departure)
}

/**
 * Disable occupied nights [check_in .. check_out-1]. The departure day itself
 * stays selectable so a new guest can check in on a turnover day.
 */
export function disabledFromBooked(ranges: BookedRange[], includeBeforeToday = true): Matcher[] {
  const matchers: Matcher[] = ranges.map((r) => {
    const from = new Date(r.from + "T00:00:00");
    const to = new Date(r.to + "T00:00:00");
    to.setDate(to.getDate() - 1); // last occupied night
    return { from, to };
  });
  if (includeBeforeToday) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    matchers.push({ before: today });
  }
  return matchers;
}
