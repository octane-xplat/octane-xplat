# `@octane-xplat/picker`

Platform-native selection controls: a SwiftUI `Picker` on iOS, a Material 3
dropdown built with Jetpack Compose on Android, an HTML `<select>` on web, and
an AppKit `NSPopUpButton` on macOS. Use it when you want the OS-authentic
control rather than a shared look.

```sh
pnpm add @octane-xplat/picker
```

There is no shared picker API at the package root. Each platform entry exports
its own component and types; import it from the platform subpath in a matching
platform-suffixed file:

| File suffix     | Import                         | Component          |
| --------------- | ------------------------------ | ------------------ |
| `*.ios.tsx`     | `@octane-xplat/picker/ios`     | `SwiftUIPicker`    |
| `*.android.tsx` | `@octane-xplat/picker/android` | `MaterialDropdown` |
| `*.web.tsx`     | `@octane-xplat/picker/web`     | `Select`           |
| `*.macos.tsrx`  | `@octane-xplat/picker/macos`   | `Select`           |

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// BagPicker.ios.tsx
import { useState } from 'octane'
import { SwiftUIPicker } from '@octane-xplat/picker/ios'

export function BagPicker() {
	const [selection, setSelection] = useState('carry')
	return (
		<SwiftUIPicker
			label="Bag"
			selection={selection}
			onSelectionChange={setSelection}
			options={[{ id: 'carry', title: 'Carry-on' }]}
		/>
	)
}
```

Each entry's props follow its own platform's selection vocabulary and option
shapes: iOS uses SwiftUI selection IDs, Android uses Material dropdown keys and
enabled states, and web follows browser select values. macOS reuses the web
entry's `Select` API — the `NSPopUpButton` maps onto the same `value`,
`defaultValue`, `onChange`, and `options` contract.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// SelectExample.macos.tsrx
import { Select } from '@octane-xplat/picker/macos'

export function Picker() {
	return (
		<Select
			label="Bag"
			options={[{ value: 'carry', label: 'Carry-on' }]}
			defaultValue="carry"
			onChange={console.log}
		/>
	)
}
```

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// MaterialDropdownExample.android.tsx
import { MaterialDropdown } from '@octane-xplat/picker/android'

export function Picker() {
	return (
		<MaterialDropdown
			label="Bag"
			items={[{ key: 'carry', text: 'Carry-on' }]}
			defaultSelectedKey="carry"
			onSelectedKeyChange={console.log}
		/>
	)
}
```

```tsx
// SelectExample.web.tsx
import { Select } from '@octane-xplat/picker/web'

export function Picker() {
	return (
		<Select
			label="Bag"
			options={[{ value: 'carry', label: 'Carry-on' }]}
			defaultValue="carry"
			onChange={console.log}
		/>
	)
}
```

See the framework guide for details and maintained examples:
[`docs/platform/native-picker.md`](https://octane-xplat.goddardai.org/native-picker).
