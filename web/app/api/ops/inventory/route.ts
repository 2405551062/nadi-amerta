/** POST /api/ops/inventory {templateId, toQty} — restock a supply (UC-HK2). */
import { NextResponse } from "next/server";
import { restock } from "@/lib/server/housekeeping";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { templateId, toQty } = await request.json();
    await restock(Number(templateId), Number(toQty));
    publishOps("inventory");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
