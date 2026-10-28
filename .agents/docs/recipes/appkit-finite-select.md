# Choose finite AppKit options

ID: appkit-finite-select
Targets: macos
Related APIs: Selector, MultiSelector

## Starting point

A finite option picker supports single/multiple choices and optional save actions.

## Acceptance criteria

- AC1: Multiple mode and the preset reach checkbox/select-all presentation. Bulk selection includes visible enabled options, emits arrays and exposes mixed/checked bulk state.
- AC2: Disabled/read-only/pending hosts reject selection. Pending duplicate requests are blocked by the existing state owner and failed uncontrolled saves restore the previous selection. Single options expose radio checked state; trigger metadata includes expanded/busy state.
- AC3: Custom option and single-value renderers receive resolved options; primitive results get native text hosts. Missing selected options retain the summary fallback. Default icons and stable concrete anchor/search refs are preserved.
- AC4: Separate authored inline-popup source cases from actual NSPopover/native input/layout/AX evidence. Keep actual arrow/typeahead/focus qualification, badge interaction, presentation/ghost chrome and live-region gaps visible.

- AC5: Keyboard opening/manual option navigation, Home/End/Page keys, commit, prefix cycling, local-search handoff and nonediting multi bulk shortcuts preserve editor/IME/modified-key ownership and pending guards.
- AC6: Native rows share focus/Tab ownership, initial focus waits for attached popup/search views, Escape restores the anchor and Tab requests same-window key-view return intent through the existing layer owner. Release observers/claims on close/detach; unavailable key dispatch preserves ordinary Tab stops. Distinguish fake wiring from real popup focus and modal integration.

- AC7: Standalone Selector owns label/description/status through FormField; enclosing Field owns metadata once and supplies disabled/read-only state. Stable explicit/generated trigger IDs, testID and hidden names survive metadata updates. Ghost forwards its shared class without a native paint qualification claim.

- AC8: Multi-value badge display preserves selected order and unresolved value labels. Known enabled options remove through the shared state/save owner; pending/blocked/disabled/unresolved values cannot remove. Current-prop and attachment guards reject stale callbacks. Native hit/focus evidence stays separate from direct dispatch.

## Documentation

- AC1: [AppKit selection guide](../../../docs/app/search-selection.md#appkit-finite-option-selection) and [authored object-driver cases](../../../packages/ui/src/select.macos.mobile.test.tsrx). Tests unrun.
- AC2: The same guide/cases cover native-host guards, pending rollback and selection semantics.
- AC3: The guide/cases cover custom/default content and missing-option fallback; native anchor/search lifetime remains unqualified.
- AC4: [Target note](../parity/appkit-progress.md#appkit-finite-selection-mode-and-view-contract) records exact deferred commands and remaining native evidence.

- AC5: [AppKit keyboard guide](../../../docs/app/search-selection.md#use-selector-keys-on-appkit), [authored key-policy cases](../../../packages/ui/src/select-keyboard.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/select-keyboard.macos.tsrx). All unrun.
- AC6: The guide, appended inline-popup wiring case, [choice-helper cases](../../../packages/ui/src/tab-list.macos.mobile.test.tsrx) and [target note](../parity/appkit-progress.md#appkit-selector-keyboard-and-focus-ownership) record ownership/return intent and exact deferred checks. No native return result is claimed.

- AC7: [AppKit metadata guide](../../../docs/app/search-selection.md#appkit-selector-field-metadata), appended source cases and [target note](../parity/appkit-progress.md#appkit-selector-field-metadata-ownership). Tests unrun; native relationships/geometry/replay remain unqualified.


- AC8: [Badge guide](../../../docs/app/search-selection.md#remove-selected-values-on-appkit), appended [object-driver cases](../../../packages/ui/src/select.macos.mobile.test.tsrx), [maintained fixture](../../../examples/probes/select-keyboard.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-removable-multi-selection-badges). Cases and fixture remain unrun.
