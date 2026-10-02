# Date and file entry

> Let someone choose a date, time, date range, or file in a form.

Start with the shared controls for a form that works across platforms.
Use the optional platform date-picker package when you specifically want
the OS's own picker. A **picker** is a control for choosing a value or file.
The [text-entry guide](text-entry.md#control-a-field) explains how your app
keeps a field's value and handles changes.

`@octane-xplat/ui` exports `Calendar`, `DateInput`, `TimeInput`,
`DateTimeInput`, and `DateRangeInput`. `@octane-xplat/files` exports
`FileInput` alongside the native file service it uses. The entry points keep
the same component names and portable values on web, iOS, Android, macOS, and
Linux. Labels can be supplied directly or by composing a control inside
`Field`.

```tsx
import { Field, DateInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [date, setDate] = useState<import('@octane-xplat/ui').ISODateString | undefined>(
		'2026-10-02',
	)
	return (
		<Field label="Travel date">
			<DateInput value={date} onChange={setDate} />
		</Field>
	)
}
```

## Portable values

Date fields use strings such as `2026-10-02` (`YYYY-MM-DD`). Time fields use
`14:30` (`HH:MM`) or `14:30:00` (`HH:MM:SS`). A combined value looks like
`2026-10-02T14:30`, with optional seconds and no timezone suffix. These
are calendar and wall-clock values, not JavaScript timestamps. Date constraints
receive local-midnight `Date` values. `Calendar` supports single selection or
inclusive `{ start, end }` ranges. `DateRangeInput` commits the same range
shape and uses `null` to clear.

```tsx
import { DateInput, TimeInput, DateTimeInput, Calendar, DateRangeInput } from '@octane-xplat/ui'

export function Example() {
	return (
		<>
			<DateInput label="Date" value="2026-10-02" onChange={(value) => console.log(value)} />
			<TimeInput label="Time" value="14:30" onChange={(value) => console.log(value)} />
			<DateTimeInput
				label="Departure"
				value="2026-10-02T14:30"
				onChange={(value) => console.log(value)}
			/>
			<Calendar
				mode="range"
				value={{ start: '2026-10-02', end: '2026-10-05' }}
				onChange={(range) => console.log(range)}
			/>
			<DateRangeInput label="Trip" value={null} onChange={(range) => console.log(range)} />
		</>
	)
}
```

Your app supplies `value`, and `onChange` receives the new value when someone
edits it. Keep that value in app state and send it with the rest of your form
when submitting. `onChange` gives you the value itself rather than a browser
event object; these controls do not submit an HTML form automatically.

```tsx
import { Field, DateInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [date, setDate] = useState<import('@octane-xplat/ui').ISODateString | undefined>(
		'2026-10-02',
	)
	return (
		<Field label="Travel date">
			<DateInput value={date} onChange={setDate} />
		</Field>
	)
}
```

Use `ref` for the supported handles: `Calendar.navigateTo()`, input focus
and blur, or `FileInput.open()`. A handle lets your code call those actions.
If you are adapting React examples, these are not DOM refs or
`SyntheticEvent` callbacks.

```tsx
import { useRef } from 'octane'
import { Calendar, Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	const calendar = useRef<import('@octane-xplat/ui').CalendarHandle | null>(null)
	return (
		<>
			<Calendar
				ref={(handle) => {
					calendar.current = handle
				}}
			/>
			<Pressable onPress={() => calendar.current?.navigateTo('2026-12-01')}>
				<Text>Show December</Text>
			</Pressable>
		</>
	)
}
```

Committed values remain owned by the parent: update `value` in `onChange` to
accept an edit, or leave it unchanged to reject it. A later reset or correction
replaces the displayed value. Typed text is preserved when the parent echoes an
edit and replaced when it supplies a different value. `changeAction` reports
loading while an app-owned save runs; handle domain failures in that callback
and set `status` to explain them. Settlement, including rejection, releases
loading without keeping a separate committed value.

`DateRangeInput` checks calendar commits and presets against valid ordered ISO
endpoints, `min`/`max`, `dateConstraints`, and inclusive `minRangeSpan`/
`maxRangeSpan`. Invalid presets are disabled. Bounds and predicates apply to
the endpoints, not every interior day. A completed range or preset closes the
picker; clearing emits `null`.

`DateInput` and `DateTimeInput` open an adaptive calendar surface by default.
`TimeInput` supports a typed field, popover, bottom sheet, or platform picker.
On web, `presentation="native"` uses browser date/time inputs. On iOS and
Android it uses the framework's portable calendar and time surfaces; the
shared API does not change into a platform-specific component.

```tsx
import { DateInput, TimeInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [date, setDate] = useState<import('@octane-xplat/ui').ISODateString | undefined>(
		'2026-10-02',
	)
	const [time, setTime] = useState<import('@octane-xplat/ui').ISOTimeString | undefined>('14:30')
	return (
		<>
			<DateInput label="Date" presentation="native" value={date} onChange={setDate} />
			<TimeInput label="Time" presentation="bottom-sheet" value={time} onChange={setTime} />
		</>
	)
}
```

`FileInput` accepts `isMultiple`, `accept`, `maxSize`, and `maxFiles`. Its
portable values are `{ name, uri, size?, mimeType? }` references. A browser
`File` object cannot be shared with native code, so web additionally supplies
the selected object as `file`; native apps receive an opaque URI/path.
Selection is built in: the browser chooser is used on web and Linux, the
NativeScript document picker on iOS and Android, and AppKit's `NSOpenPanel`
on macOS. Multi-file selection is supported on each of those paths. An
optional `pick` prop can override the default for app-specific sources. The
AppKit files leaf provides picking; its `readText` and `writeText` methods
remain unsupported.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'
import { useState } from 'octane'

export function Attachments() {
	const [files, setFiles] = useState<FileInputFile | FileInputFile[] | null>(null)
	return (
		<FileInput
			label="Attachments"
			value={files}
			onChange={setFiles}
			isMultiple
			accept="image/*"
			maxSize={5000000}
			maxFiles={3}
		/>
	)
}
```

`@octane-xplat/files` has a peer dependency on `@octane-xplat/ui` for the
field presentation. Install both packages when using `FileInput`.

## OS-authentic pickers

`@octane-xplat/date-picker` remains a native-only leaf for applications that
need SwiftUI, Material 3, or AppKit picker chrome. The old
`@octane-xplat/date-picker/web` `DateInput` entry has been removed; use the
shared `DateInput` from `@octane-xplat/ui` on web and for portable forms.

```tsx
import { DateInput } from '@octane-xplat/ui'

export function Example() {
	return <DateInput label="Departure" value="2026-10-02" onChange={(value) => console.log(value)} />
}
```

`@octane-xplat/date-picker` is the second Expo UI port. The native
implementations are adapted from `@expo/ui` sdk-57 (`ios/DatePickerView.swift`,
`android/.../ui/DatePickerView.kt`; MIT — attribution headers sit on the
ported files), re-skinned onto the `updateData`/`onEvent` provider contract.
Like `@octane-xplat/picker`, it groups related controls for distribution but
ships no shared component: each target entry has its own name and contract.

## Install and import

Add `@octane-xplat/date-picker` only when a target-specific native picker is
needed. Import from the matching target entry:

- `SwiftUIDatePicker` from `@octane-xplat/date-picker/ios` in `.ios.ts` or `.ios.tsrx`.
- `MaterialDatePicker` from `@octane-xplat/date-picker/android` in `.android.ts` or `.android.tsrx`.
- `AppKitDatePicker` from `@octane-xplat/date-picker/macos` in `.macos.ts` or `.macos.tsrx`.

Each entry exports its own component and prop types. The package has no shared
runtime entry or shared `types` subpath. See the maintained target-specific
examples in [`packages/demos/src/`](../packages/demos/src/).

The Android adapter carries the same build requirements as the picker: the
leaf's `platforms/android/include.gradle` enables Compose and applies the
Material 3 BOM, and the app must apply the Compose compiler plugin to the
generated `date-picker` AAR project from `before-plugins.gradle` (see
[`apps/mobile/App_Resources/Android/before-plugins.gradle`](../apps/mobile/App_Resources/Android/before-plugins.gradle))
and keep the plugin classpath in `buildscript.gradle` aligned to the Kotlin
Gradle plugin version.

## Platform APIs

The iOS entry exports `SwiftUIDatePicker`. `selection` is a controlled `Date`
paired with `onSelectionChange`, or seeded with `defaultSelection`. The picker
accepts `title` (omitted hides the label), `minimumDate`/`maximumDate` range
bounds, `displayedComponents` (`'date'` and/or `'hourAndMinute'`), a
`pickerStyle` (`'automatic'`, `'compact'`, `'graphical'`, `'wheel'`), and
`disabled`.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// TravelDate.ios.tsrx
import { SwiftUIDatePicker } from '@octane-xplat/date-picker/ios'

const initial = new Date(2026, 9, 2)
export function TravelDate() {
	return (
		<SwiftUIDatePicker
			title="Travel date"
			defaultSelection={initial}
			minimumDate={initial}
			displayedComponents={['date']}
			pickerStyle="graphical"
			onSelectionChange={(date) => console.log(date)}
		/>
	)
}
```

The Android entry exports `MaterialDatePicker`. It follows the Material 3
pickers' uncontrolled model: `initialDate` seeds the state and
`onDateSelected` reports each change (`null` when the selection clears).
`displayedComponents` selects the control — `'date'` renders the M3 calendar
`DatePicker`, `'hourAndMinute'` the M3 `TimePicker`; `'dateAndTime'` falls
back to the date picker. `variant` switches the date picker between the
calendar grid (`'picker'`) and text-field input (`'input'`), gated by
`showVariantToggle`. `selectableDates` bounds the selectable range and also
derives the calendar's `yearRange`. `color` tints a subset of elements;
`elementColors` overrides individual Material 3 color slots as CSS hex
strings.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// TravelDate.android.tsrx
import { MaterialDatePicker } from '@octane-xplat/date-picker/android'

const initial = new Date(2026, 9, 2)
const bounds = { start: initial, end: new Date(2026, 11, 31) }
export function TravelDate() {
	return (
		<MaterialDatePicker
			className="calendar-picker"
			initialDate={initial}
			selectableDates={bounds}
			displayedComponents="date"
			variant="picker"
			showVariantToggle
			elementColors={{ todayDateBorderColor: '#4f46e5' }}
			onDateSelected={(date) => console.log(date?.toDateString())}
		/>
	)
}
```

Runtime constraints on Android, learned on-device:

```css
.calendar-picker {
	width: 360px;
	height: 400px;
}
```

- **Give the picker a bounded size.** The M3 calendar contains a lazy grid;
  under an unbounded height it composes to zero. Use the `.calendar-picker` class above
  (400 shows the full calendar) or a constrained parent.
- **Keep props identity-stable.** The provider keys its `remember` on
  `initialDate` and the `selectableDates` bounds; a per-render `new Date()`
  produces a new timestamp each push, recreates `DatePickerState`, and drops
  the selection — so each pick appears to do nothing. Memoize the props (or
  use module constants) the same way you would for any controlled control.
- The provider emits the picked day as local-midnight milliseconds and
  the JavaScript adapter converts them to a `Date` for `onDateSelected`.
  M3's UTC-day storage is converted back before the callback, so
  `date?.toDateString()` shows the selected day.

The macOS entry exports `AppKitDatePicker` — a real `NSDatePicker`
embedded in the leaf's backing view through the `__xplatAppKit` bridge.
`components` selects `'date'` (text field, or the inline graphical
calendar with `pickerStyle: 'graphical'`), `'time'`
(clock-and-calendar field), or `'dateAndTime'`. `selection` is a
controlled `Date` with `onSelectionChange`; `minimumDate`/`maximumDate`
map to `minDate`/`maxDate`, `disabled` to `enabled`. The host element
needs an explicit size — the picker is pinned to its edges.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// TravelDate.macos.tsrx
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'

const initial = new Date(2026, 9, 2)
export function TravelDate() {
	return (
		<AppKitDatePicker
			className="calendar-picker"
			components="date"
			pickerStyle="graphical"
			defaultSelection={initial}
			onSelectionChange={(date) => console.log(date)}
		/>
	)
}
```

The web entry was removed because its browser-specific `DateInput` value and
props conflicted with the portable shared `DateInput`. Use
`@octane-xplat/ui` for shared date entry instead.

## Port notes — what carried over

- iOS: the range-branching `DatePicker` construction, selection echo
  suppression, `labelsHidden` when untitled, the `.graphical` style's 320pt
  min-width workaround for the UICalendarView shrink bug
  ([expo#47062](https://github.com/expo/expo/issues/47062)), and the
  `displayedComponents` → `DatePicker.Components` mapping. Not ported:
  children-as-label (the picker takes a `title` string), tvOS guards.
- Android: `SelectableDates` range derivation, the `yearRange` fix for
  bounded calendars ([expo#47206](https://github.com/expo/expo/issues/47206)),
  the `LocalContentColor` binding so the year-selector chevron honors
  `navigationContentColor`, and both element-color tables (as hex strings —
  the bridge does not carry `ColorValue` ints). Not ported: the
  `DatePickerDialog`/`TimePickerDialog` wrappers and their keyboard
  soft-input handling; `dateAndTime` combined input.
