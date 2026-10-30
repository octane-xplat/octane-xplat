# Request initial AppKit date or time focus

ID: appkit-date-autofocus
Targets: macos
Related APIs: DateInput, TimeInput, TextInputHandle

## Starting point

An onboarding or booking form whose newly mounted date/time field requests
initial focus. Other input or modal focus remains user-owned.

## Acceptance criteria

- AC1: Wire existing hasAutoFocus to one queued post-commit attempt; wait for first visible/attached host only with native window/input observation. Observe current props/state and accept property/callable native guards. Do not activate windows, open pickers, parse text or emit value changes.
- AC2: Cancel stale requests on keyboard/pointer input, deactivation, changed responder, ref/window replacement, hidden-detach transition, disabled/read-only/busy state, flag removal and teardown. Claim before callbacks; release partial/complete native observation. Unblocking alone does not rearm; explicit false-to-true does. Already-owned editors/refusal do not retry.
- AC3: Separate source/mock evidence from actual attachment/notification ordering, native responder/caret/IME, competing autofocus/modal scopes, input/hit testing, accessibility and packaging qualification.

## Documentation

- AC1: [AppKit date focus guide](../../../docs/platform/date-picker.md#request-initial-appkit-date-or-time-focus), [private request owner](../../../packages/ui/src/internal/accessibility/auto-focus.macos.ts) and [policy cases](../../../packages/ui/src/internal/accessibility/auto-focus.macos.test.ts). All cases unrun.
- AC2: The same guide/cases plus [component cases](../../../packages/ui/src/components/forms/date-autofocus.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/date-autofocus.macos.tsrx). Object cases use native fakes and mock away Popover, so they do not prove layer behavior.
- AC3: [Target note](../exploration.md#operational-evidence) records exact deferred commands and limits; no native gate closes from source coverage.
