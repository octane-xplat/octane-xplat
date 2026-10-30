# Dates and times

Use for AppKit calendar intent, drafts, stepping, bounds, refs, and native date-picker ownership. Apply [native interaction prerequisites](accessibility.md) and keep input, model, and OS evidence separate.

## AppKit calendar day keyboard intent

Calendar now adapts calendarKeyTarget through a private per-calendar native day
registry. One enabled day is a Tab candidate across panes. Arrows/row edges/grid
edges/month pages share existing bounds/disabled predicates; Enter/Space uses the
existing single/range selection owner. Explicit/provider RTL controls horizontal
intent. An unfinished range consumes Escape locally; the layer monitor asks the
shared renderer dispatcher first and deduplicates the native event across monitor
order. Ordinary Escape and Tab stay with the surrounding layer/native traversal.
Header controls retain their keys.

```tsx
import { useState } from 'octane'
import { Calendar } from '@octane-xplat/ui'
import type { DateRange } from '@octane-xplat/ui'

export function StayDates() {
	const [range, setRange] = useState<DateRange | null>(null)
	return <Calendar mode="range" value={range} onChange={setRange} numberOfMonths={2} maxRangeSpan={14} />
}
```

Controlled focusDate requests defer native focus until accepted cells attach.
Pending focus stays in its request window; header/imperative navigation and
teardown invalidate it. Current native ownership, disabled/hidden state and
first-responder identity guard key dispatch; pointer selection still works on
older bridges.  Source intent is not physical-key, Tab/focus, popup/modal, RTL, AX/live
announcement or package qualification. AppKit preset-list source ownership is
covered below; NativeScript time-list keys remain a gap. AppKit time stepping
is described below. See
[AppKit calendar keys](../../../../../docs/platform/date-picker.md#navigate-appkit-calendar-days-with-keys).

## AppKit typed date/time Return boundary

DateInput, TimeInput and both DateTimeInput textfields now route onSubmit to their
existing blur commit function. Existing parsing/range/marked-text checks, null
clear values and controlled parent feedback remain the contract; this adds no new
public prop or independent key parser.

```tsx
import { TimeInput } from '@octane-xplat/ui'

export function StartTime(props: { value: string | null; change(value: string | null): void }) {
	return <TimeInput label="Start time" value={props.value} onChange={props.change} />
}
```

The source wiring and maintained date-submit fixture do not establish physical
Return delivery, blur ordering, IME/caret/draft/validation, focus/AX or packaging.
All runtime checks remain deferred. AppKit time stepping is covered below;
DateTimeInput preset-list source ownership is covered below. See [typed Return boundary](../../../../../docs/platform/date-picker.md#commit-typed-appkit-date-and-time-drafts-with-return).

## AppKit DateTimeInput preset keys

With timeOptionInterval, Alt+Down from the actual time field opens the preset
popup. The native option owner seeds near current/typed time, retains one option
Tab candidate, and uses bounded Up/Down/Home/End without changing the parent value.
Enter/Space chooses through current time options and the existing commit path;
row focus/highlight is distinct from committed selection.

```tsx
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment(props: { value: string | null; change(value: string | null): void }) {
	return <DateTimeInput label="Appointment" value={props.value} onChange={props.change} timeOptionInterval={15} />
}
```

Tab/Shift-Tab records the field's current neighbor via the existing private return
owner; ordinary layer Escape/dismissal requests the time field. Current option,
blocked/busy/detached and reentrant-selection guards precede data callbacks.
Native refs and popup observers/claims release on teardown, and changing options
repairs focused rows. Older bridges keep pointer entry. Field text editing happens
after leaving the popup: no row-to-editor text/typeahead relay is added.

 Native input,
proxy/ref/window order, actual focus/Tab/return/busy timing, scroll, IME, popup/modal,
AX/listbox relationships and packaging require separate target qualification. Full option AX semantics,
row text relay remain gaps. Standalone TimeInput stepping is covered below. See [preset time keys](../../../../../docs/platform/date-picker.md#choose-appkit-preset-times-with-keys).

## AppKit TimeInput minute stepping

TimeInput binds plain Up/Down to the existing adjustTime minute policy: committed
value (local current time when empty), midnight wrap, preserved optional seconds
and rejection outside min/max. Parent echo remains authoritative; a requested step
clears private draft text after dispatching a valid request, including when the
parent declines it. Modified/prevented keys,
marked editors, foreign/detached targets and current blocking state are guarded.
The write claim precedes onChange reentry; changeAction owns a pending guard through
settlement, and detached saves settle without UI state writes.

```tsx
import { TimeInput } from '@octane-xplat/ui'

export function Starts(props: { value: string | null; change(value: string | null): void }) {
	return <TimeInput label="Starts" value={props.value} onChange={props.change} increment={15} />
}
```


Physical key/repeat, field-editor/IME/caret/draft/focus/AX and packaging remain
unqualified. DateTimeInput stepping follows below; live announcements remain
a gap. See [AppKit time stepping](../../../../../docs/platform/date-picker.md#step-appkit-time-values-with-arrow-keys).

## AppKit DateTimeInput closed-field minute stepping

Plain current-field Up/Down uses timeIncrement independently of preset cadence.
The adapter steps the committed time or date-less draft/current time through
shared arithmetic/bounds, keeps the date on midnight wrap, and preserves optional
seconds. Date-less changes remain private until a date is committed. Either open
popup retains plain arrows; Alt+Down still requests presets. Current modifiers,
composition and disabled/busy/detached guards preserve native editing commands.

```tsx
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment(props: { value: string | null; change(value: string | null): void }) {
	return <DateTimeInput label="Appointment" value={props.value} onChange={props.change}
		timeIncrement={5} timeOptionInterval={15} />
}
```

The shared target change boundary claims before callback reentry and retains a
pending save guard through settlement; accepted saves dispatch after callback
teardown without detached busy-state writes. Parent values remain authoritative.
Four added wiring cases and the extended preset-times fixture require separate verification;
physical key/repeat, IME/editor/caret/draft/focus/save/AX and packaging remain
unqualified. Row-to-editor relay, complete listbox relationships and live
announcements remain gaps. See [closed time-field stepping](../../../../../docs/platform/date-picker.md#step-the-appkit-date-time-field-without-opening-presets).

## AppKit date-family imperative refs

DateInput/TimeInput/DateTimeInput now deliver their existing TextInputHandle refs;
DateRangeInput replaces inert focus/blur with trigger responder requests. Native
reads are live, not snapshots. The date-time primary host is its date segment;
blur checks both owned segments and their current field editors. Focus rejects
current blocked, hidden, disabled or detached hosts; blur preserves unrelated
responders and does not open/close layers or directly parse/commit text.

```tsx
import { useRef } from 'octane'
import { Button, DateInput } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export function Booking(props: { date: string | null; change(date: string | null): void }) {
	const input = useRef<TextInputHandle | null>(null)
	return <>
		<DateInput ref={input} label="Booking date" value={props.date} onChange={props.change} />
		<Button label="Edit date" clickAction={() => input.current?.focus()} />
	</>
}
```

Three policy/six object-driver cases and the date-focus fixture require separate verification; source
wiring is not native ref/editor/focus/IME/layer/AX qualification. DateInput/TimeInput
hasAutoFocus now has separate source wiring; native attachment timing requires separate target qualification. See [date focus handles](../../../../../docs/platform/date-picker.md#focus-an-appkit-date-field-from-a-form-action).

## AppKit date/range change ownership

DateInput and DateRangeInput now claim before validating/calling app callbacks,
check current constraints and exclude reentry/pending saves. Picker callbacks
require current open/attached ownership; blocked popups close, cached entry is
guarded and current preset labels resolve replacement ranges. Keep constraint/
preset getters pure: activation resolves one current range but rendering also
calls them. Parent values remain authoritative; failure releases busy state and
an accepted save dispatches after callback teardown without detached settlement
UI writes.

```tsx
<DateRangeInput label="Stay" value={range} onChange={setRange}
	changeAction={saveRange} maxRangeSpan={14} />
```

 Native
callback/ref/save/blur/focus/IME/popup/AX/package behavior is unqualified; no save
cancellation, automatic rollback or live-error delivery is added. See [date save ownership](../../../../../docs/platform/date-picker.md#keep-appkit-date-saves-owned-by-one-edit).

## AppKit date/time autofocus request ownership

DateInput/TimeInput now wire their existing hasAutoFocus flag to a private
post-commit request owner. It waits for first attachment/visibility only while
input and window observation are available, cancels on user activity, changed
responders, blocking/ref/window changes or teardown, and claims before native
focus callbacks. Native refusal is not retried. False-to-true explicitly rearms;
unblocking alone does not. No window activation or picker opening is requested.

```tsx
import { DateInput } from '@octane-xplat/ui'
export function NewBooking() {
	return <DateInput label="Booking date" hasAutoFocus />
}
```

 Popover is
mocked away in component cases; this is not modal containment/native caret/IME/
AX evidence. See [autofocus guidance](../../../../../docs/platform/date-picker.md#request-initial-appkit-date-or-time-focus).
This does not change DateTimeInput/DateRangeInput (no autofocus flag), nor qualify
PowerSearch initial-focus ownership. Read [Typeahead focus ownership](search.md#appkit-typeahead-focus-and-request-ownership) for that separate control.

## AppKit TimeInput draft ownership

TimeInput now guards text/submit/clear before pending-state writes using current
blocking, callback reentry and save ownership. A live draft record lets retained
submit/edit callbacks read current text, seconds and bounds. Post-callback clear
checks draft identity and native attachment; external parent correction wins.
The existing date-composition.macos.ts already supplies native marked-text checks;
do not infer missing AppKit support from the unsuffixed mobile helper.

```tsx
import { useState } from 'octane'
import { TimeInput } from '@octane-xplat/ui'
export function StartTime() {
	const [time, setTime] = useState<string | null>('14:30')
	return <TimeInput label="Start time" value={time} onChange={setTime}
		min="09:00" max="18:00" hasClear />
}
```

 Native editor/IME/Return/
blur, pending-save/caret/focus/AX and package behavior require separate target qualification. The
analogous DateTimeInput draft path now has the separate source below. See [time drafts](../../../../../docs/platform/date-picker.md#keep-appkit-time-drafts-owned-by-the-current-edit).

## AppKit DateTimeInput draft ownership

DateTimeInput now guards both text drafts and date-less time state using current
attachment/blocking/save ownership. Retained handlers read latest locale, date/
time parts, seconds and endpoints. A local edit claim blocks callback reentry;
constraint callbacks cannot commit metadata replaced during validation. Draft/
local-time records prevent old post-callback clears from overwriting parent
correction or teardown. Identical committed values do not repeat change/save.

```tsx
import { useState } from 'octane'
import { DateTimeInput } from '@octane-xplat/ui'
export function Appointment() {
	const [value, setValue] = useState<string | null>(null)
	return <DateTimeInput label="Appointment" value={value} onChange={setValue} hasClear />
}
```

 Native editor/IME/
Return/blur, save/ref/picker/keyboard/focus/AX and packaging require separate target qualification;
Popover is mocked away in the new cases. Existing composition/preset-key policy
is retained. Read [current date-time drafts](../../../../../docs/platform/date-picker.md#keep-both-appkit-date-time-drafts-current).

## AppKit PowerSearch absolute UTC dates

Native date_absolute now reuses the range form's strict UTC parser instead of
unchecked date coercion. Preserve unchanged stored precision/expanded years; new
four-digit-year date/time text keeps seconds/milliseconds and rejects calendar
rollover, partial/ambiguous/offset text. Date-only deliberately saves midnight UTC,
rejects typed time and handles the pre-epoch sub-millisecond UTC day. Invalid
stored instants are editable errors, not render exceptions or saved NaN. Source
revision includes date-only mode; reuse scalar readonly/composition/stale/Cancel/
submit guards. UTC labels are explicit; timezoneID-specific display, calendar
widgets and broader parsing need custom editors.

```ts
import type { DateAbsoluteOperatorValue } from '@octane-xplat/ui'
const dateTime: DateAbsoluteOperatorValue = { type: 'date_absolute' }
const calendarDay: DateAbsoluteOperatorValue = { type: 'date_absolute', isDateOnly: true }
```

Six date-model and two additional mocked-control scalar cases plus the expanded
idle scalar fixture require separate verification. The scalar case file now contains seven cases;
these do not qualify native text/IME/focus/AX/calendar/installed-consumer behavior.
No public type/dependency/React Aria presence change. See
[absolute UTC workflow](../../../../../docs/app/power-search.md#edit-native-appkit-absolute-dates).

## Native AppKit date-picker ownership

Use AppKitDatePicker from @octane-xplat/date-picker/macos only in native macOS
files; its renderer-installed attachDatePicker bridge already creates NSDatePicker.
Do not replace that workspace bridge with an app-only installer or infer support
absence from the old demo placeholder. The default seed is retained across mode/
style/view changes; controlled values restore when rejected. Clamp uncontrolled
values to new inclusive bounds without callbacks; invalid dates/reversed bounds/
out-of-range controlled values show a generic error until props are repaired.
Current callbacks/labels update, removed bounds/labels clear, and disabled/stale/
programmatic/duplicate actions do not emit. Retire sessions before native detach,
suppress construction/update echoes and clean up partial constraints/actions.
The renderer skips unchanged date/range writes to avoid disturbing native edits.

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

The maintained native-date demo replaces its placeholder; an idle probe mounts
that same demo. 
Native NSDatePicker editing/IME/Tab/VoiceOver, focus/layout, calendar/clock settings,
actual callback timing and clean installed consumers require separate target qualification. Renderer
bridge returns update/detach (its ambient signature was previously void). No new
dependency/public prop or React Aria presence-level change. See
[native date workflow](../../../../../docs/platform/date-picker.md#native-macos-selection-lifecycle).
