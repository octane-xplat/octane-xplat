### Preserve modified AppKit action keys

Self-drawn controls now pass Control/Option/Command Enter/Space combinations to
native key handling. Unmodified and Shift-only activation remain; disabled/
read-only accessibility state and missing actions also pass through.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): void }) {
	return <Button label="Save" clickAction={save} />
}
```

Actual OS shortcuts, menu equivalents, input-source switching and accessibility
remain unqualified. See [native activation](https://github.com/octane-xplat/octane-xplat/blob/feat/appkit-native-support/packages/macos-renderer/README.md#self-drawn-control-keyboard-activation).
