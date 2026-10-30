# Show AppKit busy feedback

ID: appkit-busy-feedback
Targets: macos
Related APIs: Spinner, ActivityIndicator, Switch, ProgressBar, Meter, ProgressGroup

## Starting point

A settings screen that saves a switch preference and displays progress feedback.

## Acceptance criteria

- AC1: Spinner honors named sizes, contrast, text/node labels, accessible names, class/style forms and busy=false removal. A labeled ring has one ID and one progress owner.
- AC2: Pending Switch saves and external isLoading render a compact ring inside the thumb; success removes pending feedback while preserving the switch state. Keep existing save/rollback and label/track behavior intact.
- AC3: Wire AppKit-specific ring rotation/unknown-progress translation to the existing keyframe sampler, clip moving fills, remove determinate animation classes and leave steady feedback under reduced motion. Refresh media on workspace display-option notifications. Keep source wiring distinct from actual native animation playback; report real appearance, clipping, contrast, VoiceOver and packaged verification separately.

- AC4: ProgressBar preserves declared style forms and authored overrides, follows theme changes, forwards accessible/name/hint/value props, and restores removed overrides. Unknown progress skips formatter/readout/marks/numeric range/value and reports busy; disabled progress reports disabled. Keep the unknown fill/keyframe source path distinct from animation qualification.

- AC5: Root/purpose/ProgressGroup Meter paths share one implementation that preserves caller children, the existing unfilled track, authored style forms and normalized finite range/geometry metadata. Keep missing value arc/color and native drawing/AX qualification explicit.

## Documentation

- AC1: [Busy feedback guide](../../../docs/app/components.md#busy-feedback-on-appkit) and [authored Spinner source cases](../../../packages/ui/src/components/forms/activity-indicator.macos.mobile.test.tsrx). Tests are unrun.
- AC2: [Switch source cases](../../../packages/ui/src/components/forms/switch.macos.mobile.test.tsrx) and the same guide. Native busy presentation remains unqualified.
- AC3: The guide and [target progress](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-busy-feedback) record historical limits; the [animation follow-up](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-busy-animation-source-and-reduced-motion-refresh) records current source wiring and exact deferred commands; no runtime or pixel claim is made.

- AC4: [Progress usage and limitations](../../../docs/app/components.md#busy-feedback-on-appkit), four [object-driver cases](../../../packages/ui/src/components/feedback/progress-bar.macos.mobile.test.tsrx), [manual target fixture](../../../examples/probes/progress-bar.macos.tsrx) and [target progress](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-progressbar-styles-theme-and-state). All cases and fixture are unrun; native drawing/theme/AX/animation/layout and packaging remain unqualified.

- AC5: [Meter subset and usage](../../../docs/app/components.md#busy-feedback-on-appkit), four [Meter source cases](../../../packages/ui/src/components/feedback/meter.macos.mobile.test.tsrx), [shared progress fixture](../../../examples/probes/progress-bar.macos.tsrx) and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-meter-entrypoint-consolidation). Cases and fixture are unrun; value arc/color and native layout/drawing/AX/packaging remain gaps.

- AC3: One added [animation-reset case](../../../packages/css-engine/test/css-cascade.test.ts), three [busy CSS/sampler/playback source cases](../../../packages/macos-renderer/test/busy-animations.test.ts), two [workspace observer source cases](../../../packages/macos-renderer/test/accessibility-display.test.ts) and one added [progress-class case](../../../packages/ui/src/components/feedback/progress-bar.macos.mobile.test.tsrx), all unrun. The [target fixture](../../../examples/probes/progress-bar.macos.tsrx) now mounts a spinner as well; its runner records mounting only. Actual CSS preprocessing/bundling, native notifications/playback/teardown and reduced-motion behavior remain unqualified.
