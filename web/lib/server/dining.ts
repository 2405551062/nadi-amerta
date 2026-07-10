/**
 * Dining domain — product.template (x_kind=fnb) + villa.fnb.order(.line).
 * Traceability: UC-C5/UC-FB1, BPMN B9/B15/B16.
 */
import "server-only";
import { searchRead, create, callButton } from "@/lib/odoo";
import { currentPartnerId, m2oName } from "@/lib/server/util";
import { getVillaMap } from "@/lib/server/catalog";
import { menu as mockMenu } from "@/lib/data";
import type { MenuItem, FnbOrder, FnbOrderState } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

interface OdooMenu {
  id: number;
  name: string;
  x_category: string | false;
  x_dietary: string | false;
  x_featured: boolean;
  x_excerpt: string | false;
  list_price: number;
}

export async function getMenu(): Promise<MenuItem[]> {
  if (!USE_ODOO) return mockMenu;
  try {
    const rows = await searchRead<OdooMenu>(
      "product.template",
      [["x_kind", "=", "fnb"]],
      ["name", "x_category", "x_dietary", "x_featured", "x_excerpt", "list_price"],
      { order: "list_price desc" }
    );
    return rows.map((o) => ({
      id: o.id,
      category: o.x_category || "",
      name: o.name,
      description: o.x_excerpt || "",
      price: Math.round(o.list_price),
      dietary: (o.x_dietary ? o.x_dietary.split(",") : []).map((s) => s.trim()) as ("vegan" | "gf")[],
      featured: o.x_featured || undefined,
    }));
  } catch (err) {
    console.error("[dining] Odoo unreachable, using mock:", (err as Error).message);
    return mockMenu;
  }
}

interface OdooFnbOrder {
  id: number;
  partner_id: [number, string] | false;
  product_villa_id: [number, string] | false;
  room_id: [number, string] | false;
  placed: string | false;
  scheduled_time: string | false;
  note: string | false;
  state: FnbOrderState;
  line_ids: number[];
}
interface OdooFnbLine {
  id: number;
  order_id: [number, string];
  product_id: [number, string] | false;
  qty: number;
  price: number;
}

export async function getFnbOrders(): Promise<FnbOrder[]> {
  if (!USE_ODOO) return [];
  const orders = await searchRead<OdooFnbOrder>(
    "villa.fnb.order",
    [],
    ["partner_id", "product_villa_id", "room_id", "placed", "scheduled_time", "note", "state", "line_ids"],
    { order: "create_date desc" }
  );
  const lineIds = orders.flatMap((o) => o.line_ids);
  const [lines, villaMap] = await Promise.all([
    lineIds.length
      ? searchRead<OdooFnbLine>("villa.fnb.order.line", [["id", "in", lineIds]], ["order_id", "product_id", "qty", "price"])
      : Promise.resolve([]),
    getVillaMap(),
  ]);
  const linesByOrder = new Map<number, OdooFnbLine[]>();
  for (const l of lines) {
    const oid = l.order_id[0];
    (linesByOrder.get(oid) ?? linesByOrder.set(oid, []).get(oid)!).push(l);
  }
  return orders.map((o) => ({
    id: o.id,
    villaSlug: o.product_villa_id ? villaMap.get(o.product_villa_id[0])?.slug ?? "" : "",
    // room_id display name is "Villa · CODE"; the code is what the kitchen needs.
    roomLabel: o.room_id ? o.room_id[1].split("·").pop()!.trim() : "",
    guestName: m2oName(o.partner_id),
    items: (linesByOrder.get(o.id) ?? []).map((l) => ({
      name: m2oName(l.product_id),
      qty: l.qty,
      price: Math.round(l.price),
    })),
    state: o.state,
    placed: o.placed || "",
    scheduledTime: o.scheduled_time || undefined,
    note: o.note || undefined,
  }));
}

export interface CreateOrderInput {
  villaId?: number;
  roomId?: number;
  items: { productId: number; qty: number }[];
  note?: string;
  // Note 2 §4 — guest-chosen delivery timing.
  timing?: "asap" | "scheduled";
  scheduledTime?: string;
}

export async function createFnbOrder(input: CreateOrderInput): Promise<number> {
  const pid = await currentPartnerId();
  const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return create("villa.fnb.order", {
    partner_id: pid,
    product_villa_id: input.villaId || false,
    room_id: input.roomId || false,
    placed: now,
    timing: input.timing === "scheduled" ? "scheduled" : "asap",
    scheduled_time: input.timing === "scheduled" ? input.scheduledTime || false : false,
    note: input.note || false,
    line_ids: input.items.map((i) => [0, 0, { product_id: i.productId, qty: i.qty }]),
  });
}

export interface DiningRoom {
  id: number;
  code: string;
}

/** Rooms of a villa, for the guest's "deliver to room" picker. */
export async function getVillaRooms(villaId: number): Promise<DiningRoom[]> {
  if (!USE_ODOO || !villaId) return [];
  const rows = await searchRead<{ id: number; code: string }>(
    "villa.room",
    [["product_id", "=", villaId], ["active", "=", true]],
    ["code"],
    { order: "code" }
  );
  return rows.map((r) => ({ id: r.id, code: r.code }));
}

export async function advanceFnbOrder(id: number) {
  return callButton("villa.fnb.order", "action_advance", [id]);
}
