"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Panel } from "@/components/ops/ui";
import { Surface } from "@/components/motion";
import type { StockItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function InventoryTable({ stock }: { stock: StockItem[] }) {
  const router = useRouter();
  const [category, setCategory] = useState("All");
  const [requested, setRequested] = useState<number[]>([]);

  const CATEGORIES = useMemo(
    () => ["All", ...Array.from(new Set(stock.map((s) => s.category)))],
    [stock]
  );
  const rows = useMemo(
    () => (category === "All" ? stock : stock.filter((s) => s.category === category)),
    [category, stock]
  );
  const low = stock.filter((s) => s.qty < s.min);

  const restock = async (id: number, name: string, toQty: number) => {
    // POST /api/ops/inventory → writes x_stock_qty (stock.picking in full ERD)
    setRequested((r) => [...r, id]);
    try {
      await fetch("/api/ops/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: id, toQty }),
      });
      toast("Restocked", { description: `${name} · on-hand raised to ${toQty}.` });
      router.refresh();
    } catch {
      toast("Could not restock — please try again.");
    }
  };

  return (
    <Surface className="space-y-6 p-6 lg:p-10">
      {low.length > 0 && (
        <div className="rounded-md border-l-4 border-amerta-600 bg-amerta-400/10 py-3 pr-3 pl-4 text-sm text-ink-700" role="status">
          <strong className="font-medium">{low.length} items below minimum:</strong>{" "}
          {low.map((l) => l.name.split(" (")[0]).join(" · ")}
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
              category === c
                ? "border-palm-700 bg-palm-700 text-ivory-50"
                : "border-sand-400 bg-white text-ink-700 hover:border-palm-700"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <Panel title="Stock levels">
        <Table>
          <TableHeader className="bg-ivory-200/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Item</TableHead>
              <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Category</TableHead>
              <TableHead className="text-right text-xs tracking-[0.08em] text-stone-500 uppercase">On hand</TableHead>
              <TableHead className="text-right text-xs tracking-[0.08em] text-stone-500 uppercase">Minimum</TableHead>
              <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Supplier</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const isLow = s.qty < s.min;
              const done = requested.includes(s.id);
              return (
                <TableRow key={s.id} className="h-14 hover:bg-ivory-200/40">
                  <TableCell className="text-sm font-medium text-ink-900">{s.name}</TableCell>
                  <TableCell className="text-sm text-stone-500">{s.category}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono text-[13px]",
                      isLow ? "font-medium text-terracotta-500" : "text-ink-900"
                    )}
                  >
                    {s.qty} {s.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-stone-500">
                    {s.min} {s.unit}
                  </TableCell>
                  <TableCell className="text-sm text-stone-500">{s.supplier}</TableCell>
                  <TableCell className="text-right">
                    {isLow &&
                      (done ? (
                        <span className="text-[13px] font-medium text-sage-500">Requested ✓</span>
                      ) : (
                        <button
                          onClick={() => restock(s.id, s.name, s.min * 2)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-sand-400 px-3 text-xs font-medium text-ink-700 transition-colors hover:border-palm-700"
                        >
                          <PackagePlus className="size-3.5" aria-hidden /> Restock +{s.min * 2 - s.qty}
                        </button>
                      ))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>
    </Surface>
  );
}
