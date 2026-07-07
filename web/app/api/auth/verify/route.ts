/** POST /api/auth/verify {email, code} — verify code, open a guest session. */
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/server/auth";
import { setSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    const res = await verifyOtp(email, code);
    if (!res.ok || !res.partnerId) {
      return NextResponse.json({ ok: false, error: res.error || "Invalid code" }, { status: 401 });
    }
    await setSession({ uid: res.partnerId, email, name: res.name || email, role: "guest" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
