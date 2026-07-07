/**
 * Villa search — design/04 §2.
 * Traceability (design/10 P2): UC-C1, UC-FO1 (self-serve) · BPMN B1, B3 ·
 * product.product + villa.reservation · GET /api/villas?checkin&checkout&guests&view&br
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { AnimatedVillaGrid } from "./villa-grid";
import { FilterBar } from "@/components/site/filter-bar";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Surface } from "@/components/motion";
import { getVillas } from "@/lib/server/catalog";
import { getBusyVillaIds } from "@/lib/server/reservations";

export const metadata: Metadata = { title: "The villas" };

interface Search {
  checkin?: string;
  checkout?: string;
  guests?: string;
  view?: string;
  br?: string;
}

export default async function VillasPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  // Business fields from Odoo (product.template) + real overlap-based availability.
  const [villas, busy] = await Promise.all([
    getVillas({
      guests: sp.guests ? Number(sp.guests) : undefined,
      view: sp.view,
      bedrooms: sp.br,
    }),
    getBusyVillaIds(sp.checkin, sp.checkout),
  ]);

  const results = villas.map((v) => ({ villa: v, available: !busy.has(v.id) }));

  const availableCount = results.filter((r) => r.available).length;

  return (
    <>
      <Navbar />
      <div className="h-16" aria-hidden />

      <Surface className="container-na pt-12 pb-8">
        <p className="eyebrow">The collection</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-display-lg text-teal-700">The villas</h1>
          <p className="text-[13px] text-stone-500" aria-live="polite">
            {sp.checkin
              ? `${availableCount} of ${results.length} available for your dates`
              : `Showing all ${results.length} villas`}
          </p>
        </div>
      </Surface>

      <Suspense>
        <FilterBar />
      </Suspense>

      <main className="container-na py-12">
        <AnimatedVillaGrid
          villas={results.map((r) => r.villa)}
          availability={Object.fromEntries(results.map((r) => [r.villa.slug, r.available]))}
          datesChosen={!!sp.checkin}
        />
      </main>

      <Footer />
    </>
  );
}
