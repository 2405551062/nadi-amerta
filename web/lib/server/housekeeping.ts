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
  due: string | false;
  state: "todo" | "doing" | "inspection" | "done";
  checklist_json: string | false;
}

const TYPE_LABEL = { turnover: "Turnover", stayover: "Stayover", deep: "Deep clean" } as const;
// A couple of named housekeepers so the board looks staffed.
const STAFF = ["Ni Kadek Ayu", "I Wayan Putra", "Ni Luh Sari", "I Made Agus"];

export async function getTasks(): Promise<HousekeepingTask[]> {
  if (!USE_ODOO) return [];
  const rows = await searchRead<OdooTask>(
    "villa.housekeeping.task",
    [],
    ["product_id", "task_type", "assignee_id", "due", "state", "checklist_json"],
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
      due: o.due ? fmtOdooDate(o.due) : ["13:00", "14:30", "12:00", "Tomorrow"][i % 4],
      state: o.state === "done" ? "done" : o.state === "todo" ? "todo" : "doing",
      checklist,
    };
  });
}

export async function advanceTask(id: number) {
  return callButton("villa.housekeeping.task", "action_advance", [id]);
}

/** Persist a single checklist item toggle (writes checklist_json in Odoo). */
export async function toggleTaskItem(id: number, index: number) {
  return execKw("villa.housekeeping.task", "toggle_item", [[id], index]);
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
