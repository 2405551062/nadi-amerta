"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { idr } from "@/lib/format";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EASE_WATER } from "@/components/motion";

const CHAPTERS = ["Wellness", "Journeys", "Occasions"] as const;
const DATES = ["Aug 12", "Aug 13", "Aug 14", "Aug 15"];
const SLOTS = ["08:00", "10:30", "15:00", "17:30"];

interface PlannedItem {
  service: Service;
  date: string;
  slot: string;
}

/** Catalog + detail sheet + "Planned for your stay" itinerary rail (design/06 §5). */
export function ServicesCatalog({ services }: { services: Service[] }) {
  const [selected, setSelected] = useState<Service | null>(null);
  const [date, setDate] = useState(DATES[0]);
  const [slot, setSlot] = useState(SLOTS[1]);
  const [billing, setBilling] = useState<"folio" | "now">("folio");
  const [planned, setPlanned] = useState<PlannedItem[]>([]);
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Persist as a villa.service.booking in Odoo (B9).
      await fetch("/api/services/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: selected.id, date, slot, billing }),
      });
      setPlanned((p) =>
        [...p, { service: selected, date, slot }].sort(
          (a, b) => DATES.indexOf(a.date) - DATES.indexOf(b.date)
        )
      );
      toast(`${selected.name} planned`, {
        description: `${date} · ${slot} · ${billing === "folio" ? "charged to villa folio" : "paid now"}`,
      });
      setSelected(null);
    } catch {
      toast("Could not add that — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-12">
      <div className="space-y-14 lg:col-span-8">
        {CHAPTERS.map((chapter) => (
          <section key={chapter} aria-labelledby={`ch-${chapter}`}>
            <h2 id={`ch-${chapter}`} className="text-display-sm text-teal-700">
              {chapter}
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {services
                .filter((s) => s.chapter === chapter)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="group flex h-full flex-col overflow-hidden rounded-lg bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[3/2] overflow-hidden">
                      <Image
                        src={s.image ?? "/photos/hero-gorge.webp"}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 40vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg text-teal-700">{s.name}</h3>
                      <p className="mt-1 flex-1 text-[13px] leading-snug text-stone-500">
                        {s.description.split(".")[0]}.
                      </p>
                      <p className="mt-3 text-[13px] text-ink-700">
                        <span className="text-stone-500">{s.duration} · </span>
                        <span className="font-medium text-amerta-600">
                          {s.price === 0 ? "Included" : idr(s.price)}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>

      {/* Itinerary rail — design/06 §5 */}
      <aside className="lg:col-span-4">
        <div className="rounded-lg bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <p className="eyebrow">Planned for your stay</p>
          <h2 className="text-display-sm mt-3 text-teal-700">Villa Tirta · August</h2>
          {planned.length === 0 ? (
            <p className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-stone-500">
              <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
              Nothing planned yet — choose an experience and it appears here, in order.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              <AnimatePresence initial={false}>
                {planned.map((p, i) => (
                  <motion.li
                    key={`${p.service.id}-${i}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE_WATER }}
                    className="flex items-start justify-between gap-3 rounded-md bg-ivory-200/60 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-900">{p.service.name}</p>
                      <p className="text-xs text-stone-500">
                        {p.date} · {p.slot} ·{" "}
                        {p.service.price === 0 ? "Included" : idr(p.service.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => setPlanned((cur) => cur.filter((_, j) => j !== i))}
                      aria-label={`Remove ${p.service.name}`}
                      className="p-1 text-stone-400 transition-colors hover:text-terracotta-500"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
          {planned.length > 0 && (
            <p className="mt-4 border-t border-border pt-4 text-[13px] text-stone-500">
              Settled at checkout on your villa folio unless paid now.
            </p>
          )}
        </div>
      </aside>

      {/* Detail sheet — slot picker + billing choice */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
          {selected && (
            <>
              <div className="relative -mx-0 aspect-[3/2] overflow-hidden">
                <Image
                  src={selected.image ?? "/photos/hero-gorge.webp"}
                  alt=""
                  fill
                  sizes="440px"
                  className="object-cover"
                />
              </div>
              <SheetHeader className="pb-0">
                <SheetTitle className="text-display-sm font-medium text-teal-700">
                  {selected.name}
                </SheetTitle>
                <SheetDescription className="text-[15px] leading-relaxed">
                  {selected.description}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-8">
                <div>
                  <Label className="text-xs tracking-[0.1em] text-stone-500 uppercase">Day</Label>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choose a day">
                    {DATES.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDate(d)}
                        aria-pressed={date === d}
                        className={cn(
                          "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
                          date === d
                            ? "border-palm-700 bg-palm-700 text-ivory-50"
                            : "border-sand-400 text-ink-700 hover:border-palm-700"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-stone-500">Days shown are during your stay.</p>
                </div>

                <div>
                  <Label className="text-xs tracking-[0.1em] text-stone-500 uppercase">Time</Label>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choose a time">
                    {SLOTS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSlot(t)}
                        aria-pressed={slot === t}
                        className={cn(
                          "h-9 rounded-full border px-4 font-mono text-[13px] transition-colors",
                          slot === t
                            ? "border-palm-700 bg-palm-700 text-ivory-50"
                            : "border-sand-400 text-ink-700 hover:border-palm-700"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs tracking-[0.1em] text-stone-500 uppercase">Billing</Label>
                  <RadioGroup
                    value={billing}
                    onValueChange={(v) => setBilling(v as "folio" | "now")}
                    className="mt-2 space-y-2"
                  >
                    <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                      <RadioGroupItem value="folio" /> Add to villa folio — settle at checkout
                    </label>
                    <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                      <RadioGroupItem value="now" /> Pay now via Midtrans
                    </label>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="svc-notes" className="text-xs tracking-[0.1em] text-stone-500 uppercase">
                    Notes
                  </Label>
                  <Textarea id="svc-notes" rows={2} className="mt-2 bg-white" placeholder="Anything we should know?" />
                </div>

                <button
                  onClick={add}
                  disabled={saving}
                  className="h-12 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? "Adding…" : `Add to my stay${selected.price > 0 ? ` — ${idr(selected.price)}` : ""}`}
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
