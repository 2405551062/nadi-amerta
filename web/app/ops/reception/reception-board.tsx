"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarPlus, Check, ShieldAlert, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/components/ops/ui";
import { StatusBadge, VipBadge } from "@/components/status-badge";
import { Surface } from "@/components/motion";
import { useRouter } from "next/navigation";
import { idr } from "@/lib/format";
import type { GuestRequest, Reservation, Villa } from "@/lib/types";
import { cn } from "@/lib/utils";

/* 14-day occupancy grid data — GET /api/ops/calendar in production */
const DAYS = Array.from({ length: 14 }, (_, i) => 6 + i); // Jul 6–19
const GALUNGAN = 10; // estate ceremony column, shaded (design/07 §2)
const BARS: { villa: string; from: number; to: number; state: "confirmed" | "pending" | "ota"; guest: string }[] = [
  { villa: "villa-tirta", from: 6, to: 8, state: "confirmed", guest: "Chen" },
  { villa: "villa-tirta", from: 12, to: 16, state: "confirmed", guest: "Chen" },
  { villa: "villa-lotus", from: 6, to: 10, state: "ota", guest: "Tanaka" },
  { villa: "villa-surya", from: 6, to: 12, state: "confirmed", guest: "Sharma" },
  { villa: "villa-frangipani", from: 6, to: 11, state: "confirmed", guest: "Jenkins" },
  { villa: "villa-hibiscus", from: 6, to: 9, state: "ota", guest: "Nakamura" },
  { villa: "villa-bambu", from: 9, to: 14, state: "pending", guest: "Hold — agent" },
  { villa: "villa-chandra", from: 13, to: 18, state: "confirmed", guest: "Okafor" },
  { villa: "villa-jepun", from: 15, to: 19, state: "ota", guest: "Meyer" },
];

const CHECKIN_STEPS = [
  "Passport / ID captured",
  "Deposit verified",
  "Welcome drink prepared",
  "Blessing arranged on the riverbank",
];

export function ReceptionBoard({
  arrivals: arrivalsToday,
  inHouse,
  departures: departuresToday,
  requests: initialRequests,
  villas,
  supplies = [],
}: {
  arrivals: Reservation[];
  inHouse: Reservation[];
  departures: Reservation[];
  requests: GuestRequest[];
  villas: Villa[];
  supplies?: { id: number; name: string }[];
}) {
  const router = useRouter();
  const villaMap = new Map(villas.map((v) => [v.slug, v]));
  const [checkinFor, setCheckinFor] = useState<Reservation | null>(null);
  const [steps, setSteps] = useState<boolean[]>(Array(CHECKIN_STEPS.length).fill(false));
  const [checkedIn, setCheckedIn] = useState<number[]>([]);
  const [checkedOut, setCheckedOut] = useState<number[]>([]);
  const [requests, setRequests] = useState(initialRequests);
  // Note #4 — per-request supply draw-down chosen at resolve time.
  const [supplyPick, setSupplyPick] = useState<Record<number, { productId: number; qty: number }>>({});
  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const villaOf = (r: Reservation) => villaMap.get(r.villaSlug);
  const roomReady = checkinFor ? villaOf(checkinFor)?.status !== "cleaning" : true;

  const completeCheckin = async () => {
    if (!checkinFor) return;
    // POST → villa.reservation.action_check_in; villa becomes occupied (B7)
    setCheckedIn((c) => [...c, checkinFor.id]);
    const name = villaOf(checkinFor)?.name;
    await fetch(`/api/reservations/${checkinFor.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkin" }),
    }).catch(() => {});
    setCheckinFor(null);
    setSteps(Array(CHECKIN_STEPS.length).fill(false));
    toast("Checked in", { description: `${name ?? "Villa"} now occupied.` });
    router.refresh();
  };

  const checkout = async (r: Reservation) => {
    // POST → action_check_out (B18), spawns housekeeping turnover task (B24)
    setCheckedOut((c) => [...c, r.id]);
    await fetch(`/api/reservations/${r.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkout" }),
    }).catch(() => {});
    toast("Checked out", {
      description: `${villaOf(r)?.name ?? "Villa"} marked for cleaning — turnover task sent to housekeeping.`,
    });
    router.refresh();
  };

  const advanceRequest = async (id: number) => {
    const req = requests.find((r) => r.id === id);
    const action = req?.state === "open" ? "take" : "resolve";
    // Note 2 §3 — complaints are never settled from inventory; only requests draw supply.
    const pick = action === "resolve" && req?.type === "request" ? supplyPick[id] : undefined;
    setRequests((rs) =>
      rs.map((r) => (r.id === id ? { ...r, state: action === "take" ? "in_progress" : "resolved" } : r))
    );
    await fetch(`/api/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        supplyProductId: pick?.productId,
        supplyQty: pick?.qty,
      }),
    }).catch(() => {});
    router.refresh();
  };

  // Note 2 §3 — route a complaint (e.g. "the AC is broken") to engineering.
  // Flags the villa for maintenance; does NOT touch inventory.
  const sendToEngineering = async (id: number) => {
    setRequests((rs) =>
      rs.map((r) => (r.id === id ? { ...r, state: "in_progress", maintenanceFlagged: true } : r))
    );
    await fetch(`/api/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "maintenance" }),
    }).catch(() => {});
    toast("Sent to engineering", { description: "Villa flagged for maintenance." });
    router.refresh();
  };

  const createReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("guest") || "").trim();
    const email =
      name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "") + "@guest.nadiamerta.com";
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villaSlug: fd.get("villa"),
          checkin: fd.get("checkin"),
          checkout: fd.get("checkout"),
          guests: 2,
          fullName: name,
          email,
          source: fd.get("source"),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setNewOpen(false);
      toast("Reservation created", { description: `${name} · ${data.code} — confirmation sent.` });
      router.refresh();
    } catch (err) {
      toast("Could not create reservation", { description: (err as Error).message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Surface className="space-y-6 p-6 lg:p-10">
      <div className="flex justify-end">
        {/* New reservation — B1 agent/walk-in + B2 OTA (design/10 P18) */}
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <button className="flex h-11 items-center gap-2 rounded-md bg-palm-700 px-5 text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600">
              <CalendarPlus className="size-4" aria-hidden /> New reservation
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[480px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-display-sm font-medium text-teal-700">New reservation</DialogTitle>
              <DialogDescription>
                Walk-in, phone, agent, or OTA overflow — availability is validated before confirm (B3).
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={createReservation}>
              <div className="space-y-2">
                <Label htmlFor="nr-guest">Guest name</Label>
                <Input id="nr-guest" name="guest" required className="h-11 bg-white" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nr-villa">Villa</Label>
                  <Select name="villa" defaultValue={villas[1]?.slug ?? villas[0]?.slug}>
                    <SelectTrigger id="nr-villa" className="h-11! w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {villas.map((v) => (
                        <SelectItem key={v.slug} value={v.slug}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nr-source">Source</Label>
                  <Select name="source" defaultValue="walkin">
                    <SelectTrigger id="nr-source" className="h-11! w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="walkin">Walk-in</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="ota">OTA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nr-in">Check-in</Label>
                  <Input id="nr-in" name="checkin" type="date" required className="h-11 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nr-out">Check-out</Label>
                  <Input id="nr-out" name="checkout" type="date" required className="h-11 bg-white" />
                </div>
              </div>
              <DialogFooter>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-11 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 hover:bg-palm-600 disabled:opacity-60"
                >
                  {creating ? "Creating…" : "Validate availability & create"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today board — three columns (design/07 §2.1) */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title={`Arrivals (${arrivalsToday.filter((r) => !checkedIn.includes(r.id)).length})`}>
          <ul className="space-y-4">
            {arrivalsToday.map((r) => {
              const done = checkedIn.includes(r.id);
              const v = villaOf(r);
              return (
                <motion.li
                  key={r.id}
                  layout
                  className={cn("rounded-md border border-border p-4", done && "opacity-50")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink-900">{r.guestName}</p>
                    {r.vip ? <VipBadge /> : <StatusBadge status={done ? "checked_in" : "confirmed"} />}
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {v?.name ?? r.villaSlug} · ETA {r.eta} {r.channel ? `· via ${r.channel}` : ""}
                  </p>
                  {r.balance > 0 && (
                    <p className="mt-1 font-mono text-xs text-amerta-600">
                      Balance {idr(r.balance)}
                    </p>
                  )}
                  {!done && (
                    <button
                      onClick={() => setCheckinFor(r)}
                      className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-palm-700 text-[13px] font-medium text-ivory-50 hover:bg-palm-600"
                    >
                      <UserCheck className="size-3.5" aria-hidden /> Check in
                    </button>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </Panel>

        <Panel title={`In house (${inHouse.length + checkedIn.length})`}>
          <ul className="space-y-4">
            {inHouse.map((r) => {
              const v = villaOf(r);
              return (
                <li key={r.id} className="rounded-md border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink-900">{r.guestName}</p>
                    <StatusBadge status="checked_in" />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {v?.name ?? r.villaSlug} · departs {r.checkOut.split(",")[0]}
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-700">
                    Folio balance {idr(r.balance)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title={`Departures (${departuresToday.filter((r) => !checkedOut.includes(r.id)).length})`}>
          <ul className="space-y-4">
            {departuresToday.map((r) => {
              const done = checkedOut.includes(r.id);
              const v = villaOf(r);
              return (
                <motion.li
                  key={r.id}
                  layout
                  className={cn("rounded-md border border-border p-4", done && "opacity-50")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink-900">{r.guestName}</p>
                    <StatusBadge status={done ? "checked_out" : r.balance > 0 ? "pending" : "confirmed"} label={done ? "Departed" : r.balance > 0 ? "Folio open" : "Settled"} />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{v?.name ?? r.villaSlug} · checkout by 12:00</p>
                  {r.balance > 0 && !done && (
                    <p className="mt-1 font-mono text-xs text-amerta-600">Collect {idr(r.balance)}</p>
                  )}
                  {!done && (
                    <button
                      onClick={() => checkout(r)}
                      className="mt-3 h-9 w-full rounded-md border border-sand-400 text-[13px] font-medium text-ink-700 transition-colors hover:border-palm-700"
                    >
                      Check out & close folio
                    </button>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Occupancy calendar — 14 days × 8 villas (design/07 §2.3) */}
      <Panel title="Occupancy · next 14 days">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card pr-3 pb-2 text-left font-medium text-stone-500">Villa</th>
                {DAYS.map((d) => (
                  <th
                    key={d}
                    className={cn(
                      "pb-2 text-center font-medium",
                      d === GALUNGAN ? "text-amerta-600" : "text-stone-500"
                    )}
                    title={d === GALUNGAN ? "Galungan — estate ceremony day" : undefined}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {villas.map((v) => (
                <tr key={v.slug}>
                  <td className="sticky left-0 bg-card py-1 pr-3 text-[13px] font-medium whitespace-nowrap text-ink-900">
                    {v.name}
                  </td>
                  {DAYS.map((d) => {
                    const bar = BARS.find((b) => b.villa === v.slug && d >= b.from && d < b.to);
                    return (
                      <td key={d} className={cn("h-8 border-t border-border p-0", d === GALUNGAN && "bg-sand-300/50")}>
                        {bar && (
                          <div
                            title={`${bar.guest} · Jul ${bar.from}–${bar.to}`}
                            className={cn(
                              "mx-px h-5",
                              d === bar.from && "rounded-l-full",
                              d === bar.to - 1 && "rounded-r-full",
                              bar.state === "confirmed" && "bg-palm-700",
                              bar.state === "pending" && "border border-dashed border-sand-400 bg-sand-300/60",
                              bar.state === "ota" && "bg-ocean-500/70"
                            )}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-5 text-xs text-stone-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-palm-700" /> Direct confirmed</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-ocean-500/70" /> OTA</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full border border-dashed border-sand-400 bg-sand-300/60" /> Pending hold</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sand-300" /> Ceremony day</span>
        </div>
      </Panel>

      {/* Requests queue — B11 staff side */}
      <Panel title="Requests & complaints">
        <ul className="space-y-3">
          {requests.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-md border-l-4 py-3 pr-3 pl-4",
                r.type === "complaint"
                  ? "border-terracotta-500 bg-terracotta-100/40"
                  : "border-ocean-500 bg-ocean-500/5"
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
                  {r.type === "complaint" && <ShieldAlert className="size-4 text-terracotta-500" aria-hidden />}
                  {r.subject}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {r.villa} · {r.guestName} · {r.created} · {r.priority} priority
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.state} />
                {r.maintenanceFlagged && (
                  <span className="rounded-full bg-terracotta-100 px-2.5 py-1 text-[11px] font-semibold text-terracotta-500">
                    Engineering
                  </span>
                )}
                {/* Note 2 §3 — complaints route to engineering, never inventory. */}
                {r.type === "complaint" && r.state !== "resolved" && !r.maintenanceFlagged && (
                  <button
                    onClick={() => sendToEngineering(r.id)}
                    className="flex h-8 items-center gap-1.5 rounded-md border border-terracotta-500/50 px-3 text-xs font-medium text-terracotta-500 transition-colors hover:bg-terracotta-100/40"
                  >
                    <ShieldAlert className="size-3.5" aria-hidden />
                    Send to engineering
                  </button>
                )}
                {r.type === "request" && r.state === "in_progress" && supplies.length > 0 && (
                  <>
                    <select
                      value={supplyPick[r.id]?.productId ?? ""}
                      onChange={(e) => {
                        const productId = Number(e.target.value);
                        setSupplyPick((s) => {
                          const next = { ...s };
                          if (productId) next[r.id] = { productId, qty: s[r.id]?.qty || 1 };
                          else delete next[r.id];
                          return next;
                        });
                      }}
                      title="Draw a supply from inventory when resolving"
                      className="h-8 rounded-md border border-sand-400 bg-white px-2 text-xs text-ink-700"
                    >
                      <option value="">No supply</option>
                      {supplies.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {supplyPick[r.id]?.productId ? (
                      <input
                        type="number"
                        min={1}
                        value={supplyPick[r.id]?.qty || 1}
                        onChange={(e) =>
                          setSupplyPick((s) => ({
                            ...s,
                            [r.id]: { productId: s[r.id]!.productId, qty: Math.max(1, Number(e.target.value) || 1) },
                          }))
                        }
                        aria-label="Quantity"
                        className="h-8 w-14 rounded-md border border-sand-400 bg-white px-2 text-xs text-ink-700"
                      />
                    ) : null}
                  </>
                )}
                {r.state !== "resolved" && (
                  <button
                    onClick={() => advanceRequest(r.id)}
                    className="flex h-8 items-center gap-1.5 rounded-md border border-sand-400 px-3 text-xs font-medium text-ink-700 transition-colors hover:border-palm-700"
                  >
                    <Check className="size-3.5" aria-hidden />
                    {r.state === "open" ? "Take it" : "Resolve"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Check-in sheet — B7: verify ID, assign villa; room-ready gate (design/07 §2.2) */}
      <Sheet open={!!checkinFor} onOpenChange={(o) => !o && setCheckinFor(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
          {checkinFor && (
            <>
              <SheetHeader>
                <SheetTitle className="text-display-sm font-medium text-teal-700">
                  Check in · {checkinFor.guestName}
                </SheetTitle>
                <SheetDescription>
                  {villaOf(checkinFor)?.name ?? checkinFor.villaSlug} · {checkinFor.nights} nights · {checkinFor.guests} guests ·{" "}
                  <span className="font-mono">{checkinFor.code}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-8">
                <div
                  className={cn(
                    "rounded-md border-l-4 py-3 pr-3 pl-4 text-sm",
                    roomReady
                      ? "border-sage-500 bg-sage-300/15 text-sage-500"
                      : "border-amerta-600 bg-amerta-400/10 text-amerta-600"
                  )}
                  role="status"
                >
                  {roomReady
                    ? "Villa is ready — housekeeping signed off."
                    : "Villa still in cleaning — check-in is blocked until housekeeping marks it Ready. Manager PIN can override."}
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold tracking-[0.08em] text-stone-500 uppercase">
                    Arrival checklist
                  </legend>
                  {CHECKIN_STEPS.map((s, i) => (
                    <label key={s} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                      <Checkbox
                        checked={steps[i]}
                        onCheckedChange={(v) =>
                          setSteps((cur) => cur.map((x, j) => (j === i ? v === true : x)))
                        }
                      />
                      {s}
                    </label>
                  ))}
                </fieldset>

                <button
                  disabled={!steps.every(Boolean) || !roomReady}
                  onClick={completeCheckin}
                  className="h-12 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 disabled:opacity-40"
                >
                  Complete check-in
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Surface>
  );
}
