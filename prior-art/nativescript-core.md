# @nativescript/core (the native platform)

> The runtime our host driver targets. iOS/Android views driven from JS —
> **your JS runs on the UI thread**, so synchronous gesture→view mutation is
> cheap (no bridge serialization; this is unlike React Native's model).

## Layout classes (distinct views, not one box model)

| Class | Model |
|---|---|
| `StackLayout` | single axis, horizontal/vertical |
| `GridLayout` | `rows`/`cols` string (`"*,auto,2*"`), children take `row`/`col`/`rowSpan`/`colSpan` — also the general overlay/positioning container |
| `FlexboxLayout` | flexbox-ish (subset; not identical to web flex) |
| `DockLayout` | dock children to edges, `stretchLastChild` |
| `AbsoluteLayout` | explicit `left`/`top` in dip — **there is no CSS `position: absolute`**; this is the only free-positioning container |
| `WrapLayout` | flow-wrap |
| `RootLayout` | app-root overlay container (popups/overlays over everything) |
| `ContentView` | single-child box — the generic "View" analog |
| `ProxyViewContainer` | viewless proxy (can live inside `<proxyviewcontainer>` anywhere, renders at its position) |

`FormattedString`+`Span` = rich inline text. `Page`/`Frame` = navigation units.
`placeholder` = escape hatch for a raw native view.

## CSS engine

Real CSS parser + cascade, applied onto view properties. Supported:

- Selectors: type (`Label`), `.class`, `#id`, and a small combinator set —
  **verify descendant/child/sibling coverage before relying on it**
- CSS custom properties: `--x`, `var(--x, fallback)`, nested fallbacks,
  `calc()` (basic; expressions over unknown-relative units get reduced early)
- Scoping: `.ns-root` (app root), `ns-modal` (modal roots!), plus auto classes:
  `.ns-ios`/`.ns-android`, `.ns-phone`/`.ns-tablet`, `.ns-portrait`/
  `.ns-landscape`, `.ns-light`/`.ns-dark`, `.ns-<platformVersion>`
- Media queries (8.8+): MQ L3 — `orientation`, `width`/`height` (+`min-/max-`),
  `device-width/height`, `prefers-color-scheme`, `not`, nesting, `@keyframes`
  inside `@media`; JS side: `matchMedia()` returning a `MediaQueryList` with
  `change` events — same API shape as web
- `@keyframes` CSS animations
- `view.style` object assignment for imperative styles
- Tailwind v4 via `@nativescript/tailwind` (works today; skip preflight)

Not supported / traps: no `position`, no `display:none` (use `visibility:
collapse`), no `box-shadow` (Android `elevation`, iOS shadow props differ),
silent drops on unknown property names (`vertical-align` not
`vertical-alignment`), units are dip by default (`px` exists), percentages exist
but measure differently, limited pseudo-classes (no `:hover`/`:focus` as on web —
`:highlighted` etc. — verify).

## Events

Views are `Observable`: `on(eventName, cb)`, property-change events, plus UI
events: `loaded`/`unloaded`, `tap`, `doubleTap`, `longPress`, `touch`
(down/move/up/cancel with `getX()/getY()` in dip), `pan`, `swipe`, `pinch`,
`rotation`, `itemTap` (lists), `textChange`/`returnPress`/`blur`/`focus`
(inputs), `navigatedTo`/`navigatedFrom`/`navigatingTo` (pages).

`loaded` fires **synchronously during attach** — the Octane driver already
defers mid-commit dispatch; our code should assume the same hazard.

## Animation

- `view.animate({ translate, scale, rotate, opacity, duration, curve, … })` →
  `UIView.animateWithDuration` / `ViewPropertyAnimator`. Returns a
  cancelable `Promise`.
- `Animation` class for batched/parallel multi-view animations.
- CSS `@keyframes` for declarative loops.
- Spring/damping curves + `CubicBezier`/spring timing via `curve`.
- No shared-element/layout-transition system — build per-platform extras on
  top (iOS UIViewController transitions, Android transitions).

## Navigation

- `Frame` = navigation stack owner; `frame.navigate({ moduleName | create() })`,
  `frame.goBack()`, transitions declared per-navigation (name + duration +
  curve on iOS).
- `Page` = screen unit w/ `ActionBar`, lifecycle events.
- `TabView` (bottom tabs), `SegmentedBar` (top/segmented).
- `showModal` — presents a view in a real modal (`UISheetPresentationController`
  on iOS); in Octane-land the modal hosts its own root.
- `Application.setWindowContentResolver` — one content tree per `NativeWindow`
  (iPad multi-scene, CarPlay).
- Android hardware back → `Application.android.on('activityBackPressed')`.

## Platform services (selected)

`ApplicationSettings` (kv prefs), `FileSystem`/`knownFolders`, `ImageSource`,
`Screen` (`mainScreen` metrics, `orientationChanged`), `Device` (os/version/
deviceType/region/language), `Utils.openUrl`, `Connectivity`, `application`/
`SystemAppearance` (`systemAppearanceChanged`), safe-area handling via
`iosOverflowSafeArea`/`androidOverflowInset`, accessibility props
(`accessible`, `accessibilityLabel`, `accessibilityHint`, `accessibilityValue`,
`accessibilityRole`, live-region/announce APIs).

## JS environment (WinterCG-ish, NS 9.x)

`fetch`, `WebSocket`, `FormData`/`Blob` (partial), `crypto.getRandomValues`
(+growing `subtle`), `btoa`/`atob`, `URL`/`URLSearchParams`, `TextEncoder/
Decoder`, timers, `queueMicrotask`, `AbortController`. **No `document`,
`window`, `localStorage`, DOM events, `getComputedStyle`.**

## NativeScript's own file-suffix convention

NS/webpack tooling already resolves `.ios.ts`/`.android.ts` (and `.ios.css` etc.)
per platform. Our `*.native.*`/`*.ios.*`/`*.android.*`/`*.web.*` scheme stacks
on top of this — keep suffix ordering consistent between our resolver and NS's
own pipeline so they don't fight (see `docs/module-resolution.md`).

## Plugin ecosystem

Views/plugins register as view classes (`ui-drawer`, `input-accessory`,
`@nstudio/nativescript-menu`, `nstreamdown`, camera/geolocation/imagepicker/
biometrics/purchases/etc.). For Octane: `registerElement` + intrinsic typing.
