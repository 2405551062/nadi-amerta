/** POST /api/ops/tasks — create & assign a housekeeping task (Note 2 §2, admin). */
import { NextResponse } from "next/server";
import { createTask } from "@/lib/server/housekeeping";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.templateId) {
      return NextResponse.json({ ok: false, error: "Villa is required" }, { status: 400 });
    }
    const id = await createTask({
      templateId: Number(body.templateId),
      taskType: body.taskType,
      assigneeId: body.assigneeId ? Number(body.assigneeId) : undefined,
      roomId: body.roomId ? Number(body.roomId) : undefined,
    });
    publishOps("hk-task");
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
