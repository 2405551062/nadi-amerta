# Nadi Amerta — Accessibility Contract (WCAG 2.2 AA)

Luxury is effortlessness for everyone. This contract is testable; CI runs axe-core + Playwright
keyboard walks on the six critical journeys.

## 1. Color & contrast
- All text pairs per foundations §2.3 (verified ≥ 4.5:1 body, ≥ 3:1 large text/UI).
- `amerta-400` never carries text on light; use `amerta-600` ≥ 14px.
- Status is never color-only: badges pair dot + word; deltas pair glyph + label; calendar unavailability pairs strikethrough + `aria-disabled`.
- Focus ring 2px `palm-700` (light) / `amerta-300` (dark), offset 2, on **every** interactive element — the glass booking bar and photo-overlaid controls get an additional 1px inner white ring for guaranteed visibility on imagery.

## 2. Keyboard
- Full flows operable: search → villa → dates → pay; portal ordering; reception check-in.
- Booking calendar: arrows move day, PgUp/PgDn month, Home/End week bounds, Enter selects endpoint, Esc closes — announced via `aria-live` ("Check-in Friday, August 12 selected. Choose check-out.").
- Modals/sheets: focus-trapped, Esc closes, focus returns to invoker. Skip-link to main on every page. Villa card = single `<a>` wrapper (no nested tab stops); card hover affordances have focus parity.
- Custom controls (stepper, segmented, chips) expose `role`, `aria-pressed/checked`, and arrow-key group navigation.

## 3. Screen readers & semantics
- Landmarks: `header/nav/main/aside/footer` once each; headings strictly nested (one `h1`).
- Prices: `aria-label="8,500,000 rupiah per night"` (raw `IDR 8.5M` is visual shorthand).
- Countdown, booking-total changes, toasts, form errors → `aria-live="polite"`; payment failures → `assertive`.
- Images: villa photos get descriptive alt ("Private infinity pool facing the Ayung gorge at dusk"); decorative hairlines/seals `alt=""`.
- Stepper progress: `aria-current="step"`; timeline nodes as ordered list.

## 4. Motion & vestibular safety
- `prefers-reduced-motion` honored globally (motion §5) — parallax, Ken Burns, video, count-ups, staggers all degrade to fades ≤ 150ms.
- No autoplaying motion longer than 5s without pause control (hero video gets a pause button, 44px, bottom-right).
- Nothing flashes; shimmer skeletons run ≤ 1 cycle/1.8s at low contrast.

## 5. Forms & errors
- Every input has a real `<label>` (floating label is the label, not placeholder-only); errors linked by `aria-describedby`, icon + text, focus moved to first error on submit.
- OTP inputs: `autocomplete="one-time-code"`, single combined `aria-label`, paste splits across boxes.
- Touch targets ≥ 44×44 guest side, ≥ 56px housekeeping tablet controls; target spacing ≥ 8px.

## 6. Content & i18n
- Language toggle EN/ID sets `lang` attribute; currency stays IDR with locale-correct separators.
- Reading level: guest copy ≤ grade 9 equivalent; Balinese terms (Nyepi, Tri Hita Karana) always carry a one-line plain explanation on first use per page.
- Date format always explicit (`Aug 12 — 16, 2026`), never ambiguous numerics.

## 7. Test matrix (CI-gated)
| Journey | Checks |
|---|---|
| Landing → search | axe clean, keyboard walk, focus visible in hero glass bar |
| Villa detail → reserve | calendar keyboard ops, live-region totals |
| Checkout → pay | error recovery reachable, focus management on fail |
| Portal dining order | sheet trap, stepper semantics |
| Reception check-in | drawer flow, PIN dialog |
| 404/500 | landmark + heading sanity |
Contrast lint runs on the token file; any new color pair requires a documented ratio.
