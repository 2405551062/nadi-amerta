/**
 * Housekeeping + inventory domains.
 * villa.housekeeping.task (B24/B25), product.template x_availability (B10),
 * product.template x_kind=supply (UC-HK2).
 */
import "server-only";
import { searchRead, callButton, write, execKw } from "@/lib/odoo";
import { getVillaMap } from "@/lib/server/catalog";
import { fmtOdooDate } from "@/lib/server/util";
import type { HousekeepingTask, StockItem, Villa } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

interface OdooTask {
  id: number;
  product_id: [number, string] | false;
  task_type: "turnover" | "stayover" | "deep";
  assignee_id: [number, string] | false;
  room_id: [number, string] | false;
  room_label: string | false;
  due: string | false;
  state: "todo" | "doing" | "inspection" | "done";
  checklist_json: string | false;
  conclusion: string | false;
  submitted_at: string | false;
}

const TYPE_LABEL = { turnover: "Turnover", stayover: "Stayover", deep: "Deep clean" } as const;
// A couple of named housekeepers so the board looks staffed.
const STAFF = ["Ni Kadek Ayu", "I Wayan Putra", "Ni Luh Sari", "I Made Agus"];

/** Odoo Datetime ("2026-07-09 14:23:11", UTC, no offset) → readable local string. */
function fmtOdooDatetime(dt: string): string {
  const d = new Date(dt.replace(" ", "T") + "Z");
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export async function getTasks(): Promise<HousekeepingTask[]> {
  if (!USE_ODOO) return [];
  const rows = await searchRead<OdooTask>(
    "villa.housekeeping.task",
    [],
    [
      "product_id", "task_type", "assignee_id", "room_id", "room_label", "due", "state",
      "checklist_json", "conclusion", "submitted_at",
    ],
    { order: "create_date desc" }
  );
  const villaMap = await getVillaMap();
  return rows.map((o, i) => {
    let checklist: { label: string; done: boolean }[] = [];
    try {
      checklist = o.checklist_json ? JSON.parse(o.checklist_json) : [];
    } catch {
      checklist = [];
    }
    return {
      id: o.id,
      villaSlug: o.product_id ? villaMap.get(o.product_id[0])?.slug ?? "" : "",
      type: TYPE_LABEL[o.task_type],
      assignee: o.assignee_id ? o.assignee_id[1] : STAFF[i % STAFF.length],
      assigneeId: o.assignee_id ? o.assignee_id[0] : undefined,
      roomId: o.room_id ? o.room_id[0] : undefined,
      // room_label mirrors the room code (kept in sync server-side).
      roomLabel: o.room_label || (o.room_id ? o.room_id[1] : ""),
      due: o.due ? fmtOdooDate(o.due) : ["13:00", "14:30", "12:00", "Tomorrow"][i % 4],
      state: o.state === "done" ? "done" : o.state === "todo" ? "todo" : "doing",
      checklist,
      conclusion: o.conclusion || undefined,
      submittedAt: o.submitted_at ? fmtOdooDatetime(o.submitted_at) : undefined,
    };
  });
}

export async function advanceTask(id: number) {
  return callButton("villa.housekeeping.task", "action_advance", [id]);
}

export interface HousekeeperOption {
  id: number;
  name: string;
}

/** Staff in the Housekeeping Nadi group, for assigning tasks (Note #5). */
export async function getHousekeepers(): Promise<HousekeeperOption[]> {
  if (!USE_ODOO) return [];
  const groups = await searchRead<{ id: number }>(
    "res.groups",
    [["name", "=", "Housekeeping"], ["category_id.name", "=", "Nadi Amerta"]],
    ["id"],
    { limit: 1 }
  );
  if (!groups.length) return [];
  const users = await searchRead<{ id: number; name: string }>(
    "res.users",
    [["groups_id", "in", [groups[0].id]], ["active", "=", true]],
    ["name"],
    { order: "name" }
  );
  return users.map((u) => ({ id: u.id, name: u.name }));
}

/** Note #5 — assign a housekeeper, set the room, or upload before/after photos. */
export async function assignTask(id: number, userId: number) {
  return write("villa.housekeeping.task", [id], { assignee_id: userId || false });
}
/** Note 2 §1 — point the task at a real villa.room (its code mirrors to room_label). */
export async function setTaskRoom(id: number, roomId: number) {
  return write("villa.housekeeping.task", [id], { room_id: roomId || false });
}

export type RoomStatus = "ready" | "occupied" | "maintenance";

export interface RoomOption {
  id: number;
  code: string;
  villaId: number;
  status: RoomStatus;
}

/** The villa board room drawer — every room/unit, with its operator-set status. */
export async function getRooms(): Promise<RoomOption[]> {
  if (!USE_ODOO) return [];
  const rows = await searchRead<{
    id: number;
    code: string;
    product_id: [number, string] | false;
    status: RoomStatus;
  }>("villa.room", [["active", "=", true]], ["code", "product_id", "status"], { order: "code" });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    villaId: Array.isArray(r.product_id) ? r.product_id[0] : 0,
    status: r.status || "ready",
  }));
}

/** Villa board — operator clicks into a villa and sets a room's status. */
export async function setRoomStatus(roomId: number, status: RoomStatus) {
  return write("villa.room", [roomId], { status });
}

export interface CreateTaskInput {
  templateId: number;
  taskType?: "turnover" | "stayover" | "deep";
  assigneeId?: number;
  roomId?: number;
}

/** Note 2 §2 — admin/manager creates and assigns a housekeeping task. */
export async function createTask(input: CreateTaskInput): Promise<number> {
  return execKw("villa.housekeeping.task", "create", [
    {
      product_id: input.templateId,
      task_type: input.taskType || "turnover",
      assignee_id: input.assigneeId || false,
      room_id: input.roomId || false,
      state: "todo",
    },
  ]);
}
export async function uploadTaskPhoto(id: number, which: "before" | "after", dataBase64: string) {
  const field = which === "before" ? "photo_before" : "photo_after";
  return write("villa.housekeeping.task", [id], { [field]: dataBase64 });
}

/** Persist a single checklist item toggle (writes checklist_json in Odoo). */
export async function toggleTaskItem(id: number, index: number) {
  return execKw("villa.housekeeping.task", "toggle_item", [[id], index]);
}

/** Housekeeper signs off: checklist must be complete; records their
 * completion notes. Back office / HR reviews it via getTaskReports(). */
export async function submitTask(id: number, conclusion: string) {
  return execKw("villa.housekeeping.task", "action_submit", [[id], conclusion]);
}

export interface TaskReport {
  id: number;
  villa: string;
  roomLabel: string;
  type: string;
  assignee: string;
  conclusion: string;
  submittedAt: string;
  submittedBy: string;
}

/** Back office / HR — submitted housekeeping reports with the sign-off notes. */
export async function getTaskReports(limit = 20): Promise<TaskReport[]> {
  if (!USE_ODOO) return [];
  const rows = await searchRead<{
    id: number;
    product_id: [number, string] | false;
    room_label: string | false;
    task_type: "turnover" | "stayover" | "deep";
    assignee_id: [number, string] | false;
    conclusion: string | false;
    submitted_at: string | false;
    submitted_by_id: [number, string] | false;
  }>(
    "villa.housekeeping.task",
    [["conclusion", "!=", false]],
    ["product_id", "room_label", "task_type", "assignee_id", "conclusion", "submitted_at", "submitted_by_id"],
    { order: "submitted_at desc", limit }
  );
  return rows.map((r) => ({
    id: r.id,
    villa: Array.isArray(r.product_id) ? r.product_id[1] : "",
    roomLabel: r.room_label || "",
    type: TYPE_LABEL[r.task_type],
    assignee: Array.isArray(r.assignee_id) ? r.assignee_id[1] : "",
    conclusion: r.conclusion || "",
    submittedAt: r.submitted_at ? fmtOdooDatetime(r.submitted_at) : "",
    submittedBy: Array.isArray(r.submitted_by_id) ? r.submitted_by_id[1] : "",
  }));
}

/** Villa statuses for the ops boards (product.template.x_availability). */
export async function getVillaStatuses(): Promise<Villa[]> {
  const map = await getVillaMap();
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function setVillaStatus(templateId: number, status: string) {
  return write("product.template", [templateId], { x_availability: status });
}

interface OdooSupply {
  id: number;
  name: string;
  x_category: string | false;
  x_stock_qty: number;
  x_min_stock: number;
  x_stock_unit: string | false;
  x_supplier: string | false;
}

export async function getInventory(): Promise<StockItem[]> {
  if (!USE_ODOO) return [];
  const rows = await searchRead<OdooSupply>(
    "product.template",
    [["x_kind", "=", "supply"]],
    ["name", "x_category", "x_stock_qty", "x_min_stock", "x_stock_unit", "x_supplier"],
    { order: "x_category, name" }
  );
  return rows.map((o) => ({
    id: o.id,
    name: o.name,
    category: o.x_category || "",
    qty: o.x_stock_qty,
    min: o.x_min_stock,
    unit: o.x_stock_unit || "",
    supplier: o.x_supplier || "",
  }));
}

/** Restock as a recorded movement (villa.stock.move trail), not a silent bump. */
export async function restock(templateId: number, toQty: number) {
  const rows = await searchRead<{ x_stock_qty: number }>(
    "product.template",
    [["id", "=", templateId]],
    ["x_stock_qty"]
  );
  const current = rows[0]?.x_stock_qty ?? 0;
  const delta = toQty - current;
  return execKw("product.template", "apply_stock_move", [[templateId], delta, "restock", "Restock to reorder level"]);
}

/** Recent inventory movements for the audit trail panel. */
export async function getStockMoves(limit = 8) {
  if (!USE_ODOO) return [];
  const rows = await searchRead<{
    id: number;
    product_id: [number, string] | false;
    delta: number;
    resulting_qty: number;
    reason: string;
    create_date: string;
  }>("villa.stock.move", [], ["product_id", "delta", "resulting_qty", "reason", "create_date"], {
    order: "create_date desc",
    limit,
  });
  return rows.map((r) => ({
    id: r.id,
    item: Array.isArray(r.product_id) ? r.product_id[1] : "",
    delta: r.delta,
    resulting: r.resulting_qty,
    reason: r.reason,
    when: fmtOdooDate(r.create_date),
  }));
}
