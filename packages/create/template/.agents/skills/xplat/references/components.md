# Components — the vocabulary

Every shared component imports from `@octane-xplat/ui` and owns its pixels —
same props, same pixels on every target. Platform-authentic widgets (real
OS chrome) live behind `@octane-xplat/ui/ios` and `@octane-xplat/ui/android`
under their official OS names — those subpaths resolve only in native
builds and are the honest opt-in for "I want the platform widget." A shared
`.tsrx` file that imports them fails the other platform's build on purpose;
import them inside `.ios.tsrx`/`.android.tsrx`/`.native.tsrx` leaves.

## Shared — `@octane-xplat/ui` (self-drawn, same pixels everywhere)

| Need          | Component(s)                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Layout        | `View` (aliased `Column`), `Row`, `Grid`, `Stack`, `Absolute`, `Spacer`, `SafeArea`             |
| Text          | `Text`, `Heading`, `RichText` + `RichTextSpan`                                                  |
| Tap           | `Pressable`, `Link`, `NavLink`                                                                  |
| Input         | `TextInput`, `TextArea`, `Switch`, `Slider`                                                     |
| Scrolling     | `ScrollView`, `ScrollBox`                                                                       |
| Media         | `Image`, `Icon` (`registerIcon`/`registerIcons` for glyphs)                                     |
| Feedback      | `ActivityIndicator`, `Meter`, `showToast`                                                       |
| Overlays      | `Sheet`/`openSheet`/`closeSheet`, `Overlay`, `Popover`, `Drawer`, `openWindow`                  |
| Shells        | `Screen`, `Tabs` (+ `TabSpec`)                                                                  |
| Animation     | `useAnimation` → `AnimatedValue`                                                                |
| Theme/measure | `useColorScheme`/`getColorScheme`, `useSafeAreaInsets`, `useMeasure`, `styled()`, `createStore` |

`Switch`, `Slider`, `ActivityIndicator`, `Tabs`, and `Drawer` are drawn by
the framework — the OS widget is deliberately not what you get. For a list,
compose `ScrollView` + mapped children; there is no shared recycled list.

## Normalized OS widgets (shared, unavoidable platform controls)

`TextInput`, `TextArea`, `ScrollView`/`ScrollBox` render through the real
OS text/scroll controls — self-drawing them would lose IME, secure entry,
selection, and autofill. The framework resets their chrome (no platform
underline/border/padding, normalized font/color/placeholder/focus) so the
same `className`/`style` lands on the same box. What stays platform-native
by design: caret and selection UI, autocorrect/IME toolbars, keyboard
types, scroll physics and overscroll.

## Platform-authentic — `@octane-xplat/ui/ios`

`UISwitch`, `UISlider`, `UIActivityIndicatorView`, `UITableView`,
`UITabBar`, `UIModal` (+ `openModal`), `SideDrawer` (ui-drawer edge-gesture
drawer), `LiquidGlass` + `LiquidGlassContainer` (iOS 26+ UIGlassEffect,
inert layout below it).

## Platform-authentic — `@octane-xplat/ui/android`

`MaterialSwitch`, `SeekBar`, `CircularProgressIndicator`, `RecyclerView`,
`BottomNavigationView`, `MaterialDialog` (+ `openModal`), `DrawerLayout`.

## Platform-only shared exports

- `KeyboardAvoiding` — native root export only (inert on web).
- `Hoverable` — `@octane-xplat/ui/web` only. Hover has no touch-platform
  semantic; the old native leaf's long-press stand-in was fake parity.

## Divergences that matter

- `ScrollBox` is a **name trap**: on native it's a plain, non-scrolling
  container (a platform list inside it owns scrolling). Use `ScrollView`
  when you actually want a scroller.
- A `UITableView`/`RecyclerView` must not sit inside a `ScrollView` on
  native — two scrollers fight and the framework throws. Wrap it in
  `ScrollBox` instead.
- `TextArea` `onSubmit`: web fires on Cmd/Ctrl+Enter; native fires only
  when `returnKeyType` is `"done"` or `"send"` — otherwise every newline
  reports as a submit.
- `MaterialDialog` is a centered dialog when non-fullscreen on Android;
  `UIModal` is a form sheet there. Context and theme don't cross modal
  roots — read them inside the modal or pass values down.
- `Sheet`/`openSheet` is a bottom-anchored sheet on both platforms; on web
  it renders an in-window portal layer over the app.
- The shared `Drawer` is self-drawn: a left panel + backdrop on every
  platform (backdrop fires `onDismiss`). The edge-gesture plugin widget is
  `DrawerLayout`/`SideDrawer` in the platform subpaths.
- `RichTextSpan` children carry their own `className`/`style`/`onPress`;
  native maps spans to `FormattedString` runs.
- `UITabBar`/`BottomNavigationView` give real per-pane navigation stacks
  for `TabSpec.stack`; the shared `Tabs` keeps stack history in the route
  store instead. On Android, Frame-in-TabViewItem is unreliable upstream
  (NativeScript#11444) — prefer the shared `Tabs` there for stack panes.
- Accessibility props (`accessible`, label, hint, role, state, live
  region) share names across targets; native translates roles such as
  `heading` → `header`.

## Things that look right but aren't

- There is no shared `Modal`/`openModal` or `List` — import the platform
  names from the subpaths, or compose `Sheet`/`ScrollView`.
- Route `params` must be scalar (see navigation reference) — objects work
  on native but are silently dropped on web.
