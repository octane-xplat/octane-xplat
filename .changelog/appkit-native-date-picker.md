### Keep native macOS date selection current

The experimental AppKit date picker now keeps uncontrolled selections across
mode/style changes, uses the current callback and accessibility label, and
rejects invalid controlled dates or bounds. Disabled, retired and programmatic
changes do not report user selections. The macOS demo now exercises the native
control; OS input, layout and VoiceOver qualification remains pending.

```tsx
// ClosingTime.macos.tsx
import { useState } from 'octane'
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'
export function ClosingTime() {
	const [selection, setSelection] = useState(new Date(2026, 9, 29, 12, 30))
	return <AppKitDatePicker components="dateAndTime" selection={selection}
		onSelectionChange={setSelection} accessibilityLabel="Poll closing time" />
}
```

See [native AppKit date selection](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/date-picker.md#native-macos-selection-lifecycle).
