### Track keyboard and mouse focus in native macOS apps

The experimental AppKit `useFocusVisible` hook now observes keyboard and mouse
input instead of returning unsupported. `useFocusRing` combines that modality
with the control's focus callbacks. App deactivation clears the remembered
modality. Actual OS input and focus appearance still require qualification.

```tsx
import { Text, useFocusVisible } from '@octane-xplat/ui'

export function InputStatus() {
  const input = useFocusVisible()
  return <Text>{input.isSupported ? input.inputModality : 'Unavailable'}</Text>
}
```

[Focus behavior](https://octane-xplat.goddardai.org/app/primitives#focus-behavior)
