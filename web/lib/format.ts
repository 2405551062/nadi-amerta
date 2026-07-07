/** IDR formatting — amounts are integer rupiah everywhere (see design/09 §3). */

export function idr(amount: number): string {
  return `IDR ${amount.toLocaleString("en-US")}`;
}

/** Compact form for cards / mobile: 8.5M, 950K */
export function idrShort(amount: number): string {
  if (amount >= 1_000_000_000) return `IDR ${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (amount >= 1_000_000) return `IDR ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (amount >= 1_000) return `IDR ${Math.round(amount / 1_000)}K`;
  return `IDR ${amount}`;
}

/** Accessible label per design/08 §3 */
export function idrLabel(amount: number): string {
  return `${amount.toLocaleString("en-US")} rupiah`;
}

export const PHR_RATE = 0.1; // Pajak Hotel & Restoran (Bali)
export const SERVICE_RATE = 0.08;

export interface Quote {
  nights: number;
  subtotal: number;
  phr: number;
  service: number;
  total: number;
}

export function quote(priceNight: number, nights: number, extras = 0): Quote {
  const subtotal = priceNight * nights + extras;
  const phr = Math.round(subtotal * PHR_RATE);
  const service = Math.round(subtotal * SERVICE_RATE);
  return { nights, subtotal, phr, service, total: subtotal + phr + service };
}

export function formatRange(checkIn: string, checkOut: string): string {
  // "Aug 12, 2026" + "Aug 16, 2026" → "Aug 12 — 16, 2026"
  const [inMonth, inDay] = checkIn.replace(",", "").split(" ");
  const [outMonth, outDay, year] = checkOut.replace(",", "").split(" ");
  if (inMonth === outMonth) return `${inMonth} ${inDay} — ${outDay}, ${year}`;
  return `${inMonth} ${inDay} — ${outMonth} ${outDay}, ${year}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
