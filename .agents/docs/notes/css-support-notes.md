# CSS support notes

> The shared stylesheet's allowed grammar. Statuses: ✅ both · ⚠️ divergent ·
> ❌ native-missing (use a primitive/facade instead) · ? unverified (lab).
> Sources: ns-css-* skills + driver source; verify per row during prototype.

## Layout

| Property                                | NS                     | Web                          | Notes                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| flexbox (direction/justify/align/wrap)  | ✅ FlexboxLayout       | ✅                           | `gap` works on FlexboxLayout only                                                                                                                                                                                                                                                                                                                                  |
| `flex-grow` child min-size              | ⚠️ min-content         | ⚠️ min-content (same)        | identical on both engines — `min-w-0`/`min-h-0` + `shrink` utils guard (lab: web+ios 2026-09-25)                                                                                                                                                                                                                                                                   |
| `flex-shrink` default                   | ⚠️ 1, **no min floor** | ✅ 1, min-content floor      | NS clamps shrinking children at `effectiveMinHeight/Width` (default 0), not min-content — an overflowing column crushes them to 0. Normalized away: tokens.css ships `* { flex-shrink: 0 }` (RN/Yoga semantics); shrinkable regions opt in via `flex-1`/`shrink` + `min-h-0`. (lab: ios 2026-09-26)                                                                |
| `flex-shrink` on the row axis           | ⚠️ **partially inert** | ✅                           | iOS runs the shrink pass only under EXACTLY-measured containers (AT_MOST rows size the line to content), and a shrunk child re-measures but its frame keeps natural width (observable via taller wrap, not position). Treat `shrink`/`flex-1` opt-ins as scroller-region sizing, not row truncation. (lab: ios 2026-09-26)                                         |
| `align-items: stretch` vs explicit size | ⚠️ **stretch wins**    | ✅ explicit size wins        | In a column container, web stretch only sizes children without an explicit width; NS's `_stretchViewHorizontally` re-measures EVERY child to the full cross-axis — an explicit `w-48`/`width:N` is silently clobbered. Give fixed-width children a non-stretching host (`align-items: flex-start`) or set `alignSelf` per child. (lab: ios parity lane 2026-09-26) |
| `margin-*: auto`                        | ❌ ignored             | ✅                           | → `Spacer` / `justify-content` (lab: 2026-09-25)                                                                                                                                                                                                                                                                                                                   |
| `flex-basis`                            | ❌                     | ✅                           | use `width:0` + `min-w-0` for basis-0 (row axis)                                                                                                                                                                                                                                                                                                                   |
| grid via `rows`/`columns` spec          | ✅ GridLayout          | ✅ via spec→template mapping | no `gap` on GridLayout; child `row`/`col` attach                                                                                                                                                                                                                                                                                                                   |
| `position: absolute`                    | ❌                     | ✅                           | → `Absolute` primitive / `absolutelayout`                                                                                                                                                                                                                                                                                                                          |
| `display: none`                         | ❌                     | ✅                           | → `visibility: collapse`                                                                                                                                                                                                                                                                                                                                           |
| `visibility`                            | ✅ hidden/collapse     | ✅                           | `collapse` removes from layout                                                                                                                                                                                                                                                                                                                                     |
| `zIndex`                                | ✅                     | ✅                           | NS 9 `zIndexProperty` → iOS `layer.zPosition` verified on sim; Android `setZIndex` desk-source. Unset reads `undefined` (lab: ios-sim 2026-09-25)                                                                                                                                                                                                                  |
| `overflow`                              | ⚠️                     | ✅                           | verify per-axis + hidden semantics                                                                                                                                                                                                                                                                                                                                 |
| `%` sizing                              | ⚠️                     | ✅                           | measures differently — prefer flex/tokens                                                                                                                                                                                                                                                                                                                          |

## Box/paint

| Property                              | NS     | Web | Notes                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | ------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `margin`/`padding` (+ sides)          | ✅     | ✅  | px → dip rewritten by the preset's css transform (see below)                                                                                                                                                                                                                                                                                                                          |
| `border-*` (width/color/radius/style) | ✅     | ✅  |                                                                                                                                                                                                                                                                                                                                                                                       |
| `corner-shape: squircle`              | ⚠️ iOS | ⚠️  | Default corner treatment on the `--radius-*` scale (decision #38). iOS: uniform radii → `cornerCurve` (9.1 ships it), non-uniform → patched superellipse paths. Android ignores; web = Chrome ≥139, other browsers degrade to round. Exact cross-target match + caller-controlled smoothing → `@octane-xplat/smooth-corners` (decision #88, [design](../../design/smooth-corners.md)) |
| `background-color`/image/gradient     | ✅     | ✅  |                                                                                                                                                                                                                                                                                                                                                                                       |
| `box-shadow`                          | ⚠️     | ✅  | iOS shadow props / Android `elevation` — `shadow-{n}` utility                                                                                                                                                                                                                                                                                                                         |
| `opacity`                             | ✅     | ✅  | animatable                                                                                                                                                                                                                                                                                                                                                                            |

## Typography

| Property                                          | NS                               | Web          | Notes                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------- | -------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`, `font-size`, `font-weight`, `font-style` | ✅                               | ✅           |                                                                                                                                                                                                                                                                                                                                     |
| `font-family`                                     | ⚠️                               | ✅           | registered-name mapping per platform                                                                                                                                                                                                                                                                                                |
| `text-align`, `text-decoration`, `text-transform` | ✅                               | ✅           |                                                                                                                                                                                                                                                                                                                                     |
| `line-height`                                     | ⚠️ **additive gap**              | ✅ total box | additive spacing only — does NOT grow single-line Label height (lab: 2026-09-25). Inline `style={{lineHeight: N}}` — number → `Npx` via `normStyle` (octane keeps React's unitless list; RN semantics is absolute)                                                                                                                  |
| `letter-spacing`                                  | ⚠️                               | ✅           | iOS vs Android differ; verify                                                                                                                                                                                                                                                                                                       |
| `vertical-align`                                  | ✅ (this name, not `-alignment`) | ✅           | exact spelling — silent drop otherwise                                                                                                                                                                                                                                                                                              |
| `white-space`/`text-overflow`/`numberOfLines`     | ⚠️                               | ✅           | `Text` leaf normalizes: wraps by default (`whiteSpace='normal'`, `maxLines=0` = unlimited); `ellipsize`/`numberOfLines` props override. NS's default is single-line truncating — without the leaf fix a shared `<Text>` never wraps on iOS (lab: 2026-09-25). Raw `<label>` in unsuffixed native-default files still needs the prop |

## Interaction/state

| Feature                                  | NS               | Web                   | Notes                                             |
| ---------------------------------------- | ---------------- | --------------------- | ------------------------------------------------- |
| `:pressed`, `:hovered` pseudo            | ✅               | ✅ `:active`/`:hover` | class hooks exist both sides                      |
| `:not()` `:is()` `:where()`              | ✅               | ✅                    | `:where` = 0 specificity                          |
| attribute selectors                      | ✅ any view prop | ✅                    | bare `[attr]` matches nothing natively            |
| `>`/descendant combinators               | ✅               | ✅                    | sibling combinators unverified                    |
| `@media` (orientation/size/color-scheme) | ✅               | ✅                    | nestable; `matchMedia()` both                     |
| CSS vars `--x`, `var()`, `calc()`        | ✅               | ✅                    | root classes: `.ns-root/.ns-dark` ↔ `:root/.dark` |

## Animation

| Feature                      | NS                        | Web | Notes                                                                  |
| ---------------------------- | ------------------------- | --- | ---------------------------------------------------------------------- |
| `@keyframes` + `animation-*` | ✅ **12 props only**      | ✅  | opacity, translate/scale/rotate, w/h, bg-color, perspective, transform |
| `animation-fill-mode`        | ⚠️ needed for persistence | ✅  | values snap back without `forwards`                                    |
| `animation-direction`        | ⚠️ `reverse` only         | ✅  |                                                                        |
| `animation-play-state`       | ❌                        | ✅  |                                                                        |
| `transition`                 | ❌                        | ✅  | **use the JS facade / keyframe classes**                               |
| `spring` curve               | ⚠️ divergent              | n/a | UIKit spring vs BounceInterpolator — facade owns springs               |
| unitless `animation-delay`   | ⚠️ seconds                | ms  | always write units                                                     |

## Selector/authoring traps (native)

- Unknown property names / values drop **silently**, per-declaration — a rule
  can half-apply. Lint allowlist (`stylelint`-style) is the mitigation.
- Typo'd selector chain kills the whole rule silently.
- `className` swap can leave stale backgrounds → `''`-then-set workaround.
- `!important` support unverified — don't rely on it; use specificity/cascade.

## The preset's css transform (`xplatNative`)

The native Vite preset (`@octane-xplat/cli/vite`) owns three css passes —
they run per-module in dev and on the emitted `.css` asset in build
(`generateBundle`, before ns-vite's `addTaggedAdditionalCSS` pass):

```ts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => xplatNative(mode))
```

1. **px → dip rewrite.** Shared stylesheets are authored in web px; NS reads
   `px` as _device_ pixels. `Npx` → `Ndip`. Inline `style` props were always
   dips and are untouched. (Absorbs text-coral's app-local `pxToDip` plugin.)
2. **`xplat-web-only` strip.** Rule blocks wrapped in
   `/* xplat-web-only:start */ … /* xplat-web-only:end */` are dropped from
   the native bundle — web-only machinery (portals, dialog modals, spinners)
   shouldn't ship dead rules or trip the warnings.
3. **Divergence warnings.** Once per file, loud `this.warn` on declarations
   NS silently ignores: `margin-*:auto`, `position:fixed|sticky`,
   `float`, `box-shadow`, `white-space:pre-wrap` — each message names the
   portable alternative.

**`@import` bypasses the plugin transform.** The transform sees each css
_module's_ raw text; `@import` chains are inlined by vite's own css pass, so
imported rules ship un-stripped and un-rewritten. `xplat-web-only` rules still
apply on native, and `px` values skip the px-to-dip rewrite. The parity lane
measured `transform: translate(-50%,-50%)` as a −50dip view offset on
2026-09-26; the maintained NativeScript core patch now preserves percentage
translates and resolves each axis against the view's own bounds. That fix is
source-reviewed but has not been app-verified. Entry files must still import
css as JS modules — `import '@pkg/file.css'`, one per file, like
`apps/web/src/main.tsrx`. The transform warns when a `.css` source contains
`@import`.

```ts
import '@octane-xplat/ui/theme/tokens.css'
import './app.css'
```

## Author-time audit (`pnpm check:css`)

`scripts/check-css.ts` runs as part of `pnpm lint`: it parses every shared
stylesheet (`packages/*/src/**/*.css`, `packages/create/template/src`) and
errors on any declaration whose property isn't in
`scripts/ns-css-registry.json` — the `cssName` list extracted from the
installed `@nativescript/core` (`pnpm gen:css-registry` to refresh on core
upgrades). Dropped-but-intentional props (`display`, `grid-area`,
`border-style`, `user-select`, `-webkit-*`) live in the script's
`DROPPED_INTENTIONAL` map with a reason each; `xplat-web-only` blocks are
stripped before auditing since they never reach native.

```sh
pnpm check:css
```

This catches the silent-drop class — a typo'd prop name or a prop NS simply
doesn't read (`position`, `overflow`, `cursor`...) half-applies a rule with
zero diagnostics. What it can't catch: registered props with divergent
_semantics_ (`transform` percents parse as dips, stretch clobbering width) —
that's what the measured parity lane is for.

```css
/* Prefer a layout primitive over unsupported position CSS. */
.notice {
	padding: 16px;
	color: #222;
}
```

## Safe-area environment functions (issue #48)

`env(safe-area-inset-*)` is not resolved by the native CSS converter. The
[consumer report](https://github.com/octane-xplat/octane-xplat/issues/48)
measured a zero contribution on iOS 27 (iPhone 18 Pro simulator), with
NativeScript core 9.1.3 and MasonKit beta.126; inline native insets restored
62pt of padding. This is reported consumer runtime evidence, not a new device
qualification. Android behavior has not been measured here.

The preset now warns once per stylesheet in dev and emitted build assets,
including Bamboo output and the shared `tokens.css` safe-area class. Nested
functions and fallbacks still warn; the converter does not replace the value
with a guessed inset. Toast rules wrapped in `xplat-web-only` are removed
before diagnosis. The build-time converter has no window or view lifecycle
from which to obtain changing insets.

```css
/* Warns in the native pipeline; stays available for browser evaluation. */
.chrome { padding-top: env(safe-area-inset-top, 0px); }
```

The maintained regression is `packages/cli/test/vite-safe-area-css.test.mjs`.
It tests host-side conversion and diagnostics, not device layout. Remove this
warning only when the adopted native runtime resolves these functions against
live safe-area values and device tests establish the behavior.

### Runtime ownership (source verification, 2026-10-23)

The missing runtime support spans NativeScript and the Xplat MasonKit fork:

- NativeScript core 9.1.3 ([publish commit](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/core/properties/index.ts)) recognizes
  `var(--...)` and `calc(...)` for expression evaluation; it has no safe-area
  environment substitution. Its `evaluateCssExpressions` path in
  [style-scope.ts](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/styling/style-scope.ts)
  runs variable substitution followed by calculation.
- MasonKit beta.126 ([tag commit](https://github.com/octane-xplat/nativescript-mason/blob/623114b070896a21315fcff9a3a6349bdd091cc4/packages/nativescript-masonkit/style.ts))
  sends string padding through `lengthPercentageFromString` and
  `tokenToDevicePx`. Its math resolver handles `calc`, `min`, `max`, and
  `clamp`, not environment variables. An unresolved function reaches an
  explicit `return 0` before the padding value is written into the native
  style buffer. This locates the zero in the JavaScript style adapter, before
  native layout.
- That branch reports a `not-implemented` diagnostic, but
  [diagnostics.ts](https://github.com/octane-xplat/nativescript-mason/blob/623114b070896a21315fcff9a3a6349bdd091cc4/packages/nativescript-masonkit/diagnostics.ts)
  initializes reporting as disabled. It does not provide the requested build
  warning. The CLI warning remains necessary until resolution is supported.

There is no demonstrated platform blocker. A runtime implementation can live
in the Xplat MasonKit fork: substitute environment values before length/math
parsing, supply safe-area values for the correct window, and re-evaluate
dependent styles when those values change. It must cover nested math,
fallbacks, and shorthand expansion; a build-time numeric replacement cannot
provide this lifecycle. NativeScript-wide support would also benefit ordinary
core views, but is not a prerequisite for supporting Mason views in the fork.
These conclusions are source evidence, not a new simulator or device run.


### Core beta.1 automatic window binding (2026-10-23)

Core `1.0.0-beta.1` adds the runtime resolver and automatically binds loaded
Mason roots to their owning UIWindow/native Android root when a subtree first
uses `env()`. Window observers are shared and stop on unload. Android reads
system-bar/cutout types through its existing AndroidX dependency, excludes IME
and converts with that root's density; it does not replace other inset listeners.

```css
.chrome { padding-top: env(safe-area-inset-top, 0px); }
```

The earlier pinned-source conclusions remain correct for beta.0/full MasonKit.
The CLI inspects the installed core capability marker rather than requested
semver: capable core gets a native-layout-qualification warning; unsupported
engines retain the unresolved-value warning. No native device or simulator
run qualifies this new resolver. Ordinary NativeScript controls still need
inline `useSafeAreaInsets()` values. The core package README describes explicit
sources for custom presentation viewports.
