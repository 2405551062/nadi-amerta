# Nadi Amerta — Guest Portal Specification

Reference render: `assets/tirta-guest-dashboard.png`. Shell: portal navbar (components §6) —
My Stays · Services · Dining · Invoices · Profile; mobile = bottom tab bar. All portal pages are
ivory app-register with `py-12 lg:py-16` rhythm; serif reserved for greetings, card titles and totals.

---

## 1. Guest Dashboard — `/portal`

### Layout
1. **Hero band (forest, h-320)**: cinematic villa dusk photo + overlay; serif `display-md` ivory "Welcome back, Amara". Left-anchored **glass stay card**: `Villa Tirta · Aug 12 — 16`, hairline, countdown "23 days until Bali" (serif 20px), `Manage reservation` link in `amerta-300`. If no upcoming stay: card becomes an invitation — "The river has missed you." + primary `Find your dates` (never an empty state that scolds).
2. **"Your journey" timeline** (right rail desktop / horizontal scroller mobile): gold-dotted vertical timeline — Booked ✓ · Payment ✓ · Arrival ritual planned (current, pulsing gold ring) · Pre-arrival concierge · Check-in. Each node expandable with date + one action link.
3. **Service shortcuts row**: three horizontal service cards (components §5, left-aligned editorial — *not* the centered circular render variant): In-Villa Dining · Spa Rituals · Airport Transfer → deep-link into Services/Dining with the stay pre-selected.
4. **Past stays strip**: compact history cards (photo 64px, villa, dates, `Book again` tertiary) → full history page.

### Journey · decisions · motion
One glance answers "when am I going and what should I do next?" — countdown is the emotional anchor, timeline the functional one; everything else is cross-sell kept below the fold. Motion: hero photo slow Ken Burns; countdown digits crossfade daily; timeline current-node ring pulses 2s; cards Rise-stagger on load.

## 2. Profile — `/portal/profile`

Single 640px column, grouped cards: **Identity** (avatar upload with crop dialog, name, email — email change requires OTP re-verify inline), **Travel details** (phone/WhatsApp, country, language EN/ID toggle), **Preferences** (dietary multi-select chips, pillow/firmness Select, arrival drink radio — copy: "Told once, remembered every stay."), **Household** (companion names/ages for pre-filled bookings), **Danger zone** last: `Sign out everywhere` secondary + `Delete account` tertiary-destructive with typed-confirm dialog. Saves are per-card (`Save` appears only when dirty, sticky at card foot); success = card border flashes sage once + toast. Odoo: `res.partner` + custom preference fields (§09).

## 3. Reservation History — `/portal/stays`

Segmented control `Upcoming · Past · Cancelled` (gold underline slides). Rows as **stay cards**: 96px photo, villa serif 18px, dates + nights, guests, total mono, status badge, chevron → **detail drawer** (right sheet 480px): full timeline, line items, actions contextual to state — Upcoming: `Modify dates` (reopens flow step 1 with change-fee note) · `Add services` · `Cancel` (policy-aware dialog quoting the exact refund + date, per components §9); Past: `Download invoice` · `Book again` (pre-fills flow) · `Leave a review` (inline 5-star + textarea in drawer). Empty Past state: "Your first story is still unwritten." + browse link. Pagination "Load more" (12/page).

## 4. Invoices — `/portal/invoices`

Table (components §11): Invoice # (mono, copy), Stay, Date, Amount (mono right), Status badge (Paid sage · Awaiting amerta · Refunded ocean), row action `PDF ↓`. Filters: year Select + status chips. Row click → drawer with line items (nightly, PHR 10%, service 8%, services/dining folios itemized), payment method + Midtrans ref, `Download PDF` primary. Bulk: select → `Download 3 as ZIP`. PDFs are Odoo-generated (§09) with the brand template (seal watermark 4%, serif totals). Mobile: table becomes stacked cards.

## 5. Additional Services — `/portal/services`

**Catalog** grouped by chapter with serif headers: Wellness (spa rituals, yoga) · Journeys (drivers, gorge trek, temple ceremony) · Occasions (proposals, birthdays, floating breakfast). Cards: 3:2 photo, title serif, duration + price mono, `Reserve`. Card → **detail sheet**: gallery, 68ch description, **slot picker** (date chips from stay window + time slots as radio chips — outside-stay dates disabled with "during your stay" note), quantity/persons stepper, notes field, `Add to my stay — IDR 850,000` primary. Confirmation: toast + the item appears in a **"Planned for your stay"** sticky rail (right desktop / collapsible bottom bar mobile) listing booked services chronologically — effectively an itinerary builder. Billing choice per item: `Pay now` or `Add to villa folio` (settled at checkout — default, luxury-correct). Motion: sheet per components; added item flies (layoutId) from button into itinerary rail.

## 6. Restaurant Ordering — `/portal/dining`

In-villa dining as a serene menu, not a delivery app:
- Header: "The kitchen is open · 06:00 — 22:00" with live state; outside hours the CTA becomes `Schedule for morning`.
- **Menu**: category rail chips (Breakfast · Balinese · Western · Children · Cellar) sticky; items as list rows (not photo-grid): name serif 17px, 13px description, dietary glyphs (leaf = vegan, no-gluten), price mono right, `+` stepper appears on hover/tap. Hero dishes only (≤ 6) get photo cards at top ("From Chef Ketut today").
- **Order sheet** (persistent bottom-right pill `2 items · IDR 640,000` → expands): items with steppers, cutlery toggle, allergy note field, **delivery time**: `As soon as ready (~35 min)` or slot picker; location auto = current villa (in-stay) with confirmation line "To Villa Tirta, riverside deck or dining room?" radio.
- Charge to folio by default; status tracker after ordering: quiet 3-step progress (Received → Kitchen → On its way, ETA mono) with WhatsApp fallback link. Out-of-stay users see the menu read-only with "Available during your stay."
- Odoo: POS/restaurant orders bound to folio (§09). Motion: `+` tick, pill badge count pops, sheet spring-free rise; status steps fill with sage.
