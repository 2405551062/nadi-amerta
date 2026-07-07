/**
 * Reception console — design/07 §2.
 * Traceability (design/10 P17+P18): UC-FO1–FO5, UC-C3/C6 (staff side), UC-C1 (assisted) ·
 * BPMN B2, B3, B4, B7, B8, B10, B11, B18 + B1 (agent/walk-in) ·
 * villa.reservation + sale.order + res.partner + product.product ·
 * GET /api/ops/arrivals · POST /api/ops/checkin/[id] · POST /api/ops/checkout/[id] ·
 * GET /api/ops/calendar · GET/PATCH /api/ops/requests · POST /api/ops/reservations
 */
import type { Metadata } from "next";
import { OpsHeader } from "@/components/ops/ui";
import { ReceptionBoard } from "./reception-board";
import {
  getArrivalsToday, getInHouse, getDeparturesToday,
} from "@/lib/server/reservations";
import { getRequests } from "@/lib/server/requests";
import { getVillaStatuses } from "@/lib/server/housekeeping";

export const metadata: Metadata = { title: "Reception" };

export default async function ReceptionPage() {
  const [arrivals, inHouse, departures, requests, villas] = await Promise.all([
    getArrivalsToday(),
    getInHouse(),
    getDeparturesToday(),
    getRequests("all"),
    getVillaStatuses(),
  ]);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  return (
    <>
      <OpsHeader
        greeting="Front office"
        sub={`${today} · ${arrivals.length} arrivals · ${departures.length} departure · ${inHouse.length} in house`}
      />
      <ReceptionBoard
        arrivals={arrivals}
        inHouse={inHouse}
        departures={departures}
        requests={requests}
        villas={villas}
      />
    </>
  );
}
