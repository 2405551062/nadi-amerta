/**
 * GET /api/villas — BFF endpoint (design/09 §2, design/10 P1/P2).
 * Reads product.template (x_kind=villa) from Odoo via JSON-RPC, with mock
 * fallback. Query: ?view&br&guests.
 */
import { NextResponse } from "next/server";
import { getVillas } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const villas = await getVillas({
    view: searchParams.get("view") ?? undefined,
    bedrooms: searchParams.get("br") ?? undefined,
    guests: searchParams.get("guests") ? Number(searchParams.get("guests")) : undefined,
  });
  return NextResponse.json({ count: villas.length, villas });
}
