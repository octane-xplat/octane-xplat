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
	const { clipboardProps, isCopied } = useClipboard({
		getItems: () => 'Hello from Xplat',
		announce: 'Copied',
		onCopy: (success) => {
			if (!success) console.log('Copy unavailable')
		},
	})
	return (
		<Pressable {...clipboardProps}>
			<Text>{isCopied ? 'Copied' : 'Copy greeting'}</Text>
		</Pressable>
	)
}
```

`isCopied` flips to `true` after a successful copy and reverts on its own —
use it for a temporary confirmation instead of tracking that state by hand.
`resetAfterMs` controls how long it lasts (default 2000), and `announce`
speaks a short confirmation through the platform's polite announcement
channel so screen readers hear it too. A rapid re-copy restarts the timer,
and a pending reset is cancelled when the component unmounts.

```tsx
const { clipboardProps, isCopied } = useClipboard({
	getItems: () => 'Hello',
	announce: 'Copied to clipboard',
	resetAfterMs: 2000,
})
```

For sequencing, await `copy()` or `clipboardProps.onPress()`. Both resolve the
same boolean as `copyText`; `onCopy` runs before that promise resolves. Calls
are independent attempts, without deduplication. Keep notification callbacks
free of thrown errors. [CopyTextDemo](../../packages/ui/examples/CopyTextDemo.tsrx)
shows a visible status message.

Pass text straight to `copy(text)` when the value comes from somewhere other
than the press — a row, an editor selection, a generated link. The argument
wins over `getItems`, so one hook serves both paths.

```tsx
import { Pressable, Text, useClipboard } from '@octane-xplat/ui'

export function RowCopy({ text }: { text: string }) {
	const { copy } = useClipboard({ announce: 'Copied' })
	return (
		<Pressable onPress={() => void copy(text)}>
			<Text>Copy row</Text>
		</Pressable>
	)
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
attachment outside web. Clipboard press handlers return `Promise<boolean>`;
existing calls may ignore it, or await it for dependent work. `useClipboard`
is a render-scoped hook — call it inside a component. It now also exposes
`isCopied`, `announce`, `resetAfterMs`, and `copy(text)`, matching the Astryx
clipboard hook; the `getItems`, `onCopy`, `clipboardProps`, and
`keyboardProps` names are retained. This remains a text-only subset rather
than React Aria's full clipboard API.

```tsx
import { Text, useClipboard, useKeyboard } from '@octane-xplat/ui'

export function InteractionBar() {
	const keyboard = useKeyboard({ onKeyUp: (event) => console.log(event.code) })
	const clipboard = useClipboard({ getItems: () => 'Hello' })
	return <Text>{clipboard.isCopied ? 'Copied' : 'Ready'}</Text>
}
```
