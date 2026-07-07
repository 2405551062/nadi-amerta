/** POST /api/requests — guest submits a request/complaint (B11). */
import { NextResponse } from "next/server";
import { createRequest } from "@/lib/server/requests";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const id = await createRequest(await request.json());
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
