# Label an AppKit checkbox

ID: appkit-checkbox-metadata
Targets: macos
Related APIs: Checkbox, Field

## Starting point

A form with standalone and Field-owned checkbox metadata, including mixed selection.

## Acceptance criteria

- AC1: Standalone labels/descriptions/status render once, hidden text retains its accessible name, and enclosing Field owns metadata. Preserve class/style forms, ID ownership and host/state when metadata changes.
- AC2: Preserve scalar/mixed default and controlled values, request true from mixed, and block inherited disabled/read-only actions. Keep unsupported async saves and physical input/layout/accessibility qualification explicit.

## Documentation

- AC1: [Checkbox guide](../../../docs/app/components.md#checkbox-metadata-on-appkit) and [authored metadata/retention cases](../../../packages/ui/src/checkbox.macos.mobile.test.tsrx). Tests are unrun.
- AC2: The same guide and tests describe state/Field gates; [target progress](../parity/appkit-progress.md#appkit-checkbox-metadata) records exact deferred commands and the unresolved changeAction/mixed rollback contract. No runtime qualification is claimed.
