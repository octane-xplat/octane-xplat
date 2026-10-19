# Follow the phone keyboard

> Keep a form above the moving keyboard, with one shared observer per native window.

Add the optional keyboard package when a phone form needs to follow keyboard
movement. It works with the existing UI wrapper. Run this in your app directory:

```sh
pnpm add @octane-xplat/keyboard
```

Wrap your form in `KeyboardProvider`. On supported native hosts, the wrapper's
padding follows measured keyboard movement without rendering on every frame.
The 8-dip offset leaves a small gap above the keyboard. A dip is a layout unit
that stays approximately the same visible size across phone screen densities.

```tsx
import { KeyboardProvider } from '@octane-xplat/keyboard'
import { Field, KeyboardAvoiding, TextInput } from '@octane-xplat/ui'

export function MessageForm() {
	return <KeyboardProvider>
		<KeyboardAvoiding keyboardVerticalOffset={8}>
			<Field label="Message">
				<TextInput placeholder="Write a message" />
			</Field>
		</KeyboardAvoiding>
	</KeyboardProvider>
}
```

Native frame tracking requires iOS 17+ or Android 11+ and a compatible native
host. Older or incompatible contexts keep destination-based avoidance. Browser
and desktop apps keep the ordinary layout wrapper. Runtime qualification so far
covers iOS 27 and Android API 35 with NativeScript 9.1.3; other OS versions,
floating keyboards, Android interactive dismissal, and native presentation
windows still need separate qualification. The iOS guide path has also been
qualified during a real drag-to-dismiss gesture.

To pause native tracking, disable the Provider. Its children remain mounted and
existing UI wrappers retain their fallback behavior. Disabling the wrapper
itself stops avoidance as well.

```tsx
import { KeyboardProvider } from '@octane-xplat/keyboard'
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'

export function PausedForm() {
	return <KeyboardProvider enabled={false}>
		<KeyboardAvoiding enabled={false}>
			<TextInput placeholder="Write a message" />
		</KeyboardAvoiding>
	</KeyboardProvider>
}
```

Keep numeric keyboard space separate from screen padding: an Android window
may already have resized. The existing [keyboard-space guide](./text-entry.md#read-software-keyboard-space)
explains that compatibility API. The maintained
[motion example](../../packages/keyboard/examples/KeyboardMotionDemo.tsrx)
shows the Provider around a shared form.

On iOS, a fresh observer needs one native keyboard completion before it can
advertise measured movement. Until then, avoidance uses the destination, the
current frame is unavailable, and the native-frame capability is false. This
also applies when starting observation over an already-moving keyboard. Readers
that share a running window source reuse its available measurements.

```ts
import { KeyboardController } from '@octane-xplat/keyboard'

export function canFollowMeasuredFrames(host: object) {
	return KeyboardController.getSnapshot(host).capabilities.nativeFrames
}
```

## Observe a native host

For an advanced native integration, supply the mounted host from your platform
leaf. Lifecycle subscribers receive destination and transition changes;
movement subscribers receive measured frames. Release both when the host is
removed. A Provider is optional for these subscriptions, which own their
tracking lifetime.

```ts
import { KeyboardController } from '@octane-xplat/keyboard'

export function observeNativeHost(host: object) {
	const stopState = KeyboardController.subscribe(host, state => {
		console.log(state.phase, state.capabilities.nativeFrames)
	})
	const stopMovement = KeyboardController.onMove(host, state => {
		// Native work can use this measurement. Avoid rendering each frame.
		const measuredTop = state.currentFrame?.y
		if (measuredTop !== undefined) updateNativeMeasurement(measuredTop)
	})
	return () => { stopMovement(); stopState() }
}

function updateNativeMeasurement(_top: number) {}
```

The current frame describes a native measurement; the target describes a
destination that may not yet be reached. Both use device-independent
coordinates in that host's window. Capabilities describe the active adapter;
unknown geometry is represented by `null`. Cached reads do not start observation.

```ts
import { KeyboardController } from '@octane-xplat/keyboard'

export function inspectNativeHost(host: object) {
	const state = KeyboardController.getSnapshot(host)
	return {
		measured: state.currentFrame,
		destination: state.targetFrame,
		canTrackFrames: state.capabilities.nativeFrames,
	}
}
```

## Read focused-input geometry

Use `FocusedInputController` in a platform integration to observe the editing
control, its bounds, the insertion point at the selection end, and its vertical
scroll ancestors. The subscription follows layout changes even when focus stays
on the same field. It reads geometry and selection offsets without collecting
text. Release it when your host is removed.

```ts
import { FocusedInputController } from '@octane-xplat/keyboard'

export function observeEditing(host: object) {
	return FocusedInputController.subscribe(host, state => {
		console.log(state.inputRect, state.caretRect, state.selection)
	})
}
```

Coordinates use the host window's device-independent layout units; scroll owners
are ordered from the nearest viewport outward. Selection positions use UTF-16
offsets. UIKit and AppKit expose native insertion rectangles. Android exposes
an insertion-line rectangle rather than the cursor drawable. Ordinary browser
inputs expose their box and available selection offsets; their caret rectangle
is `null`. Content-editable browser elements use a native collapsed Range when
it has a measurable rectangle. Check the capability before relying on a caret.

```ts
import { FocusedInputController } from '@octane-xplat/keyboard'

export function inspectCaret(host: object) {
	const state = FocusedInputController.getSnapshot(host)
	return { rect: state.caretRect, precision: state.capabilities.caretBounds }
}
```

Cached reads do not start observation. An active subscription can request an
immediate geometry recheck after changing validation or field layout. Unsupported
hosts return `null` geometry and false capabilities. Focus tracking works
independently of the software keyboard, including desktop editing.

```ts
import { FocusedInputController } from '@octane-xplat/keyboard'

export function refreshEditingGeometry(host: object) {
	FocusedInputController.recheck(host)
}
```

## Keep the editing field visible

Use `KeyboardAwareScrollView` for a long form. It combines native keyboard space
with the smallest scroll needed to expose the focused control. When a multiline
control is too tall to fit, it follows the available insertion rectangle. Keep
one scroll wrapper around the form; the component already supplies avoidance.

```tsx
import { KeyboardAwareScrollView } from '@octane-xplat/keyboard'
import { Field, TextInput, TextArea } from '@octane-xplat/ui'

export function ContactForm() {
	return <KeyboardAwareScrollView clearance={12} extraScrollSpace={40}>
		<Field label="Email"><TextInput keyboardType="email" /></Field>
		<Field label="Message"><TextArea placeholder="How can we help?" /></Field>
	</KeyboardAwareScrollView>
}
```

`clearance` is the requested visible gap. `extraScrollSpace` creates additional
bottom scroll range while the native keyboard is open; it is independent of
clearance. Existing `keyboardVerticalOffset` keeps its padding meaning. On web
and macOS, the component uses an ordinary vertical scroll viewport and focus
geometry, with neutral software-keyboard behavior. Browser text fields use their
box because the browser does not expose their insertion rectangle.

```tsx
import { KeyboardAwareScrollView } from '@octane-xplat/keyboard'

export function FormViewport({ children }: { children?: unknown }) {
	return <KeyboardAwareScrollView
		clearance={12}
		extraScrollSpace={40}
		keyboardVerticalOffset={0}
	>{children}</KeyboardAwareScrollView>
}
```

By default a manual scroll pauses enforcement until focus or selection changes.
This lets a reader inspect another part of the form. Call the mounted binding's
`recheck()` after validation or to resume explicitly. Choose `manualScroll="follow"`
only when the editing position should stay visible during manual scrolling.
Keyboard close preserves the position by default. Opt-in restoration returns
only offsets still owned by the binding; manual scrolling clears that history.

```tsx
import { useRef } from 'octane'
import { KeyboardAwareScrollView } from '@octane-xplat/keyboard'
import type { KeyboardScrollBinding } from '@octane-xplat/keyboard'
import { Button, TextInput } from '@octane-xplat/ui'

export function RecheckedForm() {
	const scrolling = useRef<KeyboardScrollBinding | null>(null)
	return <KeyboardAwareScrollView
		manualScroll="pause"
		keyboardClose="preserve"
		ref={binding => { scrolling.current = binding }}
	>
		<TextInput placeholder="Message" />
		<Button clickAction={() => scrolling.current?.recheck()}>Show editing field</Button>
	</KeyboardAwareScrollView>
}
```

For an existing platform viewport, bind `KeyboardScrollController` directly.
Supply the mounted NativeScript scroll view, DOM scroll element, or AppKit
scroll view. This form adjusts existing range; your viewport owns its padding
and keyboard avoidance. Release the binding when the viewport is removed.

```ts
import { KeyboardScrollController } from '@octane-xplat/keyboard'

export function attachFormViewport(host: object) {
	const binding = KeyboardScrollController.bind(host, { clearance: 12 })
	return () => binding.release()
}
```
