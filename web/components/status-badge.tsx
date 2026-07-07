import { cn } from "@/lib/utils";

/**
 * Status badge — design/03 §10. Dot + word, never color-only (design/08 §1).
 * VIP is the only gold-outlined badge in the system.
 */
const STYLES: Record<string, { bg: string; text: string; dot: string; label?: string }> = {
  // guest reservation states
  confirmed: { bg: "bg-sage-300/25", text: "text-sage-500", dot: "bg-sage-500", label: "Confirmed" },
  draft: { bg: "bg-sand-300", text: "text-stone-600", dot: "bg-stone-500", label: "Draft" },
  pending: { bg: "bg-amerta-400/15", text: "text-amerta-600", dot: "bg-amerta-600", label: "Pending" },
  checked_in: { bg: "bg-ocean-500/12", text: "text-ocean-500", dot: "bg-ocean-500", label: "In house" },
  checked_out: { bg: "bg-ocean-500/12", text: "text-ocean-500", dot: "bg-ocean-500", label: "Completed" },
  cancelled: { bg: "bg-sand-300", text: "text-stone-500", dot: "bg-stone-400", label: "Cancelled" },
  // invoice states
  paid: { bg: "bg-sage-300/25", text: "text-sage-500", dot: "bg-sage-500", label: "Paid" },
  awaiting: { bg: "bg-amerta-400/15", text: "text-amerta-600", dot: "bg-amerta-600", label: "Awaiting" },
  refunded: { bg: "bg-ocean-500/12", text: "text-ocean-500", dot: "bg-ocean-500", label: "Refunded" },
  // ops villa states
  available: { bg: "bg-sage-300/25", text: "text-sage-500", dot: "bg-sage-500", label: "Available" },
  occupied: { bg: "bg-palm-700/10", text: "text-palm-700", dot: "bg-palm-700", label: "Occupied" },
  cleaning: { bg: "bg-amerta-400/15", text: "text-amerta-600", dot: "bg-amerta-600", label: "Cleaning" },
  inspection: { bg: "bg-ocean-500/12", text: "text-ocean-500", dot: "bg-ocean-500", label: "Inspection" },
  maintenance: { bg: "bg-terracotta-100", text: "text-terracotta-500", dot: "bg-terracotta-500", label: "Maintenance" },
  // requests
  open: { bg: "bg-terracotta-100", text: "text-terracotta-500", dot: "bg-terracotta-500", label: "Open" },
  in_progress: { bg: "bg-amerta-400/15", text: "text-amerta-600", dot: "bg-amerta-600", label: "In progress" },
  resolved: { bg: "bg-sage-300/25", text: "text-sage-500", dot: "bg-sage-500", label: "Resolved" },
  // fnb
  received: { bg: "bg-sand-300", text: "text-stone-600", dot: "bg-stone-500", label: "Received" },
  kitchen: { bg: "bg-amerta-400/15", text: "text-amerta-600", dot: "bg-amerta-600", label: "In kitchen" },
  delivering: { bg: "bg-ocean-500/12", text: "text-ocean-500", dot: "bg-ocean-500", label: "On its way" },
  billed: { bg: "bg-sage-300/25", text: "text-sage-500", dot: "bg-sage-500", label: "Billed" },
  // reconciliation
  matched: { bg: "bg-sage-300/25", text: "text-sage-500", dot: "bg-sage-500", label: "Matched" },
  unmatched: { bg: "bg-terracotta-100", text: "text-terracotta-500", dot: "bg-terracotta-500", label: "Unmatched" },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const s = STYLES[status] ?? STYLES.draft;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-[0.06em] uppercase",
        s.bg,
        s.text,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {label ?? s.label ?? status}
    </span>
  );
}

/** VIP — gold-outline pill, the only gold-bordered badge (design/03 §10). */
export function VipBadge() {
  return (
    <span className="inline-flex h-6 items-center rounded-full border border-amerta-400 px-2.5 text-[11px] font-semibold tracking-[0.06em] text-amerta-600 uppercase">
      VIP
    </span>
  );
}
