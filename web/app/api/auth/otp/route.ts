/** POST /api/auth/otp {email} — send a login code. */
import { NextResponse } from "next/server";
import { requestOtp } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
    const res = await requestOtp(email);
    // In production, never return the code. Dev echo is gated on AUTH_DEV_ECHO.
    const devCode = process.env.AUTH_DEV_ECHO === "true" ? res.devCode : undefined;
    return NextResponse.json({ ok: res.ok, devCode });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
