/**
 * Invoices — design/06 §4.
 * Traceability (design/10 P9): UC-C6 evidence · BPMN B22 ·
 * account.move + account.payment · GET /api/invoices, GET /api/invoices/[id]/pdf
 */
import type { Metadata } from "next";
import { Download } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Surface } from "@/components/motion";
import { idr } from "@/lib/format";
import { getInvoices } from "@/lib/server/invoices";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  return (
    <main className="container-na py-12 lg:py-16">
      <p className="eyebrow">Billing</p>
      <h1 className="text-display-md mt-3 text-teal-700">Invoices</h1>
      <p className="mt-3 text-sm text-stone-500">
        Every amount includes PHR tax (10%) and service (8%). PDFs are issued by our finance system.
      </p>

      <Surface className="mt-8 overflow-hidden rounded-lg bg-card shadow-sm">
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-ivory-200/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 text-xs tracking-[0.08em] text-stone-500 uppercase">Invoice</TableHead>
                <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Stay</TableHead>
                <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Date</TableHead>
                <TableHead className="text-right text-xs tracking-[0.08em] text-stone-500 uppercase">Amount</TableHead>
                <TableHead className="text-xs tracking-[0.08em] text-stone-500 uppercase">Status</TableHead>
                <TableHead className="pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="h-14 hover:bg-ivory-200/40">
                  <TableCell className="pl-6 font-mono text-[13px] text-ink-900">{inv.number}</TableCell>
                  <TableCell className="text-sm text-ink-700">{inv.stay}</TableCell>
                  <TableCell className="text-sm text-stone-500">{inv.date}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-ink-900">{idr(inv.amount)}</TableCell>
                  <TableCell><StatusBadge status={inv.state} /></TableCell>
                  <TableCell className="pr-6 text-right">
                    <a
                      href={`/api/invoices/${encodeURIComponent(inv.reservationCode)}/pdf`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
                      aria-label={`Download ${inv.number} as PDF`}
                    >
                      <Download className="size-4" aria-hidden /> PDF
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile stacked cards (design/06 §4) */}
        <ul className="divide-y divide-border md:hidden">
          {invoices.map((inv) => (
            <li key={inv.id} className="space-y-2 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] text-ink-900">{inv.number}</span>
                <StatusBadge status={inv.state} />
              </div>
              <p className="text-sm text-ink-700">{inv.stay}</p>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-stone-500">{inv.date}</span>
                <span className="font-mono text-sm text-ink-900">{idr(inv.amount)}</span>
              </div>
              <a
                href={`/api/invoices/${encodeURIComponent(inv.reservationCode)}/pdf`}
                target="_blank"
                className="flex items-center gap-1.5 text-sm font-medium text-teal-700"
              >
                <Download className="size-4" aria-hidden /> Download PDF
              </a>
            </li>
          ))}
        </ul>
      </Surface>

      {invoices[0] && (
        <p className="mt-4 text-[13px] text-stone-500">
          Paid via {invoices[0].method} · reference <span className="font-mono">{invoices[0].reference}</span> —
          every payment traces to a Midtrans settlement.
        </p>
      )}
    </main>
  );
}
