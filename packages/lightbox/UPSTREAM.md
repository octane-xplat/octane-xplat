# Upstream provenance

Ported from [`frontendsupply/lightbox`](https://github.com/frontendsupply/lightbox)
0.3.0, MIT (LICENSE.lightbox), pinned commit
`330e4387df9cc15b6386734cf3a4f837e005c519`. Local reference clone:
`research/lightbox/packages/lightbox/src/`.

## What's ported

| Contract | Upstream reference | Port |
| --- | --- | --- |
| Geometry | `math.ts` — `fit`, `intersect`, `lerpVisual`, `rubber`, `band`, `panRange`, `zoomAt`, `toStyle` | `src/math.ts`; `toStyle` returns numeric `{x, y, scale, inset, radius, opacity}` instead of a CSS `clipPath` string |
| Gesture rules | `lightbox.tsx` `Image` effect ~L978–1290 — slop/direction lock, pull scale+presence, dismiss release, pinch rubber-band and below-fit close, double-tap zoom | `src/gesture-machine.ts` as pure intents → commands |
| Root phase machine | `lightbox.tsx` root — `openAt`, `close`, `goTo` jump/held bookkeeping, `onScrollIndex`, `onOpened` guards | `src/state.ts` reducer + effects |
| Tap timing | `lightbox.tsx` `onTap` — 300 ms / 30 px window, 260 ms delay, mouse/backdrop passthrough | `src/tap-detector.ts` |
| Motion specs | `lightbox.tsx` L154–161 — OPEN 380/34, CLOSE 520/46, SETTLE 420/42, FADE 0.24 s, REDUCED 0.16 s, inertia `{power 0.5, timeConstant 280, bounceStiffness 360, bounceDamping 36}` | `src/constants.ts` |
| Thumbnail strip | `lightbox.tsx` L1380–1520 — thumbnail registration, fractional indicator position/size, centered strip, indexed activation | `src/thumbnail-layout.ts` plus web/native `thumbnails` leaves; sparse mounted indices interpolate between their actual media indices |

## Deliberate differences

- `toStyle` emits numeric insets/radius (motion channels are numeric; clip
  formatting lives in per-OS `clip.*` writers).
- No `@blossom-carousel/core` — mouse drag is in-house (decision D4).
- No Base UI — the modal seam is ui `Overlay isModal` (decision D5).
- No `useRender`/`render` prop.
- Native paging is a self-drawn track driven by gesturehandler, not
  scroll-snap (decision D3); web keeps scroll-snap.

## Phase 7 TODO

- **iOS full-bleed relies on `prepareFullScreenPage()`**: the overlay host is measured against `safeAreaLayoutGuide` unless the app Page's `measure` is wrapped (core `IOSHelper.layoutView` behavior). Every app template applies `prepareFullScreenPage(new Page())`; consumers embedding the leaf outside that setup will see the viewer limited to the safe-area content area. Documented requirement, not a leaf-side flag.
