"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/ops/ui";
import { StatusBadge } from "@/components/status-badge";
import { Surface } from "@/components/motion";
import { idr } from "@/lib/format";
import type { FnbOrder, FnbOrderState } from "@/lib/types";
import { cn } from "@/lib/utils";

const FLOW: FnbOrderState[] = ["received", "kitchen", "delivering", "billed"];
const NEXT_LABEL: Record<FnbOrderState, string> = {
  received: "Start cooking",
  kitchen: "Send to villa",
  delivering: "Bill to folio",
  billed: "",
};

export function FnbQueue({
  initialOrders,
  villaNames,
}: {
  initialOrders: FnbOrder[];
  villaNames: Record<string, string>;
}) {
  const [orders, setOrders] = useState<FnbOrder[]>(initialOrders);

  const advance = async (id: number) => {
    const order = orders.find((o) => o.id === id);
    const next = order ? FLOW[FLOW.indexOf(order.state) + 1] : undefined;
    if (!order || !next) return;
    // POST advances villa.fnb.order in Odoo; on "billed" it hits the folio (B16).
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, state: next } : o)));
    try {
      await fetch(`/api/dining/orders/${id}`, { method: "POST" });
      if (next === "billed") {
        toast("Charged to folio", {
          description: `${villaNames[order.villaSlug] ?? order.villaSlug} · ${idr(total(order))} — finance sees it instantly.`,
        });
      }
    } catch {
      toast("Could not update the order — please try again.");
      setOrders(initialOrders);
    }
  };

  const total = (o: FnbOrder) => o.items.reduce((s, i) => s + i.price * i.qty, 0);

  const lanes: { state: FnbOrderState; title: string }[] = [
    { state: "received", title: "Received" },
    { state: "kitchen", title: "In kitchen" },
    { state: "delivering", title: "On its way" },
    { state: "billed", title: "Billed today" },
  ];

  return (
    <Surface className="p-6 lg:p-10">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {lanes.map((lane) => {
          const laneOrders = orders.filter((o) => o.state === lane.state);
          return (
            <Panel key={lane.state} title={`${lane.title} (${laneOrders.length})`}>
              <ul className="space-y-4">
                {laneOrders.length === 0 && (
                  <li className="py-6 text-center text-[13px] text-stone-500">Nothing here.</li>
                )}
                {laneOrders.map((o) => (
                  <motion.li
                    key={o.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-md border border-border p-4",
                      o.state === "billed" && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink-900">
                        {villaNames[o.villaSlug] ?? o.villaSlug}
                      </p>
                      <span className="font-mono text-xs text-stone-500">{o.placed}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500">{o.guestName}</p>
                    <ul className="mt-3 space-y-1">
                      {o.items.map((i) => (
                        <li key={i.name} className="flex justify-between gap-2 text-[13px] text-ink-700">
                          <span>
                            {i.qty}× {i.name}
                          </span>
                          <span className="font-mono text-xs">{idr(i.price * i.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    {o.note && (
                      <p className="mt-2 rounded bg-amerta-400/10 px-2 py-1.5 text-xs text-amerta-600">
                        “{o.note}”
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                      <span className="font-mono text-[13px] font-medium text-ink-900">{idr(total(o))}</span>
                      {o.state === "billed" ? (
                        <StatusBadge status="billed" />
                      ) : (
                        <button
                          onClick={() => advance(o.id)}
                          className="flex h-9 items-center gap-1.5 rounded-md bg-palm-700 px-3 text-xs font-medium text-ivory-50 transition-colors hover:bg-palm-600"
                        >
                          {o.state === "delivering" ? (
                            <Receipt className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowRight className="size-3.5" aria-hidden />
                          )}
                          {NEXT_LABEL[o.state]}
                        </button>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </Surface>
  );
}
