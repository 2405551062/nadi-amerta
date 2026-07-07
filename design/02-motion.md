# Nadi Amerta — Motion System

> Principle: **water, not rubber.** Motion flows downhill — long ease-out entrances, short neutral exits,
> zero overshoot on the guest side. Motion must clarify hierarchy or continuity; decorative motion is cut.
> Library: **Framer Motion** (`motion/react`) + CSS transitions for micro-states.

---

## 1. Tokens

| Token | Value | Use |
|---|---|---|
| `duration-instant` | 100ms | Hover color/border shifts |
| `duration-fast` | 200ms | Buttons, chips, toggles, focus rings |
| `duration-base` | 300ms | Cards, dropdowns, tooltips |
| `duration-slow` | 500ms | Modals, drawers, accordions |
| `duration-cinematic` | 800–1200ms | Hero reveals, page transitions, image scale |
| `ease-water` | `cubic-bezier(0.16, 1, 0.3, 1)` | All entrances & reveals (expo-out) |
| `ease-drift` | `cubic-bezier(0.4, 0, 0.2, 1)` | Micro-interactions, exits |
| `stagger-base` | 70ms | List/grid children (cap total stagger at 480ms) |

**Global rule:** entrances animate `opacity 0→1` + `translateY 24px→0` (or `scale 1.04→1` for images). Exits are opacity-only at half duration. Nothing animates `width`/`height`/`top` — transform and opacity only (compositor-safe).

## 2. Signature moves

### 2.1 Page transition — "Surface"
Route changes: outgoing view fades to 0 over 200ms; incoming view rises `y:24→0, opacity:0→1` over 600ms `ease-water`. On villa detail navigation, the villa card image is a **shared element** (Framer Motion `layoutId="villa-{id}"`) that expands into the detail hero — the single most memorable transition in the product.

### 2.2 Hero entrance — "Dawn"
On landing load, sequenced once (no replay): image scales 1.06→1 over 1200ms while the overlay lightens; eyebrow fades up at 200ms; headline lines reveal via `clip-path: inset(0 0 100% 0 → 0)` per line, staggered 90ms, starting 350ms; booking bar rises last at 700ms. Total ≤ 1.6s, content readable by 800ms.

### 2.3 Scroll reveal — "Rise"
`whileInView` (`once: true`, `margin: "-15% 0px"`): `y:32→0, opacity:0→1`, 700ms `ease-water`. Grid children stagger 70ms. Section eyebrows precede their headline by one stagger step.

### 2.4 Parallax — "Current"
Full-bleed section images translate `y: -8%→8%` mapped to scroll progress (`useScroll` + `useTransform`), springless. Foreground text moves at 0.3× the image rate. Applied to: landing hero, story band, villa detail hero, confirmation photo. Disabled on mobile and under reduced-motion.

### 2.5 Card hover — "Lift"
Villa/service cards: `translateY(-4px)` + `shadow-md → shadow-lg` (300ms `ease-drift`); image inside scales 1→1.05 over 700ms `ease-water`; arrow affordance slides in 8px. Focus-visible triggers the same state.

### 2.6 Booking-flow continuity — "Amerta thread"
A 2px gold progress line under the flow header fills continuously per step (500ms `ease-water`). Step content slides horizontally: forward = enter from right (`x:40→0`), back = enter from left. The booking summary card is `layout`-animated so line items reflow smoothly when a price line is added; the total counts up via animated number (500ms).

## 3. Component motion specs

| Component | In | Out | Notes |
|---|---|---|---|
| Modal | overlay fade 300ms; panel `opacity+scale .96→1` 400ms `ease-water` | 200ms fade | Focus trapped before animation ends |
| Drawer (mobile sheet) | `y:100%→0` 450ms `ease-water` | `y:→100%` 300ms | Drag-to-dismiss with velocity threshold |
| Dropdown/Popover | `opacity + y:-6→0` 200ms | 150ms fade | Origin-aware (`transform-origin` from trigger) |
| Toast | `x:24→0 + fade` 300ms, from top-right (desktop) / bottom (mobile) | fade+`x:24` 200ms | Max 3 stacked, older ones compress to 0.96 scale |
| Accordion (FAQ) | height auto via `grid-template-rows` 350ms; chevron rotates 200ms | same reversed | Content fades in after 100ms |
| Date-picker range | selected-day fills expand from center 150ms; range bar sweeps between endpoints 300ms | — | Hover preview of tentative range at 40% opacity |
| Skeleton | shimmer: `sand-300` base, 1.8s linear gradient sweep, 8% white peak | crossfade 300ms to content | Skeletons match final layout exactly — no reflow |
| Button press | `scale .98` 100ms | release 200ms | Primary button label→spinner crossfade when pending |
| Status pill change | color crossfade 300ms + one 1.06 pulse | — | Staff dashboards (e.g., villa Cleaning→Ready) |
| Chart draw | line/area path draw 900ms `ease-water` on first view; points fade after | — | Staff dashboards; tooltips follow cursor at 80ms lag |

## 4. Loading choreography

1. **Route-level:** skeleton screens (never spinners) for list/detail pages — mirror exact final layout.
2. **Booking confirmation:** full-screen forest-900 interstitial with the lotus seal drawing itself (SVG `stroke-dashoffset`, 1400ms) + line "Preparing your sanctuary…" — perceived-wait design for the payment round-trip. If response < 600ms, skip entirely (no flash).
3. **Buttons:** pending state swaps label for 16px spinner, width locked to prevent jump.

## 5. Reduced motion

`prefers-reduced-motion: reduce` → all transforms/parallax/staggers disabled; entrances become 150ms opacity fades; hero video (if used) is replaced by a still; count-up numbers render final value immediately. Implement via a global `MotionConfig reducedMotion="user"` plus a CSS override layer.

## 6. Performance budget

- Only `transform` + `opacity` animated; `will-change` applied on interaction start, removed on rest.
- Hero image `priority` + `fetchpriority=high`; LCP < 2.5s — the Dawn sequence must not delay LCP (headline is HTML text, image starts visible at scale 1.06).
- IntersectionObserver-based reveals; no scroll listeners.
- Cap simultaneous animated elements at 12 per viewport.
