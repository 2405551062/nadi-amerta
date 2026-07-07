/** POST /api/auth/staff {login, password} — staff sign-in against Odoo res.users. */
import { NextResponse } from "next/server";
import { staffLogin } from "@/lib/server/auth";
import { setSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();
    const res = await staffLogin(login, password);
    if (!res.ok || !res.uid) {
      return NextResponse.json({ ok: false, error: res.error || "Login failed" }, { status: 401 });
    }
    await setSession({
      uid: res.uid,
      email: login,
      name: res.name || login,
      role: "staff",
      groups: res.groups || [],
    });
    return NextResponse.json({ ok: true, groups: res.groups });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
