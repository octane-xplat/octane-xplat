# Windows support status

> Check the Windows boundary before choosing it for an app.

Windows is an experimental target. The current verified setup is the
framework repository's private `apps/windows` harness; it depends on workspace
packages and preview NativeScript versions. It is a framework development
workflow, not a downstream app setup guide.

The harness keeps its patched Core layout module and app-local x64 Widgets
binaries together. Its build rejects a stale installed Core module before
bundling. After pulling framework changes, refresh dependencies from the
project's frozen lockfile; do not copy an older native pair over the selected
repair. Framework contributors can inspect the
[layout repair and verification limits](../../.agents/docs/windows-layout-repair.md).

`create-octane-xplat` does not currently offer Windows as a selectable target.
The CLI can detect a manually configured NativeScript Windows app, but that
alone does not establish a supported downstream setup. You do not need to clone
the Octane Xplat monorepo just because the framework's own test-harness steps
use it; a supported downstream Windows workflow is not documented yet.

For current app target availability and limits, see
[Choose your targets](../start/spec.md#choose-your-targets). Framework
contributors can use the
[internal Windows test-host runbook](../../.agents/docs/windows-test-host.md).

For current repository implementation candidates and deferred Windows checks,
see the [Windows progress note](../../.agents/docs/parity/windows-support-progress.md).
These candidates do not change the experimental support boundary.

## Text wrapping

The repository's Windows harness uses MasonKit `1.0.0-beta.129` to wrap shared
`Text` in constrained columns and shrinking rows. Use the ordinary shared
components; CSS supplies the available width and flex behavior:

```tsrx
import { Text, View } from '@octane-xplat/ui'

export function WrappedNote() @{
  <>
    <style>
      .note-row { display: flex; width: 220px; flex-direction: row; }
      .note-copy { font-size: 14px; line-height: 20px; flex-shrink: 1; }
    </style>
    <View className="note-row">
      <Text className="note-copy">
        Shared typography should wrap within the available space.
      </Text>
    </View>
  </>
}
```

Packaged x64 checks passed for start/center-aligned columns and a shrinking
row, with 220×40-DIP text bounds matching web and full text names exposed through
Windows UI Automation. This is bounded wrapping evidence. Text updates,
remount, resizing, glyph parity and Narrator remain unqualified; ARM64 has
build evidence only.

## Buttons and links

In the configured Windows harness, `Button` and `Pressable` support native
keyboard focus, Enter/Space, mouse clicks and UI Automation Invoke. This
example increments the visible count from either action:

```tsrx
import { useState } from 'octane'
import { Button, Pressable, Text, VStack } from '@octane-xplat/ui'

export function WindowsActions() @{
  const [count, setCount, getCount] = useState(0)
  const activate = () => setCount(getCount() + 1)
  <VStack width="100%" gap={2}>
    <Text>{`Activated ${count} times`}</Text>
    <Button onPress={activate}>Save</Button>
    <Pressable accessibilityLabel="Refresh" onPress={activate}>
      <Text>Refresh</Text>
    </Pressable>
  </VStack>
}
```

`Link` exposes a native Hyperlink with Invoke, and primitive children supply
its text. When your app already supplies a compiled router-link component,
pass it through `as`; that component receives `href` and owns navigation:

```tsrx
import { Link, type LinkProps } from '@octane-xplat/ui'

export function HelpLink(props: { routerLink: LinkProps['as'] }) @{
  <Link as={props.routerLink} href="/help">Help</Link>
}
```

Bounded packaged x64 OS/UIA checks cover the three actions, including updates,
remounts, resizing and disabled input for Button
and Pressable. Link has no public disabled prop; its injected navigation
callback passed keyboard, mouse and Invoke checks. External URL launching,
Narrator, visual review, touch/pen, other architectures and the full props
matrix remain unqualified beyond the core-20 gate; downstream setup remains
open. A final core-20 gate qualified all 20 components on one packaged MSIX (1.0.0.196, fresh frozen install at literal `main` commit `2a5f1219e`, sha 42ae47f264d99c83b1c5376381323e562a0a91bffea7f69c8f751406a17d44fe): OS keyboard/mouse/UIA input, named peers, bounded frames, prop/name/state updates, remount and resize. See the
[action evidence and limits](../../.agents/docs/parity/windows-support-progress.md#native-action-contracts).

## Card padding candidate

`Card` and `ClickableCard` use padding steps of 4 DIP on Windows. Header, body
and footer slots accept plain text, numbers or supplied components:

```tsx
import { Card, ClickableCard } from '@octane-xplat/ui'

export function Summary() {
  return <>
    <Card padding={2} header="Pending" footer="Updated just now">{0}</Card>
    <ClickableCard label="Open summary" padding={2} onPress={() => console.log('Opened')}>
      Open summary
    </ClickableCard>
  </>
}
```

Packaged x64 checks cover slot order, padding updates, wrapping, remounting
and the clickable control shape. Keyboard/mouse/Invoke activation, the full
props matrix, Narrator and visual review remain unqualified. A final core-20 gate qualified all 20 components on one packaged MSIX (1.0.0.196, fresh frozen install at literal `main` commit `2a5f1219e`, sha 42ae47f264d99c83b1c5376381323e562a0a91bffea7f69c8f751406a17d44fe): OS keyboard/mouse/UIA input, named peers, bounded frames, prop/name/state updates, remount and resize.

## Avatars and raster images candidate

Use `Avatar.name` for initials when no image is supplied. A base64 data URI
loads through the Windows async image loader; `Image.alt` supplies the image's
accessible name. This example uses a tiny embedded bitmap so it needs no network
or asset setup:

```tsx
import { Avatar, Image } from '@octane-xplat/ui'

const bitmap = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOQL9z6HwAEPQJFam2brwAAAABJRU5ErkJggg=='

export function People() {
  return <>
    <Avatar name="Ada Lovelace" size="lg" />
    <Avatar name="Grace Hopper" src={bitmap} size="lg" />
    <Image src={bitmap} alt="Example image" decoding="async" style={{ width: 40, height: 40 }} />
  </>
}
```

Bounded packaged x64 checks cover bitmap decoding, image and initials names,
finite bounds, updates, remounting and resizing. Explicit synchronous
decoding, placeholders, fallback after a failed load, SVG accessibility,
Narrator and visual review remain unqualified. A final core-20 gate qualified all 20 components on one packaged MSIX (1.0.0.196, fresh frozen install at literal `main` commit `2a5f1219e`, sha 42ae47f264d99c83b1c5376381323e562a0a91bffea7f69c8f751406a17d44fe): OS keyboard/mouse/UIA input, named peers, bounded frames, prop/name/state updates, remount and resize.

## Badge text candidate

Windows `Badge` keeps text and numbers in native text controls, including the
number zero. Supplied components keep their own content:

```tsx
import { Badge } from '@octane-xplat/ui'

export function PendingCount() {
  return <Badge>{0}</Badge>
}
```

Compiled component checks cover content updates and mixed children. Packaged
x64 checks expose string and zero counts through UI Automation across updates,
remounting and resizing. A final core-20 gate qualified all 20 components on one packaged MSIX (1.0.0.196, fresh frozen install at literal `main` commit `2a5f1219e`, sha 42ae47f264d99c83b1c5376381323e562a0a91bffea7f69c8f751406a17d44fe): OS keyboard/mouse/UIA input, named peers, bounded frames, prop/name/state updates, remount and resize.

## Banner candidate

Use `Banner` for a titled notice with supporting text, a trailing action and
optional dismissal. Its body starts behind a Details button; set
`collapsible={false}` to keep the body visible:

```tsx
import { Banner, Button, Text } from '@octane-xplat/ui'

export function SavedNotice() {
  return <Banner
    title="Changes saved"
    description="Your draft is ready."
    isDismissable
    collapsible={false}
    onDismiss={() => console.log('Notice dismissed')}
    endContent={<Button label="Review" onPress={() => console.log('Review draft')} />}
  >
    <Text>You can continue editing.</Text>
  </Banner>
}
```

The Windows leaf uses the native action controls for dismissal and Details.
Compiled component tests cover content updates, composed slots, details and
dismissal lifecycle. Packaged Banner input, geometry, screen-reader and visual
are satisfied on the core-20 gate. A final core-20 gate qualified all 20 components on one packaged MSIX (1.0.0.196, fresh frozen install at literal `main` commit `2a5f1219e`, sha 42ae47f264d99c83b1c5376381323e562a0a91bffea7f69c8f751406a17d44fe): OS keyboard/mouse/UIA input, named peers, bounded frames, prop/name/state updates, remount and resize.

## Media-query candidate

The repository has an experimental Windows `useMediaQuery` leaf for DIP
window dimensions, orientation, pointer/hover capabilities and reduced motion.
It prefers mouse, then pen, then touch as the primary pointer; a hybrid device
can match both fine and coarse `any-pointer` queries. Unknown capabilities and
unsupported features do not match, including under `not`.

```tsx
import { Text, useMediaQuery } from '@octane-xplat/ui'

export function InputLayout() {
  const compactTouch = useMediaQuery(
    '(max-width: 1024px) and (pointer: coarse) and (hover: none)',
  )
  return <Text>{compactTouch ? 'Compact touch layout' : 'Standard layout'}</Text>
}
```

The leaf samples Windows animation preferences, allowing the existing
`useStreamingText` reduced-motion branch to settle text immediately when the
host reports animations disabled. It refreshes on primary-root layout, the
preview core's resize event and app launch/resume. Live device hotplug and
settings-change delivery are unqualified.

```tsx
import { Text, useStreamingText } from '@octane-xplat/ui'

export function Reply(props: { text: string; isStreaming: boolean }) {
  const visibleText = useStreamingText(props.text, props.isStreaming)
  return <Text>{visibleText}</Text>
}
```

Standalone NativeScript x64 capability checks passed with a synthetic screen
size. Hook rendering, actual geometry/resize, OS input and accessibility remain
unqualified. See the
[Windows evidence record](../../.agents/docs/parity/windows-support-progress.md).

## Controlled-input candidate

Windows controlled inputs have a selection-preserving write helper. When a
changed value is written to a TextBox, it attempts to restore the previous caret
or selected range, clamped to the new text length. An unchanged value is left
alone. Use the ordinary shared input API:

```tsx
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function DisplayName() {
  const [name, setName] = useState('Ruby')
  return <TextInput label="Display name" value={name} onChange={setName} />
}
```

A bounded x64 packaged WinUI run passed physical typing/submit, public isolated
blur/focus, an OS-selected range retained across a controlled value write,
readonly/disabled rejection, multiline Enter and consumed raw Return. IME,
editable secure fields, remount and multiple-window behavior remain unqualified.
Raw native key events do not supply the portable hardware-key contract.

## Panel tabs candidate

Use `role="tablist"` for tabs that switch content within the current page.
The experimental Windows adapter keeps the shared header content and exposes
native tab-selection peers. Your component owns both the selected value and
the matching panel:

```tsrx
import { useState } from 'octane'
import { Tab, TabList, Text, VStack } from '@octane-xplat/ui'

export function DetailsTabs() @{
  const [tab, setTab] = useState('summary')
  <VStack width="100%">
    <TabList role="tablist" layout="fill" value={tab} onChange={setTab}>
      <Tab value="summary" label="Summary" panelId="summary-panel" />
      <Tab value="files" label="Files" panelId="files-panel" />
      <Tab value="later" label="Coming soon" isDisabled />
    </TabList>
    @if (tab === 'summary') {
      <Text id="summary-panel">Summary content</Text>
    } @else {
      <Text id="files-panel">Files content</Text>
    }
  </VStack>
}
```

The adapter uses one Tab stop. Left/Right, Home and End request selection and
skip disabled tabs. The caller can reject a request by retaining its current
value. Omitting `role="tablist"` keeps the existing navigation-tab path.

Bounded packaged x64 checks passed native selection, one Tab stop, keyboard
and mouse input, disabled rejection, controlled updates and remounting with the
shown fill layout. The run reused a compiled native payload; a fresh source
build remains a separate gate. Structural insertion/reordering, rich-header
geometry, alternate layouts, overflow behavior, panel relations,
Narrator, visual parity and the full props matrix remain unqualified. This
candidate does not establish the final fresh-install core-component run.

## Switch input

The Windows `Switch` keeps the shared track and thumb, with a
transparent native input for focus, Space activation and Windows automation.
Use the same controlled or uncontrolled props as on other targets:

```tsx
import { useState } from 'octane'
import { Switch } from '@octane-xplat/ui'

export function Notifications() {
  const [enabled, setEnabled] = useState(false)
  return <Switch label="Notifications" value={enabled} onChange={setEnabled} />
}
```

Bounded checks in a packaged x64 WinUI app passed physical pointer input,
Tab/Space, Windows TogglePattern automation, accessible names, controlled and
uncontrolled state, read-only/disabled guards, async rejection rollback and
remount. Normal and small inputs matched their tracks' measured bounds.
Screen-reader announcements, visual parity, dynamic resizing, the full field
prop contract, other architectures and downstream packaging remain unqualified.

## Checkbox input

The Windows `CheckboxInput` keeps the shared indicator and label,
with a native checkbox for keyboard input and Windows toggle automation.
Use `'indeterminate'` for a partially selected checkbox; activating it requests
`true` through `onChange`:

```tsx
import { useState } from 'octane'
import { CheckboxInput } from '@octane-xplat/ui'

export function SelectItems() {
  const [selected, setSelected] = useState<boolean | 'indeterminate'>('indeterminate')
  return <CheckboxInput label="Select items" value={selected} onChange={setSelected} />
}
```

Bounded packaged x64 checks passed native CheckBox/TogglePattern names and
state, pointer/Tab/Space input, controlled and uncontrolled state, mixed-state
acceptance/rejection, readonly/disabled guards, hidden labels, label async
rollback and remount. Native input bounds matched the measured rows.
The complete field prop contract, resizing, mixed-state async rejection,
concurrent actions/disposal, screen-reader and visual parity, and downstream
consumer packaging remain unqualified. See the separate
[checkbox-list input boundary](#checkbox-lists) for group and child items.

## Checkbox lists

On Windows, `CheckboxList` options and `CheckboxListItem` children use the shared
checkbox appearance with a native checkbox for keyboard and toggle automation.
Keep selected values in the group. Omit an item's `value` to give it its own
`isChecked` and `onCheck`, as with the select-all control below:

```tsx
import { useState } from 'octane'
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

const channels = ['email', 'sms']

export function DeliveryChoices() {
  const [selected, setSelected] = useState<string[]>(['email'])
  const all = selected.length === channels.length
  return <CheckboxList ariaLabel="Delivery channels" value={selected} onValueChange={setSelected}>
    <CheckboxListItem
      label="Select all"
      isChecked={all ? true : selected.length ? 'indeterminate' : false}
      onCheck={checked => setSelected(checked ? channels : [])}
    />
    <CheckboxListItem value="email" label="Email" />
    <CheckboxListItem value="sms" label="Text message" />
  </CheckboxList>
}
```

Bounded packaged x64 checks cover option and child-item input, controlled and
uncontrolled selection, compact rows, disabled/read-only guards, select-all,
prop updates, remount and pointer targets after keyed option reorder.
The complete field/prop contract, grouping announcements, screen-reader and
visual parity, other Windows versions/architectures and downstream consumers
remain unqualified.

## Mouse dragging

Shared `gestures`, `onPan`, and `onPinch` attachments currently reject Windows explicitly. The new ownership API needs a qualified Windows adapter; the older native widget pointer transport is not that adapter. Keep a semantic alternative when a screen also offers dragging on other platforms.

```tsx
import { Button, Text, View } from '@octane-xplat/ui'

export function PositionControls(props: { move(amount: number): void }) {
  return <View>
    <Text>Move the item</Text>
    <Button onPress={() => props.move(-10)}>Move left</Button>
    <Button onPress={() => props.move(10)}>Move right</Button>
  </View>
}
```

The Slider retains its private native pointer transport. Earlier bounded packaged x64 checks cover mouse movement beyond its bounds, release, capture loss, recovery, and controlled numeric dragging. They do not qualify the new shared gesture API, hardware touch, pen, multiple contacts, screen-reader or visual parity. See [shared gesture limits](../app/gestures.md) and the [Slider section](#slider-input).

## Slider input

The experimental Windows `Slider` uses the shared track and thumb design.
It accepts a number or a two-number range. `defaultValue` keeps local state;
with `value`, the caller must accept changes through `onValueChange`. Dragging
moves from the current value, so pressing the track does not jump the thumb.
Use `label` to name the control; range thumbs add “lower value” and “upper value”
to that name.

```tsx
import { Slider } from '@octane-xplat/ui'

export function SoundSettings() {
  return <>
    <Slider label="Volume" defaultValue={50} step={5} valueDisplay="text" />
    <Slider
      label="Playback range"
      defaultValue={[20, 80]}
      step={5}
      marks={[{ value: 0, label: 'Start' }, { value: 100, label: 'End' }]}
      valueDisplay="tooltip"
      formatValue={(value) => `${value}%`}
    />
  </>
}
```

Tab focuses each enabled thumb. Arrow keys change the value by `step`, or 1%
of the full range when no positive step is set; Home and End choose that thumb's
bounds. The range thumbs cannot cross. `isReadOnly` keeps the control focusable
and rejects changes; `isDisabled` also excludes it from input. These states
can be inherited from `Field`.

```tsx
import { Field, Slider } from '@octane-xplat/ui'

export function SavedVolume() {
  return <Field label="Saved volume" isReadOnly>
    <Slider defaultValue={50} valueDisplay="text" />
  </Field>
}
```

Bounded packaged x64 checks cover Tab/arrows/Home/End, value automation,
controlled acceptance/rejection, local defaults, disabled/read-only guards,
scalar and nearest-thumb range dragging, release focus, fractional steps,
marks/readouts, inline width and remount.
The preview's native RangeValue pattern still reports `IsReadOnly=false` for
read-only sliders even though changes are rejected. Complete Field/prop
coverage, Narrator and visual parity, hardware touch/pen, other Windows
versions/architectures and downstream consumers remain unqualified.

## Floating-layer candidate

Windows `useLayer` selects the NativeScript popup implementation. Put its trigger
inside a `Screen`, which supplies the overlay host. Anchored layers use the
shared Popover; fixed and custom positions use a portal on the declaring page.
Closing the top layer attempts to return focus to the earlier control in the
same visible, active window. A removed or disabled control is skipped.

```tsx
import { Button, Screen, Text, useLayer } from '@octane-xplat/ui'

export function Details() {
  const layer = useLayer({ mode: 'context', lightDismiss: true })
  return <Screen>
    <Button label="Details" ref={layer.ref} onPress={layer.show} />
    {layer.render(<>
      <Text>Packing details</Text>
      <Button label="Close" onPress={layer.hide} />
    </>, { placement: 'below' })}
  </Screen>
}
```

Resolver checks confirm the Windows leaf and its NativeScript helpers. Focus
return tests use mocked Windows objects. Actual WinUI mounting, positioning,
context updates, dismissal and focus still need native app checks. Initial
focus, Tab containment and Escape/IME behavior remain unqualified. This does not
qualify every menu or tooltip that uses layers.

## Modal candidate

Put a Windows `Dialog` inside a `Screen`, which supplies its overlay host.
An explicit `finalFocusRef` identifies the control that should regain focus
after the backdrop finishes closing, so the next background click can reach its
control.

```tsx
import { useRef, useState } from 'octane'
import { Button, Dialog, Screen, Text, TextInput, type TextInputHandle } from '@octane-xplat/ui'

export function ReviewName() {
  const [name, setName] = useState('Ruby')
  const [open, setOpen] = useState(false)
  const returnTo = useRef<TextInputHandle | null>(null)
  return <Screen>
    <TextInput label="Name" value={name} onChange={setName} ref={returnTo} />
    <Button label="Review name" onPress={() => setOpen(true)} />
    <Dialog isOpen={open} onOpenChange={setOpen} finalFocusRef={returnTo}>
      <Text>{name}</Text>
      <Button label="Keep editing" onPress={() => setOpen(false)} />
    </Dialog>
  </Screen>
}
```

A bounded x64 packaged WinUI run passed pointer opening, initial focus,
repeated Tab containment, rejection of background focus, physical Escape
and explicit target return and default trigger return. Required dialogs, nested overlays, multiple windows, IME and visual/layout
parity remain unqualified. This evidence does not qualify `useLayer`, every
menu, or the portable keyboard API. Track the remaining gates in
[Windows #61](https://github.com/octane-xplat/octane-xplat/issues/61).

## Custom scroll viewport candidate

For a custom Windows native viewport, spread both `useScrollableArea` getters.
The viewport props observe scrolling and lifecycle changes; the content props
observe content growth even when the viewport keeps the same size. Set the
viewport's height and orientation yourself. The hook reports overflow and edge
state; it does not configure keyboard access, overscroll chaining or sticky
containment on Windows.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// NotesViewport.windows.tsx
import { Screen, Text, useScrollableArea } from '@octane-xplat/ui'
import './notes-viewport.css'

const notes = Array.from({ length: 24 }, (_, index) => `Note ${index + 1}`)

export function NotesViewport() {
  const area = useScrollableArea({ axis: 'block' })
  return <Screen>
    <Text>{area.state.block.isScrollable ? 'Scroll for more notes.' : 'All notes fit.'}</Text>
    <scrollview {...area.getViewportProps({ className: 'notes-viewport', orientation: 'vertical' })}>
      <masonview {...area.getContentProps({ className: 'notes-content' })}>
        {notes.map(note => <Text key={note}>{note}</Text>)}
      </masonview>
    </scrollview>
  </Screen>
}
```

```css
/* notes-viewport.css */
.notes-viewport { height: 240px; }
.notes-content { display: flex; flex-direction: column; gap: 12px; }
```

A bounded x64 packaged WinUI run advanced both component and headless viewports
from offset 0 to 72 with physical wheel input. It measured content height 816
and viewport height 160; the hook reported overflow and leaving the start edge.
An earlier run logged a dropped loaded-event transaction warning. After load
publication was deferred, the later 13-group run passed without that warning.
These bounded assertions are not a clean-runtime or full lifecycle verdict.
Content growth, remount, resize, touch/key scrolling, horizontal/RTL behavior and other architectures remain unqualified. Use the shared
`ScrollableArea` component when a custom viewport is unnecessary.

## Radio choices

The experimental Windows `RadioList` uses the shared indicator and row content
with a native radio input for each option. Choose `options` for a simple list
or `RadioListItem` children for rows with supporting text and trailing content.
With `value`, keep the selected option in the caller and accept changes through
`onValueChange`; `defaultValue` seeds local selection.

```tsx
import { useState } from 'octane'
import { RadioList, RadioListItem } from '@octane-xplat/ui'

export function NotificationPreference() {
  const [channel, setChannel] = useState('email')
  return <RadioList ariaLabel="Notifications" value={channel} onValueChange={setChannel}>
    <RadioListItem value="email" label="Email" description="Send a daily digest" />
    <RadioListItem value="sms" label="Text message" />
    <RadioListItem value="push" label="Push notification" isDisabled />
  </RadioList>
}
```

Arrow keys move between enabled options and stop at the ends. Tab visits one
option per group. Read-only groups retain focus navigation and reject changes;
disabled options reject input. The complete Field/props contract, Narrator and
visual parity, other Windows versions/architectures and downstream consumers
remain unqualified. See the [Windows progress record](../../.agents/docs/parity/windows-support-progress.md)
for the bounded evidence and remaining gaps.

## Segmented choices

The experimental Windows `SegmentedControl` keeps the shared track and segment
design and puts a native radio input over each segment. That gives each segment
keyboard focus, arrow-key selection and a screen-reader name, including
icon-only segments.

```tsx
import { useState } from 'octane'
import { SegmentedControl } from '@octane-xplat/ui'

export function CalendarRange() {
  const [range, setRange] = useState('week')
  return <SegmentedControl ariaLabel="Range" layout="fill" value={range} onValueChange={setRange}
    options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month', isDisabled: true }]} />
}
```

Left and Right move between enabled segments and stop at the ends. Tab visits
one segment per control. Read-only controls keep focus navigation and reject
changes, and disabled segments reject input. Long labels can be wider than a
fill segment, and how they overflow is not yet checked. Narrator, visual parity, other
Windows versions/architectures and downstream consumers also remain unqualified.

## Single selection candidate

A single-choice Selector can keep its selected value in application state.
The Windows candidate uses a native ComboBox for input while retaining the
framework's trigger and option content. Press F4 or click to open it, use arrow
keys to preview enabled options, press Enter to commit, and Escape to cancel.
Put this component in your screen:

```tsx
import { useState } from 'octane'
import { Selector } from '@octane-xplat/ui'

export function Choice() {
  const [value, setValue] = useState<string | null>('first')
  return <Selector selectionMode="single" value={value} onValueChange={setValue}
    options={[{ value: 'first', label: 'First' }, { value: 'third', label: 'Third' }]} />
}
```

This candidate is experimental. Search, multiple selection, clear controls,
empty lists and groups still use the shared native view and retain its input
limits. The bounded native input checks do not establish the full props matrix,
long-list scrolling, Narrator, visual parity or the final fresh-install
core-component qualification.

## Action menu candidate

For a small menu of commands, use flat action rows. The Windows candidate keeps
the shared Button and row content, with native menu-item input and automation:

```tsx
import { DropdownMenu } from '@octane-xplat/ui'

export function Actions() {
  return <DropdownMenu button={{ label: 'Actions' }} label="Document actions"
    items={[
      { type: 'action', key: 'rename', label: 'Rename', onSelect: () => console.log('Rename') },
      { type: 'action', key: 'remove', label: 'Remove', isDisabled: true },
    ]} />
}
```

This candidate still needs its packaged public-component input checks. The
private native-engine checks do not qualify the public component. Links,
sections, choices, submenus, compound content, keep-open rows, sheet/adaptive
presentation and custom surface styling, width, alignment or non-bottom
placement use the shared view and retain its input limits. The full props
matrix, Narrator, visual parity and final fresh-install qualification remain
pending.

## Platform services

The shared platform services run on the packaged Windows harness:

```ts
import { clipboard, connectivity, device, keepAwake, random, storage } from '@octane-xplat/platform'
import { files } from '@octane-xplat/files'
```

Text clipboard writes and reads, including empty values, behave as documented —
an empty or non-text read returns `null`. Random bytes, keep-awake requests,
connectivity state, device metadata and packaged app identity are qualified on
the installed package. `files` reads and writes text and binary content in the
app's private directories; its file picker and export entry points report
bounded unavailability on Windows. Preferences and key-value `storage` persist
across app relaunches through a JSON document in the app's local state; NativeScript's
upstream `ApplicationSettings` path is unusable on Windows, so persistence is
asynchronous and `flush()` reports `false`.

Qualification is bounded: nontext clipboard formats, auth prompts, suspend and
resume, physical sleep behavior, chunked file reads, cancellation and other
CPU architectures are not yet exercised on Windows.
