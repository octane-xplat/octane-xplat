# Primitive notes (`packages/ui`)

> The detailed cross-platform vocabulary. Every primitive is an interface (`.ts` types)
> plus leaf impls (`.web.tsrx` / `.native.tsrx`, occasionally `.ios`/`.android`).
> Shared code imports the interface only. Design rule from RNW: converge on the
> _constrained_ vocabulary — never the DOM's open one.
>
> **Owns:** #1 primitives contract · **Status:** mapped; driver mechanics
> verified · **Blocks on:** lab — Q3 (listview), Q4 (controlled inputs) ·
> **Decisions:** #3, #6, #9, #16, #21, #22, #24 · **Validated by:** prototype —
> counter + `@for` list + controlled `TextInput` + `Pressable` on both targets.

## Prop conventions (applies to every primitive)

```ts
interface PrimitiveProps {
	className?: ClassValue // clsx-style — works both targets
	style?: StyleObject // dynamic values only
	ref?: Ref<TypedHandle> // typed imperative handle per primitive
	children?: unknown
	// platform escape hatches — props, not files, for small divergences:
	ios?: Partial<NativeProps>
	android?: Partial<NativeProps>
	web?: DOMProps
}
```

- `className` composes via clsx on both targets (native: through NS CSS).
- `style` object → DOM `style` / NS `view.style`. **Numbers mean dip on native,
  px on web** — normalize inside the leaf, never in shared code.
- Event props use shared names (`onPress`, `onChange`, `onSubmit`); native leaf
  maps to `tap`/`textChange`/`returnPress` (driver already aliases these).
- Escape-hatch prop bags keep 90% of divergences out of file splits.

## Core inventory

| Primitive                   | Web leaf                                                  | Native leaf                                                                                    | Notes / seams                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `View`                      | `div` + `vx-view` class (flex-column, stretch)            | `flexboxlayout` `flexDirection=column`                                                         | RN-compatible default container — **column by default**, not web block flow. NOT `contentview` (single-child only)                                                                                                                                                                                                                                                                                                      |
| `Row` / `Column`            | flex row / col                                            | `flexboxlayout` (`flexDirection`)                                                              | `justify`/`align`/`gap`/`wrap` props — FlexboxLayout carries real flex semantics incl. `gap` (verified); StackLayout can't (no justify/align)                                                                                                                                                                                                                                                                           |
| `Stack` (z-order)           | `display:grid`, children `grid-area:1/1`                  | `gridlayout` `rows="*" columns="*"`                                                            | children stack in one cell; z-order = mount order                                                                                                                                                                                                                                                                                                                                                                       |
| `Grid`                      | `display:grid` + parsed templates                         | `gridlayout` `rows`/`columns` spec strings                                                     | shared spec-string format `"*,auto,2*"` → leaf maps `*`→`1fr`, `auto`→`auto`, `42`→`42px` for web. Child attached props `row`/`col`/`rowSpan`/`colSpan`. **No `gap`** (GridLayout lacks it; use child margins) — leaf warns                                                                                                                                                                                             |
| `Absolute`                  | `div` + `position:relative`; children `position:absolute` | `absolutelayout`                                                                               | **native has no `position` CSS** — container element required anyway; child `left`/`top` attached props (dip→px)                                                                                                                                                                                                                                                                                                        |
| `Spacer`                    | `flex-grow:1`                                             | `flexGrow` attached prop                                                                       | convenience                                                                                                                                                                                                                                                                                                                                                                                                             |
| `Text`                      | `span`/`p`                                                | `label`                                                                                        | children: text or `Text` only (nested → `formattedstring`/`span`); **never `View` inside `Text`** — adopt RN rule                                                                                                                                                                                                                                                                                                       |
| `RichText`                  | inline `<span>` composition                              | `formattedstring` + `span` leaves                                                              | nested `RichTextSpan` children; each span may be styled and tappable                                                                                                                                                                                                                                                                                                                                                   |
| `Pressable`                 | `div`+pointer events                                      | `flexboxlayout` `flexDirection=column` + `tap`/`longPress`/`pan`/`swipe`                                     | **multi-child** — `contentview` silently drops all but the last child (`.content` assignment); tap gestures attach to any view. Use `button` leaf only where native button chrome wanted                                                                                                                                                                                                                                |
| `ScrollView`                | `div` overflow                                            | `scrollview`                                                                                   | Native `ScrollView` measures a vertical child with an unspecified height; do not nest a recycling `List` inside it.                                                                                                                                                                                                                                                                                                                                                               |
| `ScrollBox`                 | `ScrollView`                                               | inline `View`                                                                                  | Use around shared content that may contain a `List`: web keeps the outer scroll, native lets the `ListView` own scrolling. The native shell is deliberately non-scrolling and non-recycling.                                                                                                                                                                                                                                                                                    |
| `List`                      | `@for` over a scroll `div`                                | `listview` + **per-cell Octane sub-roots**                                                     | The driver owns one `itemTemplate` and `itemLoading` callback: each recycled slot gets a `ContentView` and Octane root. It exposes only `renderItem`, so `kindFor` is removed; branch on the item inside `renderItem` when row markup differs. Never place `List` inside native `ScrollView`; the native leaf throws a named error and `ScrollBox` is the replacement.                                                                                                                                                       |
| `TextInput` / `TextArea`    | `input`/`textarea`                                        | `textfield`/`textview`                                                                         | controlled `value` ↔ `text`; check cursor/IME fights (open-questions); `returnKeyType`, `autocorrect`, keyboard types all differ. `TextArea` shipped: `rows`/`autoGrow`/`maxRows` — web auto-grow via scrollHeight re-fit; native TextView grows by default, row counts → `min/maxHeight` dips at the widget's measured line height (its `maxLines` is truncation-only on iOS)                                          |
| `Image`                     | `img`                                                     | `image`; svg srcs → `svgview` (ui-svg)                                                         | `src`: URL/`res://`/`~/`/data: URI plus inline `<svg>` markup, svg data URIs, `.svg` paths/URLs; remote `.svg` fetches→markup (SVGView awaits promise srcs)                                                                                                                                                                                                                                                             |
| `Icon`                      | inline SVG (lucide-style)                                 | `svgview` (ui-svg → SVGKit/androidsvg) for `svg`/`markup`                                      | name → glyph map; precedence `markup`/`svg` > `font` > `src` > `text`; `viewBox` is preserved on both leaves                                                                                                                                                                                                                                                                                                              |
| `Switch`                    | `input[type=checkbox]` styled                             | `switch`                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Slider`                    | `input[type=range]`                                       | `slider`                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ActivityIndicator`         | CSS spinner                                               | `activityindicator`                                                                            |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Modal`                     | portal into `document.body`                               | **`showModal` + a second Octane root**                                                         | ⚠ context does NOT cross roots — see below                                                                                                                                                                                                                                                                                                                                                                              |
| `SafeArea`                  | CSS `env(safe-area-inset-*)` padding                      | root-level padding + `iosOverflowSafeArea` management                                          | plus `useSafeAreaInsets()` hook                                                                                                                                                                                                                                                                                                                                                                                         |
| `KeyboardAvoiding`          | mostly unnecessary (visual viewport API)                  | scrollview + `input-accessory`/inset management                                                | iOS vs Android differ internally — acceptable leaf complexity                                                                                                                                                                                                                                                                                                                                                           |
| `WebView`                   | `iframe`                                                  | `webview`                                                                                      | probably web/native divergent enough to skip in v1                                                                                                                                                                                                                                                                                                                                                                      |
| `Overlay`/`Popover`/`Toast` | anchored `div` (floating-ui) / portal                     | `RootLayout.open(view, {shadeCover, animation})` — imperative bridge, own sub-root per overlay | getRootLayout returns FIRST registered RootLayout — app root is `<rootlayout>`; give modal roots ids (`getRootLayoutById`). One shade cover; every open/close call returns a rejecting promise — always `.catch`. Portals absent on native driver → this is the path. `showToast` also accepts `anchor` + `placement` and uses the Popover anchor path; unanchored `top-start`/`top-end`/`bottom-start`/`bottom-end` map to RootLayout alignment. |
| `Hoverable`                 | delayed hover intent + body-portal Popover                  | long-press intent + Popover                                             | Web keeps the card alive while the pointer crosses from the anchor to the portaled card. Native has no hover; `openDelay`/`closeDelay` are ignored because `longPress` is the available semantic. |
| `useMeasure`                | `getBoundingClientRect` + ResizeObserver/scroll listeners   | `getLocationOnScreen` + `getActualSize` + layout/scroll listeners          | Returns `{ bind, bounds }`; observing defaults on. Web `x/y` are viewport coordinates; native `x/y` are screen coordinates in device-independent pixels. |
| `LiquidGlass`               | `div` + `vx-glass` (backdrop-filter approximation)        | `liquidglass` (registered) — root IS an interactive `UIVisualEffectView`+`UIGlassEffect`       | real material on iOS 26+ only; inert layout on Android / iOS <26. See the Liquid Glass section                                                                                                                                                                                                                                                                                                                      |
| `LiquidGlassContainer`      | `div` + `vx-absolute`                                     | `liquidglasscontainer` (registered) — `UIGlassContainerEffect` on AbsoluteLayout               | merged-glass region — glass siblings morph together across `spacing` dips; children position via `left`/`top`                                                                                                                                                                                                                                                         |

**Child layout props are part of the shared surface** — `row`, `col`,
`rowSpan`, `colSpan`, `dock`, `left`, `top`, `flexGrow`, `flexShrink`,
`alignSelf`, `order` exist in the driver `CommonAttributes`; the web leaf maps
each to the matching CSS (`grid-row`/`grid-column`, `order`, `flex-*`). Shared
code writes `<Text row={1} col={2}/>` inside a `<Grid>` identically on both
targets.

**Native SVG** (`svgview`, `@nativescript-community/ui-svg`, required peer;
desk-source, device fidelity still unverified): `Icon` SVG/markup glyphs and
SVG-shaped `Image` sources use SVGView. The pinned `ui-svg` source accepts
inline markup, `File`/`ImageAsset`, `res://`, `~/`, absolute file paths, and
promise/function sources. Its native leaves parse strings directly; the
framework fetches remote `.svg` URLs first because SVGView itself has no URL
fetcher. SVG data URIs are decoded before they reach the view. `IconGlyph.src`
therefore supports inline SVG, SVG data URIs, and `.svg` paths/URLs; opaque
resource names whose format is not inferable stay on the image path.

The two native parsers do not form a full-fidelity contract:

| Feature | Android (`androidsvg` 1.4) | iOS (`SVGKit` 3.x) | Framework contract |
| --- | --- | --- | --- |
| Gradients | Linear gradients are supported; radial `fx`/`fy` and patterned strokes have limits | Broader gradient support, but SVGKit's release notes still describe text/gradient handling as implementation-specific | Use simple gradients when parity matters; verify complex artwork on both targets |
| Filters | SVG filter effects are not supported | SVGKit has no matching guarantee in the `ui-svg` adapter | Filters are not portable Icon artwork |
| `<text>` | Supported with limits on multi-value positioning and some text features; font resolution goes through AndroidTypeface | Supported, but SVGKit documents text handling as imperfect and depends on iOS font names | Convert icon text to paths, or use the explicit `font` fallback with registered names |
| `currentColor` | Parser supports `currentColor`; `ui-svg` has no native tint prop | SVGKit parses a root `color`, but the adapter offers no separate tint prop | Inline `markup` injects the requested root `color`/`fill`; device color readback remains a sweep item |

The supported fallback contract is: `markup`/`svg` are vector-first; `font`
requires an app-registered icon font; `src` is an image or inferable SVG
source; `text` is the last plain-label fallback. These fallbacks preserve
availability, not SVG geometry or color fidelity. Sources: [ui-svg's pinned
implementation](https://github.com/nativescript-community/ui-canvas/tree/master/src/ui-svg),
[AndroidSVG feature matrix](https://bigbadaboom.github.io/androidsvg/), and
[SVGKit's 3.x release notes](https://github.com/SVGKit/SVGKit/releases).

## The Modal seam (worst primitive leak, document early)

Native modal = a separate window/sheet hosting **its own Octane root**
(`renderNativeScriptApp` into a new `Page`/`View`, `showModal`). **Verified on iOS:**
the leaf drives `presenter.showModal(view, options)`. Children passed as
elements render fine inside the modal root — elements are data, evaluated in
whichever root renders them — so `<Modal open>{children}</Modal>` works; the
`component`/`params` contract below still stands for value-returning flows.
Readback: `presenter.modal` exposes the modal view for assertions.

> [!CAUTION]
> The signature is `showModal(viewToShow, options)`, not an options bag — a
> `{view}` first arg silently hits the deprecated moduleName path.

> [!IMPORTANT]
> Context does not cross the boundary — modal content gets a fresh root's
> context. Anything the modal needs must be passed as props/params or through
> a shared store module (not React-style context). CSS cascade doesn't cross
> either — `ns-modal` root class exists for styling modal roots; tokens must
> be applied there too. **Resolved (decision #34):** the effective scheme now
> lives in a module-level store (`theme/theme-scheme.ts`); imperative roots
> stamp `ns-dark dark` via `applyThemeClasses(host, base)` at creation and
> re-stamp live on override or OS scheme change. Apps drive it with
> `setThemePreference('dark' | 'light' | 'system')`; components read
> `useThemeScheme()`. Verified on iOS: the sheet host carries `ns-dark` under
> an app-level override (`sheet theme class: OK`).

- Portals don't cross. Design `Modal`'s API as `{ open, onClose, params }`
  rather than "render my children in place" — treat children as a _screen
  component_ rendered inside the modal root.

```ts
interface ModalProps {
  open: boolean;
  onClose?: (result?: unknown) => void;
  presentation?: 'sheet' | 'fullscreen' | 'dialog';
  component: ComponentType<any>;   // screen component, rendered in its own root
  params?: unknown;                // serializable-ish; crosses the root boundary
}
<Modal open={show} onClose={close} presentation="sheet"
       component={SettingsSheet} params={{ userId }} />
```

Plus an imperative service for flows that return a value:
`const res = await modal.open(PickerSheet, params)` — native
`showModal`'s closeCallback carries results; web resolves the same promise.

Same applies, weaker, to `Drawer` (`mainContent`/`leftDrawer` via `hostSlot` —
that's within one root, so context survives; model it as slot props
`<Drawer main={…} drawer={…}>`).

## The List contract

```ts
interface ListProps<T> {
	items: readonly T[]
	renderItem: (item: T, index: number) => unknown // a row template, not a child
	keyFor?: (item: T) => string | number
	estimatedItemHeight?: number
	onEndReached?: () => void
	className?: ClassValue
	style?: StyleObject
}
```

Native leaf internals: `<listview>` with a driver-owned `itemTemplate` and
`itemLoading`; **per-cell `createNativeScriptRoot`** mounts the row component
into each recycled slot. The driver rebinds the root with the current
`items[index]` and skips unchanged `{renderItem, item, index}` triples. The
driver's public `ListViewAttributes` exposes `renderItem`, not NativeScript's
`itemTemplates`/`itemTemplateSelector`, so a `kindFor` prop could not select
native templates honestly. Web renders `@for` rows in a scroll div.

**Desk evidence for the nesting limit:** NativeScript's iOS `ScrollView` calls
`View.measureChild` with an `UNSPECIFIED` height for vertical content. The
NativeScript iOS `ListView` then prepares each cell and measures it through its
UITableView delegate path; the Octane driver supplies those cells as recycled
`ContentView` hosts from `itemLoading`. A `ListView` under that unbounded
`ScrollView` child path reaches UIKit's `_createPreparedCellForGlobalRow`
assertion. This is a driver/platform measurement constraint, not a row-render
bug. The native leaf now rejects the mounted parent shape with an explicit
`[List] cannot be nested inside native ScrollView` error. The proving app's
`ScrollBox.native.tsrx` is the corresponding inline `View` escape hatch.

This change adds the same escape hatch to `@octane-xplat/ui`. The demo covers
the shared `ScrollBox` + `List` shape; native device verification remains lab
work, so this conclusion is marked desk-source rather than lab-verified.

**Lab findings (iOS sim, experiment 1 — `packages/ui/src/List.native.tsrx`):**

- ✅ Per-cell `createNativeScriptRoot` works: 5 visible cells → 5 roots,
  reused across waves; `root.render` re-entry updates in place.
- ⚠️ `itemLoading` refires on **every layout-affecting render** anywhere in
  the tree, not just data changes. A stable `onItemLoading` identity did not
  stop it — the trigger is native layout invalidation, not prop writes.
- ⚠️ The host↔index assignment **rotates between waves** (pool alternates
  order), so a per-host item dedup only saves the stable-center case; most
  refires are real rebinds. Cell renders stay cheap (JS-only, universal diff
  guards native writes).
- ⚠️ `e.item` lags the `ObservableArray.splice` by one wave — app data must be
  authoritative (`items[index]`), `e.item` is fallback.
- ⚠️ `useRef`-held values are **unreliable inside stale event closures**:
  `.current` resolves through draft-vs-committed hook records, so a wave
  running a pre-commit closure reads old values. Keep itemLoading state in
  module-scope maps keyed by the native objects (`ObservableArray`, host
  view) — multi-instance safe, no hook semantics.
- ⚠️ The splice's own wave is queued before the render commits, so a lone
  data change can display stale cells until the next wave. Mitigation:
  `setTimeout(() => lv.refresh(), 0)` after splice (ListView captured from
  `e.object`).
- Deeper fix belongs in the driver: `listview` should be a managed element
  whose `items` diff drives `refresh()` natively instead of leaf-level
  glue. **Reported upstream**:
  [nativescript-community/octane#1](https://github.com/nativescript-community/octane/issues/1)
  — **and shipped upstream in 0.2.1** ([#7](https://github.com/nativescript-community/octane/pull/8),
  ): the driver owns `itemTemplate`/`itemLoading` — per-cell
  ContentView + universal root, `items[index]` binding with identity-skip,
  unmount on release. Our leaf is now just `<listview items renderItem>`
  - the `renderEmpty` swap.

`renderItem` as a function prop — NOT `children` + `@for` — because the native
leaf can't feed reconciled children into `itemTemplate`. Shared code calls it
as `<List items={msgs} renderItem={(m) => <MsgRow msg={m}/>}/>`; the function
body compiles normally.

> [!WARNING]
> TSRX trap inside the web leaf: a bare `{renderItem(item)}` call in an `@for`
> body iterates but mounts nothing — items render as empty anchors. Wrap call
> results in a fragment: `<>{renderItem(item)}</>`.

> [!NOTE]
> Implementation gaps vs. this contract: the web leaf keys `@for` on `item.id`
> directly (`keyFor` is unwired — items need an `id` today), and on native
> `renderItem` should be identity-stable — `MemoListView` compares `items`
> only, so a fresh closure per render never reaches the cells.

## The Overlay/Popover/Toast contract

```ts
<Overlay open={open} onDismiss={…} shadeCover?>…in-window overlay…</Overlay>
<Popover anchor={ref} placement="top">…anchored…</Popover>
```

Native: `RootLayout.open(view, {shadeCover, animation})` — the leaf creates a
container view imperatively, opens it, mounts overlay content via a dedicated
`createNativeScriptRoot` per overlay. Same caveat as Modal: **context does not
cross into overlay content**; pass props, not context. Web: portal into
`document.body` + floating-ui-style positioning. Every `open`/`close`
returns a rejecting promise — leaf must `.catch`.

Root selection (verified on iOS, commit `af5f492`): `getRootLayout()` returns
the FIRST mounted rootlayout — wrong root after a push (overlay would land on
the home screen, invisible under the pushed page). `rootLayoutFor(view)` in
`src/root-layout.native.ts` walks `view.parent` to the enclosing `RootLayout`
— the Screen shell of the page that declared the overlay. Imperative services
with no declaring view (toast, app-level sheets) use `topRootLayout()` — the
most recently mounted shell from a ui-owned registry; `Screen` self-registers
on `loaded`/`unloaded`. (NS's internal `rootLayoutStack` can't be relied on —
deep imports can land in separate bundled module instances, so its
`getRootLayout()`/stack copy isn't the same array other packages read.)
`createPortal` is not enabled in the universal driver at all — `Popover`
opens an anchored layer via `rl.open` the same way `Overlay` does.

Caveats learned in the sweep:

- **Tab-pane shells churn.** `TabView` pane `Screen`s load/unload as panes
  switch; an imperative host attached to a pane shell can unload with it.
  Services should re-resolve per call rather than cache the rootlayout.
- **Harness asserts should hold the host view ref** (`sheetHost()`-style)
  rather than id-search the tree — the owning shell may be unloaded by the
  time the assert reads.

### Sheet — two semantics, two APIs (decision #35)

`Modal presentation='sheet'` is a *system* modal — separate window root,
native sheet on iOS. The `Sheet` primitive is the **in-window** bottom
sheet — content stays inside the app window on the declaring page's
RootLayout (native) or a `document.body` portal layer (web):

```ts
<Sheet open={open} onDismiss={…} shadeCover?>…bottom panel…</Sheet>
openSheet(Component, params) → Promise<result>   // openModal-shaped service
```

Declarative form resolves its root via the `rootLayoutFor` sentinel walk
(same as `Overlay`); the imperative service uses `topRootLayout()` and a
**fresh host + root per open** — no stale-parent reopen dance. Host carries
theme classes via `applyThemeClasses`; `closeSheet()` / `sheetHost()`
support imperative dismiss + harness asserts. iOS-verified through the
existing sheet sweep asserts.

## Liquid Glass (decision #37)

`@nativescript/core` ≥ 9.1 ships three seams the primitives wrap; all are
`supportsGlass()`-gated — `__APPLE__ && SDK_VERSION >= 26` — so everything
degrades to inert layouts on Android and iOS < 26:

| Surface                    | Wraps                         | Behavior                                                                                                                                                                                                      |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LiquidGlass`              | `liquidglass` layout          | Element root IS the glass — interactive, touch-tracking `UIGlassEffect`. Props `variant` (`'regular'`/`'clear'`, default `'regular'`), `interactive` (default `true`), `tint`, `animateChangeDuration`            |
| `LiquidGlassContainer`     | `liquidglasscontainer` layout | `UIGlassContainerEffect` region — sibling glass views morph together across `spacing` (default 8). AbsoluteLayout host: children position via `left`/`top`, or nest layout primitives inside                    |
| `glass` prop on containers | `iosGlassEffect` View prop    | `View`/`Stack`/`Grid`/`Row`/`Absolute`/`Pressable`/`ScrollView` take `glass={true \| 'regular' \| 'clear' \| GlassConfig}` — background glass inserted behind the view's content. **Never interactive upstream** |

Caveats found reading the 9.1.2 implementation:

- **Always pass `iosGlassEffect` a config object.** The string shorthand
  (`'regular'`) rebuilds the `UIGlassEffect` with `interactive` unset —
  `LiquidGlass` loses its touch-tracking on prop updates. The leafs
  normalize through `glass.ts` so shared code never hits this.
- The generic-view glass (`glass` prop) inserts a non-interactive
  `UIVisualEffectView` at index 0 and sizes it a `setTimeout` after mount —
  real interactive glass requires the `LiquidGlass` layout, not the prop.
- `spacing`/`interactive`/`animateChangeDuration` read only from a config
  object, and `spacing` applies only on the container's `effectType`.
- Verification needs an **Xcode ≥ 26 build** — NS metadata for
  `UIGlassEffect`/`UIGlassContainerEffect` is generated from the SDK at
  build time; `supportsGlass()` checks only the runtime version.
- Web is an approximation: `vx-glass` = `backdrop-filter` + translucent
  surface behind `@supports`; `tint` becomes the surface color; no
  merging or touch-tracking. The class is also stamped on native so apps
  can CSS their own fallback for non-glass OSes.

**Verified (iOS 26.5 sim, Xcode 26.6):** `liquidglass`/`liquidglasscontainer`
mount with `UIVisualEffectView` roots carrying live `UIGlassEffect` /
`UIGlassContainerEffect`; `glass` prop round-trips `iosGlassEffect` on the
host view — all sweep asserts green.

## Pressable & input conventions

```ts
interface PressableProps {
	onPress?
	onLongPress?
	onDoublePress?
	onPressIn?
	onPressOut?
	disabled?
	hitSlop?: number
	ignoreTouchAnimation?: boolean // opts out of TouchManager global press-scale
	className?
	style?
}
interface TextInputProps {
	value: string
	onChangeText?: (text: string) => void // NOT onChange(event) — RN convention
	onSubmit?
	onFocus?
	onBlur?
	placeholder?
	placeholderTextColor?
	keyboardType?
	returnKeyType?
	autocorrect?
	secure?
	editable?
	ref?: Ref<{ focus(): void; blur(): void }>
}
interface TextAreaProps extends TextInputProps {
	// shipped (props.ts)
	rows?: number // web `rows` attr / native minHeight (measured line height)
	autoGrow?: boolean // native default; web re-fits scrollHeight per commit
	maxRows?: number // cap → max-height (web) / maxHeight dip (native)
}
```

- `Pressable` native leaf: `flexboxlayout` (column) + `tap`/`longPress`
  gesture events — **not** `contentview` (single-child trap: the driver
  assigns each child to `.content`, dropping all but the last sibling);
  press feedback rides `TouchManager.enableGlobalTapAnimations` (ns-octane
  enables it globally — scale 0.95/1.0 easeOut) + the `vx-pressable`
  `:pressed` pseudo. Web leaf: `div` + pointer events + `:pressed` class
  hook for styling.
- **Single-child hosts on native**: `ContentView`/`Page` (and `ScrollView`)
  keep only the last reconciled child. Any imperative Octane root must host
  on a `GridLayout` (children fill + stack — single-child layout identical
  to ContentView) — or set `page.content = grid` and root on that where the
  host must be a `Page`. Applies to Modal, Tabs panes, nav pushes, and
  overlay/sheet hosts. List cells are driver-owned `ContentView`s, so the
  `List` leaf wraps `renderItem` output in a `gridlayout`.
- `className` on native must be a **space-joined string**: the driver
  applies it via `String(value)`, so an array arrives comma-joined and
  matches nothing. Leaves normalize with `cx()` (`packages/ui/src/cx.ts`).
- `TextInput` native: `textfield`/`textview`; `value` ↔ `text`; `onChangeText`
  ↔ `textChange`; `onSubmit` ↔ `returnPress`. Controlled write-back verified
  with **real keyboard input** (idb `ui text`): per-keystroke `textChange`
  accumulates correctly through `onChange → set → text=` and the selection
  survives the controlled writes. IME marked-text composition remains
  untested; Android still the higher-risk platform for setText cursor reset.
- **`Screen` children flow inside one inner flex column** (decision #39).
  RootLayout gives every direct child the full root bounds — siblings stack
  in document order and a later sibling's invisible area eats taps meant for
  earlier ones (pushed-page header Row measured at the full root height,
  dead under the content View's overlap). The leaf renders one flexbox
  wrapper; app children are never direct rootlayout children.
- **Omitted props must not write `undefined`** (decision #40): the driver's
  `setProp` returns early on `undefined`. NS coerces `undefined` through
  native setters — `editable={undefined}` became `userInteractionEnabled=NO`:
  the field rendered with listeners but could never become first responder
  (real taps and `becomeFirstResponder()` both failed while AX tree looked
  normal). Leaves still default `editable ?? true` as documentation.
- **Verify interaction with real input, not `notify()`**: `view.notify({tap})`
  delivers events without hit-testing — taps "worked" on views that were dead
  (stale JS node, `loaded=false`, no recognizers) or physically unreachable.
  idb/`ios-simulator-mcp` real UITouch + AX tree is the honest check.
- Escape-hatch prop bags (`ios`/`android`/`web`) carry genuinely divergent
  props; `hostSlot` stays leaf-internal — shared code expresses slots as props
  (`<Drawer main={…}>`), never the mechanism name.

## Text details

### RichText

`RichText` is the portable primitive for mixed inline formatting and tappable
runs:

```tsx
<RichText>
	<RichTextSpan text="Read " />
	<RichTextSpan className="link" onPress={openProfile} text="@alec" />
	<RichTextSpan text="'s post." />
</RichText>
```

The web leaf composes inline DOM spans. The native leaf renders one `label`
with a `formattedstring` child; `RichTextSpan` becomes a NativeScript `span`
with explicit `text` and `onLinkTap`. The explicit text assignment matters:
the current driver parents `FormattedString` → `Span`, but folding bare text
children into `Span.text` is part of provisional decision #25. A single string
child is accepted as a convenience and is normalized by the native leaf.

Use `className` for static run styles, `style` for dynamic values, and
`onPress` for a run-level tap. The root accepts only inline run children — do
not place `View` or other layout primitives inside it.

- Static text in shared code: `<Text>Hello {name}</Text>` — the native driver
  folds `#text` into `text` prop automatically (TextBase parents only).
- **Nested text = RN model.** `<Text>Hello <Text className="bold">world</Text></Text>`
  works on both targets. Mechanism on native:
  - `Text` leaf renders `<label>`; nested `Text` reads a `TextContext`
    (universal `createContext`/`useContext` — verified available) and renders
    `<span>` instead.
  - NS rich text is **flat**: one `formattedstring` with sibling `span`s —
    styled spans cannot nest as elements. The context carries accumulated
    `className`/`style` so inner spans inherit outer text styling; deeper
    nesting flattens into siblings (documented divergence from web, where
    spans nest).
- **Requires two driver extensions** (patch-package now,
  upstream PR candidate):
  1. `addViewChild`: `Span` under a `TextBase` parent auto-wraps into
     `formattedText` (create `FormattedString` lazily, splice at index).
  2. `syncText`/`attach`: `#text` under `formattedstring` folds into an
     implicit `Span`; `#text` under `span` sets `span.text` (note: Span.text
     collapses only the first `\n`/`\t` — acceptable).
     Without these, `<label><span/></label>` throws (`cannot host a <span>
child`) and text under `formattedstring` drops silently.
- **Exclusive-text rule**: `text` assignments are silent no-ops while
  `formattedText` is set — never mix bare text children and `Span` children
  under one `Text`… except via the accumulated-context path above, which
  normalizes strings into spans when siblings are elements. The leaf
  implements this normalization (children are inspectable renderable values);
  shared code just writes natural JSX.
- Span props: `color` (no `foregroundColor`), `fontSize`, `fontWeight`,
  `fontStyle`, `textDecoration`, `backgroundColor`; `linkTap` listener alone
  makes a span tappable → `onPress` on a nested `Text` maps to it.
- `numberOfLines`, `selectable` (native: `textview editable=false` is the
  closest analog — prop support differs), ellipsize — escape hatches.
- `line-height` on NS means **additive inter-line spacing**, not web's total
  line box — typography tokens must express the NS value (gap) vs web value
  (box height) distinctly.
- `Heading level={1-6}` primitive: `h1–h6` on web (semantic HTML matters —
  ); `label` + `className="h{n}"` + a11y role on native.

## Refs

Octane refs-as-props work on both, but the _ref value_ differs (HTMLElement vs
NS `View`). Public contract: each primitive exposes a typed handle —
`TextInputRef { focus(); blur(); }` — implemented per platform. Raw native
view access stays behind `ref.native` escape hatch, marked "shared code must
not touch this."

## What primitives deliberately do NOT do

- `useMeasure` observes by default. Use `{ observe: false }` when a single
  post-bind read is enough; native still listens for the initial `loaded` event
  so an early ref bind can settle after layout.
- No attempt to unify `listview` recycling with DOM virtualization semantics
  beyond the `items`/`renderItem` contract.
- No `<style>` blocks inside shared components — sibling-scoped style blocks
  are a web feature; keep styles in the shared stylesheet + `className`.

## Appendix: verified driver semantics

Substrate pass findings — the mechanics that constrain everything above.
Kept at the end so the vocabulary reads first.

- **Text folds into `text` prop only under `TextBase` parents.** A `<label>`
  (or `<button>`, `formattedstring`) takes `#text` children; a `<stacklayout>`
  with text children **silently drops them**. → Bare text lives only inside
  text-hosting primitives (`Text`, `Button`, heading variants). Enforce at
  compile time via renderer `validation.textHosts`/`textParents` (decision
  #20) and at lint level.
- **Prop = direct view property assignment** (`view[name] = value`) — NS view
  properties, not DOM attributes. Type system derives props from the class
  (`ViewProperties<T>`), so unsupported props are type errors; unknown ones at
  runtime fail silently.
- **`style` object → `Object.assign(view.style, v)`**: camelCase `Style` keys,
  **dip units**. `style` string → `setInlineStyle` (CSS declarations).
- **`className`/`class` arrive as composed strings** (clsx upstream). Trap:
  NS className swap can leave stale backgrounds — workaround is
  `view.className=''` before the new value; driver currently assigns directly.
  Track whether we need a leaf-level or upstream fix.
- **Events arrive as `event` commands**, not props; `onTap`/`onClick`/
  `onPress`→`tap`, `onChange`→`textChange`, `onSubmit`→`returnPress`,
  `onX`→`x` lowercase-first. All classified `'discrete'` — watch whether
  continuous events (pan) need a priority lane.
- **`hostSlot` prop** wires a child into a named parent property
  (`mainContent`/`leftDrawer`) instead of `addChild` — our slot-prop pattern
  for Drawer/ActionBar.
- **Parenting throws** when a parent can't host a child type
  (`cannot host a <x> child`) — a runtime error class shared code avoids by
  staying inside the primitive vocabulary.
- **No portals on the NS driver** (capability absent — `createPortal` is a
  no-op) — `Overlay`/`Popover` open on `RootLayout.open()` with a dedicated
  `createNativeScriptRoot` per overlay (decisions #22, #33). The owning root
  is the declaring component's enclosing `Screen` shell via
  `rootLayoutFor(view)`, not `getRootLayout()` (which is the first-mounted
  root — wrong page after a push). **Verified in lab (Exp 9 + sweep)**:
  popover anchored + shade overlay on a pushed page assert OK on iOS.
- **`@{ {expr} }` tails silently compile to no output** — a braced
  expression at the end of a component template is a _statement_, not
  output. `Cell` rendered empty for an entire session undetected (no
  diagnostic). This IS documented in the TSRX spec
  (`research/tsrx/website-tsrx/public/llms.txt`: "the container must finish
  with exactly one output node… expression containers need a wrapping
  fragment") — the gap is a missing compile diagnostic, not semantics.
  Tail must be an output node: `<>{expr}</>`.
  Reported: [octanejs/octane#1258](https://github.com/octanejs/octane/issues/1258).
- **`<tabview>` can't parent `<tabviewitem>` children** — the driver's
  `addViewChild` throws for non-layout parents. The `Tabs` leaf uses the
  List pattern: `items` prop of `TabViewItem[]` whose `.view` is a
  `ContentView` hosting a per-pane `createNativeScriptRoot` (mounted on the
  tabview's `loaded` event). `items` for TabView is NOT driver-managed
  (ListView-only) — the leaf caches `TabViewItem[]` per tabs-array
  reference. **Same "managed items" ask as listview** — fold into the
  octane#1 upstream work.
- **Prop-write echoes are generic** — `checked`→`checkedChange`,
  `selectedIndex`→`selectedIndexChanged` echo just like `text`→`textChange`.
  Fixed in the driver patch (pendingPropWrites drops a write's own echo);
  leafs need no guards.
- **`visibility` command** maps `hidden`→`collapse` (out of layout AND screen).
- **Element re-registration recreates live instances in place** — plugin-view
  modules hot-reload cleanly; keep `registerElement` modules self-accepting.
