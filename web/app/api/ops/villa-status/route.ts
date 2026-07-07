/** POST /api/ops/villa-status {templateId, status} — housekeeping sets villa status (B25). */
import { NextResponse } from "next/server";
import { setVillaStatus } from "@/lib/server/housekeeping";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { templateId, status } = await request.json();
    await setVillaStatus(Number(templateId), String(status));
    publishOps("villa-status");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
