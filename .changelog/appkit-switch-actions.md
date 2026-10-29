### Save switch changes on AppKit

AppKit Switch now invokes changeAction, reports busy while saving, and restores
the previous value through onChange on failure. Overlapping saves are blocked;
completion after unmount is ignored. Save ownership now starts before onChange
callbacks, preventing reentrant duplicate saves; cached handlers use current
blocking props. Rapid uncontrolled requests now continue from the latest local
choice before rendering, and failed saves restore that choice before rollback.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Preference({ save }: { save(next: boolean): Promise<void> }) {
	return <Switch accessibilityLabel="Preference" defaultValue changeAction={save} />
}
```

Source cases remain unrun; native activation/ref timing and loading presentation remain unqualified. See
[switch saves](https://octane-xplat.goddardai.org/app/components#save-a-switch-setting-on-appkit).
