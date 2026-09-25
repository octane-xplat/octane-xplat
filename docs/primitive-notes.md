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
| `RichText`?                 | inline markup                                             | `formattedstring` + `span` leaves                                                              | possibly fold into `Text` nesting                                                                                                                                                                                                                                                                                                                                                                                       |
| `Pressable`                 | `div`+pointer events                                      | `flexboxlayout` `flexDirection=column` + `tap`/`longPress`                                     | **multi-child** — `contentview` silently drops all but the last child (`.content` assignment); tap gestures attach to any view. Use `button` leaf only where native button chrome wanted                                                                                                                                                                                                                                |
| `ScrollView`                | `div` overflow                                            | `scrollview`                                                                                   | `horizontal` prop both sides                                                                                                                                                                                                                                                                                                                                                                                            |
| `List`                      | `@octanejs/tanstack-virtual` over `div`                   | `listview` + **per-cell Octane sub-roots**                                                     | **the leak**: ListView recycles via `itemTemplate`/`itemLoading` (imperative view factories — no reconciler children). Design: each recycled slot hosts a `createNativeScriptRoot`; `itemLoading` rebinds `{item, index}` into a per-cell store the row component reads; `items` wrapped as `ObservableArray` for granular updates; `itemTemplateSelector` for heterogeneous rows. Lab: per-cell root cost, scroll perf |
| `TextInput` / `TextArea`    | `input`/`textarea`                                        | `textfield`/`textview`                                                                         | controlled `value` ↔ `text`; check cursor/IME fights (open-questions); `returnKeyType`, `autocorrect`, keyboard types all differ. `TextArea` shipped: `rows`/`autoGrow`/`maxRows` — web auto-grow via scrollHeight re-fit; native TextView grows by default, row counts → `min/maxHeight` dips at the widget's measured line height (its `maxLines` is truncation-only on iOS)                                          |
| `Image`                     | `img`                                                     | `image`; svg srcs → `svgview` (ui-svg)                                                         | `src`: URL/`res://`/`~/`/data: URI plus inline `<svg>` markup, svg data URIs, `.svg` paths/URLs; remote `.svg` fetches→markup (SVGView awaits promise srcs)                                                                                                                                                                                                                                                             |
| `Icon`                      | inline SVG (lucide-style)                                 | `svgview` (ui-svg → SVGKit/androidsvg) for `svg`/`markup`                                      | name → per-platform glyph map; precedence `markup`/`svg` > `font` > `src` > `text`                                                                                                                                                                                                                                                                                                                                      |
| `Switch`                    | `input[type=checkbox]` styled                             | `switch`                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Slider`                    | `input[type=range]`                                       | `slider`                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ActivityIndicator`         | CSS spinner                                               | `activityindicator`                                                                            |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Modal`                     | portal into `document.body`                               | **`showModal` + a second Octane root**                                                         | ⚠ context does NOT cross roots — see below                                                                                                                                                                                                                                                                                                                                                                              |
| `SafeArea`                  | CSS `env(safe-area-inset-*)` padding                      | root-level padding + `iosOverflowSafeArea` management                                          | plus `useSafeAreaInsets()` hook                                                                                                                                                                                                                                                                                                                                                                                         |
| `KeyboardAvoiding`          | mostly unnecessary (visual viewport API)                  | scrollview + `input-accessory`/inset management                                                | iOS vs Android differ internally — acceptable leaf complexity                                                                                                                                                                                                                                                                                                                                                           |
| `WebView`                   | `iframe`                                                  | `webview`                                                                                      | probably web/native divergent enough to skip in v1                                                                                                                                                                                                                                                                                                                                                                      |
| `Overlay`/`Popover`/`Toast` | anchored `div` (floating-ui) / portal                     | `RootLayout.open(view, {shadeCover, animation})` — imperative bridge, own sub-root per overlay | getRootLayout returns FIRST registered RootLayout — app root is `<rootlayout>`; give modal roots ids (`getRootLayoutById`). One shade cover; every open/close call returns a rejecting promise — always `.catch`. Portals absent on native driver → this is the path                                                                                                                                                    |

**Child layout props are part of the shared surface** — `row`, `col`,
`rowSpan`, `colSpan`, `dock`, `left`, `top`, `flexGrow`, `flexShrink`,
`alignSelf`, `order` exist in the driver `CommonAttributes`; the web leaf maps
each to the matching CSS (`grid-row`/`grid-column`, `order`, `flex-*`). Shared
code writes `<Text row={1} col={2}/>` inside a `<Grid>` identically on both
targets.

**Native SVG** (`svgview`, `@nativescript-community/ui-svg`, required peer):
`Icon` SVG/markup glyphs and SVG-shaped `Image` sources use SVGView —
androidsvg on Android and SVGKit on iOS. Path glyphs synthesize an SVG path;
markup glyphs are wrapped in an SVG root. `Image` recognizes inline markup,
SVG data URIs, and `.svg` paths/URLs; remote URLs fetch to markup because
SVGView has no fetch of its own. Native fidelity remains open in Q21.

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
	kindFor?: (item: T) => string // → itemTemplateSelector (v2)
	estimatedItemHeight?: number
	onEndReached?: () => void
	className?: ClassValue
	style?: StyleObject
}
```

Native leaf internals: `<listview>` with an `itemTemplate` that
vends a recycled container; **per-cell `createNativeScriptRoot`** mounts the
row component into each slot; `itemLoading` rebinds by re-calling
`root.render(Row, { item, index })` on the recycled slot's root (verify
`render` re-entry updates rather than remounts — lab). `items`→`ObservableArray`
adapter for granular native updates (`refresh()` re-fires every `itemLoading`
— avoid). Web leaf: `@for` over `items` in a scroll div; virtualize via
`@octanejs/tanstack-virtual` binding if DOM-free (verify).

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
  ↔ `textChange`; `onSubmit` ↔ `returnPress`. Cursor/IME write-back risk is
  the queued lab experiment.
- Escape-hatch prop bags (`ios`/`android`/`web`) carry genuinely divergent
  props; `hostSlot` stays leaf-internal — shared code expresses slots as props
  (`<Drawer main={…}>`), never the mechanism name.

## Text details

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

- No geometry/measurement API in v1 (native `getActualSize`, web
  `getBoundingClientRect` — expose later as `useMeasure` if needed).
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
