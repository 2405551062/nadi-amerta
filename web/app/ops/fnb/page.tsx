/**
 * F&B kitchen console — design/10 P21 (new page required by UC-FB1 / BPMN B15–B16).
 * Traceability: sale.order.line (or pos.order) + account.move ·
 * GET /api/ops/fnb/orders · POST …/orders/[id]/advance · POST …/orders/[id]/bill
 */
import type { Metadata } from "next";
import { OpsHeader } from "@/components/ops/ui";
import { FnbQueue } from "./fnb-queue";
import { getFnbOrders } from "@/lib/server/dining";
import { getVillaBySlugMap } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "F&B Kitchen" };

export default async function FnbPage() {
  const [orders, villaMap] = await Promise.all([getFnbOrders(), getVillaBySlugMap()]);
  const villas = Object.fromEntries([...villaMap.values()].map((v) => [v.slug, v.name]));
  const open = orders.filter((o) => o.state !== "billed").length;
  return (
    <>
      <OpsHeader greeting="The kitchen" sub={`Service 06:00 — 22:00 · ${open} open orders`} />
      <FnbQueue initialOrders={orders} villaNames={villas} />
    </>
  );
}
