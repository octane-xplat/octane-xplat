# Styling

> Strategy: **shared CSS-ish language first, style objects for dynamic values,
> `styled()`-style variants as the component API.** NS has a real CSS engine —
> unlike RN — so we don't need to invent a styling runtime. Flutter/Tamagui
> inform the *authoring API*, not the implementation.

## The shared pipeline

```
packages/ui/theme/
  tokens.css        — :root / .ns-root CSS vars (colors, spacing, radii, type)
  base.css          — element-type defaults per vocabulary (Label vs span…)
  utilities         — Tailwind v4 (web) / @nativescript/tailwind (native)
apps/*/app.css      — per-app layer importing the shared sheets
```

One PostCSS/Tailwind toolchain, two output targets. ns-octane proves
`@nativescript/tailwind` v4 works today (auto PostCSS, **skip preflight**).

### Why CSS vars carry the theme

- NS supports `--x`, `var(--x, fallback)`, nested fallbacks, scoped and
  unscoped vars, `calc()` — and vars inherit down the view tree.
- Root classes `.ns-root`, `.ns-ios`, `.ns-android`, `.ns-dark`, `.ns-light`,
  `.ns-landscape`, `ns-modal` give the same hook points as `:root`/`.dark` on
  web. Token override = class toggle on both platforms.
- `view.style.getCssVariable()` reads vars from JS natively; web
  `getComputedStyle` is forbidden in shared code — wrap in a `useThemeToken()`
  platform hook.

### Media queries — genuinely shared

NS 8.8+ implements MQ L3: `orientation`, `min-/max-width`, `min-/max-height`,
`device-width/height`, `prefers-color-scheme`, `not`, nesting, `@keyframes`
inside `@media`, and `matchMedia()` + `MediaQueryList` with `change` events —
the same API shape as the web. So:

- Stylesheet-level responsive design can literally share the same CSS.
- `useMediaQuery(query)` hook has identical semantics both sides.

### Dark mode decision (provisional → decisions.md)

Two coherent options: (a) media-driven (`prefers-color-scheme`, follows
system, works identically both sides); (b) class-driven (`.dark` / `ns-dark`
root class, app-controllable). Recommend **(a) as default + (b) override** —
a `ThemeProvider` that sets the root class, falling back to the media query.

**Latency (Exp 5 — iOS sim)**: `setState` → post-commit `useEffect` (i.e.
render + native prop application) ≈ **1ms** for a root `className` swap
(`dark ns-dark` toggled on the app root view). The JS-side commit is
synchronous; pixel-visible time then depends on the next native layout
pass (not measured — needs visual confirmation).

## Rules for shared components

1. Static styling = `className` only. No `<style>` blocks (web-only), no
   inline `style` for static values.
2. `style` objects reserved for *computed* values (animated, data-driven).
   Numbers = dip/px normalized in leaf; colors/units are strings.
3. Only use CSS properties inside the **intersection** of both engines —
   maintain `docs/css-support-matrix.md` once the prototype reveals the real
   subset. Known traps to encode early:
   - `vertical-align` (not `-alignment`); unknown props **drop silently** — and
     NS recovers *per declaration*, so a rule can half-apply. A lint/property
     allowlist is worth building
   - no `position` CSS natively → `Absolute`/`Grid` primitives instead
   - no `display:none` → `visibility: collapse` (removes from layout too)
   - **no `transition` property** — animations are `@keyframes`/`animation-*`
     only, and only ~12 properties animate (opacity, translate/scale/rotate,
     width/height, background-color, perspective, transform). No
     `animation-play-state`; `direction` accepts only `reverse`; unitless
     `animation-delay` is seconds; no `fill-mode` → values snap back.
     → state-transition animations need the JS facade or keyframe classes
   - `box-shadow`: web has it; native = iOS shadow props / Android `elevation`
     → wrap in a `shadow-{n}` utility class per platform
   - units: dip default on NS, px on web; `%` measures differently
   - `overflow`, `zIndex`, `gap`, flex shorthand parity — verify per property
     (`gap` confirmed on FlexboxLayout; GridLayout needs it per-cell)
   - selector traps: bare `[attr]` matches nothing; sibling combinators
     unverified; `!important` unverified; typo'd selector chain kills a rule
     silently
   - **className swap can leave stale native backgrounds** — the
     `''`-then-set workaround may belong in our driver patch or leaf
   - `line-height` = additive spacing on NS, total line box on web — token
     files carry both notions
   - `corner-shape: squircle` iOS-only (Android ignores); `spring` curve in
     keyframes = UIKit spring iOS vs BounceInterpolator Android
4. Fonts: register in `App_Resources`/font plugin natively, `@font-face` on
   web; shared `font-family` tokens resolve per-platform.
5. Icons: `Icon` primitive owns the SF Symbol ↔ font icon ↔ SVG mapping
   (see primitives.md).

## The component API over it (`styled()`)

Tamagui-shaped, CSS-backed — see `prior-art/tamagui.md`:

```ts
const Card = styled(View, {
  base: 'rounded-lg bg-surface p-4',
  variants: { elevated: 'shadow-2', destructive: 'bg-danger' },
});
```

- `base`/`variants` are class strings → clsx composition (Octane already does
  clsx-style `class` everywhere).
- Dynamic variant→style escape: `style` prop still available.
- Keeps TypeScript prop inference: `styled()` exports typed variant props.

## Layout vocabulary honesty

NS layout is a set of *classes* (stack/grid/flex/dock/absolute/wrap), not one
box model. Our Row/Column/Grid/Stack primitives (primitives.md) deliberately
mirror that. Do not try to make web flex/grid pretend to be NS layouts inside
shared files — shared code composes primitives; leaf impls pick the right
layout class per platform. `gap` support on NS flexbox/stack: verify.
