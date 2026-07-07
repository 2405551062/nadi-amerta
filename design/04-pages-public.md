# Nadi Amerta — Public Pages Specification

Routes are Next.js App Router paths. Reference renders: `assets/exploration-A-sanctuary.png`,
`assets/exploration-B-gallery.png`, `assets/tirta-villa-detail.png`, `assets/tirta-mobile-home.png`.

---

## 1. Landing — `/`

### Layout
1. **Hero (100svh, forest world)** — full-bleed dawn photograph/looping 8s video of the gorge pool (muted, `poster` fallback). Overlay recipe from foundations §5. Transparent navbar. Centered stack: eyebrow `UBUD · BALI`, `display-xl` headline *"Where flowing waters meet **sacred** ground"* (one italic word), 18px ivory/80 subline. Bottom-anchored **glass booking bar** (880px): Check-in ｜ Check-out ｜ Guests ｜ primary `Search` — the only conversion element above the fold. Scroll cue: 1px gold vertical line 48px, breathing opacity.
2. **Introduction (ivory)** — py-160. 12-col: eyebrow + `display-md` "Eight villas. One river. Nothing else for miles." in cols 2–7; 68ch body + tertiary link cols 8–11. First scroll-reveal.
3. **Villa collection** — header row (title + `View all villas →`). Desktop: 3 villa cards + a 4th peeking 15% beyond the container edge (scroll affordance); drag-scrollable. Mobile: swipe carousel with snap.
4. **Experience band (forest world)** — full-bleed parallax image, py-160. Three "movements" (Arrival · Stay · Farewell) as roman-numeraled columns, thin-line icons, ivory text, gold numerals.
5. **The story** — asymmetric editorial: 3:4 portrait photo with **arch mask** (the page's single arch) left; right: eyebrow `TRI HITA KARANA`, `display-md`, 2 paragraphs, signature image of founders.
6. **Reviews** — 3 review cards, ivory-50 band; aggregate line "4.9 · from 312 stays" with single gold star.
7. **Journal teaser** — 3 editorial cards (image 16:9, date, serif title).
8. **Pre-footer CTA (forest)** — serif `display-lg` "The river is waiting." + primary `Reserve Your Stay` + ghost `Speak with us`. Footer per components §8.

### User journey
Dreamer lands (Instagram/press) → emotional hero sets place & price register → validates via villas + reviews → either books dates immediately (hero bar → `/villas?dates`) or explores a villa (card → `/villas/[slug]`). Secondary: returning guest → `Sign in`.

### Design decisions
- Booking bar lives *in the hero*, not the nav — conversion without breaking the cinematic register (Aman never shows a widget; we're a booking product, so we marry both).
- The 4th peeking card converts a static grid into an invitation to explore — measurable scroll-through to search.
- Dark→light→dark sandwich gives jurors three distinct folds to screenshot.

### Interaction & motion
Dawn entrance (motion §2.2) → Rise reveals per section → Current parallax on bands 4/5 → villa-card Lift + shared-element into detail. Booking bar fields open the range calendar popover (components §4); selecting dates pre-fills guests=2 and enables Search with a subtle 1.02 pulse once.

### Implementation notes
`<section>` landmarks with `aria-label`; hero headline is `<h1>` HTML text (LCP-safe); video `prefers-reduced-motion` → poster; booking bar is a client island, rest is RSC; images `next/image` with `sizes`, hero `priority`.

---

## 2. Villa Search — `/villas`

### Layout
Ivory app-register page, solid navbar. Header row: `display-lg` "The villas" + result count 13px stone (`Showing all 8 villas` / `5 available for Aug 12–16`). **Filter bar** (sticky under nav, glass on scroll): date-range field, guests stepper, view Select (River · Rice paddy · Garden), bedrooms segmented control 1/2/3+, price range popover with dual-thumb slider (mono labels), `Clear all` tertiary appears when filters active. Grid: 3-col villa cards (gap-32) → 2-col md → 1-col mobile. No map view — 8 villas on one property; a site-plan illustration modal (`View estate plan`) replaces it. Footer slim.

### User journey
Arrives with dates from hero bar (filters pre-applied, availability resolved server-side) or blank browsing. Filter → instant grid update → card → detail. Dead end (no availability): empty state offers ±3-day shifted alternatives as chips.

### Design decisions
- With 8 units, search UX is *curation*, not filtering power — filters are few, large, and pleasurable; the slider popover keeps the bar quiet.
- Unavailable villas remain visible when dates are set — greyed with `Unavailable for these dates · Next open Sep 2` — inventory scarcity sells and prevents pogo-sticking.

### Interaction & motion
Filter changes animate the grid with FLIP reorder (`AnimatePresence` + `layout`, 400ms `ease-water`); removed cards fade+scale .96, entering rise 16px. URL is source of truth (`?checkin&checkout&guests&view&br&min&max`) — sharable, back-safe. Skeleton grid of 6 on load. Card count text crossfades.

### Implementation notes
Server component fetches availability (Odoo §09) keyed by search params; filter bar client island pushes `router.replace` with `useOptimistic` grid. Cards prefetch detail routes on hover/viewport.

---

## 3. Villa Detail — `/villas/[slug]` (`assets/tirta-villa-detail.png`)

### Layout
1. **Gallery mosaic** (below solid nav): desktop 2:1 asymmetric — hero image 60% (shared-element target) + 2 stacked tiles right, second tile arch-masked (the page's arch), `View all 24 photos` chip bottom-right → full-screen lightbox (arrow/swipe, thumbnail rail, counter). Mobile: edge-to-edge 4:5 swipe gallery with dots + counter chip.
2. **Two-column body**: LEFT (7 cols): eyebrow `RIVERSIDE COLLECTION`, `display-lg` villa name, facts row (icons 20px: guests · bedrooms · m² · pool size), 68ch narrative "The space", amenity grid (2×N, 15px + thin icons, `Show all 32` expands in place), "Where you wake" — estate-plan snippet, house rituals list (check-in 14:00, Nyepi note). RIGHT (5 cols, sticky top-88): **Booking card** (components §5) — price/night serif, date-range field opening the availability calendar with price hints, guest stepper, primary `Reserve`, fee preview lines (nightly × n, PHR 10%, service 8%), total, `Free cancellation before 7 days` caption, `You won't be charged yet` 12px stone.
3. **Reviews** — aggregate + 4 cards + `Read all`.
4. **"Your days here"** — horizontal editorial scroller of experience cards (spa, chef, gorge trek) — cross-sell into Services later.
5. **Comparison strip** — "Other villas along the river": 3 villa cards.
6. Pre-footer CTA (forest, compressed py-96).

### User journey
Card click → shared-element gallery continuity → scan facts → gallery dive (lightbox) → narrative scroll while the booking card follows → date selection reveals live total → `Reserve` → `/book/[slug]?dates`. Mobile: booking card becomes a **bottom dock bar** (h-72: price + `Reserve`) expanding to a full sheet on tap.

### Design decisions
- Sticky card keeps price honest during the emotional scroll — the Airbnb pattern executed at Aman fidelity (hairline gold top border, serif totals, no urgency-red anywhere).
- Fee lines shown *before* checkout builds the trust register of Stripe-era commerce; Indonesian taxes are explained in a tooltip, not hidden.
- Scarcity is quiet: `Two August weekends remain` as a 13px sage line above the calendar — never countdown timers.

### Interaction & motion
Shared-element hero (motion §2.1); mosaic tiles reveal staggered 90ms on load; sticky card fades totals in as dates resolve (`layout` reflow + count-up); lightbox: overlay fade + image `scale .96→1`, arrows keyboard-bound, focus-trapped; amenity expand: grid-rows 350ms.

### Implementation notes
`generateMetadata` per villa (OG image = hero); availability calendar server-fetched per month view, cached 60s; booking card state in URL so `Reserve` deep-links `/book/villa-tirta?checkin=2026-08-12&checkout=2026-08-16&guests=2`.

---

## 4. About — `/about`

Editorial longform, ivory. Hero: `display-lg` over 21:9 estate photograph (Current parallax). Alternating 2-col chapters: *The name* (Nadi Amerta = river of immortal nectar), *Tri Hita Karana* (three-part principle rendered as roman-numeral columns echoing the landing), *The land* (site-plan illustration), *The people* (staff portraits, 3:4, names + roles — real people, no stock), *Stewardship* (banjar & sustainability commitments as a quiet stat row: `12ha preserved · 78% local team · 0 single-use plastics`). Ends in pre-footer CTA. Motion: Rise reveals + parallax only. Journey: trust-building for high-AOV bookers and press; one CTA at end, none mid-page.

## 5. Contact — `/contact`

Split screen. LEFT (forest, 45%): serif "Speak with us", contact rows (WhatsApp — primary channel in Bali, phone, email, address) with thin icons and `amerta-300` hover links, GMT+8 clock line, small static map illustration (custom-styled, not default Google tiles). RIGHT (ivory, 55%): form — name, email, dates (optional range), topic Select (Reservation · Private event · Press · Partnership), message textarea, consent checkbox, primary `Send message`. Success replaces form (fade/rise) with serif "Terima kasih." + "We reply within one day." + lotus mark. Decisions: no chat widget — a WhatsApp deep link matches actual guest behavior. Validation per components §13.

## 6. FAQ — `/faq`

Centered 720px column. `display-lg` "Questions", search input filtering live (highlight matches in amerta-600), category chips (Reservations · Payments · Getting here · During your stay · Nyepi & ceremonies). Accordions (components/motion): question Inter 500 16px, answer 15px/1.7 with 68ch. Deep-linkable `#slug` per item (auto-open + scroll). Empty search: "Nothing here — ask us directly →" contact link. JSON-LD `FAQPage` schema.

## 7. Error pages

- **404** — forest-950 full-screen. Slow-drifting water-line SVG animation (8s loop), serif `display-lg` ivory "This path returns to the river.", 15px "The page you seek has flowed on." + primary `Return home` + tertiary `Browse villas`. No nav; wordmark top-center.
- **500** — same stage, copy "Still waters for a moment." + `Try again` (retry) + WhatsApp link. Error digest 11px mono at 30% for support.
- **Offline/maintenance** — ivory variant with seal, "We are preparing the house." + expected time if known.
- Booking-context errors never use these pages — inline recovery per `05-booking-flow.md` §4.

## 8. Authentication — `/signin`, `/join`, `/reset`

### Layout
Split: LEFT 55% cinematic image panel (rotates seasonally; arch-masked portrait crop on ≥ lg, hidden on mobile) with a review quote at bottom in ivory. RIGHT 45% ivory: wordmark, serif `display-md` "Welcome back" / "Create your account", then:
- **Primary path: email OTP** — single email field + `Continue`; step 2 slides in (motion §2.6 horizontal) with 6-box code input (auto-advance, paste-aware, mono 20px) + "We sent a code to a•••@gmail.com" + resend countdown 30s.
- Divider "or" → Google button (secondary style, 20px logo).
- Guest checkout is never blocked by auth: booking flow offers "Continue as guest — we'll create your account from your booking" (see 05 §2).
`/join` adds name field post-OTP; `/reset` is absorbed by OTP (passwordless — no password to reset; legacy password users get OTP migration copy).

### Decisions
Passwordless-first cuts the highest-friction step for a 1–4×/year purchase frequency product; the image panel keeps the brand promise during a utility task.

### Motion
Panel image slow Ken Burns (12s); form card rises on mount; step transition horizontal slide; OTP boxes tick-fill; error shake ±4px once on wrong code (with text, not color-only).

### Implementation
NextAuth (email OTP + Google) against Odoo `res.partner` (§09); rate-limit + `aria-live` for code errors; `autocomplete="one-time-code"`.
