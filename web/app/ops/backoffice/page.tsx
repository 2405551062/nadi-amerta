/**
 * Back office console — design/10 P23 (new page required by BPMN B12–B14).
 * Traceability: UC-F1 (shared) · B12 booking documentation · B13 marketing/legal
 * export · B14 reports & analytics · villa.reservation + sale.order + res.partner +
 * account.move · GET /api/ops/reports/analytics · POST /api/ops/exports
 */
import type { Metadata } from "next";
import { AreaChart, KpiCard, OpsHeader, Panel } from "@/components/ops/ui";
import { Surface } from "@/components/motion";
import { getRevenueSeries } from "@/lib/server/finance";
import { ExportActions } from "./export-actions";

export const metadata: Metadata = { title: "Back office" };

const SOURCE_MIX = [
  { label: "Direct website", share: 46 },
  { label: "OTA — Booking.com / Agoda / Airbnb", share: 38 },
  { label: "Agents & partners", share: 12 },
  { label: "Walk-in & repeat direct", share: 4 },
];

export default async function BackOfficePage() {
  const revenueSeries = await getRevenueSeries();
  return (
    <>
      <OpsHeader greeting="Back office" sub="Documentation, exports & analytics · July 2026" />

      <Surface className="space-y-6 p-6 lg:p-10">
        {/* B14 — reports & analytics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Bookings MTD" value="19" delta="↑ 3 vs June" />
          <KpiCard label="Avg length of stay" value="4.6 nights" delta="↑ 0.4" />
          <KpiCard label="Repeat guests" value="31%" delta="↑ 5 pts" />
          <KpiCard label="Review score" value="4.9" delta="312 stays" tone="neutral" />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Booking volume · last 30 days" className="xl:col-span-2">
            <AreaChart data={revenueSeries} />
          </Panel>

          <Panel title="Booking sources">
            <ul className="space-y-4">
              {SOURCE_MIX.map((s) => (
                <li key={s.label}>
                  <div className="flex justify-between text-sm text-ink-700">
                    <span>{s.label}</span>
                    <span className="font-mono text-[13px]">{s.share}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-300">
                    <div className="h-full rounded-full bg-palm-700" style={{ width: `${s.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* B12 + B13 — documentation & exports */}
        <ExportActions />
      </Surface>
    </>
  );
}
