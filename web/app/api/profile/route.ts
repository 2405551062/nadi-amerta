/** PATCH /api/profile — update the current guest's res.partner record. */
import { NextResponse } from "next/server";
import { updateProfile } from "@/lib/server/profile";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    await updateProfile(await request.json());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
