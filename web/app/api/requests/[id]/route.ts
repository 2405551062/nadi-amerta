/** POST /api/requests/[id] {action:'take'|'resolve'|'maintenance'} — reception handles a request. */
import { NextResponse } from "next/server";
import { advanceRequest, flagMaintenance } from "@/lib/server/requests";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    const id = Number((await params).id);
    if (body.action === "maintenance") {
      // Note 2 §3 — complaint routed to engineering, never inventory.
      await flagMaintenance(id);
    } else {
      const supply =
        body.supplyProductId
          ? { productId: Number(body.supplyProductId), qty: Number(body.supplyQty) || 1 }
          : undefined;
      await advanceRequest(id, body.action === "take" ? "take" : "resolve", supply);
    }
    publishOps("request");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
