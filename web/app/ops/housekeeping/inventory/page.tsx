/**
 * Housekeeping inventory — design/10 P20 (new page required by UC-HK2 /
 * BPMN ERP Inventory module; ERD gap §1.5.2 → Odoo stock.quant/stock.picking).
 * Endpoints: GET /api/ops/inventory · POST …/restock
 */
import type { Metadata } from "next";
import { OpsHeader, Panel } from "@/components/ops/ui";
import { InventoryTable } from "./inventory-table";
import { getInventory, getStockMoves } from "@/lib/server/housekeeping";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const [stock, moves] = await Promise.all([getInventory(), getStockMoves()]);
  const low = stock.filter((s) => s.qty < s.min).length;
  return (
    <>
      <OpsHeader
        greeting="Inventory"
        sub={`Linen, amenities, spa & operations stock · ${low} item${low === 1 ? "" : "s"} below minimum`}
      />
      <InventoryTable stock={stock} />
      {moves.length > 0 && (
        <div className="px-6 pb-10 lg:px-10">
          <Panel title="Recent movements">
            <ul className="divide-y divide-border">
              {moves.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink-900">{m.item}</span>
                  <span className="flex items-center gap-4">
                    <span className={`font-mono text-[13px] ${m.delta >= 0 ? "text-sage-500" : "text-terracotta-500"}`}>
                      {m.delta >= 0 ? "+" : ""}{m.delta}
                    </span>
                    <span className="w-24 text-right font-mono text-[13px] text-stone-500">→ {m.resulting}</span>
                    <span className="w-20 text-right text-xs text-stone-500 capitalize">{m.reason}</span>
                    <span className="w-24 text-right text-xs text-stone-500">{m.when}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </>
  );
}
