/** POST /api/ops/tasks/[id]/checklist {index} — persist a checklist item toggle. */
import { NextResponse } from "next/server";
import { toggleTaskItem } from "@/lib/server/housekeeping";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { index } = await request.json();
    await toggleTaskItem(Number((await params).id), Number(index));
    publishOps("hk-task");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
