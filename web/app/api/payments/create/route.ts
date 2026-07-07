/**
 * POST /api/payments/create — start a Midtrans Snap transaction for a booking
 * (BPMN B20). Returns the Snap token for the browser popup, or mode:"simulated"
 * when no Midtrans keys are configured. The reservation is created only after
 * payment (see POST /api/reservations), so an abandoned payment leaves no row.
 */
import { NextResponse } from "next/server";
import { createSnapTransaction } from "@/lib/server/payments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid amount" }, { status: 400 });
    }
    const orderId = `NADI-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const result = await createSnapTransaction({
      orderId,
      amount,
      customer: {
        name: body.customer?.name || "Guest",
        email: body.customer?.email || "guest@example.com",
        phone: body.customer?.phone,
      },
      itemName: body.itemName || "Villa stay",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
