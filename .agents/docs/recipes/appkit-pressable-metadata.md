# Identify AppKit actions without changing their spoken names

ID: appkit-pressable-metadata
Targets: macos
Related APIs: Pressable, Button, testID, accessible

## Starting point

A native save action needs a stable testing identifier and a human-facing name.

## Acceptance criteria

- AC1: Concrete native hosts map testID to accessibilityIdentifier, independent of CSS id and spoken label. Updates retain the host; removal clears the identifier. Viewless nodes do not allocate a view/identifier.
- AC2: Pressable and Button forward testID/accessible, including changes/removal and busy/disabled transitions, without removing normal press callbacks solely because accessible is false.
- AC3: Retain source-only status. Do not claim native selector discovery/replay, VoiceOver, other composite forwarding or packaged support from these cases. Keep hitSlop/live-region/escape-bag gaps separate.

## Documentation

- AC1: [Native identifier contract](../../../packages/macos-renderer/README.md#native-test-identifiers) and [authored renderer update cases](../../../packages/macos-renderer/test/event-prop-clears.test.ts). Tests unrun.
- AC2: [AppKit source guide](../../../docs/testing/test-identifiers.md#appkit-source-implementation) and [authored object-driver cases](../../../packages/ui/src/pressable.macos.mobile.test.tsrx).
- AC3: [Target note](../parity/appkit-progress.md#pressable-identifiers-and-accessibility-element-forwarding) records scope and exact deferred commands.
