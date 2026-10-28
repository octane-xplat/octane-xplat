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

Projected-host tests cover selection, synchronous event echoes and native-view
replacement. Real WinUI selection, IME composition, secure fields and focus
transitions still need native app checks. This does not supply hardware-key
events, keyboard navigation or modal focus containment.

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

Eight source-logic tests use scripted hooks and fake view metrics. Actual
Windows event delivery, renderer updates, Mason measurements, wheel/touch/key
scrolling, RTL and resize still need native app checks. Use the shared
`ScrollableArea` component when a custom viewport is unnecessary.
