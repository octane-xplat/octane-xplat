### Number field options on AppKit

AppKit NumberInput now supports units, display formatting, optional steppers
and clear-to-null. Standalone labels and validation use Field, and inherited
disabled/read-only state also blocks stepper actions. Edit, step and clear
requests use current props and the latest local value, and reject nested or
detached actions. Steps and clear wait during marked editor text.

```tsx
import { NumberInput } from '@octane-xplat/ui'

export function Quantity() {
	return <NumberInput label="Quantity" defaultValue={2} min={0} max={9}
		units="kg" hasClear hasNumberSteppers={false} />
}
```

The formatter does not add a locale parser. Native input, layout, focus and
accessibility remain unqualified. See [AppKit number fields](https://octane-xplat.goddardai.org/app/components#number-fields-on-appkit).
