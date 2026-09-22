# Primitives (`packages/ui`)

> The cross-platform vocabulary. Every primitive is an interface (`.ts` types)
> plus leaf impls (`.web.tsrx` / `.native.tsrx`, occasionally `.ios`/`.android`).
> Shared code imports the interface only. Design rule from RNW: converge on the
> *constrained* vocabulary — never the DOM's open one.

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
| `List` | `@octanejs/tanstack-virtual` over `div` | `listview` (or collectionview plugin) | **the leak**: NS ListView uses item templates, not children — API must be `items`/`renderItem`, not `@for` children. Verify template mechanics (open-questions) |
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
| `Overlay`/`Popover` | anchored `div` (floating-ui) | `rootlayout` overlay / `showModal` | menus: `@nstudio/nativescript-menu` registers `menu`/`contextMenu` props — expose as `Menu` primitive |

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
- `numberOfLines`, `selectable`, ellipsize — per-platform prop support differs;
  escape hatches.

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
