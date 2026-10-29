# Windows support status

> Check the Windows boundary before choosing it for an app.

Windows is an experimental target. The current verified setup is the
framework repository's private `apps/windows` harness; it depends on workspace
packages and preview NativeScript versions. It is a framework development
workflow, not a downstream app setup guide.

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
consumer packaging remain unqualified. CheckboxList and CheckboxListItem need
separate keyboard and group qualification.

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
    <Button label="Details" ref={layer.ref} clickAction={layer.show} />
    {layer.render(<>
      <Text>Packing details</Text>
      <Button label="Close" clickAction={layer.hide} />
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
    <Button label="Review name" clickAction={() => setOpen(true)} />
    <Dialog isOpen={open} onOpenChange={setOpen} finalFocusRef={returnTo}>
      <Text>{name}</Text>
      <Button label="Keep editing" clickAction={() => setOpen(false)} />
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
