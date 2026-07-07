/** POST /api/ops/tasks/[id] — advance a housekeeping task (B24/B25). */
import { NextResponse } from "next/server";
import { advanceTask } from "@/lib/server/housekeeping";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await advanceTask(Number((await params).id));
    publishOps("hk-task");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
