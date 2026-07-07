# Nadi Amerta — UI/UX Design Specification

Complete, implementation-ready design package for the **Nadi Amerta Villa** luxury reservation
platform (Ubud, Bali). Guest web + booking flow + guest portal + four staff consoles.

- **Direction:** "Tirta" — cinematic sanctuary hero, editorial ivory body, the Balinese arch as a
  once-per-page signature. Quiet luxury: Aman restraint · Apple precision · Stripe form polish.
- **Target stack:** Next.js (App Router) · TailwindCSS v4 · shadcn/ui · Framer Motion · Odoo backend.
- **Concept renders:** generated & critiqued via Higgsfield — see `assets/` and the exploration
  record in `00-creative-direction.md`.

## Reading order

| # | File | What it defines |
|---|---|---|
| 00 | [00-creative-direction.md](00-creative-direction.md) | Explorations, critique, chosen direction, quality checklist |
| 01 | [01-foundations.md](01-foundations.md) | Color, typography, spacing, elevation, Tailwind v4 tokens |
| 02 | [02-motion.md](02-motion.md) | Motion tokens, signature moves, component motion, reduced-motion |
| 03 | [03-components.md](03-components.md) | Full component library with shadcn/ui mapping |
| 04 | [04-pages-public.md](04-pages-public.md) | Landing, search, villa detail, about, contact, FAQ, errors, auth |
| 05 | [05-booking-flow.md](05-booking-flow.md) | Three-step booking, payment states, confirmation |
| 06 | [06-guest-portal.md](06-guest-portal.md) | Dashboard, profile, history, invoices, services, dining |
| 07 | [07-staff-consoles.md](07-staff-consoles.md) | Admin, reception, housekeeping, finance dashboards |
| 08 | [08-accessibility.md](08-accessibility.md) | WCAG 2.2 AA contract + CI test matrix |
| 09 | [09-odoo-integration.md](09-odoo-integration.md) | Screen ↔ Odoo model/endpoint contract + build order |

## Non-negotiables (the five filters)

1. One hero moment per screen. 2. Gold ≤ 5% of any viewport. 3. Motion is water — no bounce.
4. Two surface worlds only (ink-on-ivory, ivory-on-forest). 5. The arch appears once per page, maximum.
