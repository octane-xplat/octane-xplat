# Platform date and time pickers

> Use a platform-specific date or time selection control through an explicit
> package entry point.

`@octane-xplat/date-picker` is the second Expo UI port. The native
implementations are adapted from `@expo/ui` sdk-57 (`ios/DatePickerView.swift`,
`android/.../ui/DatePickerView.kt`; MIT — attribution headers sit on the
ported files), re-skinned onto the `updateData`/`onEvent` provider contract.
Like `@octane-xplat/picker`, it groups related controls for distribution but
ships no shared component: each target entry has its own name and contract.

## Install and import

Add `@octane-xplat/date-picker` to the app that renders a control. Import the
platform-specific component from the matching target entry:

- `SwiftUIDatePicker` from `@octane-xplat/date-picker/ios` in `.ios.ts` or `.ios.tsrx`.
- `MaterialDatePicker` from `@octane-xplat/date-picker/android` in `.android.ts` or `.android.tsrx`.
- `DateInput` from `@octane-xplat/date-picker/web` in `.web.ts` or `.web.tsrx`.
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

Runtime constraints on Android, learned on-device:

- **Give the picker a bounded size.** The M3 calendar contains a lazy grid;
  under an unbounded height it composes to zero. Pass `style={{ height: … }}`
  (400 shows the full calendar) or a constrained parent.
- **Keep props identity-stable.** The provider keys its `remember` on
  `initialDate` and the `selectableDates` bounds; a per-render `new Date()`
  produces a new timestamp each push, recreates `DatePickerState`, and drops
  the selection — so each pick appears to do nothing. Memoize the props (or
  use module constants) the same way you would for any controlled control.
- `onDateSelected` emits the picked day as local-midnight milliseconds —
  the provider converts M3's UTC-day storage back, so
  `new Date(ms).toDateString()` shows the selected day.

The macOS entry exports `AppKitDatePicker` — a real `NSDatePicker`
embedded in the leaf's backing view through the `__xplatAppKit` bridge.
`components` selects `'date'` (text field, or the inline graphical
calendar with `pickerStyle: 'graphical'`), `'time'`
(clock-and-calendar field), or `'dateAndTime'`. `selection` is a
controlled `Date` with `onSelectionChange`; `minimumDate`/`maximumDate`
map to `minDate`/`maxDate`, `disabled` to `enabled`. The host element
needs an explicit size — the picker is pinned to its edges.

The web entry exports `DateInput` — a labeled `<input>` whose `type` is
`'date'`, `'time'`, or `'datetime-local'`, with browser-format `value`,
`defaultValue`, `min`, and `max` strings and an `onChange` callback.

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
