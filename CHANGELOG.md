# Changelog

Selected features and breaking changes, newest release first. Bug fixes appear
in the [fixlog](FIXLOG.md).
Earlier releases retain their original combined notes; older independent
releases remain in the [tsrx-typegen changelog](packages/tsrx-typegen/CHANGELOG.md).

# Changelog

Selected features and breaking changes, newest release first. Bug fixes appear
in the [fixlog](FIXLOG.md).
Earlier releases retain their original combined notes; older independent
releases remain in the [tsrx-typegen changelog](packages/tsrx-typegen/CHANGELOG.md).

## [Octane Xplat 0.19.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.19.0) - 2026-10-31

### Preserve modified AppKit action keys

Self-drawn controls now pass Control/Option/Command Enter/Space combinations to
native key handling. Unmodified and Shift-only activation remain; disabled/
read-only accessibility state and missing actions also pass through.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): void }) {
	return <Button label="Save" clickAction={save} />
}
```

Actual OS shortcuts, menu equivalents, input-source switching and accessibility
remain unqualified. See [native activation](https://github.com/octane-xplat/octane-xplat/blob/feat/appkit-native-support/packages/macos-renderer/README.md#self-drawn-control-keyboard-activation).

### Animated image source path on AppKit

The optional GIF package now has an experimental native NSImageView path for
animated illustrations on AppKit. Add the package, rebuild the native host and
give the image a size. Native compilation, GIF playback and packaged consumers
remain unqualified; animated WebP depends on the macOS decoder.

```tsx
import { AnimatedImage } from '@octane-xplat/gif'
<AnimatedImage src="~/loading.gif" alt="Loading illustration" width={160} height={120} />
```

Reduced motion stops frame progression. AppKit prefetch still resolves false.
See the [AppKit subset](https://github.com/octane-xplat/octane-xplat/tree/main/packages/gif#experimental-appkit-subset).

### Busy feedback on AppKit

AppKit Spinner now renders named sizes, labels and on-media contrast and exposes
a named progress owner. Switch shows a compact ring while saving or loading.

```tsx
import { Spinner } from '@octane-xplat/ui'

export function Saving() {
	return <Spinner size="sm" label="Saving settings" />
}
```

Spinner rotation and indeterminate ProgressBar sliding now connect to the
existing AppKit keyframe sampler. Reduced Motion leaves steady feedback; workspace
display-option changes refresh its media rule. Native playback, notification
delivery, appearance, clipping and accessibility remain unqualified. See
[busy feedback](https://octane-xplat.goddardai.org/app/components#busy-feedback-on-appkit).

```tsx
import { ProgressBar } from '@octane-xplat/ui'
export function Upload() {
	return <ProgressBar label="Uploading" isIndeterminate />
}
```

### AppKit button links and busy actions

AppKit Button now opens sanitized hrefs, wraps text children in a native label
and keeps content mounted while an action is busy. Interruptible overlapping
calls keep busy state until every call settles. Held presses now use current
props and active calls, with ownership claimed before URL dispatch. Accepted
action/error callbacks and pending work survive prop/ref replacement; detached
presses are ignored. The tooltip prop now sets the native pointer hint on the
same host, including IconButton and ToggleButton, and clears when removed.
AppKit owns its delay and appearance; focus-triggered tooltips remain a gap.

```tsx
import { Button } from '@octane-xplat/ui'

export function Help() { return <Button href="https://example.com/help" tooltip="Open the help guide">Read help</Button> }
```

Native input, URL opening, busy layout and VoiceOver remain unqualified;
focus-triggered tooltip presentation remains unsupported. See [AppKit buttons](https://octane-xplat.goddardai.org/app/components#appkit-button-actions-and-links).

IconButton now uses the same AppKit Button owner for group disablement,
identifiers, href and pending actions, with its required label retained as the
accessible name.

```tsx
import { IconButton } from '@octane-xplat/ui'

export function Share({ share }: { share(): Promise<void> }) {
	return <IconButton label="Share document" icon="share" clickAction={share} />
}
```

### AppKit calendar day keyboard source support

AppKit Calendar now uses the shared bounded date-navigation model for arrows,
row/grid edges and month paging, with one enabled day Tab candidate across panes.
Enter/Space selects through the existing callback; unfinished ranges handle Escape
locally. The layer Escape monitor now consults renderer handlers before dismissal.
Controlled month changes wait for parent acceptance before native focus.

```tsx
import { Calendar } from '@octane-xplat/ui'

export function Departure() {
	return <Calendar defaultValue="2026-03-05" min="2026-01-01" max="2026-12-31" numberOfMonths={2} />
}
```

Physical keys, native Tab/focus, popup integration, AX/VoiceOver and packaging
remain unqualified. See [calendar keys](https://octane-xplat.goddardai.org/platform/date-picker#navigate-appkit-calendar-days-with-keys).

### AppKit carousel navigation source support

Carousel now provides its handle and Previous/Next controls on AppKit, with
viewport paging, indexed slide alignment and end wrapping. Proportional slides
use measured viewport widths. Requests preserve vertical scrolling and honor
reported reduced motion.

```tsx
import { Carousel, Text } from '@octane-xplat/ui'

export function Previews() {
	return <Carousel label="Previews" hasButtons hasLoop variant="proportional" style={{ width: 320, height: 120 }}>
		<Text>First</Text><Text>Second</Text>
	</Carousel>
}
```

Native layout/RTL, scroll/input, button hit testing/accessibility and packaging
remain unqualified. Snap and edge fades remain gaps. See [AppKit carousel navigation](https://octane-xplat.goddardai.org/app/components#navigate-appkit-carousel-slides).

### AppKit carousel snap source support

Carousel now requests the nearest slide edge after native user scrolling settles.
Live tracking waits for an end notification; unbracketed user updates use a quiet
period. Programmatic animations do not arm another snap, and new requests or
teardown cancel pending work.

```tsx
import { Carousel, Text } from '@octane-xplat/ui'

export function Previews() {
	return <Carousel label="Previews" hasSnap variant="proportional" style={{ width: 320, height: 120 }}>
		<Text>First</Text><Text>Second</Text>
	</Carousel>
}
```

Native input/momentum, layout/RTL, animation/accessibility and packaging remain
unqualified. Edge fades remain a gap. See [AppKit snap](https://octane-xplat.goddardai.org/app/components#snap-appkit-carousel-slides-after-user-scrolling).

### Hover, drag and click native macOS charts

On experimental AppKit, an interactive `Chart` now follows the pointer like it
does on web. Hovering moves the tooltip and crosshair, dragging calls
`onScrub`, and clicking calls `onPress` with the point under the pointer
instead of the chart's center. Real pointer behavior has not yet been checked
on a running Mac.

```tsx
import { Chart } from '@octane-xplat/charts'

export function StepsChart() {
	return <Chart type="line" width={320} height={200} tooltip crosshair accessibilityLabel="Steps per day"
		data={[{ name: 'Steps', values: [{ x: 1, y: 4200 }, { x: 2, y: 6100 }] }]} />
}
```

See [respond to pointing and tapping](https://github.com/octane-xplat/octane-xplat/blob/main/packages/charts/README.md#respond-to-pointing-and-tapping).

### Checkbox-list composition on AppKit

CheckboxList now supports CheckboxListItem children alongside options, with
shared selection, Field ownership, descriptions/trailing content and native
checkbox names/mixed state. Value-less items support controlled select-all rows.

```tsx
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

export function Features() {
	return <CheckboxList label="Features" defaultValue={['email']}>
		<CheckboxListItem value="email" label="Email" description="Daily summary" />
		<CheckboxListItem value="alerts" label="Alerts" />
	</CheckboxList>
}
```

Native input/Tab, mixed VoiceOver, divider/layout appearance and packaging remain
unqualified. See [checkbox lists](https://octane-xplat.goddardai.org/app/components#checkbox-lists-on-appkit).

### Checkbox metadata on AppKit

Standalone AppKit Checkbox now renders descriptions and validation messages,
honors hidden labels and leaves enclosing Field metadata in one place. Label
tooltips now forward to the existing field info affordance. Actions retain the
latest local choice before rendering, use current blocking props and ignore
callback reentry or held callbacks after detachment.

```tsx
import { useState } from 'octane'
import { Checkbox } from '@octane-xplat/ui'

export function IncludeArchived() {
	const [include, setInclude] = useState(false)
	return <Checkbox label="Include archived" labelTooltip="Include archived records"
		description="Search older records" value={include} onChange={setInclude} />
}
```

Source cases remain unrun; native input/ref timing, layout and accessibility remain unqualified. AppKit changeAction
remains unsupported. See [checkbox metadata](https://octane-xplat.goddardai.org/app/components#checkbox-metadata-on-appkit).

### Continue typing after clearing AppKit input

TextInput and SearchInput now request focus on the input after clearing, keeping
onChange('') before onClear. Controlled parents still apply value changes.

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Search() {
	return <SearchInput label="Find records" hasClear defaultValue="recent" />
}
```

Native focus/caret/IME, clear activation and accessibility remain unqualified.
See [clear and continue typing](https://octane-xplat.goddardai.org/app/primitives#clear-and-continue-typing-on-appkit).

### Adjust native macOS color controls from the keyboard and VoiceOver

On experimental AppKit, `ColorArea` and `ColorSlider` (including the parts
inside `ColorPicker`) are now Tab stops. Arrow keys move the hue by 1° or the
saturation and brightness by 1%, and Shift moves ten times as far. VoiceOver
can increment and decrement them and reads the current hue or color. Real
keyboard and VoiceOver behavior has not yet been checked on a running Mac.

```tsx
import { ColorSlider } from '@octane-xplat/ui'

export function AccentHue() {
	return <ColorSlider channel="hue" defaultValue="#4488ff" accessibilityLabel="Accent hue" />
}
```

See [color controls](https://octane-xplat.goddardai.org/app/components#color-controls).

### Reveal secondary row actions on AppKit

AppKit now has an experimental hover/focus source path for useContainerReveal.
Spread its props on the row and its action group. Actions keep their layout
space and remain mounted; hosts without tracking capability leave them visible.
Native hover, keyboard and accessibility behavior remain unqualified.

```tsx
import { Button, HStack, Text, useContainerReveal } from '@octane-xplat/ui'
export function FileActions() {
  const reveal = useContainerReveal()
  return <HStack {...reveal.getContainerProps()}><Text>report.pdf</Text>
    <HStack {...reveal.getContentRevealProps()}><Button label="Edit report" /></HStack>
  </HStack>
}
```

See the [row-action guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/components.md#media-contrast-and-row-actions).

### AppKit self-drawn control semantics

The renderer now maps switch/tab/slider roles, selected and numeric values,
and ignored container hosts. Native slider increment/decrement actions dispatch
the current callbacks; changed value/selection props emit change notifications.
Disabled hosts now expose the enabled getter AppKit actually queries, and native
focus policies read that getter.

```tsx
import { Slider, Switch } from '@octane-xplat/ui'

export function Settings() {
	return <><Switch label="Alerts" defaultValue /><Slider label="Volume" defaultValue={40} /></>
}
```

Native selector registration, VoiceOver, notification ordering and packaged
support remain unqualified. See [renderer accessibility](https://github.com/octane-xplat/octane-xplat/blob/feat/appkit-native-support/packages/macos-renderer/README.md#self-drawn-control-accessibility).

### Enable AppKit choice actions after mount

Self-drawn checkboxes, switches and radio choices can now acquire a click
recognizer when a callback appears after an initially disabled/read-only mount.
Callback changes reuse the recognizer; callback removal disables it.

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function Choice({ saving }: { saving: boolean }) {
	return <Checkbox label="Include archived" isDisabled={saving} />
}
```

Native re-enable clicks, gesture arbitration and teardown remain unqualified.
See [click ownership](https://github.com/octane-xplat/octane-xplat/blob/feat/appkit-native-support/packages/macos-renderer/README.md#update-self-drawn-click-actions).

### Preserve AppKit composition during controlled updates

AppKit TextInput, TextArea and SearchInput now defer a different controlled
value while the native editor has marked text. A newer matching echo cancels
the older pending value, and removal cancels its observer and scheduled work.
Single-line and multiline submit paths leave marked-text confirmation to the
input context.

```tsx
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function Name() {
	const [value, setValue] = useState('')
	return <TextInput label="Name" value={value} onChange={setValue} />
}
```

Real IME, field-editor/selection timing and packaging remain unqualified. See
[text and keyboard actions](https://octane-xplat.goddardai.org/app/primitives#text-and-keyboard-actions).

### Style native macOS hover, press and focus states with CSS

Experimental AppKit stylesheets now match `:hover`, `:active`, `:focus`,
`:focus-visible` and `:focus-within`, and re-check `@media` width rules when a
window resizes. `:focus-visible` matches text fields and keyboard focus, not a
mouse click on a button. Every window shares the largest window's size for
media rules. Real pointer, keyboard and resize behavior has not yet been
checked on a running Mac.

```css
.row:hover { background-color: #eef3ff; }
.action:focus-visible { outline: 2px solid #1677ff; }
@media (max-width: 600px) { .sidebar { display: none; } }
```

See the [AppKit stylesheet limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets).

### Experimental AppKit date and time autofocus

DateInput and TimeInput now wire their existing `hasAutoFocus` flag on macOS.
The queued request waits for attachment and cancels when the user interacts,
focus ownership changes or the field becomes blocked or unmounts. A cancelled
request requires a new false-to-true flag transition; unblocking alone does not
rearm it. The request never activates a window or opens a picker.

```tsx
import { DateInput } from '@octane-xplat/ui'
export function NewBooking() {
	return <DateInput label="Booking date" hasAutoFocus />
}
```

Native focus/caret/IME, notification timing, modal integration, accessibility and
packaging remain unqualified. See [date focus guidance](https://octane-xplat.goddardai.org/platform/date-picker#request-initial-appkit-date-or-time-focus).

### AppKit date-field focus handles

AppKit DateInput, TimeInput and DateTimeInput now provide their existing ref
handles. DateRangeInput focus/blur requests now target its trigger. Focus checks
the current host and blocking state; blur leaves unrelated editors alone.

```tsx
import { useRef } from 'octane'
import { Button, DateInput } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export function Booking() {
	const date = useRef<TextInputHandle | null>(null)
	return <>
		<DateInput ref={date} label="Booking date" />
		<Button label="Edit date" clickAction={() => date.current?.focus()} />
	</>
}
```

Native ref/focus/editor/IME, popup/accessibility and packaging remain unqualified.
See [date focus handles](https://octane-xplat.goddardai.org/platform/date-picker#focus-an-appkit-date-field-from-a-form-action).

### AppKit typed date/time submit source wiring

DateInput, TimeInput and both DateTimeInput text segments now route native submit
to the same draft-commit boundary as blur, preserving existing parsing and clears.

```tsx
import { TimeInput } from '@octane-xplat/ui'

export function StartTime(props: { value: string | null; change(value: string | null): void }) {
	return <TimeInput label="Start time" value={props.value} onChange={props.change} />
}
```

Physical Return, IME/blur ordering, focus/AX and packaging remain unqualified.
See [typed date/time Return](https://octane-xplat.goddardai.org/platform/date-picker#commit-typed-appkit-date-and-time-drafts-with-return).

### Keep experimental AppKit date-time drafts current

DateTimeInput now checks current blocking/save ownership before draft writes,
uses current date/time options in retained handlers and preserves parent
correction or teardown after callbacks. A date-less time draft is available to
the next edit immediately and can be cleared; unchanged committed values do not
repeat change/save callbacks.

```tsx
import { useState } from 'octane'
import { DateTimeInput } from '@octane-xplat/ui'
export function Appointment() {
	const [value, setValue] = useState<string | null>(null)
	return <DateTimeInput label="Appointment" value={value} onChange={setValue} hasClear />
}
```

Native editor/IME, Return/blur/save, picker/keyboard/focus/accessibility and
packaging remain unqualified. See [date-time drafts](https://octane-xplat.goddardai.org/platform/date-picker#keep-both-appkit-date-time-drafts-current).

### AppKit date-time minute stepping

DateTimeInput now binds plain Up/Down in the closed time field to timeIncrement,
independently of preset cadence. Steps respect date/time bounds and keep date-less
time drafts until a date is entered. Parent values remain authoritative and
pending saves exclude duplicate changes and popup entry.

```tsx
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment(props: { value: string | null; change(value: string | null): void }) {
	return <DateTimeInput label="Appointment" value={props.value} onChange={props.change}
		timeIncrement={5} timeOptionInterval={15} />
}
```

Native keys, editor/IME, popup/focus/accessibility and packaging remain unqualified.
See [date-time stepping](https://octane-xplat.goddardai.org/platform/date-picker#step-the-appkit-date-time-field-without-opening-presets).

### Draw double and 3D borders on native macOS

Experimental AppKit now draws `double`, `groove`, `ridge`, `inset` and
`outset` borders instead of painting them solid with a warning. `double` needs
a width of at least 3 points, and the 3D styles darken some sides so the box
looks raised or sunken. On rounded corners the inner edges stay straight. The
borders have not yet been checked on a running Mac.

```css
.sunken-well { border-width: 3px; border-style: inset; border-color: #888; }
.picture-frame { border-width: 6px; border-style: double; }
```

See [AppKit borders](https://octane-xplat.goddardai.org/app/styling#appkit-borders).

### Keep disabled AppKit selection cards discoverable

Disabled SelectableCard now opts into native focus without enabling its action.
The renderer releases focus ownership on enablement/detach, and FocusScope
respects the native eligibility while keeping disabled fields excluded.

```tsx
import { SelectableCard } from '@octane-xplat/ui'

export function Plan({ selected, onChange }: { selected: boolean; onChange(value: boolean): void }) {
	return <SelectableCard label="Team plan" isSelected={selected} isDisabled onChange={onChange}>Unavailable</SelectableCard>
}
```

Real Tab/VoiceOver/window behavior remains unqualified. See [AppKit cards](https://octane-xplat.goddardai.org/app/interactive-actions#appkit-card-qualification).

### AppKit attachment file-drop source support

FileInput now receives local regular-file URLs in compact and dropzone presentations through the matching
AppKit renderer and uses the same validation and save ownership as the picker.
Directories, symlinks, uninspectable files and promised/non-file payloads are excluded.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments(props: { value: FileInputFile[]; change(value: FileInputFile | FileInputFile[] | null): void }) {
	return <FileInput label="Attachments" mode="dropzone" value={props.value} onChange={props.change} isMultiple />
}
```

Native drag delivery, sandbox access, focus/VoiceOver and packaging remain
unqualified. See [file entry](https://octane-xplat.goddardai.org/platform/date-picker#drop-local-files-on-appkit).

### Filter macOS attachments with native file types

Experimental AppKit pickers now use OS image, audio, video and text groups, plus
registered MIME types. FileInput also asks the OS for filename MIME hints so
formats outside the built-in table can reach validation.

**Breaking change — AppKit:** unresolved or malformed restrictions now raise
`UnsupportedFileTypeError` before opening a panel. Previously, unknown MIME
entries could silently leave the picker unrestricted. Use explicit extensions
for unregistered formats; `*/*` explicitly allows any file.

```ts
// FileActions.macos.ts
import { files } from '@octane-xplat/files'
export async function chooseAttachments() {
  return files.pickMultiple('image/*,.pdf')
}
export async function chooseCustomFormat() {
  return files.pick('.mydoc')
}
```

These are selection and filename hints, not content verification. Native bridge,
OS panel and installed-app qualification remain pending. See
[AppKit file filters](https://github.com/octane-xplat/octane-xplat/blob/main/packages/files/README.md#appkit-file-type-filters).

### Read and save files in native macOS apps

The experimental AppKit files service now implements UTF-8 text reads,
chunked binary reads with size limits and cancellation, Documents writes,
and user-directed export through the native save panel. Real AppKit and
packaged-app qualification remain pending.

```ts
import { files } from '@octane-xplat/files'

const draft = await files.writeBytes('draft.bin', new Uint8Array([1, 2, 3]))
const bytes = await files.readBytes(draft, { maxBytes: 1024 })
const result = await files.export('draft.bin', bytes)
```

[Files documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/files)

### AppKit multiple-option presentation

AppKit Selector now passes multiple mode to its view, including MultiSelector's
checkbox/select-all presentation. Blocked/pending rows reject selection, and
custom option/single-value renderers receive native text hosts.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]}
		defaultValue={['email']} hasSelectAll />
}
```

Popup keyboard/focus, layout and VoiceOver remain unqualified. See [AppKit selection](https://octane-xplat.goddardai.org/app/search-selection#appkit-finite-option-selection).

### Track keyboard and mouse focus in native macOS apps

The experimental AppKit `useFocusVisible` hook now observes keyboard and mouse
input instead of returning unsupported. `useFocusRing` combines that modality
with the control's focus callbacks. App deactivation clears the remembered
modality. Actual OS input and focus appearance still require qualification.

```tsx
import { Text, useFocusVisible } from '@octane-xplat/ui'

export function InputStatus() {
  const input = useFocusVisible()
  return <Text>{input.isSupported ? input.inputModality : 'Unavailable'}</Text>
}
```

[Focus behavior](https://octane-xplat.goddardai.org/app/primitives#focus-behavior)

### Keep keyboard focus inside native macOS scopes

The experimental AppKit FocusScope now implements autofocus, containment,
restoration and nested ownership when its native bridge is available. Empty
scopes can receive focus without a fake action or normal Tab stop. Actual
OS keys, IME, focus appearance and VoiceOver remain unqualified.

```tsx
import { FocusScope, TextInput } from '@octane-xplat/ui'

export function Details() {
  return <FocusScope contain autoFocus restoreFocus accessibilityLabel="Details">
    <TextInput label="Name" />
    <TextInput label="Notes" />
  </FocusScope>
}
```

[Focus behavior](https://octane-xplat.goddardai.org/app/primitives#focus-behavior)

### AppKit focus-within tracking

AppKit can now track focus entering and leaving a group of native controls with
`useFocusWithin`. Attach its handlers to a raw native container; moving between
its fields keeps the group focused.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useFocusWithin } from '@octane-xplat/ui'

export function Details() {
	const within = useFocusWithin({ onFocusWithinChange: (inside) => console.log(inside) })
	return <masonview {...within.focusWithinProps}>
		<textfield placeholder="Name" />
		<textfield placeholder="Notes" />
	</masonview>
}
```

`isSubtreeTrackingSupported` reports native observer availability. Shared `View`
does not forward these handlers. AppKit runtime qualification remains pending;
see [focus behavior](https://octane-xplat.goddardai.org/app/primitives#focus-behavior).

### Formatted letter spacing on AppKit

AppKit formatted text now carries inherited letter spacing into attributed
runs. Use finite points; a span can restore default spacing with zero.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Caption() {
	return <label><formattedstring style={{ letterSpacing: 1 }}>
		<span text="Spaced " /><span text="default" style={{ letterSpacing: 0 }} />
	</formattedstring></label>
}
```

Rich text also retains the host’s stylesheet-computed line height.

```css
.caption { line-height: 24px; }
```

Native shaping and layout remain unqualified. See the
[AppKit renderer](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#apply-stylesheets).

### Navigate custom native macOS cell grids

`useGridFocus` now has an AppKit source implementation for marked native cells.
It reuses the native grid focus and scrolling engine, supports bounded arrow
and Home/End movement, and leaves selection/activation with the cell. No new
dependency or public option is added.

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

See [custom AppKit cells](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/components.md#custom-grid-cell-focus-on-appkit).
Native input, compiled hooks, nested focus, scrolling, layout, VoiceOver,
cleanup and installed consumers remain unqualified. The selector-based
`useGridList` hook is a separate remaining gap.

### Navigate GridList rows with keys on AppKit

AppKit `GridList` now implements arrow/Home/End navigation with one roving Tab
stop. Enter activates a row; Space selects it, and Shift+Space extends a range
without selecting disabled keys. Focused rows scroll into view.

```tsx
import { GridList, Text } from '@octane-xplat/ui'

export function Files() {
	return <GridList items={[{ id: 'notes' }, { id: 'draft' }]} columns={2}
		selectionMode="multiple" renderItem={(item) => <Text>{item.id}</Text>}
		onAction={(key) => console.log('open', key)} />
}
```

Use `keyboardNavigationBehavior="tab"` for cells containing interactive
controls. The custom selector-based `useGridList` hook and Shift+click ranges
remain unavailable on AppKit. Actual OS input, scrolling, accessibility and
packaging remain unqualified. See [AppKit GridList](https://octane-xplat.goddardai.org/app/components#gridlist-on-appkit).

### Handle hardware keys in native macOS leaves

The experimental AppKit `useKeyboard` hook now attaches normalized key-down/up
handlers to native intrinsics. It routes from the first responder through
registered native ancestors, supports cancellation and propagation, and
coordinates Tab handling with FocusScope. Real OS input and IME remain
unqualified. Modifier-only changes and extended physical-key mappings remain
explicit limits.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useKeyboard } from '@octane-xplat/ui'

export function SearchField() {
  const keys = useKeyboard({ onKeyDown: (event) => {
    if (!event.isComposing && event.metaKey && event.key.toLowerCase() === 'k') {
      event.preventDefault()
    }
  } })
  return <textfield accessibilityLabel="Search" {...keys.keyboardProps} />
}
```

[Keyboard documentation](https://octane-xplat.goddardai.org/app/keyboard-clipboard#handle-hardware-keys-on-appkit)

### Heading metadata on AppKit

Experimental AppKit Heading now forwards its level to native accessibility.
Its accessible title follows plain and rich text updates while visible contents
stay intact. Display typography remains independent of the semantic level.

```tsx
import { Heading } from '@octane-xplat/ui'
export function Title({ title }: { title: string }) {
	return <Heading level={2} type="display-2">{title}</Heading>
}
```

Native setter behavior and VoiceOver heading navigation, announcements and updates
remain unqualified. See the [text guide](https://octane-xplat.goddardai.org/app/components#text).

### Prefetch and manage AppKit image bytes

AppKit image helpers now prefetch HTTP(S) bytes without decoding, report memory
or disk presence, and evict or clear image-owned caches. Displayed images use
the same byte cache. Failed or non-cacheable prefetch resolves false; native
persistence, networking, responsiveness and packaging remain unqualified.

```ts
import { prefetch, isImageCached, evictImage } from '@octane-xplat/image'
const src = 'https://example.com/photo.png'
const warmed = await prefetch(src, { concurrency: 2 })
console.log(warmed, (await isImageCached(src))[src])
await evictImage(src)
```

AppKit HTTP image loading now uses a credential-free dedicated session instead
of shared cookies/credentials. Configuration fields that previously did nothing
now throw; use `initializeImageCache()` with default options. Display headers
now fail before loading instead of being ignored. `cachePolicy="none"` now
bypasses framework memory/disk caches when UI and renderer support match. Header-aware
prefetch, transform queries and other engine extensions remain unsupported.
Eviction preserves mounted images and does not purge unrelated HTTP/account data.
See the [AppKit image subset](https://github.com/octane-xplat/octane-xplat/tree/main/packages/image#appkit-subset).

```tsx
import { Image } from '@octane-xplat/image'
export function FreshPhoto({ src }: { src: string }) {
	return <Image src={src} cachePolicy="none" alt="Photo" style={{ width: 120, height: 80 }} />
}
```

Optional AppKit Image now forwards onLoad/onError with current-request ownership
and deferred root-scoped delivery. Placeholder-only updates keep the request.
Dimensions report native representation pixels or 0×0 when unknown; callbacks
do not prove native drawing. Matching UI/renderer support is required; native
qualification remains pending.

```tsx
import { Image } from '@octane-xplat/image'
export function Preview({ src }: { src: string }) {
	return <Image src={src} alt="Preview" style={{ width: 120, height: 80 }}
		onLoad={(event) => console.log(event.width, event.height, event.source)}
		onError={({ error }) => console.warn(error.message)} />
}
```

### Compute clipped AppKit image fit rectangles

AppKit `Image` now computes clipped fit rectangles for cover, contain, fill,
none and scale-down, with shared keyword, point and percentage positions.
The optional image package uses the same native path.

```tsx
import { Image } from '@octane-xplat/ui'

export function Portrait({ src }: { src: string }) {
	return <Image src={src} alt="Portrait" contentFit="cover"
		contentPosition={{ top: 0, right: '25%' }}
		style={{ width: 120, height: 120 }} />
}
```

Native cropping, orientation, density and pixels remain unqualified. Raw CSS
positions support keywords, px and percentages; unsupported values warn and
center. See [AppKit image loading](https://octane-xplat.goddardai.org/app/components#image-loading-on-appkit).

### Resolution candidates for AppKit images

AppKit images now choose among resolution candidates using the image box and
its window's backing density, and reselect after resize or density changes.
Use a stable styled box; native cross-screen and intrinsic-only behavior still
need runtime qualification.

```tsx
import { Image } from '@octane-xplat/ui'

export function Avatar() {
	return <Image alt="Avatar" style={{ width: 80, height: 80 }} src={[
	{ uri: '~/avatar.png', width: 80, height: 80, scale: 1 },
	{ uri: '~/avatar@2x.png', width: 80, height: 80, scale: 2 },
]} />
}
```

See [AppKit image loading](https://octane-xplat.goddardai.org/app/components#image-loading-on-appkit).

### In-app document browsing on AppKit

Experimental AppKit webBrowser now has an owned WebKit window source path with
history, reload/stop, close controls, native page alert/confirm/prompt sheets
and a file-selection panel for page attachments. Add the package to the app and rebuild
the native host. Actual compilation, presentation and packaging remain
unqualified.

```ts
import { webBrowser } from '@octane-xplat/web-browser'
await webBrowser.openBrowser('https://docs.example.com')
webBrowser.dismissBrowser()
```

**Breaking change (macOS):** the external-browser fallback is removed. Missing or
failing native bridges return cancel. Use platform.openUrl for external launch.
The external-launch migration is explicit:

```ts
import { openUrl } from '@octane-xplat/platform'
openUrl('https://docs.example.com')
```

The native file picker follows multiple/directory parameters; HTML accept hints
are not guaranteed native filtering.

```html
<label>Attachments <input type="file" multiple></label>
```

Opened reports presentation, not page load; advanced web/auth/download
flows remain outside this source subset. See the
[package guide](https://github.com/octane-xplat/octane-xplat/tree/main/packages/web-browser#experimental-appkit-subset).

### Leading icons in AppKit text fields

AppKit TextInput now renders `startIcon`, and SearchInput displays its default
or custom glyph and supports `icon={false}`. TextInput also forwards placeholder
text color. Native glyph presentation and accessibility remain unqualified.

```tsx
import { SearchInput, TextInput } from '@octane-xplat/ui'

export function Fields() {
	return <>
		<SearchInput label="Find" icon={false} placeholder="Search items" />
		<TextInput label="Name" startIcon="xplat-check" />
	</>
}
```

See [building screens](https://octane-xplat.goddardai.org/app/primitives).

### AppKit interactive card links

AppKit ClickableCard now opens sanitized hrefs before its action callback.
Interactive cards host plain text children and forward variant/elevation classes.

```tsx
import { ClickableCard } from '@octane-xplat/ui'

export function Help() {
	return <ClickableCard label="Open help" href="https://example.com/help" elevation="low">Read help</ClickableCard>
}
```

Native input/URL launch/layout and disabled-card focus remain unqualified. See [AppKit cards](https://octane-xplat.goddardai.org/app/interactive-actions#appkit-card-qualification).

### Align native macOS label text with logical edges

AppKit labels now resolve start/end alignment from CSS direction, with a
left-to-right fallback. Left/right/center/justify remain explicit. Changing or
removing either style refreshes attributed paragraphs; unsupported values warn
and use the default edge. This adds an alignment source path, with native
measurement, justification, painting and installed-app qualification pending.
It does not add CSS bidi overrides or vertical writing.

```css
.amount { text-align: end; }
.rtl-copy { direction: rtl; }
```

See [AppKit text alignment](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/styling.md#appkit-text-alignment).

### Move between AppKit screen regions

AppKit useLandmark now has an experimental F6/Shift+F6 source path within the
current window and containing FocusScope. Native key delivery, focus, scrolling
and accessibility remain unqualified.

```tsx
import { TextInput, VStack, useLandmark } from '@octane-xplat/ui'
export function SearchRegion() {
  const { landmarkProps } = useLandmark({ role: 'search', label: 'Document search' })
  return <VStack {...landmarkProps}><TextInput label="Search" /></VStack>
}
```

AppKit follows native view order; web registration order can differ. Hosts
without the required bridge keep role/label forwarding. See the
[region guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/navigation-ui.md#move-between-appkit-screen-regions).

### Image gestures in AppKit Lightbox

Experimental AppKit Lightbox now has double-click image zoom and pointer/native
swipe navigation source paths. Zoom resets between media; swipes stop navigating
while zoomed and at gallery edges. Actual native input, hit testing, zoom
coordinates and packaged consumers remain unqualified.

```tsx
import { Lightbox } from '@octane-xplat/ui'
export function Photos({ open, setOpen, source }: {
	open: boolean; setOpen: (open: boolean) => void; source: string
}) {
	return <Lightbox isOpen={open} onOpenChange={setOpen} hasZoom media={[{ src: source, alt: 'Photo' }]} />
}
```

Lightbox retains its separate renderer-owned native video path; playback remains unqualified. See the
[AppKit presentation guide](https://octane-xplat.goddardai.org/app/primitives#macos-shared-presentations).

### Logical AppKit scroll offsets

ScrollableArea now follows InternationalizationProvider direction for inline
seeks, start/end state and inline padding. In RTL, inline zero means the right
edge; direction changes keep the handle stable and remeasure state.

```tsx
import { InternationalizationProvider, ScrollableArea, Text } from '@octane-xplat/ui'

export function Notes() {
	return <InternationalizationProvider dir="rtl">
		<ScrollableArea axis="inline" width={240} height={80} paddingInlineStart={2}>
			<Text>Notes</Text>
		</ScrollableArea>
	</InternationalizationProvider>
}
```

Native content ordering, initial clip position, OS scrolling and animation
remain unqualified. See [logical scrolling](https://octane-xplat.goddardai.org/app/primitives#logical-scroll-offsets-on-appkit).

### AppKit menu surface keyboard navigation

AppKit menus now have a source keyboard path for wrapping arrows, Home/End,
label-prefix search, manual activation and directional submenus. Plain Down/Up
on the closed trigger requests first/last-row opening. Existing row
state and close owners remain in charge; nested editors keep their menu-surface
key handling. ContextMenu adds Shift+F10 and plain Context Menu key opening and return intent from a valid
invoker or visible trigger. With the matching renderer it also requests opening
from secondary-click and plain Control-primary-click inside the context scope.
Menu surfaces/rows now map to native menu roles and row titles, and native queries
read current selected/expanded state. Checked-menu announcements remain incomplete.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}><DropdownMenuItem label="Archive" /></DropdownMenu>
}
```

Native key/focus/popup/VoiceOver behavior remains unqualified. Owned dropdown Tab/Shift-Tab now records adjacent-trigger return intent through
accepted ancestor closure; actual native Tab return remains unqualified. See the
[AppKit menu guide](https://octane-xplat.goddardai.org/menus#navigate-appkit-menu-surfaces).

### Keep native macOS context menus on the current record

The experimental AppKit context menu now retires outdated actions when items,
records or views change. It preserves child editing/nested menus, restores prior
menu ownership on cleanup and blocks disabled or retired selections. The macOS
demo now uses the native package. Actual pointer, tracking, keyboard and
VoiceOver qualification remains pending.

```tsx
// NoteActions.macos.tsx
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text } from '@octane-xplat/ui'
export function NoteActions({ noteID }: { noteID: string }) {
	return <AppKitContextMenu id={`actions-${noteID}`} items={[{ id: 'rename', title: 'Rename' }]}
		trigger={() => <Text>Right-click this note</Text>} onItemSelected={(id) => console.log(noteID, id)} />
}
```

See [native AppKit menus](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/context-menu.md#native-macos-menus).

### Keep native macOS date selection current

The experimental AppKit date picker now keeps uncontrolled selections across
mode/style changes, uses the current callback and accessibility label, and
rejects invalid controlled dates or bounds. Disabled, retired and programmatic
changes do not report user selections. The macOS demo now exercises the native
control; OS input, layout and VoiceOver qualification remains pending.

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

See [native AppKit date selection](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/date-picker.md#native-macos-selection-lifecycle).

### Choose values with a native macOS pop-up button

The new `@octane-xplat/picker/macos` entry exports `AppKitPicker` for native
AppKit apps. It uses the system pop-up button with stable string selection IDs,
disabled choices and controlled or uncontrolled state. The maintained native
demo now exercises the control. No additional macOS plugin is required.

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

See the [native macOS selection guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/native-picker.md#native-macos-selection).
Native pointer/keyboard, tracking, focus, layout, VoiceOver, teardown and
installed-consumer qualification remain pending.

### Keep native macOS sheets attached to their owning window

`AppKitSheet` now owns current dismissal callbacks, waits for its window and
portal content, and cleans up queued or presented sessions on close or owner
removal. Its classes/styles apply to the content host. The native demo includes
record editing, nested sheets and queued requests.

Breaking: the parentless floating-window fallback is removed. Keep the anchor
mounted in the intended window; a request waits until that window is attached.

```tsx
// Details.macos.tsx
import { AppKitSheet } from '@octane-xplat/sheet/macos'
import { Text } from '@octane-xplat/ui'
export function Details({ record, open, close }: {
	record: { id: string; title: string }; open: boolean; close: () => void
}) {
	return <AppKitSheet id={`details-${record.id}`} open={open}
		className="p-4" onDismissed={close}
		content={() => <Text>{record.title}</Text>} />
}
```

See the [native window-sheet guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/sheet.md#native-macos-window-sheets).
Actual AppKit input, queueing/cancellation, nested presentation, focus, layout,
VoiceOver and packaged consumers remain unqualified.

### Number field options on AppKit

AppKit NumberInput now supports units, display formatting, optional steppers
and clear-to-null. Standalone labels and validation use Field, and inherited
disabled/read-only state also blocks stepper actions. Edit, step and clear
requests use current props and the latest local value, and reject nested or
detached actions. Steps and clear wait during marked editor text.

```tsx
import { NumberInput } from '@octane-xplat/ui'

export function Quantity() {
	return <NumberInput label="Quantity" defaultValue={2} min={0} max={9}
		units="kg" hasClear hasNumberSteppers={false} />
}
```

The formatter does not add a locale parser. Native input, layout, focus and
accessibility remain unqualified. See [AppKit number fields](https://octane-xplat.goddardai.org/app/components#number-fields-on-appkit).

### Heading navigation on AppKit

Experimental AppKit Outline now has native heading seeks and uncontrolled
scroll spy. Supply the native scroll viewport when the navigation sits outside
its scroll ancestor. Header offsets, controlled selection, click-scroll opt-out
and reduced-motion seeks have source implementations.

```tsx
import { Outline, type HostElement } from '@octane-xplat/ui'
export function Contents({ scroll }: { scroll: { current: HostElement | null } }) {
	return <Outline items={[{ id: 'intro', label: 'Introduction', level: 1 }]}
		scrollContainerRef={scroll} offset={24} />
}
```

Actual native seeks, animation completion, scroll spy, input/VoiceOver and
packaged consumers remain unqualified. Completion uses a quiet timer fallback.
See the [content-display guide](https://octane-xplat.goddardai.org/app/content-display#outline-from-markdown-or-a-rendered-tree).

### Heading snapshots on AppKit

Experimental AppKit can now derive Outline items from a native content root
when the renderer heading-reader bridge is installed. The hook snapshots IDs,
current heading text and levels; it does not observe later content mutations.
Native discovery and packaged-consumer qualification remain pending.

```tsx
import { useOutlineFromView } from '@octane-xplat/ui/macos'
import { Outline } from '@octane-xplat/ui'
export function Contents({ root }: { root: object }) {
	const items = useOutlineFromView(root)
	return <Outline items={items} hasScrollOnClick={false} />
}
```

Older hosts still report unsupported. Native navigation has a separate source
implementation and remains unqualified. See the [content-display guide](https://octane-xplat.goddardai.org/app/content-display#outline-from-markdown-or-a-rendered-tree).

### Clip overflowing AppKit containers

Experimental AppKit containers now request native bounds clipping for hidden or
clipped overflow on both axes. Removing the style restores the view's original
clipping setting, including OS and specialized-view defaults.

```tsx
<masonview style={{ width: 160, height: 48, overflow: 'hidden' }}>
	<label text="Content inside the native bounds" />
</masonview>
```

Mixed axes and scrolling overflow remain unsupported. Native drawing,
hit-testing and packaged behavior remain unqualified. See the
[AppKit clipping subset](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#clip-appkit-container-overflow).

### AppKit overflow-tab keyboard source support

TabMenu now joins its tab strip's focus order and opens first/last options with
Down/Up. The popup reuses menu focus, typeahead, selection and Tab-return intent;
empty overflow lists disable the trigger. Parent selection remains authoritative.

```tsx
import { TabList, Tab, TabMenu } from '@octane-xplat/ui'

export function Sections(props: { value: string; change(value: string): void }) {
	return <TabList role="tablist" value={props.value} onChange={props.change}>
		<Tab value="overview" label="Overview" />
		<TabMenu label="More" options={[{ value: 'settings', label: 'Settings' }]} />
	</TabList>
}
```

Native keys/ref/focus/return, accessibility and packaging remain unqualified.
Focused-row repair source ownership is also present; native delivery remains unqualified. See [AppKit overflow tabs](https://octane-xplat.goddardai.org/app/components#overflow-tabs-on-appkit).

### Experimental native macOS pages

Pager now has an AppKit source implementation for small onboarding flows and
galleries, replacing its unsupported placeholder. Pages use the native scrolling
viewport, current text direction and reduced-motion preference. Settled user
changes report through the existing callback; programmatic changes do not echo.

```tsx
import { Pager } from '@octane-xplat/pager'
import { Text } from '@octane-xplat/ui'
export function TravelPages() {
	return <Pager items={['Pack', 'Travel']} defaultPage={1}
		style={{ width: 320, height: 160 }} renderItem={(title) => <Text>{title}</Text>} />
}
```

**Breaking change:** Pager requires `@octane-xplat/ui >=0.18.0 <1` for its public
native scrolling API. AppKit renders pages eagerly; use a bounded collection.
Native input/momentum, layout/RTL, focus/accessibility and packaging remain
unqualified. See the [Pager guide](https://github.com/octane-xplat/octane-xplat/tree/main/packages/pager#platform-support).

### Use dashed and dotted borders on macOS

Native AppKit boxes now paint dashed and dotted borders, including rounded and
mixed-side styles. The FileInput dropzone's shared theme uses this path. None
and hidden sides consume no border width; removing style restores the existing
width-only solid default. Other decorative styles and non-solid outlines keep
their documented approximations. Native painting and installed-app qualification
remain pending.

```css
.attachment-target {
	border-width: 2px;
	border-color: #225588;
	border-style: dashed;
	border-radius: 8px;
}
```

See [native AppKit borders](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/styling.md#appkit-borders).

### Move backward through an AppKit PIN

Pressing plain Backspace in an empty editable AppKit PIN cell now requests focus
on the preceding cell. It leaves the code unchanged; filled-cell deletion and
IME or modified shortcuts keep native editor behavior.

```tsx
import { PinInput } from '@octane-xplat/ui'

export function Code() {
	return <PinInput label="Verification code" length={4} />
}
```

Actual native key delivery, focus and VoiceOver remain unqualified. See
[AppKit PIN fields](https://octane-xplat.goddardai.org/app/primitives#pin-fields-on-appkit).

### AppKit PIN field metadata

PinInput now inherits Field state and renders standalone metadata once. Each
cell has its own ID and accessible digit name; blocked groups cancel pending
focus advance, and validation changes preserve entered values.

```tsx
import { PinInput } from '@octane-xplat/ui'

export function Code() {
	return <PinInput label="Account code" description="Enter four characters" length={4} />
}
```

Shared paste/deletion behavior is unchanged. Native focus/IME/secure fields,
VoiceOver and OTP autofill remain unqualified or open. See
[PIN fields](https://octane-xplat.goddardai.org/app/primitives#pin-fields-on-appkit).

### Keep timestamps when editing native macOS filters

AppKit PowerSearch now preserves an unchanged absolute timestamp's time and
precision and rejects invalid UTC calendar input. Date-only operators deliberately
save midnight UTC. Calendar widgets and timezone-specific display still need a
custom editor; native input and accessibility qualification is pending.

```ts
import type { DateAbsoluteOperatorValue } from '@octane-xplat/ui'
const timestamp: DateAbsoluteOperatorValue = { type: 'date_absolute' }
const day: DateAbsoluteOperatorValue = { type: 'date_absolute', isDateOnly: true }
```

See [AppKit absolute dates](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/power-search.md#edit-native-appkit-absolute-dates).

### Select entity filters on native macOS

The experimental AppKit PowerSearch editor now selects entities from a search
source, removes/clears selections and supports optional free entries. Configured
paste splitting uses a separate **Add entries** action and keeps the draft intact
if a lookup fails. Apps still own entity matching; native input and accessibility
qualification is pending.

```ts
import type { EntityListOperatorValue } from '@octane-xplat/ui'
const tags: EntityListOperatorValue = {
	type: 'entity_list', isArbitraryStringAllowed: true, tokenization: {},
}
```

See [AppKit entity filters](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/power-search.md#edit-native-appkit-entity-filters).

### Focus AppKit PowerSearch once its input attaches

Experimental AppKit PowerSearch now waits for its first native input attachment
when initial focus is requested. User activity, a newer focus owner, blocking,
filter editing and removal cancel stale requests.

```tsx
import { PowerSearch, createPowerSearchConfig } from '@octane-xplat/ui'
const { config } = createPowerSearchConfig([{ key: 'title', type: 'string' }] as const)
export function Search() {
	return <PowerSearch config={config} filters={[]} onChange={() => {}} hasAutoFocus />
}
```

Native focus, IME, modal and packaging behavior remain unqualified. See
[initial AppKit search focus](https://octane-xplat.goddardai.org/app/power-search#request-initial-appkit-search-focus).

### Validate numeric filters on native macOS

AppKit PowerSearch now rejects invalid numbers and enforces configured bounds
before saving. Scalar drafts follow the current filter, honor its default operator
and block stale or read-only saves. Native input and accessibility qualification
remains pending.

```ts
import type { IntegerOperatorValue } from '@octane-xplat/ui'
const year: IntegerOperatorValue = { type: 'integer', minValue: 1800, maxValue: 2100 }
// 1968 is valid; blank, NaN, fractions and out-of-range years do not save.
```

See [AppKit numeric filters](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/power-search.md#validate-native-appkit-numeric-filters).

### Edit date-range filters on native macOS

AppKit PowerSearch now has a built-in range form for Now, UTC date/time and
relative endpoints, plus named interval presets. Invalid or reversed ranges do
not save. Timezone display and expression-string presets still need a custom
editor; native input and accessibility qualification remains pending.

```ts
import { createPowerSearchConfig } from '@octane-xplat/ui'
const { config } = createPowerSearchConfig([{ key: 'created', type: 'date', label: 'Created' }] as const)
// Use config with PowerSearch and choose the date field's between operator.
```

See [native AppKit range editing](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/power-search.md#edit-native-appkit-date-ranges).

### AppKit preset-time keyboard source support

DateTimeInput now opens presets with Alt+Down and requests native option focus.
Bounded arrows/Home/End move without committing; Enter/Space uses the existing
selection path. Tab records field-neighbor return intent through popup closure.

```tsx
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment(props: { value: string | null; change(value: string | null): void }) {
	return <DateTimeInput label="Appointment" value={props.value} onChange={props.change} timeOptionInterval={15} />
}
```

Physical keys, focus/Tab/return, IME, scroll/AX and packaging remain unqualified.
Row text relay and full listbox accessibility remain gaps. See [preset time keys](https://octane-xplat.goddardai.org/platform/date-picker#choose-appkit-preset-times-with-keys).

### AppKit action identifiers

AppKit Pressable and Button now forward testID and accessible. Concrete native
hosts map testID to an accessibility identifier, keeping CSS IDs and spoken
labels separate.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): void }) {
	return <Button id="save-control" testID="draft.save" label="Save changes" clickAction={save} />
}
```

Native selector replay and VoiceOver remain unqualified. See
[AppKit identifiers](https://octane-xplat.goddardai.org/testing/test-identifiers#appkit-source-implementation).

### Radio choices on AppKit

RadioList now supports RadioListItem children alongside options, with one
selection owner, descriptions/trailing content and Field metadata. Native rows
have explicit radio names and checked state. Ordinary form groups now request
selection after Arrow/Home/End focus, respect RTL horizontal keys and use owned
roving Tab exclusions when the native bridges are available.

```tsx
import { RadioList, RadioListItem } from '@octane-xplat/ui'

export function Plan() {
	return <RadioList label="Plan" defaultValue="free">
		<RadioListItem value="free" label="Free" description="Personal use" />
		<RadioListItem value="team" label="Team" />
	</RadioList>
}
```

Native input/Tab/focus/reveal, VoiceOver and layout remain unqualified;
toolbar-specific radio navigation remains unsupported. See [radio choices](https://octane-xplat.goddardai.org/app/components#radio-choices-on-appkit).

### Owned AppKit radio selection

Experimental AppKit radio choices now use current group/item state and callbacks
for selection. Disabled, removed or retired rows cannot select, and repeated
uncontrolled selection before render reports once. Controlled parents keep
checked-state authority.

```tsx
import { RadioList } from '@octane-xplat/ui'
export function Plan() {
	return <RadioList label="Plan" defaultValue="free"
		options={[{ value: 'free', label: 'Free' }, { value: 'team', label: 'Team' }]} />
}
```

Native input, focus, accessibility and packaging remain unqualified. See
[AppKit radio choices](https://octane-xplat.goddardai.org/app/components#radio-choices-on-appkit).

### Use native macOS window and lifecycle hooks through platform entries

AppKit now selects the same native implementations through the platform root
and screen, lifecycle, safe-area and breakpoint subpaths. Hook calls live in
files included by the AppKit compiler. Window snapshots are stable read-only
content sizes, and subscriptions retain their native owner through cleanup.

```tsx
import { useWindowSize, useAppState } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function WindowStatus() {
	const size = useWindowSize(), state = useAppState()
	return <Text>{`${state}: ${size.width}×${size.height}`}</Text>
}
```

**Breaking change:** AppKit `useBackHandler` returns `void`, matching the shared
contract. Remove assignment/calls of its former no-op cleanup. It remains an
Android-only back interception hook with no AppKit listener. Treat returned
window snapshots as immutable; copy them before changing a local value.

```tsx
import { useBackHandler } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function Editor() {
	useBackHandler(() => false)
	return <Text>Editor</Text>
}
```

See [AppKit window and activity state](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#read-appkit-window-and-activity-state).
Primary-window scope, zero insets and existing missing-host fallbacks remain;
compiler/native resize/activity/input/AX/memory and installed-app qualification
are pending.

### Adapt native macOS layouts to window size

The experimental AppKit `useMediaQuery` hook now follows primary-window resize
notifications and reports desktop fine-pointer/hover traits. Native query
matching also rejects invalid pointer/hover values and respects `and` before
`or`. Actual resize/rendering and packaged-app qualification remain pending.

```tsx
import { Text, useMediaQuery } from '@octane-xplat/ui'

export function WindowLayout() {
  const wide = useMediaQuery('(min-width: 800px)')
  return <Text>{wide ? 'Wide layout' : 'Compact layout'}</Text>
}
```

[Responsive AppKit layout](https://octane-xplat.goddardai.org/app/components#responsive-appkit-layout)

### Preserve AppKit search composition during query updates

Raw native search fields now defer differing programmatic text while the native
editor has marked text. Changed writes still emit the existing text-change event.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Search({ query, onQuery }: { query: string; onQuery(value: string): void }) {
	return <searchbar text={query} onTextChange={(event) => onQuery(event.value)} />
}
```

Actual IME, selection and packaging remain unqualified. See the
[AppKit editing contract](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#controlled-text-during-composition).

### Choose views with native macOS segments

The experimental AppKit SegmentedControl now renders options and child items,
tracks selection and disabled/read-only state, and implements scoped arrow,
Home and End navigation. AppKit radio roles now expose checked values.
OS input, VoiceOver and presentation parity remain unqualified.

```tsx
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'

export function ViewMode() {
  return <SegmentedControl defaultValue="list" accessibilityLabel="View">
    <SegmentedControlItem value="list" label="List" />
    <SegmentedControlItem value="grid" label="Grid" />
  </SegmentedControl>
}
```

[Component documentation](https://octane-xplat.goddardai.org/app/components#appkit-segmented-control)

### AppKit Selector keyboard flow

AppKit Selector now has source paths for opening and navigating by keyboard,
manual option focus, Enter/Space commits, prefix/local-search input and Escape/
Tab close intent. It reuses native choice ordering and popup focus ownership.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Fruit() {
	return <Selector options={[{ value: 'apple', label: 'Apple' }, { value: 'cherry', label: 'Cherry' }]}
		searchable defaultValue="apple" />
}
```

Physical keys, IME, popup/return focus, VoiceOver and packaging remain unqualified.
See [AppKit selection keys](https://octane-xplat.goddardai.org/app/search-selection#use-selector-keys-on-appkit).

### Removable AppKit selection badges

AppKit MultiSelector now supports removable selected-value badges. Removal follows
the existing save and rollback flow, with disabled/read-only/pending guards.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector triggerDisplay="badges" defaultValue={['email']}
		options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]} />
}
```

Native pointer/focus/VoiceOver behavior remains unqualified. See the
[AppKit badge guide](https://octane-xplat.goddardai.org/app/search-selection#remove-selected-values-on-appkit).

### AppKit Selector field metadata

Standalone AppKit Selector now renders FormField labels, descriptions and status;
an enclosing Field keeps ownership instead. Trigger IDs stay stable, testID is
forwarded, and ghost mode forwards its existing chrome class.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Region() {
	return <Selector label="Region" description="Choose a region" testID="profile.region" variant="ghost"
		options={[{ value: 'west', label: 'West' }]} isRequired />
}
```

Native layout, label/tooltip behavior, VoiceOver and identifier replay remain
unqualified. See [Selector metadata](https://octane-xplat.goddardai.org/app/search-selection#appkit-selector-field-metadata).

### Settings and range sliders on AppKit

AppKit Slider now implements bounded scalar/range values, steps, marks,
formatted readouts and separate thumb adjustments. Field disabled/read-only
state also blocks changes. Default fractional readouts retain their value on
web as well.

```tsx
import { Slider } from '@octane-xplat/ui'

export function Budget() {
	return <Slider label="Budget" defaultValue={[20, 80]} min={0} max={100}
		step={5} valueDisplay="text" />
}
```

Native input, focus, accessibility and layout remain unqualified. See
[AppKit Slider](https://octane-xplat.goddardai.org/app/components#slider-on-appkit).

### Save switch changes on AppKit

AppKit Switch now invokes changeAction, reports busy while saving, and restores
the previous value through onChange on failure. Overlapping saves are blocked;
completion after unmount is ignored. Save ownership now starts before onChange
callbacks, preventing reentrant duplicate saves; cached handlers use current
blocking props. Rapid uncontrolled requests now continue from the latest local
choice before rendering, and failed saves restore that choice before rollback.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Preference({ save }: { save(next: boolean): Promise<void> }) {
	return <Switch accessibilityLabel="Preference" defaultValue changeAction={save} />
}
```

Source cases remain unrun; native activation/ref timing and loading presentation remain unqualified. See
[switch saves](https://octane-xplat.goddardai.org/app/components#save-a-switch-setting-on-appkit).

### Activate AppKit switches from their labels

AppKit Switch labels now use the same toggle/save handler as the track and
request focus on the control. The label target uses the renderer's Tab exclusion
lease so it does not introduce a second sequential keyboard stop.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Alerts() {
	return <Switch label="Alerts" description="Daily summary" defaultValue />
}
```

Native hit testing, tooltip arbitration, focus, Tab order and accessibility
remain unqualified. Without the renderer's suppression bridge, use the track.
See [switch settings](https://octane-xplat.goddardai.org/app/components#save-a-switch-setting-on-appkit).

### Labeled AppKit switches

Standalone AppKit Switch now renders labels, descriptions and validation status.
Label-side/spacing options and compact size use the shared CSS layout; an
existing Field retains metadata ownership.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Alerts() {
	return <Switch label="Alerts" description="Daily summary" defaultValue
		labelPosition="start" labelSpacing="spread" width={280} />
}
```

Activate the track; label-click activation remains a gap. Native layout, focus
and accessibility are unqualified. See
[switch settings](https://octane-xplat.goddardai.org/app/components#save-a-switch-setting-on-appkit).

### Open System Settings on macOS

AppKit `openSettings` can now open the installed System Settings application.
Check support and availability from an explicit user action:

```ts
import { openSettings } from '@octane-xplat/platform'

if (openSettings.supported && await openSettings.isAvailable()) {
	const accepted = openSettings.open()
	console.log(accepted)
}
```

This does not choose an app-specific permission page or change permissions.
A true result means the launch request was accepted; actual AppKit presentation
and packaged behavior remain unqualified. See [opening settings](https://octane-xplat.goddardai.org/platform/platform-services#open-settings).

### AppKit tab-strip focus and scrolling

AppKit TabList now uses native geometry to reveal selected/focused tabs and
adds roving focus for registered Tab children. Arrows/Home/End move focus;
Enter/Space activate. Visible tabs gain explicit accessible names, and disabled
tabs retain their native role/state.

```tsx
import { useState } from 'octane'
import { TabList, Tab } from '@octane-xplat/ui'

export function Sections() {
	const [value, setValue] = useState('overview')
	return <TabList role="tablist" value={value} onChange={setValue}>
		<Tab value="overview" label="Overview" />
		<Tab value="details" label="Details" />
	</TabList>
}
```

Actual keyboard/Tab, scroll visibility, VoiceOver, panel relationships and
layout remain unqualified. TabMenu stays an independent trigger. See
[AppKit tab strips](https://octane-xplat.goddardai.org/app/components#tab-strips-on-appkit).

### Scroll wide data tables on AppKit

AppKit data Table now has an experimental horizontal viewport source path.
Constrain its container; pixel widths remain fixed and proportional columns
honor minimum widths. Controlled useTableColumnResize overrides now update
header, body and scroll sizing together. Native layout, scrolling and packaging
remain unqualified.

```tsx
import { Table, View, pixel } from '@octane-xplat/ui'
<View style={{ width: 360 }}><Table data={[{ name: 'Ada', team: 'Platform' }]}
  columns={[{ key: 'name', width: pixel(180) }, { key: 'team', width: pixel(400) }]} />
</View>
```

Child-composed tables keep their existing flow. AppKit sticky columns now have an experimental measured native placement
source path; actual positioning, hit-testing and accessibility remain unqualified. See the [table guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/tables.md#wide-data-tables-on-appkit).


```tsx
import { useTableColumnResize } from '@octane-xplat/ui'
export function usePeopleWidths() {
  return useTableColumnResize({ columnWidths: { name: 320 } })
}
// Call usePeopleWidths inside a component and pass its plugin to Table.
```


```tsx
import { useTableStickyColumns } from '@octane-xplat/ui'
export function usePeoplePins() {
  return useTableStickyColumns({ startKeys: ['name'], endKeys: ['status'] })
}
// Inside a component, pass the returned plugin to Table.
```


AppKit also has experimental native resize handles with drag previews,
keyboard limits and splitter accessibility source paths. Accept controlled
commits in the parent; native interaction and accessibility remain unqualified.

```tsx
import { useState } from 'octane'
import { useTableColumnResize } from '@octane-xplat/ui'
export function useEditableWidths() {
  const [columnWidths, setWidths] = useState<Record<string, number>>({})
  return useTableColumnResize({ columnWidths, onColumnResizeEnd: setWidths,
    minWidth: 80, maxWidth: 520 })
}
```

### Choose how native macOS table text overflows

AppKit data tables now apply `textOverflow="truncate"` to default-rendered body
labels as one line with a tail ellipsis; wrapping is the default. Switching
modes preserves the full value. Custom cells and headers keep their own text
behavior. Native measurement, painting and installed-app qualification remain
pending.

```tsx
import { Table, pixel } from '@octane-xplat/ui'
export function Trips() {
  return <Table data={[{ name: 'A long weekend in the mountains' }]}
    columns={[{ key: 'name', width: pixel(180) }]} textOverflow="truncate" />
}
```

See [AppKit table text](https://github.com/octane-xplat/octane-xplat/blob/main/docs/tables.md#choose-body-text-wrapping-on-appkit).

### Readable text composition on AppKit

Experimental AppKit now composes nested Text and RichText as styled runs under
one text owner. Text inside Heading uses that owner too. RichText purpose
imports share the root leaf, and RichTextSpan.text now displays its explicit
value without duplicating child content. Root text hosts retain parent-layout
props; native layout and accessibility qualification remain pending.

```tsx
import { RichText, RichTextSpan, Text } from '@octane-xplat/ui'
export function Notice() {
	return <>
		<Text>Read <Text weight="bold">carefully</Text>.</Text>
		<RichText><RichTextSpan text="Ready to review" /></RichText>
	</>
}
```

Per-span press hit testing remains unimplemented. See the
[text component guide](https://octane-xplat.goddardai.org/app/components#text).

### Owned AppKit text entry state

Experimental AppKit text fields now use current editable state and callbacks
for edits, submit and clear. Clear preserves callback-chosen focus; retained
handles and handlers become inert after removal. Composing drafts still report
edits, while submit and clear wait for committed text.

```tsx
import { TextInput } from '@octane-xplat/ui'
export function Name() {
	return <TextInput label="Name" defaultValue="Ada" hasClear
		onChange={(text) => console.log(text)} onSubmit={() => console.log('Submit')} />
}
```

Native editing, IME, caret, clear/focus and packaging remain unqualified. See
[AppKit text action ownership](https://octane-xplat.goddardai.org/app/text-entry#keep-appkit-text-actions-owned-by-the-current-field).

### Labels and validation for AppKit text fields

Standalone AppKit TextInput, TextArea and SearchInput now display their labels,
descriptions and validation messages through the native Field wrapper. Existing
Fields keep ownership of those messages. Native layout and VoiceOver remain
unqualified.

```tsx
import { TextInput } from '@octane-xplat/ui'

export function Name() {
	return <TextInput label="Name" description="Shown publicly" width={280}
		status={{ type: 'error', message: 'Enter a name' }} />
}
```

See [text and keyboard actions](https://octane-xplat.goddardai.org/app/primitives#text-and-keyboard-actions).

### Choose native macOS text overflow with CSS

AppKit labels now apply normal/nowrap whitespace and clip/ellipsis overflow
from CSS when explicit label props are absent. Removing styles restores the
remaining cascade and releases the implicit one-line height. Decorated and
letter-spaced labels retain the current paragraph mode. Native measurement,
painting and installed-app qualification remain pending; CSS preservation,
balanced wrapping and line-clamp remain outside the supported subset.

```css
.compact-title { width: 180px; white-space: nowrap; text-overflow: ellipsis; }
```

See [AppKit text wrapping](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/styling.md#appkit-text-wrapping).

### Length limits for AppKit text areas

AppKit TextArea now implements `maxLength` for committed user edits. It keeps
text outside a paste/replacement and leaves marked input intact until commit.
The cap counts UTF-16 units; initial and external values are not truncated.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Note() {
	return <TextArea label="Short note" maxLength={80} autoGrow maxRows={4} />
}
```

Real IME, undo/redo, selection and native packaging remain unqualified. See
[multiline fields](https://octane-xplat.goddardai.org/app/primitives#grow-a-multiline-field).

### Preserve experimental AppKit time drafts

TimeInput now checks current blocking/save ownership before changing a draft,
and retained submit/edit callbacks use the current text, seconds and bounds.
Callback teardown or parent correction cannot be overwritten by an old draft
clear. The existing AppKit marked-text guard remains in use.

```tsx
import { useState } from 'octane'
import { TimeInput } from '@octane-xplat/ui'
export function StartTime() {
	const [time, setTime] = useState<string | null>('14:30')
	return <TimeInput label="Start time" value={time} onChange={setTime}
		min="09:00" max="18:00" hasClear />
}
```

Native editor/IME, Return/blur/save ordering, focus/accessibility and packaging
remain unqualified. See [AppKit time drafts](https://octane-xplat.goddardai.org/platform/date-picker#keep-appkit-time-drafts-owned-by-the-current-edit).

### AppKit time-field minute stepping

TimeInput now binds plain Up/Down to its minute increment on AppKit. Steps use
the committed value, preserve optional seconds, wrap at midnight and respect
bounds. Parent values stay authoritative while pending saves exclude new edits.

```tsx
import { TimeInput } from '@octane-xplat/ui'

export function Start(props: { value: string | null; change(value: string | null): void }) {
	return <TimeInput label="Starts" value={props.value} onChange={props.change} increment={15} />
}
```

Native keys, IME, focus/accessibility and packaging remain unqualified. See
[AppKit time stepping](https://octane-xplat.goddardai.org/platform/date-picker#step-appkit-time-values-with-arrow-keys).

### AppKit toggle-button save actions

AppKit ToggleButton now shares Button's busy/action handling and inherited props.
Save actions show pending state, block duplicates and report errors while keeping
the optimistic choice. Accepted toggles now keep local intent separate from
controlled/group display, including parent updates during URL dispatch.
Group members retain group-owned selection.

```tsx
import { ToggleButton } from '@octane-xplat/ui'

export function Pin({ save }: { save(pressed: boolean): Promise<void> }) {
	return <ToggleButton label="Pin" pressedChangeAction={save} />
}
```

Pressed native accessibility, input and layout remain unqualified. See
[toggle saves](https://octane-xplat.goddardai.org/app/components#save-a-toggle-button-action-on-appkit).

### Backspace removes the last AppKit token

Experimental AppKit token fields can request removal of the current last token
with Backspace when both query and native editor text are empty. Composing and
modified keys preserve editing; current read-only/disabled state blocks removal.

```tsx
import { useState } from 'octane'
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
const people = [{ id: 'ada', label: 'Ada' }]
const source = createStaticSource(people)
export function Tags() {
	const [tags, setTags] = useState(people)
	return <Tokenizer searchSource={source} value={tags} onChange={setTags} />
}
```

Native key, IME, focus and overflow behavior remain unqualified. See the
[AppKit token-entry guide](https://octane-xplat.goddardai.org/app/search-selection#remove-appkit-tokens-with-empty-input-backspace).

### Native AppKit tokenizer overflow counting

Experimental AppKit token fields now use native bounds and rectangle conversion
for collapsed-row counts, with the counter outside the clipped token viewport.
Layer token copies use separate refs, and widening the field can reclaim the
counter's space when every token fits.

```tsx
import { useState } from 'octane'
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
const people = [{ id: 'ada', label: 'Ada Lovelace' }]
const source = createStaticSource(people)
export function Tags() {
	const [tags, setTags] = useState(people)
	return <Tokenizer label="People" width={240} searchSource={source} value={tags}
		onChange={setTags} tokenOverflowBehavior="unfocusedInline" />
}
```

Native drawing, sizing, focus, accessibility and packaging remain unqualified;
the token layer still renders inline. See the
[AppKit token overflow subset](https://octane-xplat.goddardai.org/app/search-selection#collapse-appkit-token-rows-with-native-geometry).

### AppKit toolbar action focus

AppKit Toolbar now moves focus between discrete actions with axis arrows and
Home/End, without activating them. Hidden/disabled actions are skipped, and
changing orientation preserves slot controls and their local state. The native
accessibility metadata follows the current axis.

```tsx
import { Button, Toolbar } from '@octane-xplat/ui'

export function Actions() {
	return <Toolbar label="Page actions" startContent={<Button label="Save" />}
		endContent={<Button label="Share" />} />
}
```

Editors, sliders and nested composites keep their own keys and Tab stops.
Complete mixed-control roving and stock native-control Tab suppression remain
gaps. Native keys, Tab, VoiceOver,
layout and installed behavior remain unqualified. See [toolbar actions](https://octane-xplat.goddardai.org/app/navigation-ui#add-toolbar-actions-and-responsive-overflow).

### AppKit typeahead suggestion roles and links

Experimental AppKit typeahead fields now declare combo/list/option roles and
link their current native suggestion list and highlighted pending row. Closing,
blocking, replacing or removing the field restores previous native metadata.
Highlighting remains separate from committing the controlled value.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function People() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Choose a person" />
}
```

Native AX hierarchy, VoiceOver navigation/announcements, focus/IME and packaging
remain unqualified. See the
[AppKit role/link subset](https://octane-xplat.goddardai.org/app/search-selection#expose-appkit-suggestion-roles-and-relationships).

### Experimental AppKit typeahead focus

BaseTypeahead now opens bootstrap results on focus, honors its autofocus request,
and cancels searches when the user leaves the field. New queries retire old
responses before debounce; source changes, blocking and teardown cannot reopen
retired results. Refs read the current host and blur preserves other editors.
Typeahead click-to-edit reports its query once, and readonly fields omit clear.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function PersonSearch() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Person" />
}
```

Native input/IME/focus/click/layout and packaging remain unqualified. Results
remain inline; keyboard option selection and listbox accessibility remain gaps.
See [AppKit typeahead](https://octane-xplat.goddardai.org/app/search-selection#bootstrap-appkit-typeahead-results-on-focus).

### Experimental AppKit typeahead keyboard selection

BaseTypeahead now offers results with ArrowDown, moves highlight with arrows and
Home/End, selects with Enter and closes its list with Escape. Tab closes results
while preserving native traversal. Highlighting keeps input focus and requests
native row reveal. The existing consumer key hook runs first and can cancel the
built-in policy; modified shortcuts and composing input retain native defaults.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function PersonSearch() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Person" />
}
```

Native delivery/IME/repeat, Tab/layers, reveal and packaging remain unqualified.
Inline result hosting, listbox accessibility and announcements retain documented
limits. See [AppKit typeahead keys](https://octane-xplat.goddardai.org/app/search-selection#choose-appkit-typeahead-results-with-keys).

### Source-owned AppKit suggestion panel

Experimental AppKit search suggestions now use a source-owned panel in the
field's native window, with bounded scrolling and anchor-based sizing. Custom
result content keeps the field's providers. Typeahead and Tokenizer inherit the
result view. The matching AppKit renderer is required; native runtime behavior
and packaging remain unqualified.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function People() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus menuWidth={280} placement="bottom" accessibilityLabel="Person" />
}
```

Tokenizer's outer unfocused editor layer remains inline. See
[floating AppKit suggestions](https://octane-xplat.goddardai.org/app/search-selection#float-appkit-search-suggestions).

### Embedded video source support on AppKit

Experimental AppKit Video now has an AVPlayerLayer surface with shared playback
controls, posters, mute, loop and millisecond seek commands. Rebuild the native
host after adding the package. Native compilation, playback and packaged-consumer
qualification are still pending.

```tsx
import { Video } from '@octane-xplat/video'
export function Clip({ source }: { source: string }) {
	return <Video src={source} controls style={{ width: 320, height: 220 }}
		onError={({ message }) => console.warn(message)} />
}
```

AppKit reports generic errors; mobile plugin errors remain unavailable. Lightbox
video is separate. See the [video guide](https://octane-xplat.goddardai.org/app/primitives#video-playback)
and [AppKit subset](https://github.com/octane-xplat/octane-xplat/tree/main/packages/video#experimental-appkit-playback).

### Control speech playback and update growing queues

Audio queues now expose pitch-preserving playback speed, volume, and mute on
web, iOS, Android, and experimental macOS. Settings survive source changes;
muting retains the selected volume. Append future items without restarting a
matching current track; incomplete queues distinguish waiting from completion.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'
const player = createAudioPlayer()
await player.setPlaybackRate(1.5)
await player.setVolume(0.4)
await player.setMuted(true)
const first = { id: '1', source: 'https://example.com/1.mp3' }
await player.setQueue([first], 0, { complete: false })
await player.updateQueue([first, { id: '2', source: 'https://example.com/2.mp3' }], { complete: true })
player.dispose()
```

[Audio documentation](https://octane-xplat.goddardai.org/media-services#playback-speed-and-volume)

### Run Xplat with Bun or a standalone executable

**Breaking change:** the npm `xplat` command now requires Bun 1.4.4 or later
on your PATH. Install Bun before running an existing app's CLI commands:

```sh
bun --version
bun run xplat doctor
```

Standalone release executables include Bun and the CLI dependencies in one
file. They extract a cached payload on first launch. Node, Bun, and platform
toolchains remain necessary for app builds.

[CLI setup and executables](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#single-file-executable)

### Manage framework patches with Bun or pnpm

`xplat patches` now detects Bun and pnpm projects, including workspace members
and catalog dependencies. Both use the same framework patch files:

```sh
bun run xplat patches apply
bun install
bun run xplat patches check
```

Use Bun 1.4.4 or later for the complete patch set. For pnpm 11, rerun
`xplat patches apply`: it now writes `pnpm-workspace.yaml` even for a standalone
app, because pnpm 11 ignores `package.json.pnpm.patchedDependencies`.

[Framework patches](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#framework-patches)

### Create and maintain apps with Bun

**Breaking change:** new apps and libraries use Bun 1.4.4 for installation
and project commands. Their `package.json` owns catalogs and patch registrations;
local patch files are ready before the first install.

```sh
bun create octane-xplat my-app
cd my-app
bun run dev
```

`xplat upgrade` and `xplat doctor` support the Bun setup. `xplat add` now requires
a Bun project. Native fingerprints also accept Bun lockfiles. `xplat patches`
retains pnpm support.

[Create your first app](https://octane-xplat.goddardai.org/toolchain)

### Hash and encrypt app data

The new crypto package adds Expo-shaped secure random bytes, UUIDs, hashes and
AES-GCM key/sealed-data APIs. Browsers use Web Crypto, Apple uses CryptoKit and
Android uses JCA; Android runtime remains unverified. The portable AES subset
uses fresh 12-byte nonces and 16-byte tags.

```ts
import { AESEncryptionKey, aesEncryptAsync, aesDecryptAsync } from '@octane-xplat/crypto'

export async function encryptAndReopen(bytes: Uint8Array) {
	const key = await AESEncryptionKey.generate()
	const sealed = await aesEncryptAsync(bytes, key)
	return aesDecryptAsync(sealed, key)
}
```

[Crypto setup, key ownership and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/crypto/README.md)

### Read the docs more comfortably on phones and tablets

The docs site uses larger text, code examples, tables, and touch controls on
phones and tablets. Tablet navigation moves into the menu to give the reading
column more room.

[Read the documentation](https://octane-xplat.goddardai.org/)

### Mobile drawers include edge gestures

**Breaking change:** import `Drawer` and `DrawerProps` from
`@octane-xplat/drawer`. The UI root Drawer and platform-specific SideDrawer and
DrawerLayout exports are removed. Installing the drawer package brings its
mobile plugins; unrelated UI widget imports no longer initialize them.

```tsx
import { useState } from 'octane'
import { Drawer } from '@octane-xplat/drawer'

export function Menu() {
	const [open, setOpen] = useState(false)
	return <Drawer open={open} onOpenChange={setOpen} main={null} drawer={null} />
}
```

Mobile users can open from the left edge and drag closed. Web and desktop use
explicit controls and backdrop dismissal.

[Drawer setup and migration](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/drawer.md)

### Match phone updates to their native binary

The new fingerprint build tool adds Expo-shaped hash/source/diff APIs for
NativeScript inputs. OTA publishing, staging and native startup now require
the exact fingerprint baked into the binary. Publishing rejects changed native
inputs and debug payloads; different native binaries retain separate channel
pointers.

This replaces minimum-native-version manifests and channel keys. Add the build
tool as a development dependency, review/regenerate the existing prepare hook,
rebuild binaries and deploy the matching server. Preserve the private build
record with your release payload. Android runtime qualification is unverified.

```sh
pnpm add -D @octane-xplat/fingerprint
pnpm exec xplat updates init
pnpm exec xplat-fingerprint --dir . --platform ios
```

[Phone update setup and migration](https://octane-xplat.goddardai.org/updates) ·
[Fingerprint API and custom inputs](https://github.com/octane-xplat/octane-xplat/blob/main/packages/fingerprint/README.md)

### Report stored sign-in deletion failures

**Breaking change:** hosted sign-out now rejects if credential deletion fails
or reports false. Memory is still signed out, and server revocation is still
attempted. Previously a deletion failure could be hidden and the stored
session could return after restart.

```ts
// Use the hosted auth client configured by your app.
import { auth } from './auth'
try {
  await auth.signOut()
} catch {
  console.log('Stored sign-in could not be cleared. Try again.')
}
```

[Hosted sign-in documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/auth#hosted-sign-in-ceremonies)

### Resize and crop photo attachments

The new image-manipulator package transforms image pixels and exports JPEG or
PNG files using an Expo-shaped editing context. Rendered images and saved files
have separate cleanup so a preview can outlive its editing context.

```ts
import { ImageManipulator } from '@octane-xplat/image-manipulator'

export async function resizePhoto(sourceUri: string) {
	const context = ImageManipulator.manipulate(sourceUri)
	let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		context.resize({ width: 800 })
		image = await context.renderAsync()
		return await image.saveAsync({ format: 'jpeg', compress: 0.8 })
	} finally {
		image?.release()
		context.release()
	}
}
// The result's preview/upload owner calls releaseImage(result) when finished.
```

[Image manipulation guide and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/image-manipulator/README.md)

### Read HTTP responses as they arrive

The optional network package adds incremental response bytes on web,
iOS, Android, and experimental AppKit. Cancellation releases the request;
unread native data is bounded. This is a byte-stream API with an explicit
request subset, not a replacement for global fetch.

```ts
import { requestStream } from '@octane-xplat/network'
const response = await requestStream('https://example.com/api/events')
const reader = response.body.getReader()
try { console.log((await reader.read()).value?.byteLength) }
finally { await reader.cancel(); reader.releaseLock() }
```

[Network documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/network)

### Add configurable keyboard shortcuts

The optional `@octane-xplat/shortcuts` package adds scoped commands, sequences,
shortcut recording, atomic rebinding and dispatch diagnostics. Browser, GTK/X11 and WinUI input have runtime checks; AppKit has a native
event-queue check. Native desktop adapters remain experimental. Mobile hardware shortcuts are unsupported.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const shortcuts = createShortcuts({ target: document })
shortcuts.bind({ combo: 'Mod+k', preventDefault: true, handler: () => console.log('Open commands') })
// When the owner closes: shortcuts.dispose()
```

[Keyboard shortcuts guide](https://octane-xplat.goddardai.org/keyboard-shortcuts)

### Native localization and text segmentation initialize their own Intl support

Lingui now installs the Intl APIs used by its messages and formatting hooks on
iOS and Android. RollingText supplies text segmentation. Apps do not need to
install FormatJS or initialize those APIs. UI remains independent and handles
missing or partially installed capabilities.

Choose additional Lingui formatting data before activating its catalog:

```ts
// locale-data.mobile.ts
import '@octane-xplat/lingui/locales/de'
```

[Native formatting data](https://octane-xplat.goddardai.org/app/localization#native-formatting-data)

### Leaf packages ship generated declarations

**Breaking change:** leaf packages now emit their type declarations with
`tsrx-typegen` instead of shipping hand-written `types/` facades. Component
exports that were declared as `UniversalComponent<Props>` constants are now
generated function declarations — `function Badge(props: BadgeProps): unknown`
on native and `JSX.Element` on web — matching what TypeScript sees when it
type-checks the source directly.

```ts
// before (hand-written facade)
export declare const Badge: UniversalComponent<BadgeProps>
// after (generated)
export declare function Badge(props: BadgeProps): unknown
```

Source imports and subpath layouts are unchanged; update any code that typed a
component value as `UniversalComponent<P>` to use `typeof Badge` or the props
type directly.

A few platforms are typed more honestly than the facades they replace: web
components now return `JSX.Element` (or `null` where the source returns it),
unsupported-platform stubs declare their real `() => never` signatures, and
`IntersectionObserver` exports its class type rather than a constructor
interface.

### Try native GTK windows from an npm app

The experimental Linux GTK renderer joins the lockstep release. Workshop and
CLI consumers can install it without a framework checkout after the first
automated release. It ships JavaScript, uses Gtk.Box when the optional native
Mason build is absent, and applies explicit accessible names through GTK.
Production qualification remains incomplete.

```sh
pnpm add -D @octane-xplat/linux-gtk
pnpm exec xplat workshop doctor
```

[Linux GTK setup](https://octane-xplat.goddardai.org/linux-gtk)

### Read barcodes from images on native macOS

`barcodeScanner.scanImage` now works in experimental AppKit apps. It uses
Apple's Vision framework to read QR codes and the other supported barcode
formats from a local image file or an `NSImage`, and reports each code's
position in image pixels. Live camera scanning is still unavailable on macOS.
Decoding has not yet been checked on a running Mac.

```ts
import { barcodeScanner } from '@octane-xplat/barcode-scanner'

const codes = await barcodeScanner.scanImage('/Users/me/Desktop/ticket.png', ['qr'])
console.log(codes[0]?.data)
```

See [@octane-xplat/barcode-scanner](https://github.com/octane-xplat/octane-xplat/tree/main/packages/barcode-scanner#decode-a-qr-image).

### CameraView renders a live preview on macOS

`CameraView` from `@octane-xplat/ui/macos` now mounts the AppKit camera
backend from `@octane-xplat/camera` instead of an unsupported label. The
AVCaptureSession preview, permission flow, and `onReady`/`onError`
lifecycle come from the camera leaf unchanged — `@octane-xplat/ui` gains a
workspace dependency on `@octane-xplat/camera`.

```tsx
import { CameraView } from '@octane-xplat/ui/macos'

export function Preview() {
	return <CameraView facing="back" onReady={() => console.log('live')} />
}
```

See the [camera package](https://github.com/octane-xplat/octane-xplat/tree/main/packages/camera)
for the full preview and capture contract.

### macOS/AppKit CSS paint coverage

AppKit now paints layered CSS backgrounds, non-solid outlines, full
`box-shadow` lists, and per-window `@media` results.

- `background`/`background-image` plus `background-repeat`, `-position`,
  `-size`, `-origin` and `-clip` paint comma-separated `url()` image and
  `linear`/`radial`/`conic` gradient layers (including `repeating-`
  variants) under the border, in CSS order. The `background` shorthand
  resets unmentioned longhands.
- `outline`/`outline-*` paints `dashed`, `dotted`, `double`, `groove`,
  `ridge`, `inset` and `outset` instead of falling back to a solid ring.
- `box-shadow` paints every list entry: multiple outset shadows render on
  sibling layers so corner clipping stays on, and `inset` shadows carry
  real blur, offset and spread.
- `@media` width/height resolves per window — portal content uses its own
  window's size, and resizing restyles only the affected windows'
  containers instead of every root.

```css
.card { background-image: linear-gradient(rgba(0,0,0,0.3), transparent), url(~/card.png); }
.field:focus-visible { outline: 3px dashed #1677ff; }
.hero { box-shadow: 0 8px 24px rgba(0,0,0,0.4), inset 0 2px 6px rgba(0,0,0,0.3); }
```

Known limits: `background-attachment`, `background-blend-mode` and
`background-clip: text` warn and stay unsupported, matching the GTK target.

### Cursor and user-select on macOS

AppKit views now honor `cursor` — the matching cursor shows while the pointer
is inside the element (`cursor: none` hides it) — and `user-select` toggles
text selection on labels and html views.

```css
.link { cursor: pointer; user-select: none; }
```

[AppKit styling](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets)

### Gradient backgrounds on macOS

AppKit views now paint linear-gradient backgrounds and resize them with the view.

```css
.fade { background-image: linear-gradient(to right, #152b36, transparent); }
```

[AppKit styling](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets)

### Haptic feedback on macOS trackpads

`@octane-xplat/haptics` now supports the AppKit host through
`NSHapticFeedbackManager`: presets play as discrete trackpad feedback on
compatible hardware. Timed `playPattern` envelopes and realtime sessions
report unsupported — `capabilities()` marks `presets: true` and
`patterns`/`realtime: false`, so gate advanced usage on the flags as
usual.

```ts
import { haptics } from '@octane-xplat/haptics'

if (haptics.supported) {
	haptics.impact('medium')
	haptics.selection()
}
```

See the [haptics package](https://github.com/octane-xplat/octane-xplat/tree/main/packages/haptics)
for the capability contract.

### Build macOS native leaves on Intel Macs

Experimental AppKit apps with native leaves now build on Intel Macs as well as
Apple Silicon. The shipped `objc-metadata-generator` is a universal binary, and
the CLI no longer rejects x86_64 build hosts. Each build host needs Command
Line Tools whose `libclang` carries that host's architecture; Intel CLT
installations provide it natively.

```sh
pnpm xplat build --targets macos   # works on Intel and Apple Silicon Macs
```

See the [macOS native leaves guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/macos-native.md).

### Run native macOS apps on Intel Macs

`xplat build --targets macos` now produces a universal app that runs on both
Apple Silicon and Intel Macs running macOS 13.5 or later. The output moved to
`artifacts/macos-universal/<Name>.app` and `<Name>-macos-universal.dmg`.
Apps without native leaves can also be packaged on an Intel Mac. Apps with
native leaves still need an Apple Silicon build Mac, and each prebuilt
`.dylib` a package ships must contain both `arm64` and `x86_64` slices:

```sh
lipo -create libengine-arm64.dylib libengine-x86_64.dylib \
	-output platforms/macos/prebuilt/libengine.dylib
```

See [Experimental AppKit target](https://octane-xplat.goddardai.org/start/toolchain#experimental-appkit-target).

### Label padding, letter-spacing, italic, and visibility on macOS

AppKit labels now honor `padding`, `letter-spacing`, and italic `font-style`,
and every element honors `visibility: hidden` (keeps its slot) and
`visibility: collapse` (leaves the layout).

```css
.caption { padding: 2px 6px; letter-spacing: 0.5px; font-style: italic; }
.ghost { visibility: hidden; }
```

[AppKit styling](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets)

### Outlines on macOS

AppKit views now paint `outline`/`outline-*` as a solid ring outside the
border edge, tracking the view's frame and corner radius.

```css
.ring { outline: 1.5px solid #0a0a0a; outline-offset: 2px; }
```

[AppKit styling](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets)

### Select renders an AppKit pop-up button on macOS

`@octane-xplat/picker/macos` is a new target entry exporting `Select`,
`SelectOption`, and `SelectProps`. It renders a labeled `NSPopUpButton` and
uses the same `label`, `options`, `value`/`defaultValue`, and `onChange`
contract as the web entry — including per-option `disabled` states.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Select } from '@octane-xplat/picker/macos'

export function Region() {
	return (
		<Select
			label="Region"
			options={[{ value: 'sfo', label: 'San Francisco' }]}
			defaultValue="sfo"
			onChange={(value) => console.log(value)}
		/>
	)
}
```

See the [picker package](https://github.com/octane-xplat/octane-xplat/tree/main/packages/picker)
for the platform entries and prop shapes.

### Browse device photos and manage albums

The new media-library package provides Expo-shaped `Asset`, `Album`, and `Query`
APIs plus an Octane permission hook. Build a custom gallery, save an app image,
or edit an album. iOS has lifecycle test coverage; Android runtime and authorized
AppKit data workflows remain unverified. Browser hosts report unavailable.

```ts
import { MediaLibrary, Query, requestPermissionsAsync } from '@octane-xplat/media-library'

export async function libraryPage() {
	if (!MediaLibrary.supported) return []
	const permission = await requestPermissionsAsync(false, ['photo'])
	return permission.granted ? new Query().limit(20).exeForMetadata() : []
}
```

[Media-library setup, ownership and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/media-library/README.md)

### Keep dragging through layout changes

Dragging now works through layout changes. A dragged host takes over from its current animated position and stays at the pointer while the host or its ancestors move.

```tsx
<motion.View layout drag="x" dragMomentum={false}
  style={{ marginLeft: shifted ? 100 : 0, width: 100, height: 80 }} />
```

Release and cleanup restore ordinary layout animation. See [dragging through layout changes](https://octane-xplat.goddardai.org/animation-gestures#keep-dragging-through-layout-changes).

### Inertia transitions for motion values

`MotionValue.animate` now accepts `type: 'inertia'` — motion-dom's
velocity-driven release with optional `min`/`max` bounds, matching upstream
drag-release semantics. The `target` argument is ignored; pass the current
value.

```ts
x.animate(x.get(), {
	type: 'inertia',
	velocity: vx,
	min: -100,
	max: 100,
	power: 0.5,
	timeConstant: 280,
	bounceStiffness: 360,
	bounceDamping: 36,
})
```

[Motion documentation](https://octane-xplat.goddardai.org/animation-gestures)

### Animate layout changes with `layout`

`motion.View`, `motion.Row`, `motion.Pressable` and `motion.create` hosts now
animate automatically when their measured box changes — resizes, moves and
keyed list reorders — on web, iOS, Android, and the experimental macOS host.

```tsx
<motion.Pressable layout onPress={toggle} style={{ width: wide ? 260 : 120 }}>
	<Text>Tap to expand</Text>
</motion.Pressable>
```

Nested `layout` children keep their size inside a scaling parent
(`layout="position"` animates position only), `layoutDependency` limits the
animation to changes of one value, and `transition={{ layout: {...} }}` tunes
the 0.45 s default. Root/anchor variants are not supported yet; border-radius and box-shadow stretch during
scale, and existing CSS transforms still belong on an outer container.

[Animation and gestures](https://octane-xplat.goddardai.org/animation-gestures#layout-animations)

### Move Motion containers with layout roots and anchors

Motion containers can now use `layoutRoot` to move immediately while their children animate relative to them. Use `layoutAnchor` to choose where a child attaches inside a resizing parent.

```tsx
<motion.View layoutRoot>
  <motion.View layout="position" layoutAnchor={{ x: 1, y: 1 }} />
</motion.View>
```

See [layout animations](https://octane-xplat.goddardai.org/animation-gestures#layout-animations).

### Steady corners and shadows during layout animation

Layout animations now keep numeric rounded corners and shadows steady during resizing. Authored styles are restored when projection ends.

```tsx
<motion.View layout style={{ borderRadius: 20, width: expanded ? 300 : 150 }} />
```

Native corners and scalar blur are exact under uniform scale and approximate otherwise. Multiple web or Mason core shadows remain uncorrected. See [layout animations](https://octane-xplat.goddardai.org/animation-gestures#layout-animations).

### Account for scrolling in layout transitions

Shared layout transitions now account for scrolling that happens before the source is removed. Fixed-position web containers ignore scrolling outside their fixed tree.

```tsx
<ScrollableArea style={{ height: 200 }}>
  <motion.View layoutId="card" style={{ width: 150, height: 100 }} />
</ScrollableArea>
```

Scroll offsets are detected automatically. See [layout animations](https://octane-xplat.goddardai.org/animation-gestures#layout-animations).

### Move an element between components

Give motion hosts the same `layoutId` to animate position and size between
them. Use a distinct `LayoutGroup id` for independent controls. With `Presence`,
outgoing content crossfades and stays mounted until the handoff finishes;
changing direction during the animation continues from its current position.

```tsx
import { LayoutGroup, Presence, motion } from '@octane-xplat/motion'
import { View } from '@octane-xplat/ui'

export function Highlight({ expanded }: { expanded: boolean }) {
	return <LayoutGroup id="card">
		<View style={{ position: 'relative', height: 160 }}>
			<Presence present={!expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
				<motion.View layoutId="surface" style={{ width: 120, height: 80 }} />
			</Presence>
			<Presence present={expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
				<motion.View layoutId="surface" style={{ width: 240, height: 160 }} />
			</Presence>
		</View>
	</LayoutGroup>
}
```

[Shared-element animations](https://octane-xplat.goddardai.org/animation-gestures#move-an-element-between-components)

### Name web dialogs from visible text

Web overlays can now use visible title and description elements to name and
describe their dialog, through `accessibilityLabelledBy` and
`accessibilityDescribedBy`. Native hosts continue to use `accessibilityLabel`.

```tsx
<Overlay open isModal accessibilityLabelledBy="gallery-title">
	<h2 id="gallery-title">Trip photos</h2>
</Overlay>
```

See [Overlay documentation](https://octane-xplat.goddardai.org/components#overlays).

### Shade-free modal overlays

`Overlay` gains `isModal`: a modal layer without the dimmed shade. It gets
focus isolation and Escape dismissal on web, modal accessibility on iOS, and
Android back dismissal — which now also applies to `shadeCover` overlays.

```tsx
import { Overlay } from '@octane-xplat/ui'

<Overlay open={open} isModal accessibilityLabel="Photo viewer" onDismiss={close}>
	{content}
</Overlay>
```

[Overlay documentation](https://octane-xplat.goddardai.org/components#overlays)

### Print receipts and create PDF reports

The new print package opens native print UI and exports HTML as PDF files with
Expo-shaped functions. Exported files have explicit cleanup, while browser file
export reports unavailable. Android runtime remains unverified; macOS support
is experimental.

```ts
import { printToFileAsync, releasePrintFile } from '@octane-xplat/print'

export async function uploadReceipt(upload: (uri: string) => Promise<void>) {
	const pdf = await printToFileAsync({ html: '<h1>Receipt</h1>' })
	try {
		await upload(pdf.uri)
	} finally {
		releasePrintFile(pdf)
	}
}
```

[Print/PDF setup, ownership and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/print/README.md)

### Updated runtime dependencies

**Breaking change:** Apps now use Octane 0.16.3 and require Node.js 22.22.2 or
newer. Update Node before creating or upgrading an app. The supported compiler
and runtime versions move together through `xplat upgrade`.

```sh
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm install
```

See the [toolchain setup](https://github.com/octane-xplat/octane-xplat/blob/main/docs/start/toolchain.md).

### Choose a phone's interface orientation

`@octane-xplat/screen-orientation` adds Expo-shaped orientation queries, locks,
default restoration and removable change subscriptions. iOS requires an app-delegate
callback; browsers and Android have OS restrictions. Android runtime remains unverified.

```ts
import { OrientationLock, lockAsync } from '@octane-xplat/screen-orientation'

await lockAsync(OrientationLock.LANDSCAPE)
```

See [setup and platform limits](https://github.com/octane-xplat/octane-xplat/tree/main/packages/screen-orientation).

### Use the shared JSX types on every platform

**Breaking change.** Every Octane Xplat package types its JSX against the type-only facade
`@octane-xplat/jsx` (native: iOS/Android/Windows/macOS/GTK) or
`@octane-xplat/jsx/dom` (browser). The renderer pragmas are gone — this is
breaking for any consumer code that still carries them:

```diff
-/** @jsxImportSource @nativescript-community/octane */
+/** @jsxImportSource @octane-xplat/jsx */

-/** @jsxImportSource @octane-xplat/macos-renderer */
+/** @jsxImportSource @octane-xplat/jsx */

-/** @jsxImportSource octane */          // browser file
+/** @jsxImportSource @octane-xplat/jsx/dom */
```

`@octane-xplat/macos-renderer` no longer exports `./intrinsics`,
`./jsx-runtime`, or `./jsx-dev-runtime`.

The shared `HostElement` is now `object`: annotate refs with the concrete
host type where declared instead of casting:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import type { View } from '@nativescript/core'

export function NativeLabel() {
	const labelRef = useRef<View | null>(null)
	return <label ref={labelRef} text="Trip details" />
}
```

Leaf element registration moves to the facade intrinsics module:

```ts
declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		mytag: Attributes<TElement, { prop?: string }>
	}
}
```

Layout on intrinsics goes through `style`/`className` only — there are no
layout props on host elements.

[JSX configuration and types](https://github.com/octane-xplat/octane-xplat/tree/main/packages/jsx#select-a-jsx-source)

### Keep the phone launch screen until the app is ready

The new splash-screen package adds Expo-shaped prevention, dismissal and
animation options. Arm it before Application.run(), then reveal the loaded
page after its required data is ready. A native timeout releases an abandoned
hold. Android runtime qualification remains unverified.

```ts
import { preventAutoHideAsync, hide } from '@octane-xplat/splash-screen'

void preventAutoHideAsync()
// Call from the root Page's ready handler:
export function revealReadyPage() { hide() }
```

[Native setup, lifecycle and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/splash-screen/README.md)

### Add guest checkout with Stripe

The new stripe package provides Expo-shaped PaymentSheet operations using the
official native SDKs and a Stripe-hosted web payment form. Your server owns
PaymentIntent creation and payment verification. Test-mode success and wallets
still require qualification; Android runtime remains unverified.

```ts
import { initPaymentSheet, presentPaymentSheet } from '@octane-xplat/stripe'

// After initStripe, using a client secret created by your app's backend:
export async function pay(paymentIntentClientSecret: string, returnURL: string) {
	const initialized = await initPaymentSheet({
		merchantDisplayName: 'Example store',
		paymentIntentClientSecret,
		returnURL,
	})
	return initialized.error ? initialized : presentPaymentSheet()
}
```

[Stripe setup, server ownership and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/stripe/README.md)

### Ask for tracking authorization from an app action

`@octane-xplat/tracking-transparency` adds Expo-shaped permission methods and
an Octane hook, with iOS ATT configuration checks and explicit advertising-ID
access. Android uses an asynchronous worker-thread getter. Other hosts report
their capabilities and supported subsets; real prompt choices and device IDs
remain unqualified.

```ts
import { requestTrackingPermissionsAsync } from '@octane-xplat/tracking-transparency'

export async function requestFromButton() {
	return requestTrackingPermissionsAsync()
}
```

See [setup, consent and platform limits](https://github.com/octane-xplat/octane-xplat/tree/main/packages/tracking-transparency).

### Capture a card as an image

`@octane-xplat/view-shot` adds familiar view capture functions and an Octane
ViewShot wrapper with temporary-image cleanup. Platform formats and capture
strategies have explicit subsets. Runtime image output is not yet qualified.

```ts
import { captureRef, releaseCapture } from '@octane-xplat/view-shot'

const uri = await captureRef(card, { format: 'png' })
try {
	// Await the operation that shares or saves uri.
} finally {
	releaseCapture(uri)
}
```

See [setup, ownership and platform limits](https://github.com/octane-xplat/octane-xplat/tree/main/packages/view-shot).

### WebView page-to-host messaging

`WebView` gains a bounded `onMessage` channel: the embedded document calls
`postToHost` (exported from `@octane-xplat/ui`) with a JSON-serializable
value, and the host's `onMessage` receives `{ data, url?, origin? }` —
ordered, at-least-once, with no reply. This is the supported way for trusted,
app-embedded content to signal readiness or events; it is not a general
script bridge. Delivery is immediate over `postMessage` on web and
poll-drained (~200 ms) on native; origin and payload validation stay with
the app.

```tsx
import { WebView, postToHost } from '@octane-xplat/ui'

// Host:
;<WebView src="https://example.com/widget" onMessage={(e) => console.log(e.data)} />

// Inside the embedded document:
postToHost({ type: 'ready' })
```

Host→page evaluation and request/reply remain on the `native` handle or the
platform escape bags. See [WebView content sizing and messaging](https://octane-xplat.goddardai.org/app/primitives).

### Use native action input on Windows

Button, Pressable and Link now use native focus and activation in the
experimental Windows host. Link's text children also render inside a native
text host.

```tsrx
import { Button, Link, Pressable, Text, VStack } from '@octane-xplat/ui'

export function Actions() @{
  <VStack width="100%" gap={2}>
    <Button clickAction={() => console.log('Saved')}>Save</Button>
    <Pressable accessibilityLabel="Refresh" onPress={() => console.log('Refreshed')}>
      <Text>Refresh</Text>
    </Pressable>
    <Link href="https://example.com/help">Help</Link>
  </VStack>
}
```

Packaged x64 keyboard, mouse and UI Automation checks passed. External URL
launching, Narrator and visual review were not part of that run. See the
[Windows action boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#buttons-and-links).

### Read packaged Windows app metadata

The experimental native Windows app-info adapter reads the installed package's
identifier and four-part version without importing mobile APIs. Unpackaged
hosts report unavailable. Values are read lazily after startup.

```ts
import { appInfo } from '@octane-xplat/platform'

const versionLabel = appInfo.supported ? appInfo.version ?? 'Unknown version' : 'Unavailable'
```

Packaged values and app integration remain unqualified. The standalone x64
check covers only the unavailable result in an unpackaged process.
[App metadata](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#read-the-installed-app-version)

### Show complete notices on Windows

Windows banners now include their title, supporting text and trailing action.
Dismissal removes the notice, and the Details button expands its body. The
Windows target remains experimental.

```tsx
import { Banner, Text } from '@octane-xplat/ui'

export function SavedNotice() {
  return <Banner title="Changes saved" description="Your draft is ready." isDismissable>
    <Text>You can continue editing.</Text>
  </Banner>
}
```

[Windows Banner guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#banner-candidate)

### Use CheckboxInput with a Windows keyboard

The experimental native Windows `CheckboxInput` now accepts Tab/Space, pointer
input and Windows toggle automation while keeping the shared indicator and
label. Mixed state is exposed to automation and activation requests `true`.

```tsx
import { CheckboxInput } from '@octane-xplat/ui'

export function SelectItems() {
  return <CheckboxInput label="Select items" defaultValue="indeterminate" />
}
```

Packaged x64 checks cover common input and state flows. The complete field
contract, screen-reader and visual parity remain open. See the [Windows qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#checkbox-input).

### Use checkbox lists with a Windows keyboard

The experimental native Windows `CheckboxList` and `CheckboxListItem` now
support keyboard and toggle automation input while keeping shared checkbox
appearance. Controlled selection, select-all and keyed option reorder use the
same public API:

```tsx
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

export function Channels() {
  return <CheckboxList ariaLabel="Channels" defaultValue={['email']}>
    <CheckboxListItem value="email" label="Email" />
    <CheckboxListItem value="sms" label="Text message" />
  </CheckboxList>
}
```

Packaged x64 checks cover common input and selection flows. Full field behavior,
screen-reader and visual parity remain open. See the [Windows list qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#checkbox-lists).

### Add experimental Windows text and binary file I/O

Native Windows selects a file-service leaf without loading the mobile document
picker. Text and bounded binary reads/writes are implemented as WinRT candidates.
Writes create uniquely named temporary copies; release schedules deletion of
owned copies only.

```ts
import { files } from '@octane-xplat/files'

const copy = await files.writeText('report.txt', 'Packing list')
try {
  const bytes = await files.readBytes(copy, { maxBytes: 1024 })
} finally {
  files.release(copy)
}
```

Windows picker and export dialogs remain unavailable. Standalone x64 NativeScript
text/binary reads, writes and owned-only release passed using a task-owned
folder. Packaged temporary-folder access, app integration, cancellation and
packaging remain unqualified. Input-stream reclamation depends on the preview
runtime releasing its proxy because `Close` is not projected.
[Windows file I/O boundary](https://github.com/octane-xplat/octane-xplat/blob/main/packages/files/README.md#experimental-native-windows-file-io)

### Request an awake display on native Windows

Experimental Windows keep-awake now uses WinRT DisplayRequest. Independent tags
share one request; app suspension releases it and resume reapplies remaining
owners. Failed release keeps ownership so cleanup can retry. Native construction
and mocked contracts passed; app grants and physical sleep prevention remain
unqualified.

```tsx
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function ReadingScreen() {
	useKeepAwake()
	return <Text>Reading</Text>
}
```

[Keep a screen awake](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/keep-awake.md)

### Add Windows input-aware media-query candidates

The experimental Windows `useMediaQuery` leaf samples pointer, hover and
animation preferences instead of assuming a touch-only device. Hybrid devices
can match both `any-pointer` accuracies. The existing streaming-text hook can
observe the Windows reduced-motion preference through this leaf.

```tsx
import { useMediaQuery } from '@octane-xplat/ui'

export function useCompactTouchLayout() {
  return useMediaQuery('(max-width: 1024px) and (pointer: coarse) and (hover: none)')
}
```

Standalone x64 NativeScript input/preference projection checks passed. Actual
hook execution, live device/settings changes and secondary-window behavior
remain unqualified.
[Windows media-query boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#media-query-candidate)

### Add Windows native import and service candidates

The experimental Windows preset selects a dedicated UI root and Windows overlay,
gradient and announcement helpers. Windows platform leaves add text clipboard
operations, secure random bytes, device identity and packaged-app settings.
Hosted auth now reports unavailable instead of selecting Android code. Windows
preferences preserve string storage, while `flush()` returns false because the
host cannot confirm a blocking durable commit.

```ts
import { clipboard, random, authSession } from '@octane-xplat/platform'

const copied = await clipboard.writeText('Packing list')
if (random.supported) {
  const nonce = random.bytes(16)
}
// Windows hosted authentication remains unavailable.
const canSignIn = authSession.supported
```

Windows compilation, OS behavior, accessibility and packaging remain unverified
for these candidates.
[Windows support status](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md)

### Drag with the mouse on native Windows

The experimental Windows target now delivers cumulative mouse movement to
`onPan`, including release outside the control and cancellation when capture
is lost. Existing numeric Slider dragging uses the same path.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function DragArea() {
  return <View onPan={({ state, dx, dy }) => console.log(state, dx, dy)}>
    <Text>Drag here</Text>
  </View>
}
```

Packaged x64 checks cover mouse input. Touch, pen, velocity and the complete
Slider contract remain open. See the [Windows mouse-dragging boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#mouse-dragging).

### Use native connectivity for Windows query clients

Experimental Windows query clients now select the NativeScript environment
instead of the browser adapter. Network availability follows the WinRT connection
level, so an unknown transport no longer implies offline state. App activity
uses suspension and window visibility. App reconnect delivery and lifecycle
refresh still need runtime qualification.

```ts
import { createQueryClient } from '@octane-xplat/ui/data'

const queries = createQueryClient({ namespace: 'travel' })
```

[Query lifecycle](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/data.md#the-shared-query-cache)

### Choose exclusive settings on native Windows

The experimental Windows RadioList now uses native radio input with the shared
row design. Options and child items support caller-owned selection, disabled
choices and read-only groups.

```tsx
import { RadioList } from '@octane-xplat/ui'

export function DeliveryMethod() {
  return <RadioList ariaLabel="Delivery" defaultValue="email"
    options={[{ value: 'email', label: 'Email' }, { value: 'sms', label: 'Text message' }]} />
}
```

See the [Windows radio qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#radio-choices).

### Add experimental native Windows credential storage

Packaged Windows apps have a Credential Locker adapter for session strings,
scoped by package family. It preserves empty values and distinguishes missing
keys from read failures, with sanitized errors and no plaintext fallback.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

async function rememberSession(token: string) {
  if (!secureStorage.supported || !(await secureStorage.isAvailable())) return false
  return secureStorage.set('session-token', token)
}
```

Standalone x64 vault operations passed using task namespaces. Real package
identity, cross-launch persistence and app integration remain unqualified.
Windows/account policy can roam entries; package namespaces do not isolate
credentials from other desktop apps. See the
[Windows boundary](https://github.com/octane-xplat/octane-xplat/blob/main/packages/secure-storage/README.md#experimental-native-windows)
and Microsoft's [Credential Locker guide](https://learn.microsoft.com/en-us/windows/apps/develop/security/credential-locker).

### Switch segments with the keyboard on native Windows

The experimental Windows SegmentedControl now uses native radio input for each
segment. Arrow keys, Tab, pointer and screen-reader selection all work, including
icon-only segments, read-only controls and disabled segments.

```tsx
import { SegmentedControl } from '@octane-xplat/ui'

export function ViewMode() {
  return <SegmentedControl ariaLabel="View" defaultValue="list"
    options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]} />
}
```

See the [Windows segmented-control boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#segmented-choices).

### Adjust values and ranges on native Windows

The experimental Windows Slider now uses native keyboard and value automation
input with the shared track and thumb design. It supports local defaults,
controlled values, two-thumb ranges, steps, marks and formatted readouts.

```tsx
import { Slider } from '@octane-xplat/ui'

export function PlaybackRange() {
  return <Slider label="Playback range" defaultValue={[20, 80]} step={5}
    valueDisplay="tooltip" formatValue={(value) => `${value}%`} />
}
```

Read-only controls reject changes, but the native automation read-only flag
remains incomplete. See the [Windows Slider qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#slider-input).

### Use the shared Switch with a Windows keyboard

The experimental native Windows `Switch` now accepts Tab/Space, pointer input
and Windows toggle automation while keeping the shared track and thumb.
Controlled and uncontrolled state use the existing API.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Notifications() {
  return <Switch label="Notifications" defaultValue={false} />
}
```

Packaged x64 checks cover common input and state flows. Screen-reader and visual
parity checks remain open. See the [Windows qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#switch-input).

## [tsrx-typegen 0.5.0](https://github.com/octane-xplat/octane-xplat/releases/tag/tsrx-typegen-v0.5.0) - 2026-10-31

### Declaration generation no longer type-checks

**Breaking change:** `tsrx-typegen` now emits each file's declarations directly
with `isolatedDeclarations` instead of running a full `tsc` program. Generation
for a large component library now fits in a 128 MB heap. Sources must satisfy
isolatedDeclarations — every exported function, method, variable, and object
with shorthand properties needs an explicit type annotation — and TypeScript
5.5 or newer is required. `tsrx-typegen` reports each missing annotation as
`file(line,col): error TS9xxx`; add the annotation or map the generated file
through `overrides` for signatures you keep handwritten. Type errors are no
longer reported here — run your `typecheck` task separately.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import type { JSX } from '@octane-xplat/jsx/jsx-runtime'
export function Button(props: ButtonProps): JSX.Element @{
	// ...
}
```

[tsrx-typegen documentation](https://github.com/octane-xplat/octane-xplat/blob/main/packages/tsrx-typegen/README.md)

## [Octane Xplat 0.18.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.18.0) - 2026-10-28

### New package: `@octane-xplat/ads`

Google AdMob banners, interstitials, and rewarded ads via
`@nativescript/google-mobile-ads` — `ads.initialize()`, a `<BannerAd>` view,
and `createInterstitial/Rewarded/RewardedInterstitial` factories with a
normalized `AdEvent` channel. AppOpen is a documented upstream gap.

### The default theme is now Astryx's palette and control geometry

`chrome.css` adopts Astryx's default light/dark palette — blue primary
(`#0064E0` light / `#2694FE` dark) replacing the black scheme — plus its
`-apple-system` font stack, and `tokens.css` gives Button real geometry:
28/32/36px heights, 8px/12px padding, 8px radius, 14px/500/20px labels that
truncate with an ellipsis instead of overflowing.

```css
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
// Buttons now render 32px tall, blue primary, label weight 500.
```

**Breaking change:** every component's default colors and Button's default
size, typography, and label truncation change in both light and dark modes.
Apps that want the old look must pin the previous token values in their own
stylesheet.

[Styling tokens](https://octane-xplat.dev/app/styling/)

### New package: `@octane-xplat/background-tasks`

OS-scheduled periodic work via a custom bridge — `defineTask` at module
scope (the OS can invoke on cold start), `register({minimumInterval})`,
`unregister`, `getStatus`. iOS `BGTaskScheduler`, Android WorkManager. The
OS picks the real cadence; web/desktop report `supported: false`.

### Bamboo utilities accept every UI theme token

`@octane-xplat/bamboo` utilities now accept every design token the shared UI
theme defines — colors like `warning`, `border`, and the `syntax-*` palette,
plus the `container` radius — instead of the previous short list. Token names
are the theme's CSS variables without the prefix, so values come from
`@octane-xplat/ui/theme/chrome.css` or your own `:root, .ns-root` definitions.

```ts
css({ color: 'warning', borderColor: 'border', borderRadius: 'container' })
```

[Styling](https://octane-xplat.dev/app/styling/)

### New package: `@octane-xplat/barcode-scanner`

Barcode and QR decoding — `<BarcodeScanner>` live view (ML Kit on
iOS/Android, `BarcodeDetector` on web) plus `barcodeScanner.scanImage()` for
still images. Decode-only identity: capture stays in `@octane-xplat/camera`.

```tsx
<BarcodeScanner formats={['qr']} onCodeScanned={({ data }) => open(data)} />
```

Camera permission goes through `barcodeScanner.ensure()` (the `'camera'`
permission kind).

### New package: `@octane-xplat/billing`

In-app purchases and subscriptions via `@nativescript/payments` (StoreKit 2 +
Play Billing) — product fetch, purchase events, transaction finish, restore,
subscription management.

```ts
billing.connect()
billing.onPurchase(async (purchases) => { /* grant + finishTransaction */ })
await billing.requestPurchase('com.app.pro')
```

Web/desktop report `supported: false`.

### Button is a real `<button>` on web

`Button` now renders a native `<button type="button">` instead of
`div[role="button"]`, gaining built-in focus, Enter/Space activation, and the
`disabled` attribute. A `Button` with both `tooltip` and `isDisabled` uses
`aria-disabled` and stays focusable so the tooltip remains reachable. Other
`Pressable`-based controls still render divs.

```tsx
<Button label="Save" clickAction={save} />
// <button type="button" class="vx-pressable vx-button …">
```

**Breaking change:** selectors and tests that target `div.vx-button` or rely
on `tabindex`/`role="button"` must be updated to the `button` element.

[Button](https://octane-xplat.dev/app/components/)

### New package: `@octane-xplat/calendar`

Device calendar via a custom EventKit/CalendarContract bridge —
`getCalendars`, `getEvents(start, end)`, `createEvent`, `updateEvent`,
`deleteEvent`, and the `'calendar'` permission kind. Web/desktop report
`supported: false`.

### Optional capabilities are flat services

Every optional capability — `secureStorage`, `notifications`, `geolocation`,
`biometrics`, `haptics`, `authSession`, `openSettings`, `webAuthn` — is now a
flat service object instead of a `Capability` wrapper. `ensure()` splits into
`getPermissions()` (reads, never prompts) and `requestPermissions()` (may
prompt), both resolving `{status, granted, canAskAgain}` with
`'granted' | 'denied' | 'undetermined' | 'unsupported'` statuses; `supported`
and `isAvailable()` report presence, and calling a method while unsupported
rejects `UnavailabilityError` from `@octane-xplat/lib/capability`.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

// Before: (await secureStorage.ensure()) === 'granted' && secureStorage.impl!.set(...)
// Now:
if (secureStorage.supported) {
	await secureStorage.set('session-token', token)
}
```

**Breaking change:** `.ensure()` and `.impl` are gone. Check `supported` or
`isAvailable()` before calling methods; use the permissions pair where a
runtime permission gates the feature. `permissions.ensure(kind)` is now
`permissions.getPermissions(kind)` / `permissions.requestPermissions(kind)`.

[Using device features](https://octane-xplat.goddardai.org/platform-services/)

### Show labels and list rows for checkbox lists

`CheckboxList` (`CheckboxGroup`) now renders its options as a real list and adopts Astryx's field chrome:

- A standalone `CheckboxList` renders its `label`, `description`, `status`, and required/optional markers through the shared field wrapper — previously only the option rows rendered.
- Options render as `<ul>`/`<li>` list items (via `List`/`ListItem`), so row density, dividers, and semantics match `List`. New `density` and `hasDividers` props are passed through; `density="compact"` renders small checkboxes.
- Clicking anywhere on a row toggles its option, matching Astryx.
- The group's accessible name now comes from its visible label element (`role="group"` + `aria-labelledby`).

[Input components](https://octane-xplat.goddardai.org/components#inputs)

### CheckboxInput renders a native checkbox input

On web, `CheckboxInput` now follows Astryx's checkbox. It renders a real `<input type="checkbox">` under the drawn box, with the label and description beside it and the status message in a tinted box below. The mixed state uses the input's `indeterminate` property instead of `aria-checked="mixed"`. The checked mark is now Astryx's check icon.

If your tests or CSS select `.vx-checkbox-row[role="checkbox"]` or check `aria-checked`, select `input[type="checkbox"]` and read `checked`/`indeterminate` instead.

### Color picker suite in `@octane-xplat/ui`

`ColorPicker` composes a saturation/brightness `ColorArea`, a hue `ColorSlider`,
a `ColorSwatch`, and a `ColorField` around one shared color state — the React
Aria counterparts, self-drawn so the shared layout holds across targets.
Values are hex strings: input accepts `'#rrggbb'`, `'#rgb'`, and a missing
`'#'`; output is always lowercase `'#rrggbb'`.

```tsx
import { useState } from 'octane'
import { ColorPicker } from '@octane-xplat/ui'

function FavoriteColor() {
	const [color, setColor] = useState('#4488ff')
	return <ColorPicker value={color} onChange={setColor} />
}
```

Limits for this release: `ColorSlider` supports only the `hue` channel, there is
no alpha channel, drags adjust by delta (no tap-to-position), and `ColorPicker`
has a fixed layout rather than React Aria's children composition.

### New package: `@octane-xplat/contacts`

Device address book — read and basic write through `@nativescript/contacts`
on iOS/Android, Contact Picker API on web.

```ts
import { contacts } from '@octane-xplat/contacts'

if ((await contacts.ensure()) === 'granted') {
	const people = await contacts.getAll({ sort: 'lastName' })
}
```

Web is picker-shaped (per-call user selection, read-only). `getById` is
iOS-direct; on Android it filters a full fetch.

### Dev actions can navigate to their screen first

Declared development actions can now carry a `route`: when invoked while their
owning screen is not mounted, the app navigates to the URL itself, waits for
the screen's handler to attach, then runs the action. Generated routes also
register a built-in `xplat.navigate` dev action in development builds, and the
actions listing reports each instance's current `location` — agents no longer
need to know your route structure to reach screen-owned actions.

```ts
import { defineDevAction } from '@octane-xplat/platform/dev-actions'

export const saveDraft = defineDevAction({
	id: 'form.save-draft',
	title: 'Save form draft',
	description: 'Persists the checkout form state that only exists in the screen.',
	effects: { summary: 'Writes the form draft', appState: true },
	route: '/checkout',
})
```

[Development actions guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/testing/development-actions.md#reach-screen-owned-actions-by-route)

### DropdownMenu takes a `button` prop and renders a real button

`DropdownMenu` now accepts `button` — the shared `Button` props minus the press
handler — so the trigger renders as a real `<button>` on web with correct
`aria-haspopup="menu"`/`aria-expanded`/`disabled` semantics. New `menuWidth`
sets the popover's minimum width (defaulting to the trigger width), and
`hasChevron={false}` drops the trailing chevron that labelled triggers get by
default.

```tsx
<DropdownMenu
	button={{ label: 'Theme', icon: <Icon name="palette" />, variant: 'ghost', size: 'sm', isIconOnly: true }}
	menuWidth={160}
	items={[{ type: 'action', key: 'neutral', label: 'Neutral', onSelect: pick }]}
/>
```

**Breaking change:** `trigger`, `triggerClassName`, `accessibilityLabel`, and
`size` were removed from `DropdownMenuProps`. Pass the trigger as
`button={{ label, icon, variant, size, isIconOnly, … }}` instead. Icon-only
buttons are now square at the size's element height (28/32/36px) instead of a
fixed 36px minimum. `ContextMenu` keeps its own `trigger`/`accessibilityLabel`/
`size`.

[DropdownMenu](https://octane-xplat.dev/app/components/)

### New package: `@octane-xplat/firebase-analytics`

Firebase Analytics — `logEvent`, user id/properties, screen views, collection
toggle, and the small predefined-event helpers, mirroring
`@react-native-firebase/analytics`. Shares the firebase-core bootstrap with
`push`/`firebase-crashlytics`; web needs `init(config)`.

### New package: `@octane-xplat/firebase-crashlytics`

Firebase Crashlytics — `log`, `recordError`, user/attribute context,
unsent-report controls on iOS/Android. No Crashlytics SDK exists for
web/desktop — the leaf reports `supported: false` there (route those errors
to `sentry` or `posthog`).

### New package: `@octane-xplat/geofencing`

Region enter/exit monitoring via a custom bridge — `startMonitoring(regions)`,
`onRegionEvent` with buffered suspended-delivery replay, and the
`'location-always'` permission kind (iOS Always, Android background
location). iOS caps at 20 regions.

### Layers and overlay contracts

New public APIs in `@octane-xplat/ui` matching the Astryx layer surface:

- `LayerProvider` + `LayerContext`/`useLayerContext` + `LayerToastConfig` — root-mounted toast policy (`position`, `maxVisible`, `inset`); nested providers pass through.
- `usePopover` — headless popover: `triggerRef`/`triggerProps`, `show`/`hide`/`toggle`, `render(children, position)` over `useLayer`.
- `useTooltip` — headless tooltip: `ref`/`positionRef`/`interactionRef`, `describedBy`, `renderTooltip`. Touch targets bind refs but never mount the hint (matches `Tooltip`).
- `useMediaQuery` — web `matchMedia`; iOS/Android evaluate a restricted grammar (`(max|min)-(width|height)`, `pointer`, `hover`, `orientation`, `and`/`or`/`,`/`not`) against the main screen.
- `DropdownMenu`/`ContextMenu` accept `presentation: 'popover' | 'bottom-sheet' | 'adaptive'` and `label`; menu item data gains `description` and `variant: 'destructive'`.
- `useImperativeDialog(defaults)` merges default `DialogOptions` into every `show`.

### Layout, LayoutHeader, and LayoutContent land from Astryx

`@octane-xplat/ui` now ships Astryx's five-slot region primitive: `Layout`
arranges `header`, `start`, `content`, `end`, and `footer` slots;
`LayoutHeader` adds a padded header band with an optional `hasDivider`
hairline; `LayoutContent` is the scrollable main region. `padding` on the
layout sets the outer-edge padding regions read as their boundary defaults,
and `contentWidth` constrains the aligned content lane.

```tsx
<Layout
	header={
		<LayoutHeader hasDivider padding={6}>
			<Heading level={1}>Page title</Heading>
		</LayoutHeader>
	}
	content={<LayoutContent padding={6}>{body}</LayoutContent>}
/>
```

Padded hosts now publish the Astryx `--container-padding-*` custom
properties so full-bleed children (TabList `isFullBleed`, `Section`,
`ListItem edgeCompensation`) can escape to the container edge — previously
internal `--vx-container-padding-*` reads moved to the upstream names.

[Components](https://octane-xplat.dev/app/components/)

### Load route code when it is needed

Generated file routes now load their screen modules during navigation. Use
`router.preload` to warm a destination's code earlier; guards and loaders still
run during navigation. Layouts, Markdown and explicitly imported programmatic
routes remain eager. Whether this creates separate files depends on the platform's bundler.

```ts
import { router } from '@octane-xplat/ui/routing'

const destination = { to: '/products/:id', params: { id: 'hat' } } as const
await router.preload(destination)
await router.push(destination)
```

**Breaking change:** generated route modules no longer run their top-level code
at startup. Move required startup work into your application entry, and regenerate
route files with the updated CLI. Manifest inspection leaves unloaded callback
information unknown instead of importing a route to inspect it.

[Route preloading guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/navigation.md#warm-a-screen-before-opening-it)

### LinkProvider + useLinkComponent: swap link elements for a whole subtree

`LinkProvider` sets the default link component for every link-capable
component beneath it — `Link`, `NavLink`, `SideNav`, `TopNav`, `TabList`,
`Breadcrumbs`, and `TreeList` rows with `href`. Point it at your router's
link once and navigation lands through your framework instead of full page
loads. A per-component `as` prop still wins, and injected components receive
`to={href}` so React Router-style links work next to `href` readers.
Destinations pass through `isSafeDestination` before reaching the injected
component — an unsafe URL renders an inert anchor rather than invoking the
router.

```tsx
import { LinkProvider } from '@octane-xplat/ui'
import { RouterLink } from './router'

<LinkProvider component={RouterLink}>
	<SideNav items={items} />
</LinkProvider>
```

[Routing](https://octane-xplat.dev/app/routing/)

### `WebSocket` is available in the macOS AppKit host

Apps running on the macOS JavaScriptCore host can now use the standard
`WebSocket` global — the same API web and iOS provide — for `ws:` and
`wss:` URLs. It supports subprotocol negotiation, text and binary
(`ArrayBuffer`) messages, and `open`/`message`/`error`/`close` events with
real close codes, backed by `NSURLSessionWebSocketTask`.

```ts
const socket = new WebSocket('ws://localhost:8080')
socket.onmessage = (event) => console.log(event.data)
socket.send('hello')
```

`binaryType` stays `'arraybuffer'`; received binary messages deliver
`ArrayBuffer` values.

[macOS host documentation](https://octane-xplat.goddardai.org/macos-native)

### Ship a prebuilt dynamic library in a macOS leaf

A macOS package can now ship an already-compiled dynamic library instead of
native sources. Declare `prebuiltLibraries` (and optionally a `notices`
license file) in `xplat.macos` — `xplat dev` loads the library before app
code and `xplat build` copies it into `Contents/Frameworks` and signs it
with the app. A prebuilt-only leaf needs no compilation toolchain.

```json
{
	"xplat": {
		"macos": {
			"prebuiltLibraries": ["platforms/macos/prebuilt/libengine.dylib"],
			"notices": "platforms/macos/licenses/engine.txt"
		}
	}
}
```

[macOS native packages documentation](https://octane-xplat.goddardai.org/macos-native)

### The macOS renderer applies your stylesheets

Apps built with `xplatMacOS` now style their AppKit views from CSS. Before,
the renderer only recognized a small built-in list of class names. Import CSS
from your entry module, as on iOS and Android, and `className` selectors,
theme tokens, and Bamboo utilities apply to your views.

```ts
// src/styles.ts, imported by the macOS entry
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import 'virtual:bamboo.css'
import './app.css'
```

Matching rules follow NativeScript, so a class means the same thing on all
three platforms. For CSS built at runtime, call `registerStylesheet(id, css)`
from `@octane-xplat/macos-renderer`. Only `:disabled` responds to state for
now, and animations are not played.

**Breaking change:** the built-in class names (`text-sm`, `gap-2`,
`bg-primary`, `vx-*`, and similar) no longer style anything unless your app
imports the stylesheets that define them.

[Styling](https://octane-xplat.dev/app/styling/)

### New package: `@octane-xplat/maps`

Declarative `<MapView>` — Google Maps on iOS/Android/web via
`@nativescript/google-maps` and the Maps JS API: camera, declarative markers,
polylines, polygons, circles, tap and camera events, `animateCamera`/
`snapshot` handle.

```tsx
<MapView
	cameraPosition={{ coordinates: { latitude: 35.68, longitude: 139.69 }, zoom: 12 }}
	markers={[{ coordinates: { latitude: 35.68, longitude: 139.69 }, title: 'Hotel' }]}
/>
```

Web requires `maps.init({ apiKey })`; native keys come from app metadata.
macOS/Windows render an unsupported stub.

### Rich Markdown and streamed assistant text

Markdown now renders tables, task markers, strikethrough, source citations and
syntax-highlighted code. Compact spacing and shifted heading levels fit chat
responses. `useStreamingText` smooths cumulative text and settles immediately
when streaming ends or the browser requests reduced motion.

```tsx
import { Markdown, useStreamingText } from '@octane-xplat/ui/markdown'

export function Response({ text, streaming }: { text: string; streaming: boolean }) {
	const displayed = useStreamingText(text, streaming, { speed: 'fast' })
	return <Markdown text={displayed} isStreaming={streaming} density="compact" headingLevelStart={3} />
}
```

[Content display guide](https://octane-xplat.goddardai.org/app/content-display#markdown-documents)

### Mason core is the only mobile layout engine

iOS and Android apps now always build with `@octane-xplat/nativescript-mason-core`,
which provides Mason layout containers, scrolling, styling, and safe-area `env()`
resolution without MasonKit's HTML elements or widgets. The engine is selected
by platform, not by dependency choice, and `xplatNative` resolves the renderer's
existing imports to the installed core package.

**Breaking change:** `@octane-xplat/nativescript-masonkit` and
`@triniwiz/nativescript-masonkit` are no longer supported on mobile. Run
`pnpm dlx @octane-xplat/cli@latest upgrade` to replace their pins with the core
catalog entry; doctor and the bundler reject replaced pins until upgraded.
Windows preview apps keep full MasonKit — core ships no Windows artifacts yet.

```json
{
	"dependencies": {
		"@octane-xplat/nativescript-mason-core": "catalog:xplat"
	}
}
```

### Adapt photo controls and reveal row actions

Web apps can sample image luminance with `useImageMode` and reveal secondary
row controls with `useContainerReveal`. Image sampling uses your fallback while
loading or on failure; native hosts return that fallback without sampling.

```tsx
import { Text, useImageMode } from '@octane-xplat/ui'

export function PhotoMode(props: { src: string }) {
  const mode = useImageMode(props.src, { fallback: 'dark' })
  return <Text>{mode}</Text>
}
```

[Media contrast and row actions](https://octane-xplat.goddardai.org/app/components#media-contrast-and-row-actions)

### New package: `@octane-xplat/posthog`

PostHog analytics + feature flags — `posthog-js-lite` on iOS/Android
(persisted via `ApplicationSettings`), `posthog-js` on web.

```ts
posthog.init({ apiKey: POSTHOG_KEY })
posthog.capture('checkout_started', { items: 3 })
posthog.isFeatureEnabled('new-paywall')
```

### New package: `@octane-xplat/sentry`

Sentry errors, breadcrumbs, user context, and performance options —
`@nativescript-community/sentry` on iOS/Android, `@sentry/browser` on web.

```ts
sentry.init({ dsn: SENTRY_DSN })
sentry.captureException(error, { orderId })
```

### SideNav now matches the Astryx sidebar

`SideNav`, `SideNavHeading`, `SideNavSection`, `SideNavItem`, and
`SideNavCollapseButton` pick up the Astryx 0.6.4 chrome on web: 32px pill
item rows on the label type scale (14px, 20px line), `--color-neutral`
selected fills at weight 500, secondary icon and section-title colors,
sticky top/bottom zones with Astryx spacing, hover/pressed overlays, focus
rings, and theme-driven radius/element-size vars on all platforms.
`SideNavCollapseButton` resolves its size from the size cascade (footer
`sm`) like upstream.

Labels also follow Astryx: the rail button is "Collapse sidebar"/"Expand
sidebar", item child toggles read "Collapse {label}"/"Expand {label}", and
the heading menu button is "Open menu". A collapsible item without its own
action now toggles children on press with an inline chevron, icon-less
items drop out of the collapsed rail, and the collapsed rail is 48px.

**Breaking change:** default colors, spacing, and typography of every
SideNav surface change in light and dark mode, and the sticky top/bottom
borders are gone. Apps that pinned the old look should carry the values in
their own stylesheet.

[SideNav](https://octane-xplat.dev/app/navigation/)

### New package: `@octane-xplat/store-review`

The OS "rate this app" prompt — `SKStoreReviewController` on iOS and macOS,
Play In-App Review on Android. `requestReview()` is fire-and-forget (both
stores throttle and report no outcome); `storeUrl()` builds a store-page link
from configured ids.

```ts
import { storeReview } from '@octane-xplat/store-review'

storeReview.configure({ iosAppStoreId: '123456789' })
if (await storeReview.isAvailable()) await storeReview.requestReview()
```

Web, Linux, and Windows report `supported: false`. On Android the in-app
review flow only exists for Play-installed builds — `isAvailable()` reflects
that.

### Change Selector and Pagination language within a screen

`InternationalizationProvider` scopes static UI strings and direction to a
subtree. French strings, sparse overrides, and RTL pagination chevrons are
available without changing the app's global locale.

```tsx
import { InternationalizationProvider, Selector, frFR } from '@octane-xplat/ui'

<InternationalizationProvider locale="fr-FR" messages={{ 'fr-FR': frFR }}>
  <Selector label="Region" options={[]} />
</InternationalizationProvider>
```

`useAnnounce()` exposes polite/assertive web live regions and native platform
announcements. Web pagination previous/next controls now accept Enter and Space.
Native announcements do not support politeness or explicit clearing; actual
assistive-technology delivery requires host verification. See the
[localization guide](https://octane-xplat.goddardai.org/app/localization/).

### Switch renders a native input on web

On web, `Switch` now follows Astryx's switch. It renders a real `<input type="checkbox" role="switch">` over the drawn track, with the label and description beside it and the status message below. A loading switch shows a spinner in the thumb and announces "Loading" to screen readers. On every platform, the track is now Astryx's size (40×24, or 32×20 for `size="sm"`), and the thumb grows when the switch is on.

If your tests select `.vx-switch[role="switch"]` or check `aria-checked`, select `input[role="switch"]` and read `checked` instead. `testID` now lands on the switch's outer element, as it does in Astryx.

### Table becomes a data-driven component with a plugin pipeline

`Table` now follows Astryx's contract — a breaking change from the earlier `columns`/`rows` grid:

- **Data mode**: pass `data` + `columns` (`TableColumn` with `header`, `proportional()`/`pixel()` widths, `align`, `sortable`, `resizable`, `filter`, `renderCell`) plus `idKey`. `density`, `dividers`, `isStriped`, `hasHover`, `verticalAlign`, `textOverflow`, `emptyState`, and `aria-rowindex` support are built in.
- **Children mode**: compose `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableCell`, and `TableHeaderCell` directly — they read styling from the table's context.
- **Plugins**: `plugins={{ sort, selection, pagination, ... }}` runs a transform pipeline. Ten flat-table hooks ship with it: `useTableSelectionState`/`useTableSelection`, `useTableSortableState`/`useTableSortable`, `useTablePagination` (+ `paginateData`), `useTableColumnSettingsState`/`useTableColumnSettings`, `useTableColumnResize`, and `useTableFilterState`/`useTableFiltering` (+ `toSearchFilters` bridging to `PowerSearchConfig`).
- **`TableSelectionToolbar`** renders the selection-aware bulk-action surface above a table.
- Column sizing helpers `proportional`, `generateColumns`, `resolveColumnWidths`, `defaultCellRenderer`, and `DEFAULT_MIN_COLUMN_WIDTH` are public; `pixel` is shared with the resizable-size DSL (same `{type:'pixel', value}` shape).

The old `rows`/`label`/`width: number`/`onRowPress` API is removed. Interactive column resizing currently lands its drag/keyboard separator on web; native leaves apply `columnWidths` overrides without the handle.

[Table](https://octane-xplat.goddardai.org/components#table)

### Group, expand, and number table rows

Table plugins now support collapsible groups, nested trees, row detail panels,
row numbers and labelled status markers. Sticky columns pin to the start or
end of a horizontally scrolling web table; native pinning remains unsupported.

```tsx
function ExampleTable() {
  const state = useTableTreeState({ data, idKey: 'id' })
  const tree = useTableTreeData({ ...state.treeConfig, hasExpandAllControl: true })
  return <Table data={state.visibleData} columns={columns} idKey="id" plugins={{ tree }} />
}
```

[Group and expand table rows](https://octane-xplat.goddardai.org/tables)

### Text and Heading gain the Astryx type scale

`Text` now accepts the Astryx typography props: `type`
(`body`/`large`/`label`/`supporting`/`code`/`display-1`–`display-3`/`inherit`),
`size` (`4xs`–`4xl`), `color`
(`primary`/`secondary`/`disabled`/`placeholder`/`accent`/`inherit`), `weight`
(`normal`/`medium`/`semibold`/`bold`), and `maxLines` for ellipsis truncation.
`Heading` applies the Astryx `--text-heading-*` scale per `level` and accepts
`type` (display scale), `color`, `weight`, and `maxLines`.

```tsx
<Text type="body" size="sm" color="secondary" maxLines={2}>{summary}</Text>
<Heading level={1}>Page title</Heading>
<Heading level={3} maxLines={1}>Card title</Heading>
```

**Breaking change:** `Text`'s `numberOfLines` and `ellipsize` props are
removed — `maxLines` replaces both (1 = single-line ellipsis, >1 =
line-clamp). `Heading` now renders the Astryx type scale (h1 24px/600,
h2 20px/600, h3 17px, …) instead of browser heading defaults, and a bare
`Text` still inherits ambient typography — xplat diverges from Astryx's
`type="body"` default deliberately, since `Text` is the shared text host
every component composes. Pass `type="body"` for the upstream default.

### TextInput shows its own field chrome

A standalone `TextInput` now shows its own label, description and status message, like Astryx's text input. Before, `label` only set the accessible name, and you needed a `Field` around the input to see any of it. Inside a `Field`, nothing changes: the `Field` still draws those parts.

```tsx
<TextInput label="Email" description="We never share it" status={{ type: 'error', message: 'Enter a valid email' }} />
```

On web, the status message is announced through a page-level screen-reader region instead of an inline `role="alert"` element.

### Switches and checkboxes support changeAction

`Switch` and `CheckboxInput` now support Astryx's `changeAction` — an async callback that runs after `onChange`. While it runs the control shows its loading state; a rejection reverts the toggle and reports the previous value through `onChange` again. `Switch` also gains Astryx's `labelPosition="start"` (label before the track) and `labelSpacing="spread"` (label pushed to the field's opposite edge).

```tsx
<Switch label="Email updates" value={on} onChange={setOn} changeAction={savePreference} labelSpacing="spread" />
```

### Toggle controls adopt Astryx prop names

`Switch`, `CheckboxInput`, `UISwitch`, and `MaterialSwitch` now use Astryx's prop names. `checked` is now `value`, `defaultChecked` is now `defaultValue`, and `onCheckedChange` is now `onChange`. On `CheckboxInput`, the `indeterminate` flag is folded into `value`: pass `value="indeterminate"` instead of `indeterminate`.

```tsx
// before
<Switch checked={on} onCheckedChange={setOn} />
<CheckboxInput checked={ok} indeterminate={mixed} onCheckedChange={setOk} />

// after
<Switch value={on} onChange={setOn} />
<CheckboxInput value={mixed ? 'indeterminate' : ok} onChange={setOk} />
```

### New package: `@octane-xplat/web-browser`

Open external links *inside* the app — `SFSafariViewController` on iOS, Chrome
Custom Tabs on Android. Distinct from `platform`'s `authSession` (OAuth
callback interception) and `<WebView>` (embedded content the app controls).

```ts
import { webBrowser } from '@octane-xplat/web-browser'

await webBrowser.openBrowser('https://docs.example.com', {
	toolbarColor: '#1a1a1a',
	showTitle: true,
})
```

Web falls back to `window.open`; macOS delegates to the external browser.
`warmUp`/`coolDown`/`mayInitWithUrl` pre-warm Android's Custom Tabs service.

### Serve routes as HTML or static pages

The optional `@octane-xplat/web-host` package renders Web routes before they reach
the browser. Browser startup adopts that HTML without repeating initial loaders.
You can author the whole document as a component or use an HTML template. The
Fetch handler works with srvx; rendering stays separate from cross-platform route data.

```ts
import { createWebHandler } from '@octane-xplat/web-host/server'
import { catalog } from './routes.web.tsrx'

export const handle = createWebHandler({
  catalog,
  buildId: 'store-v1',
  assets: { scripts: ['/client.js'] },
  transfer: match => ({ data: match.data as { name: string }, context: {} }),
})
```

With `webHost()` installed in Vite, shared modules can expose named server-only
re-exports. Client builds remove them and reject remaining `.server` imports.

```ts
export { requestContext } from './context.server'
```

For public pages, export a `createWebRenderer` from your compiled server entry and
pass it to `prerender`. Content keys and renderer revisions control reuse; each
build still assembles current document assets and browser startup data.

```js
import { prerender } from '@octane-xplat/web-host/prerender'
import { renderer } from './dist/server/static.web.js'

await prerender(renderer, {
  origin: 'https://shop.example.com',
  outDir: 'dist/static',
  cacheFile: '.cache/pages.json',
  revision: 'renderer-v1',
  paths: [{ destination: { to: '/products/:id', params: { id: 'coat' } }, key: 'coat-v3' }],
})
```

[Web rendering and static page guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/web-rendering.md)

### One native workshop chrome; Linux renders with GTK, not WebKitGTK

The workshop chrome on iOS/Android, macOS, and Linux is now one Octane
component styled by one stylesheet, instead of three separately built
shells. Your story still runs in its own area of the window, so opening
panels or resizing the window never restarts it.

- **Linux (breaking)**: `xplat workshop dev --target linux` now draws the
  chrome and your stories with real GTK4 widgets through
  `@octane-xplat/linux-gtk` instead of a WebKitGTK web view. It needs `gjs`,
  GTK4, and the `@octane-xplat/linux-gtk` package, which is only available
  inside this repository for now. DOM stories still open with
  `--target web`.
- **Story file names (breaking)**: `.stories.linux.*` files are no longer
  part of the Linux workshop. Rename them to `.stories.gtk.*`; the workshop
  prints a reminder for each one it finds:

  ```sh
  git mv src/button.stories.linux.tsrx src/button.stories.gtk.tsrx
  ```

- **`@octane-xplat/workshop/macos` (breaking)**: the export is now
  `NativeWorkshopController` (it replaces `MacOSWorkshopController`), next
  to `createMacOSStageHost`:

  ```ts
  import { createMacOSStageHost, NativeWorkshopController } from '@octane-xplat/workshop/macos'
  ```

- **`@octane-xplat/ui` on GTK**: GTK bundles that import `@octane-xplat/ui`
  get `Text` and `Pressable` only. Other components are not checked on GTK
  yet.

[Component workshop](https://github.com/octane-xplat/octane-xplat/blob/main/packages/workshop/README.md) ·
[GTK renderer guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/linux-gtk.md)

## [Unreleased]

### Breaking Changes

- *(ui)* [**breaking**] `Slider` adopts the Astryx field contract: `value` is
  now `number | [number, number]` (range sliders emit a tuple),
  `onValueChange` receives the widened type, and `marks`/`formatValue`/
  `valueDisplay`/`step`/`min`/`max` replace the widget-style API
  (`minValue`/`maxValue` remain as deprecated aliases).
- *(ui)* [**breaking**] `FieldStatus` now names the status-row component; the
  status-shape type is re-exported as `FieldStatusInfo` in the shared barrels.

### Features

- *(ui)* Compositional list parts — `RadioListItem`, `CheckboxListItem`,
  `SegmentedControlItem`, `SelectorOption`, `Step` — read selection and
  position state from a group context instead of inspected children.
- *(ui)* `Select`/`MultiSelector` gain `presentation`
  (`popover`/`bottom-sheet`/`adaptive`), `variant="ghost"`, `renderOption`,
  `renderValue`, option icons, and multi-select badge triggers.
- *(ui)* `Stepper` accepts `Step` children plus `activeStep`, `onStepClick`,
  `orientation`, `indicatorPosition`, `horizontalOptions`; `FieldLabel` and
  the `FieldStatus` component export as standalone field chrome.
- *(ui)* `TextInput.startIcon`; `TextArea.startIcon`/`maxLength` live
  counter; `InputNumber` `units`/`formatValue`/`hasNumberSteppers`/`hasClear`.
- *(ui)* `useGridFocus` — roving roving-tabindex keyboard navigation for
  option grids (web; native is a signature-compatible no-op).

## [0.17.1] - 2026-10-23

### Bug Fixes

- *(native)* Preserve tab and list content across updates
- *(ui)* Size fixed mobile layers through CSS
- *(audio)* Ship the current Android command bridge

## [0.17.0] - 2026-10-23

### Breaking Changes

- *(ui)* [**breaking**] Replace ClassName with upstream ClassValue
- *(routing)* [**breaking**] Replace the routing API with a generated, typed router
- *(cli)* [**breaking**] Unify logs and native reports under diagnostics
- *(cli)* [**breaking**] Unify durable sessions and simplify launch selection
- *(scripts)* [**breaking**] Clarify task scope and remove duplicate work
- *(sqlite)* [**breaking**] Isolate asynchronous transaction ownership
- *(ui)* [**breaking**] Start Xplat-created native pages full-screen

### Features

- *(keyboard)* Synchronize host movement with keyboard transitions
- *(keyboard)* Track focused inputs and caret geometry
- *(keyboard)* Add focused-input-aware scrolling
- *(keyboard)* Add keyboard-sticky positioning
- *(chat)* Coordinate keyboard movement and message anchoring
- *(workshop)* Polish adaptive navigation and controls
- *(lint)* Detect routing migration mistakes
- *(create)* Teach canonical routing in the starter
- *(cli)* Retain development logs for agent reads
- *(platform)* Attach dev actions and effects from components
- *(dev-actions)* Return structured handler failures to agents
- *(dev-actions)* Resolve web failure stacks to source positions
- *(dev-actions)* Resolve NativeScript device stacks to source positions
- *(ui)* Keep the ChatLayout composer clear of the home indicator

### Bug Fixes

- *(ui)* Constrain native Screen width and preserve CSS Grid tracks
- *(keyboard)* Measure host overlap and avoid duplicate compensation
- *(keyboard)* Coordinate sheets and overlays with window avoidance
- *(keyboard)* Preserve Mason integration after rebase
- Finish migrating examples, tests, and docs off the removed layout tags
- *(camera,richtext,pager)* Repair style-only migration artifacts
- *(ui)* Allow classes to override native View direction
- *(cli)* Sync native prop resets and CSS cascade restoration
- *(cli)* Complete command discovery and contextual help
- *(ui)* Keep class name types compatible across renderers
- *(camera)* Admit onReady-triggered recording on Android (#35)
- *(cli)* Keep source-only deps out of the NativeScript HMR vendor bundle
- Publish JavaScript for Node-loaded configuration exports
- *(cli)* Allow installed linked source roots in native dev
- *(cli)* Discover native plugins in hook-linked workspaces
- *(native)* Keep class-sized Mason leaves and SVG ratios
- *(native)* Reach Mason's internal dirty setter on Android foreign leaves
- *(android)* Size width-only SVGs from their intrinsic ratio
- *(native)* Invalidate Mason layout for Android foreign leaves after style sync
- *(lib)* Emit route-pattern JavaScript during typegen
- *(bamboo)* Emit config JavaScript during typegen
- *(keyboard)* Align manifest with compatibility version
- *(ui)* Measure padded iOS LiquidGlass content inside its padding
- *(cli,lint,tsrx-typegen)* Run in-repo bins from source
- *(share)* Give the Android FileProvider a unique class name
- *(platform)* Find the dev-bridge token on NativeScript devices
- *(ui)* Load native images after the first layout, not after both axes (#36)
- *(ui)* Pick native srcset sources with one measured axis
- *(ui)* Request the post-load image layout on iOS only
- *(cli)* Retire released NativeScript Vite workarounds
- *(ui)* Drive native VirtualList through MasonKit's web scroll API
- *(native)* Use MasonKit's scroll API across native scroll consumers
- *(keyboard)* Treat MasonKit's Android scroller as a focus scroll owner
- *(ui)* Write native keyboard padding through MasonKit style
- *(ui)* Overlay the native ChatLayout dock in the scroller's grid cell
- *(ui)* Page the native Carousel on MasonKit
- *(ui)* Read MasonKit padding back as a Length when leasing it
- *(keyboard)* Scroll MasonKit's iOS scroller to the focused input
- *(shaders)* Patch shaders@4.0.0 regexes for ICU-less NativeScript V8
- *(ui)* Let classes override native component layout defaults
- *(cli)* Remove obsolete alien-signals native aliases
- *(ui)* Move web-inert native layout defaults into classes
- *(docs)* Fit articles and navigation on mobile
- *(cli)* Recognize aliased native default exports
- *(data)* Retire stale query cache operations
- *(auth)* Make sign-out supersede credential operations
- *(data)* Preserve collection integrity during updates
- *(ui)* Preserve modal ownership for child popovers
- *(routing)* Round-trip encoded static route segments
- *(ui)* Support keyboard operation of Slider
- *(cli)* Reject incomplete explicit build target selections
- *(cli)* Preserve shared native module identities during HMR
- *(auth)* Retire requests across hosted session changes
- *(recorder)* Keep web disposal terminal during startup
- *(files)* Reject native text write failures
- *(sqlite)* Await native version writes
- *(lingui)* Retain the latest locale activation
- *(lexical)* Normalize imported inline HTML at the root
- *(ui)* Keep fixed and custom layers inside their modal owner
- *(image)* Reset source ownership when the image host changes
- *(intersection-observer)* Subscribe to every view event
- *(motion)* Preserve translation when sampling web transforms
- *(lottie)* Read current playback intent when loading completes
- *(linux-gtk)* Include outer siblings in proxy child placement
- *(ui)* Avoid keyboard type cycles with platform suffixes
- *(ui)* Keep web bottom sheets within the viewport
- *(cli)* Enforce real-path boundaries for MCP code reads
- *(cli)* Preserve native plugin sources during clean
- *(workshop)* Confine asset reads to their real directory
- *(cli)* Preserve failed dev target exit statuses
- *(create)* Keep platform additions in the owning workspace
- *(image)* Align source selection before layout
- *(ui)* Mark full-screen page setup as mobile code
- *(macos)* Keep Mason layout in logical points during resize
- *(macos)* Resolve projected CSS placement before native layout

### Performance

- *(editors)* Build WKWebView documents without the Octane runtime

### Refactoring

- *(keyboard)* Centralize window state and subscription lifecycle
- *(ui)* Replace unnecessary as-any casts with typed helpers
- *(ui)* Narrow remaining as-any casts to typed reads
- *(ui)* Remove remaining unnecessary casts in primitives and tests

## [0.16.1] - 2026-10-20

### Bug Fixes

- *(ui)* Remeasure Android SVG after async source completion (#34)

## [0.16.0] - 2026-10-19

### Breaking Changes

- *(macos)* [**breaking**] All container intrinsics backed by Mason
- *(cli)* [**breaking**] Declare @triniwiz/nativescript-masonkit for octane apps
- *(leaves)* [**breaking**] Emit masonview + CSS props, drop layout aliases
- *(macos)* [**breaking**] Masonview is the only layout host intrinsic
- *(patch)* [**breaking**] Collapse mason registration to masonview + scrollview
- *(intrinsics)* [**breaking**] Masonview replaces the NS layout tag set
- *(ui)* [**breaking**] Emit mason style through the style prop via mergeStyle
- *(intrinsics)* [**breaking**] Masonview drops raw style keys
- *(patch)* [**breaking**] Style-only Mason keys + leaf-style routing
- *(macos)* [**breaking**] Style-only Mason keys on masonview
- *(leaves)* [**breaking**] Move mason style props into style
- *(ui)* [**breaking**] Move all intrinsic layout to the style channel
- *(packages)* [**breaking**] Leaf packages emit layout through style too
- *(driver)* [**breaking**] Remove the layout-prop channel from the octane patch
- *(macos)* [**breaking**] Style-only layout surface on the AppKit renderer
- *(jsx)* [**breaking**] Zero layout props on the shared intrinsic surface

### Features

- *(linux-gtk-renderer)* GTK4/GJS universal driver for native Linux widgets
- *(cli)* Register the .gtk platform suffix and xplatLinuxGtk preset
- *(linux-gtk-renderer)* Bind JSX surface to the shared @octane-xplat/jsx contract
- *(cli)* Add bundled lint command with optional fixes
- *(cli)* Manage framework dependency compatibility
- *(native)* Host custom-layout plugin containers in the octane driver patch
- *(macos)* Masonview backed by the Mason engine via mason-c
- *(macos)* @nativescript/core compat slice for plugin elements
- *(cli)* Register the GTK4/GJS runtime as a linux target
- *(create)* Keep app starters minimal with opt-in testing
- *(cli)* Resolve platform-specific CSS files
- *(cli)* Compile build-time platform CSS blocks
- *(bamboo)* Add build-time platform conditions
- *(cli)* Support comma-separated platform CSS targets
- *(native)* Container intrinsics backed by MasonKit on iOS/Android/Windows
- *(gtk)* Route style-bag layout keys into the Box shim
- *(gtk)* Bind mason-c via a GI typelib facade
- *(gtk)* Run masonview layout through the Mason engine

### Bug Fixes

- *(editors)* Use TypeScript browser asset build script
- *(linux-gtk-renderer)* Apply mount-time layout props and harden prop resets
- *(linux-gtk-renderer)* Reset layout/orientation props and resolve expand deep
- *(linux-gtk-renderer)* Write both expand axes when resolving flexGrow
- *(cli)* Use inlineDynamicImports for the single-file GJS bundle
- *(create)* Align scaffold JSX typing with shared facades
- *(create)* Raise Android template compile SDK to 36
- *(create)* Include app testing by default
- *(create)* Select DOM JSX types in starter web test
- *(cli)* Anchor native dev transforms to nested dependency files
- *(bamboo)* Reject unsupported platform configurations early
- *(cli)* Register virtual stylesheets in native dev and HMR
- *(patch)* Regenerate octane 0.2.5 patch with unified driver diff
- *(patch)* Resync lockfile hash and patch metadata after rebase
- *(lint)* Accept mason absolute positioning and sync the published rules copy
- *(leaves)* Route layout metadata through the style bag
- *(deps)* Unify @types/node pins to dedupe octane runtime copies
- *(tests)* Repair stale references and runner wiring
- *(tests)* Stop concurrent vite builds racing cli's dist during tests
- *(create)* Resolve scaffold/compatibility exports from source in-repo
- *(cli)* Only check the app-resolved copy in the compatibility scan
- *(patches)* Teach @nativescript/doctor to resolve pnpm catalog specifiers
- *(cli)* Define __WINDOWS__ in the native vite config
- *(patches)* Guard masonkit's iOS list delegate protocol binding
- *(testing)* Dispatch click alongside tap for MasonKit hosts

### Refactoring

- *(mcp)* Port the transport adapter to TypeScript
- *(cli,lint)* Port Node tooling source from .mjs to .ts
- *(toolchain)* Port remaining Node tooling from .mjs to .ts
- *(scripts,apps)* Port app-level Node tooling to .ts; unmark lint/create/tsrx-typegen
- *(linux-gtk-renderer)* Use @octane-xplat/jsx as the pragma source
- *(macos)* Element-behavior registry seam; masonview self-registers
- *(create)* Remove unreleased testing setup command
- *(macos)* Remove the classic layout engines

## [0.15.0] - 2026-10-18

### Breaking Changes

- *(ui)* [**breaking**] Honor field-state and accessibility props on platform switches
- *(ui)* [**breaking**] Give Button and menu states one spelling each
- *(ui)* [**breaking**] Align conditioned root exports and published CSS paths
- *(ui)* [**breaking**] Return typed handles from imperative overlay and window services
- *(ui)* [**breaking**] Require exclusive content sources and status-typed tool calls
- *(ui)* [**breaking**] Share keyed identity and selection across Table, TreeList, VirtualList
- *(ui)* [**breaking**] Separate store snapshots, mutations, and reactive reads
- *(ui)* [**breaking**] Give platform widgets matching type names
- *(ui)* [**breaking**] Name shared prop contracts and export matching types
- *(ui)* [**breaking**] Distinguish theme preference from resolved scheme, type styled variants and icon names
- *(table)* [**breaking**] Annotate DataGrid example row params for noImplicitAny
- *(ui)* [**breaking**] Reject duplicate route names with coded diagnostics
- *(ui)* [**breaking**] Expose typed scroll handles and preserve composed refs
- *(ui)* [**breaking**] Expose a single Markdown stream parser
- *(ui)* [**breaking**] Unify layout value space across platforms
- *(ui)* [**breaking**] Restore documented defaults when props are removed
- *(ui)* [**breaking**] Tighten public prop types
- *(ui)* [**breaking**] Move routing, data, markdown, and chat to purpose entrypoints
- *(ui)* [**breaking**] Scope search cancellation per request
- *(packages)* [**breaking**] Publish source with declaration entrypoints
- *(media)* [**breaking**] Return file handles only — drop PickedImage.dataUrl

### Features

- *(jsx)* Add @octane-xplat/jsx shared native type facade
- *(ui)* Restore portable query APIs and durable storage on macOS
- *(geolocation)* Support Core Location on native macOS
- *(motion)* Define bounded whole-word TextMorph semantics
- *(media)* Select images through the macOS file picker
- *(media)* Capture still photos in an app-owned macOS sheet
- *(audio)* Add safe macOS AVPlayer playback
- *(recorder)* Add safe macOS PCM WAV capture
- *(sounds)* Qualify bounded AppKit sound playback
- *(platform)* Add tagged keep-awake service and hook
- *(lib)* Extract internal shared class-name utility
- *(cli)* Version-pinned release docs retrieval for the MCP server
- *(mcp)* Shared MCP contracts for identity, capabilities, permissions, and evidence
- *(mcp)* Exact code retrieval and optional local semantic index for the MCP server
- *(mcp)* App-declared development-action registry (package G)
- *(mcp)* Runtime build/launch/logs/status across all six platforms
- *(ui)* Collection data hooks — useListData/useTreeData/useAsyncList
- *(lingui)* Locale utility hooks — useCollator/useListFormatter/useFilter
- *(ui)* Focus family — useFocus/useFocusRing/useFocusVisible/useFocusWithin/useLandmark + FocusScope
- *(ui)* GridList + useGridList — interactive 2D cell collection
- *(ui)* RA utility exports — mergeProps, useKeyboard, useObjectRef, useClipboard, refList/mergedRef, copyText
- *(mcp)* Connect installed-version documentation retrieval
- *(macos-renderer)* Implement shared StackLayout intrinsic
- *(mcp)* Qualify Chromium consumer inspection and input
- *(macos-renderer)* Implement ContentView single-child lifecycle
- *(mcp)* Qualify packed Chromium consumer over stdio
- *(workshop)* Add @octane-xplat/workshop dev package
- *(workshop)* Launch the Linux GTK/WebKitGTK host
- *(workshop)* Add unqualified iOS and Android preview adapters
- *(workshop)* Implement mobile Escape and Back dismissal contract
- *(workshop)* Qualify the macOS AppKit/JSC workshop target
- *(nano-icons)* Add shared-preparation icon leaf adapted from react-native-nano-icons
- *(mcp)* Make @octane-xplat/mcp publishable in the lockstep release
- *(camera)* Tap-to-focus via focusAtPoint and CameraView onTap (#24)
- *(nano-icons)* Replace SVG cache adapter with the font pipeline
- *(share)* Recover file sharing on current main
- *(platform)* Add storage.flush() with automatic suspend/exit durability
- *(ui)* Expose shared software keyboard inset hook
- *(toolchain)* Single combined tsconfig program per package/app with fixed platform-suffix order
- *(macos-renderer)* Implement DockLayout ordered edge layout
- *(macos-renderer)* Implement WrapLayout intrinsic with wrapping lifecycle
- *(ui)* Expose focus/outline capability contracts and split outline discovery
- *(ui)* Report async Button action failures via onActionError
- *(macos-renderer)* Implement viewless ProxyViewContainer projection
- *(cli)* Capture generated macOS SDK typings from objc-metadata-generator
- *(macos-renderer)* Switch AppKit typings to generated SDK declarations
- *(ui)* Unify controlled/initial/change roles across inputs and overlays
- *(ui)* Make field/menu/tab provider and accessibility composition explicit
- *(macos-renderer)* Implement raw RootLayout host
- *(macos-renderer)* Implement raw SearchBar host
- *(macos-renderer)* Implement viewless FormattedString intrinsic
- *(macos-renderer)* Implement HtmlView intrinsic
- *(macos-renderer)* Implement ActivityIndicator intrinsic
- *(macos-renderer)* Implement calendar-date DatePicker intrinsic
- *(macos-renderer)* Implement and qualify ListPicker intrinsic
- *(macos-renderer)* Implement and qualify Progress intrinsic
- *(macos-renderer)* Implement and qualify SegmentedBar intrinsic
- *(macos-renderer)* Implement and qualify SegmentedBarItem intrinsic
- *(macos-renderer)* Implement and qualify TimePicker intrinsic
- *(ui)* Expose awaitable async operations, cancellation, and pagination readiness
- *(macos-renderer)* Implement raw ListView intrinsic
- *(macos-renderer)* Implement raw tabview with logical item roots
- *(cli)* Agent-facing discovery and retrieval commands
- *(ui)* Add isolated query and icon registries
- *(ui)* Name render callback contexts
- *(ui)* Add serializable chat drafts, message data, and follow-latest
- *(ui)* Normalize interaction events and expose operation outcomes
- *(ui)* Expose focus and outline capabilities
- *(ui)* Discriminate selection and menu contracts
- *(create)* Add Octane Xplat library starter
- *(camera)* Prefer supported automatic iOS stabilization (#28)
- *(platform)* Expose platform-native types as explicit subpath modules
- *(platform)* Generate strict macOS SDK as module-scoped types and split runtime impl
- *(cli)* Agent-facing session and runtime commands via a per-workspace host
- *(ui)* Portalize native RootLayout overlays
- *(ui)* Preserve context through native portals
- *(macos-renderer)* Support Octane portals
- *(portals)* Preserve context across native hosts
- *(macos)* Portal raw tab and list content from its declaring tree
- *(ui)* Preserve context across owned services and native route boundaries
- *(cli)* Accept a positional target in xplat dev
- *(cli)* Resolve pnpm catalog: specifiers in patch version checks
- *(macos-renderer)* Remote image fetch and placeholder for <image>
- *(ui)* Port thumbhash encoder (rgbaToThumbHash) into hash-image
- *(ui)* Export thumbhash encoders from the package root
- *(ui)* ThumbHashUri — src → thumbhash per platform
- *(ui)* Align useClipboard with the Astryx clipboard lifecycle
- *(macos-renderer)* Implement raw Placeholder intrinsic
- *(ui)* Cascade container size to controls through SizeContext
- *(macos-renderer)* Implement raw ActionBar intrinsic
- *(macos-renderer)* Implement raw LiquidGlass intrinsic
- *(cli)* Add xplat fmt and hand spacing enforcement to the formatter
- *(create)* Add `format` script to scaffolded apps

### Bug Fixes

- *(platform)* Report and subscribe to native macOS connectivity
- *(biometrics)* Support Touch ID in macOS AppKit apps
- *(ui)* Restore macOS text control interaction parity
- *(richtext)* Apply leaf init once the Android native view exists
- *(jsx)* Restore cachedimage in the shared extension tag set
- *(ui)* Deliver AppKit press and swipe callbacks
- *(media)* Keep AppKit camera permission checks passive
- *(motion)* Isolate macOS package imports from mobile backends
- *(push)* Safely expose unavailable macOS backend
- *(ui)* Restore AppKit scroll viewport refs and geometry
- *(canvas)* Safely expose unsupported AppKit contexts
- *(motion)* Observe macOS reduced-motion preference
- *(motion)* Map AppKit opacity and transform channels
- *(pager)* Preserve page tracking and host updates
- *(notifications)* Guard delivery and preserve mobile notification content
- *(bamboo)* Validate portable config and native CSS adaptation
- *(auth)* Guard hosted and Google sign-in session races
- *(platform)* Close deep-link and host-protocol feedback gaps
- *(context-menu)* Close leaf lifecycle, dismissal, and packaging gaps
- *(gif,image)* Add windows gif stub and tighten the vendored prefetch batch
- *(haptics)* Align engine construction, web patterns, and play contracts
- *(image-crop)* Keep one active gesture and emit finite crops
- *(files)* Harden pick, read, and cleanup paths
- *(picker)* Align selection contract and web accessibility across leaves
- *(effects)* Close wrong-OS, lifecycle, availability, and drift gaps
- *(charts)* Tolerate bad data and colors; pick the nearest scatter point
- *(image)* Hold resolved sources, retarget layout listeners, guard decodes
- *(geolocation)* Add windows stub and clamp invalid accuracy
- *(date-picker)* Align day semantics, theming, and control across leaves
- *(canvas)* Fire web onReady once and honor string sizing
- *(camera)* Close settle, containment, and permission-chain gaps
- *(media)* Settle permission, picker, and capture paths like siblings
- *(macos-renderer)* Close stale-prop, margin, scroll, and accessibility gaps
- *(camera)* Stream host movie files in chunks instead of one base64 payload
- *(bamboo)* Ship a typed surface for the published exports
- *(ios)* Repair two Swift compile defects in picker and effects leaves
- *(media)* Register AppKit still captures for release and qualify the real sheet
- *(ui)* Name iOS tap-to-blur member after its exposed selector
- *(camera)* Validate chunked movie transfers and clean owned staging
- *(rolling-text)* Add AppKit host and settle reduced-motion updates
- *(lottie)* Widen intrinsic className typing via octane 0.2.4
- *(platform)* Add .js to import() specifiers in macOS declarations
- *(cli)* Bind installed tarballs to versioned MCP docs
- *(workshop)* Report Windows prerequisites and block unqualified launch
- *(typecheck)* Satisfy the windows program's merged timer globals and Utils stub
- *(macos-renderer)* Unbind dropped on* props on host updates
- *(ui)* Preserve composite grid placement and reflow late children
- *(ui)* Add LiquidGlass blur fallback and opt-in interaction
- *(lint)* Stop the tsrx pass at nested repository boundaries
- *(macos-renderer)* Match DockLayout percentage measurement basis
- *(nano-icons)* Use explicit glyph line heights and satisfy lint
- *(table)* Annotate DataGrid example rows with the full data type
- *(ui)* Keep syntax token offsets within each line
- *(lib)* Allow emitting build with TypeScript extensions disabled
- *(camera)* Accept unboxed iOS dictionary values (#26)
- *(camera)* Reset iOS interruption state on teardown (#27)
- *(ui)* Export SearchRequest from the package root
- *(macos)* Adapt app and renderer to the strict generated AppKit surface
- Exclude generated macos types from octane transform; disable ts-ext imports in lib build
- *(macos-renderer)* Drop ambient SDK tree from the typecheck program
- *(macos-renderer)* Import native names in packed lifecycle fixtures
- *(ui)* Keep native element typings internal
- *(runtime)* Dispose empty DOM provider content
- *(ui)* Share Android sheet keyboard inset bindings
- *(native)* Align Pager hooks and probe containers with portals
- *(cli)* Keep typegen watch running past a broken package
- *(macos-renderer)* Read NSArray.count as a property
- *(charts)* Align octane dev dep on the augmented intrinsics copy
- *(ui)* Wire parity entrypoints into typegen and export types
- *(create)* Restore scaffold-reproducible tsconfig array formatting
- *(lint)* Unflag native-portal imports, stale Link entry, generated typings
- *(platform)* Restore Runtime.d.ts filename casing for case-sensitive checkouts
- *(platform)* Restore prop-removal resets in the octane 0.2.5 driver patch
- *(platform)* Add src/ios+android shims for the src-subpath convention

### Refactoring

- *(ui)* Split Select into container and internal SelectView
- *(ui)* Isolate resolved PowerSearch family presentation
- *(ui)* Split BaseTypeahead into container and internal BaseTypeaheadView
- *(ui)* Make ComplexSelector presentation independently renderable
- *(leaves)* Remove redundant cx helpers
- *(typecheck)* Replace per-platform tsconfigs with shared tsconfig.envs.json
- *(macos-renderer)* Move AppKit surface off ambient globals
- Import platform-native names via @octane-xplat/platform subpaths
- *(cli)* Own the dev loop — xplat dev <target> replaces per-app shims
- *(parity)* Co-locate fixtures and checks with their components

## [0.14.0] - 2026-10-11

### Features

- _(camera)_ Shared camera-session movie-capture contract with iOS adapter
- _(camera)_ Record and reopen movies on Android and web
- _(camera)_ Preview and record movies on the Windows WinUI target
- _(camera)_ Record and reopen movies on macOS AppKit and WKWebView
- _(updates)_ Add recoverable next-launch OTA bundle updates
- _(camera)_ Record and reopen movies in the Linux WebKitGTK host

### Bug Fixes

- _(ui)_ Mark CodeBlock wrap styles web-only in tokens.css

## [0.13.0] - 2026-10-10

### Features

- _(dnd-kit)_ Add activation distance and drag handles
- _(ui)_ Add VirtualListHandle with scrollToOffset
- _(rolling-text)_ Add @octane-xplat/rolling-text package

### Bug Fixes

- _(cli,lint)_ Restore bins for link: consumers under pnpm 11
- _(macos-renderer)_ Normalize declarative className values before tokenizing
- _(dnd-kit)_ Close documented-behavior gaps in drag feedback and auto-scroll
- _(patches)_ Resolve # package-imports specifiers in the /ns/m device rewrite
- _(lottie)_ Accept nullable native host ref
- _(rolling-text)_ Avoid Unicode regex literal in native bundle

## [0.12.0] - 2026-10-08

### Features

- _(ui)_ Add qualified optional testID hosts
- _(mobile)_ Qualify on-device Vitest lane via @nativescript/unit-test-runner
- _(testing)_ Ship on-device Vitest lane and first mobile contract suite

### Bug Fixes

- _(macos-renderer)_ Reschedule layout after pin writes inside layout()
- _(patches)_ Preserve compiler anchors during whitespace cleanup
- _(icons)_ Encode macOS SVG sources as base64 data URIs
- _(macos)_ Sign dev host bundle with a stable certificate identity
- _(macos-renderer)_ Make stack layout sync first-responder safe
- _(patches)_ Sync package files before packing
- _(runtime)_ Export Children from universal native entries
- _(editors)_ Align native content lifecycle and explicit format subsets
- _(macos)_ Skip dev bundle signing on hosts without codesign

## [0.11.1] - 2026-10-08

### Bug Fixes

- _(macos-renderer)_ Pin grid/absolute children with constraints, not frame writes
- _(packages)_ Ship entries consumable by NativeScript vendors
- _(platform)_ Use ArrayBuffer-backed web random chunks
- _(cli)_ Launch macOS dev hosts with app name and icon
- _(macos-renderer)_ Match action selector strings to registered ObjC methods
- _(macos-renderer)_ Decode images outside batch apply
- _(macos-renderer)_ Honor secure/enabled state and per-edit events on text controls
- _(macos-renderer)_ Resolve package typecheck failures
- _(macos-renderer)_ Batch sibling layout work, fix margin indices and layout observers
- _(macos-renderer)_ Reset native state when styles and classes are removed
- _(macos-renderer)_ Unwind failed creates and preflight batch commands
- _(macos-renderer)_ Suppress warnings for layout child props
- _(macos)_ Implement CefAppProtocol on the JSC host application
- _(smooth-corners)_ Forward layout props through the platform wrappers
- _(create)_ Publish scaffold subpath export
- _(lint)_ Resolve local DOM-like bindings
- _(packages)_ Bind node's URL class in vite configs
- _(macos)_ Supply standalone effective appearance lifecycle
- _(macos-renderer)_ Honor label wrapping and overflow props
- _(icons)_ Generate renderer-aware JSX types
- _(macos)_ Normalize container layout across input channels
- _(smooth-corners)_ Emit undefined for unset layout props so removals reconcile

### Refactoring

- _(macos-renderer)_ Port .mjs sources to TypeScript

## [0.11.0] - 2026-10-07

### Features

- _(ui)_ Emit the macOS types entry with tsrx-typegen
- _(tiptap)_ Accept web-target tiptap extensions via props.web
- _(lexical)_ Complete web editor facade
- _(files)_ Add binary readBytes/writeBytes and qualified export
- _(platform)_ Add OS CSPRNG random service
- _(recorder)_ Add @octane-xplat/recorder leaf for WAV microphone capture
- _(auth)_ Add createHostedAuth — generic hosted sign-in + Bearer session transport
- _(richtext)_ Add structural split/join/indent/outdent commands to the Android surface
- _(richtext)_ Back the iOS leaf with AztecEditor-iOS
- _(shaders)_ Add @octane-xplat/shaders thin adapter
- _(gif)_ Add prefetch() and platform escape bags (expo-image L3/L6)
- _(ui)_ Add Image recyclingKey to blank recycled platform-list cells
- _(ui)_ Give Image a shared contentFit/contentPosition contract and srcset-style multi-source src
- _(ui)_ Add Image placeholder prop with blurhash/thumbhash decode
- _(ui)_ Add Image decoding prop (async default, sync opt-in)
- _(image,gif)_ Unify prefetch contract across the image-engine leaves
- _(image)_ Batch isImageCached + forward decode context on iOS

### Bug Fixes

- _(ui)_ Repair macOS source defects hidden by the handwritten types entry
- _(tiptap,lexical)_ Apply initial json prop once bridge and host are ready
- _(files)_ Honest export/writeBytes failure and single-flight export
- _(tiptap)_ Import TiptapJSON in native editor facade
- _(files)_ Wrap Android readBytes output in ByteBuffer
- _(smooth-corners)_ Glob test files so node --test resolves them on Node 24
- _(bamboo)_ Import virtual:bamboo.css from the NativeScript entry
- _(lottie)_ Type-guard the iOS stop() call on nativeViewProtected
- _(ui)_ Decode native images to view size, not source size
- _(probe)_ Map deep core subpaths in the mobile host module table
- _(patches)_ Stop treating per-package turbo.json as the dev-server workspace root
- _(patches)_ Restore ui-image 5.x iOS prefetch cacheType and headers

### Refactoring

- _(macos)_ Convert the AppKit harness to TypeScript

## [0.10.0] - 2026-10-04

### Breaking Changes

- [**breaking**] Replace bind with standard Octane refs

### Features

- _(lexical)_ Add @octane-xplat/lexical unified editor facade
- _(ui)_ Add Astryx-aligned component names
- _(ui)_ Standardize field control props
- _(ui)_ Add opt-in chrome stylesheet
- _(ui)_ Add search and token selection components
- _(ui)_ Add cross-platform chat family
- _(ui)_ Add content display components
- _(ui)_ Add Astryx forms and layout primitives
- _(ui)_ Add Astryx search and action controls
- _(ui)_ Add portable date and file entry controls
- _(ui)_ Add Astryx navigation and workspace components
- _(ui)_ Add Astryx overlay and media primitives
- _(files)_ Own FileInput with built-in platform pickers
- _(table)_ Add @octane-xplat/table leaf package
- _(motion)_ Delegate declarative tweens to platform animators
- _(icons)_ Add bundled Iconify rendering for web and mobile
- _(icons)_ Render bundled SVGs on native AppKit
- _(dnd-kit)_ Add shared drag and drop and native sortable lists
- _(dnd-kit)_ Support AppKit drag input and sortable lists
- _(smooth-corners)_ Add @octane-xplat/smooth-corners leaf package
- _(ui)_ Add anchored useLayer primitive
- _(ui)_ Render Windows SVG content with WinUI
- _(ui)_ Position Windows popovers with WinUI coordinates
- _(charts)_ Add @octane-xplat/charts leaf package
- _(ui)_ Strengthen finite-list selector interactions
- _(motion)_ Widen transition vocabulary to upstream shape
- _(motion)_ WhileTap/whileFocus, callbacks, motion.create, useAnimate
- _(table)_ Add interactive DataGrid controls
- _(motion)_ Add bounded declarative drag with native arbitration
- _(motion)_ Add bounded variants and child orchestration
- _(image-crop)_ Add inline cross-platform crop selection
- _(macos-renderer)_ Support contain-fit images and input-transparent layers
- _(image-crop)_ Add AppKit inline selection support
- _(ui)_ Add source-backed cross-platform command palette
- _(cli)_ Add xplat fonts add for cross-platform custom fonts
- _(cli)_ Support fontsource packages and woff inputs in xplat fonts add
- _(notifications)_ Implement native AppKit local delivery
- _(ui)_ Make Markdown streaming-ready with an incremental runtime parser
- _(create)_ Let create scaffold a chosen platform subset
- _(cli)_ Add xplat add <platform> for post-scaffold enablement
- _(charts)_ Render charts with AppKit on macOS
- _(editors)_ Host AppKit facades in local WKWebView
- _(motion)_ Delegate declarative bezier tweens to WAAPI on web
- _(sheet)_ Add accessible web modal behavior
- _(ui)_ Embed WKWebView documents on AppKit
- _(macos-renderer)_ Add internal type coverage
- _(ui)_ Add shared menu choices and nested navigation
- _(ui)_ Match optional segments and terminal catch-alls in route patterns
- _(ui)_ Add shared keyed query cache over query$
- _(ui)_ Add route-level error boundary and loader pending state
- _(ui)_ Add native platform list viewability API
- _(secure-storage)_ Support AppKit with macOS Keychain
- _(lottie)_ Add AppKit playback support
- _(macos)_ Present shared overlays with AppKit lifecycle and focus

### Bug Fixes

- _(ui)_ Preserve chat prop boundary after rebase
- _(ui)_ Reconcile navigation props after rebase
- _(ui)_ Migrate overlay consumers to Astryx APIs
- _(ui)_ Use native macOS file picker
- _(ui)_ Reconcile Astryx APIs with current harness and build
- _(motion)_ Monotonic native clock and event-driven iOS reduced motion
- _(ui)_ Ignore Android SafeArea escape props on Windows
- _(ui)_ Retain VisuallyHidden sizing in native styles
- _(ui)_ Use a readable native Code font size
- _(ui)_ Use the native monospace font family
- _(ui)_ Give selection indicators visible geometry
- _(ui)_ Point mobile layers at shared native helpers
- _(ui)_ Restore AppKit platform resolution and hook compilation
- _(ui)_ Narrow peer dependency contract
- _(windows)_ Remove unused UI plugin dependencies
- _(ui)_ Register iOS tap-to-blur target without NativeClass
- _(ui)_ Defer VirtualList estimate renders beyond resize delivery
- _(table)_ Wait for valid native layout before measuring header
- _(ui)_ Preserve controlled date values and validate range presets
- _(charts)_ Adopt useMeasure ref surface from main's bind migration
- _(motion)_ Restore component wiring lost in the bind-to-ref refactor
- _(ui)_ Animate AppKit refs with shared timed and spring playback
- _(ui)_ Filter undefined entries from leaf ref arrays
- _(platform)_ Post native AppKit accessibility announcements
- _(image-crop)_ Use useMeasure ref surface after bind migration
- _(auth)_ Complete AppKit provider and browser session flows
- Resolve extracted macOS renderer in leaf typechecks
- _(windows)_ Repair pointer observer ownership and lifecycle
- _(windows)_ Integrate parent-driven percentage sizing
- _(macos)_ Unblock AppKit harness and restore smoke checks
- _(ui)_ Preserve array refs when leaves merge internal and caller refs
- _(ui)_ Defer VirtualList rebuilds after resize delivery
- _(audio)_ Pass null for session deactivation error
- _(lottie)_ Report web animation setup failures
- _(lottie)_ Bind web animation handles on mount
- _(web)_ Close browser support gaps
- Restore mobile package typechecks
- _(ui)_ Add shared SVG declaration entry
- _(ui)_ Restore platform lint boundaries
- _(sqlite)_ Harden Web database handle lifecycle
- _(ui)_ Restore web modal focus after pointer activation
- _(ui)_ Require accessible names for modal overlays
- _(platform)_ Initialize web app state from visibility
- _(web)_ Qualify optional audio across browsers
- _(web)_ Complete standard ref migration
- _(ui)_ Keep native element types out of published declarations
- _(table)_ Remove duplicate feature type export
- _(types)_ Restore mobile harness validation
- _(web)_ Preserve browser receiver for animation frames
- _(ui)_ Preserve composed array refs through wrappers
- _(motion)_ Preserve descendant pointer click targets
- _(lint)_ Resolve pnpm lint errors
- _(cli)_ Update the lockfile when add or patches apply change deps
- _(ui)_ Build the markdown word-char regex without \p{} literals
- _(ui)_ Keep bare \p{ out of the WORD_CHAR doc comment
- _(ui)_ Normalize JSX children and host native text slots
- _(cli)_ Allow linked-dep roots in xplatNative fs.allow
- _(ui)_ Let Android children draw outside their layout bounds
- _(cli)_ Normalize letter-spacing units for native css
- _(ui)_ Share tooltip layers and audit Astryx parity
- _(ui)_ Reconcile AppKit barrel declarations and packed consumers
- _(ui)_ Coordinate nested layer dismissal across roots
- _(ui)_ Settle VirtualList measurements and preserve AppKit row order
- _(ui)_ Complete bounded date keyboard and locale parity
- _(ui)_ Complete portable layer positioning
- _(table)_ Complete bounded selection and accessibility parity
- _(ui)_ Present macOS command palettes modally and reveal highlights
- _(ui)_ Reconcile parity changes with typed renderer and moved docs
- _(cli)_ Apply the platform extension chain to native dev resolution
- _(patches)_ Resolve /ns/m node_modules URLs against linked-dep roots
- _(ui)_ Draw Android svgviews through a proxied View subclass
- _(lingui)_ Map .tsrx extraction origins to authored lines
- _(table)_ Make native test leaves pass app typecheck
- _(web)_ Own scroll restoration per history entry
- _(ui)_ Respect list lifecycle during viewability
- _(typecheck)_ Make every target program and package check green
- _(ui)_ Share tooltip layers and audit Astryx parity
- _(ui)_ Coordinate nested layer dismissal across roots
- _(windows)_ Restore core input and accessibility contracts
- _(ui)_ Complete bounded date keyboard and locale parity
- _(ui)_ Add macOS query storage leaf backed by memory adapter
- _(ui)_ Declare RouteBoundary and errorBoundaryFor in macOS types
- _(ui)_ Remove duplicated shared re-export block from macOS types

### Refactoring

- Migrate first-party layouts to HStack
- _(ui)_ Layer shared field structure
- _(ui)_ Share native overlay foundations with Windows
- _(ui)_ Share native route host helpers across targets
- _(macos)_ Extract renderer into a workspace package
- _(create)_ Split scaffold into a per-target manifest + composer
- _(macos-renderer)_ Port sources to TypeScript

## [0.9.0] - 2026-10-02

### Features

- _(intersection-observer)_ Add cross-platform visibility package
- _(intersection-observer)_ Support macOS AppKit views
- _(platform)_ Add typed desktop webview host contract
- _(linux)_ Expose desktop host services through WebKitGTK
- _(macos)_ Implement shared WKWebView desktop bridge

### Bug Fixes

- _(release)_ Align package repository URLs for provenance

## [0.8.0] - 2026-10-02

### Breaking Changes

- _(share)_ [**breaking**] Extract @octane-xplat/share leaf from @octane-xplat/platform
- _(platform)_ [**breaking**] Extract all plugin-backed services into leaf packages

### Features

- _(cli)_ Ship scaffold patches as config dependency
- _(date-picker)_ Port Expo's DatePicker/TimePicker into platform leaves
- _(context-menu)_ Port Expo's ContextMenu/DropdownMenu into platform leaves
- _(sheet)_ Port Expo's BottomSheet/ModalBottomSheet into platform leaves
- _(auth)_ Add @octane-xplat/auth — Sign in with Apple + Google Sign-In
- _(auth)_ Implement Sign in with Apple + authSession on macOS
- _(platform)_ Add macOS share sheet support
- _(effects)_ Ship shader registration inside the leaf
- _(push)_ Add @octane-xplat/push leaf — Firebase Cloud Messaging on all targets
- _(sqlite)_ Add @octane-xplat/sqlite leaf for cross-target persistence
- _(sqlite)_ Run sqlite-wasm in-process on macOS
- _(sqlite)_ Bind system libsqlite3 on macOS via host metadata interop
- _(context-menu)_ Add the AppKit leaf
- _(date-picker)_ Add the AppKit leaf
- _(sheet)_ Add the AppKit leaf
- _(ui)_ Typed programmatic routes via literal-path inference
- _(cli)_ Fail builds on platform-boundary module leaks
- _(ui,cli)_ Baked dataMode — route loaders that run at codegen
- _(ui,cli)_ Markdown files as baked routes
- _(ui,cli)_ Normalized JSON route manifest for external hosts
- _(sqlite)_ Run sqlite-wasm in-process on macOS
- _(sqlite)_ Bind system libsqlite3 on macOS via host metadata interop
- _(cli)_ Compile macOS leaf sources and generate app metadata
- _(cli)_ Integrate macOS native leaves into dev and packaged apps
- _(bridge)_ Add typed desktop host contracts and macOS proof
- _(macos)_ Add system webview desktop backend
- _(lottie)_ Add @octane-xplat/lottie leaf package
- _(lottie)_ Vendor the ui-lottie fork inside the leaf
- _(cli)_ Add Linux WebKitGTK app packaging
- Persist the selected color scheme
- Add isolated platform probe runner
- _(cli)_ Define process.env.NODE_ENV at the bundler level
- _(bamboo)_ Integrate portable CSS utilities
- _(richtext)_ Add @octane-xplat/richtext leaf with Android Aztec editor
- _(tiptap)_ Add @octane-xplat/tiptap unified editor facade
- _(lingui)_ Add @octane-xplat/lingui leaf package

### Bug Fixes

- _(ui)_ Preserve web pan gestures through rerenders
- _(leaves)_ Point export types at the platform barrel, not types.ts
- _(context-menu)_ Create the Android trigger host with a real Context
- _(macos)_ Converge deep seeks — suppress corrections mid-seek, docH-free offset
- _(ui)_ Preserve native pan cancellation
- _(cli)_ Resolve app imports lazily in xplatNative
- _(ui)_ Share KeyboardAvoiding root API
- _(audio)_ Repair iOS system playback controls
- _(app)_ Correct navigation parity and media probe usage
- _(manifests)_ Remove rebase conflict markers
- _(platform)_ Build the auth-session anchor class lazily
- _(data)_ Preserve query ownership and native suspense events
- _(cli)_ Probe the .mobile suffix tier in the ns-vite type check
- _(ui)_ Emit web-variant declarations and fix the packed consumer
- _(ui)_ Retain prepared routes across browser history
- _(navigation)_ Handle malformed and repeated incoming links
- _(ui)_ Unmount route roots when native modals dismiss
- _(ui)_ Prevent controlled native text echoes and release editing focus
- _(ui)_ Support keyboard actions and prevent disabled activation
- _(ui)_ Convert Android keyboard insets to layout units
- _(ui)_ Contain and restore focus for shaded web overlays
- _(typecheck)_ Exclude platform directories from the mobile program
- _(create)_ Ship a starter that installs and lints cleanly
- _(ui)_ Keep the phantom route key out of the published value surface
- _(cli)_ Report unresolvable patches as not-applicable
- _(lint)_ Correct rule scopes and clear the violation backlog
- _(ui)_ Preserve VirtualList visible anchor on web data updates
- _(ui)_ Prevent stale route loads from overriding navigation
- _(ui)_ Release native overlay hosts and theme subscriptions
- _(ui)_ Cancel long presses when their interaction ends
- _(ui)_ Keep PIN edits in their intended cells
- _(ui)_ Grow uncontrolled textareas as users type
- _(ui)_ Tolerate navigation events without a payload
- _(ui)_ Unblock typegen by narrowing restored route state
- _(patches)_ Carry upstream runtime fixes
- _(platform)_ Settle hosted auth sessions safely on failure and retry
- _(media)_ Clean up temporary previews when image conversion fails
- _(audio)_ Release browser sound voices and system controls on teardown
- _(cli)_ Resolve builtin-named deps in the macOS native scan
- _(macos)_ Repair the dev bundle against main drift
- _(cli)_ Refresh NativeScript Vite patch at 8.0.17
- _(leaves)_ Resolve packed declaration specifiers under NodeNext
- _(sqlite)_ Import SqliteParam in the macOS database backend
- Restore Android development startup and native JSX types
- _(ui)_ Reduce VirtualList scroll and measurement work
- _(ui)_ Restore generated web barrel for platform-leaf resolution
- _(ui)_ Declare Markdown exports on the macOS type surface
- _(ui,lottie)_ Rewrite vendored specifiers to the emitted paths
- _(tiptap)_ Keep upstream's bare process.env read in the @octanejs/tiptap patch
- _(richtext,tiptap)_ Emit types.d.ts from src/types.ts
- _(create)_ Tolerate unused framework patches in scaffolded apps

### Performance

- _(ui)_ Recycle and position VirtualList cells

### Refactoring

- _(web)_ Share desktop host services across webview backends

## [0.7.3] - 2026-09-30

### Bug Fixes

- _(platform)_ Create auth anchor with runtime extension
- _(ui)_ Align native stack children
- _(ui)_ Align native slider measurements
- _(ui)_ Honor variable font weight on iOS
- _(ui)_ Preserve explicit native text line heights
- _(ui)_ Size native command palette to viewport
- _(ui)_ Render native pagination pages
- _(ui)_ Keep checkbox glyph on contrast color
- _(ui)_ Align native text utility line boxes
- _(native)_ Restore workspace CSS bridge
- _(android)_ Apply custom font weights
- _(ui)_ Guard native WebView scroll handling
- _(ui)_ Position native popovers inside safe area
- _(ui)_ Auto-place unpositioned grid children
- _(ui)_ Isolate iOS tap blur bridge code by platform

## [0.7.2] - 2026-09-29

### Bug Fixes

- _(ui)_ Make the shared barrel extensionless

## [0.7.1] - 2026-09-29

### Bug Fixes

- _(macos)_ Converge VirtualList measurements instead of oscillating
- _(ui)_ Restore web-specific entry implementations

### Refactoring

- _(ui)_ Share web declarations with common API

## [0.7.0] - 2026-09-29

### Breaking Changes

- _(ui)_ [**breaking**] Make ui-svg a transitive plugin dependency
- _(ui)_ [**breaking**] Draw Meter on svgview, drop the ui-canvas peer
- _(ui)_ [**breaking**] Vendor ui-svg's SVGView, dropping the ui-canvas merge

### Features

- _(cli)_ Add experimental macOS AppKit target
- _(cli)_ Own experimental macOS packaging
- _(canvas)_ @octane-xplat/canvas — DOM Canvas API incl. WebGPU/WGSL
- _(effects)_ @octane-xplat/effects — platform view-effect shaders
- _(camera)_ Replace camera-plus with camera preview leaf
- _(media)_ Add optional haptics sound and audio services
- _(ui)_ Add shared VirtualList vertical foundation
- _(macos)_ Package optional app icon
- _(ui)_ Expose the supported macOS root surface
- _(ui)_ Add AppKit leaves for the shared harness surface
- _(macos)_ Run the xplat harness on AppKit
- _(macos)_ Run shared harness on AppKit
- _(macos)_ Add core web parity baseline
- _(pager)_ Extract Pager into @octane-xplat/pager
- _(video)_ Extract Video into @octane-xplat/video
- _(linux)_ Experimental WebKitGTK webview target with host bridge
- _(cli)_ Ship canonical patch set + xplat patches apply/check
- _(linux)_ Verify gjs host under real WebKitGTK in container
- _(macos)_ Make JavaScriptCore the packaged AppKit host
- _(macos)_ Run dev HMR in JavaScriptCore
- _(platform)_ Add webAuthn + authSession capabilities for passkey/auth ceremonies
- _(ui)_ Add programmatic route registration (defineRoutes/addRoutes)
- _(cli)_ Port NativeScript#11446 nested-tab-frame fix into the core patch
- _(ui)_ Add native UI affordances
- _(linux)_ Host-backed appearance, file picker, and deep links
- _(linux)_ Multi-window via host windows
- _(windows)_ Scaffold apps/windows on the upstream core platform
- _(ui)_ Port shared component leaves to the AppKit host
- _(macos)_ Populate the __xplatAppKit platform-services seam
- _(ui)_ Share Hoverable/Tooltip as passthrough leaves, add macOS hover
- _(ui)_ Impl in unsuffixed leaf, .mobile as passthrough
- _(native-picker)_ Add cross-platform native picker pilot
- _(motion)_ Add cross-platform declarative motion and values
- _(motion)_ Retain live subtrees through exit animations
- _(typegen)_ Verify published package declarations
- _(ui)_ Generate declarations with tsrx-typegen
- _(cli)_ Patch @nativescript/vite deps-bundle to alias octane
- _(windows)_ Port framework patch set to @11468 preview builds
- _(ui)_ Split shared and platform entry barrels
- _(macos)_ Windowed VirtualList and shared 5000-row benchmark on the AppKit host
- _(picker)_ Expose platform-specific controls

### Bug Fixes

- _(cli)_ Resolve package metadata rebase conflict
- _(cli)_ Probe codesign with a valid command
- _(canvas)_ Narrow width/height cast for the native view prop types
- _(canvas)_ Align with current NativeScript runtime
- _(ios)_ Resolve Swift target compile errors
- _(ios)_ Initialize SwiftUI view factory before registration
- _(lint)_ Allow the macOS Node-API runtime
- _(ui)_ Type openWindow results by target
- _(macos)_ Preserve previous package artifacts on publish failure
- _(macos)_ Place runtime framework in bundle framework directory
- _(cli)_ Replace macOS SEA packaging
- _(macos)_ Bundle supported LTS runtime
- _(macos)_ Pin bundled Node archive checksum
- _(cli)_ Validate installed macOS runtime layout
- _(cli)_ Preflight macOS runtime before bundling
- _(macos)_ Complete framework links before signing
- _(macos)_ Preserve framework-relative symlinks
- _(macos)_ Use defined runtime package name
- _(macos)_ Verify cached Node runtime binary
- _(macos)_ Complete framework links before signing
- _(ui)_ Honor Android safe area insets
- _(macos)_ Align shared control geometry
- _(macos)_ Match shared slider geometry
- _(macos)_ Match Stack overlay layout
- _(macos)_ Match shared text and heading metrics
- _(macos)_ Align textarea row sizing
- _(macos)_ Honor Pressable alignment props
- _(macos)_ Expand flexible stack children
- _(cli)_ Pin dep-optimizer surface in native dev preset
- _(patches)_ Route /@fs and re-export specifiers through /ns/m
- _(macos)_ Reject unsupported host API members during packaging
- _(ui)_ Named-stack pushes work on Android tab panes and pop past the iOS isLoaded stall
- _(native)_ Serve pnpm-isolated deps and device-safe CSS/CJS over /ns/m
- _(native)_ Keep sheets above the keyboard, tap-to-blur, and guard optional bridges
- _(platform,ui)_ Make link:-consumed source device-safe on native
- _(ui)_ Keep nested Tabs from re-presenting an ancestor's stack
- _(ui)_ Cover ListItem on the AppKit host
- Restore native parity harness
- _(parity)_ Align shared heading typography
- _(ui)_ Apply NativeScript SVGView decorator without syntax transform
- _(ui)_ Emit octane/universal-native specifiers in native lib builds
- _(create)_ Bump template pins to ui/cli ^0.6.0 + octane 0.6.3
- _(patches)_ Make Octane install independent of research
- _(ui)_ Keep popover className off the native full-screen host
- _(lint)_ Add node shebang to xplat-lint bin
- _(cli)_ Probe the .mobile suffix tier in ns-vite tsconfig-paths resolution

### Refactoring

- _(platform)_ Use native default and mobile suffix

## 0.6.0

Everything added, changed, and fixed since 0.5.0.

### Components and interaction

- New shared components for forms, menus, navigation, and data display:
  `Button`, `Accordion`, `Checkbox`, `Select`, `InputTags`, `InputRating`,
  `Breadcrumb`, `Pagination`, `Stepper`, `Table`, `Timeline`, `Tree`, and
  related primitives.
- `Pager`, `SegmentedControl`, and `SearchInput` provide shared controls for
  paging, choosing among options, and searching.
- Web apps can use the accessible `Tooltip` component from
  `@octane-xplat/ui/web`.
- `ScrollView` supports pull-to-refresh with `refreshing` and `onRefresh`.
  Sheets accept detents for snap-point layouts.
- `WebView`, `Video`, and `CameraView` provide hosted web, playback, and live
  camera surfaces. `@octane-xplat/gif` adds `AnimatedImage` for animated GIF
  and WebP files.
- `setTranslate()` applies an imperative translation consistently across
  targets. `useBackInterceptor()` lets a screen handle native hardware back.

### Platform services and toolchain

- `@octane-xplat/platform` adds reactive `useBreakpoints$()` and camera capture
  through `media.capturePhoto()`.
- The CLI improves NativeScript dependency discovery, CSS unit conversion and
  web-only CSS handling, and native plugin diagnostics. `xplatNative()` and
  route generation also receive fixes.
- The starter template now includes an agent skill with the cross-platform
  rules and component guidance.

### Upgrading

- The shared UI surface now favors components with matching behavior across
  platforms. `List`, `Modal`, `Hoverable`, and Liquid Glass are no longer root
  exports; platform-authentic widgets are available from `@octane-xplat/ui/ios`
  or `@octane-xplat/ui/android` where supported. Check the platform subpath
  guide when migrating those imports.
- Apps using `<Video>` or `<CameraView>` must declare their corresponding
  NativeScript plugin dependencies: `@nstudio/nativescript-exoplayer` and
  `@nstudio/nativescript-camera-plus`.
- `useBreakpoints` was renamed to `useBreakpoints$` to identify its reactive
  return value.

## 0.5.0

Everything added, changed, and fixed since 0.4.0.

### New components and hooks

- **`<Hoverable>`** — a delayed hover card anchored to its child. On
  iOS/Android the same card opens from a long press (native has no
  hover), using the driver's long-press recognizer for intent. On web
  the card stays alive while the pointer crosses from the anchor onto
  the card itself.
- **`useMeasure()`** — live element bounds:
  `const { bind, bounds } = useMeasure()`, then pass `bind` to any
  primitive's `bind` prop. Bounds are observed by default (`null` until
  first layout); `{ observe: false }` for a one-shot read. Web
  coordinates are viewport-relative; native are screen-relative dips.
- **Anchored toasts.** `showToast()` accepts `anchor` + `placement` to
  position a toast from a view, in addition to the existing
  top/bottom + start/end viewport placements.
- **`cardClassName`/`cardStyle`** on `Hoverable` (and card internals)
  style the overlay wrapper directly — no more compensating CSS on the
  card content.
- **`PanEvent`/`SwipeEvent` types** are now exported from the package
  entry points (previously declared but unreachable).

### Theming and styling

- **DOM normalization in `tokens.css`.** `box-sizing: border-box` and
  `border-width: 0; border-style: solid` defaults bring web in line with
  NativeScript's box model — a lone `border-width` now paints the same
  way on both platforms instead of needing a paired `border-style`.
- **Utility fixes.** `.flex-1` emits `flex: 1 1 0%`; `items-start` is
  available; `--color-onprimary` replaces `--color-on-primary` (the
  rename keeps the utilities drop-in compatible with Tailwind v4's
  token-key rule).
- **Status-bar icons follow the theme.** Switching to dark mode flips
  status-bar icon appearance on iOS and Android from first paint —
  previously Android kept its launch-time appearance.
- `openUrl`-style anchors and inputs pick up muted placeholder text and
  consistent focus styling on web.

### Icons

- `Icon` documents and enforces a clear fallback order —
  SVG (`markup`/`svg`/`src`) → `font` glyph → `text` — and preserves
  `viewBox` for multi-path SVG artwork on web.

### Toolchain

- **`xplat doctor` warns on undeclared native plugins.** If a shipped
  plugin (like the gesture handler `Drawer` eager-loads) isn't in your
  app's `package.json`, you get a warning at dev time instead of a boot
  crash on device.
- **`xplatNative()` fixes.** The preset seeds `alien-signals` into the
  deps bundle (fixes 504s when dev-serving) and teaches rolldown that
  `.tsrx` files contain JSX (fixes dev/HMR transforms).
- **Starter updates.** `create-octane-xplat` now declares
  `cli.packageManager: 'pnpm'` (required for symlinked installs to
  resolve under `ns build`) and ships a `.agents/skills/xplat` skill +
  `AGENTS.md` so coding agents get the platform rules on demand.

### Fixed

- **Android cold-launch crash** in `appInfo` — reading the app context
  at module load crashed inlined-bundle boots; it now reads lazily.
- **Accessibility props wired on native.** `accessible`, label, hint,
  value, role, state, and live-region props on `Pressable`/`Text` reach
  the platform accessibility APIs (role names are translated, e.g.
  `heading` → `header`).
- **Pan velocity on native.** `PanEvent` velocity is now reported in
  dips/second on iOS (`velocityInView`) and Android (`VelocityTracker`).
- **`TextArea` submit.** `onSubmit` on native fires only for
  `returnKeyType="done"`/`"send"` — it no longer fires on every newline.
- **`useAnimation` honors `prop` on web** — it no longer always writes
  `translateX` regardless of the requested property.
- **Overscroll containment** on web — nested scroll containers no longer
  chain into the app column or the browser's pull-to-refresh.
- Web multiline input echo preserves newlines; `<Text>` placeholders
  render in the muted text color.

### Upgrading

- **New peer dependency for `<Drawer>`:** declare
  `@nativescript-community/gesturehandler` in your app's `package.json`
  if you use `Drawer` — the drawer eager-loads it and NativeScript only
  compiles plugins that are top-level declarations. `xplat doctor`
  flags this if it's missing.
- **`--color-on-primary` is now `--color-onprimary`** — rename the
  variable in app stylesheets if you referenced it directly.
- Web borders on shared components now paint from `border-width` alone
  (the DOM normalization above); if your app relied on the old
  no-border-unless-`border-style` behavior, audit shared rules that set
  a bare `border-width`.

## 0.4.0

Everything added, changed, and fixed since 0.3.0.

### Navigation and routing

- **Layouts.** A `_layout.tsrx` file wraps every route in its folder and
  subfolders, so shared chrome (headers, banners, sidebars) lives in one
  place instead of being repeated in each screen.
- **Modal and fade routes.** Name a route file `settings+modal.tsrx` or
  `photos+fade.tsrx` and it opens as a modal or with a fade transition.
  Modal routes get their own layer on both platforms and can be closed
  with `popRoute()`.
- **Route loaders.** Export `loader(params)` from a route file and it
  runs just before navigation, so the screen opens with data already on
  the way. The result reaches the screen as `data` (or `error`) props.
- **Deep links.** `pushDeepLink(url)` turns an incoming URL into an
  in-app navigation. Feed it links with `onDeepLink()` and
  `consumeInitialUrl()` from `@octane-xplat/platform` at app start.
- **Per-tab history.** Give a tab `stack: 'name'` and it keeps its own
  back stack — pushing a route while that tab is active opens the screen
  inside the tab, and switching tabs keeps each stack's history.
- **Typed routes, no boilerplate.** `xplat routes` scans your route
  folder and generates typed route names, params, and presentations.
  `xplat dev` and `xplat build` regenerate automatically, and apps no
  longer write a route manifest by hand.
- **Scroll restore on web.** Navigating back or forward returns each
  page to its previous scroll position.
- **`openWindow()`** opens a second window — a browser window on web, an
  extra app window on native.
- **Route guards.** Export `beforeLoad({params, context})` from a route
  file and it runs before a push commits. Return an object and it merges
  into the screen's props and route context; `redirect(route)` short-
  circuits to another route.
- **Route `head`.** Export `head` as `{title, meta}` (or a synchronous
  params function). Web writes `<title>`/meta tags; native uses `title`
  for the pushed page's action bar.
- **Back-state hooks.** `useCanGoBack(stack?)` tracks in-app history depth
  on web and `Frame.canGoBack()` on native; pushed screens also get
  `_pushed`/`_stack` props.
- New exports: `currentModalRoute`, `useModalRoute`, `routeStacks`,
  `pushDeepLink`.

### New components

- **`<Sheet>`** — a bottom sheet docked inside the current window.
  Declarative (`<Sheet open onDismiss={...}>`) or imperative
  (`openSheet(Component, params)` / `closeSheet()`). The existing
  `Modal presentation="sheet"` remains for a full system modal.
- **`<Link>`** — a link to an external URL. A real `<a href>` on web;
  opens the system browser on native.
- **`<NavLink>`** — a link to an in-app route, with an
  `activeClassName` that applies while that route is current.
- **`<Meter>`** — a circular progress ring.
- **`<Drawer>`** — a real slide-out drawer on native (powered by
  `@nativescript-community/ui-drawer`), matching the web drawer. Pass
  content as elements: `<Drawer main={<Home />} drawer={<Menu />}>`.
- **`<RichText>` + `<RichTextSpan>`** — mixed inline formatting and
  tappable runs: `<RichText><RichTextSpan text="Read " />
<RichTextSpan className="link" onPress={...} text="@alec" /></RichText>`.
  Inline spans on web; one label with styled/tappable spans on native.
- **`<Popover>` now works on native.** It opens an overlay anchored to
  its trigger. Previously it rendered nothing off-web.
- **Richer `<Icon>`** — registered icons can carry full SVG artwork
  (`markup` + `viewBox` for multi-path icons) or a unicode `text`
  fallback.
- **SVG images on native.** `<Image>` and `<Icon>` render `.svg` files,
  SVG data URIs, and inline SVG markup on iOS/Android.
- **Liquid Glass.** `<LiquidGlass>` is an interactive glass surface and
  `<LiquidGlassContainer>` merges neighboring glass surfaces. Real iOS 26
  material where available, a `backdrop-filter` approximation on web, and
  a plain view everywhere else. Container components (`View`, `Row`,
  `Grid`, `Stack`, `Absolute`, `Pressable`, `ScrollView`) also take a
  `glass` prop — `glass` or `glass="clear"` for static background glass.

### Layout and styling

- **Flex props on containers.** `View`, `Row`, and `Pressable` accept
  `justifyContent`, `alignItems`, `flexWrap`, and `gap` — the same names
  React Native uses. `justifyContent="space-between"` replaces
  `margin-left: auto`, which native ignores.
- **`id` on every component.** Forwarded to the host element on both
  platforms, for test selectors and debugging.
- **New utility classes.** `min-w-0`, `min-h-0`, `shrink-0`, and `grow`
  cover the common flexbox overflow guards.
- **Automatic px→dip.** Pixels in shared stylesheets convert to
  device-independent units in the native build, so one stylesheet sizes
  correctly on both platforms.
- **Smooth (squircle) corners.** `corner-shape: squircle` is the default
  corner treatment — the `.rounded-sm/md/lg/xl` utilities and the shipped
  component classes (modals, sheets, inputs, chips) declare it, and a
  `--radius-*` token scale backs them. iOS uses the system's continuous
  corner curve; web needs Chrome ≥139, other browsers fall back to round.
  `.rounded-full` stays a real circle; opt out per element with
  `corner-shape: round`.
- **`<ScrollBox>`** — wraps content that may contain a `<List>`. On web it
  scrolls like `ScrollView`; on native it's a plain inline view so the
  `ListView` owns scrolling. (A `List` nested inside a native `ScrollView`
  can't measure its cells — it now throws a named error instead of
  crashing inside UIKit.)

### Theming

- **App-wide light/dark control.** `setThemePreference('light' | 'dark'
| 'system')` and `useThemeScheme()` manage the theme. Overlays,
  popovers, toasts, sheets, modals, and web portals now follow it —
  previously only the app root did.

### Platform services (`@octane-xplat/platform`)

- `clipboard.canCopy()` and `clipboard.writeText()` on both platforms.
- `media` image picking returns a `PickedImage` with a `previewUri` and
  `dataUrl` that persist and render on both platforms; the native
  `<Image>` component accepts base64 data URIs.
- `geolocation.getCurrentPosition()` returns the platform-neutral
  position shape (`latitude`, `longitude`, `accuracy`, …) on both
  platforms.
- `connectivity.getState()` / `connectivity.subscribe()` report online
  status and connection type, with change events on both platforms.
- `appInfo` (`version`, `build`, `bundleId`) on native; reports
  `supported: false` on web where no trustworthy values exist.
- `openUrl(url)` opens a link in the system browser (or a new tab on
  web); `openSettings` jumps to the app's native settings page.
- Deep links on native are more reliable: links that launched the app
  are delivered, and duplicate deliveries are dropped.
- `SafeArea` on Android now reads system-bar and display-cutout insets
  and keeps them updated; web `biometrics` reports `unsupported`
  honestly instead of pretending WebAuthn works.

### Toolchain (`@octane-xplat/cli`)

- **`xplatNative()` Vite preset.** One call replaces the ~130-line
  `vite.config.native.mts` boilerplate — renderer setup, platform file
  resolution, and the dev-mode HMR watchdog are built in. Import from
  `@octane-xplat/cli/vite`.
- **Native CSS checks.** The build warns when a stylesheet uses
  declarations NativeScript ignores (`position: fixed`, `z-index`,
  `box-shadow`, auto margins, and friends) and suggests the portable
  alternative. Blocks marked web-only are stripped from the native
  bundle.
- **`@octane-xplat/lint`.** A new lint package (run with `xplat-lint`)
  that catches cross-platform mistakes at lint time instead of letting
  them fail silently on device — DOM globals in shared files, web-only
  APIs, NativeScript imports in shared code, style properties native
  ignores, unitless `lineHeight`, hooks in plain `.ts` files, and more.
  It lints `.tsrx` files too, and `--fix` applies supported fixes. New
  projects created with `create-octane-xplat` get it preconfigured.

### State and reactivity

- **Signal reads work on native.** Reading a module-level
  `signal$`/`query$` with `.get()` inside a component now subscribes and
  re-renders on iOS/Android, same as on web — no extra plumbing needed
  for shared state.
- **`@else if` works on native**, returning the matching branch's UI.
- **JSX in props works on native.** `<Drawer main={<Home />} />` and
  similar element-valued props previously threw; they now render.

### Fixed

- `popRoute()` reliably closes modal routes on iOS — it could previously
  leave the modal visible when animations raced.
- Popovers, toasts, sheets, and overlays opened from a pushed page now
  appear on that page instead of attaching to the wrong window root.
- `<Text>` wraps by default on native; it was silently rendering
  single-line and truncating. `ellipsize` or `numberOfLines={1}` opt
  back in.
- `style={{ lineHeight: 40 }}` now means 40px on web — it rendered
  roughly 40× too tall.
- Classes can override `Pressable`'s default column direction on native;
  a `flex-direction: row` class was previously ignored.
- `Icon` artwork set via `markup` respects the `color` prop, and the
  popover backdrop color renders correctly.
- Omitted optional props no longer reach native views as `undefined` —
  a `TextInput` without `editable` could previously come out
  non-interactive (tappable-looking field that could never take focus).
- Native `Screen` children can no longer silently overlap and eat each
  other's taps — sibling views used to share the screen's full bounds,
  so an invisible covering area could make buttons look dead.
- Type fixes so consumer apps typecheck cleanly (`Meter`'s `onDraw`,
  the media picker).

### Upgrading

- New native peer dependencies: `@nativescript-community/ui-svg`
  (SVG icons/images), `@nativescript-community/ui-canvas` (`<Meter>`),
  and — only if you use `<Drawer>` —
  `@nativescript-community/ui-drawer`.
- The bundled Octane runtime moved to 0.5.0.
- Watch for screens that relied on single-line text: `<Text>` now wraps
  on native by default.
- If your app uses pnpm, declare `cli.packageManager = 'pnpm'` in
  `nativescript.config.ts` — otherwise `ns build` can fail to resolve
  symlinked packages.
- `List`'s `kindFor` prop is removed — branch on the item inside
  `renderItem` when row markup differs.
- Move any `List` nested in `ScrollView` over to `ScrollBox` — native
  now throws on that shape (see above).
- Corners look subtly smoother where you use the shipped radius classes;
  elements that must keep circular corners can opt out with
  `corner-shape: round`.
- Existing apps can opt into the lint rules with
  `pnpm add -D @octane-xplat/lint oxlint` — setup steps are in the
  package README.
