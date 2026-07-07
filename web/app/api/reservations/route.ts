/** POST /api/reservations — booking confirm (B4): create + confirm villa.reservation. */
import { NextResponse } from "next/server";
import { createReservation } from "@/lib/server/reservations";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createReservation(body);
    publishOps("reservation");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
