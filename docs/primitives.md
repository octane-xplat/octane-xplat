# Building screens

> Combine text, buttons, fields, and containers to make a screen.

A **component** is a reusable piece of a screen. `Text` displays words,
`Pressable` responds to a tap or click, and `View` groups content. You give
components **props**: options such as the text to show or what to do when
someone presses a button.

If you're working with an agent, describe the screen in terms of what someone
can do: “Show saved orders. If there are none, explain how to add one. If
loading fails, offer Retry.” You can also write the components yourself.
[Create an app](toolchain.md#create-and-run) first if you haven't yet.

## The components you reach for first

| I need to…                           | Use                       |
| ------------------------------------ | ------------------------- |
| Group content                        | `View`                    |
| Put items beside each other          | `HStack`                  |
| Put items above and below each other | `VStack` or `Stack`       |
| Show words                           | `Text`                    |
| Respond to a tap or click            | `Pressable`               |
| Accept typed text                    | `TextInput` or `TextArea` |
| Scroll content                       | `ScrollableArea`          |
| Show a short list                    | `List` with `ListItem`    |
| Show a dialog above a screen         | `Dialog`                  |

The [component index](components.md) lists more options. Begin with shared
components from `@octane-xplat/ui`. The supported web, iOS, and Android
implementations aim for consistent appearance and actions;
[experimental desktop targets](spec.md#choose-your-targets) have narrower coverage.

## A practical example

For a small experiment in the starter, replace `src/App.tsrx` with this
component. It starts at zero; pressing “Add one” increases the count.

```tsx
import { useState } from 'octane'
import { View, Text, Pressable } from '@octane-xplat/ui'

export function App() {
	const [count, setCount] = useState(0)
	return (
		<View>
			<Text>Count: {count}</Text>
			<Pressable onPress={() => setCount(count + 1)}>
				<Text>Add one</Text>
			</Pressable>
		</View>
	)
}
```

`useState(0)` gives the component a changing value, starting at zero.
`count` is that value and `setCount` changes it. `onPress` is a callback: a
function the component calls when someone presses it. The `{count}` part
shows the current value in the text.

Save the file with the development server running. Press Add one twice and
check that the text says “Count: 2.” Reloading starts at zero again.
[Styling](styling.md) explains how to add spacing and button decoration.

### Layout and platform controls

`Stack` arranges its contents in a row or column. `HStack` fixes the direction
to horizontal; `VStack` fixes it to vertical. `gap` and padding use spacing
steps: one step is 4 device-independent pixels (dips) on native and 4 CSS
pixels on web. A dip is a size unit that accounts for a phone's pixel density.
Use `Absolute` when children need to overlap. `StackItem size="fill"` grows
into remaining space, and `crossAlignSelf` changes an item's alignment across
the row or column.

On web, `Stack as="section"` selects an HTML tag. Native cannot create that
tag. Native `isScrollable` puts the layout inside a `ScrollView`.

Xplat also offers the OS's own controls through platform imports such as
`@octane-xplat/ui/ios` and `@octane-xplat/ui/android`. They keep their platform's
appearance and do not promise matching visuals. Examples include `UITableView`
and `UISwitch` on iOS, or `RecyclerView` and `MaterialSwitch` on Android.
Keep those imports in matching `.ios` or `.android` files; importing them into
a shared screen will fail the other platform's build.
[Platform files](module-resolution.md) explains the naming rules.
The [implementation map](#implementation-map) lists more controls and their
underlying views for readers who need that detail.

### Text and keyboard actions

`TextArea` keeps Return as a newline. On web, Cmd/Ctrl+Enter submits it.
On iOS and Android, submission is enabled only with
`returnKeyType="done"` or `returnKeyType="send"`; other Return keys insert
a newline. Keep `value` updated from `onChange`; the
[text-entry guide](text-entry.md) explains how.

Some keyboards compose a character over several keystrokes, such as when
entering Japanese text. This is called **IME composition**. Web inputs do
not submit when Enter confirms a composed character. Avoid rewriting text
while composition is in progress, and check the actual iOS and Android
keyboards your app needs.

In the browser, Tab can focus a `Pressable`, and Enter or Space activates it.
`disabled` prevents activation and removes it from Tab navigation. Give an
action an `accessibilityLabel` when its visible content does not name it,
so a screen reader can describe it. Native accessibility behavior has
[separate checks](platform-notes.md#a11y-prop-map-shared-prop--leaf-attrs).

### Reusable rows

`Item` is a reusable, self-drawn row for settings, preferences, and
compact navigation lists. Use `leading`, `title`, `supportingText`, and
`trailing` for the common shape, or compose `Leading`, `Content`,
`Supporting`, and `Trailing` slots for richer content. It works by itself or
inside `FieldGroup`; the row owns its layout and press behavior, while
`FieldGroup` remains the field container. See the maintained
[ListDemo](../packages/demos/src/ListDemo.tsrx) for both forms. Press a row
with an action and verify one callback; disable it and verify the action
stays unchanged.

`List` and `ListItem` describe bounded content, such as a short set of steps
or notices. `List` is rendered in full and is not a data-windowing or native
OS-list wrapper; use `VirtualList` for long collections and the `ui/ios` or
`ui/android` subpath when OS list behavior is required. `listStyle` selects
`none`, `disc`, `circle`, or `decimal` markers; `ListItem` supplies its label,
optional description, leading and trailing content, and optional action or
link. Native leaves draw markers and dividers because NativeScript has no
matching semantic list element. The shared [ListDemo](../packages/demos/src/ListDemo.tsrx)
shows content `List` separately from settings `Item`.
On web, actionable `ListItem` rows use one anchor/button Tab stop; disabled
rows do not activate. Give rich row labels an `accessibilityLabel` when the
visible content does not name the action. `edgeCompensation="inline"` uses
container padding tokens on web and is ignored on native.

On web, Tab to an actionable row and use Enter or Space to activate it.
Rows without an action are outside the Tab sequence. Check the disabled row
in the demo too: it must neither activate nor become a keyboard Tab stop.

### Grouped fields

Use `FormLayout` to arrange `Field` or `InputGroup` children. Its
`defaultOptionality` marks the exception to the form's usual required or
optional state. `InputGroup` provides one label and description for a joined
control; put prefix/suffix text or icons in `InputGroupText`, then place the
input beside it. This is layout and accessibility grouping only: `FormLayout`
does not render a browser `<form>` or provide submit behavior. `InputGroup`
uses a web `role="group"`; NativeScript has no corresponding group role.
The group's `size` and disabled state are inherited by supported member
controls so the addon, input border, and input state stay aligned.
See the [grouped field example](../packages/demos/src/ComponentsDemo.tsrx).

### Native modifiers and glyphs

Native platform widgets accept a `modifiers` array for OS-specific styling or
properties. Import `modifier` from the matching `@octane-xplat/ui/ios` or
`@octane-xplat/ui/android` subpath and keep that configuration in a matching
platform file. `Icon.select({ ios, android })` chooses a native asset for
`UITabBar` or `BottomNavigationView`; the shared `Icon` remains unchanged.
These selectors and modifiers are escape hatches for platform-authentic
widgets, not shared styling props.

This fragment assumes `Saved` is your screen component. Keep it in an
`.ios.tsx`/`.ios.tsrx` file; use the Android subpath in `.android.*`.

```tsx
import { Icon, UITabBar, modifier } from '@octane-xplat/ui/ios'

;<UITabBar
	tabs={[
		{
			title: 'Saved',
			icon: Icon.select({ ios: 'heart.fill', android: 'favorite' }),
			render: Saved,
		},
	]}
	modifiers={[modifier.opacity(0.98)]}
/>
```

### Implementation map

| Component                   | Web element                  | iOS NativeScript view                         | Android NativeScript view              | Normalization class   |
| --------------------------- | ---------------------------- | --------------------------------------------- | -------------------------------------- | --------------------- |
| `Item`                      | `div` via shared `Pressable` | `FlexboxLayout` via shared `Pressable`        | `FlexboxLayout` via shared `Pressable` | `self-drawn`          |
| `SafeArea`                  | `div`                        | `FlexboxLayout`                               | `FlexboxLayout`                        | shared layout wrapper |
| `WebView`                   | sandboxed `iframe`           | `webview` → WKWebView                         | `webview` → android.webkit.WebView     | `hosted`              |
| `UITableView`               | unavailable                  | `listview` → UITableView                      | unavailable                            | `platform-authentic`  |
| `RecyclerView`              | unavailable                  | unavailable                                   | `listview` → RecyclerView              | `platform-authentic`  |
| `UITabBar`                  | unavailable                  | `TabView` / UITabBarController                | unavailable                            | `platform-authentic`  |
| `BottomNavigationView`      | unavailable                  | unavailable                                   | `TabView`                              | `platform-authentic`  |
| `UISwitch`                  | unavailable                  | `switch` → UISwitch                           | unavailable                            | `platform-authentic`  |
| `MaterialSwitch`            | unavailable                  | unavailable                                   | `switch` → SwitchMaterial              | `platform-authentic`  |
| `UISlider`                  | unavailable                  | `slider` → UISlider                           | unavailable                            | `platform-authentic`  |
| `SeekBar`                   | unavailable                  | unavailable                                   | `slider` → SeekBar                     | `platform-authentic`  |
| `UIActivityIndicatorView`   | unavailable                  | `activityindicator` → UIActivityIndicatorView | unavailable                            | `platform-authentic`  |
| `CircularProgressIndicator` | unavailable                  | unavailable                                   | `activityindicator` → ProgressBar      | `platform-authentic`  |
| `SideDrawer`                | unavailable                  | ui-drawer host view                           | unavailable                            | `platform-authentic`  |
| `DrawerLayout`              | unavailable                  | unavailable                                   | ui-drawer host view                    | `platform-authentic`  |
| `LiquidGlass`               | unavailable                  | NativeScript glass effect view                | unavailable                            | `platform-authentic`  |
| `LiquidGlassContainer`      | unavailable                  | NativeScript glass effect view                | unavailable                            | `platform-authentic`  |

The platform-authentic rows intentionally have no web counterpart. Their
native modifiers and glyph names stay behind platform subpaths; they do not
change the shared components' parity class.

`Pressable`, `Text`, and the containers (`View`/`HStack`/`Stack`/`Absolute`/
`Grid`/`ScrollableArea`) share the accessibility props in the
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

For a small or bounded list, render `items.map(...)` inside a `ScrollableArea`.
For a short content list with labels, descriptions, markers, and optional row
actions, use `List` + `ListItem`; it is not virtualized.
For larger vertical data sets that need bounded rendering across targets, use
the shared `VirtualList`: it measures variable row heights and renders the
viewport plus one viewport of overscan. Rows outside that window unmount, so
keep durable row state outside the row and key it by item identity.
`getItemType` contributes to row identity but does not enable cell recycling.
The shared list does not promise FlashList-level performance; fast-scroll and
long-session budgets remain open.

Use `UITableView` (`ui/ios`) or `RecyclerView` (`ui/android`) when their
platform-authentic list behavior is what the app needs. A native platform list
must not sit inside a vertically scrolling `ScrollableArea` — NativeScript
measures a vertical `ScrollView` child without a bounded height, which makes the nested list
prepare cells through an unsupported path; the list leaf throws a named error
on that nesting. Wrap the list in `ScrollableArea axis="both"` (a scrolling
viewport on web and an inline shell on native) so the list owns scrolling.
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
dots from `HStack` + `Pressable` driven by the page index (see the `pager`
demo). The web leaf is a scroll-snap row; `onPageChange` fires after the
snap settles.

`SegmentedControl` is a self-drawn row of equal-width segments — the
normalized shape of UISegmentedControl / Material segmented buttons, with
no OS chrome. It takes `options` (the `RadioOption` shape), `value` +
`onValueChange` for controlled use or `defaultValue` for uncontrolled, and
`isDisabled` per-option or on the group. Field-like controls also accept
`label`, `description`, `isReadOnly`, `isRequired`, `isOptional`, `size`,
`status`, and `isLoading`; see [Inputs](components.md#inputs) for the shared
state contract.

`SearchInput` is a chrome-reset search field — TextInput with a leading
glyph and a clear button, styled the same on every target (not
UISearchBar). `value`/`onChange`/`onSubmit`/`onClear` are controlled like
TextInput; `defaultValue` makes it uncontrolled. The leading glyph is an
`Icon` — `icon` names a registered glyph (default `'xplat-search'`, a
framework-provided one any app can override by registering the same name).

Use `Dialog` for modal content, `AlertDialog` when the user must choose an
action, `BottomSheet` for bottom-anchored content, `Overlay` for floating
content, or `Popover` for anchored content. Dialog and BottomSheet visibility
uses `isOpen`/`onOpenChange`; `showToast({ body })` or `useToast()` presents a
transient notification. Pass the data the content needs as props. BottomSheet
`snapPoints` (viewport-height fractions like `[0.25, 0.5, 1]`) turns the panel
into a snap-point surface — it opens at the smallest stop and drags between
them via a self-drawn grabber. The platform's own modal presentation is `UIModal`/`MaterialDialog`

- `openModal` in the subpaths — there is no shared `Modal`.

`ScrollableArea` and the platform lists (`UITableView`, `RecyclerView`) accept
`refreshing`, `onRefresh`, and `refreshThreshold` for pull-to-refresh.
`onRefresh` enables the gesture; `refreshing` is controlled — set it while
reloading and the self-drawn `Spinner` strip stays docked above
the content. There is no OS spinner anywhere in the path.

`HoverCard` (delayed hover card) shows `content` on pointer platforms — web
and macOS. Its touch behavior is controlled by `touchTrigger`; keep essential
information available in the trigger. `Tooltip` remains a hint-only
enhancement.

`Tooltip` remains a hint-only enhancement. It takes `trigger` +
`content` slots and, on web, opens on hover after `openDelay` and
immediately on keyboard focus, wires `aria-describedby` onto the focusable
trigger, and dismisses on Escape, blur, or scroll. Positioning rides the
shared `Popover` machinery (`placement`, default `top`). On macOS the hint
is an anchored `NSPopover`. On touch targets only the `trigger` renders —
keep essential information out of `content`, or compose
`Pressable` + `Popover`/`BottomSheet` for an explicit tap-to-reveal hint.

Use `useMeasure()` when a screen needs live element bounds:
`const { ref, bounds } = useMeasure()`, then pass `ref` to a primitive's
`ref` prop. Bounds are observed by default and are `null` before the element
has a usable layout. Web coordinates are viewport-relative; native coordinates
are screen-relative device-independent pixels. Set `{ observe: false }` for a
single read after binding.

`ToastViewport` owns toast position and visibility limits. `showToast({ body,
position, anchor, placement })` returns a dismiss function; `useToast()` routes
to the nearest viewport or the fallback viewport. Anchored toasts follow
`Popover`'s platform-specific overlay behavior.

### WebView content sizing

`WebView` embeds a web document — `src` for a URL, `html` for an inline
document — with `onLoad`/`onError`, `scrollEnabled`, and a `ref` handle for
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

### Video playback

`Video` plays a clip — `src`, `poster`, `playing`/`onPlayingChange` (or
`autoPlay` for uncontrolled start), `muted`, `loop`, `fit`
(`contain`/`cover`/`fill`), and a `ref` handle for `play`/`pause`/
`seekTo`/`currentTime`/`duration`. All transport chrome is self-drawn —
tap the frame to show/hide it — so the controls are identical on every
target while the video pixels stay in each platform's player engine.
`Video` ships as the `@octane-xplat/video` leaf — `pnpm add
@octane-xplat/video` and import `Video` from that package; the
`@nstudio/nativescript-exoplayer` plugin travels as the leaf's own
dependency, so apps declare nothing extra.
Times are milliseconds everywhere, including `onReady`'s duration. Use the
maintained [VideoDemo](../packages/demos/src/VideoDemo.tsrx) for a bounded
player and play/pause controls. Check that playback advances, pause holds the
position, and resume continues. Native player failures do not emit `onError`;
see [video limits](known-limits.md#primitives) before designing error UI.

### Lottie animations

`Lottie` plays a Lottie animation — `src` (URL; native also accepts `~/`
bundle paths, absolute files, `res://` names, `.lottie` containers, and raw
`{`-JSON) or `data` (inline animation object), `autoPlay`, `loop`,
`playing`, `progress` (normalized 0..1), `speed`, `fit`
(`contain`/`cover`/`fill`), `onLoaded`/`onEnded`/`onError`, and a `ref`
handle (`play`/`pause`/`stop`/`seekTo`/`setSpeed`/`progress`/`duration`/
`isPlaying`). It ships as the `@octane-xplat/lottie` leaf — `pnpm add
@octane-xplat/lottie`. `lottie-web` is a real dependency; the NativeScript
plugin is vendored in the leaf (`src/vendor/ui-lottie` — a git
submodule of `octane-xplat/ui-lottie`, branch `xplat-vendored`), so apps declare nothing extra.
Durations are milliseconds and progress is 0..1 on every target — the
plugin reports seconds and the leaf normalizes. Use the maintained
[LottieDemo](../packages/demos/src/LottieDemo.tsrx) for bounded playback
controls. The vendored plugin carries fixes unreleased upstream (load
events, sync-src, remote URLs, `declare` fields for modern bundlers); see
[lottie limits](known-limits.md#primitives) before designing error UI.

### Camera preview

`CameraView` is a live camera preview — `facing` (`'back'`/`'front'`),
`active` to start/stop, `onReady`/`onError`, and a `ref` handle for the
platform view. Add `@octane-xplat/camera` to the app with
`pnpm add @octane-xplat/camera` and import `CameraView` from that package. The
leaf requests permission when the preview starts and includes the iOS camera
usage description and Android camera permission in its platform files; no
separate camera plugin is needed. Setting `active` to `false` stops the
preview. Stills deliberately go through `media.capturePhoto` in
`@octane-xplat/platform`, not this widget. Use the maintained
[CameraDemo](../packages/demos/src/CameraDemo.tsrx) to check start/stop, lens
changes, and ready/error state. Browser preview needs a secure context
(HTTPS or localhost). Native `onReady` means the session started or bound,
not that a frame has appeared; see [camera limits](known-limits.md#primitives).

If a component needs different markup on web and native, keep its public props
shared and split only its leaves. The [primitive notes](primitive-notes.md)
cover the less common components, accessibility details, and renderer limits.

## Refs

Use Octane's ordinary `ref` prop. Layout and interaction primitives such as
`View` and `Pressable` forward it to their host. Controls such as `TextInput`,
`Calendar`, and `WebView` expose their documented imperative handle instead.
The handle's `native` field, where provided, is platform-specific; keep direct
host API calls in a platform file.

```tsx
import { useMemo, useRef } from 'octane'
import { Pressable, Text, TextInput, View, useMeasure } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export function FocusField() {
	const input = useRef<TextInputHandle | null>(null)
	const host = useRef<any>(null)
	const measurement = useMeasure()
	const refs = useMemo(() => [host, measurement.ref], [host, measurement.ref])
	return (
		<View ref={refs}>
			<TextInput label="Name" ref={input} />
			<Pressable onPress={() => input.current?.focus()}>
				<Text>Focus name</Text>
			</Pressable>
		</View>
	)
}
```

A ref can be an object with `current`, a callback, or an array of refs
(including nested arrays). Objects are set to `null` when detached. Callback
refs receive `null` when detached, or can return a cleanup function that runs
instead. Replacing a ref detaches the previous owner before attaching the new
one. Read handles from events or effects after mount, and handle `null` during
cleanup.

Hooks that attach to a host use the same prop: `useMeasure().ref`,
`useAnimation().ref`, intersection observation's `ref` and `rootRef`, and drag
and drop's `ref`. Combine them with an array when they need the same host. Keep
composed refs stable with `useMemo` when their callbacks update state, so a
render does not detach and attach them again. Forward a ref through your own
component as a normal prop, or use Octane's `useImperativeHandle` to expose a
custom handle.

### Migrate from bind

Upgrade the framework packages and their [managed patches](toolchain.md#agent-context-and-versions)
together before migrating; native handle refs need the matching Octane patch.

Change `bind={...}` to `ref={...}`, hook results `.bind` to `.ref`, and
intersection observation's `.bindRoot` to `.rootRef`. Assignment callbacks can
become object refs: `bind={(handle) => { input.current = handle }}` becomes
`ref={input}`. Callbacks that perform work must accept `null` or return cleanup.
The old `bind` names are removed.

## Hold a press

Use `Pressable onLongPress` for a hold action. Web reports a hold after
approximately 500 ms and native uses its platform long-press gesture.
Releasing, leaving the hit area, canceling the pointer, disabling the control,
or removing it cancels a pending web hold. Rerendering keeps the pending
interaction and invokes the latest callback if the hold completes.

```tsx
<Pressable onLongPress={() => showToast({ body: 'Held' })}>
	<Text>Hold to show a toast</Text>
</Pressable>
```

## Own temporary surfaces

Render `BottomSheet`, `Dialog`, `Overlay`, or `Popover` inside a `Screen` on
native so the component can find its owning `RootLayout`. Keep `isOpen` in app
state and set it to false from `onOpenChange` when the user dismisses the
surface. Setting `isOpen={false}` or removing the declaring component closes
the surface without reporting user dismissal.

```tsx
import { useState } from 'octane'
import { Screen, BottomSheet, Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	const [open, setOpen] = useState(false)
	return (
		<Screen>
			<Pressable onPress={() => setOpen(true)}>
				<Text>Open sheet</Text>
			</Pressable>
			{open && (
				<BottomSheet isOpen={open} onOpenChange={setOpen}>
					<Text>Temporary content</Text>
					<Pressable onPress={() => setOpen(false)}>
						<Text>Close sheet</Text>
					</Pressable>
				</BottomSheet>
			)}
		</Screen>
	)
}
```

Pressing Close removes the declaring `BottomSheet` and releases its native root,
keyboard/gesture bindings, and theme subscription. User dismissal also
releases those resources and reports through the latest `onOpenChange` callback.
An open animation finishing after removal cannot revive the surface.
The maintained [Overlay demo](../packages/demos/src/OverlayDemo.tsrx) uses the
same conditional ownership pattern.

Native content mounts in a separate Octane root: component context does not
cross that boundary. Pass values as props or subscribe to shared state in
each consuming component. The framework keeps the separate host's theme
current; content updates do not create additional permanent subscriptions.
Web portals retain the declaring root's context.

## Anchor a layer to an element

`useLayer` is the public anchored-overlay primitive — the same shape Meta
Astryx's `useLayer` exposes. Reach for it when `Popover`'s declarative props
are not enough: you get the anchor ref, open state, and a `render` function to
place inside your component tree.

```tsx
import { Pressable, Text, View, useLayer } from '@octane-xplat/ui'

export function Example() {
	const layer = useLayer({ mode: 'context', lightDismiss: true })
	return (
		<>
			<View ref={layer.ref}>
				<Pressable onPress={() => layer.show()}>
					<Text>Help</Text>
				</Pressable>
			</View>
			{layer.render(
				<View>
					<Text>Anchored content</Text>
				</View>,
				{ placement: 'below', alignment: 'start', offset: 4 },
			)}
		</>
	)
}
```

`mode: 'context'` binds `layer.ref` to the element the layer anchors to and
positions `render`'s children beside it: `placement` accepts `above`, `below`,
`start`, `end` (`start`/`end` mirror under RTL), plus physical
`top`/`bottom`/`left`/`right`; `alignment` is `start`/`center`/`end` on the
cross axis; `offset` is the gap. The layer flips to the opposite side when the
preferred side does not fit and clamps into the viewport. Web portals to
`document.body` and measures with `getBoundingClientRect`; native mounts on the
owning `RootLayout` and measures the anchor's native bounds. On macOS the layer
is a real `NSPopover` presented by the AppKit host bridge. Pass
`positioning: 'custom'` (context mode only) to skip anchor measurement and
mount the layer in the overlay shell unpositioned.

`mode: 'fixed'` drops the anchor entirely: `render` positions at the `x`/`y`
given in its props — viewport pixels on web, page dips on native, and the
containing window's top-left point on macOS. `lightDismiss` closes on outside
interaction; `onShow`/`onHide` track state, `isOpen` reads it, `show`/`hide`
toggle it.

On native, layer content is a separate root: it does not see the declaring
component's context, and on macOS the content is snapshotted when the popup
opens. Pass data through props or subscribe to shared state inside the layer
tree. `Popover`, `Tooltip`, and `HoverCard` do not yet sit on `useLayer` —
converging them is follow-up work.

## Edit a PIN

`PinInput` uses a contiguous string: provide `value` and update it from
`onValueChange`, or omit `value` to let the component own it. Filled cells
and the next empty cell are editable; entry advances focus. Clearing cell 2
of `1234` reports `1` and clears cells 2–4 rather than moving later digits.
Replacing a filled cell keeps the remaining digits in their cells.

```tsx
const [pin, setPin] = useState('')
<Field label="Security code" description="Enter all four digits" isRequired>
	<PinInput length={4} value={pin} onValueChange={setPin} onComplete={submitPin} />
</Field>
```

This fragment assumes `useState`, `Field`, and `PinInput` are imported and the
app supplies `submitPin`. `onComplete` receives a full-length PIN after an edit;
it does not fire for an incomplete value or an external value update.
The maintained [Components demo](../packages/demos/src/ComponentsDemo.tsrx)
shows controlled entry. `secure` masks the cells, while `isDisabled` and
`isReadOnly` prevent editing. PIN fields also accept the shared field-control
props described in [Inputs](components.md#inputs). Wrap the control in `Field`
when it needs a visible label, description, or status message; the group uses
that label and each cell gets a distinct accessible name.

## Grow a multiline field

Set `autoGrow` on `TextArea` to fit content as the user types or clears text.
Omit `value` to let the field own its text; use `value` and `onChange` together
when the app owns it. Both modes resize on input, and controlled value updates
also resize the field.

`rows` sets the starting height (one row by default with `autoGrow`), and
`maxRows` caps growth. Beyond the cap, the field scrolls internally. Without
`autoGrow`, the field keeps its row-based height. `onChange` receives the text
in either mode; submission follows the multiline submit rules described above.

```tsx
<TextArea autoGrow rows={2} maxRows={4} placeholder="Write a note" />
```

The [input probe](../packages/app/src/Home.tsrx) includes controlled and
uncontrolled composers.

## Render bundled SVG on AppKit

On experimental AppKit macOS, `Image.src` accepts trusted inline SVG markup,
percent-encoded SVG data URIs, and base64 SVG data URIs. The macOS boundary
encodes markup with Foundation and loads it into a native `NSImageView`.
Use `alt` for the accessibility label; omit it for decorative images.
Registered `Icon` glyphs with `svg` or `markup` use this same path.

```tsx
import { Image } from '@octane-xplat/ui'

;<Image
	src='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 12h16" stroke="black"/></svg>'
	alt="Horizontal line"
	style={{ width: 24, height: 24 }}
/>
```

This image host does not load SVG file paths or remote URLs. The native SVG
path has runtime evidence on macOS 27.0.1; decoding on macOS 13.5 remains
unverified. An unsupported decoder produces an empty image. See the
[AppKit SVG notes](icon-svg-notes.md) for evidence and limits, and the
[icons leaf](../packages/icons/README.md) for set-agnostic Iconify rendering.
