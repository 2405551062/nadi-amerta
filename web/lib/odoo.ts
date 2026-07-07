/**
 * Odoo JSON-RPC client for the Next.js BFF (design/09-odoo-integration.md).
 *
 * The browser never talks to Odoo directly — only server-side route handlers
 * (app/api/*) import this. Auth uses a service account (login + API key or
 * password) held in env, NOT the guest's own credentials.
 *
 * Odoo external API:
 *   1. common.authenticate(db, login, key, {})  → uid  (cached)
 *   2. object.execute_kw(db, uid, key, model, method, args, kwargs)
 */

import "server-only";

const ODOO_URL = process.env.ODOO_URL ?? "http://localhost:8069";
const ODOO_DB = process.env.ODOO_DB ?? "nadi";
const ODOO_USER = process.env.ODOO_USER ?? "admin";
const ODOO_KEY = process.env.ODOO_API_KEY ?? "admin"; // API key or password

interface JsonRpcError {
  code: number;
  message: string;
  data?: { name?: string; debug?: string; message?: string };
}

async function jsonRpc<T>(
  service: "common" | "object",
  method: string,
  args: unknown[]
): Promise<T> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Math.floor(Math.random() * 1e9),
    }),
    // Odoo data is request-scoped; never cache at the fetch layer.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new OdooError(`Odoo HTTP ${res.status}`, res.status);
  }

  const body = (await res.json()) as { result?: T; error?: JsonRpcError };
  if (body.error) {
    const d = body.error.data;
    throw new OdooError(d?.message || body.error.message, 502, d?.name);
  }
  return body.result as T;
}

export class OdooError extends Error {
  constructor(
    message: string,
    public status = 502,
    public odooName?: string
  ) {
    super(message);
    this.name = "OdooError";
  }
}

// -- auth (uid cached for the lifetime of the server process) -----------
let uidPromise: Promise<number> | null = null;

function authenticate(): Promise<number> {
  if (!uidPromise) {
    uidPromise = jsonRpc<number | false>("common", "authenticate", [
      ODOO_DB,
      ODOO_USER,
      ODOO_KEY,
      {},
    ]).then((uid) => {
      if (!uid) {
        uidPromise = null;
        throw new OdooError("Odoo authentication failed — check ODOO_USER / ODOO_API_KEY", 401);
      }
      return uid;
    });
  }
  return uidPromise;
}

// -- generic model call --------------------------------------------------
export async function execKw<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const uid = await authenticate();
  return jsonRpc<T>("object", "execute_kw", [
    ODOO_DB,
    uid,
    ODOO_KEY,
    model,
    method,
    args,
    kwargs,
  ]);
}

// -- ergonomic helpers ---------------------------------------------------
type Domain = unknown[];

export function searchRead<T>(
  model: string,
  domain: Domain = [],
  fields: string[] = [],
  opts: { limit?: number; offset?: number; order?: string } = {}
): Promise<T[]> {
  return execKw<T[]>(model, "search_read", [domain], { fields, ...opts });
}

export function searchCount(model: string, domain: Domain = []): Promise<number> {
  return execKw<number>(model, "search_count", [domain]);
}

export function read<T>(model: string, ids: number[], fields: string[] = []): Promise<T[]> {
  return execKw<T[]>(model, "read", [ids], { fields });
}

export function create(model: string, values: Record<string, unknown>): Promise<number> {
  return execKw<number>(model, "create", [values]);
}

export function write(
  model: string,
  ids: number[],
  values: Record<string, unknown>
): Promise<boolean> {
  return execKw<boolean>(model, "write", [ids, values]);
}

export function callButton<T = unknown>(
  model: string,
  method: string,
  ids: number[],
  extra: unknown[] = []
): Promise<T> {
  return execKw<T>(model, method, [ids, ...extra]);
}

/** Cheap liveness probe used by API routes to decide mock vs live. */
export async function odooHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${ODOO_URL}/nadi/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
