/**
 * Additional services — design/06 §5.
 * Traceability (design/10 P10): UC-C5 · BPMN B9 ·
 * product.product (x_kind=service) + sale.order.line · GET /api/services, POST /api/services/book
 */
import type { Metadata } from "next";
import { ServicesCatalog } from "./services-catalog";
import { getServices } from "@/lib/server/services";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <main className="container-na py-12 lg:py-16">
      <p className="eyebrow">During your stay</p>
      <h1 className="text-display-md mt-3 text-teal-700">Days shaped around you</h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-700">
        Everything below can be charged to your villa folio and settled at checkout — the
        luxury-correct default — or paid now.
      </p>
      <ServicesCatalog services={services} />
    </main>
  );
}
