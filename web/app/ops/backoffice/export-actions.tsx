"use client";

import { FileArchive, FileSpreadsheet, ScrollText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/ops/ui";

const EXPORTS = [
  {
    key: "booking-docs",
    icon: FileArchive,
    title: "Booking documentation",
    body: "Reservation dossiers — confirmation, folio, ID records — bundled per stay for audit.",
    bpmn: "B12",
    action: "Export CSV",
  },
  {
    key: "marketing",
    icon: FileSpreadsheet,
    title: "Marketing export",
    body: "Consent-flagged guest list with stay history and preferences, for campaigns (CSV).",
    bpmn: "B13",
    action: "Export CSV",
  },
  {
    key: "legal",
    icon: ShieldCheck,
    title: "Legal & compliance export",
    body: "Guest registrations for immigration reporting (SIMPONI) and PHR documentation.",
    bpmn: "B13",
    action: "Export report",
  },
  {
    key: "analytics",
    icon: ScrollText,
    title: "Monthly analytics pack",
    body: "Occupancy, ADR, source mix, and review themes — the GM's board pages (PDF).",
    bpmn: "B14",
    action: "Generate PDF",
  },
] as const;

/** GET /api/ops/exports/[type] — real CSV/PDF downloads (B12/B13/B14). */
export function ExportActions() {
  const download = (key: string, title: string) => {
    // Trigger a real file download from the export route.
    window.open(`/api/ops/exports/${key}`, "_blank");
    toast(`${title} generated`, { description: "Your download should begin now." });
  };

  return (
    <Panel title="Documentation & exports">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {EXPORTS.map((e) => (
          <div key={e.key} className="flex flex-col rounded-md border border-border p-5">
            <e.icon className="size-6 text-palm-700" strokeWidth={1.5} aria-hidden />
            <h3 className="mt-3 text-sm font-semibold text-ink-900">{e.title}</h3>
            <p className="mt-1.5 flex-1 text-[13px] leading-snug text-stone-500">{e.body}</p>
            <p className="mt-2 font-mono text-[11px] text-stone-400">BPMN {e.bpmn}</p>
            <button
              onClick={() => download(e.key, e.title)}
              className="mt-3 h-9 rounded-md border border-sand-400 text-[13px] font-medium text-ink-700 transition-colors hover:border-palm-700"
            >
              {e.action}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
