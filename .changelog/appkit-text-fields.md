### Labels and validation for AppKit text fields

Standalone AppKit TextInput, TextArea and SearchInput now display their labels,
descriptions and validation messages through the native Field wrapper. Existing
Fields keep ownership of those messages. Native layout and VoiceOver remain
unqualified.

```tsx
import { TextInput } from '@octane-xplat/ui'

export function Name() {
	return <TextInput label="Name" description="Shown publicly" width={280}
		status={{ type: 'error', message: 'Enter a name' }} />
}
```

See [text and keyboard actions](https://octane-xplat.goddardai.org/app/primitives#text-and-keyboard-actions).
