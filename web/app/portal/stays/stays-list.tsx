"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Download, RotateCcw, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { JourneyTimeline } from "@/components/journey-timeline";
import { idr, formatRange } from "@/lib/format";
import { buildJourney } from "@/lib/journey";
import type { Reservation } from "@/lib/types";
import { cn } from "@/lib/utils";

type VillaLite = { name: string; image: string; slug: string };

const SCOPES = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type Scope = (typeof SCOPES)[number]["key"];

function scopeOf(r: Reservation): Scope {
  if (r.state === "cancelled") return "cancelled";
  if (r.state === "checked_out") return "past";
  return "upcoming";
}

export function StaysList({
  stays,
  villas,
}: {
  stays: Reservation[];
  villas: Record<string, VillaLite>;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("upcoming");
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelled, setCancelled] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [quote, setQuote] = useState<{ refund: number; policy: string; cancellable: boolean } | null>(null);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modIn, setModIn] = useState("");
  const [modOut, setModOut] = useState("");
  const [modifying, setModifying] = useState(false);

  // Fetch the real cancellation quote when the dialog opens.
  const openCancel = async () => {
    if (!selected) return;
    setQuote(null);
    setCancelOpen(true);
    try {
      const res = await fetch(`/api/reservations/${selected.id}`);
      setQuote(await res.json());
    } catch {
      setQuote({ refund: 0, policy: "Could not load policy", cancellable: true });
    }
  };

  const doModify = async () => {
    if (!selected || !modIn || !modOut) return;
    setModifying(true);
    try {
      const res = await fetch(`/api/reservations/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "modify", checkin: modIn, checkout: modOut }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not modify");
      setModifyOpen(false);
      setSelected(null);
      toast("Dates updated", { description: "Your reservation now reflects the new dates." });
      router.refresh();
    } catch (err) {
      toast("Could not modify", { description: (err as Error).message });
    } finally {
      setModifying(false);
    }
  };

  const rows = useMemo(
    () =>
      stays
        .map((r) => (cancelled.includes(r.code) ? { ...r, state: "cancelled" as const } : r))
        .filter((r) => scopeOf(r) === scope),
    [scope, cancelled, stays]
  );

  const sel = selected && cancelled.includes(selected.code)
    ? { ...selected, state: "cancelled" as const }
    : selected;
  const villa = sel ? villas[sel.villaSlug] : undefined;
  const refund = quote?.refund ?? 0;

  const doCancel = async () => {
    if (!sel) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/reservations/${sel.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!(await res.json()).ok) throw new Error();
      setCancelled((c) => [...c, sel.code]);
      setCancelOpen(false);
      setSelected(null);
      toast("Reservation cancelled", {
        description: `${idr(refund)} will be refunded within 5 working days.`,
      });
      router.refresh();
    } catch {
      toast("Could not cancel — please try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {/* Segmented control — gold underline slides (design/06 §3) */}
      <div className="mt-8 flex gap-1 border-b border-border" role="tablist" aria-label="Filter stays">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={scope === s.key}
            onClick={() => setScope(s.key)}
            className={cn(
              "relative px-4 py-3 text-sm transition-colors",
              scope === s.key ? "font-medium text-teal-700" : "text-stone-500 hover:text-ink-700"
            )}
          >
            {s.label}
            {scope === s.key && (
              <motion.span
                layoutId="stays-tab"
                className="absolute inset-x-4 bottom-0 h-0.5 bg-amerta-400"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-display-sm text-teal-700">
            {scope === "past" ? "Your first story is still unwritten." : "Nothing here yet."}
          </p>
          <Link
            href="/villas"
            className="mt-5 inline-flex h-11 items-center rounded-md bg-palm-700 px-6 text-sm font-medium text-ivory-50 hover:bg-palm-600"
          >
            Browse the villas
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => {
            const v = villas[r.villaSlug];
            if (!v) return null;
            return (
              <li key={r.code}>
                <button
                  onClick={() => setSelected(r)}
                  className="flex w-full items-center gap-5 rounded-lg bg-card p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative hidden h-20 w-24 shrink-0 overflow-hidden rounded-md sm:block">
                    <Image src={v.image} alt="" fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-lg text-teal-700">{v.name}</p>
                    <p className="text-[13px] text-stone-500">
                      {formatRange(r.checkIn, r.checkOut)} · {r.nights} nights · {r.guests} guests
                    </p>
                    <p className="mt-1 font-mono text-xs text-stone-500">{r.code}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="hidden font-mono text-sm text-ink-700 md:block">{idr(r.total)}</span>
                    <StatusBadge status={r.state} />
                    <ChevronRight className="size-4 text-stone-400" aria-hidden />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Detail drawer — design/06 §3 */}
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[480px]">
          {sel && villa && (
            <>
              <SheetHeader className="pb-0">
                <SheetTitle className="text-display-sm font-medium text-teal-700">
                  {villa.name}
                </SheetTitle>
                <SheetDescription>
                  {formatRange(sel.checkIn, sel.checkOut)} · {sel.nights} nights ·{" "}
                  <span className="font-mono">{sel.code}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-8 px-4 pb-8">
                <StatusBadge status={sel.state} />

                {scopeOf(sel) === "upcoming" && (
                  <>
                    <JourneyTimeline steps={buildJourney(sel, villa.name)} />
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setModIn("");
                          setModOut("");
                          setModifyOpen(true);
                        }}
                        className="block w-full rounded-md border border-sand-400 py-3 text-center text-sm font-medium text-ink-700 transition-colors hover:border-palm-700"
                      >
                        Modify dates
                      </button>
                      <Link
                        href="/portal/services"
                        className="block rounded-md border border-sand-400 py-3 text-center text-sm font-medium text-ink-700 transition-colors hover:border-palm-700"
                      >
                        Add services
                      </Link>
                      <button
                        onClick={openCancel}
                        className="block w-full rounded-md py-3 text-center text-sm font-medium text-terracotta-500 transition-colors hover:bg-terracotta-100/50"
                      >
                        Cancel reservation
                      </button>
                    </div>
                  </>
                )}

                {scopeOf(sel) === "past" && (
                  <div className="space-y-3">
                    <a
                      href={`/api/invoices/${encodeURIComponent(sel.code)}/pdf`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 rounded-md border border-sand-400 py-3 text-sm font-medium text-ink-700 transition-colors hover:border-palm-700"
                    >
                      <Download className="size-4" aria-hidden /> Download invoice
                    </a>
                    <Link
                      href={`/book/${villa.slug}`}
                      className="flex items-center justify-center gap-2 rounded-md border border-sand-400 py-3 text-sm font-medium text-ink-700 transition-colors hover:border-palm-700"
                    >
                      <RotateCcw className="size-4" aria-hidden /> Book again
                    </Link>
                    <button
                      onClick={() => toast("Thank you — your words reach the whole team.", { description: "Review submitted." })}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-palm-700 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600"
                    >
                      <Star className="size-4" aria-hidden /> Leave a review
                    </button>
                  </div>
                )}

                <dl className="space-y-2.5 border-t border-border pt-5 text-sm">
                  <div className="flex justify-between text-ink-700">
                    <dt>Total paid</dt>
                    <dd className="font-mono text-[13px]">{idr(sel.total)}</dd>
                  </div>
                  <div className="flex justify-between text-ink-700">
                    <dt>Source</dt>
                    <dd className="capitalize">{sel.channel ?? sel.source}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel — policy-aware, refund quoted before confirming (design/03 §9) */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-[440px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-display-sm font-medium text-teal-700">
              Cancel this reservation?
            </DialogTitle>
            <DialogDescription className="pt-2 text-[15px] leading-relaxed">
              {quote === null ? (
                "Checking your cancellation policy…"
              ) : (
                <>
                  <strong className="text-ink-900">{idr(refund)}</strong>
                  {sel ? ` of ${idr(sel.total)}` : ""} is refundable to your original payment method
                  within 5 working days. <span className="text-stone-500">{quote.policy}.</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-2 sm:gap-3">
            <button
              autoFocus
              onClick={() => setCancelOpen(false)}
              className="h-11 rounded-md border border-sand-400 px-5 text-sm font-medium text-ink-700 transition-colors hover:border-palm-700"
            >
              Keep reservation
            </button>
            <button
              onClick={doCancel}
              disabled={cancelling || quote === null}
              className="h-11 rounded-md bg-terracotta-500 px-5 text-sm font-medium text-ivory-50 transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel reservation"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modify dates */}
      <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
        <DialogContent className="max-w-[440px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-display-sm font-medium text-teal-700">Modify dates</DialogTitle>
            <DialogDescription className="pt-2 text-[15px] leading-relaxed">
              Choose new dates for {villa?.name ?? "your stay"}. Availability is re-checked when you save.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-stone-500">Check-in</span>
              <input type="date" value={modIn} onChange={(e) => setModIn(e.target.value)} className="h-11 w-full rounded-md border border-input bg-white px-3" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-stone-500">Check-out</span>
              <input type="date" value={modOut} onChange={(e) => setModOut(e.target.value)} className="h-11 w-full rounded-md border border-input bg-white px-3" />
            </label>
          </div>
          <DialogFooter className="gap-3 sm:gap-3">
            <button onClick={() => setModifyOpen(false)} className="h-11 rounded-md border border-sand-400 px-5 text-sm font-medium text-ink-700 hover:border-palm-700">
              Keep current dates
            </button>
            <button
              onClick={doModify}
              disabled={modifying || !modIn || !modOut}
              className="h-11 rounded-md bg-palm-700 px-5 text-sm font-medium text-ivory-50 hover:bg-palm-600 disabled:opacity-50"
            >
              {modifying ? "Saving…" : "Save new dates"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
