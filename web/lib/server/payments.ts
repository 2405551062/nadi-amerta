/**
 * Payments — Midtrans Snap (design/05 §4, BPMN B20). Server-only.
 *
 * Two modes, chosen by whether MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY are set:
 *  - "midtrans": real Snap transaction (sandbox by default). The browser opens
 *    the Snap popup; on success we verify the transaction status server-side
 *    (never trusting the client) before confirming the reservation.
 *  - "simulated": no keys configured → a labelled sandbox modal stands in so the
 *    demo still works out of the box. verifyPayment() trusts the client here.
 *
 * We deliberately do NOT rely on Midtrans's async notification webhook (it can't
 * reach localhost); instead the client reports success and the server confirms
 * it via the status API. Good enough for a demo; add the webhook for production.
 */
import "server-only";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
const IS_PROD = process.env.MIDTRANS_IS_PRODUCTION === "true";

const SNAP_BASE = IS_PROD ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
const API_BASE = IS_PROD ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";

export function midtransConfigured(): boolean {
  return Boolean(SERVER_KEY && CLIENT_KEY);
}

function basicAuth(): string {
  // Midtrans uses HTTP Basic with the server key as username and empty password.
  return "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64");
}

export interface SnapResult {
  mode: "midtrans" | "simulated";
  orderId: string;
  token?: string;
  clientKey?: string;
  snapUrl?: string;
}

export interface CreateSnapInput {
  orderId: string;
  amount: number; // IDR, whole rupiah
  customer: { name: string; email: string; phone?: string };
  itemName: string;
}

/** Create a Snap transaction and return the token the browser needs (or simulate). */
export async function createSnapTransaction(input: CreateSnapInput): Promise<SnapResult> {
  const gross = Math.max(1, Math.round(input.amount));
  if (!midtransConfigured()) {
    return { mode: "simulated", orderId: input.orderId };
  }
  const [first, ...rest] = input.customer.name.trim().split(/\s+/);
  const res = await fetch(`${SNAP_BASE}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: basicAuth(),
    },
    cache: "no-store",
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: gross },
      credit_card: { secure: true },
      customer_details: {
        first_name: first || "Guest",
        last_name: rest.join(" ") || undefined,
        email: input.customer.email,
        phone: input.customer.phone || undefined,
      },
      item_details: [
        { id: "stay", price: gross, quantity: 1, name: input.itemName.slice(0, 50) },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    const msg = Array.isArray(data.error_messages)
      ? data.error_messages.join("; ")
      : data.status_message || `Snap error (${res.status})`;
    throw new Error(msg);
  }
  return {
    mode: "midtrans",
    orderId: input.orderId,
    token: data.token as string,
    clientKey: CLIENT_KEY,
    snapUrl: `${SNAP_BASE}/snap/snap.js`,
  };
}

export interface PaymentStatus {
  ok: boolean; // safe to create/hold the reservation
  paid: boolean; // fully settled
  status: string; // raw transaction_status (or "simulated")
  method?: string;
  gross?: number;
}

/**
 * Verify a transaction with Midtrans before confirming the booking. In simulated
 * mode (no keys) we trust the client. Accepts pending (VA/QRIS awaiting transfer)
 * as a valid hold; only outright failure/denial is rejected.
 */
export async function verifyPayment(orderId: string): Promise<PaymentStatus> {
  if (!midtransConfigured()) {
    return { ok: true, paid: true, status: "simulated" };
  }
  const res = await fetch(`${API_BASE}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: basicAuth() },
    cache: "no-store",
  });
  const d = await res.json().catch(() => ({}));
  const status: string = d.transaction_status || "unknown";
  const paid = status === "settlement" || status === "capture";
  const ok = paid || status === "pending" || status === "authorize";
  return {
    ok,
    paid,
    status,
    method: d.payment_type || undefined,
    gross: d.gross_amount ? Number(d.gross_amount) : undefined,
  };
}
