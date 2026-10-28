# Show AppKit busy feedback

ID: appkit-busy-feedback
Targets: macos
Related APIs: Spinner, ActivityIndicator, Switch

## Starting point

A settings screen that saves a switch preference and displays progress feedback.

## Acceptance criteria

- AC1: Spinner honors named sizes, contrast, text/node labels, accessible names, class/style forms and busy=false removal. A labeled ring has one ID and one progress owner.
- AC2: Pending Switch saves and external isLoading render a compact ring inside the thumb; success removes pending feedback while preserving the switch state. Keep existing save/rollback and label/track behavior intact.
- AC3: Keep the static self-drawn ring distinct from actual native animation playback; report real appearance, clipping, contrast, VoiceOver and packaged verification separately.

## Documentation

- AC1: [Busy feedback guide](../../../docs/app/components.md#busy-feedback-on-appkit) and [authored Spinner source cases](../../../packages/ui/src/activity-indicator.macos.mobile.test.tsrx). Tests are unrun.
- AC2: [Switch source cases](../../../packages/ui/src/switch.macos.mobile.test.tsrx) and the same guide. Native busy presentation remains unqualified.
- AC3: The guide and [target progress](../parity/appkit-progress.md#appkit-busy-feedback) record the animation gap and exact deferred commands; no runtime or pixel claim is made.
