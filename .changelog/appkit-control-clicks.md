### Enable AppKit choice actions after mount

Self-drawn checkboxes, switches and radio choices can now acquire a click
recognizer when a callback appears after an initially disabled/read-only mount.
Callback changes reuse the recognizer; callback removal disables it.

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function Choice({ saving }: { saving: boolean }) {
	return <Checkbox label="Include archived" isDisabled={saving} />
}
```

Native re-enable clicks, gesture arbitration and teardown remain unqualified.
See [click ownership](https://github.com/octane-xplat/octane-xplat/blob/feat/appkit-native-support/packages/macos-renderer/README.md#update-self-drawn-click-actions).
