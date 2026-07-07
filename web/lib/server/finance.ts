/**
 * Finance / dashboard aggregates. KPIs and ledger are computed from live
 * reservations + villa statuses where possible; the 30-day revenue trend and
 * settlement reconciliation remain illustrative (full accounting deferred).
 */
import "server-only";
import { getVillaStatuses } from "@/lib/server/housekeeping";
import { getArrivalsToday } from "@/lib/server/reservations";
import { getFnbOrders } from "@/lib/server/dining";
import { searchRead } from "@/lib/odoo";
import { getVillaMap } from "@/lib/server/catalog";
import { m2oName, fmtOdooDate } from "@/lib/server/util";
import { quote } from "@/lib/format";
import { idrShort } from "@/lib/format";
import { revenueSeries as mockSeries, reconciliation as mockRecon } from "@/lib/data";
import type { LedgerEntry } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

export async function getKpis() {
  if (!USE_ODOO) {
    const { kpis } = await import("@/lib/data");
    return kpis;
  }
  const [villas, arrivals] = await Promise.all([getVillaStatuses(), getArrivalsToday()]);
  const total = villas.length || 1;
  const occupied = villas.filter((v) => v.status === "occupied").length;
  const occ = Math.round((occupied / total) * 100);

  // revenue MTD from confirmed/checked-in/out reservations starting this month
  const monthStart = new Date();
  monthStart.setDate(1);
  const rows = await searchRead<{ product_id: [number, string] | false; nights: number }>(
    "villa.reservation",
    [["state", "in", ["confirmed", "checked_in", "checked_out"]], ["check_in_date", ">=", monthStart.toISOString().slice(0, 10)]],
    ["product_id", "nights"]
  );
  const villaMap = await getVillaMap();
  const revenue = rows.reduce((sum, r) => {
    const v = r.product_id ? villaMap.get(r.product_id[0]) : undefined;
    return sum + (v ? quote(v.priceNight, r.nights).subtotal : 0);
  }, 0);
  const adr = rows.length
    ? Math.round(rows.reduce((s, r) => {
        const v = r.product_id ? villaMap.get(r.product_id[0]) : undefined;
        return s + (v?.priceNight ?? 0);
      }, 0) / rows.length)
    : 0;

  return {
    occupancy: { value: `${occ}%`, delta: `${occupied}/${total} villas`, positive: true },
    adr: { value: idrShort(adr), delta: "live", positive: true },
    revenueMtd: { value: idrShort(revenue), delta: "month to date", positive: true },
    arrivalsToday: { value: String(arrivals.length), delta: arrivals[0]?.eta ? `earliest ${arrivals[0].eta}` : "—", positive: true },
    phrLiability: { value: idrShort(Math.round(revenue * 0.1)), delta: "PHR 10% collected", positive: false },
    outstanding: { value: idrShort(0), delta: "folios", positive: false },
  };
}

export async function getLedger(): Promise<LedgerEntry[]> {
  if (!USE_ODOO) {
    const { ledger } = await import("@/lib/data");
    return ledger;
  }
  const villaMap = await getVillaMap();
  const [reservations, fnb] = await Promise.all([
    searchRead<{ id: number; name: string; product_id: [number, string] | false; nights: number; check_in_date: string | false }>(
      "villa.reservation",
      [["state", "in", ["confirmed", "checked_in", "checked_out"]]],
      ["name", "product_id", "nights", "check_in_date"],
      { order: "check_in_date desc", limit: 8 }
    ),
    getFnbOrders(),
  ]);

  const roomLines: LedgerEntry[] = reservations.map((r, i) => {
    const v = r.product_id ? villaMap.get(r.product_id[0]) : undefined;
    return {
      id: i + 1,
      date: fmtOdooDate(r.check_in_date).split(",")[0],
      description: `${m2oName(r.product_id)} · ${r.nights} nights`,
      reference: r.name,
      stream: "Rooms",
      debit: 0,
      credit: v ? quote(v.priceNight, r.nights).subtotal : 0,
    };
  });
  const fnbLines: LedgerEntry[] = fnb.slice(0, 3).map((o, i) => ({
    id: 100 + i,
    date: "Today",
    description: `F&B · in-villa dining`,
    reference: o.villaSlug,
    stream: "F&B",
    debit: 0,
    credit: o.items.reduce((s, it) => s + it.price * it.qty, 0),
  }));
  return [...roomLines, ...fnbLines];
}

export async function getReconciliation() {
  return mockRecon;
}

export async function getRevenueSeries() {
  return mockSeries;
}
