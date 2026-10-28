### AppKit date-field focus handles

AppKit DateInput, TimeInput and DateTimeInput now provide their existing ref
handles. DateRangeInput focus/blur requests now target its trigger. Focus checks
the current host and blocking state; blur leaves unrelated editors alone.

```tsx
import { useRef } from 'octane'
import { Button, DateInput } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export function Booking() {
	const date = useRef<TextInputHandle | null>(null)
	return <>
		<DateInput ref={date} label="Booking date" />
		<Button label="Edit date" clickAction={() => date.current?.focus()} />
	</>
}
```

Native ref/focus/editor/IME, popup/accessibility and packaging remain unqualified.
See [date focus handles](https://octane-xplat.goddardai.org/platform/date-picker#focus-an-appkit-date-field-from-a-form-action).
