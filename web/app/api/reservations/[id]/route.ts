/** GET (cancellation quote) + POST {action} — checkin/checkout/cancel/modify (B7/B18). */
import { NextResponse } from "next/server";
import {
  checkInReservation, checkOutReservation, cancelReservation, modifyReservationDates,
  getCancellationQuote,
} from "@/lib/server/reservations";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const quote = await getCancellationQuote(id);
  return NextResponse.json(quote);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  try {
    switch (body.action) {
      case "checkin": await checkInReservation(id); break;
      case "checkout": await checkOutReservation(id); break;
      case "cancel": await cancelReservation(id); break;
      case "modify": await modifyReservationDates(id, body.checkin, body.checkout); break;
      default: return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
    }
    publishOps("reservation");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
