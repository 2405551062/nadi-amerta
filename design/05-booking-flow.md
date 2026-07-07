# Nadi Amerta — Booking Flow & Confirmation

Reference render: `assets/tirta-booking-flow.png`. Route: `/book/[slug]` — a **focused flow**: navbar
reduces to wordmark + `× Return to villa` (state-preserving). Three steps, one URL each
(`/book/[slug]/dates|details|confirm`) so back/refresh never lose work. Draft persists server-side
(Odoo draft folio §09) + `sessionStorage`.

---

## 0. Flow chrome

- **Stepper**: `Dates · Details · Confirm` centered under nav — three 24px circles joined by a 2px sand hairline; completed = palm fill + ivory check (150ms pop); current = palm ring + gold dot; the hairline **fills with `amerta-400` continuously** left→right per step (the "Amerta thread", motion §2.6). Steps are links when previously completed.
- **Layout**: 12-col — form column 7 cols left; **Booking summary card** (components §5) 5 cols right, sticky. Mobile: summary collapses to a top accordion bar (`Villa Tirta · 4 nights · IDR 40,120,000 ⌄`) that expands as a sheet.
- Step content transitions horizontally (forward from right / back from left, 400ms `ease-water`).

## 1. Step — Dates (skipped if arriving from a resolved villa-detail selection)

Full-width availability calendar (components §4) with price hints; guests stepper; children/infants steppers with 12px policy note; rate options if multiple (Flexible vs Non-refundable −10%) as radio cards showing the delta in mono. Summary card updates live (`layout` + count-up). CTA `Continue → Details`.

## 2. Step — Details

**Guest details** (serif group heading): full name, email, phone (+62 default), country Select, special requests textarea with helper "Dietary needs, celebrations, accessibility — we read every word."
Signed-out users see a quiet strip above the form: `Have an account? Sign in — or continue as guest` (inline OTP if chosen; guest checkout creates the account from the booking).

**Arrival Ritual** (the flow's signature section): three selectable option cards — Airport pickup (+IDR 650,000) · Flower-blessing welcome (included) · Late arrival after 20:00 (free note) — radio/checkbox cards: radius 12 hairline; selected = `border-palm-700` + sage-tinted bg + check pop; price deltas append to summary instantly.

**Arrival time** Select (windows) + flight number (optional, revealed only if Airport pickup selected — progressive disclosure).

CTA row: `← Back` tertiary + `Continue → Confirm`. Validation on blur; on submit scroll-to-first-error.

## 3. Step — Confirm & Pay

Read-back sections, each with quiet `Edit` links jumping to the owning step: Stay (villa, dates, guests) · Guest · Arrival ritual. Then **Payment**:
- Options as radio cards: **Pay in full** · **Reserve with 30% deposit** (balance auto-charged 7 days before arrival — date stated explicitly) — deposit math shown in mono.
- Method: Midtrans Snap (cards, VA transfer, QRIS, GoPay/OVO) — logos row 40% opacity; card fields via Snap embed styled to input spec; QRIS/VA render instructions inline with mono account numbers + copy buttons.
- Policy block 13px: cancellation terms restated with concrete dates ("Free cancellation until **Aug 5, 23:59 WITA**"), PHR & service already included line.
- Consent checkbox → enables primary full-width `Confirm & pay IDR 40,120,000` (amount **in the button** — no surprises). Lock icon caption.

## 4. Payment states

| State | Treatment |
|---|---|
| Processing | Button pending-spinner ≤ 600ms; longer → the **lotus interstitial** (motion §4.2): forest screen, seal self-draws, "Preparing your sanctuary…" — cancels into error state if gateway fails |
| Soft fail (declined) | Return to Confirm intact; inline alert (error variant): "Your bank declined the charge. Nothing was booked, nothing was charged." + `Try another method` focused. Never a toast for money errors |
| Hard fail (availability lost) | Dialog: "These dates were just taken." + nearest-alternative date chips + `Choose new dates` → Step 1 with everything else preserved |
| Pending VA/QRIS | Confirmation page renders in `Awaiting payment` state with countdown-to-expiry (quiet, mono) + instructions; auto-flips to Confirmed via webhook + polling |

## 5. Reservation Confirmation — `/stays/[code]` (post-payment redirect)

### Layout
The exhale after checkout — hybrid emotional/functional:
1. **Hero band (forest)**: seal completes its draw → serif `display-lg` ivory "Your sanctuary is reserved." → booking code chip `NA-2608-TIR` (mono, copy-on-click) fades in. Confetti is banned; a single slow gold hairline sweeps once beneath the headline.
2. **Stay card (ivory)**: arch-masked villa photo (page's single arch), villa name serif, date range + nights, guests, `Add to calendar` (ICS) + `Apple/Google Wallet` buttons, WhatsApp concierge deep link.
3. **"Before you arrive" timeline**: the same gold journey timeline used in the portal (booked ✓ → balance date → pickup details → check-in 14:00) — teaches the portal metaphor immediately.
4. **Receipt accordion**: full line items mono, `Download invoice (PDF)` — served from Odoo (§09).
5. Cross-sell strip: 2 experience cards ("Reserve a riverside dinner") — soft, after everything functional.

Email + WhatsApp confirmation dispatched in parallel (transactional templates mirror this hierarchy).

### Journey & decisions
Post-payment anxiety is answered in order: *did it work → what did I buy → what happens next → proof*. The page is addressable (`/stays/[code]`) and doubles as the guest's pre-arrival hub when revisited — no orphan "thank you" page.

### Motion
Single entrance choreography (seal → headline → code → card rise, total 1.8s, skipped under reduced-motion); timeline dots pop staggered on scroll; wallet buttons Lift.
