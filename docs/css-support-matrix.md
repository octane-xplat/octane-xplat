# CSS support matrix (NS ∩ web)

> The shared stylesheet's allowed grammar. Statuses: ✅ both · ⚠️ divergent ·
> ❌ native-missing (use a primitive/facade instead) · ? unverified (lab).
> Sources: ns-css-* skills + driver source; verify per row during prototype.

## Layout

| Property | NS | Web | Notes |
|---|---|---|---|
| flexbox (direction/justify/align/wrap) | ✅ FlexboxLayout | ✅ | `gap` works on FlexboxLayout only |
| grid via `rows`/`columns` spec | ✅ GridLayout | ✅ via spec→template mapping | no `gap` on GridLayout; child `row`/`col` attach |
| `position: absolute` | ❌ | ✅ | → `Absolute` primitive / `absolutelayout` |
| `display: none` | ❌ | ✅ | → `visibility: collapse` |
| `visibility` | ✅ hidden/collapse | ✅ | `collapse` removes from layout |
| `zIndex` | ? | ✅ | sibling-order usually suffices natively |
| `overflow` | ⚠️ | ✅ | verify per-axis + hidden semantics |
| `%` sizing | ⚠️ | ✅ | measures differently — prefer flex/tokens |

## Box/paint

| Property | NS | Web | Notes |
|---|---|---|---|
| `margin`/`padding` (+ sides) | ✅ | ✅ | dip vs px — tokenized |
| `border-*` (width/color/radius/style) | ✅ | ✅ | |
| `corner-shape: squircle` | ⚠️ iOS only | ⚠️ | Android ignores; keep to `border-radius` |
| `background-color`/image/gradient | ✅ | ✅ | |
| `box-shadow` | ⚠️ | ✅ | iOS shadow props / Android `elevation` — `shadow-{n}` utility |
| `opacity` | ✅ | ✅ | animatable |

## Typography

| Property | NS | Web | Notes |
|---|---|---|---|
| `color`, `font-size`, `font-weight`, `font-style` | ✅ | ✅ | |
| `font-family` | ⚠️ | ✅ | registered-name mapping per platform (Q18) |
| `text-align`, `text-decoration`, `text-transform` | ✅ | ✅ | |
| `line-height` | ⚠️ **additive gap** | ✅ total box | tokens carry both values |
| `letter-spacing` | ⚠️ | ✅ | iOS vs Android differ; verify |
| `vertical-align` | ✅ (this name, not `-alignment`) | ✅ | exact spelling — silent drop otherwise |
| `white-space`/`text-overflow`/`numberOfLines` | ⚠️ | ✅ | prop-level on native, CSS on web |

## Interaction/state

| Feature | NS | Web | Notes |
|---|---|---|---|
| `:pressed`, `:hovered` pseudo | ✅ | ✅ `:active`/`:hover` | class hooks exist both sides |
| `:not()` `:is()` `:where()` | ✅ | ✅ | `:where` = 0 specificity |
| attribute selectors | ✅ any view prop | ✅ | bare `[attr]` matches nothing natively |
| `>`/descendant combinators | ✅ | ✅ | sibling combinators unverified |
| `@media` (orientation/size/color-scheme) | ✅ | ✅ | nestable; `matchMedia()` both |
| CSS vars `--x`, `var()`, `calc()` | ✅ | ✅ | root classes: `.ns-root/.ns-dark` ↔ `:root/.dark` |

## Animation

| Feature | NS | Web | Notes |
|---|---|---|---|
| `@keyframes` + `animation-*` | ✅ **12 props only** | ✅ | opacity, translate/scale/rotate, w/h, bg-color, perspective, transform |
| `animation-fill-mode` | ⚠️ needed for persistence | ✅ | values snap back without `forwards` |
| `animation-direction` | ⚠️ `reverse` only | ✅ | |
| `animation-play-state` | ❌ | ✅ | |
| `transition` | ❌ | ✅ | **use the JS facade / keyframe classes** |
| `spring` curve | ⚠️ divergent | n/a | UIKit spring vs BounceInterpolator — facade owns springs |
| unitless `animation-delay` | ⚠️ seconds | ms | always write units |

## Selector/authoring traps (native)

- Unknown property names / values drop **silently**, per-declaration — a rule
  can half-apply. Lint allowlist (`stylelint`-style) is the mitigation.
- Typo'd selector chain kills the whole rule silently.
- `className` swap can leave stale backgrounds → `''`-then-set workaround.
- `!important` support unverified — don't rely on it; use specificity/cascade.
