# Handle keys and copy text

> Show which key was pressed, or tell someone whether their text was copied.

## Copy text with feedback

Spread `clipboardProps` onto a shared `Pressable`. `getItems` produces fresh
text for each press; while mounted, `onCopy` receives `true` after a successful write and
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
same boolean as `copyText`; while mounted, `onCopy` runs before that promise resolves. Calls
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

### Keep copy feedback with its screen

When a component unmounts, its pending writes still finish and resolve their
boolean outcomes. The retired hook skips state changes, announcements, `onCopy`
and new reset timers. Held triggers resolve false without reading or writing
text. A failed announcement does not change a successful write into a failure.
A retained route pane stays mounted and continues to own its feedback.

```tsx
import { Pressable, Text, useClipboard } from '@octane-xplat/ui'

export function CopyAndClose(props: { text: string; close: () => void }) {
	const { copy } = useClipboard({ announce: 'Copied' })
	return (
		<Pressable onPress={async () => {
			const pending = copy(props.text)
			props.close() // The parent removes this component.
			const success = await pending
			console.log(success ? 'Copy completed' : 'Copy unavailable')
		}}>
			<Text>Copy and close</Text>
		</Pressable>
	)
}
```

### AppKit clipboard access

AppKit `clipboard.canCopy` checks for a native writer independently of read
access. A copy-only host can copy text. The platform service and UI `copyText`
helper share the same write implementation: unavailable or failed writes resolve
false; unavailable or failed reads resolve null. This remains text-only and does
not establish OS pasteboard or permission qualification.

```ts
import { clipboard } from '@octane-xplat/platform'

export async function copyMessage(text: string): Promise<boolean> {
	return clipboard.canCopy ? clipboard.writeText(text) : false
}
```

## Handle hardware keys on web and Linux

Use this DOM example in a `.web.tsrx` file (including a Linux web host).
Spread `keyboardProps` onto a focusable
DOM element, such as `button`. Shared `View`, `TextInput`, and `Pressable` do
not forward this attachment. `isSupported` is true for the DOM surface;
native mobile and other unsupported hosts return false with an empty bag.
AppKit has a separate native-intrinsic attachment described below.
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

## Handle hardware keys on AppKit

In a `.macos.tsx`/`.macos.tsrx` leaf, spread `keyboardProps` onto a focusable
native intrinsic, such as `textfield`, or onto a native ancestor of focusable
controls. The AppKit renderer routes key-down/up from the owning window's first
responder through registered native ancestors. Shared `View`, `TextInput` and
`Pressable` do not forward this bag. Check `isSupported` for bridge availability;
it does not qualify OS input or IME behavior.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useKeyboard } from '@octane-xplat/ui'

export function SearchField() {
	const keyboard = useKeyboard({ onKeyDown: (event) => {
		if (event.isComposing) return
		if (event.metaKey && event.key.toLowerCase() === 'k') {
			event.preventDefault()
			console.log('Search command')
		}
	} })
	return <textfield accessibilityLabel="Search" {...keyboard.keyboardProps} />
}
```

AppKit `preventDefault()` stops native dispatch for that event;
`stopPropagation()` stops Xplat ancestor handlers without cancelling the native
default. `FocusScope` dispatches attached handlers before its Tab containment,
with one shared result so handlers do not run twice. Logical characters follow
the text layout; physical `code` uses known macOS key positions and is empty
for unmapped codes. Marked text and recognized dead keys set `isComposing`;
keep composition keys with the native editor unless interception is intentional.

```ts
import type { KeyboardEvent } from '@octane-xplat/ui'

export function handleSearchKey(event: KeyboardEvent): void {
	if (event.isComposing || !event.metaKey || event.key.toLowerCase() !== 'k') return
	event.preventDefault()
	event.stopPropagation()
}
```

Modifier-only `flagsChanged` notifications and extended physical-key mappings
remain gaps. Native menus and other nested event-tracking loops can consume
events before local monitoring; see Apple's [local-monitor contract](https://developer.apple.com/documentation/appkit/nsevent/addlocalmonitorforevents%28matching%3Ahandler%3A%29).
Actual physical input, text layout/IME, default cancellation, focus-scope
interaction, teardown and packaged consumers remain unqualified.

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
