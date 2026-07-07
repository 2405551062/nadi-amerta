/**
 * Housekeeping console — design/07 §3 (tablet-first).
 * Traceability (design/10 P19): UC-HK1 · BPMN B24, B25, B10 (feeds) ·
 * product.product x_availability (+ villa.housekeeping.task, ERD gap §1.5.1) ·
 * GET /api/ops/hk/tasks · POST …/tasks/[id]/advance · PATCH /api/ops/villas/[id]/status
 */
import type { Metadata } from "next";
import { OpsHeader } from "@/components/ops/ui";
import { HousekeepingBoard } from "./hk-board";
import { getTasks, getVillaStatuses } from "@/lib/server/housekeeping";
import { getArrivalsToday } from "@/lib/server/reservations";

export const metadata: Metadata = { title: "Housekeeping" };

export default async function HousekeepingPage() {
  const [villas, tasks, arrivals] = await Promise.all([
    getVillaStatuses(),
    getTasks(),
    getArrivalsToday(),
  ]);
  const notReady = villas.filter((v) => ["cleaning", "inspection"].includes(v.status)).length;
  return (
    <>
      <OpsHeader
        greeting="Housekeeping"
        sub={`${arrivals.length} arrivals today · ${notReady} villas not yet ready`}
      />
      <HousekeepingBoard villas={villas} tasks={tasks} />
    </>
  );
}
