### Buttons keep focus while an action runs

A busy Button keeps keyboard focus on the web and blocks repeat presses by default. Quick actions can finish before the spinner appears. Web tooltips now open on hover and keyboard focus.

Icon-only buttons now require a `label` or `accessibilityLabel`.

```tsx
import { Button } from '@octane-xplat/ui'

export function ClosePanel({ close }: { close(): void }) {
  return <Button isIconOnly icon="xplat-close" label="Close panel" onPress={close} />
}
```

[Button states and actions](https://octane-xplat.goddardai.org/interactive-actions#button-states-and-actions)
