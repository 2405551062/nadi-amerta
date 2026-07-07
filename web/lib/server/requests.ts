/**
 * Guest requests domain — villa.guest.request. Traceability: UC-FO5, BPMN B11.
 */
import "server-only";
import { searchRead, create, callButton } from "@/lib/odoo";
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
}

const FIELDS = ["name", "request_type", "partner_id", "product_id", "detail", "priority", "state", "create_date"];

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

export async function advanceRequest(id: number, to: "take" | "resolve") {
  return callButton("villa.guest.request", to === "take" ? "action_take" : "action_resolve", [id]);
}
