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

**For UI contributors**, shared component prop contracts live in
`packages/ui/src/props.ts` and feed published declarations. Consumer app
components own their own props; do not edit framework internals to define them.

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
other units or unresolved expressions center with a warning. Source-set and
decode-hint gaps remain; native cropping/orientation/density are unqualified. The
renderer shares bounded decoded images and cancels pending work after its last
subscriber leaves; HTTP error payloads are rejected and remote delivery enters
the main operation queue. Native timing, rendering and packaging are unqualified.
Engine/cache APIs and callbacks in the optional package remain unsupported;
see [AppKit image loading](../../../../docs/app/components.md#image-loading-on-appkit).

```tsx
import { Image } from '@octane-xplat/ui'

export function Photo({ src }: { src: string }) {
	return <Image src={src} alt="Photo" flexGrow={1} contentFit="contain"
		className={['photo', { framed: true }]} style={{ width: 120, height: 80 }} />
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
Web uses scoped CSS hover/focus-within; touch/native defaults keep actions
visible. Native desktop hover, force/delay and inverted reveal remain gaps.
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

`useTableStickyColumns` is web-only behavior: native leaves currently return a
pass-through plugin because Table has no native horizontal scroll wrapper. Do
not claim native pinning or native keyboard/accessibility qualification from
the shared export. Multiple pinned proportional columns use minimum-width
offsets; use pixel widths when their offsets must remain exact.

```tsx
function ExampleTable() {
  const sticky = useTableStickyColumns({ startKeys: ['name'], endKeys: ['status'] })
  return <Table data={data} columns={columns} idKey="id" plugins={{ sticky }} />
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
