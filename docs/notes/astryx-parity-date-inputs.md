# Astryx date-input parity audit

> Prioritize the remaining date-family gaps without duplicating the shared
> controls or replacing the OS-authentic picker leaves.

## Conclusion and evidence boundary

**The three assumed missing capabilities already exist in this checkout:**
typed date entry, a self-rendered calendar grid, and range selection. Recommend
hardening their contracts and accessibility before adding richer touch surfaces.
The starting inventory is stale; this report does not treat it as ground truth.

Audited on 2026-10-02 against xplat commit
`b42a00b7e73c21f7546941fe30fa276b75e3a54f` and Astryx commit
`06c8fa3165537dedbe67101cfcabbe14f0f82e82`. Astryx sources were fetched from
`raw.githubusercontent.com` at that revision: 61 files in the five component
directories plus `utils/dateParser.ts` and its test (63, rather than the
estimated 46). Supplemental sources include `plainDate.ts`, `timeParser.ts`,
`hooks/useGridFocus.ts`, and `utils/inputPresentation.ts`.

Evidence is **desk-source**, plus the local automated checks recorded below.
Component presence and handler logic do not establish OS keyboard behavior,
hit-testing, screen-reader support, or released-package availability. No apps,
screenshots, devices, or Astryx runtime were inspected.

## What xplat actually has

The canonical value and prop contracts are in
[`packages/ui/src/props.ts`](../../packages/ui/src/props.ts). The five components
are exported by [`index.shared.ts`](../../packages/ui/src/index.shared.ts),
[`index.shared.web.ts`](../../packages/ui/src/index.shared.web.ts), and
[`index.macos.ts`](../../packages/ui/src/index.macos.ts).

| Capability                    | Current source coverage                                                                                                                                                                                                                                                | Remaining boundary                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text-entry date input         | `DateInput.web.tsrx` parses a text field; `DateInput.tsrx` has a native textfield on the popover surface; `DateInput.macos.tsrx` has a typed AppKit field. `format`, `min`, `max`, `dateConstraints`, `hasClear`, `changeAction`, and shared field status are exposed. | Mobile defaults to a custom calendar sheet, not text entry. Locale parsing is bounded; native control and focus behavior still need verification. |
| Calendar grid                 | `Calendar.web.tsrx`, `Calendar.tsrx`, and `Calendar.macos.tsrx` render their own cells over `calendar-core.ts` and `datetime.ts`. Props include `numberOfMonths`, `focusDate`, `weekStartsOn`, `hasOutsideDays`, `hasWeekNumbers`, and `hasVariableRowCount`.          | Keyboard support differs by target; a portable grid is already implemented, not a missing leaf.                                                   |
| Range selection               | `CalendarProps` discriminates `mode: 'single'                                                                                                                                                                                                                          | 'range'`; `DateRangeInput`exists in all three platform variants.`DateRange`, `presets`, `minRangeSpan`, and `maxRangeSpan` are public.            | Preset constraint enforcement and controlled-state handling lag Astryx; mobile/macOS lack web hover preview. |
| Time and combined entry       | `TimeInput` supports parsing, seconds, `hourFormat`, and `increment`; `DateTimeInput` uses ISO local date-time values, boundary-day time constraints, `timeIncrement`, and `timeOptionInterval`. Native `TimeWheelPanel.tsrx` supplies scrollable choices.             | Time-option keyboard navigation and touch interaction are thinner than Astryx.                                                                    |
| OS-authentic date/time picker | [`packages/date-picker/package.json`](../../packages/date-picker/package.json) exports only `/ios`, `/android`, `/macos`.                                                                                                                                                 | No shared root or `/web` date-picker export. Its contracts use `Date`, unlike the shared controls.                                                |
| General option picker         | [`packages/picker/package.json`](../../packages/picker/package.json) exposes iOS `SwiftUIPicker`, Android `MaterialDropdown`, and web `Select`. Web `SelectProps` has string values and `options`.                                                                        | It selects arbitrary options; it supplies neither date parsing nor calendar/range semantics.                                                      |

The current [`docs/platform/date-picker.md`](../platform/date-picker.md) already documents shared
entry and explicitly says the former `@octane-xplat/date-picker/web` `DateInput`
was removed. **There is no surviving web leaf to extend:** browser-native entry
now belongs to the shared `DateInput`/`TimeInput`/`DateTimeInput` web variants.

The native leaf is also **not modal-only**:

- `SwiftUIDatePicker` embeds SwiftUI `DatePicker`, with `pickerStyle` values
  `automatic`, `compact`, `graphical`, and `wheel`; `selection`/
  `onSelectionChange`, `minimumDate`, and `maximumDate` are in
  [`src/ios/types.ts`](../../packages/date-picker/src/ios/types.ts).
- `MaterialDatePicker` embeds Compose Material 3 `DatePicker` or `TimePicker`.
  `variant: 'picker' | 'input'` chooses the platform calendar or text-entry
  mode; `initialDate` is uncontrolled and `selectableDates` bounds selection.
  `displayedComponents: 'dateAndTime'` falls back to date-only. See
  [`src/android/types.ts`](../../packages/date-picker/src/android/types.ts) and
  `platforms/android/java/com/octanexplat/datepicker/XplatDatePickerProvider.kt`.
- `AppKitDatePicker` embeds `NSDatePicker`, with `components` and
  `pickerStyle: 'textField' | 'graphical'`. See
  [`src/macos/types.ts`](../../packages/date-picker/src/macos/types.ts).

The Expo dialog wrappers were not ported. These widgets may open OS-owned
surfaces internally, but the package itself exposes embedded controls, with
no first-class interval-selection value contract.

## Astryx behavior: what parity means

### Parsing and text entry

Astryx's [`utils/dateParser.ts`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/utils/dateParser.ts)
exports `parseDateInput` and `isLocaleDayFirst`. It accepts ISO dates, English
month names, numeric dates with consistent separators, and omitted years.
`Intl.DateTimeFormat(...).formatToParts()` resolves ambiguous day/month order;
this is not a fully localized parser for month names or non-ASCII digits. A
final `new Date(text)` fallback makes additional accepted formats engine-dependent.
Bare numeric strings are rejected to avoid committing incomplete input.

The custom desktop text field is **not a fixed masked input**: Astryx keeps
`pendingInput` separate from the ISO committed value, parses during typing,
and formats after blur/Enter. `DateInput.format` affects the committed display,
not the draft. Browser-native segments in
[`NativeDateField.tsx`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/DateInput/NativeDateField.tsx)
use a real `input type="date"`; they should not be described as an Astryx text
mask. A fixed mask would be a separate product choice, not required parity.

Xplat's [`datetime.ts`](../../packages/ui/src/datetime.ts) already provides
`parseDateInput`, locale numeric ordering, English month names, and committed
formatting. It deliberately has no native `Date` parsing fallback; it also
accepts two-digit years, ordinal days, and year-first slash input. Exact parser
acceptance differs, so prefer deterministic documented formats over importing
Astryx's engine-dependent fallback.

### Grid and range model

Astryx's [`Calendar.tsx`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Calendar/Calendar.tsx)
creates month grids and day buttons itself. It supports one/two months, bounded
navigation, weekday ordering, outside days, week numbers, and controlled visible
month. Range selection stores a temporary start, orders the second pick into
inclusive `{ start, end }` ISO dates, supports same-day ranges, and cancels a
repeated anchor when the minimum span forbids one day. Hover previews the pending
interval; Escape cancels it.

[`useCalendarConstraints.ts`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Calendar/hooks/useCalendarConstraints.ts)
checks `min`, `max`, each `dateConstraints` predicate, and inclusive range spans
relative to the pending anchor. It does not promise that every interior day of
a committed range passes the predicates. Xplat's `createDateDisabledCheck` and
`applyRangePick` in [`calendar-core.ts`](../../packages/ui/src/calendar-core.ts)
already implement the same endpoint/span and second-pick model.

Astryx's [`DateRangeInput.tsx`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/DateRangeInput/DateRangeInput.tsx)
is a button trigger plus range calendar and preset buttons, not two masked
editable endpoint inputs. It commits a complete range, closes the popover, and
clears with `null`. Presets are disabled when either endpoint or the inclusive
span violates constraints. Two editable endpoints would extend both products.

### Keyboard and validation

Astryx's calendar delegates focus movement to
[`useGridFocus.ts`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/hooks/useGridFocus.ts):
arrows, Home/End, Ctrl+Home/End, PageUp/PageDown, roving tab stops, disabled-cell
skipping, and RTL horizontal reversal. Button activation selects days. Grid
cells carry `aria-selected`; focused buttons include selection/range state in
localized accessible names. Month and selection changes are announced.

[`DateInput.tsx`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/DateInput/DateInput.tsx)
opens with ArrowDown/Alt+ArrowDown, dismisses with Escape, commits text on
blur/Enter, ignores composing IME key events, and navigates the calendar to a
parsed date. It separates syntactic invalid styling from constraint-gated
commits. External `status` supplies error/warning/success messaging;
`statusVariant`, `disabledMessage`, required/optional states, and async
`changeAction` integrate with its field shell.

[`TimeInput.tsx`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/TimeInput/TimeInput.tsx)
parses 12/24-hour input, supports seconds, bounds, minute stepping, and invalid
input announcements.
[`DateTimeInput.tsx`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/DateTimeInput/DateTimeInput.tsx)
combines date/time segments, narrows time bounds on boundary dates, and offers a
keyboard-controlled preset-time list. Neither local date-time string represents
a timezone-aware instant.

## Prioritized residual gaps and rendering tradeoffs

Priorities below are recommendations based on correctness and user access,
not claims of observed device failures.

| Priority | Gap and concrete evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Platform picker vs custom rendering                                                                                                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | **Controlled-value synchronization.** All `DateRangeInput` variants set local `draft`, then permanently prefer it to `props.value`; no reset is present after a commit. Native/macOS `DateInput` has the same pattern. Web date/time fields clear draft only when the parent echoes it. Astryx uses prop-linked `useOptimistic` and explicitly clears pending date text for external changes. Parent reset, rejected save, and server-corrected values need regression coverage.                                                                                                                                                 | OS selection events do not solve ownership. Retain the portable controlled contract; any platform adapter must reconcile selection with app state.                                                                                             |
| P0       | **Range presets bypass constraints.** Xplat preset handlers call `fireChange(preset.getRange())` directly in web/native/macOS; no endpoint/span check or disabled state is computed. This contradicts the `DateRangePreset` comment in `props.ts`. Astryx checks endpoints and `isRangeWithinSpan`. Xplat also leaves the calendar open after range completion, whereas Astryx closes it.                                                                                                                                                                                                                                        | Two platform pickers cannot supply interval/preset validation. Keep one shared range model and validate every entry path, including presets. Closing after commit is a UX choice to settle explicitly.                                         |
| P1       | **Calendar keyboard and semantics.** Web `handleKeyDown` implements arrows, PageUp/PageDown, and range Escape, but no Home/End or RTL reversal, despite a Home/End source comment. Up/down disabled-day skipping proceeds one day at a time after the initial seven-day jump. Day buttons override their role to `gridcell` while using `aria-pressed`. Native/macOS calendars have no grid key handler; the `CalendarProps` comment overstates macOS keyboard coverage. Astryx preserves grid geometry and separates cell selection from button semantics.                                                                      | OS widgets delegate keyboard/accessibility to the platform but lose the shared range/grid contract. A custom grid must own focus, announcements, endpoint names, and hardware keyboard behavior on each supported target.                      |
| P1       | **Date-time option-list keyboard completeness.** Xplat web `handleDateKey` omits Enter commit; `handleTimeKey` opens the time list on ArrowDown but has no highlighted-option navigation/Enter selection. Astryx handles composing keys, explicit date commit, and option-list navigation.                                                                                                                                                                                                                                                                                                                                       | Native time pickers provide platform interaction; they do not implement the shared pointer combobox or combined boundary rules. Harden custom keyboard paths independently.                                                                    |
| P1       | **Locale and error experience.** Xplat resolves only the runtime Intl locale in `resolveLocale`; Astryx resolves its configured i18n locale. Xplat navigation/invalid-input/selection announcements are hardcoded English. Web fields do have `aria-invalid` and live alerts; native/macOS status tooltips are labels rather than equivalent interactive status buttons.                                                                                                                                                                                                                                                         | OS chrome localizes itself, but custom labels, parsing, status, and announcements still need a coherent app locale. Preserve partial parsing limits rather than claim universal localization.                                                  |
| P2       | **Touch selection richness.** Astryx [TouchDateField.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/DateInput/TouchDateField.tsx) combines `MonthScroller` and `MonthYearWheels`; [TouchTimeField.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/TimeInput/TouchTimeField.tsx) uses snapping wheels that commit live. Xplat mobile DateInput uses a paged Calendar sheet; `TimeWheelPanel.tsrx` uses tap-to-select scroll columns and Done/Cancel, with no equivalent month/year scroller. | Existing SwiftUI/Material/AppKit leaves offer authentic alternatives with different contracts. Custom surfaces preserve styling and portable values but require gesture, focus, scroll, and accessibility work. Exact wheel fidelity can wait. |

The first two findings are source-supported correctness risks. Runtime impact,
including Octane reactivity under external prop changes, remains to be verified.
They deserve focused tests before adding API surface.

## Cross-platform API direction

**Keep the API already in `packages/ui`, rather than introduce duplicate date
components in another leaf.** Shared props stay in `props.ts`; browser/native/
AppKit divergence stays in platform files. Plugin-backed authentic controls
remain in `packages/date-picker`; no new `packages/ui` dependencies or peers.

The existing portable contract is a suitable base:

```ts
// Existing contract summary, not a new implementation or package proposal.
type DateRange = { start: ISODateString; end: ISODateString }
// ISODateString: YYYY-MM-DD; ISOTimeString: HH:MM[:SS].
// ISODateTimeString: YYYY-MM-DDTHH:MM[:SS], without timezone.
// DateInput: value?, onChange(value | undefined), min?, max?, dateConstraints?
// Calendar: mode="range", value?, onChange(range), min/maxRangeSpan?
// DateRangeInput: value: DateRange | null, onChange(range | null), presets?
```

Text entry **does make sense on native** for known dates, data-entry workflows,
and hardware keyboards. It need not be the default touch interaction. The
existing `presentation="popover"` mobile path exposes the typed textfield;
adaptive/native presentations resolve to the custom sheet. macOS currently
always uses the typed pointer surface. A date-only `text-input` presentation
would be an optional extension: today `text-input` is TimeInput-only.

Keep presentation semantics explicit:

| Setting           | Current web behavior                                                              | Current native/AppKit boundary                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `popover`         | Typed field plus custom calendar/time surface.                                    | Mobile DateInput uses textfield plus custom calendar; macOS date entry uses its pointer surface.                                              |
| `bottom-sheet`    | Custom touch surface.                                                             | Mobile uses custom Calendar/TimeWheelPanel; macOS DateInput resolves to the pointer surface.                                                  |
| `native`          | Browser date/time inputs.                                                         | Mobile shared controls fall back to custom sheets; this does not import SwiftUI/Material pickers. macOS DateInput remains custom typed entry. |
| `adaptive-native` | Coarse pointer chooses browser-native input; fine pointer chooses custom popover. | Mobile chooses custom sheets.                                                                                                                 |

`nativePicker` is a deprecated compatibility policy; `presentation` wins. Keep
`bind` handles instead of promising a DOM ref on native. `Date` in constraint
callbacks or platform leaf props is a conversion boundary, not the portable
serialized value. An app needing an instant must choose timezone/DST policy
outside these wall-clock controls.

Potential extensions should be separate decisions: an explicit locale override,
structured validation reasons, date-only text presentation, or two typed range
endpoints. None is adopted by this audit. Neither product's endpoint constraints
currently establish an all-interior-days-valid range invariant.

## Recommended phasing and acceptance evidence

1. **Correctness first:** cover parent reset/rejection/correction after every
   input commit; enforce preset endpoint/span constraints; settle range-close
   behavior. Exercise async loading and rejected `changeAction` paths. Reuse
   the existing parsers and range reducer.
2. **Keyboard and accessibility:** complete web grid navigation and time-list
   selection, correct grid selection semantics and endpoint announcements,
   verify IME/blur/Enter and focus return, then establish macOS/native hardware
   keyboard expectations. Test actual OS input and VoiceOver/TalkBack; handler
   dispatch alone is insufficient.
3. **Locale and validation contract:** align configured locale, formatting,
   numeric parsing, and translated announcements; document accepted text
   formats and invalid-draft behavior. Prefer a deterministic parser to the
   upstream native-Date fallback. Do not add a fixed mask merely for parity.
4. **Touch improvements when justified:** evaluate month/year navigation and
   snapping wheels against the present Calendar/Done flow. Keep authentic
   platform picker alternatives; introduce no second portable date API.

## Verification and documentation coverage

Existing maintained evidence includes
[`date-entry.web.test.tsx`](../../packages/ui/src/date-entry.web.test.tsx) for web parsing,
calendar picks, range ordering/bounds, clearing, time stepping, and presets, and
[`datetime.test.ts`](../../packages/ui/src/datetime.test.ts) for date math and
parsers. These tests do not establish the residual behaviors listed above.

Audit checks:

- All Markdown local links resolve, and every linked Astryx raw source exists
  in the fetched revision's source snapshot.
- `git diff --check` passes for the report.
- Attempted `pnpm --filter @xplat/web exec vitest run
packages/ui/src/datetime.test.ts packages/ui/src/date-entry.test.tsx`;
  execution was blocked because `vitest` is unavailable in this worktree.
  Existing test cases were inspected, not executed.
- Attempted `pnpm exec oxfmt --check docs/notes/astryx-parity-date-inputs.md`;
  execution was blocked because `oxfmt` is unavailable. Markdown was reviewed
  directly; no dependency installation was performed for this audit.
- Targets run: none. No browser, native, or packaged-consumer behavior is
  verified by this audit. No component code,
  public workflow, recipes, examples, or generated changelog is changed. Therefore
  no recipe coverage migration is required; recommendations are future work,
  not adopted behavior or release commitments.

## Implementation follow-up plan

The follow-up authorizes implementation of the highest-priority findings.
The original audit above remains a snapshot of the audited revision.

| Phase                | Concrete change                                                                                                                                                                                                                                                                                                 | Acceptance evidence                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1: committed values  | Remove persistent local committed drafts from all web/mobile/AppKit date, time, combined, and range inputs. Keep typed drafts only while editing; echoed values preserve typing, external corrections/reset replace it. Async action settlement releases loading on success, rejection, or synchronous failure. | Web component regressions for echo/correction/reset and rejected saves; platform typechecks and UI build.  |
| 1: range constraints | Centralize complete-range validation; reject malformed/reversed ranges, endpoint constraints, and inclusive span violations at every range commit. Disable disallowed presets on all three leaves and close the picker after a valid complete selection.                                                        | Validator and component regressions; handler probes for controlled reset and presets on available targets. |
| 2: keyboard          | Complete web grid Home/End/RTL and geometry-preserving disabled-day traversal; correct grid semantics and date-time option navigation. Establish native hardware-keyboard expectations separately.                                                                                                              | Maintained keyboard tests followed by OS input and assistive-technology checks.                            |
| 3: locale            | Add an explicit app-locale/announcement contract only after reconciling the existing i18n boundary.                                                                                                                                                                                                             | Parser/format consistency tests and translated status/selection evidence.                                  |
| 4: touch             | Evaluate month/year scrollers and snapping wheels against the existing paged calendar and Done/Cancel controls.                                                                                                                                                                                                 | Device gesture, scroll, and accessibility evidence.                                                        |

Phases 2–4 remain follow-up scope after the first correctness phase. No new
portable component names, dependencies, timezone semantics, or platform picker
adapters are required for phase 1.

### Phase 1 implementation and verification

Phase 1 is implemented: all twelve web/mobile/AppKit date-family input leaves
use the parent's committed value, preserve echoed typed text, and replace it on
external correction. `date-field-action.ts` releases loading for successful,
rejected, and synchronously throwing actions; app code owns failure messages
through `status`. `calendar-core.ts:isDateRangeAllowed` validates every complete
range commit. Presets expose disabled state on all three leaves, and valid
calendar/preset selections close their picker. Public names and value types are
unchanged; shared prop comments, the date-picker guide, recipe AC2, and the
maintained web example now describe the contract.

Checks for this follow-up:

- Focused web date-entry/date-math suite: **35 tests passed**, including parent
  echo/correction/reset, rejected and throwing actions, range constraints, and
  close-on-completion. The DOM suite is now `date-entry.web.test.tsx`, matching
  the platform-file lint convention.
- Native universal-runtime suite: **81 tests passed**. This is renderer/store
  regression evidence, not date-picker device or accessibility coverage.
- `pnpm --filter @octane-xplat/ui build`: web/native bundles, declaration emit,
  and native-dist import guard pass.
- Scoped `tsrx-tsc --noEmit` checks for the five date component roots pass on
  web and mobile; the maintained web example also passes. App-wide web/mobile/
  macOS checks remain blocked by unrelated VideoDemo, motion/table/example,
  generated-route, and missing styled-system diagnostics. Scoped AppKit source
  checking also exposes the existing renderer's incomplete intrinsic typings.
- Web Chromium handler probe: **8 assertions passed**, covering typed date
  emission/correction, range validation, preset commits, and reset. Interaction
  is DOM dispatch; OS input and assistive technology were not tested.
- The full iOS range probe cannot complete: opening the sheet throws
  `NativeClass is not defined` in `attachTapToBlur`, an existing probe-host
  limitation. A separate iOS DateInput-only state probe passes **2 assertions** for
  typed emission and external correction through gesture/text dispatch. It
  does not stand in for the failed range probe or prove OS input.
- macOS probe: build blocked by the existing `svg.mobile.ts` platform-boundary
  error; no AppKit runtime assertions executed. Android is unavailable (no
  authorized device); Linux was not run.
- `pnpm check:recipes`, changed TSRX component rule/spacing checks, new helper
  and DOM-test lint, and `git diff --check` pass. Existing spacing violations
  elsewhere in `calendar-core.ts` remain; its unchanged sections were preserved.

Affected recipe: `date-picker` AC2 (controlled values and range constraints)
and AC6 (maintained example and focused checks). Coverage and per-target
verification are recorded separately in local Silo after the implementation
commit. Keyboard, locale, and touch phases remain planned; native range runtime
coverage and AppKit input/accessibility are explicit verification gaps.
