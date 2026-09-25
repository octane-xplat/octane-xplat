# Components — the shared vocabulary

Import everything from `@octane-xplat/ui`. Each component has a web leaf
(DOM) and a native leaf (NativeScript view) — the JSX is identical on both.

| Need | Component(s) |
| --- | --- |
| Layout | `View` (aliased `Column`), `Row`, `Grid`, `Stack`, `Absolute`, `Spacer`, `SafeArea`, `KeyboardAvoiding` |
| Text | `Text`, `Heading`, `RichText` + `RichTextSpan` |
| Tap/hover | `Pressable`, `Link`, `NavLink`, `Hoverable` |
| Input | `TextInput`, `TextArea`, `Switch`, `Slider` |
| Collections | `List` |
| Scrolling | `ScrollView`, `ScrollBox` |
| Media | `Image`, `Icon` (`registerIcon`/`registerIcons` for glyphs) |
| Feedback | `ActivityIndicator`, `Meter`, `showToast` |
| Overlays | `Modal`/`openModal`, `Sheet`/`openSheet`/`closeSheet`, `Overlay`, `Popover`, `Drawer`, `openWindow` |
| Shells | `Screen`, `Tabs` (+ `TabSpec`) |
| Animation | `useAnimation` → `AnimatedValue` |
| Theme/measure | `useColorScheme`/`getColorScheme`, `useSafeAreaInsets`, `useMeasure`, `styled()`, `createStore` |

## Divergences that matter

- `ScrollBox` is a **name trap**: on native it's a plain, non-scrolling
  container (a `List` inside it owns scrolling). Use `ScrollView` when you
  actually want a scroller.
- `List` is not virtualized on web. On native it must not sit inside a
  `ScrollView` — two scrollers fight and the framework throws.
- `TextArea` `onSubmit`: web fires on Cmd/Ctrl+Enter; native fires only
  when `returnKeyType` is `"done"` or `"send"` — otherwise every newline
  reports as a submit.
- `Modal` on Android: a non-fullscreen modal shows as a centered dialog,
  not a bottom sheet. Context and theme don't cross overlay roots — read
  them inside the overlay or pass values down.
- `Sheet`/`openSheet` is a bottom-anchored sheet on both platforms; on web
  it renders an in-window portal layer over the app.
- `Drawer` has an edge-swipe gesture on native only — give web users a
  visible toggle.
- `RichTextSpan` children carry their own `className`/`style`/`onPress`;
  native maps spans to `FormattedString` runs.
- Accessibility props (`accessible`, label, hint, role, state, live
  region) share names across targets; native translates roles such as
  `heading` → `header`.

## Things that look right but aren't

- `PlatformBadge` is an internal probe, not app vocabulary — don't use it.
- `keyFor` on `List` is web-only.
- Route `params` must be scalar (see navigation reference) — objects work
  on native but are silently dropped on web.
