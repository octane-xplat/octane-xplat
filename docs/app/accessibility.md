# Build and test an accessible screen

> Make a labeled form work with a keyboard and assistive technology, including validation, status and focus recovery.

Build a trip-name form. Submitting it empty explains the problem and returns to
the field; submitting a name shows a visible confirmation without moving focus
away from the action. A named clear action resets the form. The example keeps
its result in memory; it does not pretend to save a trip to a server or disk.

You need a configured app and its normal UI/theme setup. Start with shared
controls, which already supply their platform semantics. A passing typecheck or
DOM test does not establish that VoiceOver or TalkBack announces the screen
correctly; the [manual journey](#check-the-screen-with-real-input) closes that
separate question on each intended target.

## Build the first form

Copy [AccessibleTripForm.tsx](../../packages/demos/src/accessibility-guide/AccessibleTripForm.tsx)
into your app as `src/AccessibleTripForm.tsx`, then render it inside the existing
screen/layout. For the starter, replace the content inside `src/App.tsrx`'s
existing `SafeArea`; for a routed app, render it from a route:

```tsx
import { AccessibleTripForm } from './AccessibleTripForm'

export function TripScreen() {
  return <AccessibleTripForm />
}
```

The maintained form uses the field's `label`, `description`, required state and
validation `status` together. A placeholder is a hint that disappears during
entry; it is not the field's label. This is the field inside that form:

```tsx
import { TextInput } from '@octane-xplat/ui'

export function TripNameField(props: {
  value: string
  onChange: (value: string) => void
  error: string | null
}) {
  return <TextInput
    label="Trip name"
    description="For example, Kyoto weekend. Required."
    isRequired
    value={props.value}
    onChange={props.onChange}
    status={props.error ? { type: 'error', message: props.error } : undefined}
  />
}
```

On web, the field creates visible label/description/status elements and links
them to the input. An error status also sets `aria-invalid`. Native controls use
the shared label/hint vocabulary; not every ARIA state has a native equivalent.
Keep the error message visible and qualify what the screen reader actually
conveys. W3C's [labeling guidance](https://www.w3.org/WAI/tutorials/forms/labels/)
explains why a control needs an associated name.

Run the app and activate **Use trip name** with the field empty. Expect a visible
error, focus on **Trip name**, and a requested error announcement. Enter
**Kyoto weekend** and submit again. Expect **Trip name selected: Kyoto weekend.**
The success does not navigate, replace the screen, or take focus to a status label.

## Preserve useful focus and status

Keep the typed input ref when validation needs to return to a field. Call its
portable `focus()` handle rather than accessing a DOM element in shared code:

```tsx
import { useRef } from 'octane'
import { Button, TextInput } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export function EditTripName() {
  const input = useRef<TextInputHandle | null>(null)
  return <>
    <TextInput label="Trip name" ref={(handle) => { input.current = handle }} />
    <Button label="Edit trip name" clickAction={() => input.current?.focus()} />
  </>
}
```

Use a visible status plus `useAnnounce()` when an action changes information
without opening a new screen. Do not move focus just to make a success message
speak. The form's error uses assertive urgency; routine success uses the default
polite channel:

```tsx
import { useState } from 'octane'
import { Button, Text, useAnnounce } from '@octane-xplat/ui'

export function SelectionStatus() {
  const [status, setStatus] = useState('No trip selected.')
  const announce = useAnnounce()
  return <>
    <Button label="Select Kyoto trip" clickAction={() => {
      setStatus('Kyoto trip selected.')
      announce('Kyoto trip selected.')
    }} />
    <Text>{status}</Text>
  </>
}
```

The web hook uses persistent live regions, including separate polite/assertive
channels. Native forwards nonempty text through its platform announcement
service; it does not implement web politeness or explicit region clearing.
Delivery, timing and repeated-message behavior must be checked with assistive
technology. See [status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
and the [announcement platform notes](../platform/platform-services.md#announce-a-status).

## Name actions and show unavailable work

Give an icon-only action a meaningful name. The maintained form's clear button
uses a label even though its visible content is a glyph. It disables clearing
when there is nothing to clear:

```tsx
import { Button, Text } from '@octane-xplat/ui'

export function ClearNameAction(props: { hasName: boolean; clear: () => void }) {
  return <Button label="Clear trip name" isIconOnly icon={<Text>×</Text>}
    isDisabled={!props.hasName} clickAction={props.clear} />
}
```

For real asynchronous work, a `Button` action can return its promise. The button
shows loading and blocks duplicate activation while it is pending. Handle the
failure and keep a visible result. This reusable button accepts the actual save
operation from its app owner; it does not invent a successful backend:

```tsx
import { useState } from 'octane'
import { Button, Text } from '@octane-xplat/ui'

export function SaveTripAction(props: { save: () => Promise<void> }) {
  const [status, setStatus] = useState('Ready to save.')
  return <>
    <Button label="Save trip" clickAction={async () => {
      setStatus('Saving trip…')
      await props.save()
      setStatus('Trip saved.')
    }} onActionError={() => setStatus('Could not save. Try again.')} />
    <Text>{status}</Text>
  </>
}
```

Use a status message that explains why an unavailable action cannot run; color
or a spinner alone is insufficient. Loading/disabled state dispatch and speech
are different checks. In particular, native accessibility state mappings are
narrower than ARIA; do not assume every web busy/invalid state is spoken there.

## Qualify modal focus separately

A dialog needs a name and a bounded dismissal path. A web modal overlay isolates
focus and returns to its opener on dismissal. This shared review surface has a
visible title and close action; its parent supplies the open/close state:

```tsx
import { Button, Overlay, Text } from '@octane-xplat/ui'

export function ReviewTrip(props: { open: boolean; close: () => void }) {
  if (!props.open) return null
  return <Overlay open isModal accessibilityLabel="Review trip" onDismiss={props.close}>
    <Text>Review trip</Text>
    <Text>Check the selected trip before continuing.</Text>
    <Button label="Close review" clickAction={props.close} />
  </Overlay>
}
```

Test Tab/Shift+Tab, Escape and focus return in the browser. Native automatic
focus restoration/isolation is not qualified by the web checks; AppKit ignores
this overlay's `isModal` behavior. Keep an explicit **Edit trip name** recovery
action, as above, and test it after the native surface has closed. Follow
[shared overlay focus and naming](primitives.md#give-a-web-overlay-a-title-and-description)
for the host boundaries. Opening a dialog does not justify losing a typed field
value or leaving keyboard focus in hidden content.

## Respect motion, text size and contrast

The first form has no decorative movement. If you add animation, install the
motion leaf and observe the user's preference for imperative movement. This
example jumps to the new position when reduced motion is requested:

```sh
pnpm add @octane-xplat/motion
```

```tsx
import { Button, Text } from '@octane-xplat/ui'
import { motion, useMotionValue, useReducedMotion } from '@octane-xplat/motion'

export function MoveStatus() {
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  return <>
    <Button label="Move status" clickAction={() => {
      if (reduced) x.jump(20)
      else x.animate(20, { type: 'spring' })
    }} />
    <motion.View style={{ x }}><Text>Trip ready</Text></motion.View>
  </>
}
```

Follow [motion policies](animation-gestures.md#reduced-motion-and-lifecycle) for the
provider-based alternative and supported host behavior. Do not infer an
experimental desktop animation or preference pass from a mobile/web build.

Keep layouts flexible around text. Avoid fixed-height text containers, preserve
scrolling when content grows, and test browser zoom and the phone's large-text
settings. Do not assume a shared font-size value proves OS text scaling on every
host. Check long labels, validation messages and localized text for clipping.
Use [localization](localization.md) when replacing the example's English strings.

For normal form text, target at least 4.5:1 contrast against its background;
W3C's [contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
explains the large-text exceptions. Keep visible keyboard focus when changing
theme colors, and communicate errors with words as well as color. Verify both
light/dark themes and the actual control/background colors. These are runtime
checks, not evidence that this guide or a palette name establishes conformance.

## Check the screen with real input

Use a bounded journey on each intended target:

1. **Keyboard:** reach the field and actions in a logical order using Tab and
   Shift+Tab. Confirm visible focus and no trap. Activate **Use trip name** with
   Enter/Space as appropriate for the focused button; Enter in the single-line
   field submits through its `onSubmit` handler.
2. **Error:** submit empty. Focus returns to **Trip name**, its error is visible,
   and the associated error is available to the screen reader. Correct the value
   without losing text unexpectedly.
3. **Success:** submit **Kyoto weekend**. Confirm the visible status and requested
   announcement, while focus stays on the action/field that submitted. The
   icon-only clear action must be named **Clear trip name**, not **×**.
4. **State:** clear the field and verify the clear action cannot run again while
   empty. For a real save integration, check pending, failed and successful
   states, including a second activation while work is pending.
5. **Assistive technology:** repeat with VoiceOver on iOS, TalkBack on Android,
   and a screen reader/browser combination you support. Check name, role,
   required/error description, action state, reading order and status delivery.
   Do not count a dispatched handler or an accessibility-tree node as speech.
6. **Dialog:** if using review, open it, traverse its controls, dismiss it and
   verify focus recovery. Check hidden background content is not operable on
   that host; keep unqualified native behavior visible in the release record.
7. **Display preferences:** repeat with large text/browser zoom, long localized
   messages, reduced motion, and both themes. Check readable content, reachable
   actions and contrast without relying on screenshots as the only evidence.

Use DOM assertions for labels, descriptions, invalid state, focus and live
regions. Use maintained host tests for platform dispatch. Record actual
keyboard, OS input and assistive-technology delivery separately. The maintained
form is typechecked; source/DOM component checks do not qualify VoiceOver,
TalkBack, browser speech/braille, text scaling or focus behavior on an unrun host.
