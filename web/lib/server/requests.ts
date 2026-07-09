/**
 * Guest requests domain — villa.guest.request. Traceability: UC-FO5, BPMN B11.
 */
import "server-only";
import { searchRead, create, callButton, write } from "@/lib/odoo";
import { currentPartnerId, m2oName } from "@/lib/server/util";
import type { GuestRequest, RequestState } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

interface OdooRequest {
  id: number;
  name: string;
  request_type: "request" | "complaint";
  partner_id: [number, string] | false;
  product_id: [number, string] | false;
  detail: string | false;
  priority: "low" | "medium" | "high";
  state: RequestState;
  create_date: string;
  resolution_route: "inventory" | "maintenance" | "none" | false;
  maintenance_flagged: boolean;
}

const FIELDS = [
  "name", "request_type", "partner_id", "product_id", "detail", "priority", "state",
  "create_date", "resolution_route", "maintenance_flagged",
];

function fmtCreated(dt: string): string {
  const d = new Date(dt.replace(" ", "T") + "Z");
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function map(o: OdooRequest): GuestRequest {
  return {
    id: o.id,
    type: o.request_type,
    subject: o.name,
    detail: o.detail || "",
    state: o.state,
    created: fmtCreated(o.create_date),
    villa: m2oName(o.product_id),
    guestName: m2oName(o.partner_id),
    priority: o.priority,
    route: o.resolution_route || "none",
    maintenanceFlagged: o.maintenance_flagged || false,
  };
}

/** scope "mine" = current guest's; "all" = reception queue. */
export async function getRequests(scope: "mine" | "all" = "all"): Promise<GuestRequest[]> {
  if (!USE_ODOO) return [];
  const domain: unknown[] = [];
  if (scope === "mine") {
    const pid = await currentPartnerId();
    if (!pid) return [];
    domain.push(["partner_id", "=", pid]);
  }
  const rows = await searchRead<OdooRequest>("villa.guest.request", domain, FIELDS, { order: "create_date desc" });
  return rows.map(map);
}

export interface CreateRequestInput {
  type: "request" | "complaint";
  subject: string;
  detail?: string;
}

export async function createRequest(input: CreateRequestInput): Promise<number> {
  const pid = await currentPartnerId();
  // attach to the guest's active stay if any
  const stays = pid
    ? await searchRead<{ id: number }>(
        "villa.reservation",
        [["partner_id", "=", pid], ["state", "in", ["confirmed", "checked_in"]]],
        ["id"],
        { limit: 1, order: "check_in_date desc" }
      )
    : [];
  return create("villa.guest.request", {
    partner_id: pid,
    reservation_id: stays[0]?.id || false,
    request_type: input.type,
    name: input.subject,
    detail: input.detail || false,
    priority: input.type === "complaint" ? "high" : "medium",
  });
}

export interface SupplyOption {
  id: number;
  name: string;
}

/** Housekeeping supplies a request can draw down (Note #4). */
export async function getSupplyOptions(): Promise<SupplyOption[]> {
  if (!USE_ODOO) return [];
  const rows = await searchRead<{ id: number; name: string }>(
    "product.template",
    [["x_kind", "=", "supply"]],
    ["name"],
    { order: "name" }
  );
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function advanceRequest(
  id: number,
  to: "take" | "resolve",
  supply?: { productId: number; qty: number }
) {
  // Note #4 — attach a supply before resolving so the model draws it down from
  // inventory (villa.guest.request.action_resolve consumes it via a stock move).
  // The model itself only consumes stock for request-type tickets, never complaints.
  if (to === "resolve" && supply?.productId) {
    await write("villa.guest.request", [id], {
      supply_product_id: supply.productId,
      supply_qty: supply.qty || 1,
    });
  }
  return callButton("villa.guest.request", to === "take" ? "action_take" : "action_resolve", [id]);
}

/** Note 2 §3 — route a complaint to engineering (flags villa maintenance, no inventory). */
export async function flagMaintenance(id: number) {
  return callButton("villa.guest.request", "action_flag_maintenance", [id]);
}
