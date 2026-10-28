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
- AC4: Separate authored inline-popup source cases from actual NSPopover/native input/layout/AX evidence. Keep arrow/typeahead/focus, badges, presentation/ghost chrome and live-region gaps visible.

## Documentation

- AC1: [AppKit selection guide](../../../docs/app/search-selection.md#appkit-finite-option-selection) and [authored object-driver cases](../../../packages/ui/src/select.macos.mobile.test.tsrx). Tests unrun.
- AC2: The same guide/cases cover native-host guards, pending rollback and selection semantics.
- AC3: The guide/cases cover custom/default content and missing-option fallback; native anchor/search lifetime remains unqualified.
- AC4: [Target note](../parity/appkit-progress.md#appkit-finite-selection-mode-and-view-contract) records exact deferred commands and remaining native evidence.
