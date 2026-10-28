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
other units or unresolved expressions center with a warning. Resolution candidates use the shared closest-pixel-count rule on box/window-density
changes (use a stable styled box); decode hints remain unimplemented; native cropping/orientation/density are unqualified. The
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
is forwarded by TextInput. Native glyph layout/accessibility remain unqualified;
see [search fields](../../../../docs/app/primitives.md#when-a-screen-needs-more).

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Search() {
	return <SearchInput label="Find" icon={false} placeholder="Search by name" />
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

## AppKit number fields

NumberInput now wires `units`, `formatValue`, `hasNumberSteppers` and `hasClear`
on AppKit. Clear reports null then onClear. Stable Field ownership supplies
metadata and inherited disabled/read-only state, including stepper blocking.
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
delta-based; it does not jump on track taps. Native keyboard, accessibility,
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
after unmount is ignored. Controlled parents must apply both forward and rollback
callbacks. Native activation/loading presentation remain unqualified; see
[switch saves](../../../../docs/app/components.md#save-a-switch-setting-on-appkit).

```tsx
import { Switch } from '@octane-xplat/ui'

export function Preference({ save }: { save(next: boolean): Promise<void> }) {
	return <Switch accessibilityLabel="Preference" defaultValue changeAction={save} />
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
ownership, and hides text without dropping the accessible name. Metadata changes
retain the host/state. Native input/layout/accessibility remain unqualified;
changeAction is still ignored on AppKit, with mixed rollback contract work open.
Use controlled state and onChange for saves; see
[checkbox metadata](../../../../docs/app/components.md#checkbox-metadata-on-appkit).

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function IncludeArchived() {
	return <Checkbox label="Include archived" description="Search older records" defaultValue />
}
```


## AppKit busy feedback

Spinner now forwards named sizes, text/node labels, contrast, accessible names,
class/style forms and busy=false removal. Switch shows a compact ring while
saving or externally loading. The ring remains static: AppKit CSS animation
playback is still a gap. Do not describe it as a tested animated spinner;
layout, clipping, contrast and accessibility are unqualified. See
[busy feedback](../../../../docs/app/components.md#busy-feedback-on-appkit).

```tsx
import { Spinner } from '@octane-xplat/ui'

export function Saving() {
	return <Spinner size="sm" label="Saving settings" />
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


## AppKit text clear focus

TextInput/SearchInput clear now requests focus on the retained native input after
onChange('') and onClear. Controlled parents still own value feedback; callbacks
that unmount the input do not focus the detached host. Actual focus/caret/IME and
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
the new child leaf. Ordinary form groups now request selection after Arrow/
Home/End focus, with RTL horizontal keys and owned roving Tab exclusions when
the native bridges are available. Disabled/read-only groups do not install keys;
interactive trailing children keep their own keys. Native input/Tab/reveal,
VoiceOver and layout remain unqualified; toolbar-specific navigation is still
unsupported. See
[radio choices](../../../../docs/app/components.md#radio-choices-on-appkit).

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
remain unchanged; empty-cell Backspace/OTP autofill and native focus/IME/secure/
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
wins. Unmount stops pending UI writes; failures still use onActionError.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): Promise<void> }) {
	return <Button label="Save" clickAction={save} />
}
```

Button href is sanitized and handed to the platform opener before clickAction.
It does not use the router; target has no native browsing-context behavior.
Native URL opening/input/VoiceOver/busy geometry remain unqualified. Tooltip
presentation is still missing. See the [source contract](../../../../docs/app/components.md#appkit-button-actions-and-links).

```tsx
import { Button } from '@octane-xplat/ui'

export function Help() { return <Button href="https://example.com/help">Help</Button> }
```


IconButton.macos is a thin wrapper around Button.macos with isIconOnly, matching
the shared native shape. Use the Button contract for pending/overlap/errors,
group defaults, metadata and href. Native tooltip/presentation/input/VoiceOver
qualification is still open.

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
parent. Group value membership ignores member save actions.

```tsx
import { ToggleButton } from '@octane-xplat/ui'

export function Pin({ save }: { save(value: boolean): Promise<void> }) {
	return <ToggleButton label="Pin" pressedChangeAction={save} />
}
```

Pressed button state maps to native checked-control role/value and changed-value
notifications. Source cases/fixture are authored but unrun; native VoiceOver,
input, busy geometry, tooltip, reserved semibold width and group/toolbar roving
remain unqualified or absent. See [toggle saves](../../../../docs/app/components.md#save-a-toggle-button-action-on-appkit).


## AppKit interactive cards

ClickableCard sanitizes href and calls the platform opener before onPress;
URL-bearing cards expose a link role, callback-only cards a button role.
Both interactive cards use TextSlot for primitive children and forward
variant/elevation classes. SelectableCard remains controlled. Native appearance,
URL launch, nested-control gesture arbitration and disabled-but-focusable
selection cards remain unqualified or missing; native target browsing contexts
are not implemented. See [cards](../../../../docs/app/interactive-actions.md#appkit-card-qualification).

```tsx
import { ClickableCard } from '@octane-xplat/ui'

export function Help() {
	return <ClickableCard label="Open help" href="https://example.com/help" elevation="low">Help</ClickableCard>
}
```
