### AppKit time-field minute stepping

TimeInput now binds plain Up/Down to its minute increment on AppKit. Steps use
the committed value, preserve optional seconds, wrap at midnight and respect
bounds. Parent values stay authoritative while pending saves exclude new edits.

```tsx
import { TimeInput } from '@octane-xplat/ui'

export function Start(props: { value: string | null; change(value: string | null): void }) {
	return <TimeInput label="Starts" value={props.value} onChange={props.change} increment={15} />
}
```

Native keys, IME, focus/accessibility and packaging remain unqualified. See
[AppKit time stepping](https://octane-xplat.goddardai.org/platform/date-picker#step-appkit-time-values-with-arrow-keys).
