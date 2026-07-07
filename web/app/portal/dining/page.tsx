/**
 * Restaurant ordering — design/06 §6.
 * Traceability (design/10 P11): UC-C5, UC-FB1 (initiates) · BPMN B9, B15 ·
 * product.product (F&B) + sale.order.line · GET /api/dining/menu, POST /api/dining/orders
 */
import type { Metadata } from "next";
import { DiningMenu } from "./dining-menu";
import { getMenu } from "@/lib/server/dining";
import { getStays } from "@/lib/server/reservations";
import { getVillaBySlugMap } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "In-villa dining" };

export default async function DiningPage() {
  const [menu, stays, villaMap] = await Promise.all([
    getMenu(),
    getStays("upcoming"),
    getVillaBySlugMap(),
  ]);
  // deliver to the guest's current in-house villa if any
  const inHouse = stays.find((s) => s.state === "checked_in");
  const villa = inHouse ? villaMap.get(inHouse.villaSlug) : undefined;
  const villaLabel = villa?.name ?? "Villa Tirta";
  return (
    <main className="container-na py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">In-villa dining</p>
          <h1 className="text-display-md mt-3 text-teal-700">The kitchen is open</h1>
        </div>
        <p className="flex items-center gap-2 text-sm text-ink-700">
          <span className="size-2 rounded-full bg-sage-500" aria-hidden />
          06:00 — 22:00 · to {villaLabel}
        </p>
      </div>
      <DiningMenu menu={menu} villaId={villa?.id} villaLabel={villaLabel} />
    </main>
  );
}
