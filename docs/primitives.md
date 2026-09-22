# Primitives (`packages/ui`)

> The cross-platform vocabulary. Every primitive is an interface (`.ts` types)
> plus leaf impls (`.web.tsrx` / `.native.tsrx`, occasionally `.ios`/`.android`).
> Shared code imports the interface only. Design rule from RNW: converge on the
> *constrained* vocabulary — never the DOM's open one.
>
> **Owns:** #1 primitives contract · **Status:** mapped; driver mechanics
> verified · **Blocks on:** lab — Q3 (listview), Q4 (controlled inputs) ·
> **Decisions:** #3, #6, #9, #16, #21, #22, #24 · **Validated by:** prototype —
> counter + `@for` list + controlled `TextInput` + `Pressable` on both targets.

## Verified driver semantics (substrate pass — these constrain everything)

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
- **No portals on the NS driver** (capability absent) — `Overlay`/`Popover`
  get a `RootLayout.open()` imperative bridge (decision #22).
- **`visibility` command** maps `hidden`→`collapse` (out of layout AND screen).
- **Element re-registration recreates live instances in place** — plugin-view
  modules hot-reload cleanly; keep `registerElement` modules self-accepting.

## Prop conventions (applies to every primitive)

```ts
interface PrimitiveProps {
  className?: ClassValue;                    // clsx-style — works both targets
  style?: StyleObject;                       // dynamic values only
  ref?: Ref<TypedHandle>;                    // typed imperative handle per primitive
  children?: unknown;
  // platform escape hatches — props, not files, for small divergences:
  ios?: Partial<NativeProps>; android?: Partial<NativeProps>; web?: DOMProps;
}
```

- `className` composes via clsx on both targets (native: through NS CSS).
- `style` object → DOM `style` / NS `view.style`. **Numbers mean dip on native,
  px on web** — normalize inside the leaf, never in shared code.
- Event props use shared names (`onPress`, `onChange`, `onSubmit`); native leaf
  maps to `tap`/`textChange`/`returnPress` (driver already aliases these).
- Escape-hatch prop bags keep 90% of divergences out of file splits.

## Core inventory

| Primitive | Web leaf | Native leaf | Notes / seams |
|---|---|---|---|
| `View` | `div` | `contentview` | default neutral container |
| `Row` / `Column` | `div` flex | `stacklayout` (`orientation`) | most common layout |
| `Stack` (z-order) | `div` grid/relative | `gridlayout` `*` cell overlay | children stack in one cell |
| `Grid` | `div` grid | `gridlayout` rows/cols | shared prop shape `rows="*,auto"` — CSS grid template vs NS string; map deliberately |
| `Absolute` | `div` + `position:absolute` | `absolutelayout` | **native has no `position` CSS** — must be a container element, matching anyway |
| `Text` | `span`/`p` | `label` | children: text or `Text` only (nested → `formattedstring`/`span`); **never `View` inside `Text`** — adopt RN rule |
| `RichText`? | inline markup | `formattedstring` + `span` leaves | possibly fold into `Text` nesting |
| `Pressable` | `div`+pointer events | `contentview`+`tap`/`touch` | hover/pressed states → CSS vs manual touch tracking; use `button` leaf only where native button chrome wanted |
| `ScrollView` | `div` overflow | `scrollview` | `horizontal` prop both sides |
| `List` | `@octanejs/tanstack-virtual` over `div` | `listview` + **per-cell Octane sub-roots** | **the leak**: ListView recycles via `itemTemplate`/`itemLoading` (imperative view factories — no reconciler children). Design: each recycled slot hosts a `createNativeScriptRoot`; `itemLoading` rebinds `{item, index}` into a per-cell store the row component reads; `items` wrapped as `ObservableArray` for granular updates; `itemTemplateSelector` for heterogeneous rows. Lab: per-cell root cost, scroll perf (decision #21) |
| `TextInput` / `TextArea` | `input`/`textarea` | `textfield`/`textview` | controlled `value` ↔ `text`; check cursor/IME fights (open-questions); `returnKeyType`, `autocorrect`, keyboard types all differ |
| `Image` | `img` | `image` | `src`: URL/`res://`/`~/` — asset resolution differs; sizing via CSS both sides |
| `Icon` | inline SVG (lucide-style) | `sf-icon` pattern — `image` + symbol config, font fallback on Android | name → per-platform glyph map |
| `Switch` | `input[type=checkbox]` styled | `switch` | |
| `Slider` | `input[type=range]` | `slider` | |
| `ActivityIndicator` | CSS spinner | `activityindicator` | |
| `Modal` | portal into `document.body` | **`showModal` + a second Octane root** | ⚠ context does NOT cross roots — see below |
| `SafeArea` | CSS `env(safe-area-inset-*)` padding | root-level padding + `iosOverflowSafeArea` management | plus `useSafeAreaInsets()` hook |
| `KeyboardAvoiding` | mostly unnecessary (visual viewport API) | scrollview + `input-accessory`/inset management | iOS vs Android differ internally — acceptable leaf complexity |
| `WebView` | `iframe` | `webview` | probably web/native divergent enough to skip in v1 |
| `Overlay`/`Popover`/`Toast` | anchored `div` (floating-ui) / portal | `RootLayout.open(view, {shadeCover, animation})` — imperative bridge, own sub-root per overlay | getRootLayout returns FIRST registered RootLayout — app root is `<rootlayout>`; give modal roots ids (`getRootLayoutById`). One shade cover; every open/close call returns a rejecting promise — always `.catch`. Portals absent on native driver → this is the path (decision #22) |

## The Modal seam (worst primitive leak, document early)

Native modal = a separate window/sheet hosting **its own Octane root**
(`renderNativeScriptApp` into a new `Page`/`View`, `showModal`). Consequences:

- Context does not cross the boundary — modal content gets a fresh root's
  context. Anything the modal needs must be passed as props/params or through
  a shared store module (not React-style context).
- CSS cascade doesn't cross either — `ns-modal` root class exists for styling
  modal roots; tokens must be applied there too.
- Portals don't cross. Design `Modal`'s API as `{ open, onClose, params }`
  rather than "render my children in place" — treat children as a *screen
  component* rendered inside the modal root.

Same applies, weaker, to `Drawer` (`mainContent`/`leftDrawer` via `hostSlot` —
that's within one root, so context survives; model it as slot props).

## Text details

- Static text in shared code: `<Text>Hello {name}</Text>` — the native driver
  folds `#text` into `text` prop automatically.
- Formatting spans: `<Text>…<Text className="bold">x</Text></Text>` → nested
  `span` in `formattedstring` on native. Keep nesting shallow (font/weight/
  color only).
- **Exclusive-text rule**: a text view with `formattedText` set ignores `text`
  assignments (silent no-op). → A `Text` node takes EITHER text children OR
  `Span` children, never both. Enforce in types.
- Span props: `color` (no `foregroundColor`), `fontSize`, `fontWeight`,
  `fontStyle`, `textDecoration`, `backgroundColor`; `Span.text` collapses only
  the FIRST `\n`/`\t`; a `linkTap` listener alone makes a span tappable.
- `numberOfLines`, `selectable`, ellipsize — per-platform prop support differs;
  escape hatches.
- `line-height` on NS means **additive inter-line spacing**, not web's total
  line box — typography tokens must express the NS value (gap) vs web value
  (box height) distinctly.

## Refs

Octane refs-as-props work on both, but the *ref value* differs (HTMLElement vs
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
