# Nadi Amerta — Creative Direction & Exploration Record

**Product:** Luxury villa reservation platform, Ubud, Bali · Guest web + staff consoles
**Benchmark set:** Aman Resorts · Airbnb Luxe · Four Seasons Bali · Ritz-Carlton Reserve · Apple · Linear · Stripe
**Goal:** Awwwards Site-of-the-Day quality. Backend: Odoo. Frontend: Next.js + Tailwind v4 + shadcn/ui.

---

## 1. Explorations (Higgsfield, Round 1)

Three deliberately divergent directions were generated and critiqued before choosing.

### A — "The Sanctuary" · `assets/exploration-A-sanctuary.png`
Aman-style cinematic minimalism: full-bleed dawn photograph of the gorge, centered serif statement, glass booking bar.

- ✅ Strongest emotional first impression; the glass booking bar over photography is the right conversion surface; nav restraint is perfect.
- ❌ ALL-CAPS serif headline reads "hotel template," not editorial; centered-everything gets monotonous past the fold; no system for content-dense pages.

### B — "The Gallery" · `assets/exploration-B-gallery.png`
Apple/Linear editorial precision on warm ivory: asymmetric type-vs-image hero, villa card row with serif names and gold prices.

- ✅ Best body-content system: editorial grid, impeccable hierarchy, villa card metadata treatment (serif name / gold price / dot-separated facts) is exactly right.
- ❌ Least emotional of the three; warm-white hero alone will not stop a juror's scroll; feels like a very good SaaS marketing site wearing a resort's clothes.

### C — "The Ritual" · `assets/exploration-C-ritual.png`
Balinese modernism: candi-bentar arch as image frame, sand gradients, arched villa cards.

- ✅ The arch mask is the only *ownable* visual signature of the three — nobody else in the benchmark set has it.
- ❌ Gold surface area far too high (reads "spa brochure"); symmetric layout is static; decorative stone icons cheapen it. Fails the "quiet luxury" test as a whole system.

## 2. Decision — "Tirta" (synthesis)

> **Cinematic sanctuary hero (A) + editorial ivory body (B) + the arch as a once-per-page signature (C).**

Ratio: darkness for emotion, ivory for information. Marketing pages open in the forest-dark cinematic world and resolve into ivory editorial content. App surfaces (booking, portal, staff) live almost entirely in ivory with forest reserved for the sidebar/hero bands. Gold is capped at hairlines, one accent word, deltas, and prices.

## 3. Validation (Higgsfield, Round 2 — the chosen direction across the product)

| Screen | Asset | Verdict & corrections carried into the spec |
|---|---|---|
| Villa detail | `assets/tirta-villa-detail.png` | Booking card (price/dates/stepper/fees/cancellation) approved as rendered. Correction: body columns too narrow → single 68ch column; arch mask limit = one gallery tile. |
| Booking flow | `assets/tirta-booking-flow.png` | Stepper, form, Arrival Ritual cards, PHR/service line items approved. Correction: summary photo circle → arch mask; add floating-label focus states. |
| Guest dashboard | `assets/tirta-guest-dashboard.png` | Dark hero band + glass stay card + "Your journey" gold timeline approved — this is the emotional core of the portal. Correction: service cards get left-aligned editorial layout, not centered circular images. |
| Admin dashboard | `assets/tirta-admin-dashboard.png` | Forest sidebar + serif greeting + hairline KPI cards + sage/gold chart proves staff tools can share the brand. Correction: delta chips need labels (↑ 8 pts), villa grid needs touch targets ≥ 44px. |
| Mobile home | `assets/tirta-mobile-home.png` | Rounded hero, pill search ("When will you arrive?"), swipe cards, gold-dot tab bar approved. Correction: hero text needs stronger scrim at bottom third; star row → single star + numeric rating. |
| Landing (A refined) | `assets/exploration-A-sanctuary.png` | Carried as hero reference with mixed-case headline + one italic word replacing all-caps. |

## 4. Self-critique checkpoints applied to every page spec

1. Would a juror screenshot this fold? If not, redesign the fold.
2. Is gold ≤ 5% of the viewport?
3. Is there exactly one serif display moment on screen?
4. Can the primary task be completed with keyboard only?
5. Does the mobile layout lose *nothing* essential, only density?

## 5. Deliverables index

| File | Contents |
|---|---|
| `01-foundations.md` | Color, type, spacing, elevation, Tailwind v4 tokens |
| `02-motion.md` | Motion tokens, signature moves, component motion, reduced-motion |
| `03-components.md` | Full component library spec (shadcn mapping) |
| `04-pages-public.md` | Landing, search, villa detail, about, contact, FAQ, errors, auth |
| `05-booking-flow.md` | Booking flow, payment, confirmation |
| `06-guest-portal.md` | Dashboard, profile, history, invoices, services, restaurant |
| `07-staff-consoles.md` | Admin, reception, housekeeping, finance dashboards |
| `08-accessibility.md` | WCAG AA implementation contract |
| `09-odoo-integration.md` | Screen-to-Odoo data contract |
| `assets/` | All generated concept renders |
