/**
 * Finance console — design/07 §4.
 * Traceability (design/10 P22): UC-F1, UC-C6 (settlement) · BPMN B19–B23 ·
 * account.move + account.payment + sale.order ·
 * GET /api/ops/finance/ledger · GET …/reconciliation · POST …/invoices/[id]/validate ·
 * POST …/invoices/generate · GET …/reports
 */
import type { Metadata } from "next";
import { AreaChart, KpiCard, OpsHeader, Panel } from "@/components/ops/ui";
import { Surface } from "@/components/motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { idr } from "@/lib/format";
import { getKpis, getLedger, getReconciliation, getRevenueSeries, getRecentInvoices } from "@/lib/server/finance";
import { FinanceActions, ReconciliationList } from "./finance-actions";

export const metadata: Metadata = { title: "Finance" };

const INV_TONE: Record<string, string> = {
  paid: "bg-sage-300/30 text-palm-700",
  awaiting: "bg-amber-100 text-amber-800",
  refunded: "bg-stone-200 text-stone-600",
};

export default async function FinancePage() {
  const [kpis, ledger, reconciliation, revenueSeries, invoices] = await Promise.all([
    getKpis(),
    getLedger(),
    getReconciliation(),
    getRevenueSeries(),
    getRecentInvoices(),
  ]);
  return (
    <>
      <OpsHeader greeting="Finance" sub="July 2026 · PHR filing due Jul 15 · 1 unmatched settlement">
        <FinanceActions />
      </OpsHeader>

      <Surface className="space-y-6 p-6 lg:p-10">
        {/* KPI row — B23 */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Revenue MTD" value={kpis.revenueMtd.value} delta={kpis.revenueMtd.delta} mono />
          <KpiCard label="Net margin" value="34%" delta="↑ 2 pts vs June" />
          <KpiCard label="PHR liability" value={kpis.phrLiability.value} delta={kpis.phrLiability.delta} tone="warn" mono />
          <KpiCard label="Outstanding folios" value={kpis.outstanding.value} delta={kpis.outstanding.delta} tone="neutral" mono />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Revenue · last 30 days" className="xl:col-span-2">
            <AreaChart data={revenueSeries} />
          </Panel>

          {/* Tax card — PHR 10% + service 8% (design/07 §4.6) */}
          <div className="space-y-6">
            <Panel title="Taxes accrued · July">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between text-ink-700">
                  <dt>PHR 10% (Badung regency)</dt>
                  <dd className="font-mono text-[13px]">{idr(41_200_000)}</dd>
                </div>
                <div className="flex justify-between text-ink-700">
                  <dt>Service charge 8%</dt>
                  <dd className="font-mono text-[13px]">{idr(32_960_000)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 font-medium text-ink-900">
                  <dt>To remit / distribute</dt>
                  <dd className="font-mono text-[13px]">{idr(74_160_000)}</dd>
                </div>
              </dl>
            </Panel>

            <Panel title="Payroll summary · July">
              <dl className="space-y-2.5 text-sm">
                {[
                  ["Front office & butlers", 86_000_000],
                  ["Housekeeping", 64_000_000],
                  ["F&B & kitchen", 72_000_000],
                  ["Service charge pool (8%)", 32_960_000],
                ].map(([label, amount]) => (
                  <div key={label as string} className="flex justify-between text-ink-700">
                    <dt>{label}</dt>
                    <dd className="font-mono text-[13px]">{idr(amount as number)}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </div>

        {/* Invoices — real posted account.move records (Note #7) */}
        <Panel title={`Invoices · ${invoices.length} posted`}>
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">
              No invoices posted yet — they generate shortly after each booking is confirmed.
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-ivory-200/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Invoice</TableHead>
                  <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Guest</TableHead>
                  <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Date</TableHead>
                  <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Status</TableHead>
                  <TableHead className="text-right text-xs tracking-[0.08em] text-stone-500 uppercase">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.number} className="h-12 hover:bg-ivory-200/40">
                    <TableCell className="font-mono text-xs text-ocean-500">{inv.number}</TableCell>
                    <TableCell className="text-sm text-ink-900">{inv.guest}</TableCell>
                    <TableCell className="text-sm text-stone-500">{inv.date}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${INV_TONE[inv.state]}`}>
                        {inv.state}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] text-ink-900">{idr(inv.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        {/* Reconciliation — B21 as workflow, not report (design/07 §4.4) */}
        <Panel title="Midtrans settlements · reconciliation">
          <ReconciliationList rows={reconciliation} />
        </Panel>

        {/* Ledger — B19: every number traces to a booking ref */}
        <Panel title="Ledger · July">
          <Table>
            <TableHeader className="bg-ivory-200/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Date</TableHead>
                <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Description</TableHead>
                <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Reference</TableHead>
                <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Stream</TableHead>
                <TableHead className="text-right text-xs tracking-[0.08em] text-stone-500 uppercase">Debit</TableHead>
                <TableHead className="text-right text-xs tracking-[0.08em] text-stone-500 uppercase">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((e) => (
                <TableRow key={e.id} className="h-12 hover:bg-ivory-200/40">
                  <TableCell className="text-sm text-stone-500">{e.date}</TableCell>
                  <TableCell className="text-sm text-ink-900">{e.description}</TableCell>
                  <TableCell className="font-mono text-xs text-ocean-500">{e.reference}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-sand-300 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                      {e.stream}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-ink-900">
                    {e.debit ? idr(e.debit) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-sage-500">
                    {e.credit ? idr(e.credit) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </Surface>
    </>
  );
}
