/** POST /api/reservations — booking confirm (B4): create + confirm villa.reservation. */
import { NextResponse } from "next/server";
import { createReservation } from "@/lib/server/reservations";
import { publishOps } from "@/lib/server/bus";
import { getSession, setSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createReservation(body);

    // Note #9 — completing a booking must not leave the guest "logged out".
    // If they weren't already signed in, establish a guest session bound to the
    // partner this reservation was created for, so the portal is reachable.
    const existing = await getSession();
    if (existing?.role !== "guest" && result.partnerId) {
      await setSession({
        uid: result.partnerId,
        email: body.email,
        name: result.guestName || body.email,
        role: "guest",
      });
    }

    publishOps("reservation");
    return NextResponse.json({ ok: true, code: result.code, id: result.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
