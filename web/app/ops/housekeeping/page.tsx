/**
 * Housekeeping console — design/07 §3 (tablet-first).
 * Traceability (design/10 P19): UC-HK1 · BPMN B24, B25, B10 (feeds) ·
 * product.product x_availability (+ villa.housekeeping.task, ERD gap §1.5.1) ·
 * GET /api/ops/hk/tasks · POST …/tasks/[id]/advance · PATCH /api/ops/villas/[id]/status
 */
import type { Metadata } from "next";
import { OpsHeader } from "@/components/ops/ui";
import { HousekeepingBoard } from "./hk-board";
import { getTasks, getVillaStatuses, getHousekeepers, getRooms } from "@/lib/server/housekeeping";
import { getArrivalsToday } from "@/lib/server/reservations";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Housekeeping" };

export default async function HousekeepingPage() {
  const [villas, tasks, arrivals, housekeepers, rooms, session] = await Promise.all([
    getVillaStatuses(),
    getTasks(),
    getArrivalsToday(),
    getHousekeepers(),
    getRooms(),
    getSession(),
  ]);
  const notReady = villas.filter((v) => ["cleaning", "inspection"].includes(v.status)).length;
  // Note 2 §2 — only a manager/admin creates & assigns tasks.
  const canManage = session?.groups?.includes("General Manager") ?? false;
  return (
    <>
      <OpsHeader
        greeting="Housekeeping"
        sub={`${arrivals.length} arrivals today · ${notReady} villas not yet ready`}
      />
      <HousekeepingBoard
        villas={villas}
        tasks={tasks}
        housekeepers={housekeepers}
        rooms={rooms}
        canManage={canManage}
      />
    </>
  );
}
