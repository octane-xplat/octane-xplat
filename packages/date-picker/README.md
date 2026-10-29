# `@octane-xplat/date-picker`

Platform-specific date and time pickers for Octane xplat apps: a SwiftUI
`DatePicker` on iOS, Material 3 `DatePicker`/`TimePicker` built with Jetpack
Compose on Android, and an experimental `NSDatePicker` source implementation
on native macOS. Native macOS editing, layout and VoiceOver qualification is
pending. For a shared form API, use `Calendar`, `DateInput`,
`TimeInput`, `DateTimeInput`, and `DateRangeInput` from `@octane-xplat/ui`.

From an existing Xplat app, install the package before using the example:

```sh
pnpm add @octane-xplat/date-picker
```

```tsx
import { useState } from 'octane'
import { DateInput } from '@octane-xplat/ui'

export function DepartureDate() {
	const [date, setDate] = useState<string | null>('2026-10-02')
	return <DateInput value={date} onChange={setDate} label="Departure" />
}
```

There is no shared picker component. Install the package in the app that
renders a control, then import `SwiftUIDatePicker` from
`@octane-xplat/date-picker/ios`, `MaterialDatePicker` from
`@octane-xplat/date-picker/android`, or `AppKitDatePicker` from
`@octane-xplat/date-picker/macos` in the matching platform-suffixed file.
These native entries have platform-specific contracts.
The old `@octane-xplat/date-picker/web` `DateInput` subpath was removed because
its browser-only string contract conflicted with the shared `DateInput` API.

In an existing app, install the package with pnpm. The macOS entry needs a
[native AppKit app](../../docs/platform/macos-native.md); the renderer supplies
its native attachment automatically.

```sh
pnpm add @octane-xplat/date-picker
```

```tsx
/** @jsxImportSource @octane-xplat/jsx */
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
/** @jsxImportSource @octane-xplat/jsx */
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
import { useState } from 'octane'
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'
import { Text } from '@octane-xplat/ui'

export function Picker() {
	const [selection, setSelection] = useState(new Date(2026, 9, 29))
	return (
		<>
			<AppKitDatePicker
				components="date"
				pickerStyle="graphical"
				selection={selection}
				onSelectionChange={setSelection}
				accessibilityLabel="Departure date"
			/>
			<Text>{selection.toLocaleString()}</Text>
		</>
	)
}
```

The platform APIs use their own selection vocabulary: the iOS entry takes a
controlled `selection`/`defaultSelection` `Date` with `displayedComponents`
and `pickerStyle`; the Android entry follows the uncontrolled
`initialDate`/`onDateSelected` model of the Material 3 pickers with
`selectableDates` range bounds; the macOS entry takes
`components`/`pickerStyle` (`'graphical'` embeds the
inline date calendar) with a controlled `selection` `Date`.

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

On native macOS, `defaultSelection` seeds an uncontrolled picker once. Its
accepted date survives component/style changes and replacement of the backing
view; later defaults do not reset it. Bounds are inclusive. Invalid dates,
reversed bounds or an out-of-bounds controlled selection show a generic message
until the props are repaired. Uncontrolled selection clamps to new bounds without
emitting a change. Disabled, retired and programmatic changes do not call
`onSelectionChange`; the current callback receives user changes. See the
[native macOS workflow and remaining limits](../../docs/platform/date-picker.md#native-macos-selection-lifecycle).

```tsx
// BoundedDate.macos.tsx — defaultSelection is only the initial seed.
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'
const initial = new Date(2026, 9, 29)
const minimum = new Date(2026, 0, 1)
export function BoundedDate() {
	return <AppKitDatePicker defaultSelection={initial} minimumDate={minimum}
		accessibilityLabel="Departure date" onSelectionChange={(date) => console.log(date)} />
}
```

Android notes: give `MaterialDatePicker` a bounded height (the M3 calendar's
lazy grid collapses under unbounded height), and keep `initialDate` and
`selectableDates` identity-stable — the provider keys its state `remember`
on them, so a per-render `new Date()` resets the selection.
See the framework guide for details and maintained examples:
[`docs/platform/date-picker.md`](https://octane-xplat.goddardai.org/date-picker).

```tsx
/** @jsxImportSource @octane-xplat/jsx */
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
