# Primitives

Import the shared surface from `@octane-xplat/ui`. Shared components use
platform leaves behind the same import; platform-authentic widgets use the
conditional `@octane-xplat/ui/ios`, `/android`, or `/web` subpaths. Those
subpaths resolve only for their target, so keep imports in a matching
platform-suffixed file. A runtime branch does not prevent an incompatible
static import from loading.

```tsx
import { HStack, Text } from '@octane-xplat/ui'

export function PackingRow() {
	return (
		<HStack>
			<Text>Passport</Text>
			<Text>Packed</Text>
		</HStack>
	)
}
```

## Text and Heading typography

`Text` and `Heading` carry the Astryx type-scale props. `type` selects the
theme's `--text-<type>-*` tokens (`body`, `large`, `label`, `supporting`,
`code`, `display-1`–`display-3`); `size`, `color`, and `weight` refine it;
`maxLines` truncates with an ellipsis (1 = single-line clip, >1 = line-clamp).
Omit `type` — or pass `type="inherit"` — to keep ambient typography: unlike
upstream's `'body'` default, bare `Text` inherits because it is also the
shared text host every other component composes. `Heading` sizes from
`level` (the `--text-heading-<level>-*` scale) and accepts `type` for the
display scale plus `color`/`weight`/`maxLines`.

```tsx
<Text type="body" size="sm" color="secondary" maxLines={2}>{summary}</Text>
<Heading level={3}>Card title</Heading>
```

AppKit Text/Heading now merge authored styles over typography defaults without
dropping declaration strings or runtime arrays. Heading root/purpose paths share
one leaf; RichText/Span forward styles and RichText's declared ID survives.
Renderer normalization runs before validation/creation/update, including logical
text runs and direct template creation. Native text/layout/truncation/VoiceOver
remain unqualified; do not infer heading-level AX support from a heading role.
Prefer classes for static styles and objects for dynamic values.

```tsx
import { Heading, Text } from '@octane-xplat/ui'
export function Summary({ points }: { points: number }) {
	return <>
		<Heading level={2} style={{ fontSize: points }}>Summary</Heading>
		<Text type="body" style={{ fontSize: points }}>Ready</Text>
	</>
}
```

AppKit nested Text/RichText now use a text-owner context and emit logical spans;
Heading provides that scope to nested Text too. RichText purpose/root imports
share the AppKit leaf. RichTextSpan.text overrides children, including an empty
string; omitted/null text falls back to children. Root Text/RichText forward
parent-layout metadata; only the outer text host owns line caps/layout. A capped
root Text allows shrinking. Per-span onPress is still unwired: readable runs do
not prove glyph hit testing, native layout/AX or packed resolution.

```tsx
import { RichText, RichTextSpan, Text } from '@octane-xplat/ui'
export function Notice() {
	return <>
		<Text>Read <Text weight="bold">carefully</Text>.</Text>
		<RichText><RichTextSpan text="Ready" /></RichText>
	</>
}
```

Outer AppKit Text now forwards testID, accessible, hint and value alongside the
name. Native label/htmlview hints use accessibilityHelp; portable value text
uses accessibilityValueDescription without rewriting displayed text. Dropping
descriptions clears them to nil; dropping accessible restores participation.
Inline runs have no separate native owner. This does not add Text state/live
announcements or arbitrary role mappings, nor establish VoiceOver behavior.

```tsx
import { Text } from '@octane-xplat/ui'
export function Count({ count }: { count: number }) {
	return <Text testID="item-count" accessibilityLabel="Items"
		accessibilityValue={`${count} items`} accessibilityHint="Review the collection.">
		{count}
	</Text>
}
```

**For UI contributors**, shared component prop contracts live in
`packages/ui/src/props.ts` and feed published declarations. Consumer app
components own their own props; do not edit framework internals to define them.

AppKit Heading forwards level (default 2) independently of its visual `type`.
The readable label maps heading to AXHeading, numeric level to accessibilityValue
and current plain/rich contents to accessibilityTitle; it retains visible text
and restores captured native metadata when the heading role is removed. The
AppKit-only label intrinsic declares accessibilityHeadingLevel (1–6); prefer
Heading for application code. Source cases and packed type assertions are unrun;
actual VoiceOver navigation/updates, native setter behavior and packing remain
unqualified. This does not add per-span owners, actions or live announcements.

```tsx
import { Heading, Text } from '@octane-xplat/ui'
export function AccountTitle({ title }: { title: string }) {
	return <Heading level={2} type="display-2">Your <Text>{title}</Text></Heading>
}
```

## Shared surface

Use the [component guide](../../../../docs/app/components.md) to choose a
component, and the public declarations/export map for exact names and props.
State and routing operations have dedicated `/data` and `/routing` entrypoints;
visual components stay at the root.

Check the [normalization contract](../../../../docs/start/architecture.md#normalization-classes)
when deciding which appearance and behavior must match across targets.

`Switch`, `Slider`, `Spinner`, `Tabs`, `Drawer`, and the color suite
(`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorSwatch`, `ColorField`) are
self-drawn shared components: their shared props produce the same component
design across targets, rather than exposing OS chrome. Color parts report
`'#rrggbb'` hex through `onChange`/`onChangeEnd`; `ColorSlider` is hue-only
and drags are delta-based like `Slider`. `Slider` follows pan
deltas and does not jump to a tapped track position. On web it is a Tab stop:
Arrow keys change 1% of its range, and Home/End choose the bounds. Pair
`value` with `onValueChange` to display the change. `Drawer` has no edge-swipe
gesture on web; provide a visible toggle. `TextInput`, `TextArea`, and
`ScrollableArea` remain OS-backed with normalized chrome because text editing and
scroll behavior belong to the platform.

```tsx
import { useState } from 'octane'
import { Drawer, Switch, Slider, Spinner, TextInput } from '@octane-xplat/ui'

export function Controls() {
	const [packed, setPacked] = useState(false)
	const [volume, setVolume] = useState(50)
	return (
		<>
			<Switch value={packed} onChange={setPacked} />
			<Slider value={volume} onValueChange={setVolume} />
			<Spinner />
			<TextInput label="Bag name" />
			<Drawer
				open={false}
				main={<TextInput label="Packing notes" />}
				drawer={<TextInput label="Drawer notes" />}
			/>
		</>
	)
}
```

## Native macOS images

AppKit `Image` preserves shared layout props, composed classes and style forms.
The optional image package now delegates to the core leaf. Use local placeholders and the shared fit/position props. AppKit now draws
clipped fit rectangles in native logical points, including cover and corner/
percentage offsets. Raw CSS position parsing accepts keywords/px/percentages;
other units or unresolved expressions center with a warning. Resolution candidates use the shared closest-pixel-count rule on box/window-density
changes (use a stable styled box); decode hints remain unimplemented; native cropping/orientation/density are unqualified. The
renderer shares bounded decoded images and cancels pending work after its last
subscriber leaves; HTTP error payloads are rejected and remote delivery enters
the main operation queue. Native timing, rendering and packaging are unqualified.
The optional package now has source-only HTTP(S) byte prefetch, memory/disk
query, eviction and clear through an image-owned disk cache; native qualification
is pending. It uses a credential-free dedicated session. Prefetch headers and
uncacheable responses resolve false. Configuration fields and display headers throw; cachePolicy="none" now has the
matched UI/renderer bypass path below. Decode-
transform queries return none. Load/error callbacks now have the matched
UI/renderer handoff; other engine props remain gaps. The
private imageMemoryCache bridge controls decoded memory only; do not substitute
it for public disk eviction or an account-data purge. Read the
[cache subset](../../../../packages/image/README.md#appkit-subset) before relying on it.
See [AppKit image loading](../../../../docs/app/components.md#image-loading-on-appkit).

```tsx
import { Image } from '@octane-xplat/ui'

export function Photo({ src }: { src: string }) {
	return <Image src={src} alt="Photo" flexGrow={1} contentFit="contain"
		className={['photo', { framed: true }]} style={{ width: 120, height: 80 }} />
}
```

```ts
import { prefetch, isImageCached, evictImage, clearImageCaches } from '@octane-xplat/image'
const src = 'https://example.com/photo.png'
console.log(await prefetch(src), (await isImageCached(src))[src])
await evictImage(src)
await clearImageCaches()
```

For the optional Image, cachePolicy="none" now bypasses framework memory/owned
disk caches. A private per-view handoff retains CoreImage normalization; matching
UI and renderer capabilities are required or it fails before loading. Bypass
work shares only with bypass consumers; mode changes retire old callbacks for
the same URI. This does not purge older entries or platform-internal caches.
Optional onLoad/onError also require matching UI/renderer support. Current
source/mode ownership and root-scope guards retire stale notifications; the
latest handler receives at most one deferred terminal event. Placeholder-only
updates retain work and emit no event; empty sources emit no event. Dimensions
are the largest positive native representation in pixels, or 0×0 if unknown,
never points; source reports request origin, not live cache state. Generic
errors omit URI/NSError details. Adding handlers after completion does not replay.
Native event timing, metadata, cache behavior and retention remain unqualified.

```tsx
import { Image } from '@octane-xplat/image'
export function FreshPhoto({ src }: { src: string }) {
	return <Image src={src} cachePolicy="none" alt="Photo" style={{ width: 120, height: 80 }}
		onLoad={(event) => console.log(event.width, event.height, event.source)}
		onError={({ error }) => console.warn(error.message)} />
}
```

## Native macOS interaction

AppKit `GridList` now registers native rows for roving Tab stops, arrows,
Home/End and Enter/Space activation/selection. Use `columns` for fixed grids
and `layout="stack"` for a vertical list. Prefer `keyboardNavigationBehavior="tab"`
when cells contain interactive controls; nested controls keep their editing
keys. The component skips disabled keys in Shift+Space ranges; Shift+click
ranges remain unavailable. The custom selector-based `useGridList` hook still
reports false on AppKit. OS input, scrolling and accessibility are unqualified;
see [AppKit GridList](../../../../docs/app/components.md#gridlist-on-appkit).

```tsx
import { GridList, Text } from '@octane-xplat/ui'

export function Choices() {
	return <GridList items={[{ id: 'one' }, { id: 'two' }]} columns={2}
		selectionMode="single" renderItem={(item) => <Text>{item.id}</Text>} />
}
```

AppKit `useKeyboard` attaches key-down/up handlers to native intrinsics or
their native ancestors. Shared View/TextInput/Pressable do not forward this
bag. Check bridge capability and preserve composing input; modifier-only events,
extended physical codes and real OS behavior remain gaps. See
[AppKit hardware keys](../../../../docs/app/keyboard-clipboard.md#handle-hardware-keys-on-appkit)
before relying on cancellation or FocusScope coordination.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useKeyboard } from '@octane-xplat/ui'

export function SearchField() {
	const keyboard = useKeyboard({ onKeyDown: (event) => {
		if (!event.isComposing) console.log(event.key, event.code)
	} })
	return <textfield accessibilityLabel="Search" {...keyboard.keyboardProps} />
}
```

AppKit `useFocusWithin` tracks first-responder containment on raw native
containers; shared `View` does not forward its bag. Check
`isSubtreeTrackingSupported`, attach to the actual ancestor, and treat separate
popup windows and app activation independently. Shared field editors resolve
to their owning controls. Physical input, IME and VoiceOver remain unqualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useFocusWithin } from '@octane-xplat/ui'

export function Fields() {
	const within = useFocusWithin({ onBlurWithin: () => console.log('left group') })
	return <masonview {...within.focusWithinProps}>
		<textfield placeholder="Name" />
		<textfield placeholder="Notes" />
	</masonview>
}
```

AppKit `FocusScope` implements containment/autofocus/restoration and nested
ownership when its renderer/input bridge is available. Check
`getFocusScopeCapabilities()`; capability presence is not OS-input evidence.
Nested/sibling scopes and other windows share one observer owner until its last
scope unmounts; each window retains its own active boundary. Retired callbacks
and scopes closed/disabled/replaced by an attached key handler cannot keep
navigating. Cleanup attempts all native removals once even if restoration or
one removal fails; native failure does not establish resource-release proof.
Return paths carry forward when an older scope retires before its replacement,
using saved native ancestry if the removed controls have already detached.
Use a scope for native descendants rather than adding a no-op press action
to make a box focusable. Separate popup windows and hosted editors need their
own focus owners. See [focus behavior](../../../../docs/app/primitives.md#focus-behavior)
for the current subset and unqualified runtime cases.

```tsx
import { FocusScope, TextInput } from '@octane-xplat/ui'

export function Details() {
	return <FocusScope contain autoFocus restoreFocus accessibilityLabel="Details">
		<TextInput label="Name" />
	</FocusScope>
}
```

AppKit `useFocusVisible` now reports keyboard/mouse modality when its native
observer is available. Check `isSupported`; it is a bridge capability rather
than OS-input evidence. Prefer the subscribed hook for render readers. A
global `isFocusVisible()` read retains observation for the module's lifetime.
See [focus behavior](../../../../docs/app/primitives.md#focus-behavior) for
cleanup and the remaining FocusScope/mobile limits.

```tsx
import { Text, useFocusVisible } from '@octane-xplat/ui'

export function InputStatus() {
	const input = useFocusVisible()
	return <Text>{input.isSupported ? input.inputModality : 'Unavailable'}</Text>
}
```

For AppKit responsive choices, use `useMediaQuery`'s
[documented native subset](../../../../docs/app/components.md#responsive-appkit-layout).
It observes the primary host window and desktop pointer/hover traits; it does
not provide secondary-window ownership or reduced-motion queries. Actual native
resize/rendering remains unqualified.

```tsx
import { Text, useMediaQuery } from '@octane-xplat/ui'

export function LayoutHint() {
	const wide = useMediaQuery('(min-width: 800px)')
	return <Text>{wide ? 'Wide' : 'Compact'}</Text>
}
```

For experimental native macOS selection tracks, use the shared
`SegmentedControl` and `SegmentedControlItem` names. The AppKit leaf implements
selection and scoped arrow/Home/End handling, but OS input, focus appearance
and VoiceOver remain unqualified. See [AppKit segments](../../../../docs/app/components.md#appkit-segmented-control).

```tsx
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'

export function ViewMode() {
	return <SegmentedControl defaultValue="list" accessibilityLabel="View">
		<SegmentedControlItem value="list" label="List" />
		<SegmentedControlItem value="grid" label="Grid" />
	</SegmentedControl>
}
```

## Platform-authentic subpaths

The OS widget is the value of these exports. They are intentionally absent
from the shared root barrel.

Choose an OS subpath when platform chrome is the intended behavior. The
[platform widgets guide](../../../../docs/app/primitives.md) and package export
map own the complete inventory; import only names declared by that subpath.
For example, an iOS switch belongs in an `.ios` leaf:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// PackingToggle.ios.tsx
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackingToggle() {
	return <UISwitch value={false} onChange={console.log} />
}
```

## Removed from the shared surface

- `Modal` has no shared root export. `List`/`ListItem` now provide a bounded
  content list; use `VirtualList` for long windowed collections. Shared
  `Dialog`/`BottomSheet`/`Overlay` own temporary surfaces, while
  `UIModal`/`MaterialDialog` provide platform-authentic modal UI.
- `openModal`, `PlatformBadge`, and the shared `glass` container prop are not
  root exports. `openModal` is available only from iOS and Android subpaths.
  `HoverCard` and `Tooltip` are shared root exports; qualify pointer/touch
  behavior per target and keep essential information in visible content.

## Contracts that differ from DOM/React habits

- **Removing a prop restores its default.** A prop that disappears between
  renders — or is passed `undefined`/`null` — resets to the value it holds
  when never supplied (per-key inside `style` too), on web, iOS, Android,
  and macOS. A nullable API may explicitly give `null` a meaning; otherwise
  pass `''`, `0`, or `false` when the default is not the value you want.
- **`on*` props re-commit every render** — inline closures always read
  current state. A listener you attach yourself (`view.on('pan', fn)` in an
  effect or ref callback) binds once at mount and keeps the mount-render
  closure; read live state through a ref or `useEffectEvent`, and clean it
  up on detach.
- **`ref` is the binding prop** (`bind` was removed — see
  docs/app/primitives.md#migrate-from-bind). `View`/`Pressable` forward the
  host view; controls expose documented handles instead
  (`TextInputHandle` = `focus`/`blur`/`native`). On native the handle can
  arrive before the view's OS peer is `loaded` — gate peer-specific work on
  load, not ref assignment.
- **`Grid` places children by forwarded props.** `row`/`col` are
  zero-based; a composite cell must spread its placement props onto its own
  root view or it auto-places. `gap` was removed — space children with
  margins. Native components translate placement to CSS grid styles and Mason
  performs layout; the former imperative placement pass is gone. Measure after
  layout rather than assuming coordinates update synchronously with state.
  For bounded cells, use CSS zero-minimum tracks and omit the corresponding
  `rows`/`columns` prop so CSS owns that axis; see
  [Grid placement](../../../../docs/app/primitives.md#grid-placement).
- **Use `ScrollableAreaHandle` for scroll commands.** Mobile/Windows native
  hosts are Mason wrappers, not NativeScript ScrollView instances. Use the
  portable command; iOS currently moves instantly even with `animated: true`.

  ```ts
  import type { ScrollableAreaHandle } from '@octane-xplat/ui'
  function showStart(viewport: ScrollableAreaHandle) {
      viewport.scrollToOffset({ block: 0 })
  }
  ```

- **Text controls report the new string.** `TextInput`'s `onChange` gets
  `value: string`, not an event; controlled `value` writes suppress their
  own echo. `useKeyboardInset()` returns the keyboard inset in dips — zero
  on web/desktop, and on Android it leases window resize, so don't also add
  it as padding there or you double-avoid.
- **Hosted surfaces normalize the frame, not the content.** `WebView`,
  `Video`, `CameraView` render engine-owned pixels — identical props,
  different engine behavior per target. Check `docs/testing/known-limits.md`
  before promising parity.

## AppKit video source subset

Video now selects a package-owned Swift NSView/AVPlayerLayer surface with shared
VideoChrome. Rebuild the AppKit app after adding the package; missing bridge
setup fails before mounting. Sources are HTTP(S), absolute/file URLs or ~/ bundle
paths. Commands/events use milliseconds; unknown duration is zero. Source/seek
ownership retires old work; explicit play retries failure, same-prop renders do
not. Pre-ready seeks retain the last finite target. Loop suppresses onEnded and
detach pauses native playback. Handle.native is the current NSView; disposed
handles are inert. AppKit onError is generic, unlike the mobile plugin gap.

```tsx
import { Video } from '@octane-xplat/video'
export function Clip({ source }: { source: string }) {
	return <Video src={source} controls style={{ width: 320, height: 220 }}
		onReady={({ duration }) => console.log(duration)} onError={({ message }) => console.warn(message)} />
}
```

Owner callbacks use latest props and source generations; ready is metadata and
playing-change is intent, not rendered frames. Polling is 250 ms for active work,
1 s for paused ready playback only when onError is installed. No ios/android/web
escape bag applies to AppKit. Nine owner cases and target fixture are unrun;
Swift/discovery, playback/audio, callbacks/threads, fit/resize, input/AX, resource
lifetime and packaging remain unqualified. Do not infer Lightbox integration,
DRM, subtitles, background or full streaming support. Read the
[package subset](../../../../packages/video/README.md#experimental-appkit-playback).

## Retained screen layers

`Screen` stays in its parent's flow. To cover retained content, wrap each
layer in `View row={0} col={0}` inside one full-bounds, single-cell `Grid`.
Put `Screen` inside the later wrapper; `Screen` itself has no row/col props.
Do not use flex-column siblings, `flex: 1`, or z-index as a substitute for
layer placement. See [the complete example and host prerequisites](../../../../docs/app/primitives.md#layer-a-screen-over-retained-content).
On native, the foreign RootLayout shell fills that slot; `Screen.className`
and `Screen.style` address its inner Mason column. Put parent bounds on the
layer wrapper rather than pinning the shell to the display height, which
does not follow a resized activity window.

```tsx
import { Grid, Screen, Text, View } from '@octane-xplat/ui'
import './screen-layers.css'

export function RetainedLayers() {
	return <Grid rows="*" columns="*" className="screen-layers-host">
		<View row={0} col={0}><Text>Library</Text></View>
		<View row={0} col={0}>
			<Screen className="screen-layers-screen"><Text>Player</Text></Screen>
		</View>
	</Grid>
}
```

```css
/* screen-layers.css */
.screen-layers-host { width: 100%; height: 100%; }
.screen-layers-screen {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	flex: 1;
}
```

The maintained layer regression qualifies height resizing on both mobile
platforms and width resizing on Android. An iOS nested stage can still report
zero width after settling; follow the [known-limits evidence](known-limits.md)
before promising nested-stage width parity.

## Conventions

- `className` composes with each leaf's own `vx-*` class. Pass arrays directly
  to the JSX prop, for example `className={['vx-view', props.className]}`.
- `id` sets the element id — probes find views by it (`getViewById` on
  native, DOM id on web).
- Pan events normalize to `{x,y,dx,dy,vx,vy,state,target}` and swipe events
  to `{direction}`. Native pan velocity is wired on iOS through
  `velocityInView` and on Android through `VelocityTracker`; both report
  velocity in dips per second.
- `children` is a universal renderable; avoid over-typing it.
- Accessibility props map to ARIA/native attributes; see
  `docs/platform/platform-services.md` for the current mappings.

## What primitives deliberately don't do

No theming props (tokens + classes own that), no layout props beyond the
portable layout surface, and no state: components are controlled or
uncontrolled per prop, never both.

### Media and secondary row actions

Use the public `useImageMode(src, { region, threshold, fallback })` hook for
browser image luminance, and a nested `Theme` with an explicit mode for the
exercised MediaTheme light/dark contract. Keep the nearest registered theme so
root theme switching still flows through. Native image sampling is unavailable
and returns the supplied fallback. Do not report fallback as detection.

```tsx
import { Theme, Text, defineTheme, getRegisteredTheme, useThemeName, useImageMode } from '@octane-xplat/ui'

const mediaTheme = defineTheme({ name: 'media' })
export function Caption(props: { src: string }) {
  const theme = getRegisteredTheme(useThemeName()) ?? mediaTheme
  const mode = useImageMode(props.src, { fallback: 'dark' })
  return <Theme theme={theme} mode={mode ?? 'dark'}><Text>Photo caption</Text></Theme>
}
```

`useContainerReveal` exposes only `isEnabled` and the two default prop getters.
Spread container props on the row and content props on its secondary actions.
Web uses scoped CSS hover/focus-within. AppKit now has a capability-gated CSS
hover/focus-within source path: nested containers reset their inherited opacity,
actions keep layout space and remain mounted, and missing native tracking keeps
them visible. There is no transition or new hook-owned observer; the renderer
owns tracking and focus updates. Native hover/Tab/focus/AX/packed behavior is
unrun. Touch/other native defaults remain visible; force/delay and inverted
reveal remain gaps.
See [the media guide](../../../../docs/app/components.md#media-contrast-and-row-actions).

```tsx
import { Button, HStack, useContainerReveal } from '@octane-xplat/ui'

export function RowActions() {
  const reveal = useContainerReveal({ isEnabled: true })
  return <HStack {...reveal.getContainerProps()}><HStack {...reveal.getContentRevealProps()}><Button label="Edit" /></HStack></HStack>
}
```

## Grouped and tree tables

Use the bounded `Table` plugin pipeline for grouped rows, detail panels and
trees; see [group and expand table rows](../../../../docs/app/tables.md) for complete
examples. Feed `useTableGroupedRows` its post-filter/sort/page data and pass its
returned `data` and `idKey` to Table. Pair `useTableTreeState` with
`useTableTreeData`; sort siblings with `sortSiblings: sortable.applySort`, never
the flattened tree. Row-index numbering follows the data array supplied to
`useTableRowIndex`. IDs must be globally unique within a tree.

```tsx
function ExampleTable() {
  const state = useTableTreeState({ data, idKey: 'id' })
  const tree = useTableTreeData({ ...state.treeConfig, hasExpandAllControl: true })
  return <Table data={state.visibleData} columns={columns} idKey="id" plugins={{ tree }} />
}
```

AppKit useTableStickyColumns now has an experimental native placement source
path for contiguous start/end runs. Use one instance per data Table. Original
measured cell/row bounds include expanded proportional widths; renderer-owned
constraint offsets and sibling order move existing native cells. RTL edge math,
row clamping, start-side overlap priority and teardown are source paths, not
native input/AX proof. Missing bridge leaves ordinary scrolling. No web shadows
or transitions are supplied. Native pin/order timing, backgrounds, button/field
hit-testing, IME/Tab/VoiceOver and clean packaging remain unrun. Child-composed
tables and other native fallback leaves have no pinning implementation. Web
uses declared minimum-width offsets; use pixels there for exact pinned offsets.

```tsx
function ExampleTable() {
  const sticky = useTableStickyColumns({ startKeys: ['name'], endKeys: ['status'] })
  return <Table data={data} columns={columns} idKey="id" plugins={{ sticky }} />
}
```

AppKit useTableColumnResize now applies current controlled widths to the full
column plan, so header/body/minimum scroll sizing share the override. Removing
it restores the original width; locked columns still accept programmatic
values. Finite nonnegative values are required; invalid visible values reject
the transform under existing plugin error isolation. Unknown keys are ignored.
AppKit now has source-owned header resize handles with drag preview, mirrored
RTL arrows/deltas, Home/End, Escape cancellation, min/max constraints and commit
callbacks. A native splitter role/value/range and AX adjustment source path is
added. With columnWidths present the parent must acknowledge commits; without
it the plugin owns committed widths. The web source retains local overrides
and lacks mirrored RTL deltas; do not claim behavioral parity. Native pan/key/
AX/hit-testing, sticky composition, layout and cleanup remain unrun.

```tsx
import { Table, pixel, useTableColumnResize } from '@octane-xplat/ui'
export function ResizedTable() {
  const resize = useTableColumnResize({ columnWidths: { name: 320 } })
  return <Table data={[{ name: 'Ada' }]} columns={[{ key: 'name', width: pixel(180) }]}
    plugins={{ columnResize: resize }} />
}
```

AppKit data Table now wires textOverflow wrap/truncate to the labels produced
by the shared plan's default body renderer, including mode removal and full-text
retention. A target-only CSS class allows those labels to shrink within their
cell. Keep this owned subset: custom renderCell strings/slots, headers and
children-mode content retain their own behavior. Do not copy non-inherited
text-overflow from the container or rewrite opaque children. Four object-driver
cases and two HMR compiler cases are authored but unrun; actual Mason row/column
sizing, ellipsis/paint, resize/sticky/input/AX and installed consumers remain
unqualified. See [the table guide](../../../../docs/tables.md#choose-body-text-wrapping-on-appkit).

```tsx
import { Table, pixel } from '@octane-xplat/ui'
export function CompactTrips() {
  return <Table data={[{ name: 'A long weekend in the mountains' }]}
    columns={[{ key: 'name', width: pixel(180) }]} textOverflow="truncate" />
}
```

## Rich and streamed text

Use `@octane-xplat/ui/markdown` for `Markdown` and `useStreamingText`; chat
components live at `@octane-xplat/ui/chat`. Markdown accepts exactly one of
`text` or `data`. Tables, task markers, strike, code fences and `[id]` citations
are supported. `sources` maps ids to public Citation sources; these are individual labelled links, matching the pinned example.
Keep source keys in first-citation order for consistent numbering. See the [content guide](../../../../docs/app/content-display.md#markdown-documents).

```tsx
import { Markdown, useStreamingText } from '@octane-xplat/ui/markdown'

function Response(props: { text: string; streaming: boolean }) {
	const displayed = useStreamingText(props.text, props.streaming, { speed: 'fast' })
	return <Markdown text={displayed} isStreaming={props.streaming} density="compact" headingLevelStart={3} />
}
```

Do not infer OS speech from a dictation button or mock recognition callback.
`useChatDictation` reports `isSupported: false` on native; expose an unavailable
state. Browser recognition also depends on host permission and service support.
The sandbox's dictation state fixtures do not start recognition.

```tsx
import { ChatDictationButton, useChatDictation } from '@octane-xplat/ui/chat'
import { Text } from '@octane-xplat/ui'

function Dictation() {
	const dictation = useChatDictation()
	return dictation.isSupported
		? <ChatDictationButton dictation={dictation} />
		: <Text>Dictation is unavailable on this host.</Text>
}
```


## AppKit multiline submission

Use `returnKeyType="done"` or `"send"` with `TextArea.onSubmit`; other Return
keys keep newline behavior. Disabled/read-only controls suppress edit/submit
callbacks. The multiline native delegate does not consume Return while marked
text is present. This source guard is not real IME or OS-keyboard qualification;
see [text entry](../../../../docs/app/primitives.md#text-and-keyboard-actions).

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Composer() {
	return <TextArea returnKeyType="send" onSubmit={() => console.log('Send')} />
}
```


AppKit text controls now create a native Field for standalone label/description/
status/width props, and reuse the surrounding Field when present. Keep status
and descriptions on that enclosing Field when it owns the form. Field's default
layout is a column; inline CSS strings remain supported. Native layout, label
interaction and VoiceOver still require qualification.

```tsx
import { Field, TextInput } from '@octane-xplat/ui'

export function AccountName() {
	return <Field label="Name" description="Shown publicly">
		<TextInput />
	</Field>
}
```


AppKit TextInput renders `startIcon` as a registered glyph name or supplied node;
SearchInput uses that path for the default/custom icon and omits it for
`icon={false}`. Its omitted placeholder remains absent. Placeholder text color
is forwarded by TextInput and merged beneath authored TextArea styles. Removing
the TextArea prop releases its default; authored placeholderColor still wins.
Native placeholder color, glyph layout/accessibility remain unqualified;
see [search fields](../../../../docs/app/primitives.md#when-a-screen-needs-more).

```tsx
import { SearchInput, TextArea } from '@octane-xplat/ui'

export function Search() {
	return <>
		<SearchInput label="Find" icon={false} placeholder="Search by name" />
		<TextArea label="Note" placeholder="Add a note" placeholderTextColor="#68707e" />
	</>
}
```


## AppKit scroll offsets

Use the portable ScrollableArea handle for logical start/top offsets in AppKit
points. Its inline offsets/state and inline padding follow useDirection; RTL
start is the right edge. Internal VirtualList/chat/tab helpers retain physical
coordinates. The shared native seek logic clamps ranges; omitted
axes retain their origin and missing animator selectors fall back to an instant
seek. Native coordinate reads use the generated NSView `flipped` property,
including measurements. Source/object-driver cases do not qualify OS scrolling,
animation or virtualization performance.

```tsx
import { useRef } from 'octane'
import { Button, ScrollableArea, type ScrollableAreaHandle } from '@octane-xplat/ui'

export function Notes() {
	const viewport = useRef<ScrollableAreaHandle | null>(null)
	return <>
		<Button label="Top" clickAction={() => viewport.current?.scrollToOffset({ block: 0 })} />
		<ScrollableArea ref={viewport} height={200}>Notes</ScrollableArea>
	</>
}
```


AppKit renderer geometry subscriptions are node-owned across partial setup,
replacement and teardown. Native cleanup is captured, all removals are attempted
once, queued work checks current scroll/clip/document ownership and old cleanup
cannot clear a newer lease. Invalid dimensions do not reach native scrolling;
failed layout/positioning can retry on a later frame, and failure does not consume
initial-position readiness. Shared notification-enable flags stay enabled.
Nine source/caller cases are authored but unrun. These are source repairs, not
OS notification, resize/scroll/elasticity/memory or installed proof. Keep pull-to-
refresh separate; do not apply the iOS contentInset mechanism to AppKit without
native phase/docking evidence. See [renderer ownership](../../../../packages/macos-renderer/README.md#own-scroll-geometry-observation).

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'

export function Notes(props: { height: number }) {
	return <ScrollableArea height={props.height}><Text>Trip notes</Text></ScrollableArea>
}
```

AppKit ScrollableArea forwards declared testID, accessible, hint and value to
the native viewport. accessibilityLabel wins over label. The renderer uses
accessibilityHelp/value descriptions without changing scroll role, contents or
position; empty strings remain explicit, removed descriptions clear to nil and
removed accessible restores participation. Source cases and the manual fixture
are unrun. VoiceOver hierarchy/descendant navigation, native setters/updates,
identity and packing remain unqualified; arbitrary role/state/live behavior and
pull-to-refresh are still separate gaps.

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'
export function Notes({ count }: { count: number }) {
	return <ScrollableArea label="Notes" height={200} testID="notes"
		accessibilityHint="Scroll to review." accessibilityValue={`${count} notes`}>
		<Text>Trip details</Text>
	</ScrollableArea>
}
```

## AppKit multiline length limits

`TextArea.maxLength` bounds committed user edits in UTF-16 units, preserving
text outside a paste/replacement and avoiding split surrogate pairs. Marked text
can exceed the limit until commit. Programmatic initial/external values remain
untouched; omit the cap to remove it. This is not a grapheme count. Native IME,
undo/redo, selection and correction-event timing remain unqualified; see
[growing a multiline field](../../../../docs/app/primitives.md#grow-a-multiline-field).

```tsx
import { TextArea } from '@octane-xplat/ui'

export function ShortNote() {
	return <TextArea label="Short note" maxLength={80} />
}
```


## AppKit multiline sizing ownership

TextArea rows/autoGrow/maxRows and its scrollable document already have native
source paths; do not infer their absence from prop-loop continue branches.
Own resize observation before cleanup/registration, capture the center/remover/
token and exact editor/viewport/clip/document, and suppress setup/retired callbacks.
Retire before other destroy effects; fitting rechecks scope after native layout/
constraint effects before later editor/frame writes. Preserve current geometry,
text limits, submit/composition and editing behavior. Do not restore shared frame-
notification flags during cleanup. Initial applyProps performs the initial fit.

```tsx
import { TextArea } from '@octane-xplat/ui'
export function NoteEditor(props: { shown: boolean; value: string; change(value: string): void }) {
	return props.shown ? <TextArea label="Note" value={props.value} onChange={props.change}
		autoGrow rows={2} maxRows={4} /> : null
}
```

Eleven new source/VM cases and added width/cap/growth/removal controls in the
existing text-entry ownership fixture are UNRUN. Native add throwing without a
returned handle and failed removal cannot prove resource recovery; automatic
external clip/document migration is unqualified. No native measurement/scroll/
IME/undo/focus/AX/memory/installed or visual claim follows from these guards.
See [growth ownership](../../../../docs/app/primitives.md#keep-appkit-growth-with-its-editor)
and [renderer contract](../../../../packages/macos-renderer/README.md#own-multiline-resize-observation).

## Controlled AppKit text during composition

TextInput/TextArea (and delegated SearchInput) keep a differing value pending
while the native editor has marked text. The latest controlled prop applies
after commit unless a newer matching echo cancels it; removing/unsetting the
value cancels pending work. Writes reuse the host and clamp selection when the editor identity survives. Raw `<searchbar text>` shares marked-text deferral but emits property-change
events for changed programmatic writes; dropping `text` requests an empty string,
not an uncontrolled handoff. Actual IME, focus, selection,
window changes and packaging still require qualification; see
[text actions](../../../../docs/app/primitives.md#text-and-keyboard-actions).

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Draft({ value, onChange }: { value: string; onChange(value: string): void }) {
	return <TextArea label="Draft" value={value} onChange={onChange} />
}
```


```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function RawSearch({ query, onQuery }: { query: string; onQuery(value: string): void }) {
	return <searchbar text={query} onTextChange={(event) => onQuery(event.value)} />
}
```

The writer now owns pending intents, observation/schedule acquisition and registry
initialization/retirement before side effects. Retired/held callbacks cannot
overwrite replacement work; cleanup tombstones both records before attempting
both releases, and late returned handles receive one release attempt. Synchronous read/setter
errors still propagate; deferred faults use fixed diagnostics without error/input
payloads and retain explicit later update/commit retry. Failed task/write attempts
retire window observation to avoid repeated update-driven retries. Missing-window
observation returns no handle, allowing later acquisition. Fourteen source cases
and an extended idle fixture remain unrun. Native observer migration, unreturned
handles on registration throws, actual IME/caret/undo/AX/memory/installed behavior
remain open. See [pending values](../../../../docs/app/text-entry.md#keep-pending-appkit-values-with-their-field).

```tsx
import { TextInput } from '@octane-xplat/ui'
export function CurrentName(props: { name: string; onChange(value: string): void }) {
  return <TextInput value={props.name} onChange={props.onChange} />
}
```

## AppKit number fields

NumberInput now wires `units`, `formatValue`, `hasNumberSteppers` and `hasClear`
on AppKit. Clear reports null then onClear. Stable Field ownership supplies
metadata and inherited disabled/read-only state, including stepper blocking.
Held edit/step/clear actions read current props; local intent updates before
render, while controlled values require parent feedback. One claim rejects
cross-action reentry and detached/blocked requests. Hidden step/clear affordances
reject held actions. Steps and clear defer during marked editor text; drafts
still report. Clear captures onValueChange(null) then onClear across replacement
or detach; consumer errors propagate after releasing the claim and a throwing
onValueChange skips onClear. No keyboard spinner behavior is added.
Formatting is display-only; the existing parseFloat edit behavior is unchanged.
Native layout, formatted edits, IME, focus and accessibility remain unqualified.
See [AppKit number fields](../../../../docs/app/components.md#number-fields-on-appkit).

```tsx
import { NumberInput } from '@octane-xplat/ui'

export function Quantity() {
	return <NumberInput label="Quantity" defaultValue={2} min={0} max={9}
		units="kg" hasClear hasNumberSteppers={false} />
}
```


## AppKit sliders

Use scalar or pair values with explicit bounds; controlled sliders need
onValueChange feedback. The AppKit leaf implements steps, noncrossing range
thumbs, marks, text/hover readouts and inherited Field blocking. Dragging stays
delta-based; it does not jump on track taps. Retained thumb key/adjustable
handlers read current values, bounds, steps and callbacks, reject current
blocking/detachment, and claim adjustments before app callback reentry. Consumer
errors propagate after releasing the claim. Preview ownership follows the active
drag: matching normalized starting/latest-requested values are feedback; other
parent values, mode/limits/shape changes or blocking retire it. Keys/adjustable
actions end the preview. An equal normalized prop write cannot signal reset.
Native keyboard, accessibility,
hover timing and layout remain unqualified. See [AppKit Slider](../../../../docs/app/components.md#slider-on-appkit).

```tsx
import { Slider } from '@octane-xplat/ui'

export function Budget() {
	return <Slider label="Budget" defaultValue={[20, 80]} min={0} max={100}
		step={5} valueDisplay="text" />
}
```


## AppKit switch saves

Switch now invokes changeAction after onChange, exposes pending through busy,
blocks overlapping saves, and reports the previous value on failure. Completion
after unmount is ignored. Ownership starts before onChange; cached handlers use
current props, so reentry or newly blocked state cannot duplicate an action. A
save requested by a valid event still runs if onChange detaches the UI, but cannot
publish pending/rollback afterward. Forward callback errors release ownership and
propagate; rollback callback faults are logged and release busy. Controlled
parents must apply both forward and rollback callbacks. Four added cases remain
unrun; native activation/loading presentation remain unqualified. See
[switch saves](../../../../docs/app/components.md#save-a-switch-setting-on-appkit).

```tsx
import { Switch } from '@octane-xplat/ui'

export function Preference({ save }: { save(next: boolean): Promise<void> }) {
	return <Switch accessibilityLabel="Preference" defaultValue changeAction={save} />
}
```


AppKit Switch retains a separate latest uncontrolled intent before forward
state/callback writes, and restores it before rollback callbacks. Held no-save
requests before render use that intent; controlled requests use the parent's
current value and never replace the original local seed. Forward callback throw
retains its already-applied intent while releasing the claim. Pending claims,
current blocking/callbacks, event save ownership and detach guards remain in force.
Five new object-driver cases and extended human-operated fixture controls are
UNRUN. The fixture's run hook still covers only original metadata/direct button
dispatch, not the new local/save/controlled flows or physical input.

```tsx
import { Switch } from '@octane-xplat/ui'
export function ArchiveFlag({ change }: { change(enabled: boolean): void }) {
	return <Switch label="Include archived" defaultValue={false} onChange={change} />
}
```

## AppKit switch metadata

Standalone Switch renders its label, description and detached status; parent
Field keeps ownership when present. labelPosition/labelSpacing and sm/md classes
use the shared geometry; metadata changes retain the toggle's state/host. Hidden
labels keep the accessible name. Label presses now share the toggle/save owner,
focus the control and lease Tab exclusion for the label target. Without the
renderer suppression capability only track activation is enabled. Native hit
testing, tooltip arbitration, Tab/focus/layout/VoiceOver are unqualified. See
[switch settings](../../../../docs/app/components.md#save-a-switch-setting-on-appkit).

```tsx
import { Switch } from '@octane-xplat/ui'

export function Alerts() {
	return <Switch label="Alerts" description="Daily summary" defaultValue
		labelPosition="start" labelSpacing="spread" width={280} />
}
```


## AppKit checkbox metadata

Checkbox renders standalone label/description/status, reuses enclosing Field
ownership, and hides text without dropping the accessible name. labelTooltip now
forwards to the standalone FormField info affordance; an enclosing Field keeps
that chrome. Metadata changes retain the host/state. Native tooltip activation,
input/layout/accessibility remain unqualified;
changeAction is still ignored on AppKit, with mixed rollback contract work open.
Use controlled state and onChange for saves; see
[checkbox metadata](../../../../docs/app/components.md#checkbox-metadata-on-appkit).

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function IncludeArchived() {
	return <Checkbox label="Include archived" labelTooltip="Include archived records" description="Search older records" defaultValue />
}
```


AppKit Checkbox now owns current props, latest uncontrolled intent and a
per-callback claim. Held callbacks recheck current inherited blocking/attachment;
local requests before render use the previous accepted intent, while controlled
requests continue from the parent's value. Suppress callback reentry, retire on
host detach and release claims on consumer throw without undoing local state.
Do not infer async save support: the boolean callback/mixed rollback conflict
remains open. Six new object-driver cases and human-operated controls in the
existing checkbox-list fixture are UNRUN; its run hook still dispatches only the
original list-child selection. Native events/refs/focus/AX/layout/installed
qualification remains separate.

```tsx
import { useState } from 'octane'
import { CheckboxInput } from '@octane-xplat/ui'
export function ArchiveFilter() {
	const [include, setInclude] = useState(false)
	return <CheckboxInput label="Include archived" value={include} onChange={setInclude} />
}
```

## AppKit busy feedback

Spinner now forwards named sizes, text/node labels, contrast, accessible names,
class/style forms and busy=false removal. Switch shows a compact ring while
saving or externally loading. AppKit-specific rotation now uses the existing
renderer keyframe sampler; reduced-motion rules leave the ring steady. Workspace
display-option notifications queue media refresh. This is a source path, not
proof of playback or OS notification delivery; layout, clipping, contrast and
accessibility are unqualified. See
[busy feedback](../../../../docs/app/components.md#busy-feedback-on-appkit).

```tsx
import { Spinner } from '@octane-xplat/ui'

export function Saving() {
	return <Spinner size="sm" label="Saving settings" />
}
```


AppKit ProgressBar subscribes to theme changes and preserves object/array/CSS
styles with authored overrides. It forwards declared accessible/name/hint/value
props. Indeterminate mode skips the formatter, readout, marks and numeric AX
range/value, and sets busy state; disabled state is separate. Its unknown fill
now selects AppKit sliding keyframes and clips to the track; reduced-motion
rules leave it steady, and determinate mode removes the animation class.
Native animation/preference delivery, theme presentation, layout and VoiceOver are
unqualified; do not infer them from mounted metadata.

```tsx
import { ProgressBar } from '@octane-xplat/ui'
export function Upload({ percent }: { percent?: number }) {
	return <ProgressBar label="Upload" value={percent} isIndeterminate={percent === undefined}
		hasValueLabel accessibilityHint="Keep the app open" style="width:240px" />
}
```

AppKit Meter root/purpose/ProgressGroup paths now use one leaf. It preserves
caller children, the existing unfilled track and authored style forms; numeric
accessibility uses shared normalized finite bounds. Invalid/nonpositive size
uses 24; nonfinite stroke width uses 3 and finite width clamps to size. Value
arc/color remain gaps; do not infer a filled gauge or native AX proof.

```tsx
import { Meter, Text } from '@octane-xplat/ui'
export function Storage() {
	return <Meter value={6} maxValue={10} size={48} accessibilityLabel="Storage">
		<Text>6 GB</Text>
	</Meter>
}
```

## Self-drawn AppKit accessibility prerequisites

The renderer now maps switch/tab/tablist/adjustable/link container roles and
numeric/selected values, honors accessible=false, and dispatches native
increment/decrement callbacks in a discrete event scope. Value/selection prop
updates post change notifications. This closes source wiring gaps, not native
VoiceOver or selector-registration qualification. Existing UI handler cases
alone did not prove that renderer bridge. See
[renderer contract](../../../../packages/macos-renderer/README.md#self-drawn-control-accessibility).

```tsx
import { Slider, Switch } from '@octane-xplat/ui'

export function Settings() {
	return <><Switch label="Alerts" defaultValue /><Slider label="Volume" defaultValue={40} /></>
}
```


Read native enabled state through `isAccessibilityEnabled` on AppKit hosts.
The renderer exposes that exact protocol getter; `accessibilityIsEnabled` is not
its native selector. Choice/grid/scope/layer/context focus policies use the native
getter and preserve explicit disabled-card focus claims without enabling actions.
A direct call to a helper with the wrong name cannot establish AX enabled state.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save() {
	return <Button label="Save" isDisabled clickAction={() => console.log('save')} />
}
```

The selector/state source case and revised focus/action fixtures are unrun.
Native selector binding, focus, VoiceOver and packaging remain unqualified.


## AppKit text clear focus

TextInput/SearchInput clear now requests focus on the retained native input after
onChange('') and onClear. Controlled parents still own value feedback. Refocus
requires the same attached input/window/responder and current editable state;
callback-driven focus choices and teardown win. Actual focus/caret/IME and
clear hit testing remain unqualified. See
[clear and continue](../../../../docs/app/primitives.md#clear-and-continue-typing-on-appkit).

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Search() {
	return <SearchInput label="Find records" hasClear defaultValue="recent" />
}
```


## AppKit action keys and shortcuts

Self-drawn action hosts now reserve Enter/Space activation for unmodified or
Shift-only keys. Control/Option/Command combinations, disabled/read-only
accessibility state and absent actions pass through native key handling. This
is source behavior, not proof of OS shortcuts/menu equivalents or input-source
switching. See [native activation](../../../../packages/macos-renderer/README.md#self-drawn-control-keyboard-activation).

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): void }) {
	return <Button label="Save" clickAction={save} />
}
```


## AppKit radio composition

RadioList options and RadioListItem children now share the group context and
controlled/uncontrolled selection. Native rows expose radio/checked/name
semantics and render descriptions/endContent. Standalone Field metadata is
stable; an enclosing Field retains ownership. The macOS root explicitly selects
the new child leaf. Held item/key handlers now read current group/row state;
mounted registration and reentry guards reject retired/nested selection.
Uncontrolled local values suppress immediate duplicates before render; controlled
parents retain feedback authority. Ordinary form groups now request selection after Arrow/
Home/End focus, with RTL horizontal keys and owned roving Tab exclusions when
the native bridges are available. Disabled/read-only groups do not install keys;
interactive trailing children keep their own keys. Native input/Tab/reveal,
VoiceOver and layout remain unqualified; toolbar-specific navigation is still
unsupported. See
[radio choices](../../../../docs/app/components.md#radio-choices-on-appkit). Eight
ownership cases are authored, unrun, alongside the existing composition/focus
cases. The fixture adds current blocking/value/acceptance/focus controls; its run
hook still checks direct selection only.

```tsx
import { RadioList, RadioListItem } from '@octane-xplat/ui'

export function Plan() {
	return <RadioList label="Plan" defaultValue="free">
		<RadioListItem value="free" label="Free" description="Personal use" />
		<RadioListItem value="team" label="Team" />
	</RadioList>
}
```


## AppKit PIN field ownership

PinInput now resolves inherited Field gates/metadata, gives each cell a unique
ID and digit name, and cancels pending focus when blocked. One stable Field owns
standalone metadata. Shared last-character paste and suffix-truncation editing
remain unchanged. Plain empty-cell Backspace now requests previous-cell focus
without changing the code; filled cells/IME/modified keys keep editor ownership.
OTP autofill and native focus/IME/secure/
VoiceOver qualification remain open. See
[PIN fields](../../../../docs/app/primitives.md#pin-fields-on-appkit).

```tsx
import { PinInput } from '@octane-xplat/ui'

export function Code() {
	return <PinInput label="Account code" description="Enter four characters" length={4} />
}
```


## AppKit late control actions

Native click recognizers now have ownership separate from accessibility IDs.
Controls mounted disabled/read-only can install a callback later; updates reuse
one recognizer, removal disables it and teardown removes it. This repairs source
wiring, not actual native re-enable/hit-testing or lifecycle qualification. See
[click ownership](../../../../packages/macos-renderer/README.md#update-self-drawn-click-actions).

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function Choice({ saving }: { saving: boolean }) {
	return <Checkbox label="Include archived" isDisabled={saving} />
}
```


## AppKit checkbox-list composition

CheckboxList options and CheckboxListItem children now share selection and Field
ownership. Standalone/value-less items use controlled isChecked/onCheck, with
native mixed-state semantics. Group writes are idempotent and uncontrolled
batched requests preserve the latest set. Description/endContent, indicator
registry and class/style/divider hooks are forwarded. Native clicks/Tab, nested
controls, mixed VoiceOver and layout remain unqualified; see
[checkbox lists](../../../../docs/app/components.md#checkbox-lists-on-appkit).

```tsx
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

export function Features() {
	return <CheckboxList label="Features" defaultValue={['email']}>
		<CheckboxListItem value="email" label="Email" description="Daily summary" />
		<CheckboxListItem value="alerts" label="Alerts" />
	</CheckboxList>
}
```


## AppKit button actions and links

Use the dedicated AppKit Button leaf (re-exported by controls). It wraps primitive
children, forwards inherited Pressable props and preserves content while busy.
Noninterruptible actions acquire a synchronous ownership token; interruptible
overlap stays busy until all calls settle. Group/explicit disablement always
wins. Held presses read current props/group/loading/interruptibility and active
tokens rather than rendered pending state. Claim before URL dispatch; accepted
calls retain their action/error pair across props/ref replacement or teardown.
Ref handoff preserves pending tokens; detached presses are inert. URL opener
throws release the claim and propagate without invoking the action. Action or
then-access errors use the captured onActionError, and unmount stops pending UI
writes while accepted app work and its failure reporting continue.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): Promise<void> }) {
	return <Button label="Save" clickAction={save} />
}
```

Button href is sanitized and handed to the platform opener before clickAction.
It does not use the router; target has no native browsing-context behavior.
Native URL opening/input/VoiceOver/busy geometry remain unqualified.
Focus-triggered tooltip presentation is still missing. Button tooltip now assigns the
native NSView.toolTip pointer hint, updates/removes on props and clears on
teardown. Keep it while busy/disabled without changing label/accessibilityHint;
AppKit owns timing and appearance. IconButton/ToggleButton inherit it. Native
hover delivery, focus and AX semantics remain unqualified. See the [source contract](../../../../docs/app/components.md#appkit-button-actions-and-links).

```tsx
import { Button } from '@octane-xplat/ui'

export function Help() { return <Button href="https://example.com/help" tooltip="Read help">Help</Button> }
```


IconButton.macos is a thin wrapper around Button.macos with isIconOnly, matching
the shared native shape. Use the Button contract for pending/overlap/errors,
group defaults, metadata and href. Native pointer-hint presentation/input/VoiceOver
qualification is still open; focus-triggered tooltips remain a gap.

```tsx
import { IconButton } from '@octane-xplat/ui'

export function Share({ share }: { share(): Promise<void> }) {
	return <IconButton label="Share document" icon="share" clickAction={share} />
}
```


## AppKit toggle-button saves

ToggleButton delegates to the target Button action owner, so loading, errors,
overlap, metadata and teardown follow that leaf. Standalone uncontrolled choice
flips optimistically before onPressedChange/pressedChangeAction. Rejection
reports onActionError without rollback; controlled isPressed still follows the
parent. Local intent is separate from controlled/group display; an accepted
Button callback uses its captured controlled value across URL-driven parent
updates and preserves local intent across mode changes. A throwing
onPressedChange retains the local flip, skips the save and uses Button's error
path. Group value membership ignores member save actions.

```tsx
import { ToggleButton } from '@octane-xplat/ui'

export function Pin({ save }: { save(value: boolean): Promise<void> }) {
	return <ToggleButton label="Pin" pressedChangeAction={save} />
}
```

Pressed button state maps to native checked-control role/value and changed-value
notifications. Source cases/fixture are authored but unrun; native VoiceOver,
input, busy geometry, focus-triggered tooltip, reserved semibold width and group/toolbar roving
remain unqualified or absent. See [toggle saves](../../../../docs/app/components.md#save-a-toggle-button-action-on-appkit).


## AppKit interactive cards

ClickableCard sanitizes href and calls the platform opener before onPress;
URL-bearing cards expose a link role, callback-only cards a button role.
Both interactive cards use TextSlot for primitive children and forward
variant/elevation classes. SelectableCard remains controlled. Native appearance,
URL launch and nested-control gesture arbitration remain unqualified; disabled
SelectableCard now retains focus eligibility through the renderer bridge while
keeping activation blocked and disabled semantics intact. Actual Tab/VoiceOver
qualification remains open; native target browsing contexts
are not implemented. See [cards](../../../../docs/app/interactive-actions.md#appkit-card-qualification).

```tsx
import { ClickableCard } from '@octane-xplat/ui'

export function Help() {
	return <ClickableCard label="Open help" href="https://example.com/help" elevation="low">Help</ClickableCard>
}
```


Disabled-card focus uses a reference-counted renderer claim, released on enablement
or detach, without adding an action. FocusScope honors explicit native key-view
eligibility while still excluding disabled native fields, hidden views and Tab
suppression. Hosts missing retainDisabledFocus keep the ordinary disabled focus
behavior; do not infer qualification from bridge presence alone.

```tsx
import { SelectableCard } from '@octane-xplat/ui'

export function UnavailablePlan({ selected, onChange }: { selected: boolean; onChange(value: boolean): void }) {
	return <SelectableCard label="Team plan" isSelected={selected} isDisabled onChange={onChange}>Unavailable</SelectableCard>
}
```


## AppKit finite-option selection

Selector now passes selectionMode=multiple to the target view; MultiSelector
uses that same target container. Checkbox/select-all presentation, mixed bulk
state and native inert guards now follow the existing shared state owner.
Custom renderOption and single renderValue are used through TextSlot; unresolved
selected keys retain the summary fallback. Default option icons are rendered.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]}
		defaultValue={['email']} hasSelectAll />
}
```

Source cases mock the popup inline and remain unrun. The keyboard source path
now covers manual option focus, opening/commit, prefix/search keys and close/Tab
return intent through existing layer ownership. Actual popup/key/IME/focus and
VoiceOver behavior remain unqualified. Alternate presentation and live announcements remain open;
ghost class forwarding is now present, with native paint unqualified. See the [AppKit selection subset](../../../../docs/app/search-selection.md#appkit-finite-option-selection).


AppKit Selector uses native choice ordering with a Select-specific key policy:
arrows/Home/End/Page keys move focus without selection; Enter/Space commits;
Escape closes. Typing searches/cycles labels or enters the local search editor.
Editor caret/space/IME keys and modified shortcuts keep native ownership, except
nonediting multi-picker Command/Control+A bulk selection. Tab close passes the
anchor's same-window next/previous valid key view to the existing layer owner.
The key bridge is required; explicitly unavailable dispatch restores ordinary
option Tab stops. Cases/fixture are authored but unrun, so no native input,
focus/return, containment, scrolling or AX qualification is implied.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Fruit() {
	return <Selector options={[{ value: 'apple', label: 'Apple' }, { value: 'cherry', label: 'Cherry' }]}
		searchable defaultValue="apple" />
}
```


Standalone AppKit Selector now uses FormField for metadata, while an enclosing
Field owns its text once. Stable generated/explicit control IDs, testID, hidden
names and inherited disablement/read-only state reach the retained trigger.
Ghost forwards its shared chrome class. Native geometry, label/tooltip behavior,
AX relationships and identifier replay remain unqualified; source cases are unrun.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Region() {
	return <Selector label="Region" description="Choose a region" testID="profile.region"
		options={[{ value: 'west', label: 'West' }]} isRequired />
}
```

AppKit primary clicks now have a renderer source gate for nested controls: the
actual native hit ancestry rejects ancestor click recognition at a registered
native control, semantic widget (even disabled) or live action host. Decorative
labels/images/groups remain clickable content. Use semantic controls for nested
actions; do not attach no-op actions to layout hosts. This does not qualify
physical pointer delivery, foreign engine views or long-press arbitration.

```tsx
import { Button, ClickableCard } from '@octane-xplat/ui'

export function Entry({ open, remove }: { open(): void; remove(): void }) {
	return <ClickableCard onPress={open}><Button clickAction={remove}>Remove</Button></ClickableCard>
}
```


AppKit MultiSelector now renders triggerDisplay="badges" as keyed removable
values. Known enabled options remove through the existing state/save owner;
unlisted/disabled options retain inert controls. Removal checks current props,
selection and attachment, so cached handlers cannot edit after blocking or detach.
Native click isolation depends on the matching renderer gate and remains unqualified.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector triggerDisplay="badges" defaultValue={['email']}
		options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]} />
}
```


AppKit TextInput, TextArea and SearchInput now forward testID to the editable
field. Updating/removing it keeps that field and its local text; shells, Field
labels and clear actions do not inherit it. Renderer accessibilityIdentifier
mapping is source-present; native discovery/replay remains unqualified.

```tsx
import { TextInput } from '@octane-xplat/ui'

export function Name() {
	return <TextInput label="Name" testID="profile.name" defaultValue="Ada" />
}
```


AppKit menus now align disabled row hosts with their metadata: actions, checkbox/
radio choices and submenus lose native activation while disabled; group radio
state applies to rows. DropdownMenu forwards button.ref and uses button.id unless
its own id is supplied. Destructive tone classes forward across row kinds.
Disabled dropdown/context/submenu surfaces are suppressed even when controlled
isOpen remains true and request onOpenChange(false); Dropdown also observes
button/ButtonGroup disablement. Dropdown trigger/arrow/dismiss requests read
current props and local open intent through one claim. Controlled parents retain
visibility and the original local seed survives mode changes. Current trigger
loading blocks opening unless interruptible; it does not dismiss existing menus.
Nested/detached requests are ignored; button-ref replacement preserves the active
claim. Errors release it without local rollback; existing Button/dismiss error
paths remain. Use the current button prop, not the old trigger spelling. See the [AppKit menu contract](../../../../docs/menus.md#appkit-menu-host-state).

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions({ disabled }: { disabled: boolean }) {
	return <DropdownMenu isDisabled={disabled} button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Remove" variant="destructive" isDisabled={disabled} />
	</DropdownMenu>
}
```

The subsequent menu-surface source path covers arrows/typeahead/submenu intent;
originless/unowned Tab return and
full menu AX roles/checked announcements remain implementation gaps; native popup/ref/focus/
input/VoiceOver behavior is unqualified. Authored inline-popup cases remain unrun.


AppKit MenuSurface now creates a target-private current-row registry in each
popup root. Manual arrows/edges/typeahead use native child order and skip blocked
rows; Enter/Space and submenu direction intents call existing row owners. Row
callbacks read current props and reject detached/disabled hosts. Initial focus
waits for the surface window, and existing choice-helper Tab-stop claims/window
observers are released on detach. Nested endContent editors keep their keys.
Use string labels for typeahead; the private registry is not a public API.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}><DropdownMenuItem label="Archive" /></DropdownMenu>
}
```

Escape remains owned by layer dismissal; unowned surfaces preserve native Tab. Dropdown/submenu anchor return refs do not prove cross-window
return. Closed-trigger arrow intent is now supplied by the target view-key
attachment described below; owned-dropdown Tab intent is now described below; native return remains unqualified.
Seven authored policy/fake-window cases remain unrun; actual keyboard/IME/focus,
popup timing/RTL provider inheritance, AX and packaging remain unqualified. See
[AppKit menu surfaces](../../../../docs/menus.md#navigate-appkit-menu-surfaces).


AppKit DropdownMenu now attaches private view-key subscriptions to its actual
Button host. Plain Down/Up on a closed enabled trigger requests first/last-row
opening, preserving the hint until controlled acceptance. Pointer/ordinary button
opening resets first-row intent. Current disabled/open state, composition,
modified/prevented events and nested endContent controls reject the arrow path.
Matching renderer observeViewKeys support is required; the helper is not a public
useKeyboard or Button API and adds no layout wrapper.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}><DropdownMenuItem label="Archive" /></DropdownMenu>
}
```

The dispatcher shares its existing native monitor with prop handlers and owned
subscriptions, enters renderer discrete scope, preserves same-view/ancestor
propagation semantics and releases leases on ref/node teardown. Nine authored
cases remain unrun; physical/native monitor/ref/popup/IME/focus/AX/packaging evidence
is still missing. See [trigger arrows](../../../../docs/menus.md#open-an-appkit-dropdown-with-arrows).


Owned AppKit DropdownMenu/submenu Tab now resolves the outer trigger's current
same-window next/previous valid key view, records return intent and consumes the
key while requesting closure. Private return owners follow accepted ancestor
visibility: a child whose parent stays open returns to that parent's row; after
the chain closes its ref delegates to the root neighbor. No eager makeFirstResponder
is added to the menu handler. ContextMenu now supplies return intent for valid invokers; originless/unowned
surfaces keep native Tab fallback, as described below.

```tsx
import { useState } from 'octane'
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	const [open, setOpen] = useState(false)
	return <DropdownMenu isOpen={open} onOpenChange={setOpen} button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Archive" />
	</DropdownMenu>
}
```

The target layer focus adapter restores an explicit live native target in its own
window; fallback ownership cannot follow a moved view. Shared field editors map
back to controls. Native-backed handles receive attachment checks; explicit opaque focus delegates
keep caller-owned behavior whose attachment cannot be inspected. Ten new authored cases
remain unrun. Actual layer cleanup/window timing, native traversal/focus, modal/
FocusScope and AX behavior remain unqualified; see [owned Tab return](../../../../docs/menus.md#leave-an-owned-appkit-dropdown-with-tab).


AppKit ContextMenu now handles Shift+F10 or plain Context Menu key intent from a
still-owned focused descendant.
It stores the concrete invoker and reuses the menu return owner for ordinary and
Tab/Shift-Tab intent. Visible triggers supply a fallback invoker and now wrap
primitive content through TextSlot. Label fallback and expanded/disabled wrapper
metadata are forwarded. Origin checks reject detached, moved, hidden or blocked
hosts while preserving explicitly focusable disabled-card claims.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu label="Document actions" trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Use trigger content for ContextMenu; only DropdownMenu accepts button. Long-press-
only menus without a live invoker keep native Tab fallback. Six authored cases
remain unrun; native key/gesture/ref/IME/focus/AX/packaging behavior is unqualified.
Dedicated Context Menu key normalization now has a source path; actual hardware
delivery remains unqualified. See [context keyboard intent](../../../../docs/menus.md#open-appkit-context-actions-from-the-keyboard).


AppKit ContextMenu also owns secondary-click and plain Control-primary-click
through a private renderer lease. Require the matching renderer; older bridges
retain keyboard, visible-trigger and long-press paths. Nearest live context scope
wins; disabled/stale scopes decline and ordinary or additionally modified primary
clicks keep their existing path. Pointer modality is observed before consumption.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Decorative hits choose an eligible focusable ancestor for return, then the visible
trigger; originless surfaces keep native Tab fallback. Twelve authored cases are
unrun. Physical clicks, primary-action suppression, monitor/ref/focus timing, AX,
IME and packaging remain unqualified. See [pointer context intent](../../../../docs/menus.md#open-appkit-context-actions-with-the-pointer).


The AppKit renderer maps HIToolbox's Context Menu virtual key and AppKit's menu
function character to the existing NativeKeyboardEvent key="ContextMenu". No
physical code is invented when only the function character identifies the key.
ContextMenu uses the same owned invoker path as Shift+F10, without accepting Shift,
Control, Option or Command combinations on the dedicated key.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Two new renderer and two additional parameterized menu cases remain unrun. SDK
source evidence is not physical keyboard, native focus/IME/AX or packaging proof.
See [dedicated Context Menu key](../../../../docs/menus.md#use-a-dedicated-context-menu-key-on-appkit).


AppKit menu roles now map to AXMenu/AXMenuItem. Menu row labels also provide native
titles, including current link labels. Selected/expanded query state uses the
native isAccessibilitySelected/isAccessibilityExpanded getters and follows parent
feedback. Plain action dispatch does not change those values.

```tsx
import { DropdownMenu, DropdownMenuItem, DropdownMenuSubMenu } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Archive" />
		<DropdownMenuSubMenu label="More"><DropdownMenuItem label="Export" /></DropdownMenuSubMenu>
	</DropdownMenu>
}
```

Do not treat the role mapping as checked-menu or VoiceOver support. Menu mark
attributes, expanded-state notifications and complete shown-menu/selected-child
relationships remain gaps; checked state is separate from selected state. Two
renderer and one link-label cases remain unrun. Native bridge/query/tree,
VoiceOver, focus and packaging qualification remains open. See [menu metadata](../../../../docs/menus.md#appkit-menu-accessibility-metadata).


## AppKit calendar day keyboard intent

Calendar now adapts calendarKeyTarget through a private per-calendar native day
registry. One enabled day is a Tab candidate across panes. Arrows/row edges/grid
edges/month pages share existing bounds/disabled predicates; Enter/Space uses the
existing single/range selection owner. Explicit/provider RTL controls horizontal
intent. An unfinished range consumes Escape locally; the layer monitor asks the
shared renderer dispatcher first and deduplicates the native event across monitor
order. Ordinary Escape and Tab stay with the surrounding layer/native traversal.
Header controls retain their keys.

```tsx
import { useState } from 'octane'
import { Calendar } from '@octane-xplat/ui'
import type { DateRange } from '@octane-xplat/ui'

export function StayDates() {
	const [range, setRange] = useState<DateRange | null>(null)
	return <Calendar mode="range" value={range} onChange={setRange} numberOfMonths={2} maxRangeSpan={14} />
}
```

Controlled focusDate requests defer native focus until accepted cells attach.
Pending focus stays in its request window; header/imperative navigation and
teardown invalidate it. Current native ownership, disabled/hidden state and
first-responder identity guard key dispatch; pointer selection still works on
older bridges. Six adapter/two wiring cases and the maintained fixture remain
unrun. Source intent is not physical-key, Tab/focus, popup/modal, RTL, AX/live
announcement or package qualification. AppKit preset-list source ownership is
covered below; NativeScript time-list keys remain a gap. AppKit time stepping
is described below. See
[AppKit calendar keys](../../../../docs/platform/date-picker.md#navigate-appkit-calendar-days-with-keys).


## AppKit typed date/time Return boundary

DateInput, TimeInput and both DateTimeInput textfields now route onSubmit to their
existing blur commit function. Existing parsing/range/marked-text checks, null
clear values and controlled parent feedback remain the contract; this adds no new
public prop or independent key parser.

```tsx
import { TimeInput } from '@octane-xplat/ui'

export function StartTime(props: { value: string | null; change(value: string | null): void }) {
	return <TimeInput label="Start time" value={props.value} onChange={props.change} />
}
```

The source wiring and maintained date-submit fixture do not establish physical
Return delivery, blur ordering, IME/caret/draft/validation, focus/AX or packaging.
All runtime checks remain deferred. AppKit time stepping is covered below;
DateTimeInput preset-list source ownership is covered below. See [typed Return boundary](../../../../docs/platform/date-picker.md#commit-typed-appkit-date-and-time-drafts-with-return).


## AppKit DateTimeInput preset keys

With timeOptionInterval, Alt+Down from the actual time field opens the preset
popup. The native option owner seeds near current/typed time, retains one option
Tab candidate, and uses bounded Up/Down/Home/End without changing the parent value.
Enter/Space chooses through current time options and the existing commit path;
row focus/highlight is distinct from committed selection.

```tsx
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment(props: { value: string | null; change(value: string | null): void }) {
	return <DateTimeInput label="Appointment" value={props.value} onChange={props.change} timeOptionInterval={15} />
}
```

Tab/Shift-Tab records the field's current neighbor via the existing private return
owner; ordinary layer Escape/dismissal requests the time field. Current option,
blocked/busy/detached and reentrant-selection guards precede data callbacks.
Native refs and popup observers/claims release on teardown, and changing options
repairs focused rows. Older bridges keep pointer entry. Field text editing happens
after leaving the popup: no row-to-editor text/typeahead relay is added.

One renderer/four policy/five wiring cases and a maintained fixture are unrun. Native input,
proxy/ref/window order, actual focus/Tab/return/busy timing, scroll, IME, popup/modal,
AX/listbox relationships and packaging remain unqualified. Full option AX semantics,
row text relay remain gaps. Standalone TimeInput stepping is covered below. See [preset time keys](../../../../docs/platform/date-picker.md#choose-appkit-preset-times-with-keys).


## AppKit TimeInput minute stepping

TimeInput binds plain Up/Down to the existing adjustTime minute policy: committed
value (local current time when empty), midnight wrap, preserved optional seconds
and rejection outside min/max. Parent echo remains authoritative; a requested step
clears private draft text after dispatching a valid request, including when the
parent declines it. Modified/prevented keys,
marked editors, foreign/detached targets and current blocking state are guarded.
The write claim precedes onChange reentry; changeAction owns a pending guard through
settlement, and detached saves settle without UI state writes.

```tsx
import { TimeInput } from '@octane-xplat/ui'

export function Starts(props: { value: string | null; change(value: string | null): void }) {
	return <TimeInput label="Starts" value={props.value} onChange={props.change} increment={15} />
}
```

Five object-driver cases and the maintained time-step fixture remain unrun.
Physical key/repeat, field-editor/IME/caret/draft/focus/AX and packaging remain
unqualified. DateTimeInput stepping follows below; live announcements remain
a gap. See [AppKit time stepping](../../../../docs/platform/date-picker.md#step-appkit-time-values-with-arrow-keys).


## AppKit DateTimeInput closed-field minute stepping

Plain current-field Up/Down uses timeIncrement independently of preset cadence.
The adapter steps the committed time or date-less draft/current time through
shared arithmetic/bounds, keeps the date on midnight wrap, and preserves optional
seconds. Date-less changes remain private until a date is committed. Either open
popup retains plain arrows; Alt+Down still requests presets. Current modifiers,
composition and disabled/busy/detached guards preserve native editing commands.

```tsx
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment(props: { value: string | null; change(value: string | null): void }) {
	return <DateTimeInput label="Appointment" value={props.value} onChange={props.change}
		timeIncrement={5} timeOptionInterval={15} />
}
```

The shared target change boundary claims before callback reentry and retains a
pending save guard through settlement; accepted saves dispatch after callback
teardown without detached busy-state writes. Parent values remain authoritative.
Four added wiring cases and the extended preset-times fixture remain unrun;
physical key/repeat, IME/editor/caret/draft/focus/save/AX and packaging remain
unqualified. Row-to-editor relay, complete listbox relationships and live
announcements remain gaps. See [closed time-field stepping](../../../../docs/platform/date-picker.md#step-the-appkit-date-time-field-without-opening-presets).


## AppKit date-family imperative refs

DateInput/TimeInput/DateTimeInput now deliver their existing TextInputHandle refs;
DateRangeInput replaces inert focus/blur with trigger responder requests. Native
reads are live, not snapshots. The date-time primary host is its date segment;
blur checks both owned segments and their current field editors. Focus rejects
current blocked, hidden, disabled or detached hosts; blur preserves unrelated
responders and does not open/close layers or directly parse/commit text.

```tsx
import { useRef } from 'octane'
import { Button, DateInput } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export function Booking(props: { date: string | null; change(date: string | null): void }) {
	const input = useRef<TextInputHandle | null>(null)
	return <>
		<DateInput ref={input} label="Booking date" value={props.date} onChange={props.change} />
		<Button label="Edit date" clickAction={() => input.current?.focus()} />
	</>
}
```

Three policy/six object-driver cases and the date-focus fixture are unrun; source
wiring is not native ref/editor/focus/IME/layer/AX qualification. DateInput/TimeInput
hasAutoFocus now has separate source wiring; native attachment timing remains unqualified. See [date focus handles](../../../../docs/platform/date-picker.md#focus-an-appkit-date-field-from-a-form-action).


## AppKit date/range change ownership

DateInput and DateRangeInput now claim before validating/calling app callbacks,
check current constraints and exclude reentry/pending saves. Picker callbacks
require current open/attached ownership; blocked popups close, cached entry is
guarded and current preset labels resolve replacement ranges. Keep constraint/
preset getters pure: activation resolves one current range but rendering also
calls them. Parent values remain authoritative; failure releases busy state and
an accepted save dispatches after callback teardown without detached settlement
UI writes.

```tsx
<DateRangeInput label="Stay" value={range} onChange={setRange}
	changeAction={saveRange} maxRangeSpan={14} />
```

Seven object-driver cases and the date-save fixture remain unrun. Native
callback/ref/save/blur/focus/IME/popup/AX/package behavior is unqualified; no save
cancellation, automatic rollback or live-error delivery is added. See [date save ownership](../../../../docs/platform/date-picker.md#keep-appkit-date-saves-owned-by-one-edit).


## AppKit dynamic-menu focus repair

MenuSurface now owns previous eligible-row order and captured row/window intent.
Registered row detach notifies before removal; disabled-row and surface commits
coalesce refresh after native updates. Removed/disabled/hidden focused rows
request the row now at the prior index (clamped to the last), or the retained
container when empty. Focus changes alone never select. Captured same-window
container/window/null fallback is allowed; unrelated/nested-editor responders
cancel repair. Scope changes, hidden/detached roots and missing bridges release
stale intent/claims. Ref teardown and recursive native updates cannot resurrect
an old focus request.

```tsx
<DropdownMenu button={{ label: 'Actions' }}>
	{show && <DropdownMenuItem label="Remove action" hasCloseOnSelect={false} onSelect={() => setShow(false)} />}
	<DropdownMenuItem label="Continue" hasCloseOnSelect={false} />
</DropdownMenu>
```

Five policy/three surface/one TabMenu cases and the extended menu-keyboard
fixture remain unrun. Source ownership is not native ref/responder/fallback/
notification/IME/layer/scroll/AX/package qualification. See [dynamic menu focus](../../../../docs/menus.md#keep-focus-owned-when-appkit-menu-rows-change).


## AppKit Carousel native geometry controls

Carousel now delivers its existing handle and optional native overlay buttons.
Current NSScrollView clip/document metrics drive viewport paging, clamped indexed
slide conversion, edge/capability state and hasLoop wrapping. Proportional slides
use measured viewport widths and explicit track extent including gaps. Child
normalization and labels remain; dynamic slides keep intrinsic sizing. Logical
RTL conversion/leading-edge alignment and row/button direction share useDirection.
Invalid, hidden and detached views cannot scroll. Existing AppKit offset and
reduced-motion helpers own native requests; the motion reader accepts property
and receiver-bound callable getter forms. Refs, scroll/layout and window updates
keep measurements current without polling; teardown invalidates held handles.

```tsx
import { useRef } from 'octane'
import { Carousel, Button, Text } from '@octane-xplat/ui'
import type { CarouselHandle } from '@octane-xplat/ui'

export function Previews() {
	const carousel = useRef<CarouselHandle | null>(null)
	return <>
		<Carousel ref={carousel} label="Previews" hasButtons hasLoop variant="proportional" style={{ width: 320, height: 120 }}>
			<Text>First</Text><Text>Second</Text>
		</Carousel>
		<Button label="Next" clickAction={() => carousel.current?.scrollNext()} />
	</>
}
```

Five policy/three wiring/one motion-getter cases and the maintained fixture are
unrun. Native sizing, RTL/initial alignment, animation/input/overlay hit testing,
keyboard/AX/resize and packaging remain unqualified. Snap ownership follows below; edge fades remain
a source gap. See [AppKit carousel navigation](../../../../docs/app/components.md#navigate-appkit-carousel-slides).


## AppKit Carousel user-scroll snap ownership

hasSnap now uses NSScrollView WillStartLiveScroll/DidLiveScroll/DidEndLiveScroll
notifications, scoped to the current viewport/window. Tracking holds off snap;
end/unbracketed user events use a trailing 140 ms quiet period. The SDK explicitly
allows unbracketed legacy-mouse updates. Generic onScroll/native animation bounds
changes never arm snap. Current clamped nearest-edge geometry, RTL/reduced motion
and vertical preservation reuse the existing adapter. Programmatic moves,
meaningful layout/cell changes, flag disablement and hidden/moved/detached scopes
cancel stale work. Partial subscription failure releases prior tokens; teardown
releases tokens/timers. User/handle intent retires late initial alignment.

```tsx
<Carousel label="Previews" hasButtons hasSnap variant="proportional" style={{ width: 320, height: 120 }}>
	<Text>First</Text><Text>Second</Text>
</Carousel>
```

Six policy/two geometry/two wiring additions and the extended fixture remain
unrun, alongside earlier cases. Native live/momentum ordering, wheel/trackpad/
scroller/keyboard delivery, layout/RTL/animation/AX and packaging are unqualified.
Missing live-scroll observation does not promise snap; edge fades remain a gap.
See [AppKit snap](../../../../docs/app/components.md#snap-appkit-carousel-slides-after-user-scrolling).

## Experimental AppKit Pager

For small onboarding/gallery flows, Pager's macOS leaf now composes the public
AppKit ScrollableArea. Set an explicit size; all pages render eagerly. Requires
UI >=0.18.0 <1. defaultPage seeds once; page owns controlled state. User changes
report only after native position settles on a page boundary; programmatic
writes do not echo. Direction uses UI context and motion reads NSWorkspace's
native preference directly (AppKit useMediaQuery does not support a
prefers-reduced-motion query). Source/state/event/object-driver cases and the
manual fixture are authored, all unrun. Native sizing/RTL, scroll/momentum,
ref/context ordering, focus/AX and packaged resolution remain unqualified.

```tsx
import { Pager } from '@octane-xplat/pager'
import { Text } from '@octane-xplat/ui'
export function TravelPages() {
	return <Pager items={['Pack', 'Travel']} defaultPage={1}
		style={{ width: 320, height: 160 }} renderItem={(title) => <Text>{title}</Text>} />
}
```

Read the [package guide](../../../../packages/pager/README.md#platform-support)
and [AppKit recipe](../../../docs/recipes/appkit-paging.md) before promising native
paging support. The mobile plugin is not imported by the macOS leaf; its existing
package dependency remains. Do not add macOS to qualified parity targets from
source/mock evidence.


## AppKit date/time autofocus request ownership

DateInput/TimeInput now wire their existing hasAutoFocus flag to a private
post-commit request owner. It waits for first attachment/visibility only while
input and window observation are available, cancels on user activity, changed
responders, blocking/ref/window changes or teardown, and claims before native
focus callbacks. Native refusal is not retried. False-to-true explicitly rearms;
unblocking alone does not. No window activation or picker opening is requested.

```tsx
import { DateInput } from '@octane-xplat/ui'
export function NewBooking() {
	return <DateInput label="Booking date" hasAutoFocus />
}
```

Nine policy/six object-driver cases and the manual fixture are unrun. Popover is
mocked away in component cases; this is not modal containment/native caret/IME/
AX evidence. See [autofocus guidance](../../../../docs/platform/date-picker.md#request-initial-appkit-date-or-time-focus).
This does not change DateTimeInput/DateRangeInput (no autofocus flag), nor qualify
PowerSearch initial-focus ownership. BaseTypeahead now has the separate source path below.


## AppKit typeahead focus and request ownership

BaseTypeahead now connects input focus to bootstrap/reshow, whole-field blur to
close/cancel, and hasAutoFocus to the existing queued AppKit owner. Native refs
are stable; handle.native reads the current host, owned blur preserves other
editors, and held handles do nothing after teardown. Native enabled/editable
props and current local/inherited blocking guard editing/selection. Typeahead
click-to-edit reports the query once and readonly fields omit clear actions.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function Assignee() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Assignee" />
}
```

New queries invalidate old responses before debounce. Source replacement,
field-leave blur, ref replacement, blocking and teardown cancel requests; late
responses cannot reopen. Query/selection callbacks claim before reentry and
resolve current result identities. Fourteen object-driver cases and the manual
fixture are unrun. Results now have the separate source-owned floating host
below; keyboard intents have their own source path. Native role/link source wiring now follows separately; IME/editor/blur/
click ordering, full AX behavior, announcements and packaging remain unqualified. See [AppKit typeahead](../../../../docs/app/search-selection.md#bootstrap-appkit-typeahead-results-on-focus).


## AppKit typeahead input-owned keys

BaseTypeahead now forwards the native input key payload to its existing consumer
hook before built-in navigation. preventDefault suppresses the policy. Only the
current input/owned field editor in its current window may act; callback-driven
focus/ref/prop changes are rechecked. Closed ArrowDown offers eligible results;
open arrows/Home/End highlight, Enter commits, and Escape closes only that list.
Tab/Shift+Tab close without cancelling native traversal. Modified editing, IME,
ordinary input and closed Escape stay with the native/default layer owner.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function Person() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Person" />
}
```

Highlight reveal uses current keyed native row leases, stays in the input's
window and never transfers focus. Seven policy/five object-driver cases and the
manual fixture are unrun. Native keys/IME/repeat/Tab/layer/reveal and package
qualification remain deferred. The separate role/link source subset below does
not qualify native AX behavior or announcements. Tokenizer now separately wires empty-input Backspace; see its subset
below. Read the
[key guide](../../../../docs/app/search-selection.md#choose-appkit-typeahead-results-with-keys).

## AppKit TimeInput draft ownership

TimeInput now guards text/submit/clear before pending-state writes using current
blocking, callback reentry and save ownership. A live draft record lets retained
submit/edit callbacks read current text, seconds and bounds. Post-callback clear
checks draft identity and native attachment; external parent correction wins.
The existing date-composition.macos.ts already supplies native marked-text checks;
do not infer missing AppKit support from the unsuffixed mobile helper.

```tsx
import { useState } from 'octane'
import { TimeInput } from '@octane-xplat/ui'
export function StartTime() {
	const [time, setTime] = useState<string | null>('14:30')
	return <TimeInput label="Start time" value={time} onChange={setTime}
		min="09:00" max="18:00" hasClear />
}
```

Six object-driver cases and a manual fixture are unrun. Native editor/IME/Return/
blur, pending-save/caret/focus/AX and package behavior remain unqualified. The
analogous DateTimeInput draft path now has the separate source below. See [time drafts](../../../../docs/platform/date-picker.md#keep-appkit-time-drafts-owned-by-the-current-edit).


## AppKit DateTimeInput draft ownership

DateTimeInput now guards both text drafts and date-less time state using current
attachment/blocking/save ownership. Retained handlers read latest locale, date/
time parts, seconds and endpoints. A local edit claim blocks callback reentry;
constraint callbacks cannot commit metadata replaced during validation. Draft/
local-time records prevent old post-callback clears from overwriting parent
correction or teardown. Identical committed values do not repeat change/save.

```tsx
import { useState } from 'octane'
import { DateTimeInput } from '@octane-xplat/ui'
export function Appointment() {
	const [value, setValue] = useState<string | null>(null)
	return <DateTimeInput label="Appointment" value={value} onChange={setValue} hasClear />
}
```

Eight object-driver cases and the manual fixture are unrun. Native editor/IME/
Return/blur, save/ref/picker/keyboard/focus/AX and packaging remain unqualified;
Popover is mocked away in the new cases. Existing composition/preset-key policy
is retained. Read [current date-time drafts](../../../../docs/platform/date-picker.md#keep-both-appkit-date-time-drafts-current).

## AppKit Tokenizer empty-input removal

Tokenizer routes Backspace through BaseTypeahead's current-input key path.
Both cached query and native editor text must be empty; composing/modified keys
retain editing. Transactions read current controlled selection, inherited Field
blocking and metadata, reject reentry and preserve callback-driven focus choices.
One stable public handle exposes the live wrapper; held removal callbacks are
inert after teardown. Delayed blur retains wrapper/panel descendant focus.

```tsx
<Tokenizer label="Tags" searchSource={source} value={tags} onChange={setTags} />
```

Seven object-driver cases and the manual fixture are authored, unrun. Native
keys/repeat/IME/editor/blur/popup/AX and package qualification remain deferred.
The separate overflow source path below replaces legacy measurement; native
truncation remains unqualified. Use the
[token guide](../../../../docs/app/search-selection.md#remove-appkit-tokens-with-empty-input-backspace)
for the supported source subset and evidence boundary.

## AppKit PowerSearch initial focus

PowerSearch's existing hasAutoFocus flag now uses the private AppKit request
owner through its typed shared-input handle, replacing the one-shot effect.
Current inherited disabled/read-only/loading or active filter editing cancels
pending work. User activity, changed responders, native replacement and teardown
retain ownership; unblocking alone does not rearm. One stable callback handle
uses current input/blocking and is inert after teardown. The callback contract
still accepts handles only; this change adds no null notification.

```tsx
<PowerSearch config={config} filters={filters} onChange={setFilters} hasAutoFocus />
```

TextInput/TextArea have no public hasAutoFocus prop; do not forward that flag to
them. Five object-driver cases and the manual fixture are authored, unrun. Actual
attachment/notification/focus/caret/IME/modal/AX and packaging remain unqualified.
See [initial search focus](../../../../docs/app/power-search.md#request-initial-appkit-search-focus).

## AppKit Tokenizer overflow source subset

Collapsed token rows now use a native-clipped flex viewport and an outside
counter. Current keyed refs belong only to the measured collapsed row; expanded
layer token copies are separate. AppKit bounds/convertRectToView replace the
NativeScript measurement APIs. Both edges handle RTL/nonzero bounds, and
partial clipping counts as hidden. Missing/foreign/zero-size geometry keeps the
last count. Counter-space reclamation and stale-layout ownership prevent a
count from reserving its own space after resizing.

```tsx
<Tokenizer label="Tags" width={240} searchSource={source} value={tags}
	onChange={setTags} tokenOverflowBehavior="unfocusedInline" />
```

Requires the renderer's native overflow clipping path. Eight geometry/five
object-driver cases and the manual fixture are authored, unrun. Drawing,
Mason sizing, resize/font/RTL behavior, focus/IME, hit-testing/AX and packaging
remain unqualified. Tokenizer's outer unfocusedLayer editor remains inline; its result list uses
the source-owned host below. See the
[overflow guide](../../../../docs/app/search-selection.md#collapse-appkit-token-rows-with-native-geometry).

## AppKit plain text edit ownership

TextInput/TextArea now share a private target-local edit owner, also used by
SearchInput through TextInput. Held handlers read current props/inherited blocking,
callback and return-key policy. Mounted-host/reentry guards prevent retired or
nested edits. Rapid uncontrolled edits update a local text record before render.
Composition still reports draft changes; submit/clear wait for unmarked text,
including the NSTextView itself and the NSTextField's current editor.

```tsx
<TextInput label="Name" defaultValue="Ada" hasClear onChange={saveDraft}
	onClear={recordClear} onSubmit={submitName} />
<TextArea label="Message" defaultValue="Hello" returnKeyType="send" onSubmit={send} />
```

An accepted clear captures its onChange/onClear pair; parent callback replacement
or teardown does not redirect the second callback. UI/focus work afterward needs
current attachment/blocking/responder ownership. One stable live handle supports
ref replacement, guarded native focus and foreign-responder-safe blur. Read-only
fields may request focus; disabled fields do not. isLoading remains descriptive.
Ten object-driver cases and a manual fixture are authored, unrun. Native editing,
IME/caret/Return/clear/focus ordering, accessibility and packaging are unqualified.
See [AppKit edit ownership](../../../../docs/app/text-entry.md#keep-appkit-text-actions-owned-by-the-current-field).

## AppKit typeahead native accessibility relationships

The shared AppKit result view declares combobox/listbox/option roles. The
renderer maps editable combo boxes to AXComboBox and host list/option roles to
AXList/AXRow, restoring specialized input role/expanded baselines when dropped.
The private relationship owner links the current same-window input/list and publishes
the highlighted row as pending selected children on both, independently of the
committed controlled value. It requests AXSelectedChildrenChanged for native row
identity changes and never calls makeFirstResponder.

```tsx
<BaseTypeahead searchSource={people} value={person} onChange={setPerson}
	hasEntriesOnFocus accessibilityLabel="Choose a person" />
```

Unrelated baseline links are preserved; close/block/ref/window changes restore
metadata, and teardown retires queued work/observation. Hidden/foreign rows are
excluded. Same-window hosting is the current subset. Four renderer, ten
relationship and five view cases plus a manual fixture are authored, unrun.
Do not equate roles/links/notifications with qualified VoiceOver hierarchy,
navigation, announcements, focus/IME or packaging. This does not qualify other
Selector/preset lists. See [the source subset](../../../../docs/app/search-selection.md#expose-appkit-suggestion-roles-and-relationships).


## AppKit floating typeahead source subset

BaseTypeahead/Typeahead/Tokenizer results now use a private same-window source
portal with bounded scrolling, current anchor/menuWidth/placement/direction and
commit-gated reveal. Source providers remain around result content; input and
result descendants share the field-leave blur boundary. The host does not focus
or restore focus, and top-layer ownership gates controlled outside dismissal.
Window retirement cancels the current presentation until close/open rearms it.
Current source readiness refreshes native AX links and requests highlighted-row
reveal after rows mount, using current input/editor/window ownership.

```tsx
<BaseTypeahead searchSource={people} value={person} onChange={setPerson}
	hasEntriesOnFocus menuWidth={280} placement="bottom" accessibilityLabel="Person" />
```

Require the matching renderer source-outlet/staged-window-layer contract; do not
add an inline fallback or replace it with a standalone NSPopover root. Sixteen
controller/focus, four actual source-portal and three readiness cases plus a manual
fixture are authored, unrun. State/key fixtures explicitly mock only this host.
Generic Popover/useLayer standalone roots and Tokenizer's outer unfocusedLayer
editor remain separate limitations. Native portal/context/commit/geometry,
scroll/RTL, input/IME/blur/click, nested dismissal/AX and packaging are unqualified.
See [floating suggestions](../../../../docs/app/search-selection.md#float-appkit-search-suggestions).


## AppKit heading snapshots

useOutlineFromView on ui/macos now uses the installed renderer heading reader.
Check getOutlineFromViewCapabilities: missing/older hosts report unsupported;
method presence reports snapshot capability without a native runtime pass.
Pass a native root/ref or ScrollableArea handle. Discovery reads owned Heading
IDs, current plain/rich labels and levels once per root/reader, recollecting
only when a render exposes a different root/reader. It does not observe mutable
contents. Generated unique slugs avoid authored IDs but are not written onto
views; duplicate authored IDs keep the first. Prefer document-derived items for
dynamic content. AppKit navigation is a separate source path below; native/packed discovery
remains unqualified; see the content-display guide.

```tsx
import { useRef } from 'octane'
import { Heading, Outline, ScrollableArea, type ScrollableAreaHandle } from '@octane-xplat/ui'
import { useOutlineFromView } from '@octane-xplat/ui/macos'
export function Guide() {
	const content = useRef<ScrollableAreaHandle | null>(null)
	const items = useOutlineFromView(content)
	return <>
		<ScrollableArea ref={content} height={200}><Heading id="intro" level={1}>Introduction</Heading></ScrollableArea>
		<Outline items={items} hasScrollOnClick={false} />
	</>
}
```


## AppKit Outline navigation

Outline now uses current native heading target records and NSScrollView geometry
for activation and uncontrolled scroll spy. Pass a raw native viewport through
scrollContainerRef when navigation is outside its scroll ancestor; convert a
ScrollableArea handle with handle.native. Header offset shifts landing and the
spy edge. activeId disables spy, hasScrollOnClick=false keeps callbacks without
seeking, and reduced motion requests an instant seek. Invalid/hidden/detached,
foreign-window and nested-scroll targets are rejected. Generated IDs follow
the discovery allocator but can change with text; prefer authored IDs.

```tsx
import { useCallback, useRef } from 'octane'
import { Heading, Outline, ScrollableArea, type HostElement, type ScrollableAreaHandle } from '@octane-xplat/ui'
export function Contents() {
	const scroll = useRef<HostElement | null>(null)
	const bind = useCallback((handle: ScrollableAreaHandle | null) => { scroll.current = handle?.native ?? null }, [])
	return <>
		<ScrollableArea ref={bind} height={200}><Heading id="intro" level={1}>Introduction</Heading></ScrollableArea>
		<Outline items={[{ id: 'intro', label: 'Introduction', level: 1 }]} scrollContainerRef={scroll} />
	</>
}
```

Native bounds/frame/window notifications own spy/binding updates; user live-scroll
start interrupts navigation. Attempts/timers/observers retire on replacement or
disposal and use current handlers. Completion uses 150 ms bounds quiet, including
a timer fallback when native notifications are absent; it is not an actual
animation-completion guarantee. Seven controller/mounted cases and the expanded
manual fixture are authored but unrun. Native seeks/coordinate conversion,
scroll spy/animation, interruption/threading, real keyboard/AX and clean packaged
consumers remain unqualified; see the content-display guide.


## AppKit Lightbox image gestures

Lightbox now has source paths for immediate double-click 1×/2× image zoom and
unzoomed pointer/recognized-AppKit-swipe navigation. hasZoom=false disables image
magnification; current source/index/viewport/policy changes reset to 1×. Pinch
bounds remain 1×–4×. Swipes clamp at gallery edges and skip vertical/cancelled/incomplete
recognized gestures and navigation while zoomed. Native panning still needs
qualification. Native Swipe
events use +deltaX for left; renderer pointer swipes already use direction 2 for
left. The local monitor owns only the open media stage, checks native window/hit
ownership, leaves ordinary scroll-wheel events alone and retires on replacement
or disposal. It requires native monitor support. Seven policy/mounted cases and
a manual fixture are authored but unrun; actual input/gesture arbitration,
hit/zoom coordinates, cleanup, VoiceOver and packaging remain unqualified.
Lightbox video is still unsupported, including when the separate Video package
is used; no optional player handoff is implemented.

```tsx
import { Lightbox } from '@octane-xplat/ui'
export function Gallery({ open, setOpen, first, second }: {
	open: boolean; setOpen: (open: boolean) => void; first: string; second: string
}) {
	return <Lightbox isOpen={open} onOpenChange={setOpen} hasZoom
		media={[{ src: first, alt: 'First photo' }, { src: second, alt: 'Second photo' }]} />
}
```


## Animated images on AppKit

Use the optional GIF package and rebuild the app's native host to include its
NSImageView bridge. The AppKit leaf now has source loading/animation and four
centered fit paths instead of a placeholder; actual native compilation,
GIF timing/looping and WebP decoding remain unqualified. Give it an explicit
size. Source replacement drops stale work, hidden/detached views and reduced
motion stop progression, and unmount releases the request/image/observer.
There is no shared GIF prefetch cache (`prefetch` remains false), custom header
or mobile escape-bag support. Do not infer animated-image support from the core
static Image cache. See the [package subset](../../../../packages/gif/README.md#experimental-appkit-subset).

```tsx
import { AnimatedImage } from '@octane-xplat/gif'
<AnimatedImage src="~/loading.gif" alt="Loading illustration" width={160} height={120} />
```


## AppKit PowerSearch range form

Native PowerSearchFilterEditor now routes date_range to a built-in Start/End form
using existing native text/segmented controls. Support NOW, absolute UTC date/time,
and finite signed/fractional/scientific relative amounts with fixed-duration units.
Preserve unchanged absolute precision and relative anchorKey metadata. Validate
both endpoints against one Apply instant, reject invalid/reversed/nonfinite ranges,
and keep relative/Now semantics. Interval presets edit drafts without committing;
expression-string relativeDatePresets and timezoneID-specific display need custom
editors. Named anchors are preserved but not resolved by the built-in matcher.

```ts
import type { DateTimeRange } from '@octane-xplat/ui'
const range: DateTimeRange = {
	start: { type: 'RELATIVE', backValue: 7, unit: 'day' }, end: { type: 'NOW' },
}
```

Current filter/field/operator identity retires drafts; use immediate local records
for rapid edits and guard stale, readonly, loading/disabled and composing inputs.
Cancel remains available; one draft submits once, with consumer-error retry. Apply
stays available to revalidate moving Now; no clock timer is introduced. Web/mobile
range built-ins and complete native entity/nested/custom parity remain gaps. Seven model
and three mocked-control compiler cases plus fixture are authored, unrun; native
input/IME/focus/AX/layout/popover and installed-consumer behavior are unqualified.
See [native range form](../../../../docs/app/power-search.md#edit-native-appkit-date-ranges).

## AppKit PowerSearch entity form

Native entity_list now routes to Tokenizer for source search, selected tokens,
removal/clear, renderItem and optional arbitrary string creation. Preserve source
row data in drafts; save only id/label/top-level string photo, deduplicated by ID.
Client-side applyFilters still passes entity values through; apps own matching.

```ts
import type { EntityListOperatorValue } from '@octane-xplat/ui'
const tags: EntityListOperatorValue = {
	type: 'entity_list', isArbitraryStringAllowed: true, tokenization: {},
}
```

Configured tokenization uses a separate paste field and explicit Add entries,
not Tokenizer's automatic paste. Resolve serially with fresh cancellable request
signals; exact ID wins, then unique case-sensitive label. Sort trimmed/deduplicated
tokens by JS string order if requested; default separators are comma/newline.
Regex captures and zero-width matches are not entries. Reject ambiguous/unmatched
values unless a missing match permits arbitrary creation; failures publish no
partial draft and show generic errors. Apply requires adding or clearing pending
text. Revision/readonly/Cancel/unmount aborts retire old work even if sources ignore
signals. One draft submits once, consumer throw allows retry. Search state/source
selection ownership remains with the existing Tokenizer, not a duplicated engine.
Seven model/five mocked-control editor cases and an idle fixture are unrun. No
native input/IME/AX/popover/cancellation/installed-consumer qualification, no new
public API/dependency and no React Aria presence change. Web/mobile entity editors
and full nested/custom parity remain gaps.
See [entity workflow and source example](../../../../docs/app/power-search.md#edit-native-appkit-entity-filters).

## AppKit PowerSearch scalar ownership and numbers

Native scalar drafts now reset on filter/field/operator replacement and retain
rapid edits before render. Guard current revision, readonly filter/editor, marked
text and unmount; claim one submission before consumer reentry, release on throw.
Cancel retires the session. Explicit missing field/operator keys disable Apply;
an absent operator uses the configured default, then first. Numeric Apply accepts
finite decimal/scientific text, requires safe whole integers, enforces inclusive
minValue/maxValue and rejects nonfinite/reversed configured bounds. Never coerce
blank text to zero, accept hex/trailing text or silently clamp. Units/bounds are
displayed, with dot decimal notation (locale numeric parsing remains unsupported).

```ts
import type { IntegerOperatorValue } from '@octane-xplat/ui'
const year: IntegerOperatorValue = {
	type: 'integer', minValue: 1800, maxValue: 2100, units: 'publication year',
}
```

Five model/five mocked-control editor cases and an idle scalar fixture are unrun.
This does not complete string-source/list/time/relative/custom/enum/date behavior
or native text/IME/focus/AX/popover/consumer qualification. Absolute UTC date/time
validation and precision retention are described below; calendar widgets and
timezone display remain separate gaps. No public type/dependency or React Aria presence
change. See [numeric draft workflow](../../../../docs/app/power-search.md#validate-native-appkit-numeric-filters).

## AppKit PowerSearch absolute UTC dates

Native date_absolute now reuses the range form's strict UTC parser instead of
unchecked date coercion. Preserve unchanged stored precision/expanded years; new
four-digit-year date/time text keeps seconds/milliseconds and rejects calendar
rollover, partial/ambiguous/offset text. Date-only deliberately saves midnight UTC,
rejects typed time and handles the pre-epoch sub-millisecond UTC day. Invalid
stored instants are editable errors, not render exceptions or saved NaN. Source
revision includes date-only mode; reuse scalar readonly/composition/stale/Cancel/
submit guards. UTC labels are explicit; timezoneID-specific display, calendar
widgets and broader parsing need custom editors.

```ts
import type { DateAbsoluteOperatorValue } from '@octane-xplat/ui'
const dateTime: DateAbsoluteOperatorValue = { type: 'date_absolute' }
const calendarDay: DateAbsoluteOperatorValue = { type: 'date_absolute', isDateOnly: true }
```

Six date-model and two additional mocked-control scalar cases plus the expanded
idle scalar fixture are unrun. The scalar case file now contains seven cases;
these do not qualify native text/IME/focus/AX/calendar/installed-consumer behavior.
No public type/dependency/React Aria presence change. See
[absolute UTC workflow](../../../../docs/app/power-search.md#edit-native-appkit-absolute-dates).

## AppKit file type filters and MIME hints

Use the existing files leaf for attachment flows. AppKit resolves image/audio/
video/text wildcard families through native type groups and concrete MIME through
registered UTType results, retaining known-extension fallbacks. Resolve every
member before presentation: unknown/malformed restrictions reject with
UnsupportedFileTypeError rather than dropping members or opening unrestricted.
Empty or */* means any type, including */* in a mixed list; clear reused panel filters.
Prefer explicit extensions for unregistered formats. Modern content-type arrays
require a complete resolution; partial resolution retains the full legacy
extension/UTI union. Load only UniformTypeIdentifiers before a lazy UTType global;
never import the entire generated native SDK merely to load this framework.

```ts
// FileActions.macos.ts
import { files } from '@octane-xplat/files'
export async function chooseDocuments() {
	return files.pickMultiple('.pdf,.docx')
}
export async function chooseImagesOrPDF() {
	return files.pickMultiple('image/*,.pdf')
}
```

Default FileInput metadata uses requested known concrete aliases first, otherwise
same-native-type aliases/preferred filename MIME, then finite hints; preserve
supplied metadata. Never relabel a concrete image as a broad supertype solely
because it conforms. Missing MIME can fail current accept validation. Panel
conformance/aliases and field validation are separate; neither inspects bytes.
Eighteen new parser/loader/panel/metadata/controller cases and the extended idle
fileinput-drop fixture remain UNRUN. No dependency/public type/React Aria presence
change. Native loading/type arrays/conformance, sandbox/ref lifecycle, OS picking/
dragging, focus/VoiceOver and installed/visual qualification remain pending. See
[file filter workflow](../../../../docs/platform/date-picker.md#choose-file-types-on-appkit)
and [metadata](../../../../packages/files/README.md#appkit-file-metadata).

## Native AppKit date-picker ownership

Use AppKitDatePicker from @octane-xplat/date-picker/macos only in native macOS
files; its renderer-installed attachDatePicker bridge already creates NSDatePicker.
Do not replace that workspace bridge with an app-only installer or infer support
absence from the old demo placeholder. The default seed is retained across mode/
style/view changes; controlled values restore when rejected. Clamp uncontrolled
values to new inclusive bounds without callbacks; invalid dates/reversed bounds/
out-of-range controlled values show a generic error until props are repaired.
Current callbacks/labels update, removed bounds/labels clear, and disabled/stale/
programmatic/duplicate actions do not emit. Retire sessions before native detach,
suppress construction/update echoes and clean up partial constraints/actions.
The renderer skips unchanged date/range writes to avoid disturbing native edits.

```tsx
// ClosingTime.macos.tsx
import { useState } from 'octane'
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'
export function ClosingTime() {
	const [selection, setSelection] = useState(new Date(2026, 9, 29, 12, 30))
	return <AppKitDatePicker components="dateAndTime" selection={selection}
		onSelectionChange={setSelection} accessibilityLabel="Poll closing time" />
}
```

The maintained native-date demo replaces its placeholder; an idle probe mounts
that same demo. Seven owner-model and six new renderer-branch cases are unrun.
Native NSDatePicker editing/IME/Tab/VoiceOver, focus/layout, calendar/clock settings,
actual callback timing and clean installed consumers remain unqualified. Renderer
bridge returns update/detach (its ambient signature was previously void). No new
dependency/public prop or React Aria presence-level change. See
[native date workflow](../../../../docs/platform/date-picker.md#native-macos-selection-lifecycle).

## Native AppKit context-menu ownership

Use AppKitContextMenu from @octane-xplat/context-menu/macos in macOS files for
the platform's serialized flat menu. It reuses the renderer-installed NSMenu
attachment; exact native action metadata was repaired in the renderer first.
Primitive item snapshots detect changes even if an item object is mutated.
Equal-content arrays and current callback changes preserve tracking; item/scope/
view changes and unmount retire old callbacks before cleanup. Give reused rows a
record-specific id or remount for a different record. IDs must be unique strings;
titles must be strings. Empty lists remove this custom menu, invalid/unavailable attachment
shows a generic message. Ignore disabled/removed/unknown/stale/reentrant actions.

```tsx
// NoteActions.macos.tsx
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text } from '@octane-xplat/ui'
export function NoteActions({ noteID }: { noteID: string }) {
	return <AppKitContextMenu id={`actions-${noteID}`} items={[{ id: 'rename', title: 'Rename' }]}
		trigger={() => <Text>Right-click this note</Text>} onItemSelected={(id) => console.log(noteID, id)} />
}
```

Attach only at the wrapper. AppKit documents unhandled right-click propagation;
inference: native descendants that forward unhandled events can use ancestor menus
without a one-time subtree overwrite. Preserve child editing/nested menus and
foreign slots; cancel owned tracking and restore prior active menus, skipping
retired attachments. Partial failures deregister actions; native enablement and
window/menu ownership guard dispatch. No public gesture/preview/submenu API or
destructive-row styling is added. Eight owner/seven renderer branch cases and the
maintained demo/probe are unrun. Native pointer/Control-click, keyboard/AX menu
actions, custom responder routing, timer progress while tracking, cancellation,
native BOOL, actual hook/ref/effect timing and installed consumers remain
unqualified. No dependency/public prop/React Aria presence change. See
[native menu workflow](../../../../docs/platform/context-menu.md#native-macos-menus).

## Native AppKit ID picker

For a native noneditable pop-up button, use `AppKitPicker` from
`@octane-xplat/picker/macos` in a macOS leaf. The renderer-installed bridge
reuses the raw list-picker's NSPopUpButton allocation; it does not import mobile
adapters. Supply unique string option IDs and string titles; repeated/empty
titles and an empty ID are valid. Controlled `selection` must match a nonempty
list; callbacks report enabled user choices and a rejected value is restored.
Missing controlled IDs/invalid choices show a generic message, repaired through
props. Empty/all-disabled lists are nonselectable. Disabled saved values can
still display. Classes/styles apply to the outer labeled field.

```tsx
// BagPicker.macos.tsx
import { useState } from 'octane'
import { AppKitPicker } from '@octane-xplat/picker/macos'
export function BagPicker() {
	const [selection, setSelection] = useState('carry')
	return <AppKitPicker label="Bag" selection={selection} onSelectionChange={setSelection}
		options={[{ id: 'carry', title: 'Carry-on' }, { id: 'checked', title: 'Checked bag' }]} />
}
```

Uncontrolled `defaultSelection` seeds once per record id, including across an
initially empty list. Later defaults do not reset selection; reorder/rename/view
replacement preserves IDs. A missing/removed uncontrolled ID silently falls back
to the first enabled choice. Change `id` when a retained field changes records
to retire callbacks and reseed. Primitive snapshots catch in-place mutations;
equal options preserve the native menu, while changes/teardown cancel owned
tracking and retire old epochs/actions. Programmatic, stale, disabled, duplicate
and reentrant events do not emit. Source implementation only: eight owner/seven
actual renderer-branch cases, idle probe, packed-consumer lane and native demo
are unrun. Keyboard/pointer, menu-loop timers, BOOL, focus/Tab, AX, layout,
native lifecycle and installed consumers remain unqualified. See
[native selection](../../../../docs/platform/native-picker.md#native-macos-selection).

```tsx
// RecordPicker.macos.tsx
import { AppKitPicker } from '@octane-xplat/picker/macos'
export function RecordPicker({ recordID }: { recordID: string }) {
	return <AppKitPicker id={`bag-${recordID}`} label="Bag" defaultSelection="carry"
		options={[{ id: 'carry', title: 'Carry-on' }, { id: 'checked', title: 'Checked bag' }]} />
}
```

## AppKit custom grid-cell focus

The AppKit root `useGridFocus` resolves to a native marked-cell hook. In a macOS
leaf, attach its ref/key handler to a raw native container and mark focusable
native cells with `data-grid-cell`; give cells real actions. Shared component
bags do not promise marker forwarding. This is a presence attribute: false/empty
values still mark; undefined/omission removes it. Positive integer rows/columns
are required. Current native child order supplies indices; columns supplies
vertical stride, arrows clamp rather than wrap, and Home/End find edges.
Selection/activation stays with cells. Do not confuse it with the selector-based
`useGridList`, which still reports false on AppKit.

```tsx
// Palette.macos.tsx
import { useGridFocus } from '@octane-xplat/ui'
export function Palette() {
	const grid = useGridFocus<NSView>({ rows: 1, columns: 2 })
	return <masonview ref={grid.ref} onKeyDown={grid.onKeyDown} className="flex flex-row gap-2">
		<button data-grid-cell text="Red" onTap={() => console.log('Red')} />
		<button data-grid-cell text="Blue" onTap={() => console.log('Blue')} />
	</masonview>
}
```

Reuse the renderer metadata reader and existing row focus/Tab/scroll engine.
Nested hook roots and GridList roots own their descendants; preserve nested
text controls, IME, modified/prevented keys and native activation. `focusIndex`
is the last accepted hook target, not a selected ID; successful keyboard moves
notify the current onFocusChange. Optional onFocusCell clamps integer requests
without selection/callback emission and is absent when unavailable/invalid.
Retired callbacks cannot reopen a disposed owner. Native removal remains best
effort; stale observers are inert, and every owned Tab lease is attempted even
after a removal failure. Model cases and the idle manual probe are unrun;
compiled hooks/marker forwarding, real input/Tab, BOOL, nested focus, scrolling,
RTL/layout, AX, native cleanup and installed consumers remain unqualified. See
[custom native cells](../../../../docs/app/components.md#custom-grid-cell-focus-on-appkit).

## AppKit Toolbar action focus

Use Toolbar's label and stable start/center/end slots for contextual actions.
Its AppKit role maps to AXToolbar without making the container an action or Tab
target. A private owner discovers discrete native button/link/checkbox/radio
hosts in current child order and reuses choice focus for roving Tab exclusions.
Horizontal Left/Right, vertical Up/Down and Home/End move focus manually; keys
never toggle or press a control. Current window updates refresh hidden/disabled/
removed/reordered actions, and orientation changes retain slot/component state.
Modifiers, composition, prevented events and nested key reentry are ignored.
Editors, adjustable controls and nested composites retain their own keys/Tab
stops; mixed toolbars can have additional Tab stops. Physical order follows the
web helper's key direction; native RTL visual behavior remains unqualified.

```tsx
import { Button, Toolbar } from '@octane-xplat/ui'

export function Actions() {
	return <Toolbar label="Page actions" orientation="horizontal"
		startContent={<Button label="Save" />} endContent={<Button label="Share" />} />
}
```

The focus path requires keyboard/Tab-suppression capability and a captured window
observer; absent capability preserves natural focus. Scope/observer/Tab claims
retire before teardown effects, late handles release their own owner, removal
failures log fixed diagnostics and cleanup attempts remaining leases. Native
release is best effort. This covers self-drawn action hosts; complete mixed-
control roving, stock native-control Tab suppression and AX orientation remain
implementation gaps. Native ref/BOOL/window/key/Tab/selection/AX, RTL/pixels and
installed behavior remain unqualified. See [toolbar actions](../../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow).
