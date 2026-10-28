### Keep keyboard focus inside native macOS scopes

The experimental AppKit FocusScope now implements autofocus, containment,
restoration and nested ownership when its native bridge is available. Empty
scopes can receive focus without a fake action or normal Tab stop. Actual
OS keys, IME, focus appearance and VoiceOver remain unqualified.

```tsx
import { FocusScope, TextInput } from '@octane-xplat/ui'

export function Details() {
  return <FocusScope contain autoFocus restoreFocus accessibilityLabel="Details">
    <TextInput label="Name" />
    <TextInput label="Notes" />
  </FocusScope>
}
```

[Focus behavior](https://octane-xplat.goddardai.org/app/primitives#focus-behavior)
