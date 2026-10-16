# Handle keys and copy text

> Show which key was pressed, or tell someone whether their text was copied.

## Copy text with feedback

Spread `clipboardProps` onto a shared `Pressable`. `getItems` produces fresh
text for each press; `onCopy` receives `true` after a successful write and
`false` for unavailable, denied, or failed writes, including a throwing text
producer. This is a text-only copy trigger, with no read, paste, rich-format,
or keyboard-shortcut interception. Clipboard availability depends on the host;
web writes generally require a secure context and a user action.

```tsx
import { Pressable, Text, useClipboard } from '@octane-xplat/ui'

export function CopyGreeting() {
	const { clipboardProps } = useClipboard({
		getItems: () => 'Hello from Xplat',
		onCopy: (success) => console.log(success ? 'Copied' : 'Copy unavailable'),
	})
	return (
		<Pressable {...clipboardProps}>
			<Text>Copy greeting</Text>
		</Pressable>
	)
}
```

For sequencing, await `copy()` or `clipboardProps.onPress()`. Both resolve the
same boolean as `copyText`; `onCopy` runs before that promise resolves. Calls
are independent attempts, without deduplication. Keep notification callbacks
free of thrown errors. [CopyTextDemo](../../packages/ui/examples/CopyTextDemo.tsrx)
shows a visible status message.

```ts
import { useClipboard } from '@octane-xplat/ui'

export function CopyController() {
	const clipboard = useClipboard({ getItems: () => 'Hello' })
	return clipboard.copy
}
```

## Handle hardware keys on web and Linux

Use this example in a `.web.tsrx` file. Spread `keyboardProps` onto a focusable
DOM element, such as `button`. Shared `View`, `TextInput`, and `Pressable` do
not forward this attachment. `isSupported` is true for the web/Linux surface;
native mobile, AppKit, and other native hosts return false with an empty bag.
It describes attachment support, not whether a hardware keyboard is connected.
Software-keyboard layout belongs to `useKeyboardInset`, a separate API.

```tsx
import { useKeyboard } from '@octane-xplat/ui'

export function KeyButton() {
	const { keyboardProps, isSupported } = useKeyboard({
		onKeyDown: (event) => {
			if (!event.isComposing) console.log(event.key, event.code)
		},
	})
	return (
		<button {...keyboardProps} disabled={!isSupported}>
			Press a key
		</button>
	)
}
```

Callbacks receive a normalized `KeyboardEvent`: logical `key`, physical `code`
(empty if unavailable), `altKey`, `ctrlKey`, `metaKey`, `shiftKey`, `repeat`, and
`isComposing`. Prevention and propagation methods act on the original event;
`defaultPrevented` reflects current prevention. Composition also recognizes
legacy key code 229. The payload does not expose a host target. Keep browser
specific event handling in an explicit platform leaf.

```ts
import type { KeyboardEvent } from '@octane-xplat/ui'

export function handleKey(event: KeyboardEvent): void {
	if (event.key === 'Enter' && !event.isComposing && !event.repeat) {
		event.preventDefault()
		event.stopPropagation()
	}
}
```

## Migrate existing handlers

Keyboard handlers previously received `unknown` host events. Remove DOM casts
and consume the normalized fields; check `isSupported` before relying on the
attachment outside web. Clipboard press handlers now return `Promise<boolean>`;
existing calls may ignore it, or await it for dependent work. The existing
`getItems`, `clipboardProps`, and `keyboardProps` names are retained; this
text-only hook is a bounded subset rather than React Aria's full clipboard API.

```ts
import { useClipboard, useKeyboard } from '@octane-xplat/ui'

export function InteractionControllers() {
	const keyboard = useKeyboard({ onKeyUp: (event) => console.log(event.code) })
	const clipboard = useClipboard({ getItems: () => 'Hello' })
	return { keyboard, copy: clipboard.copy }
}
```
