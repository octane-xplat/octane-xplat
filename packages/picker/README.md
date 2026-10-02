# `@octane-xplat/picker`

An install boundary for platform-specific selection controls: a SwiftUI `Picker`
on iOS, a Material 3 dropdown built with Jetpack Compose on Android, and an
HTML `<select>` on web.
Install the package in the app that renders a control. Import `SwiftUIPicker`
from `@octane-xplat/picker/ios`, `MaterialDropdown` from
`@octane-xplat/picker/android`, or `Select` from `@octane-xplat/picker/web` in
the matching platform-suffixed file. Each entry exports its own component and
types; there is no shared picker API at the package root.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// SwiftUIPickerExample.ios.tsx
import { SwiftUIPicker } from '@octane-xplat/picker/ios'

export function Picker() {
	return (
		<SwiftUIPicker
			label="Bag"
			options={[{ id: 'carry', title: 'Carry-on' }]}
			defaultSelection="carry"
			onSelectionChange={console.log}
		/>
	)
}
```

```tsx
/** @jsxImportSource @nativescript-community/octane */
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

The platform APIs use their own selection vocabulary and option shapes. The iOS
entry uses SwiftUI selection IDs, the Android entry uses Material dropdown keys
and enabled states, and the web entry follows browser select values. See the
framework guide for details and maintained examples:
[`docs/platform/native-picker.md`](../../docs/platform/native-picker.md).

```tsx
/** @jsxImportSource @nativescript-community/octane */
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
