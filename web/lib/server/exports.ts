/**
 * Back-office exports (BPMN B12/B13/B14) — real CSV/PDF files from live data.
 */
import "server-only";
import { searchRead } from "@/lib/odoo";
import { getVillaMap } from "@/lib/server/catalog";
import { partnerMap, m2oId, m2oName } from "@/lib/server/util";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function csv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

interface Res {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  product_id: [number, string] | false;
  check_in_date: string | false;
  check_out_date: string | false;
  nights: number;
  guests: number;
  state: string;
  source: string;
}

async function loadReservations(): Promise<Res[]> {
  return searchRead<Res>(
    "villa.reservation",
    [],
    ["name", "partner_id", "product_id", "check_in_date", "check_out_date", "nights", "guests", "state", "source"],
    { order: "check_in_date desc" }
  );
}

/** B12 — booking documentation dossier (one row per reservation). */
export async function bookingDocsCsv(): Promise<string> {
  const [rows, villaMap] = await Promise.all([loadReservations(), getVillaMap()]);
  const header = ["Code", "Guest", "Villa", "Check-in", "Check-out", "Nights", "Guests", "Source", "Status"];
  const body = rows.map((r) => [
    r.name,
    m2oName(r.partner_id),
    (r.product_id && villaMap.get(r.product_id[0])?.name) || m2oName(r.product_id),
    r.check_in_date || "",
    r.check_out_date || "",
    r.nights,
    r.guests,
    r.source,
    r.state,
  ]);
  return csv([header, ...body]);
}

/** B13 — marketing export (consented guest list with stay counts). */
export async function marketingCsv(): Promise<string> {
  const rows = await loadReservations();
  const partners = await partnerMap(rows.map((r) => m2oId(r.partner_id)).filter((x): x is number => !!x));
  const counts = new Map<number, number>();
  for (const r of rows) {
    const pid = m2oId(r.partner_id);
    if (pid) counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }
  const detail = await searchRead<{ id: number; name: string; email: string | false; x_loyalty_tier: string | false }>(
    "res.partner",
    [["id", "in", [...counts.keys()]]],
    ["name", "email", "x_loyalty_tier"]
  );
  const header = ["Name", "Email", "Loyalty tier", "Country", "Stays"];
  const body = detail.map((p) => [
    p.name,
    p.email || "",
    p.x_loyalty_tier || "standard",
    partners.get(p.id)?.country || "",
    counts.get(p.id) ?? 0,
  ]);
  return csv([header, ...body]);
}

/** B13 — legal / immigration registration export. */
export async function legalCsv(): Promise<string> {
  const rows = await loadReservations();
  const ids = rows.map((r) => m2oId(r.partner_id)).filter((x): x is number => !!x);
  const detail = await searchRead<{ id: number; name: string; x_nationality: string | false; x_nik_paspor: string | false }>(
    "res.partner",
    [["id", "in", [...new Set(ids)]]],
    ["name", "x_nationality", "x_nik_paspor"]
  );
  const byId = new Map(detail.map((p) => [p.id, p]));
  const header = ["Reservation", "Guest", "Nationality", "NIK/Passport", "Arrival", "Departure"];
  const body = rows
    .filter((r) => ["confirmed", "checked_in", "checked_out"].includes(r.state))
    .map((r) => {
      const p = m2oId(r.partner_id) ? byId.get(m2oId(r.partner_id)!) : undefined;
      return [r.name, p?.name || m2oName(r.partner_id), p?.x_nationality || "", p?.x_nik_paspor || "", r.check_in_date || "", r.check_out_date || ""];
    });
  return csv([header, ...body]);
}

/** Finance — PHR (10%) + service (8%) collected per reservation. */
export async function phrCsv(): Promise<string> {
  const { quote } = await import("@/lib/format");
  const [rows, villaMap] = await Promise.all([loadReservations(), getVillaMap()]);
  const header = ["Reservation", "Villa", "Check-in", "Nights", "Room subtotal", "PHR 10%", "Service 8%", "Total"];
  const body = rows
    .filter((r) => ["confirmed", "checked_in", "checked_out"].includes(r.state))
    .map((r) => {
      const v = r.product_id ? villaMap.get(r.product_id[0]) : undefined;
      const q = v ? quote(v.priceNight, r.nights) : { subtotal: 0, phr: 0, service: 0, total: 0 };
      return [r.name, v?.name || "", r.check_in_date || "", r.nights, q.subtotal, q.phr, q.service, q.total];
    });
  return csv([header, ...body]);
}

/** B14 — monthly analytics pack as a simple PDF. */
export async function analyticsPdf(): Promise<Uint8Array> {
  const [rows, villaMap] = await Promise.all([loadReservations(), getVillaMap()]);
  const active = rows.filter((r) => r.state !== "cancelled");
  const totalNights = active.reduce((s, r) => s + r.nights, 0);
  const bySource: Record<string, number> = {};
  for (const r of active) bySource[r.source] = (bySource[r.source] ?? 0) + 1;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const teal = rgb(0.17, 0.29, 0.32);
  const ink = rgb(0.16, 0.15, 0.13);
  let y = 780;
  const t = (s: string, x: number, size = 11, font = sans, color = ink) =>
    page.drawText(s, { x, y, font, size, color });

  t("NADI AMERTA — Analytics Pack", 56, 22, serifBold, teal);
  y -= 20;
  t(`Generated ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, 56, 10, sans, rgb(0.55, 0.51, 0.46));
  y -= 36;
  t(`Reservations (non-cancelled): ${active.length}`, 56); y -= 20;
  t(`Villas: ${villaMap.size}`, 56); y -= 20;
  t(`Total booked nights: ${totalNights}`, 56); y -= 20;
  t(`Average length of stay: ${active.length ? (totalNights / active.length).toFixed(1) : 0} nights`, 56); y -= 30;
  t("Booking sources", 56, 13, serifBold, teal); y -= 22;
  for (const [src, n] of Object.entries(bySource)) {
    t(`${src}`, 70); t(`${n}`, 300); y -= 18;
  }
  return doc.save();
}
