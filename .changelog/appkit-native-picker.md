# Choose values with a native macOS pop-up button

The new `@octane-xplat/picker/macos` entry exports `AppKitPicker` for native
AppKit apps. It uses the system pop-up button with stable string selection IDs,
disabled choices and controlled or uncontrolled state. The maintained native
demo now exercises the control. No additional macOS plugin is required.

```tsx
// BagPicker.macos.tsx
import { useState } from 'octane'
import { AppKitPicker } from '@octane-xplat/picker/macos'
export function BagPicker() {
	const [selection, setSelection] = useState('carry')
	return <AppKitPicker label="Bag" selection={selection} onSelectionChange={setSelection}
		options={[{ id: 'carry', title: 'Carry-on' }, { id: 'checked', title: 'Checked bag' }]} />
}
```

See the [native macOS selection guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/native-picker.md#native-macos-selection).
Native pointer/keyboard, tracking, focus, layout, VoiceOver, teardown and
installed-consumer qualification remain pending.
