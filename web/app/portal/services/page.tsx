/**
 * Additional services — design/06 §5.
 * Traceability (design/10 P10): UC-C5 · BPMN B9 ·
 * product.product (x_kind=service) + sale.order.line · GET /api/services, POST /api/services/book
 */
import type { Metadata } from "next";
import { ServicesCatalog } from "./services-catalog";
import { getServices } from "@/lib/server/services";
import { getStays } from "@/lib/server/reservations";
import { getVillaBySlugMap } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Services" };

/** Note 2 §5 — the days the guest can schedule against are the real nights of
 *  their stay (from the reservation), not hard-coded dates. */
function stayDays(checkIn?: string, nights?: number): { iso: string; label: string }[] {
  const start = checkIn ? new Date(checkIn) : new Date();
  const count = Math.max(nights ?? 4, 1);
  const days: { iso: string; label: string }[] = [];
  for (let i = 0; i < Math.min(count, 7); i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (Number.isNaN(d.getTime())) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ iso, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }
  return days;
}

export default async function ServicesPage() {
  const [services, stays, villaMap] = await Promise.all([
    getServices(),
    getStays("upcoming"),
    getVillaBySlugMap(),
  ]);
  const stay = stays.find((s) => s.state === "checked_in") ?? stays[0];
  const villa = stay ? villaMap.get(stay.villaSlug) : undefined;
  const days = stayDays(stay?.checkIn, stay?.nights);
  return (
    <main className="container-na py-12 lg:py-16">
      <p className="eyebrow">During your stay</p>
      <h1 className="text-display-md mt-3 text-teal-700">Days shaped around you</h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-700">
        Everything below can be charged to your villa folio and settled at checkout — the
        luxury-correct default — or paid now.
      </p>
      <ServicesCatalog
        services={services}
        days={days}
        villaLabel={villa?.name ?? "your villa"}
      />
    </main>
  );
}
