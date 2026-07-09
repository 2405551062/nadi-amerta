/** PATCH /api/ops/rooms/[id] {status} — villa board room status (ready/occupied/maintenance). */
import { NextResponse } from "next/server";
import { setRoomStatus } from "@/lib/server/housekeeping";
import { publishOps } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    const { status } = await request.json();
    if (!["ready", "occupied", "maintenance"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }
    await setRoomStatus(id, status);
    publishOps("hk-task");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
