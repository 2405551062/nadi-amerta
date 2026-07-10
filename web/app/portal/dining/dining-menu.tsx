"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf, Minus, Plus, WheatOff } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { idr } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EASE_WATER } from "@/components/motion";

/** Menu list + persistent order pill + order sheet — design/06 §6. */
export function DiningMenu({
  menu,
  villaId,
  villaLabel,
  rooms = [],
}: {
  menu: MenuItem[];
  villaId?: number;
  villaLabel: string;
  rooms?: { id: number; code: string }[];
}) {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [timing, setTiming] = useState<"asap" | "slot">("asap");
  // Note 2 §4 — the guest picks an exact delivery time.
  const [scheduledTime, setScheduledTime] = useState("19:00");
  // The room/unit to deliver to, so the kitchen knows exactly where it goes.
  const [roomId, setRoomId] = useState<number | "">(rooms[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const menuCategories = useMemo(
    () => [...new Set(menu.map((m) => m.category))],
    [menu]
  );
  const items = useMemo(
    () => (category === "All" ? menu : menu.filter((m) => m.category === category)),
    [category, menu]
  );
  const featured = menu.filter((m) => m.featured);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce(
    (sum, [id, qty]) => sum + (menu.find((m) => m.id === Number(id))?.price ?? 0) * qty,
    0
  );

  const setQty = (id: number, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  const placeOrder = async () => {
    setOrdered(true);
    try {
      // Create a villa.fnb.order in Odoo, charged to the folio (B15). Note 2 §4 —
      // carries the guest's chosen timing; the order is invoiced to their folio.
      await fetch("/api/dining/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villaId,
          roomId: roomId || undefined,
          items: Object.entries(cart).map(([id, qty]) => ({ productId: Number(id), qty })),
          timing: timing === "slot" ? "scheduled" : "asap",
          scheduledTime: timing === "slot" ? scheduledTime : undefined,
          note: note || undefined,
        }),
      });
      const roomCode = rooms.find((r) => r.id === roomId)?.code;
      const dest = roomCode ? `${villaLabel} · ${roomCode}` : villaLabel;
      setOpen(false);
      setCart({});
      setNote("");
      toast("Order received", {
        description:
          timing === "slot"
            ? `Scheduled for ${scheduledTime} to ${dest} · added to your folio.`
            : `The kitchen has it — about 35 minutes to ${dest} · added to your folio.`,
      });
    } catch {
      toast("Could not place the order — please try again.");
    } finally {
      setOrdered(false);
    }
  };

  const dietaryIcon = (d: "vegan" | "gf") =>
    d === "vegan" ? (
      <Leaf key="v" className="size-3.5 text-sage-500" aria-label="Vegan" />
    ) : (
      <WheatOff key="g" className="size-3.5 text-amerta-600" aria-label="Gluten-free" />
    );

  return (
    <div className="mt-8">
      {/* Hero dishes */}
      <div className="grid gap-5 sm:grid-cols-2">
        {featured.map((m) => (
          <div key={m.id} className="relative flex overflow-hidden rounded-lg bg-card shadow-sm">
            <div className="relative w-32 shrink-0 sm:w-40">
              <Image src="/photos/chef.webp" alt="" fill sizes="160px" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="eyebrow">From Chef Ketut today</p>
              <h3 className="font-display mt-2 text-lg text-teal-700">{m.name}</h3>
              <p className="mt-1 flex-1 text-[13px] leading-snug text-stone-500">{m.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-sm text-ink-900">{idr(m.price)}</span>
                <QtyControl qty={cart[m.id] ?? 0} onChange={(q) => setQty(m.id, q)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category rail */}
      <div
        className="scrollbar-none sticky top-16 z-20 -mx-6 mt-10 flex gap-2 overflow-x-auto bg-ivory-100/90 px-6 py-3 backdrop-blur-xl"
        role="group"
        aria-label="Menu categories"
      >
        {["All", ...menuCategories.filter((c) => c !== "From Chef Ketut")].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium whitespace-nowrap transition-colors",
              category === c
                ? "border-palm-700 bg-palm-700 text-ivory-50"
                : "border-sand-400 bg-white text-ink-700 hover:border-palm-700"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Menu rows — list, not delivery-app grid (design/06 §6) */}
      <ul className="mt-4 divide-y divide-border rounded-lg bg-card shadow-sm">
        {items
          .filter((m) => !m.featured || category !== "All")
          .map((m) => (
            <li key={m.id} className="flex items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2">
                  <span className="font-display text-[17px] text-teal-700">{m.name}</span>
                  {m.dietary.map(dietaryIcon)}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-stone-500">{m.description}</p>
              </div>
              <span className="shrink-0 font-mono text-[13px] text-ink-900">{idr(m.price)}</span>
              <QtyControl qty={cart[m.id] ?? 0} onChange={(q) => setQty(m.id, q)} />
            </li>
          ))}
      </ul>

      {/* Persistent order pill → order sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.4, ease: EASE_WATER }}
              className="fixed right-6 bottom-6 z-40"
            >
              <SheetTrigger asChild>
                <button className="flex h-14 items-center gap-3 rounded-full bg-forest-900 px-6 text-sm font-medium text-ivory-100 shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]">
                  <span className="flex size-6 items-center justify-center rounded-full bg-amerta-400 font-mono text-xs text-forest-900">
                    {count}
                  </span>
                  {count} {count === 1 ? "item" : "items"} · {idr(total)}
                </button>
              </SheetTrigger>
            </motion.div>
          )}
        </AnimatePresence>

        <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
          <SheetHeader>
            <SheetTitle className="text-display-sm font-medium text-teal-700">Your order</SheetTitle>
            <SheetDescription>To {villaLabel} · charged to your villa folio</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 pb-8">
            <ul className="space-y-3">
              {Object.entries(cart).map(([id, qty]) => {
                const m = menu.find((x) => x.id === Number(id))!;
                return (
                  <li key={id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink-900">{m.name}</span>
                    <span className="flex items-center gap-4">
                      <QtyControl qty={qty} onChange={(q) => setQty(m.id, q)} small />
                      <span className="w-24 text-right font-mono text-[13px]">{idr(m.price * qty)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-baseline justify-between border-t border-border pt-4">
              <span className="font-display text-lg text-ink-900">Total</span>
              <span className="text-price text-teal-700">{idr(total)}</span>
            </div>

            {/* Deliver-to room — the kitchen sees exactly which unit to bring it to. */}
            {rooms.length > 0 && (
              <div>
                <Label htmlFor="dining-room" className="text-xs tracking-[0.1em] text-stone-500 uppercase">
                  Deliver to room
                </Label>
                <select
                  id="dining-room"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
                  className="mt-2 h-11 w-full rounded-md border border-sand-400 bg-white px-3 text-sm text-ink-700"
                >
                  <option value="">No specific room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {villaLabel} · {r.code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-xs tracking-[0.1em] text-stone-500 uppercase">Timing</Label>
              <RadioGroup value={timing} onValueChange={(v) => setTiming(v as "asap" | "slot")} className="mt-2 space-y-2">
                <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                  <RadioGroupItem value="asap" /> As soon as ready (~35 min)
                </label>
                <label className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                  <span className="flex items-center gap-3">
                    <RadioGroupItem value="slot" /> Schedule for a time
                  </span>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => {
                      setScheduledTime(e.target.value);
                      setTiming("slot");
                    }}
                    className="h-8 rounded-md border border-sand-400 bg-white px-2 font-mono text-[13px] text-ink-700"
                    aria-label="Delivery time"
                  />
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="dining-note" className="text-xs tracking-[0.1em] text-stone-500 uppercase">
                Allergies & notes
              </Label>
              <Textarea
                id="dining-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-2 bg-white"
                placeholder="No chilli, extra sambal, candles…"
              />
            </div>

            <button
              onClick={placeOrder}
              disabled={ordered}
              className="h-12 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98] disabled:opacity-60"
            >
              {ordered ? "Sending to the kitchen…" : `Order — ${idr(total)} to folio`}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function QtyControl({
  qty,
  onChange,
  small = false,
}: {
  qty: number;
  onChange: (q: number) => void;
  small?: boolean;
}) {
  if (qty === 0) {
    return (
      <button
        onClick={() => onChange(1)}
        aria-label="Add to order"
        className={cn(
          "flex items-center justify-center rounded-full border border-sand-400 text-ink-700 transition-colors hover:border-palm-700 hover:text-palm-700",
          small ? "size-7" : "size-9"
        )}
      >
        <Plus className={small ? "size-3.5" : "size-4"} aria-hidden />
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <button
        onClick={() => onChange(qty - 1)}
        aria-label="Remove one"
        className={cn(
          "flex items-center justify-center rounded-full border border-sand-400 text-ink-700 hover:border-palm-700",
          small ? "size-7" : "size-9"
        )}
      >
        <Minus className={small ? "size-3.5" : "size-4"} aria-hidden />
      </button>
      <span className="min-w-4 text-center font-mono text-sm" aria-live="polite">
        {qty}
      </span>
      <button
        onClick={() => onChange(qty + 1)}
        aria-label="Add one"
        className={cn(
          "flex items-center justify-center rounded-full bg-palm-700 text-ivory-50 hover:bg-palm-600",
          small ? "size-7" : "size-9"
        )}
      >
        <Plus className={small ? "size-3.5" : "size-4"} aria-hidden />
      </button>
    </span>
  );
}
