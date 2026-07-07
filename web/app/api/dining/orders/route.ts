/** POST /api/dining/orders — place an in-villa dining order (B15). */
import { NextResponse } from "next/server";
import { createFnbOrder } from "@/lib/server/dining";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const id = await createFnbOrder(await request.json());
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
