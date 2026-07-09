/**
 * Invoices domain — real Odoo account.move (Note #7). Each reservation that has
 * been invoiced (by villa.reservation._ensure_invoice / the cron) carries an
 * invoice_id; we read the posted move for the number, date, total and payment
 * state. Scoped to the signed-in guest for the portal.
 */
import "server-only";
import { searchRead } from "@/lib/odoo";
import { currentPartnerId, m2oId, m2oName, fmtOdooDate } from "@/lib/server/util";
import { getVillaMap } from "@/lib/server/catalog";
import type { Invoice, InvoiceState } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

function invState(paymentState?: string): InvoiceState {
  if (paymentState === "reversed") return "refunded";
  if (paymentState === "paid" || paymentState === "in_payment") return "paid";
  return "awaiting";
}

function prettyMethod(m?: string | false): string {
  if (!m) return "Midtrans";
  const map: Record<string, string> = {
    credit_card: "Card · Midtrans",
    bank_transfer: "Bank transfer (VA)",
    qris: "QRIS",
    gopay: "GoPay",
    echannel: "Bank transfer (VA)",
  };
  return map[m] || m;
}

interface ResRow {
  id: number;
  name: string;
  product_id: [number, string] | false;
  invoice_id: [number, string] | false;
  check_out_date: string | false;
  payment_method: string | false;
  payment_ref: string | false;
  state: string;
}
interface MoveRow {
  id: number;
  name: string;
  invoice_date: string | false;
  amount_total: number;
  payment_state: string;
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!USE_ODOO) return [];
  const pid = await currentPartnerId();
  if (!pid) return [];

  const rows = await searchRead<ResRow>(
    "villa.reservation",
    [["partner_id", "=", pid], ["invoice_id", "!=", false]],
    ["name", "product_id", "invoice_id", "check_out_date", "payment_method", "payment_ref", "state"],
    { order: "check_out_date desc" }
  );
  if (!rows.length) return [];

  const moveIds = rows.map((r) => m2oId(r.invoice_id)).filter((x): x is number => !!x);
  const [moves, villaMap] = await Promise.all([
    searchRead<MoveRow>("account.move", [["id", "in", moveIds]], [
      "name", "invoice_date", "amount_total", "payment_state",
    ]),
    getVillaMap(),
  ]);
  const moveMap = new Map(moves.map((m) => [m.id, m]));

  return rows.map((r) => {
    const m = moveMap.get(m2oId(r.invoice_id)!);
    const villa = r.product_id ? villaMap.get(r.product_id[0]) : undefined;
    return {
      id: r.id,
      number: m?.name || r.name,
      reservationCode: r.name,
      stay: `${villa?.name || m2oName(r.product_id)} · ${fmtOdooDate(r.check_out_date)}`,
      date: fmtOdooDate(m?.invoice_date || r.check_out_date),
      amount: Math.round(m?.amount_total || 0),
      state: r.state === "cancelled" ? "refunded" : invState(m?.payment_state),
      method: prettyMethod(r.payment_method),
      reference: r.payment_ref || m?.name || "—",
    };
  });
}
