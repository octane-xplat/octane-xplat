# Keep native AppKit date-picker selection and attachment current

ID: appkit-native-date-picker
Targets: macos
Related APIs: AppKitDatePicker, AppKitDatePickerProps

## Starting point

The retained AppKit demo claimed native dates were unsupported, but the package
and renderer already had an NSDatePicker attachment. Source inspection found
captured callback props, default reseeding on component/style changes, missing
native label forwarding and unsafe raw action/update cleanup. Reuse that existing
workspace engine before inventing another bridge. Date/time entry is a common
forms/scheduling flow; the stale demo is source adoption evidence, not an observed
native failure or evidence of qualified support.

## Acceptance criteria

- AC1: Own one current native attachment, use the latest callback/label, preserve uncontrolled accepted selection across mode/style/view changes, ignore later defaults, and restore rejected controlled values. Initial missing default uses current time. Retire old callbacks before detach/unmount and suppress programmatic/duplicate/reentrant echoes.
- AC2: Validate Date instants and inclusive bounds, reject reversed/invalid ranges and out-of-bounds controlled values with a generic message. Clamp uncontrolled values to new bounds without emitting, clear removed bounds/labels, block disabled/stale/invalid/out-of-range actions, and recover from repaired props or unavailable bridge without leaking exception details.
- AC3: Bridge guards native enabled state, attached view/window and write depth. Skip unchanged date/range writes; clear old ranges before disjoint replacements, pin owned constraints, deactivate/remove them and deregister actions on detach/partial construction/update failure. Correct the ambient bridge return handle and keep existing mode/style API without new dependencies/props.
- AC4: Replace the maintained AppKit demo placeholder with controlled/uncontrolled mode/style, bounds, disabled, invalid-date, current callback and remount controls. Author an idle probe using that demo, seven owner-model and six new renderer-branch cases, all unrun. Reconcile README/public/skill/feature/target guidance, deferred commands and actual OS editing/IME/focus/AX/layout/calendar/consumer gaps. Close no qualification gate.

## Documentation

- AC1–AC4: [Public native date workflow](../../../docs/platform/date-picker.md#native-macos-selection-lifecycle), [package README](../../../packages/date-picker/README.md), Octane primitives reference, feature note and [target progress](../exploration.md#operational-evidence).
- AC1–AC2: [Owner model cases](../../../packages/date-picker/tests/date-picker-owner.macos.test.mjs), authored but unrun.
- AC3: [Renderer branch cases](../../../packages/macos-renderer/test/date-picker.test.ts), six new cases plus three prior cases, all unrun in this task. Mocked native objects do not prove actual NSDatePicker input/constraint behavior.
- AC4: [Maintained demo](../../../packages/demos/src/NativeDatePickerDemo.macos.tsrx) and [idle manual probe](../../../examples/probes/native-date-picker.macos.tsrx), authored but unrun; mounting is not input or layout qualification.
