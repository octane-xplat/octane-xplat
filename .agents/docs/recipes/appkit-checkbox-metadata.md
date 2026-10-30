# Label an AppKit checkbox

ID: appkit-checkbox-metadata
Targets: macos
Related APIs: Checkbox, Field

## Starting point

A form with standalone and Field-owned checkbox metadata, including mixed selection.

## Acceptance criteria

- AC1: Standalone labels/descriptions/status and label tooltip affordances render once, hidden text retains its accessible name, and enclosing Field owns metadata. Preserve class/style forms, ID ownership and host/state when metadata changes.
- AC2: Preserve scalar/mixed default and controlled values, request true from mixed, and block inherited disabled/read-only actions. Keep unsupported async saves and physical input/layout/accessibility qualification explicit.

- AC3: Checkbox reads current inherited blocking/callbacks, retains latest uncontrolled intent across requests before render, claims before consumer reentry, retires held callbacks on detach and releases on throw without undoing local state. Preserve controlled rejection and original default seed across controlled/uncontrolled transitions. Reconcile six authored object-driver cases and human-operated fixture controls without claiming async mixed rollback, native input/ref timing, focus/AX/layout or installed qualification.

## Documentation

- AC1: [Checkbox guide](../../../docs/app/components.md#checkbox-metadata-on-appkit) and [authored metadata/retention cases](../../../packages/ui/src/components/forms/checkbox.macos.mobile.test.tsrx). Existing tests are unrun; the one-prop tooltip correction received source/syntax review only, with native tooltip behavior unqualified.
- AC2: The same guide and tests describe state/Field gates; [target progress](../exploration.md#operational-evidence) records exact deferred commands and the unresolved changeAction/mixed rollback contract. No runtime qualification is claimed.

- AC3: [Current checkbox workflow](../../../docs/app/components.md#checkbox-metadata-on-appkit), [six new source cases](../../../packages/ui/src/components/forms/checkbox.macos.mobile.test.tsrx), [maintained fixture](../../../examples/probes/checkbox-list.macos.tsrx), [skill](../../skills/octane-xplat/references/primitives.md#appkit-checkbox-metadata), [feature note](../../../.changelog/appkit-checkbox-metadata.md) and [target note](../exploration.md#operational-evidence). All cases/probes remain UNRUN; the original fixture run hook still exercises only direct list-child selection.
