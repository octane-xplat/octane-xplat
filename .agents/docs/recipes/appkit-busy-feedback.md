# Show AppKit busy feedback

ID: appkit-busy-feedback
Targets: macos
Related APIs: Spinner, ActivityIndicator, Switch, ProgressBar, Meter, ProgressGroup

## Starting point

A settings screen that saves a switch preference and displays progress feedback.

## Acceptance criteria

- AC1: Spinner honors named sizes, contrast, text/node labels, accessible names, class/style forms and busy=false removal. A labeled ring has one ID and one progress owner.
- AC2: Pending Switch saves and external isLoading render a compact ring inside the thumb; success removes pending feedback while preserving the switch state. Keep existing save/rollback and label/track behavior intact.
- AC3: Keep the static self-drawn ring distinct from actual native animation playback; report real appearance, clipping, contrast, VoiceOver and packaged verification separately.

- AC4: ProgressBar preserves declared style forms and authored overrides, follows theme changes, forwards accessible/name/hint/value props, and restores removed overrides. Unknown progress skips formatter/readout/marks/numeric range/value and reports busy; disabled progress reports disabled. Keep its static fill distinct from animation qualification.

- AC5: Root/purpose/ProgressGroup Meter paths share one implementation that preserves caller children, the existing unfilled track, authored style forms and normalized finite range/geometry metadata. Keep missing value arc/color and native drawing/AX qualification explicit.

## Documentation

- AC1: [Busy feedback guide](../../../docs/app/components.md#busy-feedback-on-appkit) and [authored Spinner source cases](../../../packages/ui/src/activity-indicator.macos.mobile.test.tsrx). Tests are unrun.
- AC2: [Switch source cases](../../../packages/ui/src/switch.macos.mobile.test.tsrx) and the same guide. Native busy presentation remains unqualified.
- AC3: The guide and [target progress](../parity/appkit-progress.md#appkit-busy-feedback) record the animation gap and exact deferred commands; no runtime or pixel claim is made.

- AC4: [Progress usage and limitations](../../../docs/app/components.md#busy-feedback-on-appkit), four [object-driver cases](../../../packages/ui/src/progress-bar.macos.mobile.test.tsrx), [manual target fixture](../../../examples/probes/progress-bar.macos.tsrx) and [target progress](../parity/appkit-progress.md#appkit-progressbar-styles-theme-and-state). All cases and fixture are unrun; native drawing/theme/AX/animation/layout and packaging remain unqualified.

- AC5: [Meter subset and usage](../../../docs/app/components.md#busy-feedback-on-appkit), four [Meter source cases](../../../packages/ui/src/meter.macos.mobile.test.tsrx), [shared progress fixture](../../../examples/probes/progress-bar.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-meter-entrypoint-consolidation). Cases and fixture are unrun; value arc/color and native layout/drawing/AX/packaging remain gaps.
