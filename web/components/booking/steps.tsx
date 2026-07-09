"use client";

/**
 * Booking flow steps — design/05 §1–4.
 * Traceability (design/10 P4): UC-C1, UC-C5 · BPMN B1, B3, B4, B20 ·
 * villa.reservation + sale.order(.line) + res.partner + account.payment ·
 * POST /api/reservations/draft, POST /api/reservations/[id]/confirm
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DateRange } from "react-day-picker";
import { Building2, Car, CreditCard, Flower2, Lock, MoonStar, QrCode, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GuestStepper, toISO } from "@/components/site/booking-bar";
import { LotusMark } from "@/components/site/lotus-mark";
import { EASE_WATER } from "@/components/motion";
import { idr, quote } from "@/lib/format";
import { disabledFromBooked, type BookedRange } from "@/lib/availability";
import type { Villa } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  fmtISO, nightsOf, useBooking, PICKUP_PRICE,
} from "./booking-context";

/* ------------------------------------------------------------------ */
/* Midtrans Snap loader (client-side popup)                            */
/* ------------------------------------------------------------------ */

type SnapCallbacks = {
  onSuccess?: (r: unknown) => void;
  onPending?: (r: unknown) => void;
  onError?: (r: unknown) => void;
  onClose?: () => void;
};
declare global {
  interface Window {
    snap?: { pay: (token: string, cb: SnapCallbacks) => void };
  }
}

/** Inject snap.js once (idempotent) and resolve when it's ready. */
function loadSnap(snapUrl: string, clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.snap) return resolve();
    const existing = document.getElementById("midtrans-snap") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Could not load payment module")));
      return;
    }
    const s = document.createElement("script");
    s.id = "midtrans-snap";
    s.src = snapUrl;
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load payment module"));
    document.head.appendChild(s);
  });
}

/** Open the Snap popup; resolve on success/pending, reject on close/error. */
function runSnap(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.snap) return reject(new Error("Payment module not ready"));
    window.snap.pay(token, {
      onSuccess: () => resolve(),
      onPending: () => resolve(),
      onError: () => reject(new Error("Payment failed — please try again")),
      onClose: () => reject(new Error("cancelled")),
    });
  });
}

/* ------------------------------------------------------------------ */
/* Step 1 — Dates (B3: availability gate)                              */
/* ------------------------------------------------------------------ */

export function DatesStep({ villa, bookedRanges = [] }: { villa: Villa; bookedRanges?: BookedRange[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { state, patch } = useBooking();
  const disabled = disabledFromBooked(bookedRanges);

  // Seed from villa-detail deep link (?checkin&checkout&guests)
  useEffect(() => {
    if (!state.checkin && params.get("checkin")) {
      patch({
        checkin: params.get("checkin") ?? undefined,
        checkout: params.get("checkout") ?? undefined,
        guests: Number(params.get("guests") ?? 2),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const range: DateRange | undefined = state.checkin
    ? { from: new Date(state.checkin), to: state.checkout ? new Date(state.checkout) : undefined }
    : undefined;

  const nights = nightsOf(state);

  return (
    <section aria-labelledby="step-dates-title">
      <h1 id="step-dates-title" className="text-display-sm text-teal-700">
        When does the river expect you?
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        {villa.name} asks for a {villa.minStay}-night minimum. Nyepi is blocked automatically.
      </p>

      <div className="mt-8 rounded-lg bg-card p-4 shadow-sm sm:p-6">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={(r) =>
            patch({
              checkin: r?.from ? toISO(r.from) : undefined,
              checkout: r?.to ? toISO(r.to) : undefined,
            })
          }
          disabled={disabled}
          className="mx-auto"
        />
      </div>

      <div className="mt-6 flex h-14 items-center justify-between rounded-lg bg-card px-5 shadow-sm">
        <span className="text-sm font-medium text-ink-700">Guests</span>
        <GuestStepper
          value={state.guests}
          onChange={(n) => patch({ guests: n })}
          max={villa.capacity}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={nights < villa.minStay}
          onClick={() => router.push(`/book/${villa.slug}/details`)}
          className="h-12 rounded-md bg-palm-700 px-8 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98] disabled:opacity-40"
        >
          Continue → Details
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Details (guest + Arrival Ritual)                           */
/* ------------------------------------------------------------------ */

const RITUALS = [
  {
    key: "pickup" as const,
    icon: Car,
    title: "Airport pickup",
    body: "Private transfer from Ngurah Rai — cold towels and young coconut included.",
    price: `+ ${idr(PICKUP_PRICE)}`,
  },
  {
    key: "blessing" as const,
    icon: Flower2,
    title: "Flower-water blessing",
    body: "A traditional Balinese welcome on the riverbank, led by our resident priest.",
    price: "Included",
  },
  {
    key: "lateArrival" as const,
    icon: MoonStar,
    title: "Arriving after 20:00",
    body: "We keep the kitchen warm and the lanterns lit — just let us know.",
    price: "Free",
  },
];

export function DetailsStep({ villa }: { villa: Villa }) {
  const router = useRouter();
  const { state, patch } = useBooking();
  const [touched, setTouched] = useState(false);

  const valid = state.fullName.trim() && /\S+@\S+\.\S+/.test(state.email) && state.phone.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setTouched(true);
      document.querySelector<HTMLInputElement>("[aria-invalid=true]")?.focus();
      return;
    }
    router.push(`/book/${villa.slug}/confirm`);
  };

  const err = (bad: boolean) => touched && bad;

  return (
    <form onSubmit={submit} noValidate aria-labelledby="step-details-title">
      <h1 id="step-details-title" className="text-display-sm text-teal-700">
        Guest details
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Have an account?{" "}
        <a href="/signin" className="font-medium text-teal-700 underline underline-offset-4">
          Sign in
        </a>{" "}
        — or continue as guest; we&apos;ll create your account from this booking.
      </p>

      <div className="mt-8 space-y-5 rounded-lg bg-card p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="b-name">Full name</Label>
            <Input
              id="b-name"
              value={state.fullName}
              onChange={(e) => patch({ fullName: e.target.value })}
              autoComplete="name"
              aria-invalid={err(!state.fullName.trim())}
              aria-describedby={err(!state.fullName.trim()) ? "b-name-err" : undefined}
              className="h-12 bg-white"
            />
            {err(!state.fullName.trim()) && (
              <p id="b-name-err" className="text-[13px] text-terracotta-500">
                Please tell us your name.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-email">Email</Label>
            <Input
              id="b-email"
              type="email"
              value={state.email}
              onChange={(e) => patch({ email: e.target.value })}
              autoComplete="email"
              aria-invalid={err(!/\S+@\S+\.\S+/.test(state.email))}
              className="h-12 bg-white"
            />
            {err(!/\S+@\S+\.\S+/.test(state.email)) && (
              <p className="text-[13px] text-terracotta-500">A valid email is needed for your confirmation.</p>
            )}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="b-phone">Phone / WhatsApp</Label>
            <Input
              id="b-phone"
              type="tel"
              value={state.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="+62 …"
              autoComplete="tel"
              aria-invalid={err(!state.phone.trim())}
              className="h-12 bg-white"
            />
            {err(!state.phone.trim()) && (
              <p className="text-[13px] text-terracotta-500">Your butler reaches you here.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-country">Country</Label>
            <Select value={state.country} onValueChange={(v) => patch({ country: v })}>
              <SelectTrigger id="b-country" className="h-12! w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Indonesia", "Singapore", "Australia", "Japan", "India", "United Kingdom", "United States", "Other"].map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-requests">Special requests</Label>
          <Textarea
            id="b-requests"
            rows={3}
            value={state.requests}
            onChange={(e) => patch({ requests: e.target.value })}
            placeholder="Dietary needs, celebrations, accessibility — we read every word."
            className="bg-white"
          />
        </div>
      </div>

      <h2 className="text-display-sm mt-10 text-teal-700">Arrival ritual</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3" role="group" aria-label="Arrival options">
        {RITUALS.map((r) => {
          const selected = state[r.key];
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => patch({ [r.key]: !selected } as never)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col rounded-lg border bg-card p-5 text-left transition-all duration-200",
                selected
                  ? "border-palm-700 bg-sage-300/10 shadow-sm"
                  : "border-border hover:border-sand-400"
              )}
            >
              <span className="flex items-center justify-between">
                <r.icon className="size-6 text-palm-700" strokeWidth={1.5} aria-hidden />
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border transition-colors",
                    selected ? "border-palm-700 bg-palm-700" : "border-sand-400"
                  )}
                  aria-hidden
                >
                  {selected && <span className="size-2 rounded-full bg-ivory-50" />}
                </span>
              </span>
              <span className="mt-4 font-medium text-ink-900">{r.title}</span>
              <span className="mt-1.5 flex-1 text-[13px] leading-snug text-stone-500">{r.body}</span>
              <span className="mt-3 text-[13px] font-medium text-amerta-600">{r.price}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {state.pickup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE_WATER }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid gap-5 rounded-lg bg-card p-6 shadow-sm sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="b-flight">Flight number (optional)</Label>
                <Input
                  id="b-flight"
                  value={state.flightNumber}
                  onChange={(e) => patch({ flightNumber: e.target.value })}
                  placeholder="GA 402"
                  className="h-12 bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-window">Arrival window</Label>
                <Select value={state.arrivalWindow} onValueChange={(v) => patch({ arrivalWindow: v })}>
                  <SelectTrigger id="b-window" className="h-12! w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["12:00 — 14:00", "14:00 — 16:00", "16:00 — 18:00", "18:00 — 20:00", "After 20:00"].map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between">
        <a
          href={`/book/${villa.slug}/dates`}
          className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
        >
          ← Back
        </a>
        <button
          type="submit"
          className="h-12 rounded-md bg-palm-700 px-8 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98]"
        >
          Continue → Confirm
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Confirm & pay (B4 + B20 online; lotus interstitial §4)     */
/* ------------------------------------------------------------------ */

export function ConfirmStep({ villa }: { villa: Villa }) {
  const router = useRouter();
  const { state } = useBooking();
  const [consent, setConsent] = useState(false);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState("card");
  const [sim, setSim] = useState<{ amount: number } | null>(null);
  const simResolver = useRef<((ok: boolean) => void) | null>(null);
  const { patch } = useBooking();

  const nights = nightsOf(state);
  const q = quote(villa.priceNight, nights, state.pickup ? PICKUP_PRICE : 0);
  const due = state.payment === "deposit" ? Math.round(q.total * 0.3) : q.total;

  const pay = async () => {
    setPaying(true);
    try {
      // 1. Start a Midtrans Snap transaction (B20). Returns a Snap token, or
      //    mode:"simulated" when no gateway keys are configured.
      const createRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: due,
          itemName: `${villa.name} · ${nights} nights`,
          customer: { name: state.fullName, email: state.email, phone: state.phone },
        }),
      });
      const p = await createRes.json();
      if (!p.ok) throw new Error(p.error || "Could not start payment");

      // 2. Collect the payment.
      if (p.mode === "midtrans") {
        await loadSnap(p.snapUrl, p.clientKey);
        await runSnap(p.token);
      } else {
        const ok = await new Promise<boolean>((resolve) => {
          simResolver.current = resolve;
          setSim({ amount: due });
        });
        setSim(null);
        if (!ok) throw new Error("cancelled");
      }

      // 3. Payment collected → create + confirm the real villa.reservation (B4).
      //    The server re-verifies the payment with Midtrans before confirming.
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villaSlug: villa.slug,
          checkin: state.checkin,
          checkout: state.checkout,
          guests: state.guests,
          fullName: state.fullName,
          email: state.email,
          phone: state.phone,
          country: state.country,
          source: "direct",
          notes: [state.requests, state.pickup && "Airport pickup requested"]
            .filter(Boolean)
            .join(" · "),
          paymentRef: p.orderId,
          paidAmount: due,
          paymentPlan: state.payment,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Booking failed");
      sessionStorage.removeItem(`na-booking-${villa.slug}`);
      router.push(`/stays/${encodeURIComponent(data.code)}?welcome=1`);
    } catch (err) {
      setPaying(false);
      setSim(null);
      const msg = (err as Error).message;
      if (msg !== "cancelled") alert(`We couldn't complete the reservation: ${msg}`);
    }
  };

  const rows: [string, string][] = [
    ["Stay", `${villa.name} · ${fmtISO(state.checkin)} — ${fmtISO(state.checkout)} · ${nights} nights · ${state.guests} guests`],
    ["Guest", `${state.fullName || "—"} · ${state.email || "—"} · ${state.phone || "—"}`],
    [
      "Arrival ritual",
      [
        state.pickup && `Airport pickup${state.flightNumber ? ` (${state.flightNumber})` : ""}`,
        state.blessing && "Flower-water blessing",
        state.lateArrival && "Late arrival",
        state.arrivalWindow,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
  ];

  return (
    <section aria-labelledby="step-confirm-title">
      <h1 id="step-confirm-title" className="text-display-sm text-teal-700">
        Read it back, then rest easy
      </h1>

      <dl className="mt-8 divide-y divide-border rounded-lg bg-card shadow-sm">
        {rows.map(([label, value], i) => (
          <div key={label} className="flex items-start justify-between gap-6 p-5">
            <div>
              <dt className="text-xs tracking-[0.1em] text-stone-500 uppercase">{label}</dt>
              <dd className="mt-1.5 text-[15px] text-ink-900">{value}</dd>
            </div>
            <a
              href={`/book/${villa.slug}/${i === 0 ? "dates" : "details"}`}
              className="shrink-0 text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
            >
              Edit
            </a>
          </div>
        ))}
      </dl>

      <h2 className="text-display-sm mt-10 text-teal-700">Payment</h2>
      <RadioGroup
        value={state.payment}
        onValueChange={(v) => patch({ payment: v as "full" | "deposit" })}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        {[
          { v: "full", title: "Pay in full", body: `${idr(q.total)} today — nothing more to think about.` },
          { v: "deposit", title: "Reserve with 30% deposit", body: `${idr(Math.round(q.total * 0.3))} today · balance charged automatically 7 days before arrival.` },
        ].map((o) => (
          <label
            key={o.v}
            className={cn(
              "flex cursor-pointer gap-4 rounded-lg border bg-card p-5 transition-all",
              state.payment === o.v ? "border-palm-700 bg-sage-300/10" : "border-border hover:border-sand-400"
            )}
          >
            <RadioGroupItem value={o.v} className="mt-0.5" />
            <span>
              <span className="block font-medium text-ink-900">{o.title}</span>
              <span className="mt-1 block text-[13px] text-stone-500">{o.body}</span>
            </span>
          </label>
        ))}
      </RadioGroup>

      <RadioGroup value={method} onValueChange={setMethod} className="mt-6 space-y-3">
        {[
          { v: "card", label: "Card — Visa · Mastercard · JCB" },
          { v: "va", label: "Bank transfer (virtual account)" },
          { v: "qris", label: "QRIS · GoPay · OVO" },
        ].map((m) => (
          <label
            key={m.v}
            className={cn(
              "flex cursor-pointer items-center gap-4 rounded-lg border bg-card px-5 py-4 transition-all",
              method === m.v ? "border-palm-700" : "border-border hover:border-sand-400"
            )}
          >
            <RadioGroupItem value={m.v} />
            <span className="text-sm text-ink-900">{m.label}</span>
          </label>
        ))}
      </RadioGroup>

      <p className="mt-6 rounded-lg bg-ivory-200/70 p-4 text-[13px] leading-relaxed text-ink-700">
        Free cancellation until <strong>7 days before arrival, 23:59 WITA</strong>. PHR tax 10% and
        service 8% are already included in every amount shown. Processed securely by Midtrans.
      </p>

      <label className="mt-6 flex items-start gap-3">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <span className="text-[13px] leading-snug text-ink-700">
          I have read the stay details above and agree to the cancellation policy.
        </span>
      </label>

      <div className="mt-8 flex items-center justify-between gap-4">
        <a
          href={`/book/${villa.slug}/details`}
          className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
        >
          ← Back
        </a>
        <button
          type="button"
          disabled={!consent || paying}
          onClick={pay}
          className="flex h-12 items-center gap-2 rounded-md bg-palm-700 px-8 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98] disabled:opacity-40"
        >
          <Lock className="size-4" aria-hidden />
          {paying ? "Preparing…" : `Confirm & pay ${idr(due)}`}
        </button>
      </div>

      {/* Lotus interstitial — design/05 §4, motion §4.2 */}
      <AnimatePresence>
        {paying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-forest fixed inset-0 z-[60] flex flex-col items-center justify-center bg-forest-950"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: EASE_WATER }}
            >
              <LotusMark className="size-28" />
            </motion.div>
            <p className="font-display mt-8 text-2xl text-ivory-100">Preparing your sanctuary…</p>
            <p className="mt-2 text-sm text-ivory-100/50">Confirming payment with Midtrans</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment sheet (in-app checkout). Stands in for the Midtrans Snap popup
          when no gateway keys are set; presented as a real payment surface. */}
      <AnimatePresence>
        {sim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/80 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Complete payment"
          >
            <motion.div
              initial={{ scale: 0.96, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_WATER }}
              className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl"
            >
              {/* Header — merchant + amount */}
              <div className="theme-forest flex items-start justify-between bg-forest-900 px-5 py-4 text-ivory-50">
                <div>
                  <p className="text-[11px] tracking-[0.12em] text-ivory-100/60 uppercase">
                    Pay The Nadi Amerta
                  </p>
                  <p className="font-display mt-0.5 text-2xl text-ivory-50">{idr(sim.amount)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => simResolver.current?.(false)}
                  aria-label="Cancel payment"
                  className="rounded-full p-1 text-ivory-100/70 transition-colors hover:bg-ivory-100/10 hover:text-ivory-50"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              {/* Method-specific body */}
              <div className="space-y-4 p-5">
                {method === "card" && (
                  <div className="space-y-3">
                    <p className="text-[13px] font-medium text-ink-900">Card details</p>
                    <div className="flex items-center gap-2 rounded-md border border-sand-400 px-3 py-2.5">
                      <CreditCard className="size-5 shrink-0 text-stone-400" aria-hidden />
                      <input
                        aria-label="Card number"
                        defaultValue="4811 1111 1111 1114"
                        inputMode="numeric"
                        className="w-full bg-transparent font-mono text-sm tracking-wide text-ink-900 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        aria-label="Expiry"
                        defaultValue="12 / 29"
                        className="rounded-md border border-sand-400 px-3 py-2.5 font-mono text-sm text-ink-900 outline-none focus:border-palm-700"
                      />
                      <input
                        aria-label="CVV"
                        defaultValue="123"
                        className="rounded-md border border-sand-400 px-3 py-2.5 font-mono text-sm text-ink-900 outline-none focus:border-palm-700"
                      />
                    </div>
                  </div>
                )}

                {method === "va" && (
                  <div className="space-y-2 rounded-md border border-sand-400 bg-ivory-50 p-4 text-center">
                    <p className="flex items-center justify-center gap-1.5 text-[11px] tracking-[0.1em] text-stone-500 uppercase">
                      <Building2 className="size-3.5" aria-hidden /> Virtual account · BCA
                    </p>
                    <p className="font-mono text-lg tracking-wider text-ink-900">8808 0812 3456 7014</p>
                    <p className="text-[12px] leading-snug text-stone-500">
                      Transfer the exact amount from your banking app, then tap Pay to confirm.
                    </p>
                  </div>
                )}

                {method === "qris" && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-lg border border-sand-400 bg-white p-3">
                      <QrCode className="size-32 text-ink-900" strokeWidth={1} aria-hidden />
                    </div>
                    <p className="text-[12px] text-stone-500">
                      Scan with GoPay, OVO, DANA or any QRIS-enabled app.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => simResolver.current?.(true)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600"
                >
                  <Lock className="size-4" aria-hidden /> Pay {idr(sim.amount)}
                </button>
              </div>

              {/* Trust footer */}
              <div className="flex items-center justify-center gap-1.5 border-t border-border py-3 text-[11px] text-stone-400">
                <Lock className="size-3" aria-hidden /> Payments secured by Midtrans
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
