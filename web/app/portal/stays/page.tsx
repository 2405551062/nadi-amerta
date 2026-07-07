/**
 * Reservation history — design/06 §3.
 * Traceability (design/10 P8): UC-C4 (cancel + refund policy), UC-C2 ·
 * BPMN B4 (modify) + cancel branch · villa.reservation + account.move (credit note) ·
 * GET /api/stays, POST /api/stays/[code]/cancel (two-step refund quote)
 */
import type { Metadata } from "next";
import { StaysList } from "./stays-list";
import { getStays } from "@/lib/server/reservations";
import { getVillaBySlugMap } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Reservations" };

export default async function StaysPage() {
  const [stays, villaMap] = await Promise.all([getStays("all"), getVillaBySlugMap()]);
  const villas = Object.fromEntries(
    [...villaMap.values()].map((v) => [v.slug, { name: v.name, image: v.image, slug: v.slug }])
  );
  return (
    <main className="container-na py-12 lg:py-16">
      <p className="eyebrow">Reservations</p>
      <h1 className="text-display-md mt-3 text-teal-700">Every stay, in one place</h1>
      <StaysList stays={stays} villas={villas} />
    </main>
  );
}
