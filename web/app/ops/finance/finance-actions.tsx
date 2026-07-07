"use client";

import { useState } from "react";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { idr } from "@/lib/format";

/** Finance header actions — B22/B23 · UC-F1 report export. */
export function FinanceActions() {
  return (
    <div className="flex gap-3">
      <a
        href="/api/ops/exports/phr"
        className="flex h-11 items-center gap-2 rounded-md bg-palm-700 px-5 text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600"
      >
        <FileText className="size-4" aria-hidden /> PHR tax report (CSV)
      </a>
      <a
        href="/api/ops/exports/analytics"
        target="_blank"
        className="flex h-11 items-center gap-2 rounded-md border border-sand-400 bg-white px-5 text-sm font-medium text-ink-700 transition-colors hover:border-palm-700"
      >
        <FileDown className="size-4" aria-hidden /> Analytics pack (PDF)
      </a>
    </div>
  );
}

interface ReconRow {
  id: number;
  settlement: string;
  amount: number;
  invoice: string;
  state: "matched" | "unmatched";
}

/** Reconciliation rows with resolve action — B21 validate payment. */
export function ReconciliationList({ rows }: { rows: ReconRow[] }) {
  const [resolved, setResolved] = useState<number[]>([]);

  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const state = resolved.includes(r.id) ? "matched" : r.state;
        return (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[13px] text-ink-900">{r.settlement}</span>
              <span className="font-mono text-[13px] text-ink-700">{idr(r.amount)}</span>
              <span className="text-[13px] text-stone-500">→ {state === "matched" && r.invoice === "—" ? "INV/2026/0421" : r.invoice}</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={state} />
              {state === "unmatched" && (
                <button
                  onClick={() => {
                    // POST /api/ops/finance/invoices/[id]/validate (B21)
                    setResolved((x) => [...x, r.id]);
                    toast("Payment validated", { description: `${r.settlement} matched to INV/2026/0421.` });
                  }}
                  className="h-8 rounded-md border border-sand-400 px-3 text-xs font-medium text-ink-700 transition-colors hover:border-palm-700"
                >
                  Resolve
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
