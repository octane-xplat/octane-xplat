### Owned AppKit radio selection

Experimental AppKit radio choices now use current group/item state and callbacks
for selection. Disabled, removed or retired rows cannot select, and repeated
uncontrolled selection before render reports once. Controlled parents keep
checked-state authority.

```tsx
import { RadioList } from '@octane-xplat/ui'
export function Plan() {
	return <RadioList label="Plan" defaultValue="free"
		options={[{ value: 'free', label: 'Free' }, { value: 'team', label: 'Team' }]} />
}
```

Native input, focus, accessibility and packaging remain unqualified. See
[AppKit radio choices](https://octane-xplat.goddardai.org/app/components#radio-choices-on-appkit).
