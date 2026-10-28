# @octane-xplat/keyboard

Keep a form above the phone keyboard while it moves. Add the optional keyboard
package around the existing UI wrapper:

```sh
pnpm add @octane-xplat/keyboard
```

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

On supported native hosts, the padding follows measured keyboard frames without
rendering the component on each animation frame. Native tracking uses the public
UIKit keyboard guide on iOS 17+ and AndroidX animation callbacks on Android 11+.
Runtime qualification currently covers iOS 27 and Android API 35 with NativeScript
9.1.3. Older or incompatible native contexts retain destination-only avoidance;
web and desktop retain neutral software-keyboard behavior.

```tsx
// Pausing tracking retains the form's children and the UI wrapper's fallback.
<KeyboardProvider enabled={false}>
	<KeyboardAvoiding>
		<TextInput placeholder="Write a message" />
	</KeyboardAvoiding>
</KeyboardProvider>
```

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

For native integrations, `KeyboardController` separates lifecycle subscriptions
from measured movement. Supply a mounted native host from your platform leaf,
and release subscriptions when that host detaches. These operations activate
tracking for their own lifetime; a Provider is optional for these readers.

```ts
import { KeyboardController } from '@octane-xplat/keyboard'

export function observeHost(host: object) {
	const stop = KeyboardController.subscribe(host, state => {
		console.log(state.phase, state.capabilities.nativeFrames)
	})
	const stopMoving = KeyboardController.onMove(host, state => {
		// Use measured geometry for native work; avoid rendering on every frame.
		const top = state.currentFrame?.y
		if (top !== undefined) updateNativeMeasurement(top)
	})
	return () => { stopMoving(); stop() }
}

function updateNativeMeasurement(_top: number) {}
```

Frames use device-independent coordinates in the owning window. The destination
can change before the measured current frame reaches it. Read capability flags
before depending on native tracking; floating-keyboard tracking and Android interactive dismissal are not yet
qualified. The supported iOS guide path tracks interactive dismissal when its
scroll host enables that gesture. No text contents are collected.

```ts
import { KeyboardController } from '@octane-xplat/keyboard'

export function readHost(host: object) {
	const state = KeyboardController.getSnapshot(host)
	return {
		current: state.currentFrame,
		destination: state.targetFrame,
		canTrackMovement: state.capabilities.nativeFrames,
	}
}
```

The [maintained example](https://github.com/octane-xplat/octane-xplat/blob/main/packages/keyboard/examples/KeyboardMotionDemo.tsrx) uses the shared UI API.
Native layout and presentation limits are recorded in the framework's
[software keyboard notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/keyboard.md).

`FocusedInputController` observes input identity, selection, input/caret bounds,
and scroll ancestors independently of keyboard motion. Coordinates use the
owning window. Caret precision is explicit; browser text fields expose box
bounds without a caret rectangle. Release subscriptions when the host is removed.

```ts
import { FocusedInputController } from '@octane-xplat/keyboard'

export function observeEditing(host: object) {
	return FocusedInputController.subscribe(host, state => {
		console.log(state.inputRect, state.capabilities.caretBounds)
	})
}
```

See the [focused-input guide](https://octane-xplat.goddardai.org/software-keyboard#read-focused-input-geometry)
for capability limits, selection units, and immediate rechecks.

Use `KeyboardAwareScrollView` for long forms. It exposes the focused field or
caret with minimal scrolling, pauses after manual scrolling by default, and
provides a binding ref for explicit visibility rechecks.

```tsx
import { KeyboardAwareScrollView } from '@octane-xplat/keyboard'
import { Field, TextInput } from '@octane-xplat/ui'

export function LongForm() {
	return <KeyboardAwareScrollView clearance={12} extraScrollSpace={40}>
		<Field label="Message"><TextInput placeholder="Write a message" /></Field>
	</KeyboardAwareScrollView>
}
```

The [form guide](https://octane-xplat.goddardai.org/software-keyboard#keep-the-editing-field-visible)
explains scroll policies and the [maintained form example](https://github.com/octane-xplat/octane-xplat/blob/main/packages/keyboard/examples/KeyboardFormDemo.tsrx)
shows an explicit recheck.

`KeyboardStickyView` translates a bottom control independently of surrounding
layout on supported native hosts. Existing transforms compose with its owned
vertical channel; disabling releases that channel. Browser and desktop keep a
neutral View.

```tsx
import { KeyboardStickyView } from '@octane-xplat/keyboard'
import { TextInput } from '@octane-xplat/ui'

export function Composer() {
	return <KeyboardStickyView openOffset={8}>
		<TextInput placeholder="Write a message" />
	</KeyboardStickyView>
}
```

Place it at the screen's bottom. See the [sticky guide](https://octane-xplat.goddardai.org/software-keyboard#keep-a-composer-beside-the-keyboard)
and [maintained composer](https://github.com/octane-xplat/octane-xplat/blob/main/packages/keyboard/examples/KeyboardComposerDemo.tsrx).
