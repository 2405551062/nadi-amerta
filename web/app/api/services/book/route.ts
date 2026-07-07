/** POST /api/services/book — add a service to the stay (B9). */
import { NextResponse } from "next/server";
import { bookService } from "@/lib/server/services";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const id = await bookService(await request.json());
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
