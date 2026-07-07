/** POST /api/requests/[id] {action:'take'|'resolve'} — reception handles a request. */
import { NextResponse } from "next/server";
import { advanceRequest } from "@/lib/server/requests";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    await advanceRequest(Number((await params).id), body.action === "take" ? "take" : "resolve");
    publishOps("request");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
