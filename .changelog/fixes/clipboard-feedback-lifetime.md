### Keep copy feedback with its screen

An in-flight copy could announce success or create a reset timer after its
component unmounted. `useClipboard` now retires that feedback and ignores held
triggers after unmount, while already started writes still resolve their result.
An unavailable announcement no longer rejects a successful copy. AppKit native
pasteboard, effect and VoiceOver qualification remains pending.

```tsx
import { Pressable, Text, useClipboard } from '@octane-xplat/ui'

export function CopyMessage({ text }: { text: string }) {
	const { clipboardProps, isCopied } = useClipboard({ getItems: () => text, announce: 'Copied' })
	return <Pressable {...clipboardProps}><Text>{isCopied ? 'Copied' : 'Copy'}</Text></Pressable>
}
```

See [copy feedback lifetime](https://octane-xplat.goddardai.org/app/keyboard-clipboard#keep-copy-feedback-with-its-screen).
