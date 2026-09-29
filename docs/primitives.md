# Building screens

> Build the screens your app needs with shared components, then choose
> platform widgets where the OS experience matters.

For a first agent task, describe the screen's actions and empty state: a
packing list should let someone add an item, mark it packed, and see what
remains. Start with the components below; [run the starter](toolchain.md)
if you do not yet have a working app.

## The components you reach for first

| Need                                   | Component                       |
| -------------------------------------- | ------------------------------- |
| Group content                          | `View`                          |
| Put items in a row                     | `Row`                           |
| Show text                              | `Text`                          |
| Compose styled or tappable inline text | `RichText` + `RichTextSpan`     |
| Respond to a tap                       | `Pressable`                     |
| Render repeated items                  | `ScrollView` + `items.map(...)` |
| Show a settings or preference row       | `ListItem`                       |
| Accept one or more lines               | `TextInput`, `TextArea`         |
| Scroll content                         | `ScrollView`, `ScrollBox`       |
| Show a web page or inline HTML         | `WebView`                       |
| Play video                             | `Video`                         |
| Show a live camera preview             | `CameraView`                    |
| Swipe through full pages               | `Pager`                         |
| Pick one of a few options inline       | `SegmentedControl`              |
| Search or filter                       | `SearchInput`                   |
| Pull to refresh a scroller or list     | `refreshing` + `onRefresh` props |
| Show temporary content above a screen  | `Sheet`, `Overlay`              |

Start with these components. They are deliberately smaller than the browser
DOM or the full NativeScript view catalog, which makes a shared screen easier
to keep portable — and they are self-drawn, chrome-reset, or hosted (see the
normalization classes in [architecture](architecture.md#normalization-classes)),
which defines which visuals the framework owns. Hosted content keeps its
platform or engine appearance. These contracts describe the supported
web/iOS/Android implementations; the [experimental desktop targets](spec.md#choose-your-targets)
have narrower coverage.

Platform-authentic widgets (real OS chrome, no parity promised) live behind
`@octane-xplat/ui/ios`, `@octane-xplat/ui/android`, and `@octane-xplat/ui/web`
under their OS names — `UITableView`, `RecyclerView`, `UIModal`,
`MaterialDialog`, `UITabBar`, `BottomNavigationView`, `SideDrawer`,
`DrawerLayout`, `UISwitch`, `MaterialSwitch`, `UISlider`, `SeekBar`,
`UIActivityIndicatorView`, `CircularProgressIndicator`, and `LiquidGlass` +
`LiquidGlassContainer` (iOS-only). Import them only from
`.ios.*`/`.android.*`/`.web.*` files — a shared `.tsrx` importing a
platform subpath fails the other platform's build, which is the point.

## A practical example

```tsx
import { View, Text, Pressable } from '@octane-xplat/ui'

export function EmptyState() {
	return (
		<View className="empty-state">
			<Text>No messages yet.</Text>
			<Pressable onPress={() => console.log('create message')} className="button">
				<Text>Write a message</Text>
			</Pressable>
		</View>
	)
}
```

Use `className` for reusable visual styles, `style` for values that change at
runtime, and shared event names such as `onPress` and `onChange`.

`TextArea` keeps Return as a newline. On web, `onSubmit` fires for
Cmd/Ctrl+Enter. On native, `onSubmit` is enabled only when
`returnKeyType="done"` or `returnKeyType="send"`; other return keys insert
a newline instead.

### Reusable rows

`ListItem` is a reusable, self-drawn row for settings, preferences, and
compact navigation lists. Use `leading`, `title`, `supportingText`, and
`trailing` for the common shape, or compose `Leading`, `Content`,
`Supporting`, and `Trailing` slots for richer content. It works by itself or
inside `FieldGroup`; the row owns its layout and press behavior, while
`FieldGroup` remains the field container. See the maintained `ListDemo` for
both forms.

### Native modifiers and glyphs

Native platform widgets accept a `modifiers` array for OS-specific styling or
properties. Import `modifier` from the matching `@octane-xplat/ui/ios` or
`@octane-xplat/ui/android` subpath and keep that configuration in a matching
platform file. `Icon.select({ ios, android })` chooses a native asset for
`UITabBar` or `BottomNavigationView`; the shared `Icon` remains unchanged.
These selectors and modifiers are escape hatches for platform-authentic
widgets, not shared styling props.

```tsx
// In a .ios.tsx/.ios.tsrx file; use the android subpath in .android.*.
import { Icon, UITabBar, modifier } from '@octane-xplat/ui/ios'

<UITabBar
  tabs={[{ title: 'Saved', icon: Icon.select({ ios: 'heart.fill', android: 'favorite' }), render: Saved }]}
  modifiers={[modifier.opacity(0.98)]}
/>
```

### Implementation map

| Component | Web element | iOS NativeScript view | Android NativeScript view | Normalization class |
| --- | --- | --- | --- | --- |
| `ListItem` | `div` via shared `Pressable` | `FlexboxLayout` via shared `Pressable` | `FlexboxLayout` via shared `Pressable` | `self-drawn` |
| `SafeArea` | `div` | `FlexboxLayout` | `FlexboxLayout` | shared layout wrapper |
| `WebView` | sandboxed `iframe` | `webview` → WKWebView | `webview` → android.webkit.WebView | `chrome-reset` |
| `UITableView` | unavailable | `listview` → UITableView | unavailable | `platform-authentic` |
| `RecyclerView` | unavailable | unavailable | `listview` → RecyclerView | `platform-authentic` |
| `UITabBar` | unavailable | `TabView` / UITabBarController | unavailable | `platform-authentic` |
| `BottomNavigationView` | unavailable | unavailable | `TabView` | `platform-authentic` |
| `UISwitch` | unavailable | `switch` → UISwitch | unavailable | `platform-authentic` |
| `MaterialSwitch` | unavailable | unavailable | `switch` → SwitchMaterial | `platform-authentic` |
| `UISlider` | unavailable | `slider` → UISlider | unavailable | `platform-authentic` |
| `SeekBar` | unavailable | unavailable | `slider` → SeekBar | `platform-authentic` |
| `UIActivityIndicatorView` | unavailable | `activityindicator` → UIActivityIndicatorView | unavailable | `platform-authentic` |
| `CircularProgressIndicator` | unavailable | unavailable | `activityindicator` → ProgressBar | `platform-authentic` |
| `SideDrawer` | unavailable | ui-drawer host view | unavailable | `platform-authentic` |
| `DrawerLayout` | unavailable | unavailable | ui-drawer host view | `platform-authentic` |
| `LiquidGlass` | unavailable | NativeScript glass effect view | unavailable | `platform-authentic` |
| `LiquidGlassContainer` | unavailable | NativeScript glass effect view | unavailable | `platform-authentic` |

The platform-authentic rows intentionally have no web counterpart. Their
native modifiers and glyph names stay behind platform subpaths; they do not
change the shared components' parity class.

`Pressable`, `Text`, and the containers (`View`/`Row`/`Stack`/`Absolute`/
`Grid`/`ScrollView`/`ScrollBox`) share the accessibility props in the
platform map, including `accessible`, label, hint, value, role, state, and
live region — a container can carry `accessibilityRole`/live-region for
grouped announcements without reaching for the `web` escape bag. Role
names stay portable; the native leaf translates names such as `heading` to
NativeScript's `header`.

For mixed formatting or inline links, compose `RichText` with
`RichTextSpan` children. Each span can carry its own `className`, `style`, and
`onPress`; the native leaf maps the runs to NativeScript `FormattedString`
spans and uses the span's `text` prop for driver compatibility.

## When a screen needs more

For a small or bounded list, render `items.map(...)` inside a `ScrollView`.
For larger vertical data sets that need bounded rendering across targets, use
the shared `VirtualList`: it measures variable row heights and renders the
viewport plus one viewport of overscan. Rows outside that window unmount, so
keep durable row state outside the row and key it by item identity.
`getItemType` contributes to row identity but does not enable cell recycling.
The shared list does not promise FlashList-level performance; fast-scroll and
long-session budgets remain open.

Use `UITableView` (`ui/ios`) or `RecyclerView` (`ui/android`) when their
platform-authentic list behavior is what the app needs. A native platform list
must not sit inside a `ScrollView` — NativeScript measures a vertical
`ScrollView` child without a bounded height, which makes the nested list
prepare cells through an unsupported path; the list leaf throws a named error
on that nesting. Wrap the list in `ScrollBox` (a real `ScrollView` on web, an
inline `View` on native) so the list owns scrolling.
_VirtualList anchor correction and slots verified on web, iOS simulator, and
Android emulator; native nested-list guard verified on iOS._

`Pager` gives paged horizontal swiping — onboarding flows, media galleries.
It ships as the `@octane-xplat/pager` leaf — `pnpm add @octane-xplat/pager`
and import `Pager` from that package; the `ui-pager` plugin travels as the
leaf's own dependency, so apps declare nothing extra. It takes `items` +
`renderItem` (the same contract as the platform lists),
`page`/`onPageChange` for controlled use, `defaultPage` for uncontrolled.
Native pages are recycled OS cells, so pages need no fixed height of their
own — each fills the pager. There is no built-in page indicator; compose
dots from `Row` + `Pressable` driven by the page index (see the `pager`
demo). The web leaf is a scroll-snap row; `onPageChange` fires after the
snap settles.

`SegmentedControl` is a self-drawn row of equal-width segments — the
normalized shape of UISegmentedControl / Material segmented buttons, with
no OS chrome. It takes `options` (the `RadioOption` shape), `value` +
`onValueChange` for controlled use or `defaultValue` for uncontrolled, and
`disabled` per-option or on the group.

`SearchInput` is a chrome-reset search field — TextInput with a leading
glyph and a clear button, styled the same on every target (not
UISearchBar). `value`/`onChange`/`onSubmit`/`onClear` are controlled like
TextInput; `defaultValue` makes it uncontrolled. The leading glyph is an
`Icon` — `icon` names a registered glyph (default `'xplat-search'`, a
framework-provided one any app can override by registering the same name).

Use `Sheet` for a focused interruption, or `openSheet`/`showToast`/`Overlay`
imperatively, and pass the data it needs as props. `detents` (viewport-height
fractions like `[0.25, 0.5, 1]`) turns the sheet into a snap-point panel —
it opens at the smallest detent and drags between them via a self-drawn
grabber. The platform's own modal presentation is `UIModal`/`MaterialDialog`
+ `openModal` in the subpaths — there is no shared `Modal`.

`ScrollView` and the platform lists (`UITableView`, `RecyclerView`) accept
`refreshing`, `onRefresh`, and `refreshThreshold` for pull-to-refresh.
`onRefresh` enables the gesture; `refreshing` is controlled — set it while
reloading and the self-drawn `ActivityIndicator` strip stays docked above
the content. There is no OS spinner anywhere in the path.

`Hoverable` (delayed hover card) is a shared export that shows its `card`
only on pointer platforms — web and the macOS desktop target. On touch
targets it renders the children and never mounts the card (decision #69);
the old native long-press stand-in was fake parity and is gone. Keep
essential information out of `card`.

`Tooltip` follows the same contract (decision #69). It takes `trigger` +
`content` slots and, on web, opens on hover after `openDelay` and
immediately on keyboard focus, wires `aria-describedby` onto the focusable
trigger, and dismisses on Escape, blur, or scroll. Positioning rides the
shared `Popover` machinery (`placement`, default `top`). On macOS the hint
is an anchored `NSPopover`. On touch targets only the `trigger` renders —
keep essential information out of `content`, or compose
`Pressable` + `Popover`/`Sheet` for an explicit tap-to-reveal hint.

Use `useMeasure()` when a screen needs live element bounds:
`const { bind, bounds } = useMeasure()`, then pass `bind` to a primitive's
`bind` prop. Bounds are observed by default and are `null` before the element
has a usable layout. Web coordinates are viewport-relative; native coordinates
are screen-relative device-independent pixels. Set `{ observe: false }` for a
single read after binding.

`showToast()` keeps top/bottom viewport placement and adds start/end alignment.
Pass `anchor` plus an optional `placement` to position a toast from a view;
that anchored form follows `Popover`'s platform-specific overlay behavior.

### WebView content sizing

`WebView` embeds a web document — `src` for a URL, `html` for an inline
document — with `onLoad`/`onError`, `scrollEnabled`, and a `bind` handle for
`reload`/`goBack`/`goForward`. `matchContents` sizes the frame height to its
document and `onLayoutContent` reports measured content dimensions. Browser
measurement works only when the iframe document is same-origin; cross-origin
content cannot expose its internal size. On native, `onLayoutContent` reports
the web view's content size, and `matchContents` applies the measured height.
Wrap it in `SafeArea` and set `ignoreSafeArea` when the content should extend
under system safe areas. On web it is a sandboxed `<iframe>`
(default `allow-scripts allow-same-origin allow-forms allow-modals`, tunable
via the `sandbox` prop); on native it is the OS web view. The document itself
renders in each platform's engine, so parity applies to the frame's chrome,
not the page's pixels. There is deliberately no script-injection or
`postMessage` bridge — the three engines expose different page-side APIs, so
use the `ios:`/`android:`/`web:` escape bags for that.

`Video` plays a clip — `src`, `poster`, `playing`/`onPlayingChange` (or
`autoPlay` for uncontrolled start), `muted`, `loop`, `fit`
(`contain`/`cover`/`fill`), and a `bind` handle for `play`/`pause`/
`seekTo`/`currentTime`/`duration`. All transport chrome is self-drawn —
tap the frame to show/hide it — so the controls are identical on every
target while the video pixels stay in each platform's player engine.
`Video` ships as the `@octane-xplat/video` leaf — `pnpm add
@octane-xplat/video` and import `Video` from that package; the
`@nstudio/nativescript-exoplayer` plugin travels as the leaf's own
dependency, so apps declare nothing extra.
Times are milliseconds everywhere, including `onReady`'s duration.

`CameraView` is a live camera preview — `facing` (`'back'`/`'front'`),
`active` to start/stop, `onReady`/`onError`, and a `bind` handle for the
platform view. Add `@octane-xplat/camera` to the app with
`pnpm add @octane-xplat/camera` and import `CameraView` from that package. The
leaf requests permission when the preview starts and includes the iOS camera
usage description and Android camera permission in its platform files; no
separate camera plugin is needed. Setting `active` to `false` stops the
preview. Stills deliberately go through `media.capturePhoto` in
`@octane-xplat/platform`, not this widget.

If a component needs different markup on web and native, keep its public props
shared and split only its leaves. The [primitive notes](primitive-notes.md)
cover the less common components, accessibility details, and renderer limits.
