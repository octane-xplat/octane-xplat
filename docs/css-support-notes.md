# CSS support notes

> The shared stylesheet's allowed grammar. Statuses: ✅ both · ⚠️ divergent ·
> ❌ native-missing (use a primitive/facade instead) · ? unverified (lab).
> Sources: ns-css-* skills + driver source; verify per row during prototype.

## Layout

| Property                               | NS                  | Web                          | Notes                                                                                                                                                                                                                                         |
| -------------------------------------- | ------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| flexbox (direction/justify/align/wrap) | ✅ FlexboxLayout    | ✅                           | `gap` works on FlexboxLayout only                                                                                                                                                                                                             |
| `flex-grow` child min-size             | ⚠️ min-content      | ⚠️ min-content (same)        | identical on both engines — `min-w-0`/`min-h-0` + `shrink` utils guard (lab: web+ios 2026-09-25)                                                                                                                                              |
| `flex-shrink` default                  | ⚠️ 1, **no min floor** | ✅ 1, min-content floor   | NS clamps shrinking children at `effectiveMinHeight/Width` (default 0), not min-content — an overflowing column crushes them to 0. Normalized away: tokens.css ships `* { flex-shrink: 0 }` (RN/Yoga semantics); shrinkable regions opt in via `flex-1`/`shrink` + `min-h-0`. (lab: ios 2026-09-26)                                                                                       |
| `flex-shrink` on the row axis          | ⚠️ **partially inert** | ✅                        | iOS runs the shrink pass only under EXACTLY-measured containers (AT_MOST rows size the line to content), and a shrunk child re-measures but its frame keeps natural width (observable via taller wrap, not position). Treat `shrink`/`flex-1` opt-ins as scroller-region sizing, not row truncation. (lab: ios 2026-09-26)                                                                 |
| `align-items: stretch` vs explicit size | ⚠️ **stretch wins** | ✅ explicit size wins | In a column container, web stretch only sizes children without an explicit width; NS's `_stretchViewHorizontally` re-measures EVERY child to the full cross-axis — an explicit `w-48`/`width:N` is silently clobbered. Give fixed-width children a non-stretching host (`align-items: flex-start`) or set `alignSelf` per child. (lab: ios parity lane 2026-09-26) |
| `margin-*: auto`                       | ❌ ignored          | ✅                           | → `Spacer` / `justify-content` (lab: 2026-09-25)                                                                                                                                                                                              |
| `flex-basis`                           | ❌                  | ✅                           | use `width:0` + `min-w-0` for basis-0 (row axis)                                                                                                                                                                                              |
| grid via `rows`/`columns` spec         | ✅ GridLayout       | ✅ via spec→template mapping | no `gap` on GridLayout; child `row`/`col` attach                                                                                                                                                                                              |
| `position: absolute`                   | ❌                  | ✅                           | → `Absolute` primitive / `absolutelayout`                                                                                                                                                                                                     |
| `display: none`                        | ❌                  | ✅                           | → `visibility: collapse`                                                                                                                                                                                                                      |
| `visibility`                           | ✅ hidden/collapse  | ✅                           | `collapse` removes from layout                                                                                                                                                                                                                |
| `zIndex`                               | ✅                  | ✅                           | NS 9 `zIndexProperty` → iOS `layer.zPosition` verified on sim; Android `setZIndex` desk-source. Unset reads `undefined` (lab: ios-sim 2026-09-25)                                                                                             |
| `overflow`                             | ⚠️                  | ✅                           | verify per-axis + hidden semantics                                                                                                                                                                                                            |
| `%` sizing                             | ⚠️                  | ✅                           | measures differently — prefer flex/tokens                                                                                                                                                                                                     |

## Box/paint

| Property                              | NS     | Web | Notes                                                                                                                                                                                                                               |
| ------------------------------------- | ------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `margin`/`padding` (+ sides)          | ✅     | ✅  | px → dip rewritten by the preset's css transform (see below)                                                                                                                                                                        |
| `border-*` (width/color/radius/style) | ✅     | ✅  |                                                                                                                                                                                                                                     |
| `corner-shape: squircle`              | ⚠️ iOS | ⚠️  | Default corner treatment on the `--radius-*` scale (decision #38). iOS: uniform radii → `cornerCurve` (9.1 ships it), non-uniform → patched superellipse paths. Android ignores; web = Chrome ≥139, other browsers degrade to round |
| `background-color`/image/gradient     | ✅     | ✅  |                                                                                                                                                                                                                                     |
| `box-shadow`                          | ⚠️     | ✅  | iOS shadow props / Android `elevation` — `shadow-{n}` utility                                                                                                                                                                       |
| `opacity`                             | ✅     | ✅  | animatable                                                                                                                                                                                                                          |

## Typography

| Property                                          | NS                               | Web          | Notes                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | -------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`, `font-size`, `font-weight`, `font-style` | ✅                               | ✅           |                                                                                                                                                                                                                                                                                                                      |
| `font-family`                                     | ⚠️                               | ✅           | registered-name mapping per platform                                                                                                                                                                                                                                                                                 |
| `text-align`, `text-decoration`, `text-transform` | ✅                               | ✅           |                                                                                                                                                                                                                                                                                                                      |
| `line-height`                                     | ⚠️ **additive gap**              | ✅ total box | additive spacing only — does NOT grow single-line Label height (lab: 2026-09-25). Inline `style={{lineHeight: N}}` — number → `Npx` via `normStyle` (octane keeps React's unitless list; RN semantics is absolute)                                                                                                   |
| `letter-spacing`                                  | ⚠️                               | ✅           | iOS vs Android differ; verify                                                                                                                                                                                                                                                                                        |
| `vertical-align`                                  | ✅ (this name, not `-alignment`) | ✅           | exact spelling — silent drop otherwise                                                                                                                                                                                                                                                                               |
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

**`@import` bypasses all of it.** The transform sees each css *module's* raw
text; `@import` chains are inlined by vite's own css pass, so imported rules
ship un-stripped and un-rewritten — including `xplat-web-only` rules, which
then apply for real (`transform: translate(-50%,-50%)` lands as a −50dip
view offset; measured in the parity lane 2026-09-26). Entry files must
import css as JS modules — `import '@pkg/file.css'`, one per file, like
`apps/web/src/main.tsrx`. The transform warns when a `.css` source contains
`@import`.

## Author-time audit (`pnpm check:css`)

`scripts/check-css.mjs` runs as part of `pnpm lint`: it parses every shared
stylesheet (`packages/*/src/**/*.css`, `packages/create/template/src`) and
errors on any declaration whose property isn't in
`scripts/ns-css-registry.json` — the `cssName` list extracted from the
installed `@nativescript/core` (`pnpm gen:css-registry` to refresh on core
upgrades). Dropped-but-intentional props (`display`, `grid-area`,
`border-style`, `user-select`, `-webkit-*`) live in the script's
`DROPPED_INTENTIONAL` map with a reason each; `xplat-web-only` blocks are
stripped before auditing since they never reach native.

This catches the silent-drop class — a typo'd prop name or a prop NS simply
doesn't read (`position`, `overflow`, `cursor`...) half-applies a rule with
zero diagnostics. What it can't catch: registered props with divergent
*semantics* (`transform` percents parse as dips, stretch clobbering width) —
that's what the measured parity lane is for.
