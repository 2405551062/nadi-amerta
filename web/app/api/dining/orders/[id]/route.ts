/** POST /api/dining/orders/[id] {action:'advance'} — kitchen advances the order (B16). */
import { NextResponse } from "next/server";
import { advanceFnbOrder } from "@/lib/server/dining";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await advanceFnbOrder(Number((await params).id));
    publishOps("fnb");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
