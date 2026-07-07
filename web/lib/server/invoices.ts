/**
 * Invoices domain — derived from reservations (account.move in the full ERD).
 * For this build, each billable reservation projects to one invoice view-model;
 * standing up Odoo Accounting (journals/taxes/chart) is deferred (design/09 §4).
 */
import "server-only";
import { getStays } from "@/lib/server/reservations";
import type { Invoice } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

const METHODS = ["Visa •• 4421", "Bank transfer (VA)", "QRIS", "GoPay"];

export async function getInvoices(): Promise<Invoice[]> {
  if (!USE_ODOO) return [];
  const stays = await getStays("all");
  return stays
    .filter((s) => s.state !== "draft")
    .map((s, i) => {
      const [mon, , year] = s.checkOut.replace(",", "").split(" ");
      return {
        id: s.id,
        number: `INV/${year}/${String(1000 + s.id).slice(-4)}`,
        reservationCode: s.code,
        stay: `${villaLabel(s.villaSlug)} · ${mon} ${year}`,
        date: s.checkOut,
        amount: s.total,
        state: s.state === "cancelled" ? "refunded" : s.balance > 0 ? "awaiting" : "paid",
        method: METHODS[i % METHODS.length],
        reference: `MID-${String(88000000 + s.id * 137).slice(0, 8)}`,
      };
    });
}

function villaLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
