### Keep disabled AppKit selection cards discoverable

Disabled SelectableCard now opts into native focus without enabling its action.
The renderer releases focus ownership on enablement/detach, and FocusScope
respects the native eligibility while keeping disabled fields excluded.

```tsx
import { SelectableCard } from '@octane-xplat/ui'

export function Plan({ selected, onChange }: { selected: boolean; onChange(value: boolean): void }) {
	return <SelectableCard label="Team plan" isSelected={selected} isDisabled onChange={onChange}>Unavailable</SelectableCard>
}
```

Real Tab/VoiceOver/window behavior remains unqualified. See [AppKit cards](https://octane-xplat.goddardai.org/app/interactive-actions#appkit-card-qualification).
