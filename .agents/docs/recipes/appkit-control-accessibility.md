# Expose AppKit self-drawn control semantics

ID: appkit-control-accessibility
Targets: macos
Related APIs: Switch, Slider, TabList, Tab

## Starting point

Self-drawn settings controls and tab strips hosted in AppKit Mason views.

## Requirements

Expose self-drawn AppKit controls' roles, values and keyboard activation through
native accessibility semantics without claiming VoiceOver or OS-input proof.

## Acceptance criteria

- AC1: Map switch/tab/tablist/adjustable/link roles and checked/selected/numeric values to AppKit semantics. Honor explicit ignored hosts without conflating source mappings with VoiceOver support.
- AC2: Native increment/decrement selectors invoke current callbacks in a discrete event scope; disabled/read-only/ignored/detached or missing callbacks reject dispatch. Prop removal clears the callback.
- AC3: Changed value/checked/selected props post value-change notifications, avoiding initial/equal-value announcements. Keep native selector registration, notification ordering, OS input, VoiceOver, tab/panel relationships and packaging evidence separate.

- AC4: Focused action hosts activate on unmodified Enter/Space and preserve Shift-only activation. Control/Option/Command combinations, disabled/read-only accessibility state and missing actions use native key handling. Keep actual shortcut/menu/input-source/OS qualification separate.

- AC5: Expose the NSAccessibility enabled protocol getter isAccessibilityEnabled and read that same getter in AppKit choice/grid/scope/layer/context focus policies. Preserve disabled-card focus claims without enabling actions; distinguish JavaScript calls and SDK selector evidence from native registration/AX/focus proof.

## Documentation

- AC1: [Renderer contract](../../../packages/macos-renderer/README.md#self-drawn-control-accessibility) and [authored source regressions](../../../packages/macos-renderer/test/common-control-accessibility.test.ts).
- AC2: The same contract and source cases cover action dispatch/guards; [target note](../exploration.md#operational-evidence) records exact deferred commands.
- AC3: The [renderer contract](../../../packages/macos-renderer/README.md#self-drawn-control-accessibility) and [source regressions](../../../packages/macos-renderer/test/common-control-accessibility.test.ts) document notification scope and remaining native qualification gates. No runtime or assistive-technology evidence is claimed.

- AC4: [Native activation contract](../../../packages/macos-renderer/README.md#self-drawn-control-keyboard-activation) and [authored shortcut/guard cases](../../../packages/macos-renderer/test/common-control-accessibility.test.ts). No actual OS key or shortcut run is claimed.

- AC5: [Renderer selector contract](../../../packages/macos-renderer/README.md#self-drawn-control-accessibility), added retained-state/selector regression, corrected existing focus/action fixtures and [target note](../exploration.md#operational-evidence). Native bridge/AX/focus qualification is deferred.
