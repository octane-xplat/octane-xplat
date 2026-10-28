# Date and file entry

> Let someone choose a date, time, date range, or file in a form.

Start with the shared controls for a form that works across platforms.
Use the optional platform date-picker package when you specifically want
the OS's own picker. A **picker** is a control for choosing a value or file.
The [text-entry guide](../app/text-entry.md#control-a-field) explains how your app
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
	const [date, setDate] = useState<import('@octane-xplat/ui').ISODateString | null>('2026-10-02')

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
shape and uses `null` to clear. `Calendar` accepts `null` as an explicitly
empty controlled selection; it reports picked values through `onChange`.
`DateInput`, `TimeInput`, and `DateTimeInput` also report `null` when cleared;
`undefined` means no controlled value was provided. An instant is separate:
it must include `Z` or a numeric UTC offset.

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
			<Calendar value={null} />
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
	const [date, setDate] = useState<import('@octane-xplat/ui').ISODateString | null>('2026-10-02')

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
	const [date, setDate] = useState<import('@octane-xplat/ui').ISODateString | null>('2026-10-02')
	const [time, setTime] = useState<import('@octane-xplat/ui').ISOTimeString | null>('14:30')

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
experimental AppKit files leaf also implements local text/binary reads,
Documents writes and save-panel export. Real picker, sandbox and packaged-app
qualification remains pending; see the [files guide](../../packages/files/README.md).

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

On AppKit, FileInput keeps one picker/save operation active per control, validates
results against current props and ignores completions after detachment. A save
failure reports field status; your value remains parent-owned. Use changeAction
for persistence and onChange to update your selection.

```tsx
import { useState } from 'octane'
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function SavedAttachments({ save }: { save(value: FileInputFile | FileInputFile[] | null): Promise<void> }) {
	const [value, setValue] = useState<FileInputFile | FileInputFile[] | null>([])
	return <FileInput label="Attachments" value={value} onChange={setValue} changeAction={save} isMultiple />
}
```

The default AppKit adapter also supplies known filename-based MIME hints and
optional Foundation file-size metadata for validation. Unknown metadata stays
absent; these hints do not inspect bytes or guarantee a later read limit.
Controller/metadata cases remain unrun; native panel/ref/focus and packaged
behavior remain unqualified. AppKit dropzone mode now has a local file-URL source
path described below; actual OS drag delivery remains unqualified. See [AppKit attachment lifetime](../../packages/files/README.md#appkit-attachment-picker-lifetime).

`@octane-xplat/files` has a peer dependency on `@octane-xplat/ui` for the
field presentation. Install both packages when using `FileInput`.

## Keyboard and app language

On the shared web calendar, Tab enters one enabled day across one or two month
panes. Arrow keys move focus without selecting a date. Up/Down stay in the same
weekday column when skipping disabled days. Home/End move to the first/last
enabled day in the row; Ctrl (or Command) + Home/End reach the grid edges.
PageUp/PageDown move by a month and skip disabled destinations within that
month. Enter or Space selects the focused button. Escape cancels a pending
range before dismissing the picker. Horizontal arrows follow the calendar's
text direction, including right-to-left layouts. Searches through an unbounded
custom predicate stop after one year when no enabled destination is found.

For typed web fields, Enter commits the text and blur finishes editing.
Composition with an input method editor (IME), such as a Japanese candidate
window, keeps intermediate text private and leaves its Enter/arrows untouched.
The native text adapters check iOS marked text, Android composing spans, and
AppKit's field editor before committing. Their unit checks do not establish
actual OS input delivery.

With `DateTimeInput timeOptionInterval={15}`, focusing the web time field opens
quarter-hour choices. Up/Down and Home/End highlight a choice; Enter accepts it,
Escape closes the list, and Tab leaves the field. Focus stays in the input so
assistive software can follow its active option. Typed times between choices,
such as `10:07`, remain exact when Enter commits them. With the list closed,
arrows step by `timeIncrement`; Alt+Down opens the list. Date/time bounds filter
the choices and still apply to typed values.

Pass your app's language to `locale` on any date-family control. This uses the
same language for Gregorian date display and numeric date ordering. `direction`
sets calendar layout and horizontal keys; when omitted, web inherits CSS
direction and native uses left-to-right. `messages` supplies translated labels
and announcements. A partial map keeps English defaults for omitted messages;
setting `locale` alone does not translate those words.

```tsx
<DateInput
	value={date}
	onChange={setDate}
	locale="fr-FR"
	presentation="popover"
	messages={{
		openCalendar: 'Ouvrir le calendrier',
		closeCalendar: 'Fermer le calendrier',
		previousMonth: 'Mois précédent',
		nextMonth: 'Mois suivant',
		invalidDate: 'Saisissez une date valide',
		selected: (formattedDate) => `Sélection : ${formattedDate}`,
	}}
/>
```

Here `04/05/2026` means 4 May, and the committed date uses French month names.
Messages such as `selected` receive a date already formatted in the supplied
locale. Range controls also accept `rangeStart`, `rangeEnd`, `inRange`,
`rangeSelected`, and `rangeCleared`. Use `cleared` for individual date/time
clears. Connect these props to your existing i18n
library's locale and translated strings; no translation package is required
by `@octane-xplat/ui`. An explicit locale also localizes time display while
`hourFormat` continues to choose 12 or 24 hours. Parsing remains bounded to
ASCII digits and English month names/AM-PM; displaying localized digits does
not imply those digits can be typed back into the parser.

Web selection and month changes use live regions and selected grid cells.
Native calendars supply localized accessible names/state and the existing live
label; native validation uses accessible hints. NativeScript calendars and time
lists do not yet bind hardware-key navigation. AppKit calendar day-grid and
DateTimeInput preset-time source ownership are described below; actual delivery remains unqualified, and
AppKit live-region delivery is not implemented. OS key events, focus/hit-testing, and
VoiceOver/TalkBack announcements have not been verified by these handler and
unit tests. Use the distinct OS-authentic leaves below when their native
interaction is required.

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
examples in [`packages/demos/src/`](../../packages/demos/src/).

The Android adapter carries the same build requirements as the picker: the
leaf's `platforms/android/include.gradle` enables Compose and applies the
Material 3 BOM, and the app must apply the Compose compiler plugin to the
generated `date-picker` AAR project from `before-plugins.gradle` (see
[`apps/mobile/App_Resources/Android/before-plugins.gradle`](../../apps/mobile/App_Resources/Android/before-plugins.gradle))
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
/** @jsxImportSource @octane-xplat/jsx */
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
/** @jsxImportSource @octane-xplat/jsx */
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
/** @jsxImportSource @octane-xplat/jsx */
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


### Drop local files on AppKit

Both compact and dropzone presentations use the matching AppKit renderer to
receive inspectable local regular-file URLs. Dropped references follow the same accept/count/size checks and
parent-owned value/save flow as picked files. The picker remains available:

```tsx
import { useState } from 'octane'
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments() {
	const [value, setValue] = useState<FileInputFile | FileInputFile[] | null>([])
	return <FileInput label="Attachments" mode="dropzone" value={value} onChange={setValue}
		isMultiple accept=".txt,.pdf" maxSize={5000000} maxFiles={3} />
}
```

Directories, symlinks, uninspectable files and promised/non-file payloads are
excluded. Accepting a drop does not prove validation or saving succeeded, and no
persistent sandbox grant is promised. Native registration, OS hit routing/drag,
metadata/grants, focus/VoiceOver and packaging remain unqualified. Nine authored
cases are unrun. See [file-drop scope and limitations](../../packages/files/README.md#appkit-local-file-drops).


### Navigate AppKit calendar days with keys

With the matching renderer, AppKit Calendar adapts the shared date-navigation
model: arrows skip disabled dates, Home/End use enabled row edges, Command/Control
Home/End use the visible grid, and PageUp/PageDown request an adjacent month.
Horizontal arrows follow explicit or provider direction. One enabled day is a
Tab candidate across both month panes; header controls keep their own keys.
Enter/Space selects through the existing single/range callback. Tab keeps native
traversal, and Escape clears an unfinished range before layer dismissal. The
AppKit layer monitor consults the shared renderer dispatcher first, so this local
Escape intent does not depend on which native monitor runs first:

```tsx
import { useState } from 'octane'
import { Calendar } from '@octane-xplat/ui'
import type { DateRange } from '@octane-xplat/ui'

export function StayDates() {
	const [range, setRange] = useState<DateRange | null>(null)
	return <Calendar mode="range" value={range} onChange={setRange}
		numberOfMonths={2} min="2026-01-01" max="2026-12-31" maxRangeSpan={14} />
}
```

A controlled focusDate keeps the old page until the parent accepts
onFocusDateChange; pending day focus waits for the new native cells. Moving focus
does not select a value. Header/imperative navigation cancels stale page focus,
and window changes or teardown invalidate pending intent and release claims.
Prevented/composing/Alt events and modified shortcuts stay outside day navigation,
except the explicit Command/Control Home/End grid commands.

Six adapter and two object-driver wiring cases remain unrun; their native objects
are simulated. The maintained calendar-keys fixture synthesizes no OS input.
Physical keys/Tab, native ref/window/notification order, focus/reveal, popup and
modal integration, geometry, RTL delivery, AX/VoiceOver and packaging remain
unqualified. AppKit preset-time source ownership is described below; NativeScript
time-list keys and AppKit live announcements remain gaps. AppKit time stepping is described below.


### Commit typed AppKit date and time drafts with Return

AppKit DateInput, TimeInput and both DateTimeInput segments now connect native
submit to the same draft-commit function as blur. Existing parsers, bounds and
composition guards stay in charge: valid drafts use the normal change path,
empty drafts request null, and pending display text resets through that boundary.
Keep the values controlled by the parent:

```tsx
import { useState } from 'octane'
import { DateInput, TimeInput, DateTimeInput, VStack } from '@octane-xplat/ui'

export function Appointment() {
	const [date, setDate] = useState<string | null>('2026-03-05')
	const [time, setTime] = useState<string | null>('14:30')
	const [datetime, setDatetime] = useState<string | null>('2026-03-05T14:30')
	return <VStack>
		<DateInput label="Date" value={date} onChange={setDate} />
		<TimeInput label="Time" value={time} onChange={setTime} />
		<DateTimeInput label="Date and time" value={datetime} onChange={setDatetime} />
	</VStack>
}
```

This is handler wiring, not a native Return result. The maintained date-submit
fixture synthesizes no input and remains unrun. Actual target/action delivery,
Return-versus-blur ordering, IME confirmation, draft/caret/focus/validation behavior,
AX and packaging remain unqualified. AppKit time stepping is described below;
DateTimeInput preset-list key source ownership is described below.


### Choose AppKit preset times with keys

Set DateTimeInput.timeOptionInterval to offer presets. On AppKit, Alt+Down from
the time field opens the list; the clock button still opens it by pointer or its
normal activation path. The native popup requests option focus near the current
or typed time. Up/Down and Home/End move within current in-range rows without
wrapping or changing the value. Enter/Space uses the existing time commit path:

```tsx
import { useState } from 'octane'
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment() {
	const [value, setValue] = useState<string | null>('2026-03-05T14:30')
	return <DateTimeInput label="Appointment" value={value} onChange={setValue}
		min="2026-03-05T09:00" max="2026-03-05T17:00" timeOptionInterval={15} />
}
```

Tab/Shift-Tab requests the current time field's next/previous valid key view
through accepted popup closure; ordinary Escape/dismissal requests field return.
Composition and modified shortcuts keep their existing paths. Current blocked,
busy, empty or detached controls cannot accept stale options. Moving between
options is separate from the parent-owned value; choosing without a date keeps
the existing time draft. Edit text in the time field after leaving the popup.

One renderer, four focus-policy and five object-driver cases remain unrun. The maintained
preset-times fixture synthesizes no OS input. Native key/ref/window/observer
ordering, field-editor/IME behavior, focus/Tab/return (including busy saves), scroll
reveal, popup/modal integration, geometry, AX and packaging remain unqualified.
Text/typeahead relay from focused rows and full listbox/option AX relationships
are not implemented by this adapter. Standalone TimeInput stepping is described below.


### Step AppKit time values with arrow keys

Set TimeInput.increment to the number of minutes per step. The AppKit source
adapter handles plain Up/Down from its current time field, starting from the
committed value or local current time when empty. It uses the shared midnight
wrap and seconds policy, and emits only a result within min/max. Keep the
accepted value in your app:

```tsx
import { useState } from 'octane'
import { TimeInput } from '@octane-xplat/ui'

export function StartTime() {
	const [time, setTime] = useState<string | null>('14:30')
	return <TimeInput label="Start time" value={time} onChange={setTime}
		increment={15} min="09:00" max="17:00" hourFormat="24h" />
}
```

A step requests the next value from the parent; it does not assume acceptance.
After dispatching a valid step, private typed text clears so the field displays
the current parent value, even if the parent declines the requested change. Modified keys, composing text, foreign/detached targets and blocked
controls keep their existing key behavior. Pending changeAction work excludes
new changes; a failed save releases loading without rolling the parent back.
Use status for app-owned error feedback:

```tsx
<TimeInput label="Start time" value={time} onChange={setTime} increment={15}
	changeAction={saveTime} status={saveError ? { type: 'error', message: saveError } : undefined} />
```

Five object-driver cases and the maintained time-step fixture remain unrun.
Source/syntax review does not qualify physical keys/repeat, native field-editor
routing, IME, caret/draft updates, asynchronous focus behavior, accessibility or
packaging. DateTimeInput stepping is described below; live announcements remain
a separate gap.


### Step the AppKit date-time field without opening presets

DateTimeInput.timeIncrement controls plain Up/Down in its closed time field.
This is independent of timeOptionInterval: a five-minute step can request 09:20
between quarter-hour presets. Existing date/time bounds apply to the candidate.
Midnight wrap keeps the selected date unchanged, and hasSeconds preserves seconds:

```tsx
import { useState } from 'octane'
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment() {
	const [value, setValue] = useState<string | null>('2026-03-05T09:15:17')
	return <DateTimeInput label="Appointment" value={value} onChange={setValue}
		timeIncrement={5} timeOptionInterval={15} hasSeconds
		min="2026-03-05T09:00:00" max="2026-03-05T17:00:00" />
}
```

The parent owns committed values. With no date yet, stepping updates the local
time draft; entering a valid date combines that draft through the existing commit
path. Plain field arrows leave either open popup in charge, while Alt+Down still
opens available presets. Modified/composing/foreign/detached/blocked input stays
outside stepping. Pending changeAction work guards both stepping and popup entry:

```tsx
<DateTimeInput label="Appointment" value={value} onChange={setValue}
	timeIncrement={5} changeAction={saveAppointment} />
```

Four additional object-driver cases are authored and unrun; the existing nine
preset policy/wiring cases and renderer prerequisite case remain unrun too. The
maintained preset-times fixture includes closed-field stepping and synthesizes
no OS input. Physical keys/repeat, field-editor/IME/draft/caret, bounds/save/focus
ordering, native popup/AX/VoiceOver and packaging remain unqualified. Preset
row-to-editor text relay, full listbox relationships and live announcements remain
gaps.
