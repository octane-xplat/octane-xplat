# `@octane-xplat/date-picker`

An install boundary for platform-specific date and time selection controls:
a SwiftUI `DatePicker` on iOS, Material 3 `DatePicker`/`TimePicker` built with
Jetpack Compose on Android, and a real `NSDatePicker` on macOS. For portable
form controls, use `Calendar`, `DateInput`, `TimeInput`, `DateTimeInput`, and
`DateRangeInput` from `@octane-xplat/ui` on every target.

```tsx
import { useState } from 'octane'
import { DateInput } from '@octane-xplat/ui'

export function DepartureDate() {
	const [date, setDate] = useState<string | null>('2026-10-02')
	return <DateInput value={date} onChange={setDate} label="Departure" />
}
```

Install the package in the app that renders a control. Import
`SwiftUIDatePicker` from `@octane-xplat/date-picker/ios`,
`MaterialDatePicker` from `@octane-xplat/date-picker/android`, or
`AppKitDatePicker` from `@octane-xplat/date-picker/macos` in the matching
platform-suffixed file. These native entries have platform-specific contracts.
The old `@octane-xplat/date-picker/web` `DateInput` subpath was removed because
its browser-only string contract conflicted with the shared `DateInput` API.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// SwiftUIDatePickerExample.ios.tsx
import { SwiftUIDatePicker } from '@octane-xplat/date-picker/ios'

export function Picker() {
	return (
		<SwiftUIDatePicker
			defaultSelection={new Date(2026, 9, 2)}
			displayedComponents={['date']}
			pickerStyle="graphical"
			onSelectionChange={console.log}
		/>
	)
}
```

```tsx
/** @jsxImportSource @nativescript-community/octane */
// MaterialDatePickerExample.android.tsx
import { MaterialDatePicker } from '@octane-xplat/date-picker/android'

const initialDate = new Date(2026, 9, 2)
const bounds = { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31) }

export function Picker() {
	return (
		<MaterialDatePicker
			initialDate={initialDate}
			selectableDates={bounds}
			onDateSelected={console.log}
		/>
	)
}
```

```tsx
// AppKitDatePickerExample.macos.tsx
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'

export function Picker() {
	return (
		<AppKitDatePicker
			components="date"
			pickerStyle="graphical"
			defaultSelection={new Date(2026, 9, 2)}
			onSelectionChange={console.log}
		/>
	)
}
```

The platform APIs use their own selection vocabulary: the iOS entry takes a
controlled `selection`/`defaultSelection` `Date` with `displayedComponents`
and `pickerStyle`; the Android entry follows the uncontrolled
`initialDate`/`onDateSelected` model of the Material 3 pickers with
`selectableDates` range bounds; the macOS entry takes
`components`/`pickerStyle` (`'graphical'` embeds the
inline calendar) with a controlled `selection` `Date`.

```tsx
// Departure.macos.tsx
import { useState } from 'octane'
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'

export function Departure() {
	const [selection, setSelection] = useState(new Date(2026, 9, 2))
	return (
		<AppKitDatePicker
			components="date"
			pickerStyle="graphical"
			selection={selection}
			onSelectionChange={setSelection}
		/>
	)
}
```

Android notes: give `MaterialDatePicker` a bounded height (the M3 calendar's
lazy grid collapses under unbounded height), and keep `initialDate` and
`selectableDates` identity-stable — the provider keys its state `remember`
on them, so a per-render `new Date()` resets the selection.
See the framework guide for details and maintained examples:
[`docs/platform/date-picker.md`](../../docs/platform/date-picker.md).

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Departure.android.tsx — reuse these objects while the picker is mounted.
import { MaterialDatePicker } from '@octane-xplat/date-picker/android'

const initialDate = new Date(2026, 9, 2)
const selectableDates = { start: new Date(2026, 0, 1) }
export function Departure() {
	return (
		<MaterialDatePicker
			className="departure-calendar"
			initialDate={initialDate}
			selectableDates={selectableDates}
			onDateSelected={console.log}
		/>
	)
}
```

```css
/* App stylesheet: give the Android calendar room for its grid. */
.departure-calendar {
	height: 480px;
}
```

The native implementations are adapted from `@expo/ui` (MIT,
`packages/expo-ui` sdk-57): `ios/DatePickerView.swift` and
`android/.../ui/DatePickerView.kt`. Attribution headers sit on the ported
files.
