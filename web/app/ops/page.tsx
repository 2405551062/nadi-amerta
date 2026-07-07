/**
 * Admin dashboard — design/07 §1 (render: design/assets/tirta-admin-dashboard.png).
 * Traceability (design/10 P16): UC-F1 (view) · BPMN B10, B14, B23 (read) ·
 * all ERD entities (read) · GET /api/ops/kpis, GET /api/ops/villa-status (SSE)
 */
import type { Metadata } from "next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AreaChart, KpiCard, OpsHeader, Panel } from "@/components/ops/ui";
import { StatusBadge, VipBadge } from "@/components/status-badge";
import { Surface } from "@/components/motion";
import { getKpis, getRevenueSeries } from "@/lib/server/finance";
import { getArrivalsToday } from "@/lib/server/reservations";
import { getVillaStatuses } from "@/lib/server/housekeeping";
import { getVillaBySlugMap } from "@/lib/server/catalog";
import { idrShort } from "@/lib/format";

export const metadata: Metadata = { title: "Operations" };

const ANOMALIES = [
  { text: "Villa Lotus consuming 2.1× linen average this week", action: "Assign check" },
  { text: "Booking.com rate parity drift on Villa Surya (−4%)", action: "Review rates" },
];

export default async function AdminDashboard() {
  const [kpis, revenueSeries, arrivalsToday, villas, villaMap] = await Promise.all([
    getKpis(),
    getRevenueSeries(),
    getArrivalsToday(),
    getVillaStatuses(),
    getVillaBySlugMap(),
  ]);
  return (
    <>
      <OpsHeader greeting="Good morning, Made" sub="Monday, July 6, 2026 · Galungan in 4 days" />

      <Surface className="space-y-6 p-6 lg:p-10">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Occupancy" value={kpis.occupancy.value} delta={kpis.occupancy.delta} />
          <KpiCard label="ADR" value={kpis.adr.value} delta={kpis.adr.delta} mono />
          <KpiCard label="Revenue MTD" value={kpis.revenueMtd.value} delta={kpis.revenueMtd.delta} mono />
          <KpiCard label="Arrivals today" value={kpis.arrivalsToday.value} delta={kpis.arrivalsToday.delta} tone="neutral" />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Revenue chart */}
          <Panel title="Revenue · last 30 days" className="xl:col-span-2">
            <AreaChart data={revenueSeries} />
          </Panel>

          {/* Today's arrivals */}
          <Panel title="Today's arrivals">
            <ul className="space-y-4">
              {arrivalsToday.map((r) => {
                const v = villaMap.get(r.villaSlug);
                return (
                  <li key={r.id} className="flex items-center gap-3">
                    <Avatar className="size-9 bg-sand-300">
                      <AvatarFallback className="font-display bg-sand-300 text-sm text-teal-700">
                        {r.guestName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{r.guestName}</p>
                      <p className="text-xs text-stone-500">
                        {v?.name ?? r.villaSlug} · ETA {r.eta}
                      </p>
                    </div>
                    {r.vip ? <VipBadge /> : <StatusBadge status={r.balance > 0 ? "pending" : "confirmed"} />}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        {/* Villa status grid — B10 (live via SSE in production) */}
        <Panel title="Villa status">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {villas.map((v) => (
              <li key={v.id} className="rounded-md border border-border p-4">
                <p className="text-sm font-medium text-ink-900">{v.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusBadge status={v.status} />
                </div>
                {v.currentGuest && <p className="mt-2 truncate text-xs text-stone-500">{v.currentGuest}</p>}
              </li>
            ))}
          </ul>
        </Panel>

        {/* Anomaly feed */}
        <Panel title="Needs a look">
          <ul className="space-y-3">
            {ANOMALIES.map((a) => (
              <li
                key={a.text}
                className="flex items-center justify-between gap-4 rounded-md border-l-4 border-ocean-500 bg-ocean-500/5 py-3 pr-3 pl-4"
              >
                <p className="text-sm text-ink-700">{a.text}</p>
                <button className="shrink-0 text-sm font-medium text-teal-700 underline-offset-4 hover:underline">
                  {a.action}
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <p className="text-xs text-stone-500">
          ADR month-to-date {idrShort(8_600_000)} · figures refresh with each Odoo sync.
        </p>
      </Surface>
    </>
  );
}
