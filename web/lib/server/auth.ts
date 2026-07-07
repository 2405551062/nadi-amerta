/**
 * Auth domain — passwordless guest OTP (villa.otp) + staff login against
 * Odoo res.users. Traceability (design/10 P6): res.users / res.partner.
 */
import "server-only";
import { execKw } from "@/lib/odoo";

const ODOO_URL = process.env.ODOO_URL ?? "http://localhost:8069";
const ODOO_DB = process.env.ODOO_DB ?? "nadi";

/** Request an email OTP. Returns dev_code so the flow is testable without SMTP. */
export async function requestOtp(email: string): Promise<{ ok: boolean; devCode?: string }> {
  const res = await execKw<{ ok: boolean; dev_code?: string }>(
    "villa.otp",
    "request_otp",
    [email]
  );
  return { ok: res.ok, devCode: res.dev_code };
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ ok: boolean; partnerId?: number; name?: string; error?: string }> {
  const res = await execKw<{ ok: boolean; partner_id?: number; name?: string; error?: string }>(
    "villa.otp",
    "verify_otp",
    [email, code]
  );
  return { ok: res.ok, partnerId: res.partner_id, name: res.name, error: res.error };
}

/**
 * Staff login: authenticate directly against Odoo (common.authenticate) with the
 * user's own credentials, then read their Nadi role groups. Returns uid + role names.
 */
export async function staffLogin(
  login: string,
  password: string
): Promise<{ ok: boolean; uid?: number; name?: string; groups?: string[]; error?: string }> {
  const authRes = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service: "common", method: "authenticate", args: [ODOO_DB, login, password, {}] },
      id: 1,
    }),
    cache: "no-store",
  });
  const uid = (await authRes.json()).result;
  if (!uid) return { ok: false, error: "Wrong username or password" };

  // Read the user's groups (as this user, so no extra privilege needed).
  const groupsRes = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [ODOO_DB, uid, password, "res.users", "read", [[uid], ["name", "groups_id"]]],
      },
      id: 2,
    }),
    cache: "no-store",
  });
  const user = (await groupsRes.json()).result?.[0];
  const groupIds: number[] = user?.groups_id ?? [];

  // Resolve which of those are Nadi role groups.
  const nadiGroups = await execKw<{ id: number; name: string; category_id: [number, string] | false }[]>(
    "res.groups",
    "read",
    [groupIds, ["name", "category_id"]]
  );
  const roles = nadiGroups
    .filter((g) => Array.isArray(g.category_id) && g.category_id[1]?.includes("Nadi"))
    .map((g) => g.name);

  return { ok: true, uid, name: user?.name ?? login, groups: roles };
}
