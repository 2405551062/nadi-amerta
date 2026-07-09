/** POST /api/ops/tasks/[id] — advance a task; PATCH — assign / room / photo / submit. */
import { NextResponse } from "next/server";
import { advanceTask, assignTask, setTaskRoom, uploadTaskPhoto, submitTask } from "@/lib/server/housekeeping";
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    const body = await request.json();
    if (body.action === "assign") await assignTask(id, Number(body.userId));
    else if (body.action === "room") await setTaskRoom(id, Number(body.roomId));
    else if (body.action === "photo") await uploadTaskPhoto(id, body.which === "after" ? "after" : "before", String(body.data || ""));
    // Housekeeper signs off: checklist must be complete (enforced server-side in Odoo).
    else if (body.action === "submit") await submitTask(id, String(body.conclusion || ""));
    else return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    publishOps("hk-task");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
