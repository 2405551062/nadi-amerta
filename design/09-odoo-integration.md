# Nadi Amerta — Odoo Integration Contract (UI ↔ Backend)

The frontend is a Next.js BFF (route handlers under `/api/*`) talking to **Odoo 17+** via JSON-RPC
(`/web/dataset/call_kw`) or REST module. The UI never calls Odoo directly from the browser — the BFF
maps Odoo models to the view models below, hides Odoo auth, and caches read-heavy endpoints.

## 1. Odoo module mapping

| Domain | Odoo app/model | Notes |
|---|---|---|
| Villas | `product.template` (service, per-night) + custom `villa.unit` | photos via `ir.attachment`; amenities as tags |
| Availability & bookings | **`villa.reservation` (custom model, per ERD)** — partner_id, product_id (villa), sale_order_id, check_in_date, check_out_date, state, notes | one reservation per stay linked to one `sale.order` (nights + services + F&B lines); draft state = flow-in-progress; availability = no overlapping non-cancelled reservation |
| Rates & seasons | `product.pricelist` (+ seasonal rules) | price hints in calendar read from pricelist API |
| Guests/auth | `res.partner` (+ portal users) | preferences = custom fields `x_dietary`, `x_pillow`, `x_arrival_drink` |
| Payments | `account.payment` + Midtrans acquirer module | webhook → BFF → revalidate stay page |
| Invoices | `account.move` | PDF via Odoo report engine, streamed through BFF |
| Services/experiences | `product.product` (service category) added as folio lines | slot capacity via custom `service.slot` |
| Restaurant | `pos.order` bound to folio, or `sale.order` section | menu = `product.product` with `x_dietary_glyphs` |
| Housekeeping | custom `housekeeping.task` + villa status field on `villa.unit` | statuses: dirty/cleaning/inspection/ready |
| Staff roles | `res.groups` (GM, FO, Housekeeping, Finance) | JWT claims mirror groups; route guards per console |
| Finance dashboards | `account.move.line` aggregates + `hr.payroll` summaries | PHR 10% & service 8% as taxes on order lines |
| Taxes | `account.tax`: `PHR 10%` price-excluded, `Service 8%` | UI always displays both as separate lines |

## 2. BFF endpoints consumed by the UI

```
GET  /api/villas?checkin&checkout&guests&view&br      → VillaCard[] (+availability flags)
GET  /api/villas/[slug]                                → VillaDetail (gallery, amenities, rituals)
GET  /api/villas/[slug]/calendar?month                 → { day, available, price, minStay, closedReason? }[]
POST /api/reservations/draft                           → create/update draft villa.reservation + sale.order (step autosave)
POST /api/reservations/[id]/confirm                    → returns Midtrans Snap token | VA/QRIS payload
POST /api/webhooks/midtrans                            → payment status → villa.reservation.state (idempotent)
GET  /api/stays?scope=upcoming|past|cancelled          → StayCard[]
GET  /api/stays/[code]                                 → Stay + timeline + folio lines
POST /api/stays/[code]/cancel                          → policy engine returns refund quote first (two-step)
GET  /api/invoices / [id]/pdf                          → list + streamed PDF
GET  /api/services?stay=[code] · POST /api/services/book
GET  /api/dining/menu · POST /api/dining/orders · GET /api/dining/orders/[id]/status
GET  /api/ops/kpis?range · /api/ops/arrivals?date · /api/ops/villa-status (SSE)
POST /api/ops/checkin/[folio] · /api/ops/housekeeping/tasks/[id]/advance
GET  /api/ops/finance/ledger?filters · /api/ops/finance/reconciliation
```

## 3. UI state rules bound to backend truths

- **Availability is only trusted at confirm time** — the flow re-validates on entering step Confirm; the "dates just taken" dialog (05 §4) is driven by that check, not the initial search.
- **Draft folios expire after 30 min** — expiry surfaces as a quiet inline note with one-click refresh of held dates, never silent loss of form data (guest fields persist client-side).
- **Prices always arrive computed from Odoo** (pricelist + taxes); the UI never multiplies nightly × n itself except for optimistic display, reconciled on response (count-up animates any correction).
- **Villa status (ops) is push-first**: SSE topic per villa; UIs reconcile with a 30s poll fallback. Status transitions are optimistic with rollback pulse on rejection.
- **Nyepi/closure days** come from a `resource.calendar.leaves`-backed closure list — the calendar tooltip copy lives in the CMS field, not hardcoded.
- **Idempotency keys** on booking confirm & dining orders (retry-safe primary buttons).
- Locale: BFF returns amounts as integer IDR; formatting (thousands separators, `8.5M` shorthand) is a frontend concern with the a11y label rule (08 §3).

## 4. Suggested build order (for the implementing agent)

1. Foundations: tokens → shadcn theme → shared shell components (nav, footer, buttons, inputs).
2. Landing + villa search + villa detail against read-only villa/calendar endpoints.
3. Booking flow with draft folio + Midtrans sandbox; confirmation page.
4. Guest portal (stays, invoices, profile), then services + dining.
5. Ops shell + reception board, housekeeping, admin KPIs, finance.
6. Motion pass (signature moves), a11y CI gates, performance budget audit.
