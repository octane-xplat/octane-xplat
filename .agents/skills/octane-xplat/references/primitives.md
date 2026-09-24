# Primitives

Every component ships as platform leaves: `X.web.tsrx` + `X.native.tsrx`
(+ `.ios`/`.android` overrides). Shared code imports the unsuffixed name and
gets the leaf matching the build's suffix chain.

**Prop types live in `packages/ui/src/props.ts`** — the single source
consumed by both leaves AND the published boundary types. Add/change props
there; leaf signatures are `props: XProps`.

## Catalog

| Component       | Props                                                                                                               | Notes                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `View`          | `className, style, children, id, bind, onPan, onSwipe`                                                              | Flex-column default (RN-shaped). `bind` → the intrinsic's `ref` (`ref` is runtime-reserved). `Column` is an alias.                                                                                                                                                                                                                                           |
| `Row`           | `className, style, children`                                                                                        | Flex-row.                                                                                                                                                                                                                                                                                                                                                    |
| `Text`          | `className, style, children`                                                                                        | `<span>` / `<label>`.                                                                                                                                                                                                                                                                                                                                        |
| `Pressable`     | `className, style, children, id, disabled, onPress, onLongPress, accessible, accessibilityLabel, accessibilityRole` | `div[role=button]` / `<flexboxlayout>` (column) + tap. Long-press: ~500ms hold (web: pointer timer).                                                                                                                                                                                                                                                         |
| `TextInput`     | `className, style, id, value, placeholder, hint, onChange(value)`                                                   | Controlled — driver handles write-back echo suppression. `hint` maps to `placeholder` on web.                                                                                                                                                                                                                                                                |
| `TextArea`      | `TextInputProps + rows, autoGrow, maxRows`                                                                          | `textarea`/`textview`. `autoGrow` re-fits web height per commit (scrollHeight), capped by `maxRows`→`max-height` at computed line-height. Native TextView grows by default; `rows`/`maxRows` → `minHeight`/`maxHeight` dips at the widget's measured line height (`maxLines` is truncation-only on iOS — not a cap). Explicit `style.height` wins on native. |
| `List`          | `className, style, id, items, renderItem(item), renderEmpty`                                                        | Real `ListView` on native (virtualized cells); `@for` + empty block on web. Cells get platform-native recycling — keyed items.                                                                                                                                                                                                                               |
| `ScrollView`    | `className, style, id, horizontal, children`                                                                        | NS ScrollView is single-child — the leaf wraps children in a flexbox content container.                                                                                                                                                                                                                                                                      |
| `Image`         | `className, style, id, src, alt`                                                                                    | `src` accepts URL or `data:` URI on both.                                                                                                                                                                                                                                                                                                                    |
| `Modal`         | `open, onClose, fullscreen, children`                                                                               | `<dialog>` on web; `showModal` second root on native — children mount a NEW root (no shared context with presenter).                                                                                                                                                                                                                                         |
| `Screen`        | `className, style, children`                                                                                        | Page/root shell; RootLayout on native (overlay host).                                                                                                                                                                                                                                                                                                        |
| `Tabs`          | `className, style, id, tabs: TabSpec[], selectedIndex?, onSelectedIndexChanged?, resolveScreen?`                    | Button-row + pane (web) / `TabView` (native). See navigation.md for `stack` panes + outlets.                                                                                                                                                                                                                                                                 |
| `Switch`        | `className, style, id, checked, onCheckedChange(checked)`                                                           | Driver suppresses checked write-back echo.                                                                                                                                                                                                                                                                                                                   |
| `PlatformBadge` | `className`                                                                                                         | Probe component — renders the platform name.                                                                                                                                                                                                                                                                                                                 |
| `styled`        | `styled(Base, { base?, variants? })`                                                                                | Returns component accepting `P & {variant names as boolean flags}` → composes `className`.                                                                                                                                                                                                                                                                   |

## Conventions

- `className` composes: leaves prepend their own `vx-*` class
  (`['vx-pressable', props.className]`).
- `id` sets the element id — probes find views by it (`getViewById` on
  native, DOM id on web).
- Event payloads normalize across platforms: pan →
  `{x,y,dx,dy,vx,vy,state,target}` (`state` ∈ began/moved/ended/cancelled —
  web velocity real, native `vx/vy` 0 until the native recognizer wiring
  lands), swipe → `{direction}`.
- `children` is `any` — universal renderable; don't over-type it.
- A11y: `accessible`, `accessibilityLabel`, `accessibilityRole` map to
  `aria-*`/native attrs (see platform-services.md in docs for the full map).

## What primitives deliberately don't do

No theming props (tokens + classes own that), no layout props beyond
flex shorthand via classes, no web-only extras (`.native` gets parity),
no state — components are controlled or uncontrolled per prop, never both.
